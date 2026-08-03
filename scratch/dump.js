const fs = require('fs');
const m = fs.readFileSync('src/data/blogPosts.js', 'utf8');
const idx = m.indexOf('Entenda o Processo de Licenciamento Ambiental');
const sliceStart = m.lastIndexOf('  {', idx);
const slice = m.slice(sliceStart, sliceStart + 8500);
console.log(slice);
