// Converts the (large) PNG/JPG scenario backdrops to WebP in place, dramatically cutting the
// page-load size without a visible quality drop (WebP at q80 is visually near-identical to the
// originals for these stylised backdrops, which sit blurred behind in-game content).
//
// Run:  node scripts/optimize-images.mjs
// The original .png/.jpg files are left untouched; the new .webp files sit alongside them and
// src/data/scenarioImages.ts points at them. If you regenerate an original, re-run this script.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenariosDir = path.resolve(__dirname, '../src/assets/scenarios');

const IMG_EXT = /\.(png|jpe?g)$/i;
const QUALITY = 80;

async function main() {
  const files = (await readdir(scenariosDir)).filter((f) => IMG_EXT.test(f));
  if (files.length === 0) {
    console.log('No source images found to convert.');
    return;
  }

  const rows = [];
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const input = path.join(scenariosDir, file);
    const output = path.join(scenariosDir, file.replace(IMG_EXT, '.webp'));
    const before = (await stat(input)).size;
    await sharp(input).webp({ quality: QUALITY, effort: 6 }).toFile(output);
    const after = (await stat(output)).size;
    totalBefore += before;
    totalAfter += after;
    rows.push({
      file: `${file} -> ${path.basename(output)}`,
      beforeKB: Math.round(before / 1024),
      afterKB: Math.round(after / 1024),
      savedPct: `${Math.round((1 - after / before) * 100)}%`,
    });
  }

  console.table(rows);
  console.log(
    `Total ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB ` +
      `(${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller) across ${files.length} images.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
