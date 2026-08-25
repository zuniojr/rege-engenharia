import fs from 'node:fs';
import { blogPosts } from '../src/data/blogPosts.js';

const csvPath = 'artigos_blog.csv';
const buf = fs.readFileSync(csvPath);
let csv = buf.toString('utf8');
if (csv.includes('\uFFFD')) console.log('AVISO: CSV não está em UTF-8 válido');

const have = new Set([...csv.matchAll(/blog\/([a-z0-9-]+)/g)].map((m) => m[1]));
const missing = blogPosts.filter((p) => !have.has(p.slug));
console.log('No CSV:', have.size, '| Faltando:', missing.length);
if (!missing.length) process.exit(0);

const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const base = 'https://www.regeengenharia.com.br';
const lines = missing.map((p) => [`${base}/blog/${p.slug}`, `${base}${p.image.split(' ').map(enc).join('%20')}`, esc(p.title)].join(','));

fs.writeFileSync(csvPath, csv.replace(/\r?\n$/, '') + '\n' + lines.join('\n') + '\n', 'utf8');
console.log('Linhas adicionadas:', lines.length);
