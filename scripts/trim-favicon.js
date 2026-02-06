/**
 * Trims transparent pixels from the favicon and outputs a 32x32 favicon
 * that uses only the non-transparent content (cropped to content bounds,
 * then scaled to fit and centered in 32x32).
 *
 * Run: node scripts/trim-favicon.js
 *
 * Uses: public/favicon-32x32.png (or public/logo.png) as input,
 * overwrites public/favicon-32x32.png with trimmed result.
 */

import { Jimp, ResizeStrategy } from 'jimp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const ALPHA_THRESHOLD = 10; // pixels with alpha <= this are considered transparent
const FAVICON_SIZE = 32;

const inputPath = path.join(PUBLIC, 'favicon-32x32.png');
const outputPath = path.join(PUBLIC, 'favicon-32x32.png');

// Prefer logo.png if it exists (more detail to trim from)
const logoPath = path.join(PUBLIC, 'logo.png');
const sourcePath = fs.existsSync(logoPath) ? logoPath : inputPath;

function getTransparentBounds(img) {
  const { width, height, data } = img.bitmap;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  if (w <= 0 || h <= 0) return null;
  return { x: minX, y: minY, w, h };
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error('No source image found at', sourcePath);
    process.exit(1);
  }

  const img = await Jimp.read(sourcePath);
  const bounds = getTransparentBounds(img);
  if (!bounds) {
    console.error('No non-transparent content found in image.');
    process.exit(1);
  }

  const cropped = img.clone().crop(bounds);

  const scale = Math.min(FAVICON_SIZE / bounds.w, FAVICON_SIZE / bounds.h, 1);
  const scaledW = Math.round(bounds.w * scale);
  const scaledH = Math.round(bounds.h * scale);
  const offsetX = Math.round((FAVICON_SIZE - scaledW) / 2);
  const offsetY = Math.round((FAVICON_SIZE - scaledH) / 2);

  cropped.resize({ w: scaledW, h: scaledH, mode: ResizeStrategy.BILINEAR });

  const output = new Jimp({
    width: FAVICON_SIZE,
    height: FAVICON_SIZE,
    color: 0x00000000,
  });
  output.blit({ src: cropped, x: offsetX, y: offsetY });
  await output.write(outputPath);

  console.log('Trimmed favicon written to', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
