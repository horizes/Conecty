> Guia histórico. As configurações de segurança e o uso atual estão em [Operação R11](OPERACAO-E-RECUPERACAO-R11.md). Não reative cadastro público.

> **Atualização R7:** para logo do cliente, horário configurável e gestão de usuários, siga [LOGO-E-HORARIO.md](LOGO-E-HORARIO.md). Use o novo SQL no lugar do agendamento fixo das 13h.

> **Versão atual R6:** para atualizar o projeto existente com sincronização às 13h, filtros administrativos e apps separados, siga **ATUALIZACAO-DIARIA-E-APPS.md**. As etapas abaixo descrevem a preparação inicial; a ativação da R6 exige também o guia novo.

# Conecty: GitHub Pages + Supabase para testes

O site permanece em **https://horizes.github.io/Conecty/**. O Supabase fornece somente login, banco e a função que consulta o Omie. Este ambiente é destinado a testes com contas e dados de teste.

Você fará a configuração inicial uma vez. Depois, cadastra empresas, informa App Key/App Secret e abre os dashboards pelo próprio site. Não é necessário criar um arquivo por empresa.

**Se o projeto já está instalado:** siga **ATUALIZAR-ACESSOS.md** para substituir a função existente e criar/vincular os usuários pelo admin. A nova versão separa o perfil administrativo do perfil de cliente, com vínculo exclusivo a uma empresa.

## Arquivos desta entrega

| Arquivo | Destino |
|---|---|
| **Conecty-GitHub-Pages.zip** | Extraia e envie os arquivos à raiz do repositório Conecty. |
| **Conecty-Supabase-Backend.zip** | Extraia para instalar o banco e a função no Supabase. Não precisa enviá-lo ao GitHub. |
| **Conecty-Codigo-Fonte.zip** | Projeto editável completo, para futuras alterações. |

O pacote do site contém `index.html` (admin), `admin.html` (atalho), `login-cliente.html` (entrada do cliente), `cliente.html` (dashboard individual), `cliente-demo.html` (visual ilustrativo), `conecty-config.js`, ícones, imagem social e este guia. O pacote do servidor contém `INSTALAR-BANCO.sql`, `index.ts` (função já compilada), `GERAR-CHAVE.html` e `config.toml` (opcional para quem usa CLI).

## 1. Criar o projeto gratuito no Supabase

1. Acesse **https://supabase.com/dashboard** e crie/entre na sua conta.
2. Crie uma organização no plano **Free**, se ainda não houver uma.
3. Clique em **New project** e escolha um nome, como **conecty-testes**.
4. Defina a senha do banco solicitada e guarde-a no seu gerenciador. Ela não vai no GitHub nem no painel Conecty.
5. Escolha a região e mantenha a **Data API** habilitada; a função usa a API REST do banco.
6. Aguarde o projeto ficar pronto.

O plano gratuito tem cotas e pausa projetos após uma semana de inatividade. Se isso ocorrer, reative o projeto antes do próximo teste. [Plano Free](https://supabase.com/pricing).

## 2. Instalar a tabela

1. Extraia **Conecty-Supabase-Backend.zip**.
2. No Supabase, abra **SQL Editor → New query**.
3. Abra o arquivo **INSTALAR-BANCO.sql** em um editor e copie todo o conteúdo.
4. Cole no SQL Editor e clique em **Run**.
5. Confira que a tabela **public.conecty_clients** foi criada.

O script habilita RLS e remove o acesso direto de usuários anônimos e autenticados à tabela. Somente a função do servidor, após conferir o acesso, lê ou grava os registros. A coluna `omie_credentials` guarda o par Omie criptografado.

## 3. Criar as contas de teste

No Supabase, abra **Authentication → Users → Add user → Create new user**.

Crie duas contas, com senhas exclusivas para o teste:

- **admin@conecty.test** — administração Conecty.
- **cliente@conecty.test** — visualização da empresa de teste.

Marque **Auto Confirm User**, ou a opção equivalente de confirmar o e-mail ao criar a conta. Esses são endereços fictícios: este fluxo usa senha e não depende de enviar e-mails.

Em **Authentication → Sign In / Providers**, mantenha o provedor **Email** habilitado. Desative o cadastro público de novos usuários (Allow new users to sign up), pois as contas do piloto serão criadas manualmente por você.

Você pode usar outros e-mails de teste. Nesse caso, use os mesmos valores na configuração do administrador e na lista de acesso da empresa. A função exige e-mail confirmado no Supabase e não confia em e-mails enviados pelo navegador.

A conta administrativa precisa constar em `CONECTY_ADMIN_EMAILS`. A conta de cliente também precisa ser vinculada pelo admin em **três pontos → Usuário de acesso → Vincular conta existente**, depois de criar o cadastro da empresa. Informar apenas o e-mail na lista não concede o perfil de cliente. Você pode criar somente o administrador nesta etapa e usar **Criar novo usuário** no painel para os demais acessos.

## 4. Configurar três segredos do servidor

No Supabase, abra **Edge Functions → Secrets** e adicione:

| Nome | Valor |
|---|---|
| `CONECTY_ADMIN_EMAILS` | `admin@conecty.test` — ou os administradores escolhidos, separados por vírgula. |
| `CONECTY_SITE_URL` | `https://horizes.github.io/Conecty/` |
| `CONECTY_CREDENTIALS_KEY` | A chave de proteção gerada abaixo. Não é uma chave do Omie. |

Para gerar a chave de proteção:

1. Abra **GERAR-CHAVE.html**, do pacote do servidor, no navegador do seu computador.
2. Clique em **Gerar chave de proteção** e depois em **Copiar chave**.
3. Cole o valor no segredo **CONECTY_CREDENTIALS_KEY**, no Supabase, e salve.
4. Preserve esse segredo. Ele deve continuar o mesmo enquanto houver conexões gravadas.

O gerador funciona localmente, sem enviar ou salvar o valor. A chave de 32 bytes em base64 protege as credenciais com AES-GCM de 256 bits, vinculadas ao identificador da empresa. Não envie o valor ao GitHub, em links, no chat ou no arquivo de configuração pública. Se excluir/trocar esse segredo sem migrar os registros, precisará informar novamente as chaves Omie de cada empresa.

As variáveis padrão de acesso ao projeto (`SUPABASE_URL`, chaves públicas e chaves de servidor) são fornecidas pelo ambiente hospedado do Supabase. A função aceita os nomes atuais e os legados. Não é necessário copiar a Secret key/service_role para o site. [Segredos das funções](https://supabase.com/docs/guides/functions/secrets).

## 5. Publicar a função conecty-api

1. Abra **Edge Functions → Deploy a new function → Via Editor**.
2. Escolha o nome **conecty-api**, exatamente assim.
3. No editor, abra o arquivo principal `index.ts`.
4. Substitua todo o exemplo pelo conteúdo completo do **index.ts** fornecido no pacote do servidor. Ele já está compilado e contém as dependências da aplicação; você não precisa instalar npm ou montar imports.
5. Mantenha a verificação de JWT da plataforma habilitada (padrão). O arquivo `config.toml` também declara `verify_jwt = true` para publicação por CLI.
6. Clique em **Deploy function** e aguarde a confirmação.

A função ficará em `https://SEU-PROJETO.supabase.co/functions/v1/conecty-api`. Além da verificação da plataforma, ela consulta o Supabase Auth a cada requisição para verificar a sessão e o e-mail confirmado; a administração ainda exige a lista `CONECTY_ADMIN_EMAILS`.

Ela aceita chamadas do navegador com origem **https://horizes.github.io**. A origem não inclui `/Conecty/`; o endereço completo continua configurado em `CONECTY_SITE_URL`. Isso habilita o navegador a chamar o servidor externo. A autorização dos dados depende da sessão e das permissões, e não apenas dessa regra de origem.

Instruções oficiais: [Editor de funções](https://supabase.com/docs/guides/functions/quickstart-dashboard), [autenticação](https://supabase.com/docs/guides/functions/auth), [CORS](https://supabase.com/docs/guides/functions/cors).

## 6. Atualizar o GitHub Pages

1. Extraia **Conecty-GitHub-Pages.zip**.
2. Abra o repositório **horizes/Conecty** no GitHub.
3. Em **Add file → Upload files**, envie os arquivos extraídos para a raiz do repositório e confirme o commit. `index.html` precisa ficar diretamente na raiz; não envie apenas o ZIP.
4. Preserve o workflow `.github/workflows/static.yml` que já publica o site. Aguarde a execução de publicação ficar verde em **Actions**.
5. Abra **https://horizes.github.io/Conecty/** e atualize a página.

Se a publicação da adaptação já tiver sido aplicada nesta conversa, a tela inicial mostrará **Conecte seu painel**. Nesse caso, você pode seguir direto para a configuração abaixo. O Supabase ainda precisa ser instalado por você nas etapas anteriores.

## 7. Conectar o site ao seu projeto

No Supabase, use **Connect** ou **Settings → API Keys / Data API** para localizar:

- **Project URL:** `https://seu-projeto.supabase.co`.
- **Publishable key:** começa com `sb_publishable_`. A chave legada **anon** também é aceita.

Na tela **Conecte seu painel**, no GitHub Pages:

1. Cole a Project URL e a Publishable key.
2. Clique em **Salvar conexão neste navegador**.
3. Clique em **Baixar conecty-config.js**.
4. Envie esse arquivo gerado à raiz de **horizes/Conecty**, substituindo o arquivo vazio que acompanha o pacote.
5. Aguarde a publicação e atualize o site. A tela de login estará disponível para qualquer navegador com a mesma configuração pública.

Você pode clicar em **Continuar para o login** antes do upload para testar somente no navegador atual. A configuração local não é compartilhada: para testar a conta do cliente em outra aba privada/navegador, publique também o arquivo gerado.

**O arquivo é público por definição.** Ele contém apenas a URL e a Publishable/anon key. O configurador rejeita Secret key e service_role. App Key/App Secret do Omie só entram no cadastro após o login. [Tipos de chaves Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## 8. Cadastrar a empresa e informar o Omie

1. Entre no site como **admin@conecty.test**, com a senha criada na etapa 3.
2. Clique em **Novo cliente**.
3. Use um nome de teste e confira o identificador, por exemplo **empresa-teste**.
4. Em **E-mails autorizados a acessar**, informe **cliente@conecty.test**.
5. Em **Conexão Omie**, preencha App Key e App Secret de um aplicativo Omie usado para testes.
6. Selecione **Ativo** e clique em **Criar cliente**.
7. Clique em **Abrir painel** para consultar o Omie. Compare os valores com o sistema no mesmo período e conta.

Para disponibilizar o login ao cliente, na linha da empresa abra **três pontos → Usuário de acesso**. Escolha **Criar novo usuário**, informe e-mail exclusivo e senha inicial de pelo menos oito caracteres e salve. Se a conta foi criada manualmente na etapa 3, use **Vincular conta existente**, que preserva sua senha. O servidor grava o perfil de cliente em metadados protegidos e o associa a uma única empresa. Contas administrativas ou já vinculadas a outra empresa são recusadas.

O botão **Abrir painel** na administração usa uma conferência administrativa. A conta administrativa é recusada no login comum do cliente, e contas de cliente são recusadas no login administrativo.

Você pode salvar sem chaves e conectar depois por **Editar cadastro → Conexão Omie**. Ao editar, ambos os campos vazios preservam a conexão atual. Para substituí-la, preencha os dois campos. Cadastro e chaves são gravados juntos; uma versão antiga do cadastro não sobrescreve uma edição mais recente.

**Omie configurado** indica que o par foi armazenado, não que já foi validado pelo Omie. A consulta acontece ao abrir o dashboard. Se a consulta falhar, o painel mostra erro, sem substituir os dados por valores ilustrativos.

No Omie, as chaves são obtidas por um administrador em **Meus Aplicativos → engrenagem da empresa → Resumo do App → Chave de Integração (API)**. [Instruções oficiais](https://ajuda.omie.com.br/pt-BR/articles/499061-obtendo-a-chave-de-acesso-para-integracoes-de-api).

## 9. Testar o acesso individual

O login exclusivo do cliente fica em **https://horizes.github.io/Conecty/login-cliente.html**. Ele informa e-mail e senha e segue para o dashboard autorizado. O login da administração continua na raiz do site. Você pode enviar o login geral ao cliente sem precisar informar o identificador da empresa; o servidor escolhe o cadastro ativo autorizado para o e-mail da sessão. O portal mostra somente uma empresa por acesso.

Para direcionar explicitamente à empresa, use o link individual abaixo. Também é aceito `login-cliente.html?empresa=empresa-teste`; após o login, esse identificador é preservado e a autorização é conferida no servidor. O campo da URL nunca concede acesso sozinho.

1. Na administração, use **Copiar link do cliente**. O endereço terá o formato `https://horizes.github.io/Conecty/cliente.html?empresa=empresa-teste`.
2. Abra o link em outro navegador ou janela privada.
3. Entre como **cliente@conecty.test**.
4. Confira que aparecem somente o perfil e os dados dessa empresa.
5. Tente abrir a administração ou alterar `empresa=` para um cadastro não autorizado: a API deve recusar o acesso.
6. No admin, pause o cadastro e confirme que novas consultas ficam bloqueadas. Uma página aberta pode manter os dados que já carregou.

O formulário usa a conta criada ou vinculada em **admin → três pontos → Usuário de acesso**. As contas criadas por esse formulário aparecem em **Supabase → Authentication → Users**, com e-mail confirmado. Informar um e-mail na lista de acesso não substitui o vínculo exclusivo. O link geral fica no botão **Link de acesso do cliente**, dentro da administração, sem atalho no login normal. A página do cliente não oferece cadastro público ou edição das configurações do servidor. Se a configuração pública ainda estiver ausente, ela informa que o acesso está sendo preparado pela Conecty.

Também confira no Supabase que a tabela não pode ser lida com a chave pública ou uma sessão comum pela Data API. O script da etapa 2 retira esses privilégios; nunca libere leitura pública da coluna de credenciais.

## Como o teste funciona

- O site, as telas e os gráficos permanecem no GitHub Pages.
- A senha de teste é enviada diretamente ao Supabase Auth. A sessão fica em `sessionStorage`, nesta aba; a senha não é persistida pela aplicação.
- A função verifica a sessão, o administrador e os e-mails autorizados antes de abrir as credenciais.
- Cada usuário de cliente é vinculado a uma única empresa por `app_metadata`, que somente o servidor administra. Metadados editáveis pelo usuário são ignorados. A permissão é conferida antes de abrir as telas e novamente em cada API; um e-mail repetido em outra lista não amplia o acesso do cliente.
- As chaves Omie digitadas no formulário são enviadas por HTTPS ao servidor e criptografadas no banco. Não são retornadas ao navegador, copiadas em links ou gravadas em localStorage.
- A função usa o par Omie somente em consultas de leitura à API oficial. Alterações e baixas continuam no Omie.
- A integração lê os últimos seis meses completos e o mês atual; títulos em aberto incluem vencimentos até 60 dias à frente. Na R6, a coleta é agendada uma vez por dia às 13h (Brasília), inclusive com o portal fechado. As páginas leem o resultado privado salvo. Contas e categorias são selecionadas no administrador e filtradas no servidor. Siga **ATUALIZACAO-DIARIA-E-APPS.md** para ativar a R6.
- A DFC organiza automaticamente as categorias usando os grupos e descrições padrão do Omie e regras de nomes exatos. O cliente apenas consulta. A Conecty revisa exceções em **três pontos → Revisar DFC**, com regras compartilhadas por empresa no Supabase. Veja **DFC-AUTOMATICA.md**. Períodos sem cobertura ou detalhamento tributário em revisão mostram **n.d.**; o resultado de caixa inclui todos os movimentos e não equivale a lucro contábil ou saldo bancário.

## Se não funcionar

| Situação | Confira |
|---|---|
| Ainda aparece o visual antigo | Aguarde Actions concluir e atualize a página; confira se os novos HTMLs estão na raiz. |
| Volta ao configurador em outro navegador | Publique o `conecty-config.js` gerado. A configuração local só vale no navegador atual. |
| Configuração rejeitada | Use Project URL e Publishable/anon key; nenhuma chave Secret/service_role no site. |
| Não foi possível entrar | Conta criada no mesmo projeto, senha correta, provedor Email habilitado e usuário confirmado. Confira se o projeto Free está pausado. |
| Sessão expirada / 401 | Entre novamente. Confirme que está usando o mesmo projeto no site e na função. Não desative o login para contornar o erro. |
| Administração restrita | E-mail da conta precisa constar exatamente em `CONECTY_ADMIN_EMAILS`. |
| Erro ao consultar o servidor / CORS | Função **conecty-api** publicada, URL correta e `CONECTY_SITE_URL` configurado com o endereço do GitHub Pages. |
| Confira instalação do banco | Rode o SQL no mesmo projeto e mantenha a Data API habilitada. |
| Campos Omie desativados | Confira `CONECTY_CREDENTIALS_KEY` no Supabase: 32 bytes em base64 gerados pelo helper. |
| “Use uma conexão HTTPS” mesmo no site HTTPS | Atualize **Edge Functions → conecty-api → Code → index.ts** com a função deste pacote e clique em **Deploy updates**. A função reconhece o HTTPS externo informado pelo gateway Supabase, mesmo quando o endereço interno é HTTP. Preserve os Secrets e cadastre as chaves novamente após a publicação. |
| Não foi possível atualizar dados financeiros | Revise aplicativo, chaves, permissões e limites do Omie. Confira também Logs da função sem inserir ou publicar credenciais. |
| Nenhuma empresa disponível | Cadastro Ativo, conexão gravada e e-mail autorizado; para testar o cliente, use a conta definida no cadastro. |

## Estado de validação da entrega

Foram executados testes automatizados de login/renovação, roteamento para a função externa, CORS, autorização, preservação e criptografia de chaves, conflito de edição e isolamento de empresas. Os testes do adaptador PostgREST usam respostas simuladas; a instalação SQL, RLS, a função e o login no projeto hospedado devem ser conferidos nas etapas acima. Nenhuma conta Supabase ou Omie real foi configurada nesta entrega. Não foram usadas credenciais reais.

O ambiente é de testes. A operação com clientes reais exige uma revisão própria de hospedagem, acesso e continuidade. [Limites do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
