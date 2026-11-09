import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(process.argv[2] || '.');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'));
const files = new Map(manifest.files.map((f) => [f.path, f]));
const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };

// 1. Manifesto consistente.
check(/^R\d+-\d{4}-\d{2}-\d{2}$/.test(manifest.release), 'release fora do padrão R<n>-AAAA-MM-DD');
check(files.size === manifest.files.length, 'manifesto contém caminhos duplicados');

// 2. Nada proibido no repositório público.
const bannedExt = /\.(zip|7z|rar|pdf|sql|ts|tsx|cjs|env)$/i;
for (const file of walk(root)) {
  const rel = toPosix(path.relative(root, file));
  if (rel.startsWith('supabase/') || rel.startsWith('docs/') || rel.startsWith('.github/') || rel.startsWith('ci/')) continue;
  check(!bannedExt.test(rel), `arquivo proibido no repositório: ${rel}`);
}

// 3. Assets publicados = assets no disco.
const assetDir = path.join(root, 'assets');
const diskAssets = fs.readdirSync(assetDir).filter((n) => fs.statSync(path.join(assetDir, n)).isFile());
const listedAssets = [...files.keys()].filter((p) => p.startsWith('assets/')).map((p) => p.slice('assets/'.length));
const orphans = diskAssets.filter((n) => !listedAssets.includes(n));
const missing = listedAssets.filter((n) => !diskAssets.includes(n));
check(orphans.length === 0, `assets fora do manifesto: ${orphans.join(', ')}`);
check(missing.length === 0, `assets do manifesto ausentes no disco: ${missing.join(', ')}`);

// 4. Todo arquivo do manifesto existe e nenhum documento interno é publicado.
const privateDirs = /^(docs|supabase|ci|\.github)\//;
for (const rel of files.keys()) {
  check(fs.existsSync(path.join(root, rel)), `arquivo do manifesto não existe: ${rel}`);
  check(!privateDirs.test(rel), `diretório interno não pode ser publicado: ${rel}`);
  check(!/(^|\/)(SECURITY|MUDANCAS)\.md$/i.test(rel), `documento interno não pode ser publicado: ${rel}`);
}

// 5. Sem URLs absolutas do GitHub Pages em links locais (canonical/manifest/img-src).
for (const rel of files.keys()) {
  if (!rel.endsWith('.html')) continue;
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const imgSrc = (text.match(/img-src[^;]+/) || [''])[0];
  check(!imgSrc.includes('horizes.github.io'), `${rel}: CSP img-src ainda fixa o domínio do GitHub Pages`);
  for (const m of text.matchAll(/<link rel="(manifest|canonical)" href="([^"]*)"/g)) {
    check(!m[2].startsWith('http://') && !m[2].startsWith('https://'), `${rel}: ${m[1]} deve ser relativo`);
  }
  check(/<meta http-equiv="Content-Security-Policy"/.test(text), `${rel}: CSP ausente`);
  check(/script-src 'self'/.test(text), `${rel}: CSP sem script-src 'self'`);
}

// 6. Limites de tamanho e tipos por arquivo publicado.
for (const [rel, entry] of files) {
  check(entry.bytes <= 1_500_000, `${rel}: arquivo publicado acima de 1,5 MB (${entry.bytes} bytes)`);
}

if (problems.length) {
  console.error(JSON.stringify({ ok: false, problems }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  release: manifest.release,
  published: files.size,
  assets: listedAssets.length,
  checks: ['manifesto', 'sem zip/pdf/sql', 'sem assets órfãos', 'sem diretório interno publicado', 'links relativos', 'CSP', 'tamanho'],
}));

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else out.push(f);
  }
  return out;
}
function toPosix(p) { return p.split(path.sep).join('/'); }
