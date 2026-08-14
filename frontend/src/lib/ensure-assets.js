import fs from 'fs';
import path from 'path';

export function ensureAssets() {
  try {
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    const srcHero = 'C:/Users/asus/.gemini/antigravity-ide/brain/2059e49a-1b60-4632-a926-84815273051e/hero_building_1785125151658.png';
    const srcAvatar = 'C:/Users/asus/.gemini/antigravity-ide/brain/2059e49a-1b60-4632-a926-84815273051e/contact_avatar_1785125162655.png';

    const targetHero = path.join(publicImagesDir, 'hero-building.png');
    const targetAvatar = path.join(publicImagesDir, 'contact-avatar.png');

    if (fs.existsSync(srcHero) && (!fs.existsSync(targetHero) || fs.statSync(targetHero).size === 0)) {
      fs.copyFileSync(srcHero, targetHero);
    }

    if (fs.existsSync(srcAvatar) && (!fs.existsSync(targetAvatar) || fs.statSync(targetAvatar).size === 0)) {
      fs.copyFileSync(srcAvatar, targetAvatar);
    }
  } catch (err) {
    console.error('Error ensuring assets:', err);
  }
}
