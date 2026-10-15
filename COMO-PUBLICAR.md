# Publicar a demonstração Conecty no GitHub Pages

1. Crie um repositório público no GitHub, por exemplo `conecty-dashboard-demo`.
2. Extraia o ZIP. Em **Add file > Upload files**, envie os arquivos extraídos para a raiz do repositório e confirme o commit. O arquivo `index.html` deve ficar diretamente na raiz, sem outra pasta em volta. Não envie apenas o ZIP.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione o branch `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Aguarde a publicação. O link aparece na própria seção Pages.

O `index.html` funciona sozinho: aplicação, fonte, logotipo e licença estão incorporados. Os outros arquivos documentam a demonstração. Não há instalação, build, npm ou configuração de variáveis para esta prévia.

O painel é exclusivo da sua empresa e usa valores ilustrativos. Não se conecta ao Omie. A integração com dados reais requer o servidor da aplicação, fora do GitHub Pages.

Documento oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
