/**
 * generate-manifest.js — scan images/<slot-id>/ folders and write a manifest
 * the browser can read on any host (Netlify included).
 *
 * Runs at build time (Netlify build command, or manually: `node generate-manifest.js`).
 * For each folder under images/, it records the image files found, so
 * folder-images.js can look up the right picture without relying on a live
 * directory listing (which Netlify does not serve).
 *
 * Output: images/manifest.json  ->  { "slot-id": ["photo.jpg"], ... }
 * Only the first image per folder is used by the page, but we list all so a
 * future gallery could show more.
 */
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');
const OUT = path.join(IMAGES_DIR, 'manifest.json');
const IMG_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

function build() {
  const manifest = {};

  if (!fs.existsSync(IMAGES_DIR)) {
    console.warn('[manifest] images/ not found — writing empty manifest.');
    fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
    return;
  }

  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slotId = entry.name;
    const dir = path.join(IMAGES_DIR, slotId);
    const files = fs
      .readdirSync(dir)
      .filter((f) => IMG_RE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (files.length) manifest[slotId] = files;
  }

  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  const total = Object.values(manifest).reduce((n, a) => n + a.length, 0);
  console.log(
    `[manifest] wrote ${OUT} — ${Object.keys(manifest).length} folder(s), ${total} image(s).`
  );
}

build();
