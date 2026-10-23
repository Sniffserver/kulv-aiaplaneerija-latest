import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download relevant woff2 files
async function fetchAndSave(url, filename) {
  console.log(`Downloading ${filename} from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(path.join(fontsDir, filename), Buffer.from(buf));
  console.log(`Saved ${filename} (${buf.byteLength} bytes)`);
}

async function main() {
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
  const res = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const cssText = await res.text();

  // Parse font-face rules
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  let match;
  let index = 0;
  let localCss = '';

  while ((match = fontFaceRegex.exec(cssText)) !== null) {
    const block = match[1];
    const familyMatch = block.match(/font-family:\s*['"]?([^'";]+)['"]?/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);

    if (familyMatch && urlMatch) {
      const family = familyMatch[1].trim();
      const style = styleMatch ? styleMatch[1].trim() : 'normal';
      const weight = weightMatch ? weightMatch[1].trim() : '400';
      const url = urlMatch[1].trim();
      const range = rangeMatch ? rangeMatch[1].trim() : '';

      // We only need latin and latin-ext (skip cyrillic, greek, vietnamese)
      // Latin range has U+0000-00FF, Latin-ext has U+0100-02BA or U+0100-024F
      const isLatinOrExt = !range || range.includes('U+0000-00FF') || range.includes('U+0100') || range.includes('U+0020');
      if (!isLatinOrExt) {
        continue;
      }

      const slugFamily = family.toLowerCase().replace(/\s+/g, '-');
      const filename = `${slugFamily}-${style}-${weight.replace(/\s+/g, '')}-${index++}.woff2`;

      try {
        await fetchAndSave(url, filename);
        localCss += `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: ${range};
}\n\n`;
      } catch (err) {
        console.error(`Error downloading ${filename}:`, err);
      }
    }
  }

  fs.writeFileSync(path.resolve('src/fonts.css'), localCss);
  console.log('src/fonts.css written with local font rules!');
}

main().catch(console.error);
