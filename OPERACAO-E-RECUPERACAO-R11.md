# Operação e recuperação — Conecty R11

O ambiente atual continua sendo de testes no GitHub Pages. O Supabase guarda cadastros, acessos e resultados privados. Nenhum ZIP do frontend substitui um backup do banco.

## Uso da equipe

- Cada administrador cadastra pessoalmente um autenticador no primeiro acesso. Guarde um procedimento de recuperação com o responsável que possui acesso ao Supabase. Nunca envie códigos ou segredos do autenticador pelo chat.
- Proprietário gerencia a equipe. Gestor configura os clientes atribuídos. Consulta e Operador não alteram chaves ou cadastros; Operador acompanha os diagnósticos.
- Novos perfis começam em Consulta, sem clientes. Depois de confirmar o e-mail, o proprietário atribui as permissões necessárias.
- Convites possuem destinatário fixo, uso único e confirmação de e-mail; os administrativos duram 24 horas.
- “Manter conectado”: até 7 dias na administração e 30 dias no cliente. Use somente em aparelho pessoal. Sair remove a sessão lembrada e solicita seu encerramento ao servidor.
- Em Configurações gerais → Saúde e histórico, confira resultado, tentativa, agenda, período e falhas. A coleta extraordinária pede confirmação, utiliza a cota Omie e tem intervalo mínimo de 15 minutos.
- No cadastro, informe o plano Omie e de 3 a 36 meses de histórico. A atualização usa um orçamento compartilhado: o consumo de outras integrações no Omie permanece fora do controle desta plataforma. Um limite preserva o último resultado e aparece no diagnóstico.
- Preferências são vinculadas à conta e à empresa. CSV neutraliza fórmulas em textos; Excel grava textos como texto e valores como número. PDF utiliza a impressão do navegador.
- Em Revisar DFC → Modelos da equipe, dê um nome e um segmento ao modelo e exporte o JSON. Ele contém grupos e regras já confirmadas, sem valores, datas, contas ou identificadores do cliente. Guarde os modelos em uma pasta privada da equipe por segmento. Em outra empresa, importe o modelo, revise o rascunho e só então escolha Salvar para o cliente. A importação compara o nome original e a natureza; preserva decisões existentes, não usa códigos Omie de outra empresa e ignora correspondências ambíguas. Não é uma biblioteca central compartilhada no servidor.

## Backup protegido e ensaio de restauração

Ainda é necessário definir um destino privado e protegido, o responsável e o prazo de retenção. Não enviar banco, chave de criptografia, Vault, senhas ou credenciais Omie ao GitHub ou a este chat.

1. No plano gratuito, faça exportações do banco pelo procedimento oficial do Supabase. Inclua os esquemas e dados necessários, os usuários e vínculos de autenticação conforme a documentação de restauração. Não presuma que apenas exportar a tabela de clientes preserva o login.
2. Guarde separadamente e com controle de acesso a chave `CONECTY_CREDENTIALS_KEY` que já está no servidor e as configurações de agendamento/Vault. Sem a chave correta, as credenciais Omie do backup não podem ser recuperadas.
3. Criptografe a cópia antes de levá-la ao destino aprovado. Defina retenção, responsáveis e uma frequência de exportação apropriada ao uso. O sistema não criou exportações financeiras desprotegidas automaticamente.
4. Restaure primeiro em um projeto de testes isolado. Mantenha o envio de e-mail e o agendador Omie desabilitados nesse projeto para evitar mensagens ou coletas reais duplicadas.
5. Confira quantidades de clientes e usuários, vínculos, permissões, RLS, snapshot e leitura das credenciais usando a chave sob custódia do responsável. Teste com uma conta de cada perfil. Registre resultado e data; depois limpe o ambiente isolado conforme a retenção aprovada.

Não foi certificado um ensaio completo de recuperação de desastre nesta entrega. Ele exige o destino e a custódia definidos pelo responsável, além de acesso de banco para o procedimento de exportação e restauração.

## Publicação e rollback

Antes desta publicação, foram executados TypeScript, suíte completa e verificação dos bundles. O build do pacote confere os bundles; isso não substitui um pipeline privado contínuo. No repositório público, o workflow confere hashes, CSP, referências de assets e ausência de arquivos privados/chaves de servidor antes de publicar apenas a lista pública. A suíte completa do backend permanece no projeto-fonte privado; não é executada pelo repositório público de distribuição.

Para retornar o frontend, republique o conjunto completo de uma versão validada, incluindo assets e manifesto. Não misture HTML de uma versão com scripts de outra. Guarde também os bundles de backend correspondentes. A migração R11 é aditiva; um rollback do frontend não deve apagar tabelas de auditoria nem dados.

## Decisões necessárias antes de uso comercial

- Isolar teste/produção, definir domínio, remetente empresarial com SPF/DKIM/DMARC e validar entrega em provedores diferentes.
- A proteção nativa contra senhas vazadas depende do plano Supabase Pro+. A senha mínima e o segundo fator foram reforçados sem contratar plano.
- O Pages não permite configurar os cabeçalhos de proteção de enquadramento desta aplicação. CSP e bloqueio de abertura em iframe são mitigadores; domínio próprio, cabeçalhos e sessão HttpOnly ainda exigem arquitetura/serviço apropriado.
- Revisar as condições do GitHub Pages antes de comercializar um SaaS e tratar senhas nesse serviço. O pedido de manter o teste no Pages foi preservado; domínio próprio não altera os termos da hospedagem.
- Definir política de privacidade, retenção, suporte, responsabilidades e critérios de classificação DFC com a Conecty. Esses documentos dependem das decisões do negócio; não foram inventados nem certificados juridicamente.

Referências: [backups Supabase](https://supabase.com/docs/guides/platform/backups), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [senhas](https://supabase.com/docs/guides/auth/password-security), [limites Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
