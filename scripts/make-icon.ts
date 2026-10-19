// Generates src-tauri/app-icon.png (1024x1024) from the Mochi sprite, then `tauri icon` derives
// every platform size from it. Run with: npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { ANIMS } from '../src/sprites/frames';
import { SIZE, rasterize } from '../src/sprites/raster';
import { SPECIES } from '../src/sprites/species';

const OUT = 1024;
const sprite = rasterize(SPECIES.mochi, { ...ANIMS.happy.frames[5], cheeks: true }, { accessory: 'none' });
const img = new Uint8Array(OUT * OUT * 4);

// Rounded square with a stepped (pixel) corner and a two-tone background.
const cell = OUT / 32;
for (let y = 0; y < OUT; y++) {
  for (let x = 0; x < OUT; x++) {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const corner = Math.min(gx, 31 - gx) + Math.min(gy, 31 - gy);
    if (corner < 3) continue;
    const i = (y * OUT + x) * 4;
    const top = gy < 20;
    img.set(top ? [255, 207, 74, 255] : [255, 180, 60, 255], i);
    if (corner === 3 || gx === 0 || gy === 0 || gx === 31 || gy === 31) img.set([59, 42, 63, 255], i);
  }
}

// Sprite scaled 26x, centred near the bottom.
const scale = 26;
const ox = Math.floor((OUT - SIZE * scale) / 2);
const oy = OUT - SIZE * scale - 70;
for (let sy = 0; sy < SIZE; sy++) {
  for (let sx = 0; sx < SIZE; sx++) {
    const s = (sy * SIZE + sx) * 4;
    if (!sprite[s + 3]) continue;
    for (let y = 0; y < scale; y++) {
      for (let x = 0; x < scale; x++) {
        const px = ox + sx * scale + x;
        const py = oy + sy * scale + y;
        if (px < 0 || py < 0 || px >= OUT || py >= OUT) continue;
        img.set([sprite[s], sprite[s + 1], sprite[s + 2], 255], (py * OUT + px) * 4);
      }
    }
  }
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(OUT * (OUT * 4 + 1));
for (let y = 0; y < OUT; y++) {
  raw[y * (OUT * 4 + 1)] = 0;
  Buffer.from(img.buffer, y * OUT * 4, OUT * 4).copy(raw, y * (OUT * 4 + 1) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(OUT, 0);
ihdr.writeUInt32BE(OUT, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', new Uint8Array()),
]);
writeFileSync('src-tauri/app-icon.png', png);
console.log('wrote src-tauri/app-icon.png');
