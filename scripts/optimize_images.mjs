import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = path.resolve('raw_images');
const outputDir = path.resolve('public/servicios');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

console.log(`Found ${files.length} images to optimize.`);

async function processImages() {
  let count = 0;
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.webp`);

    try {
      // Scale to max width 1080 (maintaining 3:4 aspect, e.g. 1080x1440), convert to webp quality 82
      await sharp(inputPath)
        .resize({
          width: 1080,
          withoutEnlargement: true
        })
        .webp({ quality: 82, effort: 4 })
        .toFile(outputPath);

      const inStat = fs.statSync(inputPath);
      const outStat = fs.statSync(outputPath);
      const reduction = ((1 - outStat.size / inStat.size) * 100).toFixed(1);
      count++;
      console.log(`[${count}/${files.length}] ${file} -> ${baseName}.webp (${Math.round(inStat.size / 1024)}KB -> ${Math.round(outStat.size / 1024)}KB, -${reduction}%)`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
  console.log(`\nSuccessfully converted and optimized ${count} images into /public/servicios/`);
}

processImages();
