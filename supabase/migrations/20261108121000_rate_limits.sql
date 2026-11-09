-- Limite de tentativas atômico por bucket (login, cadastro, recuperação, API).
-- O bucket deve combinar rota + IP + e-mail normalizado para evitar bypass trivial.
-- Tabela privada: somente service_role acessa.

create table if not exists public.conecty_rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint conecty_rate_limits_hits_chk check (hits >= 0),
  constraint conecty_rate_limits_bucket_chk check (char_length(bucket) between 1 and 200)
);

create index if not exists conecty_rate_limits_updated_idx
  on public.conecty_rate_limits (updated_at);

alter table public.conecty_rate_limits enable row level security;
revoke all on public.conecty_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.conecty_rate_limits to service_role;

create or replace function public.conecty_rate_limit_hit(
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.conecty_rate_limits%rowtype;
begin
  if p_bucket is null or char_length(p_bucket) < 1 then
    raise exception 'bucket obrigatório';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'janela inválida';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception 'limite inválido';
  end if;

  insert into public.conecty_rate_limits as rl (bucket, window_start, hits, updated_at)
  values (left(p_bucket, 200), v_now, 1, v_now)
  on conflict (bucket) do update
    set window_start = case
          when rl.window_start + make_interval(secs => p_window_seconds) <= v_now then v_now
          else rl.window_start
        end,
        hits = case
          when rl.window_start + make_interval(secs => p_window_seconds) <= v_now then 1
          else rl.hits + 1
        end,
        updated_at = v_now
  returning * into v_row;

  return query
    select
      v_row.hits <= p_limit,
      greatest(p_limit - v_row.hits, 0),
      v_row.window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.conecty_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.conecty_rate_limit_hit(text, integer, integer) to service_role;

create or replace function public.conecty_rate_limit_reset(p_bucket text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.conecty_rate_limits where bucket = left(p_bucket, 200);
end;
$$;

revoke all on function public.conecty_rate_limit_reset(text) from public, anon, authenticated;
grant execute on function public.conecty_rate_limit_reset(text) to service_role;

create or replace function public.conecty_rate_limits_purge(p_older_than interval default interval '1 day')
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_older_than is null or p_older_than < interval '10 minutes' then
    raise exception 'janela de limpeza mínima de 10 minutos';
  end if;

  delete from public.conecty_rate_limits where updated_at < now() - p_older_than;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.conecty_rate_limits_purge(interval) from public, anon, authenticated;
grant execute on function public.conecty_rate_limits_purge(interval) to service_role;

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'conecty-rate-limits-purge',
      '40 3 * * *',
      $cron$select public.conecty_rate_limits_purge(interval '1 day')$cron$
    );
  end if;
end;
$do$;

comment on table public.conecty_rate_limits is
  'Contadores de limite de tentativas por bucket (rota + IP + identidade). Privada.';
comment on function public.conecty_rate_limit_hit(text, integer, integer) is
  'Incrementa o bucket de forma atômica e informa se a requisição está dentro do limite.';
