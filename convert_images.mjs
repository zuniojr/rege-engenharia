import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = path.resolve('./public/images');

if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(imagesDir, `${base}.avif`);

      const inputStats = fs.statSync(inputPath);
      await sharp(inputPath)
        .avif({ quality: 80, effort: 6 })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      const savedPercent = Math.round((1 - outputStats.size / inputStats.size) * 100);
      console.log(`[AVIF] ${file} (${(inputStats.size/1024).toFixed(1)} KB) -> ${base}.avif (${(outputStats.size/1024).toFixed(1)} KB) - ${savedPercent}% de redução`);
    }
  }
}
