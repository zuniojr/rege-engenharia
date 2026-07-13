const fs = require('fs');
const path = require('path');

const mappings = [
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\hero_rege_1783966050622.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'hero-rege.png')
  },
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\obra_residencial_1783966067450.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'obra-residencial.png')
  },
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\projeto_arquitetonico_1783966075287.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'projeto-arquitetonico.png')
  },
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\obra_comercial_1783966087199.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'obra-comercial.png')
  },
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\regularizacao_1783966095687.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'regularizacao.png')
  },
  {
    src: "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\eacc2e37-5c56-428a-8870-c6a9da378946\\sobre_nos_1783966600897.png",
    dest: path.join(__dirname, '..', 'public', 'images', 'sobre-nos.png')
  }
];

const destFolder = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(destFolder)) {
  fs.mkdirSync(destFolder, { recursive: true });
}

mappings.forEach(mapping => {
  try {
    if (fs.existsSync(mapping.src)) {
      fs.copyFileSync(mapping.src, mapping.dest);
      console.log(`Successfully copied ${path.basename(mapping.src)} to ${path.basename(mapping.dest)}`);
    } else {
      console.warn(`Source file not found: ${mapping.src}`);
    }
  } catch (err) {
    console.error(`Error copying ${path.basename(mapping.src)}:`, err.message);
  }
});
