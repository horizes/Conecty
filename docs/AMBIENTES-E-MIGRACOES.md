# Ambientes, migrations e rollback

## Objetivo

Substituir o "colar SQL no editor" por migrations versionadas, com ambientes separados e histórico auditável.

## Estrutura

```
supabase/
  migrations/
    20261108120000_security_events.sql
    20261108121000_rate_limits.sql
  functions/
    _shared/audit.ts
    _shared/rate-limit.ts
    _shared/image-validate.ts
```

O repositório público guarda apenas schema e utilitários sem segredo. Credenciais, Vault e nomes de projetos ficam nos secrets do GitHub/Supabase.

## Primeira adoção (projeto que já existe)

1. Instale a CLI: `npm i -g supabase` (ou use `npx supabase`).
2. Autentique: `supabase login`.
3. Vincule o projeto de **staging** (nunca produção primeiro):
   `supabase link --project-ref <REF_STAGING>`
4. Gere o baseline do schema atual:
   `supabase db dump --schema public -f supabase/migrations/00000000000000_baseline.sql`
5. Marque o baseline como já aplicado:
   `supabase migration repair --status applied 00000000000000`
6. Aplique as novas migrations:
   `supabase db push --dry-run` e depois `supabase db push`.
7. Rode os testes de fumaça (login admin, login cliente, sync, exportação) e só então repita em produção.

> O baseline contém o schema atual, não dados. Nunca versione dump com dados de clientes.

## Fluxo contínuo

| Etapa | Regra |
| --- | --- |
| Desenvolvimento | `supabase migration new <descricao>`; revisar SQL; rodar `node ci/check-migrations.mjs .` |
| Pull request | CI valida manifesto, higiene e migrations; ninguém aplica SQL manualmente |
| Merge na `main` | Disparar **Actions → Aplicar migrations → staging** (workflow manual com environment protegido) |
| Produção | Promover a mesma migration em `production`, com janela e backup recente |
| Rollback | Migration compensatória (`forward-only`), nunca editar migration já aplicada |

## Secrets necessários (GitHub)

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD` (staging e produção em environments distintos)
- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_PROJECT_REF_PROD`

Use **Environments** do GitHub com revisores obrigatórios para produção.

## Regras de segurança para migrations

- Toda função `SECURITY DEFINER` precisa de `SET search_path`.
- `REVOKE` de `anon`/`authenticated` por padrão; libere apenas o necessário.
- Nada de `DROP TABLE`/`TRUNCATE` sem plano de backup e revisão.
- Retenção e exclusão devem ser funções explícitas (ver `docs/LGPD.md`).
- Migrations não podem conter chaves, tokens ou dados reais.

## Rollback do frontend

O `release-manifest.json` é a fonte da verdade. Para reverter:

1. Volte o commit anterior na `main` (o workflow republica o conjunto exato).
2. Não misture HTML de uma release com assets de outra.
3. Se a migration for incompatível com o frontend antigo, publique primeiro a migration compensatória.
