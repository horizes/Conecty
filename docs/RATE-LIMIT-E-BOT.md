# Limite de tentativas e anti-bot

## Situação atual

- O login do frontend chama **direto** o Supabase Auth (`/auth/v1/token?grant_type=password`). Não passa pela `conecty-api`.
- Por isso, limite por aplicação e CAPTCHA no login **não podem** ser impostos só no frontend.
- A `conecty-api` (Edge Function) pode e deve limitar as próprias rotas.

## O que já está pronto

Migration `20261108121000_rate_limits.sql`:

- tabela privada `conecty_rate_limits` (bucket, janela, contador);
- `conecty_rate_limit_hit(bucket, janela_segundos, limite)` — incremento atômico;
- `conecty_rate_limit_reset(bucket)` — chamar após login bem-sucedido;
- `conecty_rate_limits_purge(intervalo)` — limpeza diária via `pg_cron`;
- RLS sem policies; apenas `service_role`.

Helper `supabase/functions/_shared/rate-limit.ts`:

- bucket = SHA-256 de `escopo + IP + identidade` (não grava e-mail em claro);
- IP via `cf-connecting-ip`, `x-real-ip` ou `x-forwarded-for`;
- resposta `429` com `Retry-After` e `Cache-Control: no-store`.

## Integração

```ts
import { consumeRateLimit, rateLimitResponse, resetRateLimit } from "../_shared/rate-limit.ts";

const gate = await consumeRateLimit(admin, {
  req,
  scope: "auth.login",
  identity: email,
  limit: 10,
  windowSeconds: 900,
  failClosed: true,
});
if (!gate.allowed) return rateLimitResponse(gate);

// ... autentica ...

await resetRateLimit(admin, { req, scope: "auth.login", identity: email });
```

## Limites sugeridos

| Rota | Limite | Janela | Chave |
| --- | --- | --- | --- |
| Login | 10 | 15 min | IP + e-mail |
| Login (IP) | 30 | 15 min | IP |
| Recuperação de senha | 5 | 1 h | IP + e-mail |
| Recuperação (IP) | 20 | 1 h | IP |
| Cadastro/aceite de convite | 5 | 1 h | IP |
| Escrita administrativa | 120 | 1 min | usuário |
| Leitura autenticada | 600 | 1 min | usuário |
| Requisições por IP | 1200 | 5 min | IP |

Ajuste com dados reais. Limite baixo demais gera suporte; alto demais não protege.

## Login: o caminho correto

Para ter limite + CAPTCHA + auditoria no login, coloque um **BFF** na frente:

1. O frontend chama o BFF (`conecty-auth`) em vez do Supabase Auth direto.
2. A função aplica rate limit, valida Turnstile e chama `signInWithPassword`.
3. Registra `auth.login.success`/`auth.login.failure` na auditoria.
4. Devolve a sessão (idealmente via cookie `HttpOnly`, ver `docs/PENDENCIAS-SEGURANCA.md`).

O BFF já está implementado em `supabase/functions/conecty-auth/index.ts`:

```bash
supabase functions deploy conecty-auth --no-verify-jwt
supabase secrets set CONECTY_SITE_URL=https://horizes.github.io/Conecty/
# opcional: supabase secrets set TURNSTILE_SECRET_KEY=...
```

Enquanto o frontend não chamar `POST /functions/v1/conecty-auth`, o arquivo fica pronto mas inativo.
Sem esse passo, o limite do login depende do Supabase Auth e do Cloudflare.

## Cloudflare (quando houver domínio próprio)

- Ative o proxy laranja para o domínio do site.
- WAF → Rate limiting rules:
  - `/login*`, `/cadastro*`, `/instalar*`: 20 req/min por IP, ação `managed challenge`.
  - `/api/*`: 120 req/min por IP, ação `block` acima de 300/min.
- Bot Fight Mode + Turnstile no formulário de login (requer mudança no frontend compilado).
- Não coloque o domínio do Supabase atrás do Cloudflare sem seguir a documentação oficial de custom domain.

## Supabase Auth

- Revise os limites do projeto no dashboard (e-mail, OTP, signups).
- Desative cadastro público; convites são o único caminho.
- Ative confirmação de e-mail e proteção de senha vazada quando o plano permitir.
- Monitore `auth.audit_log_entries` (quando disponível) junto da auditoria própria.

## Resposta e monitoramento

- Sempre `429` com `Retry-After`; nunca `500` para excesso de tentativas.
- Registre `security.rate_limited` com escopo e IP (sem e-mail em claro).
- Alerta quando um IP acumular 20+ falhas de login em 15 min.
