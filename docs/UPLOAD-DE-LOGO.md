# Upload de logo com validação no servidor

## Situação atual

- A administração aceita PNG, JPG e WebP de até 5 MB.
- A imagem é guardada no cadastro privado e entregue depois da autorização.
- O CSP publicado permite `img-src 'self' data: https://<projeto>.supabase.co` (a release R41 removeu o domínio fixo do GitHub Pages).

## Riscos a fechar

1. Confiar no `Content-Type` ou na extensão enviada pelo navegador.
2. Aceitar SVG (script embutido) ou GIF.
3. Guardar imagem com EXIF/metadados (geolocalização, software, autor).
4. Decompression bomb (arquivo pequeno com dimensões enormes).
5. Bucket público ou URL permanente sem autorização.

## Validador pronto

`supabase/functions/_shared/image-validate.ts`:

- confere **magic bytes** (PNG/JPEG/WebP);
- rejeita SVG/GIF por extensão, MIME e conteúdo;
- limite de 5 MB;
- dimensões mínimas de 16 px e máximas de 4096 px;
- garante que o MIME declarado coincide com o conteúdo;
- devolve SHA-256 (útil para auditoria/deduplicação).

### Integração

```ts
import { validateLogoUpload } from "../_shared/image-validate.ts";

const form = await req.formData();
const file = form.get("logo");
if (!(file instanceof File)) return json({ error: "Arquivo ausente" }, 400);

const check = await validateLogoUpload(file);
if (!check.ok) return json({ error: check.reason }, 415);

// 1. Reencode para remover metadados e normalizar (ImageMagick/imagescript).
// 2. Grave em bucket PRIVADO com nome aleatório (uuid), não com o nome original.
// 3. Salve apenas o caminho no cadastro; entregue por URL assinada de curta duração.
```

## Reencode obrigatório

Validar não basta: um PNG válido pode carregar chunks arbitrários. Depois do check:

```bash
# exemplo com ImageMagick no ambiente de build/Edge
convert input.png -strip -resize '1024x1024>' -quality 88 output.webp
```

Boas práticas:

- limite final de 1024×1024 (logo de dashboard não precisa mais que isso);
- converta para WebP/PNG sem alfa desnecessário;
- remova ICC/EXIF (`-strip`);
- gere novo hash e grave o resultado, nunca o original.

## Bucket e entrega

- Bucket privado (`public = false`).
- Policy de `select` apenas para o dono do cliente ou `service_role`.
- Entrega por `createSignedUrl(path, 60)` após validar o vínculo usuário↔cliente.
- Nome do objeto: `<customer_id>/<uuid>.<ext>`; nunca o nome enviado.
- Ao substituir/remover a logo, apague o objeto antigo.
- Se usar URL assinada, mantenha `img-src` com o domínio do projeto Supabase.

## Checklist

- [ ] Validação no servidor (não só no navegador)
- [ ] Magic bytes + dimensões + tamanho
- [ ] SVG/GIF bloqueados
- [ ] Reencode + remoção de metadados
- [ ] Bucket privado + policy por cliente
- [ ] URL assinada e curta
- [ ] Auditoria: `admin.client.updated` com `sha256` e tamanho
- [ ] Teste com arquivo renomeado (`.png` que é SVG) e com PNG 10000×10000
