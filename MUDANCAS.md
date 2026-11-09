# Mudanças aplicadas — release R41 (2026-11-08)

## Resumo

| Métrica | Antes | Depois |
| --- | --- | --- |
| Arquivos no repositório | 174 | 105 |
| Tamanho do repositório | 10,56 MB | 1,96 MB |
| Arquivos em `assets/` | 126 | 37 |
| Arquivos publicados (manifesto) | 81 | 80 |
| Artefatos proibidos (ZIP/PDF) | 2 | 0 |

Todos os checks passam:

```bash
node ci/verify-public.mjs .
node ci/check-hygiene.mjs .
node ci/check-migrations.mjs .
```

## Situação de cada item

| # | Item | Status | Entregue |
| --- | --- | --- | --- |
| 4 | MFA | **Parcial** — decisão e resíduos documentados; remoção exige rebuild do projeto-fonte | `docs/MFA.md` com checklist e guarda de regressão |
| 5 | Rate limit / anti-bot | **Pronto para integrar** | migration `20261108121000_rate_limits.sql`, `_shared/rate-limit.ts`, BFF `conecty-auth/index.ts`, `docs/RATE-LIMIT-E-BOT.md` |
| 6 | Auditoria | **Pronto para integrar** | migration `20261108120000_security_events.sql`, `_shared/audit.ts`, `docs/AUDITORIA.md` |
| 8 | Supply chain e segredos | **Feito no repositório** | ZIP/PDF removidos, 89 assets órfãos removidos, Actions fixadas por SHA, Dependabot, `SECURITY.md`, PR checks, `ci/check-hygiene.mjs` |
| 9 | Migrations e ambientes | **Feito (estrutura)** | `supabase/migrations/`, lint `ci/check-migrations.mjs`, workflow manual `migrations.yml`, `docs/AMBIENTES-E-MIGRACOES.md` |
| 10 | Upload de logo | **Pronto para integrar** | `_shared/image-validate.ts`, `docs/UPLOAD-DE-LOGO.md` |
| 12 | LGPD | **Feito (documentos)** | `docs/LGPD.md` (inventário, retenção, direitos, checklist) e `docs/privacidade.html` (modelo) |
| 13 | Ajustes menores | **Feito no que era possível** | demo `noindex`, CSP `img-src` sem domínio fixo, canonical/manifest relativos; pendências em `docs/PENDENCIAS-SEGURANCA.md` |

## O que mudou no repositório

### Removido

- `Conecty-GitHub-Pages.zip` (build R11, 0,84 MB) — contradizia o manifesto R40.
- `manual-interno.pdf` (2,71 MB) — estava **publicado** pelo manifesto.
- 89 assets órfãos em `assets/` (builds antigos, incluindo 29 `start-*.js` fora do manifesto).
- Referências ao ZIP na documentação (agora o pacote é artifact do CI).

### Adicionado

- `.gitignore`, `SECURITY.md`, `.github/dependabot.yml`, `.github/workflows/migrations.yml`.
- `ci/check-hygiene.mjs`, `ci/check-migrations.mjs`, `ci/update-manifest.mjs`.
- `supabase/migrations/*.sql`, `supabase/functions/_shared/*.ts` e o BFF `supabase/functions/conecty-auth/index.ts`.
- `docs/AMBIENTES-E-MIGRACOES.md`, `docs/AUDITORIA.md`, `docs/RATE-LIMIT-E-BOT.md`,
  `docs/UPLOAD-DE-LOGO.md`, `docs/LGPD.md`, `docs/MFA.md`,
  `docs/PENDENCIAS-SEGURANCA.md`, `docs/privacidade.html`.
- Este `MUDANCAS.md`.

### Alterado

- `.github/workflows/static.yml`: pinagem por SHA, validação em pull request,
  job de publicação separado, checagem de higiene e de migrations.
- 13 páginas HTML:
  - `img-src` não fixa mais `horizes.github.io` e libera o Storage do projeto;
  - `manifest` e `canonical` relativos (funcionam em domínio próprio);
  - `cliente-demo.html` com `noindex, nofollow`;
  - canonicals corrigidos (`admin/painel.html` e `cliente-demo.html` apontavam para `cliente.html`).
- `release-manifest.json` recalculado e promovido para `R41-2026-11-08`.
- `README.md` alinhado à release real.

## O que ainda depende de você

### 1. Aplicar as migrations (item 6 e 9)

No projeto Supabase de **staging**:

```bash
supabase link --project-ref <REF_STAGING>
supabase db push --dry-run
supabase db push
```

Depois valide login, permissões, sync e exportação. Só então repita em produção.
Detalhes em `docs/AMBIENTES-E-MIGRACOES.md`.

### 2. Instrumentar as Edge Functions (itens 5, 6 e 10)

- Importe `_shared/audit.ts` e grave os eventos listados em `docs/AUDITORIA.md`.
- Importe `_shared/rate-limit.ts` nas rotas da `conecty-api`.
- Para o login, o caminho completo é mover a chamada para um BFF na `conecty-api`
  (hoje o frontend chama o Supabase Auth direto e não passa pelo limite).
- No upload de logo, use `validateLogoUpload` + reencode + bucket privado.

### 3. Remover o MFA residual (item 4)

Depende do projeto-fonte privado e de um novo build. O checklist está em `docs/MFA.md`.
Não edite o bundle minificado.

### 4. LGPD (item 12)

Preencha `docs/privacidade.html` (razão social, CNPJ, endereço, encarregado),
revise com jurídico, mova para a raiz como `privacidade.html`, inclua no manifesto
e linke no login/cadastro.

### 5. Publicar esta release

O repositório local não tem Git instalado. Três caminhos:

1. **Recomendado:** instalar Git (`winget install --id Git.Git -e`) ou GitHub Desktop,
   copiar esta pasta sobre o clone e commitar/push.
2. **Sem instalar nada:** usar o upload de pasta do GitHub Desktop/web — mas as 89
   exclusões precisam ser feitas (o CI de higiene falha enquanto os órfãos existirem).
3. **API do GitHub:** posso gerar um script de sincronização, mas ele exige um token
   com permissão de `contents: write` que só você deve fornecer.

Os arquivos removidos foram preservados em `..\_removidos\` (ZIP e PDF), fora do repositório.

## Como atualizar o manifesto depois de editar HTML/CSS/JS

```bash
node ci/update-manifest.mjs . R42-2026-11-10
```

Sem isso, o CI falha porque `bytes`/`sha256` não batem.

## Reversão

- **Frontend:** volte o commit anterior na `main`; o workflow republica o manifesto exato.
- **Banco:** as migrations são aditivas (novas tabelas/funções). Rollback = migration
  compensatória; não edite migration já aplicada.
- **Arquivos removidos:** estão em `..\_removidos\` e no histórico do Git (se o commit for feito).

## Observações

- `docs/` e `supabase/` **não** são publicados: ficam fora do `release-manifest.json`.
- O `manual-interno.pdf` estava sendo servido pelo GitHub Pages; agora não está mais.
- Os links de documentação ainda usam `https://horizes.github.io/Conecty/`.
  Ao migrar para domínio próprio, atualize-os e os `og:url`/`og:image` no build.
