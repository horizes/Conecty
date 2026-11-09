-- Trilha de auditoria de segurança da Conecty.
-- Aplicar com `supabase db push` (nunca colar direto em produção sem revisão).
-- A tabela é privada: RLS sem policies e privilégios apenas para service_role.
-- Edge Functions gravam por `conecty_security_event(...)` ou insert direto com service_role.

create table if not exists public.conecty_security_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text not null,
  entity text,
  entity_id text,
  customer_id text,
  ip inet,
  user_agent text,
  severity text not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  constraint conecty_security_events_severity_chk check (severity in ('info', 'warning', 'critical')),
  constraint conecty_security_events_action_chk check (char_length(action) between 3 and 80),
  constraint conecty_security_events_metadata_chk check (pg_column_size(metadata) <= 8192)
);

create index if not exists conecty_security_events_occurred_idx
  on public.conecty_security_events (occurred_at desc);
create index if not exists conecty_security_events_actor_idx
  on public.conecty_security_events (actor_id, occurred_at desc);
create index if not exists conecty_security_events_customer_idx
  on public.conecty_security_events (customer_id, occurred_at desc);
create index if not exists conecty_security_events_action_idx
  on public.conecty_security_events (action, occurred_at desc);

alter table public.conecty_security_events enable row level security;
revoke all on public.conecty_security_events from anon, authenticated;
grant select, insert on public.conecty_security_events to service_role;
grant usage, select on sequence public.conecty_security_events_id_seq to service_role;

create or replace function public.conecty_security_event(
  p_action text,
  p_entity text default null,
  p_entity_id text default null,
  p_customer_id text default null,
  p_severity text default 'info',
  p_metadata jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_actor_email text default null,
  p_actor_role text default null,
  p_ip inet default null,
  p_user_agent text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
begin
  insert into public.conecty_security_events (
    actor_id, actor_email, actor_role, action, entity, entity_id,
    customer_id, ip, user_agent, severity, metadata
  ) values (
    p_actor_id,
    nullif(left(p_actor_email, 320), ''),
    nullif(left(p_actor_role, 40), ''),
    left(p_action, 80),
    nullif(left(p_entity, 80), ''),
    nullif(left(p_entity_id, 120), ''),
    nullif(left(p_customer_id, 120), ''),
    p_ip,
    nullif(left(p_user_agent, 500), ''),
    coalesce(p_severity, 'info'),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.conecty_security_event(text, text, text, text, text, jsonb, uuid, text, text, inet, text)
  from public, anon, authenticated;
grant execute on function public.conecty_security_event(text, text, text, text, text, jsonb, uuid, text, text, inet, text)
  to service_role;

-- Retenção: mínimo de 30 dias; padrão alinhado à política de privacidade (365 dias).
create or replace function public.conecty_security_events_purge(p_days integer default 365)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_days is null or p_days < 30 then
    raise exception 'retenção mínima de 30 dias';
  end if;

  delete from public.conecty_security_events
   where occurred_at < now() - make_interval(days => p_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.conecty_security_events_purge(integer) from public, anon, authenticated;
grant execute on function public.conecty_security_events_purge(integer) to service_role;

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'conecty-security-events-purge',
      '20 3 * * *',
      $cron$select public.conecty_security_events_purge(365)$cron$
    );
  end if;
end;
$do$;

comment on table public.conecty_security_events is
  'Auditoria de eventos de segurança. Privada; leitura por service_role/Edge Function.';
comment on function public.conecty_security_event(text, text, text, text, text, jsonb, uuid, text, text, inet, text) is
  'Grava um evento de auditoria. Chamar apenas de Edge Function com service_role.';
comment on function public.conecty_security_events_purge(integer) is
  'Remove eventos mais antigos que p_days (mínimo 30). Agendada por pg_cron quando disponível.';
