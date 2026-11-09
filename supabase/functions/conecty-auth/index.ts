/**
 * BFF de login da Conecty (opcional, mas recomendado).
 *
 * Hoje o frontend chama o Supabase Auth direto. Esta função permite:
 *   - limite de tentativas por IP + e-mail (fail-closed);
 *   - CAPTCHA Turnstile (quando TURNSTILE_SECRET_KEY estiver configurada);
 *   - auditoria de sucesso/falha sem vazar se o e-mail existe;
 *   - um único ponto para migrar a sessão para cookie HttpOnly no futuro.
 *
 * Deploy:
 *   supabase functions deploy conecty-auth --no-verify-jwt
 *
 * Secrets:
 *   CONECTY_SITE_URL            (ex.: https://horizes.github.io/Conecty/)
 *   TURNSTILE_SECRET_KEY        (opcional)
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (injetados)
 *
 * Requer as migrations de auditoria e rate limit.
 * O frontend precisa passar a chamar /functions/v1/conecty-auth com
 * { email, password, captchaToken? } e usar a sessão devolvida.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { consumeRateLimit, rateLimitResponse, resetRateLimit, clientIp } from "../_shared/rate-limit.ts";
import { recordSecurityEvent, requestContext, SECURITY_ACTIONS } from "../_shared/audit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("CONECTY_SITE_URL") ?? "";

const auth = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = corsHeaders(origin);
  if (!cors) return json({ error: "Origem não autorizada", code: "FORBIDDEN" }, 403, {});

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido", code: "METHOD" }, 405, cors);

  let body: { email?: unknown; password?: unknown; captchaToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido", code: "VALIDATION" }, 400, cors);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 1024) {
    return json({ error: "Informe e-mail e senha válidos.", code: "VALIDATION" }, 400, cors);
  }

  const ctx = requestContext(req);

  const byIdentity = await consumeRateLimit(admin, {
    req,
    scope: "auth.login",
    identity: email,
    limit: 10,
    windowSeconds: 900,
    failClosed: true,
  });
  if (!byIdentity.allowed) {
    await recordSecurityEvent(admin, {
      action: SECURITY_ACTIONS.rateLimited,
      severity: "warning",
      entity: "auth",
      metadata: { scope: "auth.login" },
    }, ctx);
    return rateLimitResponse(byIdentity);
  }

  const byIp = await consumeRateLimit(admin, {
    req,
    scope: "auth.login.ip",
    identity: null,
    limit: 30,
    windowSeconds: 900,
    failClosed: true,
  });
  if (!byIp.allowed) {
    await recordSecurityEvent(admin, {
      action: SECURITY_ACTIONS.rateLimited,
      severity: "warning",
      entity: "auth",
      metadata: { scope: "auth.login.ip" },
    }, ctx);
    return rateLimitResponse(byIp);
  }

  if (!(await verifyTurnstile(captchaToken, clientIp(req)))) {
    await recordSecurityEvent(admin, {
      action: SECURITY_ACTIONS.loginFailure,
      severity: "warning",
      entity: "auth",
      actorEmail: email,
      metadata: { reason: "captcha" },
    }, ctx);
    return json({ error: "Não foi possível validar o desafio. Tente novamente.", code: "CAPTCHA" }, 400, cors);
  }

  const { data, error } = await auth.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    await recordSecurityEvent(admin, {
      action: SECURITY_ACTIONS.loginFailure,
      severity: "warning",
      entity: "auth",
      actorEmail: email,
      metadata: { status: error?.status ?? null },
    }, ctx);
    // Mensagem genérica: não confirma se o e-mail existe.
    return json({ error: "E-mail ou senha não conferem.", code: "INVALID_CREDENTIALS" }, 401, cors);
  }

  await resetRateLimit(admin, { req, scope: "auth.login", identity: email });
  await resetRateLimit(admin, { req, scope: "auth.login.ip", identity: null });

  await recordSecurityEvent(admin, {
    action: SECURITY_ACTIONS.loginSuccess,
    severity: "info",
    entity: "auth",
    actorId: data.session.user.id,
    actorEmail: data.session.user.email ?? email,
  }, ctx);

  return json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: { id: data.session.user.id, email: data.session.user.email },
  }, 200, cors);
});

function corsHeaders(origin: string): Record<string, string> | null {
  const expected = safeOrigin(SITE_URL);
  if (!expected) return null;
  if (origin && origin !== expected) return null;
  return {
    "access-control-allow-origin": expected,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, content-type",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

function safeOrigin(value: string): string | null {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true; // CAPTCHA opcional até a chave ser configurada
  if (!token) return false;

  const form = new URLSearchParams({ secret, response: token, remoteip: ip });
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

function json(payload: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
