import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const standardSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));

// Maskable SVG with full bleed background (no rx rounded corners) and 15% inner safe padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#166534"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <!-- Full bleed background for maskable -->
  <rect width="512" height="512" fill="url(#bg)"/>
  
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Sun -->
    <circle cx="360" cy="150" r="54" fill="url(#sun)" opacity="0.9"/>
    
    <!-- Soil hill -->
    <path d="M64 420 C180 370 332 370 448 420 L448 448 L64 448 Z" fill="#0f391b" opacity="0.6"/>

    <!-- Sprout Stem -->
    <path d="M256 390 C256 310 252 230 264 180" stroke="#bbf7d0" stroke-width="22" stroke-linecap="round" fill="none"/>
    
    <!-- Left Leaf -->
    <path d="M258 270 C200 265 140 210 160 150 C210 145 255 195 258 270 Z" fill="url(#leaf)"/>
    
    <!-- Right Leaf -->
    <path d="M262 220 C320 205 375 140 345 90 C290 100 265 160 262 220 Z" fill="url(#leaf)"/>
  </g>
</svg>`;

async function generate() {
  console.log('Generating PNG icons...');

  // 1. icon-192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // 2. icon-512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // 3. maskable-512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'));

  // 4. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Also root fallbacks for legacy references
  fs.copyFileSync(path.join(iconsDir, 'icon-192.png'), path.join(publicDir, 'pwa-192x192.png'));
  fs.copyFileSync(path.join(iconsDir, 'icon-512.png'), path.join(publicDir, 'pwa-512x512.png'));
  fs.copyFileSync(path.join(iconsDir, 'maskable-512.png'), path.join(publicDir, 'pwa-maskable-512x512.png'));
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon.png'), path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully in public/icons/ and public/!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
