const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_IMAGE = path.join(__dirname, '../public/images/PicsGenics_purple.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate Apple Touch Icon (180x180)
  await sharp(SOURCE_IMAGE)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png');

  // Generate favicon (32x32)
  await sharp(SOURCE_IMAGE)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
  console.log('Generated: favicon-32x32.png');

  // Generate favicon (16x16)
  await sharp(SOURCE_IMAGE)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
  console.log('Generated: favicon-16x16.png');

  // Generate ICO file (multiple sizes combined)
  // For favicon.ico, we'll generate a 48x48 PNG that can be renamed/converted
  await sharp(SOURCE_IMAGE)
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-48x48.png'));
  console.log('Generated: favicon-48x48.png');

  // Generate screenshots for install prompt
  // Wide screenshot (1280x720)
  await sharp(SOURCE_IMAGE)
    .resize(400, 400, {
      fit: 'contain',
      background: { r: 124, g: 58, b: 237, alpha: 1 },
    })
    .extend({
      top: 160,
      bottom: 160,
      left: 440,
      right: 440,
      background: { r: 124, g: 58, b: 237, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'screenshot-wide.png'));
  console.log('Generated: screenshot-wide.png');

  // Narrow screenshot (720x1280)
  await sharp(SOURCE_IMAGE)
    .resize(400, 400, {
      fit: 'contain',
      background: { r: 124, g: 58, b: 237, alpha: 1 },
    })
    .extend({
      top: 440,
      bottom: 440,
      left: 160,
      right: 160,
      background: { r: 124, g: 58, b: 237, alpha: 1 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'screenshot-narrow.png'));
  console.log('Generated: screenshot-narrow.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
