#!/usr/bin/env node
// Generates all favicon/icon assets for Pentagonize.
// Requires: rsvg-convert (brew install librsvg)
// Usage: node generate-icons.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------- SVG ----------
// Board: 512x512, 3×3 tiles each with 2×2 marble slots.
// Visual matches game.ts: dark-maroon board bg, bright-red tiles, darkred/darkblue marbles.
// Red marbles form the 5-in-a-row main-diagonal win.

const BOARD_ORIGIN = 22;
const BOARD_SIZE   = 468; // 3 × 156
const TILE_SIZE    = 156;
const GAP          = 8;
const TILE_INNER   = TILE_SIZE - GAP * 2; // 140
const RADIUS       = Math.round(TILE_SIZE / 5); // 31
const GLINT_RADIUS = Math.round(RADIUS * 0.42); // 13
const GLINT_OFFSET = Math.round(RADIUS * 0.28); // 9

// Slot centre coordinates
function slotCX(tc, sc) {
  return BOARD_ORIGIN + tc * TILE_SIZE + (sc === 0 ? Math.round(TILE_SIZE / 4) : Math.round(TILE_SIZE * 3 / 4));
}
function slotCY(tr, sr) {
  return BOARD_ORIGIN + tr * TILE_SIZE + (sr === 0 ? Math.round(TILE_SIZE / 4) : Math.round(TILE_SIZE * 3 / 4));
}

// Marble placement
const RED  = new Set(); // "cx,cy"
const BLUE = new Set();

// Red: 5-in-a-row on main diagonal (absolute slot col == absolute slot row)
[[0,0,0,0],[0,0,1,1],[1,1,0,0],[1,1,1,1],[2,2,0,0]].forEach(([tc,tr,sc,sr]) =>
  RED.add(`${slotCX(tc,sc)},${slotCY(tr,sr)}`));

// Blue: 4 scattered marbles
[[2,0,1,0],[1,0,0,1],[0,2,1,0],[2,1,0,1]].forEach(([tc,tr,sc,sr]) =>
  BLUE.add(`${slotCX(tc,sc)},${slotCY(tr,sr)}`));

function marbleCircles() {
  const parts = [];
  for (let tr = 0; tr < 3; tr++) {
    for (let tc = 0; tc < 3; tc++) {
      for (let sr = 0; sr < 2; sr++) {
        for (let sc = 0; sc < 2; sc++) {
          const cx = slotCX(tc, sc);
          const cy = slotCY(tr, sr);
          const key = `${cx},${cy}`;
          if (RED.has(key)) {
            parts.push(
              `<circle cx="${cx}" cy="${cy}" r="${RADIUS}" fill="url(#rm)"/>`,
              `<circle cx="${cx - GLINT_OFFSET}" cy="${cy - GLINT_OFFSET}" r="${GLINT_RADIUS}" fill="rgba(255,255,255,0.30)"/>`
            );
          } else if (BLUE.has(key)) {
            parts.push(
              `<circle cx="${cx}" cy="${cy}" r="${RADIUS}" fill="url(#bm)"/>`,
              `<circle cx="${cx - GLINT_OFFSET}" cy="${cy - GLINT_OFFSET}" r="${GLINT_RADIUS}" fill="rgba(255,255,255,0.30)"/>`
            );
          } else {
            parts.push(`<circle cx="${cx}" cy="${cy}" r="${RADIUS}" fill="url(#em)"/>`);
          }
        }
      }
    }
  }
  return parts.join('\n  ');
}

function tileRects() {
  const rects = [];
  for (let tr = 0; tr < 3; tr++) {
    for (let tc = 0; tc < 3; tc++) {
      const x = BOARD_ORIGIN + tc * TILE_SIZE + GAP;
      const y = BOARD_ORIGIN + tr * TILE_SIZE + GAP;
      rects.push(`<rect x="${x}" y="${y}" width="${TILE_INNER}" height="${TILE_INNER}" fill="#ff3632" rx="3"/>`);
    }
  }
  return rects.join('\n  ');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="em" cx="38%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#070707"/>
      <stop offset="100%" stop-color="#555"/>
    </radialGradient>
    <radialGradient id="rm" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#c02020"/>
      <stop offset="100%" stop-color="#4a0000"/>
    </radialGradient>
    <radialGradient id="bm" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#2020c0"/>
      <stop offset="100%" stop-color="#00004a"/>
    </radialGradient>
  </defs>
  <!-- Board background (dark maroon gap colour) -->
  <rect x="${BOARD_ORIGIN}" y="${BOARD_ORIGIN}" width="${BOARD_SIZE}" height="${BOARD_SIZE}" fill="#6b0b0b" rx="10"/>
  <!-- 3×3 tiles -->
  ${tileRects()}
  <!-- Marble slots -->
  ${marbleCircles()}
</svg>`;

// ---------- write files ----------
const TMP_SVG   = '/tmp/pentagonize-icon.svg';
const ICONS_DIR = path.join(__dirname, 'public/img/icons');
const PUBLIC    = path.join(__dirname, 'public');

fs.writeFileSync(TMP_SVG, svg);
console.log('SVG written to', TMP_SVG);

const pngSizes = [
  { name: 'icon.png',                           w: 512 },
  { name: 'android-chrome-512x512.png',          w: 512 },
  { name: 'android-chrome-192x192.png',          w: 192 },
  { name: 'android-chrome-maskable-512x512.png', w: 512 },
  { name: 'android-chrome-maskable-192x192.png', w: 192 },
  { name: 'apple-touch-icon-152x152.png',        w: 152 },
  { name: 'msapplication-icon-144x144.png',      w: 144 },
  { name: 'favicon-32x32.png',                   w: 32  },
  { name: 'favicon-16x16.png',                   w: 16  },
];

for (const { name, w } of pngSizes) {
  const out = path.join(ICONS_DIR, name);
  execSync(`rsvg-convert -w ${w} -h ${w} "${TMP_SVG}" -o "${out}"`);
  console.log('Generated', name);
}

// ---------- favicon.ico (embedded PNGs: 16 + 32) ----------
const png16 = fs.readFileSync(path.join(ICONS_DIR, 'favicon-16x16.png'));
const png32 = fs.readFileSync(path.join(ICONS_DIR, 'favicon-32x32.png'));

const HEADER_SIZE  = 6;
const ENTRY_SIZE   = 16;
const DIR_SIZE     = HEADER_SIZE + 2 * ENTRY_SIZE;

const header = Buffer.alloc(HEADER_SIZE);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type ICO
header.writeUInt16LE(2, 4); // 2 images

const entry16 = Buffer.alloc(ENTRY_SIZE);
entry16.writeUInt8(16, 0);
entry16.writeUInt8(16, 1);
entry16.writeUInt8(0, 2);
entry16.writeUInt8(0, 3);
entry16.writeUInt16LE(1, 4);
entry16.writeUInt16LE(32, 6);
entry16.writeUInt32LE(png16.length, 8);
entry16.writeUInt32LE(DIR_SIZE, 12);

const entry32 = Buffer.alloc(ENTRY_SIZE);
entry32.writeUInt8(32, 0);
entry32.writeUInt8(32, 1);
entry32.writeUInt8(0, 2);
entry32.writeUInt8(0, 3);
entry32.writeUInt16LE(1, 4);
entry32.writeUInt16LE(32, 6);
entry32.writeUInt32LE(png32.length, 8);
entry32.writeUInt32LE(DIR_SIZE + png16.length, 12);

const ico = Buffer.concat([header, entry16, entry32, png16, png32]);
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico);
console.log('Generated favicon.ico');

console.log('\nDone. All icons updated.');
