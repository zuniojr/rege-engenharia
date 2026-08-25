import fs from 'node:fs';
import path from 'node:path';

const DATA = path.resolve(process.cwd(), 'src/data/blogPosts.js');
const PENDING = 'C:/Users/OSMARJ~1/AppData/Local/Temp/opencode/new-posts.json';

const take = Number(process.argv[2] || 28);

const pending = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
if (!pending.length) {
  console.log('Nada pendente.');
  process.exit(0);
}
const batch = pending.slice(0, take);
console.log(`Mesclando ${batch.length} posts (restantes: ${pending.length})...`);

const src = fs.readFileSync(DATA, 'utf8');
const existingSlugs = [...src.matchAll(/\bslug:\s*'([^']+)'/g)].map((m) => m[1].toLowerCase());
for (const p of batch) {
  if (existingSlugs.includes(p.slug.toLowerCase())) {
    console.error(`ERRO: slug duplicado no arquivo: ${p.slug}`);
    process.exit(1);
  }
}

const q = (s) =>
  "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

function serBlock(b, indent) {
  const pad = ' '.repeat(indent + 4);
  if (b.type === 'list' || b.type === 'orderedList') {
    return `${pad}{\n${pad}  type: '${b.type}',\n${pad}  items: [\n${b.items
      .map((i) => `${pad}    ${q(i)}`)
      .join(',\n')}\n${pad}  ]\n${pad}}`;
  }
  if (b.type === 'table') {
    return `${pad}{\n${pad}  type: 'table',\n${pad}  headers: [${b.headers
      .map(q)
      .join(', ')}],\n${pad}  rows: [\n${b.rows
      .map((r) => `${pad}    [${r.map(q).join(', ')}]`)
      .join(',\n')}\n${pad}  ]\n${pad}}`;
  }
  return `${pad}{\n${pad}  type: '${b.type}',\n${pad}  text: ${q(b.text)}\n${pad}}`;
}

function serPost(p) {
  const meta = [
    `slug: ${q(p.slug)}`,
    `title: ${q(p.title)}`,
    `tag: ${q(p.tag)}`,
    `image: ${q(p.image)}`,
    `imageAlt: ${q(p.imageAlt)}`,
    `excerpt: ${q(p.excerpt)}`,
    `readTime: ${q(p.readTime)}`,
    `featured: false`,
  ]
    .map((l) => `    ${l}`)
    .join(',\n');
  const blocks = p.content.map((b) => serBlock(b, 4)).join(',\n');
  return `  {\n${meta},\n    content: [\n${blocks}\n    ]\n  }`;
}

const anchor = src.lastIndexOf('];');
if (anchor === -1) { console.error('ERRO: ancora ]; nao encontrada'); process.exit(1); }
const insertion = batch.map(serPost).join(',\n');
const next = src.slice(0, anchor).replace(/,\s*$/, ',\n') + insertion + ',\n' + src.slice(anchor);

fs.writeFileSync(path.join(process.cwd(), 'scripts/.merge-backup.js'), src, 'utf8');
fs.writeFileSync(DATA, next, 'utf8');

try {
  const mod = await import(`../src/data/blogPosts.js?t=${Date.now()}`);
  console.log(`Validacao OK - total de posts agora: ${mod.blogPosts.length}`);
} catch (e) {
  fs.writeFileSync(DATA, src, 'utf8');
  console.error('FALHA na validacao, revertido:', e.message);
  process.exit(1);
}

const rest = pending.slice(batch.length);
fs.writeFileSync(PENDING, JSON.stringify(rest, null, 2), 'utf8');
console.log(`Pendente restante: ${rest.length}`);
