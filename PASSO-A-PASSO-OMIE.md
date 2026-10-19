# Conectar a primeira conta real do Omie

A página principal **index.html** abre a administração da Conecty. **admin.html** permanece como atalho. Os clientes usam a página extra **cliente.html**, por links individuais gerados na administração. Na aplicação com servidor, a administração fica em **/** e **/admin**, e os clientes usam **/empresa/id**. Ele concentra lista, busca, criação e edição de clientes, ativação/pausa e abertura do dashboard individual.

## 1. Preparar a aplicação com servidor

O endereço `https://horizes.github.io/Conecty/` continua sendo a demonstração estática. O GitHub Pages hospeda HTML, CSS e JavaScript; as credenciais Omie, os cadastros compartilhados e as verificações de acesso deste projeto são executados no servidor. [Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Para usar dados reais, publique o projeto de **Conecty-Codigo-Fonte.zip** em um ambiente compatível com o servidor atual: Sites/Cloudflare Workers, com autenticação do Sites e banco D1 vinculado como **DB**. A implantação desse servidor ainda precisa ser realizada; subir o ZIP de demonstração ao GitHub não ativa essa integração.

No servidor:

- Vincule o banco D1 à aplicação com o nome `DB`. A declaração já está no projeto.
- Aplique a migração `drizzle/0000_wide_wolfpack.sql`, que cria a tabela de cadastros. No fluxo oficial do Sites, as migrações acompanham a publicação. A migração foi conferida em SQLite; a aplicação em um banco remoto ainda depende da implantação.
- Configure `CONECTY_ADMIN_EMAILS` com os e-mails autorizados da Conecty, separados por vírgula. Eles podem entrar em `/admin`.
- Configure `CONECTY_SITE_URL` com o endereço completo do portal, terminado em `/`, para os ícones e a imagem de compartilhamento usarem a URL correta.
- Confira se a audiência da hospedagem permite o login das contas da equipe e dos clientes previstos. Adicionar um e-mail ao cadastro não altera automaticamente a audiência da plataforma.

Esta versão utiliza o login fornecido pelo Sites/ChatGPT. O e-mail autenticado é conferido pelo servidor. Se optar por hospedagem direta fora desse ambiente, será necessário integrar uma autenticação equivalente e adaptar `app/chatgpt-auth.ts`; expor o servidor confiando em cabeçalhos enviados pelo visitante não substitui autenticação.

## 2. Cadastrar o cliente

1. Entre em `/admin` com o e-mail da equipe autorizado.
2. Clique em **Novo cliente**.
3. Informe o nome, o segmento, o responsável e a meta mensal, se houver.
4. Defina um identificador, por exemplo **cliente-piloto**. Ele compõe o endereço `/empresa/cliente-piloto` e será usado para relacionar a conta Omie.
5. Informe os e-mails que poderão acessar o dashboard. O e-mail de contato, sozinho, não autoriza acesso.
6. Salve com situação **Em preparação** enquanto configura o Omie.

O cadastro fica no banco do servidor. Na demonstração `admin.html`, ele fica apenas neste navegador e usa dados ilustrativos.

## 3. Obter App Key e App Secret

Entre no Omie com um usuário administrador do aplicativo da empresa. Em **Meus Aplicativos**, localize a empresa, clique na **engrenagem → Resumo do App** e encontre **Chave de Integração (API)** ao final da página. Use **Exibir** para consultar o App Secret. A alternativa oficial é a seção **Aplicativos** do [Portal do Desenvolvedor Omie](https://developer.omie.com.br/). [Passo a passo oficial do Omie](https://ajuda.omie.com.br/pt-BR/articles/499061-obtendo-a-chave-de-acesso-para-integracoes-de-api).

Use o par de credenciais do aplicativo correspondente a este cliente. Para esta conexão, basta obter as chaves existentes; não é necessário gerar uma nova chave.

## 4. Configurar o vínculo seguro no servidor

Crie ou atualize o segredo **OMIE_COMPANIES_JSON** da aplicação. No fluxo Sites, use a configuração de segredos do ambiente. Em uma implantação própria compatível, use o armazenamento de segredos do servidor; a Cloudflare oferece configuração de secrets para Workers. [Documentação da Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/).

O conteúdo é um array JSON. Exemplo com marcadores, que devem ser substituídos somente no ambiente seguro:

```json
[
  {
    "id": "cliente-piloto",
    "name": "Nome da empresa",
    "initials": "CP",
    "segment": "Serviços",
    "profile": "Indicadores financeiros da empresa",
    "target": 150000,
    "appKey": "PREENCHER_APP_KEY_NO_SERVIDOR",
    "appSecret": "PREENCHER_APP_SECRET_NO_SERVIDOR",
    "allowedEmails": ["financeiro@empresa.com.br"]
  }
]
```

O **id deve ser exatamente o identificador criado em /admin**. Para adicionar outro vínculo, acrescente um objeto ao array existente, preservando os demais. As chaves ficam nesse segredo do servidor; o painel administrativo não solicita nem grava credenciais no navegador.

Nome, segmento, meta, e-mails e situação salvos no banco administrativo têm precedência sobre os valores iniciais do cadastro secreto. As credenciais continuam vindo do segredo, pelo mesmo `id`.

Depois de salvar o segredo, aplique uma nova versão/reinicie a implantação conforme o ambiente utilizado, para garantir que ela passe a usar a configuração atualizada.

## 5. Ativar e abrir o dashboard

1. Volte a `/admin` e clique em **Atualizar lista**.
2. O cliente deve mostrar **Omie configurado**. Isso indica que há um vínculo de credenciais no servidor; ainda não é uma confirmação de conciliação financeira.
3. Edite o cadastro, confira os e-mails autorizados e selecione **Ativo**.
4. Clique em **Abrir painel**. O servidor consultará o Omie e exibirá um erro legível se a conexão não puder ser concluída.
5. Confira o nome da empresa, as contas, os recebimentos, pagamentos, categorias e o resultado de caixa contra o Omie no mesmo período e regime.
6. Envie ao responsável o endereço individual `/empresa/cliente-piloto`. Ele deve entrar com o e-mail autorizado.

O portal consulta os últimos seis meses completos e o mês atual, com cache de até cinco minutos. Os títulos em aberto são separados dos movimentos realizados. Histórico anterior não é inventado: a DFC mostra meses sem cobertura como indisponíveis. Cada aplicativo precisa de conferência inicial antes de liberar o uso ao cliente.

## 6. Administrar depois da conexão

- **Editar cadastro:** atualiza identidade, meta, responsável, contato e e-mails autorizados.
- **Pausar acesso:** impede novas consultas desse cliente no servidor. Dados já carregados em uma página aberta não são apagados remotamente.
- **Ativar cliente:** exige ao menos um e-mail autorizado. O vínculo Omie também precisa estar configurado para abrir dados reais.
- **Copiar link do cliente:** copia o endereço individual, sem enviar mensagens automaticamente.
- **Atualizar lista:** consulta os cadastros atuais da equipe; não simula uma sincronização financeira.

Na demonstração, os links de prévia carregam somente a identidade visual do perfil e valores ilustrativos. Eles não autenticam usuários e não substituem o portal de produção. Não são criados login/senha reais ao cadastrar uma empresa na prévia.

## Se não funcionar

| Mensagem / situação | Verificação |
| --- | --- |
| Administração restrita | O e-mail autenticado precisa constar em `CONECTY_ADMIN_EMAILS`. |
| Banco ainda não configurado | Vincular `DB` e aplicar a migração no banco da implantação. |
| Omie pendente | Conferir se existe um objeto com o mesmo `id` em `OMIE_COMPANIES_JSON`. |
| Empresa indisponível para a conta | Conferir situação Ativo e e-mail na lista autorizada. |
| Omie não concluiu a consulta | Conferir aplicativo, credenciais, permissões e limites de requisições. |
| Valores diferentes | Comparar conta, período, regime de caixa, transferências e rateios. |
| Mês antigo com n.d. | Está fora do histórico consultado; ampliar a sincronização no servidor se necessário. |

A entrega foi validada com dados de teste, tipos e build. Não foram utilizadas credenciais reais do Omie nesta configuração.
