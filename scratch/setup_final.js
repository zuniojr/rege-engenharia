const fs = require('fs');
const path = require('path');

console.log("=== INICIANDO SETUP FINAL DA REGÊ ENGENHARIA ===");

// 1. Cópia das Imagens
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

console.log("\n[1/2] Copiando imagens geradas por IA...");
mappings.forEach(mapping => {
  try {
    if (fs.existsSync(mapping.src)) {
      fs.copyFileSync(mapping.src, mapping.dest);
      console.log(`✓ Copiado: ${path.basename(mapping.dest)}`);
    } else {
      console.warn(`✗ Arquivo de origem não encontrado: ${mapping.src}`);
    }
  } catch (err) {
    console.error(`✗ Erro ao copiar ${path.basename(mapping.src)}:`, err.message);
  }
});

// 2. Limpeza da pasta dist antiga
const distFolder = path.join(__dirname, '..', 'dist');
console.log("\n[2/2] Limpando pasta de build antiga (dist/)...");
if (fs.existsSync(distFolder)) {
  try {
    fs.rmSync(distFolder, { recursive: true, force: true });
    console.log("✓ Pasta dist/ antiga removida com sucesso!");
  } catch (err) {
    console.error("✗ Erro ao remover pasta dist/:", err.message);
  }
} else {
  console.log("✓ Nenhuma pasta dist/ antiga para limpar.");
}

console.log("\n=== SETUP CONCLUÍDO COM SUCESSO! ===");
console.log("Agora execute no seu terminal:");
console.log("  npm run build");
console.log("=================================================");
