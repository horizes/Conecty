/**
 * Validação de logo no servidor (Edge Function).
 *
 * Regras: PNG, JPEG ou WebP; até 5 MB; até 4096 px por lado; mínimo 16 px.
 * SVG é rejeitado (pode conter script). GIF é rejeitado.
 *
 * Importante: valide os magic bytes, não o `Content-Type` nem a extensão.
 * Depois de validar, **reencode** a imagem (ImageMagick, imagescript etc.)
 * para remover metadados/EXIF e normalizar o arquivo antes de gravar no bucket.
 */

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;
export const MAX_LOGO_DIMENSION = 4096;
export const MIN_LOGO_DIMENSION = 16;

export type ImageType = "image/png" | "image/jpeg" | "image/webp";

export type LogoValidation =
  | {
      ok: true;
      contentType: ImageType;
      extension: "png" | "jpg" | "webp";
      width: number | null;
      height: number | null;
      byteLength: number;
      sha256: string;
    }
  | { ok: false; reason: string };

export type UploadLike = {
  arrayBuffer(): Promise<ArrayBuffer>;
  type?: string;
  name?: string;
  size?: number;
};

export async function validateLogoUpload(upload: UploadLike): Promise<LogoValidation> {
  const declaredType = (upload.type || "").toLowerCase().trim();
  const filename = (upload.name || "").toLowerCase().trim();

  if (filename.endsWith(".svg") || declaredType === "image/svg+xml") {
    return { ok: false, reason: "SVG não é aceito. Envie PNG, JPEG ou WebP." };
  }
  if (filename.endsWith(".gif") || declaredType === "image/gif") {
    return { ok: false, reason: "GIF não é aceito. Envie PNG, JPEG ou WebP." };
  }
  if (upload.size !== undefined && upload.size > MAX_LOGO_BYTES) {
    return { ok: false, reason: "A imagem deve ter no máximo 5 MB." };
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  if (bytes.byteLength < MIN_LOGO_DIMENSION || bytes.byteLength > MAX_LOGO_BYTES) {
    return { ok: false, reason: "Tamanho de imagem inválido (máximo 5 MB)." };
  }

  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    return { ok: false, reason: "O arquivo não é um PNG, JPEG ou WebP válido." };
  }

  const declared = normalizeType(declaredType);
  if (declared && declared !== sniffed) {
    return { ok: false, reason: "O tipo declarado não corresponde ao conteúdo do arquivo." };
  }

  const size = imageDimensions(bytes, sniffed);
  if (size) {
    const { width, height } = size;
    if (width < MIN_LOGO_DIMENSION || height < MIN_LOGO_DIMENSION) {
      return { ok: false, reason: `A imagem deve ter pelo menos ${MIN_LOGO_DIMENSION} px por lado.` };
    }
    if (width > MAX_LOGO_DIMENSION || height > MAX_LOGO_DIMENSION) {
      return { ok: false, reason: `A imagem deve ter no máximo ${MAX_LOGO_DIMENSION} px por lado.` };
    }
  }

  return {
    ok: true,
    contentType: sniffed,
    extension: sniffed === "image/png" ? "png" : sniffed === "image/jpeg" ? "jpg" : "webp",
    width: size?.width ?? null,
    height: size?.height ?? null,
    byteLength: bytes.byteLength,
    sha256: await sha256Hex(bytes),
  };
}

export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function imageDimensions(bytes: Uint8Array, type: ImageType): { width: number; height: number } | null {
  if (type === "image/png") {
    if (bytes.length < 24 || ascii(bytes, 12, 4) !== "IHDR") return null;
    return { width: readU32BE(bytes, 16), height: readU32BE(bytes, 20) };
  }
  if (type === "image/jpeg") return jpegDimensions(bytes);
  if (type === "image/webp") return webpDimensions(bytes);
  return null;
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 8 < bytes.length) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    i += 2 + length;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) return null;
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") {
    return { width: 1 + readU24LE(bytes, 24), height: 1 + readU24LE(bytes, 27) };
  }
  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return {
      width: ((bytes[26] | (bytes[27] << 8)) & 0x3fff) || 0,
      height: ((bytes[28] | (bytes[29] << 8)) & 0x3fff) || 0,
    };
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) return null;
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

function normalizeType(value: string): ImageType | null {
  if (value === "image/png") return "image/png";
  if (value === "image/jpeg" || value === "image/jpg") return "image/jpeg";
  if (value === "image/webp") return "image/webp";
  return null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}
function readU32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}
function readU24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // @ts-ignore Deno runtime expõe crypto.subtle; TypeScript do app pode não tipar.
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
