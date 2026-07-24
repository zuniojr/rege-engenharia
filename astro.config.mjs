import { defineConfig } from 'astro/config';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function avifAutoConverter() {
  return {
    name: 'avif-auto-converter',
    hooks: {
      'astro:config:setup': async () => {
        const imagesDir = path.resolve('./public/images');
        if (!fs.existsSync(imagesDir)) return;
        const files = fs.readdirSync(imagesDir);
        for (const file of files) {
          if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const ext = path.extname(file);
            const base = path.basename(file, ext);
            const inputPath = path.join(imagesDir, file);
            const outputPath = path.join(imagesDir, `${base}.avif`);
            if (!fs.existsSync(outputPath)) {
              try {
                await sharp(inputPath).avif({ quality: 80, effort: 6 }).toFile(outputPath);
                console.log(`[AVIF Converter] Converted ${file} -> ${base}.avif`);
              } catch (e) {
                console.error(`[AVIF Converter] Error converting ${file}:`, e);
              }
            }
          }
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [avifAutoConverter()]
});
