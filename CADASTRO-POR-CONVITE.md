> Guia histórico. As configurações de segurança e o uso atual estão em [Operação R11](OPERACAO-E-RECUPERACAO-R11.md). Não reative cadastro público.

# Cadastro por convite — cliente e administração

Os novos cadastros usam páginas separadas: cadastro-cliente.html e cadastro-admin.html. Os links válidos são gerados somente dentro da administração Conecty. Cada link tem uso único, vale sete dias e define o perfil no servidor.

## Implantação

1. Atualize a função conecty-api com conecty-api-CONVITES.txt. Preserve Verify JWT ligado e todos os Secrets existentes.
2. Crie a função conecty-cadastro com conecty-cadastro-CONVITES.txt. Esta função recebe convites sem sessão anterior: Verify JWT desligado. Não entrega dados financeiros nem aceita escolher empresa ou privilégio pelo formulário. Tokens aleatórios são conferidos no banco e a função impõe a origem HTTPS do site.
3. Execute CADASTRO-POR-CONVITE.sql no SQL Editor. A tabela é privada. As operações de vincular e usar o convite ocorrem na mesma transação, após confirmar a identidade no Supabase Auth.
4. Em Authentication → Emails → SMTP Settings, configure um remetente real da Conecty. Uma conta Gmail da empresa pode ser usada para testes com smtp.gmail.com e porta 465/TLS. O titular precisa criar uma senha de app no próprio Google, quando disponível, e inseri-la diretamente no campo SMTP do Supabase. Nunca enviar essa senha ao chat ou ao repositório.
5. Em Emails → Confirm sign up, use o assunto “Seu código de confirmação — Conecty” e o conteúdo completo de EMAIL-CONFIRMACAO.html. O marcador {{ .Token }} deve permanecer literal: o Supabase o substitui pelo código.
6. Somente depois de verificar SMTP e template, configure o Secret CONECTY_REGISTRATION_EMAIL_READY com o valor 1. Até lá, a geração dos convites fica desativada e a página informa que o envio está em preparação.
7. Publique os arquivos públicos, incluindo cadastro-admin.html e cadastro-cliente.html. Preserve conecty-config.js. Não publique SQL, código da função ou credenciais no Pages.

Não altere o agendamento financeiro nem a função conecty-sync para instalar esta função.

## Uso

- Cliente: na administração, abra Ações → Usuários e acessos → Gerar link de cadastro. O novo usuário ficará vinculado somente àquela empresa.
- Equipe: no menu lateral, abra Configurações gerais → Perfis da administração → Gerar convite administrativo. O destinatário poderá administrar todos os clientes. Envie apenas à equipe autorizada.
- Copie o link antes de fechar. Por segurança, o servidor conserva apenas seu hash, portanto o endereço completo não pode ser recuperado depois. É possível cancelar e gerar outro.
- O destinatário preenche nome, e-mail e senha, digita o código recebido e entra no login correspondente.
- O e-mail fica vinculado ao convite no primeiro envio. Se foi digitado incorretamente, cancele o convite e gere outro.
- O novo acesso aparece na lista de contas correspondente após a confirmação. Empresas em preparação ou pausadas continuam sem liberação do painel, mesmo após o cadastro da pessoa.
- Endereços fictícios como nome@conecty.test podem ser usados em demonstrações manuais, mas não recebem nem enviam códigos reais. O cadastro por convite exige um e-mail real acessível.

## Proteções e limites

Antes da confirmação, a conta fica sem perfil Conecty. O vínculo administrativo ou com cliente é definido apenas no servidor. Trocar a página ou enviar outro campo de perfil não transforma um convite de cliente em administrador. O cadastro não altera senhas de contas existentes nem vincula silenciosamente contas de outra empresa.

Reenvio no máximo uma vez por minuto e dez envios por convite. Verificação limitada a dez tentativas em quinze minutos. Código, senha e tokens de sessão não são armazenados no cadastro do cliente ou devolvidos à administração. Os limites do provedor de e-mail também se aplicam.

O convite cancelado, usado ou expirado não cria outro acesso. A geração de novos convites requer uma sessão administrativa atual e válida. O criador do convite também precisa continuar autorizado quando o destinatário conclui o cadastro.

Referências: [SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [templates e código](https://supabase.com/docs/guides/auth/auth-email-templates), [confirmação OTP](https://supabase.com/docs/reference/javascript/auth-verifyotp).
