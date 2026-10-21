# Logo do cliente, horário diário e usuários — R7

O site continua em https://horizes.github.io/Conecty/. A atualização do GitHub Pages inclui os novos controles; para gravar as configurações e administrar usuários, atualize o backend do MESMO projeto Supabase conforme as etapas abaixo. Não recrie o projeto nem altere as chaves Omie existentes.

## Ativar esta entrega uma vez

### 1. Atualizar a API do site

1. No Supabase, abra **Edge Functions → conecty-api → Code / Edit code**.
2. Abra **index.ts**, selecione tudo e substitua pelo conteúdo COMPLETO de **conecty-api-LOGO-E-HORARIO.txt**.
3. Confira o marcador **CONECTY-API-2026-10-21-R7-LOGO-HORARIO** no início e **FIM DO ARQUIVO COMPLETO** na última linha.
4. Clique em **Deploy updates**. Mantenha **Verify JWT ativado** nesta função.

Esta etapa habilita as logos e a gestão de contas. O campo de horário só é liberado depois que o servidor confirmar o agendamento da etapa 3.

### 2. Atualizar a função de sincronização

1. Abra **Edge Functions → conecty-sync → Code / Edit code**. Se ela ainda não existir, crie uma função com esse nome exato.
2. Substitua todo o **index.ts** pelo arquivo **conecty-sync-LOGO-E-HORARIO.txt**.
3. Confira **CONECTY-SYNC-2026-10-21-R7-LOGO-HORARIO** no começo e **FIM DO ARQUIVO COMPLETO** no fim. Publique.
4. A **conecty-sync** usa **Verify JWT desativado** e exige seu token privado `CONECTY_SYNC_TOKEN`. Preserve esse Secret se já estiver configurado. Sem o token correto, a função recusa a sincronização.

Não substitua o código de uma função pelo arquivo da outra.

### 3. Ativar o horário por cliente no banco

1. Abra **SQL Editor → New query**.
2. Copie TODO o arquivo **AGENDAMENTO-CONFIGURAVEL.sql** e clique em **Run**.
3. Aguarde a confirmação de sucesso. Este arquivo reúne a estrutura privada de cache e tentativas, o Vault e o novo agendamento. Ele preserva os cadastros, as credenciais criptografadas, os resultados e o histórico.
4. O job anterior **conecty-diario-13h** é substituído pelo **conecty-diario-configuravel**. Outros jobs são preservados.

O job verifica uma vez por minuto quais clientes chegaram ao horário escolhido. Essa verificação no banco não consulta o Omie. A função coleta cada cliente ativo e configurado no máximo uma vez por dia, com proteção no banco contra disparos duplicados. Não é necessário deixar o computador ligado ou o site aberto.

Não reaplique **AGENDAR-13H.sql** depois desta atualização: ele pertence à configuração anterior de horário fixo. Use o novo arquivo nas próximas instalações. A URL e a chave pública já estão preenchidas para o projeto atual `kpxztiyrhrmxukupualo`; em outro projeto, ajuste somente esses dois valores públicos antes de executar.

### 4. Conferir o token privado

Se a sincronização diária já estava instalada, preserve seus Secrets. Se ainda não havia a função diária:

1. Abra **Vault** no Supabase e localize **conecty_sync_token**.
2. Copie o VALOR desse segredo, uma sequência de 64 caracteres.
3. Abra **Edge Functions → Secrets** e salve esse valor com o nome **CONECTY_SYNC_TOKEN**.

Preserve **CONECTY_CREDENTIALS_KEY** e os demais Secrets existentes. Não envie valores privados pelo chat ou ao GitHub. O novo SQL preserva o token que já existir no Vault.

### 5. Recarregar a administração

Entre novamente na administração e atualize a página. Se o campo de horário continuar desativado, confirme que a API é R7 e que o job **conecty-diario-configuravel** está ativo em **Integrations → Cron**. Atualize a lista de clientes depois da instalação.

Os arquivos do site também estão no pacote **Conecty-GitHub-Pages.zip**. Ao publicar manualmente, envie seu conteúdo, incluindo **admin/** e **cliente/**, e preserve seu **conecty-config.js** público. O pacote de backend deve permanecer fora do GitHub Pages.

## Colocar a logo de um cliente

1. Na lista de clientes, abra **Ações → Editar cadastro**.
2. Em **Logo no dashboard**, clique em **Enviar logo**. Aceita PNG, JPG e WebP de até 5 MB.
3. Confira a prévia e clique em **Salvar alterações**. O site prepara uma imagem leve mantendo a proporção; a versão salva tem no máximo 96 KB.
4. Recarregue o dashboard do cliente. A marca aparece no topo, ao lado do nome da empresa. A Conecty permanece na lateral e na assinatura da gestão.

Use **Substituir logo** ou **Remover logo** no mesmo cadastro. A remoção volta a mostrar as iniciais da empresa. A imagem é salva no cadastro privado e entregue após autorização; não é publicada no repositório. Trocar a logo não espera outra coleta do Omie.

## Escolher quando os dados e a planilha DFC atualizam

1. Abra **Editar cadastro → Atualização dos dados e da DFC**.
2. Escolha **Horário diário (Brasília)**, entre 00:00 e 23:59.
3. Salve as alterações. Empresas sem horário personalizado continuam com **13:00**.

O horário é o início previsto da coleta. A conclusão depende da resposta e do volume do Omie. Números, gráficos e DFC usam o mesmo resultado salvo. O cliente vê o horário e a data dos dados, mas não altera essa configuração.

Se já houve uma tentativa de coleta deste cliente hoje, a mudança vale para o próximo dia. Se ainda não houve tentativa e o horário escolhido já passou, o cliente entra na próxima verificação do agendamento. Pausados, em preparação e cadastros sem chaves não são coletados. Uma falha mantém o último resultado válido, com sua data original, e a próxima tentativa ocorre no dia seguinte.

## Administrar usuários dos clientes

1. Na linha do cliente, abra **Ações → Usuários e acessos**.
2. Confira e-mail, situação e último login. Use a busca e os filtros **Liberados**, **Bloqueados** e **Excluídos**.
3. Em **Adicionar usuário**, crie uma conta ou vincule uma conta existente. Cada conta de cliente fica ligada somente a sua empresa. A opção de senha tem o olhinho.
4. Use **Bloquear** para retirar o acesso ou **Liberar** para reativá-lo. A API confere a autorização novamente a cada consulta, inclusive com um login já aberto.
5. Para excluir, clique na lixeira e digite o e-mail solicitado. **Excluir acesso** bloqueia o perfil e o retira da lista principal, preservando a conta para recuperação.
6. Em **Excluídos → Restaurar**, o perfil volta como bloqueado. Clique em **Liberar** quando quiser reativar.

Liberar uma conta não ativa uma empresa pausada. O cadastro da empresa também precisa estar ativo. A exclusão de um acesso não apaga dados financeiros nem as chaves Omie. A lista representa contas cadastradas, sem monitoramento de pessoas conectadas naquele momento.

## Administrar os perfis da equipe Conecty

Abra **Perfis da administração**, no topo do painel. A lista tem as mesmas ações de bloquear, liberar, excluir e restaurar. Use **Adicionar perfil** para criar uma conta da equipe ou vincular uma conta sem perfil de cliente. O novo administrador recebe acesso à administração, sem precisar alterar arquivos ou a lista inicial de e-mails.

O acesso do administrador principal configurado na implantação e o perfil de quem está executando a ação não podem ser bloqueados ou excluídos pelo painel. Contas de clientes não são promovidas pela vinculação de perfil administrativo: use um e-mail exclusivo para a equipe.

## Conferir a instalação

No SQL Editor:

```sql
SELECT public.conecty_scheduler_ready() AS agendamento_pronto;

SELECT id, config->>'name' AS empresa,
       public.conecty_client_update_time(config) AS horario_brasilia
FROM public.conecty_clients ORDER BY id;

SELECT client_id, sync_date, status, started_at, finished_at, error_code
FROM public.conecty_finance_sync_runs
ORDER BY sync_date DESC, client_id;
```

`agendamento_pronto = true` confirma o job ativo. Confira também as execuções e os resultados de cada empresa depois do horário escolhido. A validação local usa contas e Omie simulados; a execução real do SQL, do job e das funções exige esta instalação no seu projeto.

Referências: [agendamento de funções](https://supabase.com/docs/guides/functions/schedule-functions), [gestão de jobs](https://supabase.com/docs/guides/cron/quickstart), [administração de usuários](https://supabase.com/docs/reference/javascript/auth-admin-listusers).
