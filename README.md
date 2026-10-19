# Conecty — Meu painel financeiro

Prévia visual da sua empresa, com valores ilustrativos. Inclui gráficos interativos, consulta de lançamentos, filtros de período e conta, além da seção Planilha DFC.

Na DFC, as categorias são montadas a partir dos lançamentos. O botão Personalizar DFC permite criar e ordenar grupos, alterar nomes e classificar receitas, pagamentos, impostos e retiradas. Ajustes da prévia são salvos somente neste navegador. Consulte DFC-PERSONALIZACAO.md.

A demonstração funciona como página estática e não consulta o Omie. Nenhum valor financeiro da planilha de referência foi incorporado. A integração real depende do servidor.

## Administração dos clientes

Abra **admin.html** para ver a central da Conecty: listar, buscar e filtrar clientes, criar/editar cadastros, ativar/pausar e abrir a prévia individual. Os registros iniciais são ilustrativos. Os cadastros da demonstração ficam apenas neste navegador; essa página estática não tem autenticação nem acesso a dados reais. O cliente continua usando index.html.

Na aplicação com servidor, a área fica em **/admin**, tem autenticação administrativa e grava os cadastros no D1. O portal do cliente não contém a listagem. Consulte **PASSO-A-PASSO-OMIE.md** para preparar o servidor e conectar uma conta real.

Abra index.html ou publique no GitHub Pages seguindo COMO-PUBLICAR.md. Aplicação, fonte e logotipo estão incorporados no HTML. Os ícones e a imagem de compartilhamento também acompanham o pacote.

O endereço de compartilhamento já está configurado para https://horizes.github.io/Conecty/. Envie todos os arquivos do pacote à raiz do repositório Conecty. O favicon usa o símbolo original da marca; a imagem de prévia é conecty-compartilhar-v1.png. As tags Open Graph e Twitter estão no HTML inicial, sem depender de JavaScript. A visualização social só pode ser conferida depois que esses arquivos estiverem publicados.

Identidade visual: Conecty Gestão. Fonte Manrope sob SIL Open Font License; licença incluída no HTML e em Manrope-OFL.txt.
