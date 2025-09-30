import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const optimizeImages = async () => {
  const imageDir = './public/images';
  const files = await fs.readdir(imageDir);
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const inputPath = path.join(imageDir, file);
      const outputPath = path.join(imageDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      console.log(`✅ Optimized ${file} to WebP`);
    }
  }
};

optimizeImages().catch(console.error);