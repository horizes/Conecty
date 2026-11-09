# Auditoria de segurança

## O que já existe

A migration `supabase/migrations/20261108120000_security_events.sql` cria:

- `public.conecty_security_events` — eventos com ator, ação, entidade, cliente, IP, user-agent, severidade e metadados;
- `conecty_security_event(...)` — gravação por RPC (apenas `service_role`);
- `conecty_security_events_purge(dias)` — retenção (mínimo 30 dias, padrão 365);
- agendamento diário via `pg_cron` quando a extensão existe.

A tabela tem RLS **sem policies** e privilégios revogados de `anon`/`authenticated`. Ou seja: negada por padrão.

## Como integrar nas Edge Functions

```ts
import { recordSecurityEvent, requestContext, SECURITY_ACTIONS } from "../_shared/audit.ts";

const ctx = requestContext(req);

await recordSecurityEvent(admin, {
  action: SECURITY_ACTIONS.permissionChanged,
  severity: "warning",
  entity: "client",
  entityId: clientId,
  customerId: clientId,
  actorId: user.id,
  actorEmail: user.email,
  actorRole: role,
  metadata: { before: "consulta", after: "operador" },
}, ctx);
```

Regras:

- Grave **depois** de confirmar a operação (ou antes, com `severity: "warning"` e status `attempt`).
- Nunca envie senha, token, chave Omie ou valores financeiros em `metadata`.
- `sanitizeMetadata` remove chaves com `senha`, `token`, `secret`, `authorization`, `apikey`, `credential`, `chave`.
- Falha de auditoria não deve derrubar a operação, mas deve gerar log estruturado (`audit_write_error`).

## Eventos mínimos

| Grupo | Ações |
| --- | --- |
| Autenticação | `auth.login.success`, `auth.login.failure`, `auth.logout`, `auth.password.changed`, `auth.password.reset_requested`, `auth.session.revoked` |
| Administração | `admin.invite.created`, `admin.invite.accepted`, `admin.invite.revoked`, `admin.permission.changed`, `admin.user.created`, `admin.user.disabled`, `admin.client.created`, `admin.client.updated`, `admin.credentials.updated` |
| Dados | `data.export.generated`, `sync.started`, `sync.succeeded`, `sync.failed` |
| Segurança | `security.rate_limited`, `security.access_denied` |

## Consultas de alerta

```sql
-- Eventos críticos nas últimas 24h
select occurred_at, action, actor_email, entity, entity_id, metadata
from public.conecty_security_events
where severity = 'critical' and occurred_at > now() - interval '24 hours'
order by occurred_at desc;

-- Rajada de falhas de login por IP (15 min)
select ip, count(*) as falhas
from public.conecty_security_events
where action = 'auth.login.failure' and occurred_at > now() - interval '15 minutes'
group by ip
having count(*) >= 20
order by falhas desc;

-- Mudanças de permissão por ator (7 dias)
select actor_email, count(*) as mudancas
from public.conecty_security_events
where action = 'admin.permission.changed' and occurred_at > now() - interval '7 days'
group by actor_email
order by mudancas desc;
```

## Leitura pela administração

Não libere `SELECT` direto para `authenticated`. Exponha uma rota na `conecty-api`:

- valide `role` de proprietário/gestor;
- limite o período (máximo 90 dias por consulta);
- pagine por `occurred_at, id`;
- registre a própria consulta como `security.audit.viewed`.

## Retenção

- Padrão: 365 dias (`conecty_security_events_purge(365)`).
- Ajuste conforme `docs/LGPD.md` e o contrato com o cliente.
- Não guarde dados financeiros na trilha: use `entity_id`/`customer_id` e consulte a fonte original.
