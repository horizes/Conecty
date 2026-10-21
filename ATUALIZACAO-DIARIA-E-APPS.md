> **Atualização R7:** para logo do cliente, horário configurável e gestão de usuários, siga [LOGO-E-HORARIO.md](LOGO-E-HORARIO.md). Use o novo SQL no lugar do agendamento fixo das 13h.

# Atualização diária, recorte por cliente e apps separados — R6

O site permanece no GitHub Pages. A coleta do Omie passa a ocorrer uma vez por dia, a partir das **13h no horário de Brasília**, mesmo com o site fechado. A primeira sincronização e a coleta de empresas novas aguardam o próximo horário programado. Abrir o painel, recarregar a página ou clicar no indicador de atualização lê o resultado salvo, sem nova coleta do Omie.

A administração escolhe as contas bancárias e categorias em **Editar cadastro → Leitura do dashboard**. As escolhas valem para números, gráficos, lançamentos, exportações e DFC. O cliente não tem os seletores de contas e categorias de origem.

## Ordem de instalação

Execute as etapas no MESMO projeto Supabase que já funciona com o site. Preserve todos os Secrets existentes, em especial **CONECTY_CREDENTIALS_KEY**. Há dois arquivos de função diferentes: a API atende o site e a função de sincronização atende o agendamento.

### 1. Preparar o banco

1. No Supabase, abra **SQL Editor → New query**.
2. Abra **ATUALIZAR-DIARIO.sql**, copie o conteúdo inteiro e cole na consulta.
3. Clique em **Run**. O SQL mantém os cadastros, as chaves criptografadas e o último resultado já salvo. Ele também cria o registro que impede duas sincronizações da mesma empresa no mesmo dia.

### 2. Atualizar a API que já existe

1. Abra **Edge Functions → conecty-api → Code / Edit code**.
2. Selecione **index.ts**, pressione **Ctrl+A** e substitua todo o conteúdo por **conecty-api-DIARIA.txt**.
3. Confira o marcador **CONECTY-API-2026-10-20-R6-DIARIO** na primeira linha e **FIM DO ARQUIVO COMPLETO** na última.
4. Clique em **Deploy updates** e aguarde a confirmação.
5. Mantenha a verificação JWT da **conecty-api ativada**. Os usuários continuam usando seus logins individuais.

### 3. Criar a função que roda às 13h

1. Em **Edge Functions**, escolha criar uma função pelo editor, com o nome exato **conecty-sync**.
2. No arquivo **index.ts** dessa NOVA função, cole TODO o arquivo **conecty-sync-DIARIA.txt**.
3. Confira o marcador **CONECTY-SYNC-2026-10-20-R6-DIARIO** e publique.
4. Nas configurações da **conecty-sync**, desative **Verify JWT / Enforce JWT Verification**. Faça isso somente nessa função. Ela verifica um token privado próprio, que será instalado nas próximas etapas; sem esse token não executa nada.

### 4. Criar o agendamento e o token privado

1. Volte a **SQL Editor → New query**.
2. Cole o arquivo completo **AGENDAR-13H.sql** e clique em **Run**.
3. Esse SQL ativa `pg_cron` e `pg_net`, cria um token no Vault e agenda o job **conecty-diario-13h**. O horário `16:00 UTC` equivale a `13:00 Brasília`. O agendamento não depende de seu computador estar ligado.
4. A URL e a chave publicável já estão preenchidas para o projeto atual `kpxztiyrhrmxukupualo`. Se estiver instalando em outro projeto, ajuste esses dois valores públicos antes de executar.

### 5. Entregar o token à função de sincronização

1. No Supabase, abra **Vault** (use a busca do painel se o menu estiver em outra seção).
2. Localize o segredo de nome **conecty_sync_token**. Revele e copie o VALOR, uma sequência de 64 caracteres. Não copie o nome do segredo.
3. Abra **Edge Functions → Secrets**.
4. Crie um NOVO Secret com o nome **CONECTY_SYNC_TOKEN** e cole esse valor. Salve.
5. Preserve **CONECTY_CREDENTIALS_KEY** e os demais Secrets. Este token novo tem outra finalidade.

O token fica somente no Vault e nos Secrets do Supabase. Não coloque esse valor no GitHub, no HTML ou em `conecty-config.js`; não é necessário enviá-lo pelo chat. Executar o SQL novamente preserva o token existente e atualiza o job pelo mesmo nome, sem criar outro agendamento diário.

### 6. Publicar os arquivos do site

Envie o CONTEÚDO do pacote **Conecty-GitHub-Pages.zip** para a raiz do repositório, preservando também as pastas **admin/** e **cliente/**. Não envie o pacote de backend ao GitHub Pages. Mantenha seu arquivo público **conecty-config.js** com a URL e a Publishable key do mesmo projeto.

Os endereços anteriores continuam funcionando. Os apps instaláveis usam:

- **Conecty Admin:** https://horizes.github.io/Conecty/admin/
- **Conecty Cliente:** https://horizes.github.io/Conecty/cliente/

Cada app tem manifesto, identidade, ícone, área de navegação e sessão próprios. Ao atualizar de uma versão anterior, entre novamente nas contas. A instalação não substitui o login nem as permissões verificadas no servidor.

### 7. Definir as contas e categorias de um cliente

1. Entre na administração com sua conta de administrador.
2. No cliente desejado, abra **Editar cadastro**.
3. Vá até **Leitura do dashboard**. A seção informa a atualização das 13h.
4. Em **Contas bancárias**, mantenha **Todas** ou escolha **Somente as selecionadas** e marque uma ou várias contas.
5. Faça o mesmo em **Categorias**. Use a busca para encontrar nomes ou códigos.
6. Clique em **Salvar alterações**. O recorte é aplicado imediatamente ao último resultado salvo; não consulta o Omie novamente.

As listas vêm da última sincronização. No primeiro uso sem resultado salvo, aguarde as 13h para aparecerem. O resultado da versão anterior pode fornecer uma lista inicial baseada nos movimentos já salvos; a próxima sincronização traz o catálogo completo de contas e categorias. Clientes em preparação, pausados ou sem chaves não são sincronizados.

Em **Todas**, novas contas e categorias do Omie entram automaticamente. Em **Somente as selecionadas**, as novas opções ficam fora até a Conecty selecioná-las. A seleção usa códigos estáveis: renomear uma conta ou categoria não altera o recorte. No rateio de um lançamento, entram somente as parcelas das categorias escolhidas.

### 8. Instalar cada app

Abra o endereço correspondente e toque em **Instalar Conecty Admin** ou **Instalar Conecty Cliente**, também disponíveis nas telas de login e nos painéis. Instale o administrativo nos dispositivos da equipe; envie ao cliente somente seu link de acesso pelo painel administrativo.

No **PC**, abra no Chrome ou Edge e clique em **Instalar Conecty Admin** ou **Instalar Conecty Cliente**. Confirme a instalação na janela do navegador. O app passa a abrir em uma janela própria, com ícone no computador. Se estiver num endereço antigo, o botão leva primeiro ao endereço próprio do app.

No **Android**, abra no Chrome e use o mesmo botão. No **iPhone/iPad**, abra no Safari e use **Compartilhar → Ver mais → Adicionar à Tela de Início → Adicionar**.

A janela automática depende da liberação do navegador. O site guarda essa opção mesmo ao passar do login para o painel. Se ela ainda não estiver disponível, mostra instruções e um botão que é habilitado assim que o navegador permitir. No PC, também é possível instalar pelo ícone na barra de endereço ou pelo menu de aplicativos do Chrome/Edge; no Android, pelo menu **Adicionar à tela inicial → Instalar**.

Os dois apps precisam de internet para consultar os dados; os service workers não armazenam dados financeiros, senhas, tokens nem respostas da API para uso offline. A melhoria da instalação no PC é somente uma atualização do site; quem já configurou o backend não precisa alterar o Supabase por causa dela.

## Conferir sem expor dados ou chaves

Confira em **Integrations → Cron** se o job **conecty-diario-13h** está ativo. O status do disparo no Cron não significa, sozinho, que a coleta concluiu: confira os registros de cada empresa depois das 13h.

```sql
SELECT client_id AS empresa, sync_date AS dia,
       status, started_at AS inicio, finished_at AS fim, error_code AS codigo
FROM public.conecty_finance_sync_runs
ORDER BY sync_date DESC, client_id;
```

```sql
SELECT client_id AS empresa, generated_at AS dados_consultados_em
FROM public.conecty_finance_cache
ORDER BY client_id;
```

A rotina inicia às 13h; a conclusão depende do volume de páginas e da resposta do Omie. Existe **uma tentativa por empresa por dia**, protegida no banco mesmo se chegar um disparo duplicado. Se falhar, o último resultado permanece com a data original e o painel indica atualização pendente. A próxima tentativa ocorre no dia seguinte. A data dos indicadores continua sendo a do resultado salvo.

As contas e categorias são coletadas para formar o resultado privado da empresa e o catálogo da administração; o servidor envia ao cliente somente os lançamentos permitidos pelo recorte atual. A coleta usa o limite de tempo do ambiente gratuito: empresas com volume que não caiba nesse limite precisarão de uma sincronização incremental.

## Limites da validação

Testes locais verificam relógio de Brasília, uma tentativa por dia, falhas preservando o resultado anterior, filtros no servidor, permissões e os dois arquivos finais das funções. A execução real do SQL, do Cron e do Omie depende da instalação no seu projeto. Instalar de fato os dois apps também depende do navegador e do dispositivo.

Referências: [agendamento de funções Supabase](https://supabase.com/docs/guides/functions/schedule-functions), [limites de execução](https://supabase.com/docs/guides/functions/limits), [instalação de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt).
