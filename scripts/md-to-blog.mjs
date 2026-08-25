import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const OUT = 'C:/Users/OSMARJ~1/AppData/Local/Temp/opencode/new-posts.json';
const EXCLUDE = new Set(['AGENTS.md', 'CLAUDE.md', 'README.md']);

const { blogPosts } = await import('../src/data/blogPosts.js');
const existingSlugs = new Set(blogPosts.map((p) => String(p.slug).toLowerCase()));

function stripInline(s) {
  return String(s)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\uFFFD/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const IMAGE_RULES = [
  [/(alvar|aprova|prefeitura|licen|codigo.?de.?obras|lc.?416|bombeiro|legaliz)/i, '/images/etapas-aprovacao-prefeitura-bombeiros-cartorio.png'],
  [/(regulariza|habite)/i, '/images/regularizacao.png'],
  [/(laudo|vistoria|pericia|inspe)/i, '/images/analise-estrutura.png'],
  [/(trinca|rachad|estrutur|fundac|recalque|solo|patologia)/i, '/images/Trincas e Rachaduras.png'],
  [/(corros|salinid|maresia|umidade|litoral)/i, '/images/Evitando Corrosão e Umidade em Navegantes.png'],
  [/(energia|solar|eletric|eletric)/i, '/images/Energia Solar.png'],
  [/(reforma|revenda|valoriz|retrofit)/i, '/images/engenheiro-economiza-dinheiro.png'],
  [/(industrial|galpao|galpão)/i, '/images/obra-comercial.png'],
  [/(custo|orcamento|orçamento|financiamento|preco|preço)/i, '/images/Custo Médio de Construção.png'],
  [/(projeto|arquiteton|arquitetônic|bim|topograf|hidrossanitario|hidrossanitário|climatiz)/i, '/images/projeto-arquitetonico.png'],
  [/(residencial|casa|construcao|construção)/i, '/images/obra-residencial.png'],
];
const DEFAULT_IMAGE = '/images/construtora.png';

const TAG_RULES = [
  [/(seguranca do trabalho|segurança do trabalho|\bnr-?\d+|ePI)/i, 'SEGURANÇA DO TRABALHO'],
  [/(incendio|incêndio|avcb)/i, 'SEGURANÇA CONTRA INCÊNDIO'],
  [/(habite|regulariza)/i, 'REGULARIZAÇÃO'],
  [/(licenciamento|ambiental)/i, 'AMBIENTAL'],
  [/(alvar|prefeitura|aprova|licen|codigo de obras|legislac)/i, 'LEGISLAÇÃO'],
  [/(laudo|vistoria|inspe)/i, 'LAUDOS'],
  [/(pericia|perícia)/i, 'PERÍCIA'],
  [/(reforma)/i, 'REFORMAS'],
  [/(custo|orcamento|orçamento|financiamento|valoriz)/i, 'CUSTOS'],
  [/(eletric)/i, 'ELÉTRICA'],
  [/(hidraul|hidrául|vazamento|pressao|pressão|tubulacao|tubulação)/i, 'HIDRÁULICA'],
  [/(climatiz|pmoc|ar.condicionado)/i, 'CLIMATIZAÇÃO'],
  [/(energia|solar)/i, 'ENERGIA'],
  [/(geotecnia|solo|fundac)/i, 'GEOTECNIA'],
  [/(trinca|rachad|patolog|umidad|corros|mofo)/i, 'PATOLOGIA'],
  [/(industrial|galpao|galpão)/i, 'INDUSTRIAL'],
  [/(projeto|bim|arquiteton|arquitetôn|topograf)/i, 'PROJETOS'],
  [/(consultoria|assessoria)/i, 'CONSULTORIA'],
  [/(documenta|art\b|crea)/i, 'DOCUMENTAÇÃO'],
  [/(construcao|construção|obra)/i, 'CONSTRUÇÃO'],
];
const DEFAULT_TAG = 'ENGENHARIA';

function pick(rules, text) {
  for (const [re, val] of rules) if (re.test(text)) return val;
  return null;
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let title = '';
  let paraBuf = [];
  let listBuf = null;
  let orderedBuf = null;
  let quoteBuf = null;
  let table = null;
  let codeBuf = null;

  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push({ type: 'paragraph', text: paraBuf.join(' ').trim() });
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf && listBuf.length) blocks.push({ type: 'list', items: listBuf });
    listBuf = null;
  };
  const flushOrdered = () => {
    if (orderedBuf && orderedBuf.length) blocks.push({ type: 'orderedList', items: orderedBuf });
    orderedBuf = null;
  };
  const flushQuote = () => {
    if (quoteBuf && quoteBuf.length) blocks.push({ type: 'quote', text: quoteBuf.join(' ').trim() });
    quoteBuf = null;
  };
  const flushTable = () => {
    if (table) blocks.push(table);
    table = null;
  };
  const flushCode = () => {
    if (codeBuf) blocks.push({ type: 'code', text: codeBuf.join('\n') });
    codeBuf = null;
  };
  const flushAll = () => {
    flushPara(); flushList(); flushOrdered(); flushQuote(); flushTable(); flushCode();
  };

  const splitRow = (l) =>
    l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      if (codeBuf) { flushAll(); continue; }
      flushAll();
      codeBuf = [];
      continue;
    }
    if (codeBuf) { codeBuf.push(line); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const text = stripInline(h[2]);
      if (h[1].length === 1 && !title) { title = text; continue; }
      blocks.push(h[1].length === 2 ? { type: 'heading', text } : { type: 'subheading', text });
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushAll(); continue; }

    if (/^\s*>/.test(line)) {
      flushPara(); flushList(); flushOrdered(); flushTable();
      (quoteBuf ??= []).push(stripInline(line.replace(/^\s*>\s?/, '')));
      continue;
    }
    flushQuote();

    const cells = line.includes('|') ? splitRow(line) : null;
    if (cells && cells.length >= 2 && cells.every((c) => /^:?-{2,}:?$/.test(c))) {
      flushPara(); flushList(); flushOrdered();
      continue;
    }
    if (cells && cells.length >= 2) {
      flushPara(); flushList(); flushOrdered();
      if (!table) table = { type: 'table', headers: cells.map(stripInline), rows: [] };
      else table.rows.push(cells.map(stripInline));
      continue;
    }
    flushTable();

    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      flushPara(); flushOrdered();
      (listBuf ??= []).push(stripInline(ul[1]));
      continue;
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      flushPara(); flushList();
      (orderedBuf ??= []).push(stripInline(ol[1]));
      continue;
    }
    flushList(); flushOrdered();

    if (!line.trim()) { flushPara(); continue; }
    paraBuf.push(line.trim());
  }
  flushAll();

  return { title, blocks };
}

function buildExcerpt(blocks, title) {
  const p = blocks.find((b) => b.type === 'paragraph' && b.text.length >= 60);
  let base = stripInline(p ? p.text : title);
  if (base.length > 197) {
    const cut = base.slice(0, 197);
    const sentence = cut.lastIndexOf('. ');
    base = sentence > 80 ? cut.slice(0, sentence + 1) : cut.slice(0, cut.lastIndexOf(' '));
  }
  return /[.!?…]$/.test(base) ? base : base + '.';
}

function countWords(blocks) {
  return blocks.reduce((acc, b) => {
    const texts = b.items ? b.items.join(' ') : b.text || '';
    return acc + texts.split(/\s+/).filter(Boolean).length;
  }, 0);
}

const files = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.md') && !EXCLUDE.has(f))
  .sort();

const posts = [];
const skipped = [];
for (const file of files) {
  const base = path.basename(file, '.md');
  const slugBase = slugify(base);
  if (existingSlugs.has(slugBase)) { skipped.push(file); continue; }

  const md = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const { title: h1, blocks } = parseMarkdown(md);
  if (!blocks.length) { console.warn(`[vazio] ${file}`); continue; }

  let slug = slugBase;
  let n = 2;
  while ([...existingSlugs].includes(slug) || posts.some((p) => p.slug === slug)) {
    slug = `${slugBase}-${n++}`;
  }

  const title = h1 || stripInline(base.replace(/-/g, ' '));
  const haystack = `${title} ${base} ${blocks.find((b) => b.type === 'heading')?.text || ''}`;
  const tag = pick(TAG_RULES, haystack) || DEFAULT_TAG;
  const image = pick(IMAGE_RULES, `${base} ${title}`) || DEFAULT_IMAGE;

  posts.push({
    slug,
    title,
    tag,
    image,
    imageAlt: `${stripInline(title)} - artigo técnico da Regê Engenharia sobre ${tag.toLowerCase()} em Navegantes e Litoral Norte de SC.`,
    excerpt: buildExcerpt(blocks, title),
    readTime: `${Math.max(1, Math.round(countWords(blocks) / 200))} min de leitura`,
    featured: false,
    content: blocks,
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8');

console.log(`Novos posts: ${posts.length}`);
console.log(`Ja publicados (ignorados): ${skipped.length}`);
console.log(`Saida: ${OUT}`);
const tags = {};
posts.forEach((p) => (tags[p.tag] = (tags[p.tag] || 0) + 1));
console.log('Tags:', JSON.stringify(tags));
