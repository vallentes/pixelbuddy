// Dev helper: renders every pixel-art species (idle frame) into one PNG for a quick visual check.
// Run with: npx vite-node scripts/pixel-sheet.ts <out.png>
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { ANIMS } from '../src/sprites/frames';
import { SIZE, rasterize } from '../src/sprites/raster';
import { SPECIES_LIST } from '../src/sprites/species';

const scale = 6;
const cols = 5;
const rows = Math.ceil(SPECIES_LIST.length / cols);
const W = cols * SIZE * scale;
const H = rows * SIZE * scale;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) img.set([40, 60, 140, 255], i * 4);
SPECIES_LIST.forEach((sp, n) => {
  const f = rasterize(sp, { ...ANIMS.idle.frames[0] });
  const ox = (n % cols) * SIZE * scale;
  const oy = Math.floor(n / cols) * SIZE * scale;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const s = (y * SIZE + x) * 4;
      if (!f[s + 3]) continue;
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) img.set([f[s], f[s + 1], f[s + 2], 255], ((oy + y * scale + dy) * W + ox + x * scale + dx) * 4);
    }
});
function crc32(buf: Uint8Array) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
const chunk = (t: string, d: Uint8Array) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t), Buffer.from(d)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const raw = Buffer.alloc(H * (W * 4 + 1));
for (let y = 0; y < H; y++) Buffer.from(img.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;
writeFileSync(process.argv[2] ?? 'pixel-sheet.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())]));
