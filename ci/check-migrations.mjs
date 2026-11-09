import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const dir = path.join(root, 'supabase', 'migrations');
const problems = [];

if (!fs.existsSync(dir)) {
  console.error('Diretório supabase/migrations não encontrado.');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.error('Nenhuma migration encontrada.');
  process.exit(1);
}

let previous = '';
for (const file of files) {
  if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(file)) {
    problems.push(`${file}: nome deve seguir AAAAmmddHHMMSS_descricao.sql`);
  }
  if (file <= previous) {
    problems.push(`${file}: ordem/duplicidade de timestamp em relação a ${previous}`);
  }
  previous = file;

  const sql = fs.readFileSync(path.join(dir, file), 'utf8');
  const lower = sql.toLowerCase();

  if (/\bsecurity\s+definer\b/.test(lower) && !/set\s+search_path\s*=/.test(lower)) {
    problems.push(`${file}: função SECURITY DEFINER sem SET search_path`);
  }
  if (/\bdrop\s+table\s+(?!if\s+exists)/.test(lower)) {
    problems.push(`${file}: DROP TABLE sem IF EXISTS`);
  }
  if (/\btruncate\b/.test(lower)) {
    problems.push(`${file}: TRUNCATE não é permitido em migration`);
  }
  if (/\b(service_role_key|sb_secret_|supabase_service_role)\b/.test(lower)) {
    problems.push(`${file}: possível segredo de servidor no SQL`);
  }
  if (/\bgrant\s+[^;]*\bto\s+(anon|public)\b/.test(lower)) {
    problems.push(`${file}: GRANT para anon/public — revise o menor privilégio`);
  }
}

if (problems.length) {
  console.error(JSON.stringify({ ok: false, problems }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, migrations: files.length, checks: ['nome', 'ordem', 'search_path', 'sem drop destrutivo', 'sem segredo', 'sem grant anon'] }));
