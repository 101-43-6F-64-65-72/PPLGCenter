const fs = require('fs');
const path = require('path');

const srcHero = 'C:/Users/asus/.gemini/antigravity-ide/brain/2059e49a-1b60-4632-a926-84815273051e/hero_building_1785125151658.png';
const srcAvatar = 'C:/Users/asus/.gemini/antigravity-ide/brain/2059e49a-1b60-4632-a926-84815273051e/contact_avatar_1785125162655.png';

const targetDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(srcHero, path.join(targetDir, 'hero-building.png'));
fs.copyFileSync(srcAvatar, path.join(targetDir, 'contact-avatar.png'));

console.log('Assets copied successfully!');
