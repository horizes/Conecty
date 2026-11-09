import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = path.resolve(process.argv[2] || '.');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'));
console.log('DIAG release:', manifest.release);
console.log('DIAG files:', manifest.files.length);
const files = new Set(manifest.files.map((f) => f.path));
function local(base, target) {
  if (/^(https?:|data:|#|mailto:|tel:)/.test(target)) return;
  const name = path.posix.normalize(path.posix.join(path.posix.dirname(base), target.split(/[?#]/)[0]));
  if (name.startsWith('../')) throw new Error(`DIAG ref fora da publicação: ${base} -> ${target} = ${name}`);
  if (!files.has(name)) throw new Error(`DIAG arquivo ausente: ${base} -> ${target} = ${name}`);
}
for (const f of manifest.files) {
  const tag = `DIAG ${f.path}`;
  try {
    if (f.path.includes('..') || path.isAbsolute(f.path)) throw new Error('DIAG path invalido');
    if (/\.(sql|ts|tsx|cjs|env|zip)$/i.test(f.path)) throw new Error('DIAG arquivo privado');
    const data = fs.readFileSync(path.join(root, f.path));
    if (data.length !== f.bytes) throw new Error(`DIAG bytes ${f.path}: local ${data.length} != manifest ${f.bytes}`);
    const sha = crypto.createHash('sha256').update(data).digest('hex');
    if (sha !== f.sha256) throw new Error(`DIAG sha256 ${f.path}`);
    if (/\.(html|js|css|md|txt|svg|webmanifest)$/.test(f.path)) {
      const text = data.toString('utf8');
      if (/sb_secret_[A-Za-z0-9_-]{16,}/.test(text)) throw new Error(`DIAG segredo ${f.path}`);
      const tokens = text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
      for (const token of tokens) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
        if (payload.role === 'service_role') throw new Error(`DIAG jwt service_role ${f.path}`);
      }
      if (f.path.endsWith('.html')) {
        if (!/Content-Security-Policy/.test(text)) throw new Error(`DIAG csp ausente ${f.path}`);
        if (!/script-src 'self'/.test(text)) throw new Error(`DIAG script-src ${f.path}`);
        if (!/name="referrer" content="no-referrer"/.test(text)) throw new Error(`DIAG referrer ${f.path}`);
        if (/<script(?![^>]*\bsrc=)[^>]*>(?!\s*<\/script>)/i.test(text)) throw new Error(`DIAG script inline ${f.path}`);
        for (const m of text.matchAll(/(?:src|href)="([^"]+)"/g)) local(f.path, m[1]);
      }
      if (f.path.endsWith('.js')) {
        for (const m of text.matchAll(/\b(?:from\s*|import\(\s*)["']([^"']+)["']/g)) {
          if (m[1].startsWith('.')) local(f.path, m[1]);
        }
      }
      if (f.path.endsWith('/sw.js')) {
        if (/caches\.(open|match)|cache\.put/.test(text)) throw new Error(`DIAG sw cache ${f.path}`);
      }
    }
    console.log(`DIAG OK ${f.path}`);
  } catch (e) {
    console.log(`DIAG FAIL ${f.path}: ${e.message}`);
    process.exitCode = 1;
  }
}
for (const page of ['index.html','admin/index.html','admin/painel.html','cliente.html','cliente/index.html','cliente/painel.html','login-cliente.html','cadastro-admin.html','cadastro-cliente.html','cliente-demo.html']) {
  if (!files.has(page)) { console.log(`DIAG FAIL pagina ausente: ${page}`); process.exitCode = 1; }
}
console.log('DIAG FIM');
