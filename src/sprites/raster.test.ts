import { describe, expect, it } from 'vitest';
import { ACCESSORY_LIST } from './bitmaps';
import { ANIMS, STATES } from './frames';
import { VARIANTS, variantPalette } from './palette';
import { SIZE, rasterize, rasterizeGrid } from './raster';
import { SPECIES_LIST } from './species';

const opaque = (rgba: Uint8ClampedArray) => {
  let n = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) n++;
  return n;
};

describe('sprite rasterizer', () => {
  it('renders every species, state and frame', () => {
    for (const sp of SPECIES_LIST) {
      for (const state of STATES) {
        for (const f of ANIMS[state].frames) {
          const rgba = rasterize(sp, f);
          expect(rgba.length).toBe(SIZE * SIZE * 4);
          expect(opaque(rgba), `${sp.id}/${state}`).toBeGreaterThan(150);
        }
      }
    }
  });

  it('stands on the ground line in idle', () => {
    for (const sp of SPECIES_LIST) {
      const g = rasterizeGrid(sp, ANIMS.idle.frames[0]);
      const bottomRow = g.slice((SIZE - 1) * SIZE);
      expect(bottomRow.some(Boolean), sp.id).toBe(true);
      const top = g.slice(0, SIZE);
      expect(top.some(Boolean), `${sp.id} clipped at top`).toBe(false);
    }
  });

  it('wraps the silhouette in the outline color', () => {
    for (const sp of SPECIES_LIST) {
      const g = rasterizeGrid(sp, ANIMS.idle.frames[0]);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const c = g[y * SIZE + x];
          if (!c) continue;
          const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            return nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !g[ny * SIZE + nx];
          });
          if (edge && y < SIZE - 1 && x > 0 && x < SIZE - 1) expect(c, `${sp.id} ${x},${y}`).toBe(sp.palette.outline);
        }
      }
    }
  });

  it('is deterministic', () => {
    const sp = SPECIES_LIST[0];
    expect(rasterize(sp, ANIMS.dance.frames[1])).toEqual(rasterize(sp, ANIMS.dance.frames[1]));
  });

  it('frames of an animation differ (it actually moves)', () => {
    for (const sp of SPECIES_LIST) {
      for (const state of STATES) {
        const frames = ANIMS[state].frames.map((f) => rasterize(sp, f).join(','));
        if (frames.length > 1) expect(new Set(frames).size, `${sp.id}/${state}`).toBeGreaterThan(1);
      }
    }
  });

  it('applies color variants and accessories', () => {
    const sp = SPECIES_LIST[2];
    const base = rasterize(sp, ANIMS.idle.frames[0]).join(',');
    for (const v of VARIANTS.filter((v) => v.id !== 'classic')) {
      expect(variantPalette(sp.palette, v.id).body).not.toBe(sp.palette.body);
      expect(rasterize(sp, ANIMS.idle.frames[0], { variant: v.id }).join(',')).not.toBe(base);
    }
    for (const a of ACCESSORY_LIST.filter((a) => a.id !== 'none')) {
      expect(rasterize(sp, ANIMS.idle.frames[0], { accessory: a.id }).join(','), a.id).not.toBe(base);
    }
  });
});
