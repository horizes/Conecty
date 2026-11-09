/**
 * Limite de tentativas para Edge Functions da Conecty.
 *
 * Requer a migration `20261108121000_rate_limits.sql`.
 * O bucket é um hash SHA-256 de rota + IP + identidade, para não gravar
 * e-mail em claro na tabela de contadores.
 *
 * Uso típico no início da função:
 *
 *   const gate = await consumeRateLimit(admin, {
 *     req, scope: "auth.login", identity: email,
 *     limit: 10, windowSeconds: 900,
 *   });
 *   if (!gate.allowed) return rateLimitResponse(gate);
 */

type RpcClient = {
  rpc(
    name: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export type RateLimitOptions = {
  req: Request;
  /** Ex.: "auth.login", "auth.recover", "admin.invite". */
  scope: string;
  /** E-mail, id do usuário ou outro identificador estável (opcional). */
  identity?: string | null;
  limit: number;
  windowSeconds: number;
  /**
   * Em falha do banco, bloqueia em vez de liberar.
   * Use `true` em login/recuperação; `false` em rotas de leitura.
   */
  failClosed?: boolean;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number; resetAt: string };

export function clientIp(req: Request): string {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0],
  ];
  for (const value of candidates) {
    const ip = value?.trim();
    if (ip) return ip.slice(0, 60);
  }
  return "unknown";
}

export async function consumeRateLimit(
  admin: RpcClient,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const bucket = await bucketKey(options.scope, clientIp(options.req), options.identity);

  const { data, error } = await admin.rpc("conecty_rate_limit_hit", {
    p_bucket: bucket,
    p_window_seconds: options.windowSeconds,
    p_limit: options.limit,
  });

  if (error) {
    console.error(
      JSON.stringify({ event: "rate_limit_error", scope: options.scope, message: error.message }),
    );
    if (options.failClosed) {
      return { allowed: false, retryAfter: 30, resetAt: new Date(Date.now() + 30_000).toISOString() };
    }
    return { allowed: true, remaining: options.limit };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    console.error(JSON.stringify({ event: "rate_limit_empty", scope: options.scope }));
    return { allowed: true, remaining: options.limit };
  }

  const result = row as { allowed?: boolean; remaining?: number; reset_at?: string };
  if (result.allowed === false) {
    const resetAt = result.reset_at ? new Date(result.reset_at) : new Date(Date.now() + options.windowSeconds * 1000);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
      resetAt: resetAt.toISOString(),
    };
  }

  return { allowed: true, remaining: Number(result.remaining ?? 0) };
}

export async function resetRateLimit(
  admin: RpcClient,
  options: Pick<RateLimitOptions, "req" | "scope" | "identity">,
): Promise<void> {
  const bucket = await bucketKey(options.scope, clientIp(options.req), options.identity);
  const { error } = await admin.rpc("conecty_rate_limit_reset", { p_bucket: bucket });
  if (error) {
    console.error(JSON.stringify({ event: "rate_limit_reset_error", scope: options.scope, message: error.message }));
  }
}

export function rateLimitResponse(
  result: Extract<RateLimitResult, { allowed: false }>,
  message = "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
): Response {
  return new Response(
    JSON.stringify({ error: message, code: "RATE_LIMITED", retryAfter: result.retryAfter }),
    {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(result.retryAfter),
      },
    },
  );
}

async function bucketKey(scope: string, ip: string, identity?: string | null): Promise<string> {
  const normalizedIdentity = identity ? identity.trim().toLowerCase().slice(0, 320) : "";
  const raw = `${scope}|${ip}|${normalizedIdentity}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
