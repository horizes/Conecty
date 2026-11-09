import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2]||'.'),manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
assert.match(manifest.release,/^R[0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$/);assert.ok(Array.isArray(manifest.files));
const files=new Set(manifest.files.map(f=>f.path));
function local(base,target){if(/^(https?:|data:|#|mailto:|tel:)/.test(target))return;const name=path.posix.normalize(path.posix.join(path.posix.dirname(base),target.split(/[?#]/)[0]));assert.ok(!name.startsWith('../'),'Referência fora da publicação: '+name);assert.ok(files.has(name),'Arquivo ausente: '+name)}
for(const f of manifest.files){assert.ok(!f.path.includes('..')&&!path.isAbsolute(f.path));assert.ok(!/\.(sql|ts|tsx|cjs|env|zip)$/i.test(f.path),'Arquivo privado na publicação: '+f.path);const data=fs.readFileSync(path.join(root,f.path));assert.equal(data.length,f.bytes,f.path);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),f.sha256,f.path);
 if(/\.(html|js|css|md|txt|svg|webmanifest)$/.test(f.path)){const text=data.toString('utf8');assert.equal(/sb_secret_[A-Za-z0-9_-]{16,}/.test(text),false,'Chave de servidor detectada');for(const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)||[])try{assert.notEqual(JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role,'service_role')}catch(e){if(e.code==='ERR_ASSERTION')throw e}
  if(f.path.endsWith('.html')){assert.match(text,/Content-Security-Policy/);assert.match(text,/script-src 'self'/);assert.match(text,/name="referrer" content="no-referrer"/);assert.equal(/<script(?![^>]*\bsrc=)[^>]*>(?!\s*<\/script>)/i.test(text),false,'Script inline não autorizado');for(const m of text.matchAll(/(?:src|href)="([^"]+)"/g))local(f.path,m[1])}
  if(f.path.endsWith('.js'))for(const m of text.matchAll(/\b(?:from\s*|import\(\s*)["']([^"']+)["']/g))if(m[1].startsWith('.'))local(f.path,m[1]);
  if(f.path.endsWith('/sw.js'))assert.equal(/caches\.(open|match)|cache\.put/.test(text),false,'Service worker não pode armazenar dados pessoais');
 }
}
for(const page of ['index.html','admin/index.html','admin/painel.html','cliente.html','cliente/index.html','cliente/painel.html','login-cliente.html','cadastro-admin.html','cadastro-cliente.html','cliente-demo.html'])assert.ok(files.has(page));
console.log(JSON.stringify({verified:true,release:manifest.release,files:files.size,checks:['hashes','no private backend files','no server credentials','CSP','external scripts','valid asset references','PWA without private cache']}));
