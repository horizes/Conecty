# Publicar a demonstração Conecty no GitHub Pages

1. Crie um repositório público no GitHub, por exemplo `conecty-dashboard-demo`.
2. Extraia o ZIP. Em **Add file > Upload files**, envie os arquivos extraídos para a raiz do repositório e confirme o commit. O arquivo `index.html` deve ficar diretamente na raiz, sem outra pasta em volta. Não envie apenas o ZIP.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione o branch `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Aguarde a publicação. O link aparece na própria seção Pages.

O `index.html` abre a administração da Conecty. O dashboard individual fica na página extra `cliente.html`. Ambos incorporam aplicação, fonte, logotipo e licença. Não há instalação, build, npm ou configuração de variáveis para esta prévia.

## Atualizar o endereço já publicado

Este pacote está configurado para **https://horizes.github.io/Conecty/**. No repositório **Conecty**, envie e substitua todos os arquivos extraídos, incluindo `index.html`, `favicon.ico`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png` e `conecty-compartilhar-v1.png`. Não envie apenas o HTML ou o ZIP.

O favicon usa o símbolo da logo original da Conecty. A imagem de compartilhamento usa a marca sobre fundo escuro, em 1200 × 630 pixels. As tags Open Graph e Twitter apontam para a imagem por HTTPS no endereço público e ficam diretamente no HTML inicial. Não há informações de clientes na imagem de compartilhamento.

A imagem precisa estar publicada em `https://horizes.github.io/Conecty/conecty-compartilhar-v1.png`. Arquivos locais `file://` não geram prévias públicas. A atualização da visualização em conversas depende também do cache da rede social; se necessário, teste um novo envio com `https://horizes.github.io/Conecty/?v=logo1` depois da publicação.

Cada dashboard de cliente mostra somente o próprio perfil, com valores ilustrativos. Não se conecta ao Omie. A integração com dados reais requer o servidor da aplicação, fora do GitHub Pages.

## Central da Conecty

A página principal `https://horizes.github.io/Conecty/` abre a administração. O arquivo **admin.html** continua como atalho para a mesma central. Permite criar e editar cadastros ilustrativos neste navegador e ativar/pausar seu estado.

Os botões **Ver prévia** e **Copiar link** apontam para `cliente.html#perfil=...`, com um perfil individual por cliente. O painel abre separado da administração. Novos cadastros de demonstração usam a mesma página extra com seu próprio link. O perfil não contém e-mails de acesso nem credenciais; seus valores são ilustrativos.

No GitHub Pages, esta central é uma demonstração pública e não autentica administradores. Para produção, a raiz `/` e o atalho `/admin` da aplicação com servidor têm autenticação e banco; os clientes acessam `/empresa/id`, conforme **PASSO-A-PASSO-OMIE.md**.

Documento oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
