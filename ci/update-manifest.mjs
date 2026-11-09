import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.argv[2] || '.');
const release = process.argv[3];
const manifestPath = path.join(root, 'release-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (release) {
  if (!/^R\d+-\d{4}-\d{2}-\d{2}$/.test(release)) {
    console.error('Release inválida. Use o formato R<n>-AAAA-MM-DD.');
    process.exit(1);
  }
  manifest.release = release;
}

let changed = 0;
manifest.files = manifest.files.map((entry) => {
  const file = path.join(root, entry.path);
  if (!fs.existsSync(file)) {
    console.error(`Arquivo do manifesto não existe: ${entry.path}`);
    process.exit(1);
  }
  const data = fs.readFileSync(file);
  const bytes = data.length;
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  if (bytes !== entry.bytes || sha256 !== entry.sha256) {
    changed++;
    console.log(`atualizado: ${entry.path}`);
  }
  return { ...entry, bytes, sha256 };
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, release: manifest.release, files: manifest.files.length, changed }));
