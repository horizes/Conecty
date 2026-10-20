# DFC automática para o cliente

O cliente abre a DFC já organizada. A tela do cliente oferece consulta, filtros e exportação; a classificação fica com a Conecty.

## Organização automática

1. A integração consulta as categorias do aplicativo Omie da própria empresa, incluindo código, grupo superior e descrição padrão quando disponíveis.
2. Grupos reconhecidos no Omie orientam a organização. Categorias conhecidas também são reconhecidas por nomes exatos e variações cadastradas, respeitando entrada ou saída.
3. Um grupo próprio sem correspondência é mantido com seu nome original. Sem grupo suficiente na origem, o movimento aparece em **Outras entradas** ou **Outras saídas**.
4. Categorias novas entram automaticamente, sem cadastro pelo cliente. Categorias homônimas com códigos diferentes ficam separadas; o código mantém a regra mesmo se o nome mudar no Omie.
5. Uma correção explícita da Conecty prevalece sobre a regra automática para aquela empresa.

Esta organização é gerencial e não altera lançamentos nem categorias no Omie. Não utiliza um serviço externo de IA ou promete interpretar corretamente descrições ambíguas. A separação de impostos permanece em revisão quando faltam informações confiáveis; os movimentos continuam integralmente no resultado de caixa.

Referências oficiais: [categorias e grupos superiores](https://ajuda.omie.com.br/pt-BR/articles/9278001-cadastrando-e-alterando-categorias-via-api), [campos do retorno de ListarCategorias](https://ajuda.omie.com.br/pt-BR/articles/7854327-exemplos-de-query-no-power-bi-com-paginacao).

## Revisar pela Conecty

1. Entre na administração e, na empresa ativa com Omie configurado, abra **três pontos → Revisar DFC**.
2. A DFC abre na conferência administrativa. Clique em **Revisar classificação**.
3. Confira categorias marcadas **Revisão Conecty**. Escolha o grupo adequado, ajuste o tratamento do grupo (pagamento, imposto ou retirada) e, quando o grupo sugerido já estiver correto, use **Confirmar este grupo**.
4. Clique em **Salvar para o cliente**. A configuração é gravada no cadastro da empresa no Supabase e vale para seus usuários em qualquer navegador. O cliente recebe o ajuste na próxima consulta ou pelo botão de atualizar.
5. Se aparecer conflito de versão, reabra a revisão para carregar o cadastro mais recente.

O cliente não recebe botões para classificar. Quando necessário, vê apenas que o detalhamento de impostos está em revisão pela Conecty. A revisão administrativa é verificada no servidor: mudar o endereço para a visão administrativa não concede permissão.

Os ajustes antigos que existiam somente no armazenamento do navegador deixam de controlar a DFC. Use a revisão administrativa para cadastrar uma regra compartilhada.

## Atualizar o ambiente

1. No Supabase, abra **Edge Functions → conecty-api → Code / Edit code**.
2. Substitua todo o **index.ts** pelo arquivo deste pacote e clique em **Deploy updates**. Preserve os Secrets existentes. A atualização inclui a correção de HTTPS.
3. Publique os HTMLs atualizados do pacote GitHub Pages, preservando o `conecty-config.js` configurado com seu projeto. Os cadastros usam a tabela já existente, sem migração SQL.
4. Atualize o site e confira a DFC pela administração e pelo login do cliente. O cache Omie pode durar até cinco minutos.

Os testes automatizados cobrem regras, grupos Omie, rateios, códigos homônimos, renomeações, valores desconhecidos, conciliação, persistência por empresa, conflito de versão e bloqueio de alterações por clientes. As APIs são simuladas nos testes; a publicação e a conferência dos dados reais devem ser feitas no ambiente hospedado.
