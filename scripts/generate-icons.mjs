/**
 * Script: Convert SVG icons to PNG for @capacitor/assets and Android notification icon.
 * Uses 'sharp' library for SVG-to-PNG rendering.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, '..', 'resources');

async function convertSvgToPng(svgFile, pngFile, size) {
  const svgBuffer = fs.readFileSync(path.join(resourcesDir, svgFile));
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(resourcesDir, pngFile));
  console.log(`  ✓ ${svgFile} → ${pngFile} (${size}x${size})`);
}

// Android notification icon sizes per density
const notifDensities = [
  { name: 'mdpi', size: 24 },
  { name: 'hdpi', size: 36 },
  { name: 'xhdpi', size: 48 },
  { name: 'xxhdpi', size: 72 },
  { name: 'xxxhdpi', size: 96 },
];

async function main() {
  console.log('🎨 Converting SVG icons to PNG...\n');

  // 1. Main icon (for @capacitor/assets)
  await convertSvgToPng('icon.svg', 'icon.png', 1024);

  // 2. Foreground layer (for adaptive icon)
  await convertSvgToPng('icon-foreground.svg', 'icon-foreground.png', 1024);

  // 3. Background layer (for adaptive icon)
  await convertSvgToPng('icon-background.svg', 'icon-background.png', 1024);

  // 4. Notification icon at all densities → placed directly into android res
  console.log('\n📱 Generating notification icons per density...');
  const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

  for (const { name: density, size } of notifDensities) {
    const drawableDir = path.join(androidResDir, `drawable-${density}`);
    if (!fs.existsSync(drawableDir)) {
      fs.mkdirSync(drawableDir, { recursive: true });
    }
    const svgBuffer = fs.readFileSync(path.join(resourcesDir, 'ic_stat_puncak.svg'));
    const outFile = path.join(drawableDir, 'ic_stat_puncak.png');
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outFile);
    console.log(`  ✓ drawable-${density}/ic_stat_puncak.png (${size}x${size})`);
  }

  console.log('\n✅ All icons generated successfully!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
