import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distAssetsDir = join(process.cwd(), 'dist', 'assets');
const publicManifestFile = join(process.cwd(), 'public', 'precache-manifest.json');
const distManifestFile = join(process.cwd(), 'dist', 'precache-manifest.json');

try {
  let assetFiles = [];
  if (existsSync(distAssetsDir)) {
    const files = readdirSync(distAssetsDir);
    assetFiles = files
      .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
      .map((file) => `assets/${file}`);
  }

  const manifestJson = JSON.stringify(assetFiles, null, 2);
  writeFileSync(publicManifestFile, manifestJson, 'utf8');
  if (existsSync(join(process.cwd(), 'dist'))) {
    writeFileSync(distManifestFile, manifestJson, 'utf8');
  }
  console.log(`[PWA Build Hook] Stamped precache-manifest.json with ${assetFiles.length} production assets:`, assetFiles);
} catch (err) {
  console.warn('[PWA Build Hook] Warning generating precache manifest:', err);
}
