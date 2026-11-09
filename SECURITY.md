# Política de segurança

## Como reportar

Não abra issue pública para vulnerabilidades. Use **Security → Report a vulnerability** neste repositório (aviso privado do GitHub). Se o recurso não estiver disponível, entre em contato direto com o responsável pelo projeto pelo canal privado já usado na operação.

Inclua, se possível:

- versão publicada (`release` do `release-manifest.json`);
- página ou função afetada (admin, cliente, cadastro, API, sincronização);
- passos para reproduzir e impacto esperado;
- evidências sem dados de terceiros (não envie senhas, tokens, chaves Omie ou dados financeiros reais).

## Escopo

Este repositório contém **apenas o frontend público** publicado no GitHub Pages. Fazem parte do escopo:

- HTML, bundles JS/CSS e manifestos publicados;
- `conecty-config.js` (URL e chave publicável do Supabase);
- cabeçalhos/CSP, service workers e fluxo de sessão no navegador;
- pipeline de publicação em `.github/workflows/`.

Não fazem parte deste repositório: banco de dados, Edge Functions, Vault e credenciais Omie (projeto-fonte privado e Supabase). Falhas nesses componentes também podem ser reportadas pelo mesmo canal; o tratamento é feito no ambiente privado.

## O que já é esperado

- Nunca versione `service_role`, `sb_secret_*`, senhas, tokens do Vault ou credenciais Omie.
- O CI bloqueia chaves de servidor e arquivos privados no conteúdo publicado.
- Dados financeiros e credenciais não devem ser gravados em cache do service worker nem em logs.

## Prazo de resposta

| Etapa | Prazo alvo |
| --- | --- |
| Confirmação de recebimento | 3 dias úteis |
| Triagem e classificação | 7 dias úteis |
| Correção de falha crítica | 30 dias |
| Correção de falha média/baixa | próximo ciclo de release |

## Divulgação

Pedimos que a divulgação pública aguarde a correção e um prazo combinado. Não há recompensa financeira; créditos podem ser dados com autorização.
