import { ANIMS, STATES, floatyBob } from './frames';
import { SIZE, rasterize } from './raster';
import { getSpecies } from './species';
import type { Accessory, ColorVariant, PetState } from './types';

export interface SpriteSheet {
  canvas: HTMLCanvasElement;
  rows: Record<PetState, { row: number; count: number; frameMs: number; loop: boolean }>;
  /** RGBA per frame, for alpha hit-testing. */
  frames: Record<PetState, Uint8ClampedArray[]>;
}

const cache = new Map<string, SpriteSheet>();

/** Builds (once) a sprite sheet: one row per state, one 32x32 cell per frame. */
export function buildSheet(species: string, variant: ColorVariant, accessory: Accessory): SpriteSheet {
  const key = `${species}|${variant}|${accessory}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sp = getSpecies(species);
  const maxFrames = Math.max(...STATES.map((s) => ANIMS[s].frames.length));
  const canvas = document.createElement('canvas');
  canvas.width = maxFrames * SIZE;
  canvas.height = STATES.length * SIZE;
  const ctx = canvas.getContext('2d')!;
  const rows = {} as SpriteSheet['rows'];
  const frames = {} as SpriteSheet['frames'];
  STATES.forEach((state, row) => {
    const anim = ANIMS[state];
    rows[state] = { row, count: anim.frames.length, frameMs: anim.frameMs, loop: anim.loop };
    frames[state] = anim.frames.map((f, i) => {
      const spec = sp.floaty ? floatyBob(state, i, f) : f;
      const rgba = rasterize(sp, spec, { variant, accessory });
      ctx.putImageData(new ImageData(rgba, SIZE, SIZE), i * SIZE, row * SIZE);
      return rgba;
    });
  });
  const sheet = { canvas, rows, frames };
  cache.set(key, sheet);
  return sheet;
}

/** Draws one frame scaled with crisp pixels. `facing` -1 mirrors horizontally. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  state: PetState,
  frame: number,
  x: number,
  y: number,
  pixel: number,
  facing: 1 | -1,
) {
  const r = sheet.rows[state];
  const f = Math.min(frame, r.count - 1);
  const size = SIZE * pixel;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (facing === -1) {
    ctx.translate(x + size, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet.canvas, f * SIZE, r.row * SIZE, SIZE, SIZE, 0, 0, size, size);
  } else {
    ctx.drawImage(sheet.canvas, f * SIZE, r.row * SIZE, SIZE, SIZE, x, y, size, size);
  }
  ctx.restore();
}

/** True if the sprite pixel under (px, py) (in sprite cells) is opaque, with a 1px grab margin. */
export function hitTest(sheet: SpriteSheet, state: PetState, frame: number, px: number, py: number, facing: 1 | -1): boolean {
  const data = sheet.frames[state][Math.min(frame, sheet.frames[state].length - 1)];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      let x = Math.floor(px) + dx;
      const y = Math.floor(py) + dy;
      if (facing === -1) x = SIZE - 1 - x;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
      if (data[(y * SIZE + x) * 4 + 3] > 0) return true;
    }
  }
  return false;
}
