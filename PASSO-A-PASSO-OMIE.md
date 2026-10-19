# Conectar clientes ao Omie pelo painel Conecty

O cadastro agora inclui **Conexão Omie**, com campos **App Key** e **App Secret**, em **Novo cliente** e **Editar cadastro**. Depois da implantação inicial do servidor, a equipe cadastra clientes e troca as chaves pelo próprio site, sem editar arquivos ou republicar a aplicação a cada cliente.

A página principal é a administração. Cada cliente recebe somente seu endereço individual e acessa os próprios dados.

## 1. Ativação inicial da aplicação — uma vez

O endereço https://horizes.github.io/Conecty/ é a demonstração estática. Nela, os campos de chaves ficam desativados. O GitHub Pages hospeda os arquivos do visual; a integração real utiliza uma aplicação com servidor, banco e autenticação. [Como funciona o GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

O projeto **Conecty-Codigo-Fonte.zip** contém o servidor compatível com Sites/Cloudflare Workers. Essa infraestrutura ainda precisa ser implantada; enviar o pacote estático para o GitHub não a ativa.

Na implantação:

1. Configure o login hospedado do Sites e confira a audiência permitida para a equipe e os clientes. A aplicação confere o e-mail autenticado; autorizar um e-mail no cadastro não altera a audiência da hospedagem.
2. Vincule um banco D1 com o nome **DB**. A declaração já está no projeto.
3. Aplique as migrações de `drizzle/` em ordem: `0000_wide_wolfpack.sql` cria os cadastros e `0001_dazzling_the_hand.sql` adiciona o armazenamento criptografado. Em uma atualização, aplique apenas as migrações ainda pendentes, usando o controle de migrações da implantação.
4. Configure **CONECTY_ADMIN_EMAILS** com os e-mails da Conecty autorizados, separados por vírgula.
5. Crie **CONECTY_CREDENTIALS_KEY** como **segredo do servidor**: uma chave aleatória de 32 bytes, codificada em base64. Use um gerenciador de segredos ou um gerador criptográfico confiável. Guarde uma cópia em local seguro. Ela protege as conexões de todos os clientes; não é a App Key do Omie. Não a inclua no código, no repositório, no HTML ou no chat.
6. Configure **CONECTY_SITE_URL** com o endereço público completo do portal, terminado em `/`, e publique a aplicação com HTTPS.
7. Entre no endereço principal com uma conta autorizada da equipe. Abra **Novo cliente**: os campos Omie devem estar habilitados. Se aparecer “conexão segura precisa ser ativada”, confira o segredo, o banco, as migrações e o HTTPS.

No fluxo Sites, configure segredos pelas ferramentas nativas da plataforma. Em uma implantação própria compatível, a Cloudflare documenta o armazenamento de [secrets de Workers](https://developers.cloudflare.com/workers/configuration/secrets/). Valores secretos não devem entrar em arquivos versionados ou variáveis públicas do frontend.

Esta versão preserva o login Sites/ChatGPT. Se hospedar diretamente fora desse ambiente, adapte e valide `app/chatgpt-auth.ts` com autenticação equivalente antes de liberar os dados. Cabeçalhos de identidade enviados pelo visitante não podem ser considerados autenticação.

## 2. Obter as chaves do aplicativo da empresa

No Omie, entre com um usuário administrador. Abra **Meus Aplicativos → engrenagem da empresa → Resumo do App → Chave de Integração (API)**. Copie a **App Key** e use **Exibir** para consultar o **App Secret**. Também é possível consultar os aplicativos no [Portal do Desenvolvedor Omie](https://developer.omie.com.br/). [Instruções oficiais do Omie](https://ajuda.omie.com.br/pt-BR/articles/499061-obtendo-a-chave-de-acesso-para-integracoes-de-api).

Use o par do aplicativo correspondente ao cliente. Para conectar, basta obter as chaves existentes; não é necessário gerar novas chaves no Omie.

## 3. Cadastrar e conectar pelo site — para cada cliente

1. Entre na administração e clique em **Novo cliente**.
2. Informe nome, segmento, responsável, contato e meta mensal.
3. Confira o identificador, por exemplo **cliente-piloto**. Ele forma o endereço `/empresa/cliente-piloto`.
4. Preencha os **e-mails autorizados a acessar**. O e-mail de contato só terá acesso se também estiver nessa lista.
5. Em **Conexão Omie**, cole **App Key** e **App Secret**.
6. Mantenha **Em preparação** enquanto confere o cadastro e clique em **Criar cliente**. Cadastro e chaves são salvos juntos no servidor.
7. Edite o cadastro e selecione **Ativo** quando estiver pronto para consultar. Para ativar, é obrigatório ter ao menos um e-mail autorizado.
8. Clique em **Abrir painel** e confira os recebimentos, pagamentos, categorias, contas e resultado de caixa contra o Omie, no mesmo período e regime.
9. Depois da conferência, use **Copiar link do cliente** para obter o endereço individual e compartilhe com o responsável. Ele entra com seu e-mail autorizado.

Também é possível criar o cadastro sem chaves e conectar depois por **Editar cadastro → Conexão Omie**, ou pela ação **Conectar Omie**. Não é necessário criar outro arquivo HTML nem alterar JSON para cada nova empresa.

**Omie configurado / Chaves cadastradas** significa que o par foi armazenado, e não que o Omie já confirmou sua validade. A consulta real ocorre ao abrir o dashboard. Credenciais incorretas ou limites da API geram erro legível; nenhum dado financeiro fictício substitui uma consulta real com falha.

## 4. Alterar a conexão ou os dados do cliente

- **Editar cadastro:** atualiza identidade, meta, responsável, contato e e-mails autorizados.
- **Substituir chaves Omie:** abra a edição e preencha os dois campos com o novo par. Deixar ambos vazios mantém as chaves atuais. Informar apenas um deles impede o salvamento. As chaves salvas não são exibidas nem devolvidas ao navegador.
- **Pausar acesso:** bloqueia novas consultas no servidor. Uma página já aberta pode manter os dados que carregou anteriormente.
- **Ativar cliente:** libera consultas de um cadastro com e-mail autorizado e conexão configurada.
- **Atualizar lista:** consulta os cadastros compartilhados pela equipe.

As chaves são transmitidas por HTTPS e armazenadas com AES-GCM de 256 bits no D1, vinculadas ao identificador do cliente. A chave de criptografia fica em um segredo separado do servidor. Os campos existem temporariamente na memória do formulário enquanto são preenchidos e são limpos ao fechar ou salvar com sucesso; não são gravados em localStorage, links, exportações ou HTML. Somente administradores autorizados podem cadastrar ou substituir o par.

Não substitua `CONECTY_CREDENTIALS_KEY` sem um plano de migração: as conexões existentes dependem dela. Se ela for perdida ou trocada sem migração, será necessário cadastrar novamente o par Omie de cada cliente. Mantenha backups e o segredo com acesso restrito.

Cadastros antigos em **OMIE_COMPANIES_JSON** continuam compatíveis. Para esses identificadores, o par gravado pelo formulário tem precedência sobre o par antigo. Não é necessário criar ou manter essa variável para clientes novos. Mapeamentos avançados de categorias/DFC já existentes são preservados. A organização visual da DFC continua personalizável no próprio dashboard; preferências do visitante são locais ao navegador.

## 5. Conferência dos dados

O conector lê os últimos seis meses completos e o mês atual, com cache de até cinco minutos. Substituir as credenciais impede reutilizar o cache da conexão anterior. Títulos em aberto são separados dos movimentos realizados. Meses sem cobertura na DFC aparecem como **n.d.**. Resultado de caixa não equivale a lucro contábil ou saldo bancário.

## Se não funcionar

| Situação | Verificação |
| --- | --- |
| Campos Omie desativados no GitHub | É a demonstração. Implantar o servidor para conectar dados reais. |
| Administração restrita | Conferir o e-mail autenticado em `CONECTY_ADMIN_EMAILS`. |
| Banco sem configuração / migrações | Vincular `DB` e aplicar as migrações pendentes da implantação. |
| Conexão segura não ativada | Conferir HTTPS e o segredo `CONECTY_CREDENTIALS_KEY`: 32 bytes aleatórios em base64. |
| Omie pendente | Editar o cliente, preencher as duas chaves e salvar. |
| Não foi possível abrir a conexão | Conferir a chave de criptografia da implantação; se foi perdida, cadastrar o par Omie novamente. |
| Informe as chaves juntas | Preencher ambos os campos, ou apagar ambos para manter a conexão atual. |
| Empresa indisponível | Conferir situação Ativo, vínculo Omie e e-mail autorizado. |
| Omie não concluiu a consulta | Conferir aplicativo, par de chaves, permissões e limites da API. |
| Cadastro alterado por outra pessoa | Recarregar a lista antes de salvar novamente. |
| Valores diferentes | Comparar conta, período, regime de caixa, transferências e rateios. |

Foram verificados criptografia, adulteração, isolamento entre clientes, persistência atômica em SQLite, API, tipos e build com dados de teste. O runtime Workers local não iniciou neste Windows; a aplicação das migrações no D1 remoto e a consulta com uma conta Omie real ainda dependem da implantação. Nenhuma credencial real foi utilizada.
