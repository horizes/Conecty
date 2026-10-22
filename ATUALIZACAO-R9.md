# Atualização R9 — painel, e-mail e frequências

O site continua em https://horizes.github.io/Conecty/. No administrador, abra o cadastro do cliente e a seção **Atualização dos dados e da DFC**.

- **Uma vez por dia:** escolha o horário de Brasília. Uma tentativa por dia é preservada, inclusive ao mudar o horário depois da tentativa.
- **A cada tantos minutos:** escolha entre 1 e 1.440 minutos. O prazo começa quando a coleta anterior termina; a fila verifica as empresas a cada minuto.
- **Quase em tempo real:** coleta contínua, com no mínimo um minuto de espera após a anterior. Não é atualização instantânea. O tempo da coleta e da fila também entra no prazo.

O agendamento funciona com o site fechado. Uma reserva no banco impede coletas simultâneas da mesma empresa. Uma reserva abandonada expira em cinco minutos. Nos modos por intervalo e contínuo, falhas esperam no mínimo cinco minutos. O último resultado válido permanece disponível, com sua data original. As páginas apenas leem o snapshot; acessos em vários aparelhos não aumentam as coletas Omie.

Os clientes existentes mantêm o horário e o modo diário. Logo, contas/categorias, acessos e credenciais existentes são preservados. Não alterar a chave de criptografia nem os Secrets do Vault.

## Publicação do servidor

1. Atualizar `conecty-api` com `index.ts` deste pacote. Preservar a verificação JWT habilitada.
2. Atualizar `conecty-sync` com `conecty-sync.ts`. Preservar JWT desabilitado e a autenticação privada pelo token de sincronização.
3. Executar `AGENDAMENTO-FLEXIVEL.sql` no mesmo projeto, após o agendamento R7 já instalado. O SQL reutiliza o job existente.
4. Atualizar **Authentication → Emails → Confirm sign up**, com `EMAIL-CONFIRMACAO.html`. Assunto sugerido: **Seu código de acesso chegou | Conecty**. Preservar o SMTP já configurado.
5. Publicar os arquivos do pacote GitHub Pages, incluindo `conecty-logo.png`. Não publicar o backend ou segredos.

No celular, títulos e instruções são mais curtos e os botões têm texto legível. A logo do cliente aparece livre de moldura, mantendo a Conecty presente. Dentro do app instalado, botões, rótulos e instruções de instalação ficam ocultos; a instalação permanece disponível no navegador.

Referências: [limites da API Omie](https://ajuda.omie.com.br/pt-BR/articles/8112984-limites-de-consumo-da-api-do-omie), [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions).
