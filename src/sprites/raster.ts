// Rasterizes a species + frame spec into a 32x32 RGBA frame. Pure (no DOM), so it runs in
// tests, the icon generator and the browser alike.

import { ACCESSORIES, FOOD, GLASSES_COLOR, PARTICLES, type Bitmap } from './bitmaps';
import { hexToRgb, tintAngry, variantPalette } from './palette';
import type { Accessory, ColorKey, ColorVariant, EyeStyle, FrameSpec, MouthStyle, Palette, PartTag, Shape, Species } from './types';

export const SIZE = 32;
const PIVOT_X = 16;
const PIVOT_Y = 29;

type Grid = (string | null)[];

interface Xf {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  shear: number;
}

function newGrid(): Grid {
  return new Array(SIZE * SIZE).fill(null);
}

function set(g: Grid, x: number, y: number, c: string) {
  if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) g[y * SIZE + x] = c;
}

function inverse(xf: Xf, X: number, Y: number): [number, number] {
  const y = PIVOT_Y + (Y - xf.dy - PIVOT_Y) / xf.sy;
  const x = PIVOT_X + (X - xf.dx - xf.shear * (PIVOT_Y - y) - PIVOT_X) / xf.sx;
  return [x, y];
}

function forward(xf: Xf, x: number, y: number): [number, number] {
  return [PIVOT_X + (x - PIVOT_X) * xf.sx + xf.shear * (PIVOT_Y - y) + xf.dx, PIVOT_Y + (y - PIVOT_Y) * xf.sy + xf.dy];
}

/** Integer top-left for a w x h feature whose unscaled top-left is (x, y). */
function place(xf: Xf, x: number, y: number, w: number, h: number): [number, number] {
  const [cx, cy] = forward(xf, x + w / 2, y + h / 2);
  return [Math.round(cx - w / 2), Math.round(cy - h / 2)];
}

function sign(a: [number, number], b: [number, number], x: number, y: number) {
  return (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]);
}

export function sample(shape: Shape, x: number, y: number): ColorKey | null {
  switch (shape.k) {
    case 'ellipse': {
      const u = (x - shape.cx) / shape.rx;
      const v = (y - shape.cy) / shape.ry;
      if (u * u + v * v > 1) return null;
      if (shape.shade) {
        if (v * 0.85 + u * 0.35 > 0.62) return shape.shade[0];
        if (shape.shade[1] && (u + 0.4) ** 2 + (v + 0.55) ** 2 < 0.07) return shape.shade[1];
      }
      return shape.c;
    }
    case 'rect': {
      const { x: x0, y: y0, w, h } = shape;
      if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) return null;
      const r = shape.r ?? 0;
      if (r && (x < x0 + r || x >= x0 + w - r) && (y < y0 + r || y >= y0 + h - r)) return null;
      if (shape.shade) {
        if (y >= y0 + h - 2 || x >= x0 + w - 1) return shape.shade[0];
        if (shape.shade[1] && (y < y0 + 1 || x < x0 + 1)) return shape.shade[1];
      }
      return shape.c;
    }
    case 'tri': {
      const [a, b, c] = shape.pts;
      const d1 = sign([x, y], a, b[0], b[1]);
      const d2 = sign([x, y], b, c[0], c[1]);
      const d3 = sign([x, y], c, a[0], a[1]);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      return neg && pos ? null : shape.c;
    }
    case 'px': {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      return shape.pts.some(([a, b]) => a === ix && b === iy) ? shape.c : null;
    }
  }
}

function partOffset(tag: PartTag | undefined, wiggle: number): [number, number] {
  if (!tag || !wiggle) return [0, 0];
  switch (tag) {
    case 'tail':
    case 'leaf':
    case 'antenna':
      return [wiggle, 0];
    case 'wing':
      return [0, -Math.abs(wiggle)];
    case 'ear':
      return [0, wiggle > 0 ? -0.5 : 0];
  }
}

// Eye glyphs: [dx, dy, colorKey] relative to the eye's top-left. 3-wide glyphs are shifted so
// both eyes stay symmetric around the body centre.
type Glyph = [number, number, ColorKey][];
const EYE_GLYPHS: Record<Exclude<EyeStyle, 'none'>, { l: Glyph; r: Glyph; wide?: boolean }> = {
  open: {
    l: [[0, 0, 'shine'], [1, 0, 'eye'], [0, 1, 'eye'], [1, 1, 'eye']],
    r: [[0, 0, 'shine'], [1, 0, 'eye'], [0, 1, 'eye'], [1, 1, 'eye']],
  },
  closed: { l: [[0, 1, 'eye'], [1, 1, 'eye']], r: [[0, 1, 'eye'], [1, 1, 'eye']] },
  happy: { l: [[0, 1, 'eye'], [1, 0, 'eye'], [2, 1, 'eye']], r: [[0, 1, 'eye'], [1, 0, 'eye'], [2, 1, 'eye']], wide: true },
  angry: { l: [[0, -1, 'eye'], [1, 0, 'eye'], [0, 1, 'eye']], r: [[1, -1, 'eye'], [0, 0, 'eye'], [1, 1, 'eye']] },
  dizzy: {
    l: [[0, -1, 'eye'], [2, -1, 'eye'], [1, 0, 'eye'], [0, 1, 'eye'], [2, 1, 'eye']],
    r: [[0, -1, 'eye'], [2, -1, 'eye'], [1, 0, 'eye'], [0, 1, 'eye'], [2, 1, 'eye']],
    wide: true,
  },
};

const MOUTHS: Record<MouthStyle, [number, number, 'm' | 't'][]> = {
  none: [],
  small: [[0, 0, 'm'], [1, 0, 'm']],
  smile: [[-1, 0, 'm'], [0, 1, 'm'], [1, 1, 'm'], [2, 0, 'm']],
  open: [[-1, 0, 'm'], [0, 0, 'm'], [1, 0, 'm'], [2, 0, 'm'], [0, 1, 't'], [1, 1, 't']],
  o: [[0, 0, 'm'], [1, 0, 'm'], [0, 1, 'm'], [1, 1, 'm']],
  frown: [[-1, 1, 'm'], [0, 0, 'm'], [1, 0, 'm'], [2, 1, 'm']],
};

function stamp(g: Grid, bm: Bitmap, x0: number, y0: number, skipCols = 0) {
  bm.rows.forEach((row, y) => {
    for (let x = skipCols; x < row.length; x++) {
      const c = bm.colors[row[x]];
      if (c) set(g, x0 + x, y0 + y, c);
    }
  });
}

function outline(g: Grid, color: string): Grid {
  const out = g.slice();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (g[y * SIZE + x]) continue;
      const n =
        (x > 0 && g[y * SIZE + x - 1]) ||
        (x < SIZE - 1 && g[y * SIZE + x + 1]) ||
        (y > 0 && g[(y - 1) * SIZE + x]) ||
        (y < SIZE - 1 && g[(y + 1) * SIZE + x]);
      if (n) out[y * SIZE + x] = color;
    }
  }
  return out;
}

export interface RenderOptions {
  variant?: ColorVariant;
  accessory?: Accessory;
}

/** Returns the frame as an index grid of hex colors (null = transparent). */
export function rasterizeGrid(sp: Species, spec: FrameSpec, opts: RenderOptions = {}): Grid {
  let pal: Palette = variantPalette(sp.palette, opts.variant ?? 'classic');
  if (spec.tint === 'angry') pal = tintAngry(pal);
  const xf: Xf = { dx: spec.dx ?? 0, dy: spec.dy ?? 0, sx: spec.sx ?? 1, sy: spec.sy ?? 1, shear: spec.shear ?? 0 };
  const wiggle = spec.wiggle ?? 0;
  const body = newGrid();

  // Body shapes (inverse-mapped so squash/shear stay pixel-crisp). Later shapes win.
  for (let Y = 0; Y < SIZE; Y++) {
    for (let X = 0; X < SIZE; X++) {
      const [x, y] = inverse(xf, X + 0.5, Y + 0.5);
      for (let i = sp.shapes.length - 1; i >= 0; i--) {
        const s = sp.shapes[i];
        const [ox, oy] = partOffset(s.tag, wiggle);
        const k = sample(s, x - ox, y - oy);
        if (k) {
          body[Y * SIZE + X] = pal[k];
          break;
        }
      }
    }
  }

  // Feet sit behind the body and only follow translation, not squash.
  const f = sp.feet;
  for (const side of ['l', 'r'] as const) {
    const [fx, fy] = f[side];
    const [ox, oy] = spec.feet?.[side] ?? [0, 0];
    const foot: Shape = { k: 'ellipse', cx: fx + f.w / 2 + ox + xf.dx, cy: fy + f.h / 2 + oy + Math.min(0, xf.dy), rx: f.w / 2, ry: f.h / 2, c: f.c };
    for (let Y = 0; Y < SIZE; Y++) {
      for (let X = 0; X < SIZE; X++) {
        if (body[Y * SIZE + X]) continue;
        if (sample(foot, X + 0.5, Y + 0.5)) body[Y * SIZE + X] = pal[f.c];
      }
    }
  }

  // Raised paw (waving, yawning, singing).
  if (spec.paw) {
    const [ax, ay] = sp.paw ?? [25, 19];
    const [px, py] = place(xf, ax + spec.paw[0], ay + spec.paw[1], 3, 3);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [0, 2], [2, 2]]) {
      set(body, px + dx, py + dy, dy === 2 || dx === 2 ? pal.shade : dy === 0 ? pal.light : pal.body);
    }
  }

  // Face.
  const look = spec.look ?? 0;
  if (spec.cheeks && sp.cheeks) {
    for (const [cx, cy] of sp.cheeks) {
      const [px, py] = place(xf, cx + look, cy, 2, 1);
      set(body, px, py, pal.cheek);
      set(body, px + 1, py, pal.cheek);
    }
  }
  if (spec.eyes !== 'none') {
    const glyph = EYE_GLYPHS[spec.eyes];
    for (const side of ['l', 'r'] as const) {
      const [ex, ey] = sp.eyes[side];
      const [px, py] = place(xf, ex + look, ey, 2, 2);
      const shift = glyph.wide && side === 'l' ? -1 : 0;
      for (const [gx, gy, key] of glyph[side]) set(body, px + gx + shift, py + gy, pal[key]);
    }
  }
  const [mx, my] = place(xf, sp.mouth[0] + look, sp.mouth[1], 2, 1);
  for (const [gx, gy, kind] of MOUTHS[spec.mouth]) {
    set(body, mx + gx, my + gy, kind === 't' ? '#ff7a9a' : pal[sp.mouthColor ?? 'outline']);
  }

  // Accessories.
  const acc = opts.accessory ?? 'none';
  if (acc === 'glasses') {
    const eyePos = (['l', 'r'] as const).map((s) => place(xf, sp.eyes[s][0] + look, sp.eyes[s][1], 2, 2));
    for (const [ex, ey] of eyePos) {
      for (let i = -1; i <= 2; i++) {
        set(body, ex + i, ey - 1, GLASSES_COLOR);
        set(body, ex + i, ey + 2, GLASSES_COLOR);
        set(body, ex - 1, ey + i, GLASSES_COLOR);
        set(body, ex + 2, ey + i, GLASSES_COLOR);
      }
    }
    const [[lx, ly], [rx]] = eyePos;
    for (let x = lx + 3; x < rx - 1; x++) set(body, x, ly, GLASSES_COLOR);
  } else if (acc !== 'none') {
    const a = ACCESSORIES[acc];
    const w = a.rows[0].length;
    const h = a.rows.length;
    const [ax, ay] = a.anchor === 'head' ? sp.head : sp.neck;
    const [px, py] = place(xf, ax - Math.floor(w / 2) + a.dx, a.anchor === 'head' ? ay - h + 1 : ay, w, h);
    stamp(body, a, px, py);
  }

  const out = outline(body, pal.outline);

  // Food and particles get their own outline so they read on any wallpaper.
  const fx = newGrid();
  if (spec.food !== undefined && spec.food < 3) {
    const food = FOOD[sp.food];
    const w = food.rows[0].length;
    stamp(fx, food, mx + 1 - Math.floor(w / 2), my + 2, spec.food);
  }
  for (const p of spec.particles ?? []) stamp(fx, PARTICLES[p.p], p.x, p.y);
  const fxOut = outline(fx, pal.outline);
  for (let i = 0; i < out.length; i++) if (fxOut[i]) out[i] = fxOut[i];
  return out;
}

export function gridToRgba(g: Grid): Uint8ClampedArray {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  g.forEach((c, i) => {
    if (!c) return;
    const [r, gg, b] = hexToRgb(c);
    data.set([r, gg, b, 255], i * 4);
  });
  return data;
}

export function rasterize(sp: Species, spec: FrameSpec, opts?: RenderOptions): Uint8ClampedArray {
  return gridToRgba(rasterizeGrid(sp, spec, opts));
}
