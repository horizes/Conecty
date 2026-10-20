# Atualizar os acessos Conecty

Esta atualização mantém o site no GitHub Pages e usa seu projeto Supabase existente.

## 1. Atualizar a função uma vez

1. Extraia **Conecty-Supabase-Backend.zip**.
2. No Supabase, entre no projeto que já está conectado ao site.
3. Abra **Edge Functions → conecty-api → Code** (ou **Edit code**).
4. Selecione o arquivo principal **index.ts** no editor.
5. Substitua todo o conteúdo pelo **index.ts** deste pacote e clique em **Deploy updates / Deploy function**.
6. Mantenha a verificação JWT habilitada e use os segredos já configurados, incluindo `CONECTY_ADMIN_EMAILS` e `CONECTY_CREDENTIALS_KEY`.

Use a tabela e os registros existentes. A atualização dos perfis não exige um novo projeto ou outra tabela SQL. A função utiliza a chave de servidor fornecida automaticamente pelo ambiente Supabase para criar e vincular usuários.

## 2. Entrar como administrador

Abra **https://horizes.github.io/Conecty/** e entre com sua conta administrativa. O e-mail precisa estar em **Edge Functions → Secrets → CONECTY_ADMIN_EMAILS**.

O login da administração verifica a permissão no servidor antes de abrir o diretório. Uma conta de cliente é recusada nessa entrada.

## 3. Criar um usuário para cada empresa

1. Na lista do admin, encontre a empresa e abra **três pontos → Usuário de acesso**.
2. Escolha **Criar novo usuário**.
3. Informe um e-mail exclusivo para aquele cliente e uma senha inicial de pelo menos oito caracteres.
4. Clique em **Criar usuário**. O servidor cria a conta com e-mail confirmado e a vincula somente à empresa escolhida. O e-mail é incluído automaticamente na lista de acesso do cadastro.
5. Confira que a empresa está **Ativa** e com o Omie configurado para carregar os dados.

Para uma conta que já existe em **Authentication → Users**, escolha **Vincular conta existente** e informe o e-mail confirmado. A senha atual é preservada. Esse vínculo é obrigatório também para contas criadas manualmente antes desta atualização.

Uma conta administrativa não pode virar cliente por esse formulário. Um usuário já vinculado a outra empresa é recusado; use outro e-mail. A senha inicial é enviada por HTTPS somente para o cadastro no Supabase Auth, sem ser gravada no cadastro financeiro ou devolvida pela API.

Se o cadastro da empresa foi atualizado antes de uma falha no Auth, feche a janela, atualize a lista e tente novamente após conferir a conta no Supabase. O e-mail autorizado por si só não concede o perfil de cliente.

## 4. Copiar o link dentro do admin

No topo do painel, clique em **Link de acesso do cliente → Copiar link**. Envie o endereço e as orientações de login ao responsável. O login normal não contém o atalho “Sou cliente”.

O endereço é **https://horizes.github.io/Conecty/login-cliente.html**. O cliente entra com a conta que você acabou de criar ou vincular. O servidor encontra a empresa do usuário automaticamente.

Em **três pontos → Copiar link do cliente**, você também pode copiar o endereço individual da empresa.

## 5. Conferir a separação

- Conta administrativa: entra no admin. O botão **Abrir painel** oferece uma conferência administrativa do dashboard.
- Conta de cliente: entra no portal do cliente e consulta somente a empresa vinculada.
- Conta sem vínculo: não recebe dados financeiros.
- Alterar `empresa=` ou `visao=adm` no endereço não concede permissão.
- Pausar a empresa ou remover seu e-mail autorizado bloqueia novas consultas.

Use uma janela privada para testar a conta do cliente. A página já aberta pode manter informações que carregou antes da pausa; confira uma nova consulta.

Enquanto a função antiga ainda estiver publicada, o admin continua verificando sua permissão pela API administrativa existente. O portal do cliente aguarda a versão nova para validar o vínculo exclusivo. O formulário de usuários informa quando a função precisa ser atualizada.

## Validação

Os testes automatizados cobrem perfis, tentativa de falsificar metadados, acesso a outra empresa, criação e vínculo de contas, senha omitida nas respostas e falhas no Auth. Usam respostas simuladas. A publicação da função e o teste com suas contas hospedadas devem ser conferidos no Supabase.
