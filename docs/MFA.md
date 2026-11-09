# MFA: decisão, resíduos e próximo passo

## Decisão registrada

Em 25/10/2026 o responsável optou por **não exigir segundo fator administrativo**. O guia `OPERACAO-E-RECUPERACAO-R11.md` documenta a decisão.

## Situação do código publicado (R41)

Ainda existem resíduos de MFA no build:

- constante `conecty-pages-mfa-required` no bundle de autenticação;
- tratamento de `403` com `MFA_REQUIRED`;
- modal de segurança com geração de QR/TOTP (`data:image/svg+xml`, `totp.qr_code`);
- textos de "autenticador" e códigos de verificação.

Como o frontend é publicado já compilado e o projeto-fonte é privado, **não é seguro editar o bundle minificado**. A remoção precisa acontecer no build.

## Checklist para o próximo build (projeto-fonte)

- [ ] Remover a constante/evento `conecty-pages-mfa-required` e o `window.dispatchEvent`.
- [ ] Remover o tratamento de `403 MFA_REQUIRED` no wrapper de API.
- [ ] Remover a tela/modal de inscrição TOTP e a geração do QR.
- [ ] Remover chamadas a `mfa.enroll`, `mfa.challenge`, `mfa.verify` e fatores.
- [ ] Remover textos e testes relacionados.
- [ ] Rodar a suíte completa no projeto privado.
- [ ] Publicar com `release` novo no manifesto.

## Guarda de regressão (ativar após a remoção)

Adicione ao `ci/verify-public.mjs`:

```js
if (/conecty-pages-mfa-required|MFA_REQUIRED|totp\.qr_code/.test(text)) {
  assert.fail(`${f.path}: resíduo de MFA no build`);
}
```

Enquanto o resíduo existir, esse bloco deixaria o CI vermelho — por isso ele entra junto com o build corrigido.

## Se a decisão mudar

Para um SaaS financeiro, o maior ganho isolado é **TOTP obrigatório apenas para admin/proprietário**, com códigos de recuperação:

1. Ative MFA (TOTP) no Supabase Auth.
2. Exija `aal2` nas rotas administrativas da `conecty-api`.
3. Ofereça enroll no primeiro login do proprietário.
4. Gere 8 códigos de recuperação de uso único, exibidos uma vez.
5. Registre `auth.mfa.enrolled`, `auth.mfa.challenge`, `auth.mfa.success`/`failure` na auditoria.
6. Nunca aceite `aal1` para alterar permissões, credenciais Omie ou exportar todos os dados.

Referência: <https://supabase.com/docs/guides/auth/auth-mfa>
