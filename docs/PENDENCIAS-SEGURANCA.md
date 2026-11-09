# Pendências de segurança que dependem do projeto-fonte ou da infraestrutura

## 1. Notificações push

Risco: vazar valores, nomes de clientes ou saldos na tela bloqueada.

Regras:

- payload genérico: "Sua atualização financeira está pronta"; nunca valor, saldo ou nome de empresa;
- deep link apenas para a tela, sem tokens na URL;
- valide o endpoint da subscription no servidor e vincule ao `user_id`/`customer_id`;
- revogue subscriptions no logout/revogação de dispositivo;
- rotacione as chaves VAPID e guarde a privada em Functions Secrets;
- registre `notifications.sent`/`failed` na auditoria (sem conteúdo).

## 2. Erros de Edge Function

Nunca devolva `error.stack`, mensagem crua do Postgres ou nome de tabela/coluna.

Padrão:

```ts
type ApiError = { code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "INTERNAL"; message: string; requestId: string };
```

- `requestId` aleatório por requisição, devolvido ao cliente e gravado no log;
- detalhes técnicos apenas no log do servidor;
- mensagens de validação sem revelar se um e-mail existe.

## 3. Sessão e cabeçalhos

O modelo atual guarda a sessão em `localStorage`/`sessionStorage` (ver `OPERACAO-E-RECUPERACAO-R11.md`). Para fechar o risco de XSS:

- mover login/refresh para um BFF (Edge Function) e usar cookie `HttpOnly; Secure; SameSite=Lax`;
- CSRF token nas rotas de escrita se usar cookie;
- `frame-ancestors`, HSTS, `X-Content-Type-Options`, `Permissions-Policy` e COOP via Cloudflare/Cloudflare Pages;
- reduzir a validade absoluta da sessão "Manter conectado" ou exigir reautenticação para ações críticas.

## 4. CSP `style-src 'unsafe-inline'`

Necessário para estilos inline do React. O risco é baixo porque `script-src 'self'` está fechado, mas o ideal é:

- extrair CSS para arquivos e usar nonce/hash quando o build permitir;
- manter `object-src 'none'`, `base-uri 'none'` e `connect-src` restrito (já configurados);
- nunca adicionar `unsafe-eval` nem CDNs externas de script.

## 5. Domínio e metadados sociais

- `og:url`, `og:image` e `twitter:*` ainda usam `https://horizes.github.io/Conecty/`.
- Ao definir domínio próprio, substitua no build (não há como fazer isso em runtime no HTML estático).
- Canonical e `manifest` já são relativos na R41.

## 6. Painéis sem `noindex`

`cliente.html`, `admin/painel.html` e `cliente/painel.html` não têm `noindex`. Se não devem ser indexados, adicione a meta no build. A demo já está `noindex` na R41.

## 7. Rotação de segredos

| Segredo | Onde | Frequência sugerida |
| --- | --- | --- |
| `CONECTY_SYNC_TOKEN` | Vault + Functions Secrets | 90 dias ou em caso de suspeita |
| `CONECTY_CREDENTIALS_KEY` | Functions Secrets | anual, com re-criptografia planejada |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions Secrets | em incidente |
| VAPID privada | Functions Secrets | em incidente |
| Tokens do GitHub Actions | GitHub | via Dependabot/rotação |

Registre cada rotação na auditoria e teste a sincronização depois.

## 8. Dependências e supply chain

- Actions fixadas por SHA na R41;
- Dependabot semanal para GitHub Actions;
- no projeto-fonte, habilite `npm audit`, lockfile e revisão de PR;
- gere SBOM antes de releases comerciais.

## 9. Exportações

- O guia R11 afirma que CSV neutraliza fórmulas e Excel grava texto como texto. Mantenha teste automatizado para `=`, `+`, `-`, `@`, tab e CR.
- Registre `data.export.generated` com tipo, período e cliente (sem conteúdo).
- Considere marca d'água/limite de linhas para exportações grandes.
