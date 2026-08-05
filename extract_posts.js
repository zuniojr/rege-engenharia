import { blogPosts } from './src/data/blogPosts.js';
import { writeFileSync } from 'fs';

const lines = ['URL,Imagem,Titulo'];

for (const post of blogPosts) {
  const url = `https://www.regeengenharia.com.br/blog/${post.slug}`;
  // Garante que a imagem tenha a URL completa se for um caminho relativo
  let image = post.image || '';
  if (image.startsWith('/')) {
    image = `https://www.regeengenharia.com.br${image}`;
  }
  
  // Escapa aspas duplas no título e envolve a string em aspas duplas para o CSV
  const safeTitle = post.title ? post.title.replace(/"/g, '""') : '';
  const titleCsv = `"${safeTitle}"`;
  
  lines.push(`${url},${image},${titleCsv}`);
}

writeFileSync('artigos_blog.csv', '\uFEFF' + lines.join('\n'), 'utf8');
console.log(`Total: ${blogPosts.length} artigos exportados para artigos_blog.csv`);
