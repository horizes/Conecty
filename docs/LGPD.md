# LGPD: inventário, retenção e direitos

> Documento operacional, não parecer jurídico. Revisar com advogado antes de uso comercial.

## Papéis

| Papel | Quem | Responsabilidade |
| --- | --- | --- |
| Controlador | Contratante da Conecty (ou a Conecty, conforme o contrato) | Finalidade, base legal, atendimento ao titular |
| Operador | Conecty / fornecedores de infraestrutura | Tratar dados conforme instruções do controlador |
| Suboperadores | Supabase, Omie, GitHub Pages, Cloudflare (se usado) | Hospedagem, autenticação, integração e borda |

Defina no contrato quem é controlador de cada conjunto (conta, empresa, financeiro) e assine DPA/termos com os suboperadores.

## Inventário de dados

| Dado | Onde fica | Finalidade | Base legal sugerida | Retenção |
| --- | --- | --- | --- | --- |
| Nome, e-mail, papel, vínculos | Supabase Auth + tabelas | Autenticação e permissões | Execução de contrato | Enquanto a conta existir |
| Empresa, segmento, logo | Cadastro privado | Personalização do painel | Execução de contrato | Enquanto a conta existir |
| Credenciais Omie (App Key/Secret) | Banco, criptografadas | Sincronização autorizada | Execução de contrato | Até revogar o acesso + 30 dias |
| Dados financeiros do Omie | Cache/tabelas privadas | Dashboard, DFC, relatórios | Execução de contrato | 5 anos (fiscal/contábil) |
| Exportações CSV/Excel/PDF | Geradas no navegador | Uso do cliente | Execução de contrato | Não armazenadas no servidor |
| Eventos de auditoria | `conecty_security_events` | Segurança e prevenção a fraude | Legítimo interesse | 365 dias (configurável) |
| Contadores de rate limit | `conecty_rate_limits` | Proteção contra abuso | Legítimo interesse | 1 dia |
| Sessões/dispositivos | Supabase Auth | Segurança | Execução de contrato | Até expirar/revogar |
| Push subscription | Banco privado | Notificações | Consentimento | Até desativar |
| Backups | Destino criptografado a definir | Continuidade | Obrigação legal/legítimo interesse | 30 dias (sugerido) |

## Direitos do titular

Fluxo mínimo, com prazo de 15 dias:

1. Receber a solicitação pelo canal oficial (`[E-MAIL DO ENCARREGADO]`).
2. Confirmar identidade (e-mail da conta + validação pelo administrador).
3. Localizar os dados por `user_id`/`customer_id`.
4. Atender: confirmação, acesso, correção, portabilidade, anonimização ou exclusão.
5. Registrar a solicitação e a resposta em `conecty_security_events`.
6. Se houver dado fiscal com guarda legal, explicar a retenção e excluir o restante.

Exclusão de conta:

- revogar sessões e convites;
- remover vínculos e permissões;
- apagar logo e push subscriptions;
- anonimizar o ator na auditoria (manter o evento sem e-mail);
- manter dados fiscais pelo prazo legal, com acesso restrito;
- concluir em até 30 dias e registrar a data.

## Compartilhamento e transferência internacional

- Supabase (banco/auth) e GitHub Pages (frontend) podem processar fora do Brasil.
- Informe no aviso de privacidade, com base em cláusulas contratuais padrão/SCCs quando aplicável.
- Omie recebe apenas as credenciais e consultas necessárias à sincronização autorizada.
- Não venda dados nem use para publicidade.

## Segurança

- TLS em trânsito; credenciais Omie criptografadas em repouso com `CONECTY_CREDENTIALS_KEY`.
- RLS por cliente, menor privilégio, auditoria e limite de tentativas.
- Acesso administrativo nominal, sem conta compartilhada.
- Backups criptografados, restore testado e destino com controle de acesso.
- Incidente: conter, avaliar risco, notificar ANPD e titulares em prazo razoável, registrar decisões.

## Checklist antes de comercializar

- [ ] Preencher controlador, CNPJ, endereço e encarregado no aviso de privacidade
- [ ] Publicar `privacidade.html` e linkar no login/cadastro
- [ ] Definir contrato/DPA com cliente e suboperadores
- [ ] Aprovar tabela de retenção (financeiro 5 anos; auditoria 12 meses)
- [ ] Criar canal e procedimento de atendimento ao titular
- [ ] Nomear encarregado (DPO) e publicar contato
- [ ] Rodar teste de restore e registrar evidência
- [ ] Revisar se o GitHub Pages é adequado ao uso comercial
- [ ] Registrar base legal e finalidade no inventário acima

## Modelo de aviso

Use `docs/privacidade.html` como base. Ele contém marcadores `[PREENCHER]` e não deve ser publicado antes da revisão jurídica e do preenchimento dos dados do controlador.
