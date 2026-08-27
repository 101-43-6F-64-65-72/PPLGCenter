import fs from 'fs';
import path from 'path';

export function ensureAssets() {
  try {
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    const srcSinarmas = 'C:/Users/asus/.gemini/antigravity-ide/brain/7ceaa7cc-dd47-4a6d-8cda-d96210f8bcbd/.user_uploaded/media_1787788580900.jpg';
    const targetSinarmas = path.join(publicImagesDir, 'gedung-sinarmas.jpg');

    if (fs.existsSync(srcSinarmas) && (!fs.existsSync(targetSinarmas) || fs.statSync(targetSinarmas).size === 0)) {
      fs.copyFileSync(srcSinarmas, targetSinarmas);
    }
  } catch (err) {
    console.error('Error ensuring assets:', err);
  }
}
