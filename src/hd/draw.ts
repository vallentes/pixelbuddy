// HD vector characters. All five are original designs drawn with canvas paths and gradients.
// Units: the character stands on y = 0 and is about 120 units tall; x = 0 is its centre.

import { hexToRgb, rgbToHex } from '../sprites/palette';
import type { Accessory, ColorVariant, FoodKind } from '../sprites/types';
import type { Pose } from './pose';
import { critterBody, critterHead, type CritterSpec } from './critters';

const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;

export interface HdPalette {
  main: string;
  light: string;
  dark: string;
  belly: string;
  bellyDark: string;
  accent: string;
  accentDark: string;
  outline: string;
  iris: string;
  irisDark: string;
  inner: string;
  cheek: string;
  nose: string;
}

export type HdKind = 'cat' | 'frog' | 'dragon' | 'robot' | 'sheep' | 'critter';

export interface HdSpecies {
  kind: HdKind;
  palette: HdPalette;
  /** Head top in head space, for hats. */
  hatY: number;
  food: FoodKind;
  floaty?: boolean;
  /** Body plan for kind 'critter'. */
  critter?: CritterSpec;
}

export const HD_SPECIES: Record<string, HdSpecies> = {
  mochi: {
    kind: 'cat',
    hatY: -27,
    food: 'fish',
    palette: {
      main: '#f39a45',
      light: '#ffd29a',
      dark: '#c4641f',
      belly: '#fff7ec',
      bellyDark: '#ecd6bd',
      accent: '#d06d22',
      accentDark: '#a84f12',
      outline: '#6b3410',
      iris: '#e8b23a',
      irisDark: '#7d5a0c',
      inner: '#ffb3c2',
      cheek: '#ff8fa8',
      nose: '#f07f97',
    },
  },
  pip: {
    kind: 'frog',
    hatY: -31,
    food: 'berry',
    palette: {
      main: '#7fcf5a',
      light: '#c8f59a',
      dark: '#3f9a3a',
      belly: '#f6f8cf',
      bellyDark: '#d9e3a2',
      accent: '#3fbf6a',
      accentDark: '#24804a',
      outline: '#1f4a24',
      iris: '#3a2a1a',
      irisDark: '#120a05',
      inner: '#ff9db0',
      cheek: '#ff8fa8',
      nose: '#2a5a2c',
    },
  },
  ember: {
    kind: 'dragon',
    hatY: -27,
    food: 'pepper',
    palette: {
      main: '#ff7a3d',
      light: '#ffbe7a',
      dark: '#cc4a1e',
      belly: '#ffe7b0',
      bellyDark: '#efc47a',
      accent: '#e2333a',
      accentDark: '#9a1f2a',
      outline: '#5a1a14',
      iris: '#4fd18a',
      irisDark: '#13693a',
      inner: '#fff1d6',
      cheek: '#ff6f8f',
      nose: '#9a2f1e',
    },
  },
  bolt: {
    kind: 'robot',
    hatY: -28,
    food: 'battery',
    palette: {
      main: '#8fb6ff',
      light: '#e2edff',
      dark: '#4d6fc7',
      belly: '#cfdcf7',
      bellyDark: '#9fb3de',
      accent: '#ffd34a',
      accentDark: '#c99524',
      outline: '#1d2446',
      iris: '#7ff5ff',
      irisDark: '#1fb6d6',
      inner: '#16213f',
      cheek: '#ff7fb0',
      nose: '#7ff5ff',
    },
  },
  nimbus: {
    kind: 'sheep',
    hatY: -30,
    food: 'clover',
    floaty: true,
    palette: {
      main: '#efeaff',
      light: '#ffffff',
      dark: '#c5b6f0',
      belly: '#fff3e8',
      bellyDark: '#ecd8c8',
      accent: '#b59ae8',
      accentDark: '#7f63c4',
      outline: '#4a3d6e',
      iris: '#3b2f5c',
      irisDark: '#120d22',
      inner: '#ffc2d8',
      cheek: '#ff9fc2',
      nose: '#c27a9a',
    },
  },
  pickles: {
    kind: 'critter',
    hatY: -30,
    food: 'fish',
    critter: {body: {rx: 22, ry: 28, cy: -36}, head: {rx: 28, ry: 26}, ears: 'none', face: 'penguin', eyes: {x: 10, y: -3, rx: 6.5, ry: 8}, belly: true, arms: 'flippers', legs: 'feet', mouthY: 11},
    palette: {
      main: '#3a4a6b',
      light: '#6b7fa8',
      dark: '#1f2840',
      belly: '#fdfdff',
      bellyDark: '#dfe4ef',
      accent: '#2e3b57',
      accentDark: '#1a2236',
      outline: '#141a2b',
      iris: '#2b2b3a',
      irisDark: '#08080e',
      inner: '#ffb3c2',
      cheek: '#ff9fb5',
      nose: '#ffb03b'
    },
  },
  clover: {
    kind: 'critter',
    hatY: -27,
    food: 'carrot',
    critter: {body: {rx: 21, ry: 24, cy: -34}, head: {rx: 28, ry: 25}, ears: 'long', face: 'muzzle', eyes: {x: 11, y: -4, rx: 7, ry: 8.5}, belly: true, arms: 'paws', legs: 'feet', tail: 'puff', nose: 'pink', catMouth: true},
    palette: {
      main: '#f4e9e1',
      light: '#ffffff',
      dark: '#d6c3b6',
      belly: '#ffffff',
      bellyDark: '#ece3dc',
      accent: '#ead9cd',
      accentDark: '#c6ad9d',
      outline: '#5a4440',
      iris: '#c2577a',
      irisDark: '#5e1c35',
      inner: '#ffb6c9',
      cheek: '#ff9fbf',
      nose: '#ff8fb1'
    },
  },
  waffles: {
    kind: 'critter',
    hatY: -27,
    food: 'bone',
    critter: {body: {rx: 22, ry: 25, cy: -35}, head: {rx: 30, ry: 26}, ears: 'floppy', face: 'muzzle', eyes: {x: 12, y: -5, rx: 7.5, ry: 9}, belly: true, arms: 'paws', legs: 'feet', tail: 'curl', nose: 'dot'},
    palette: {
      main: '#e0a96b',
      light: '#f7d4a2',
      dark: '#b07a42',
      belly: '#fff3e2',
      bellyDark: '#ecd4b5',
      accent: '#8a5a33',
      accentDark: '#5e3a1e',
      outline: '#4a2c16',
      iris: '#6b3e1f',
      irisDark: '#2a160a',
      inner: '#ffb3a7',
      cheek: '#ff9b8f',
      nose: '#2a1d22'
    },
  },
  hoot: {
    kind: 'critter',
    hatY: -30,
    food: 'cookie',
    critter: {body: {rx: 24, ry: 28, cy: -36}, head: {rx: 30, ry: 25}, ears: 'tufts', face: 'beak', eyes: {x: 12, y: -4, rx: 8, ry: 8.5}, belly: true, arms: 'wings', legs: 'feet', mouthY: 12},
    palette: {
      main: '#8c6a4f',
      light: '#c49a74',
      dark: '#5f4532',
      belly: '#f2dcc0',
      bellyDark: '#d8bc98',
      accent: '#6e523c',
      accentDark: '#463324',
      outline: '#33241a',
      iris: '#ffb627',
      irisDark: '#8a5300',
      inner: '#ffb3a7',
      cheek: '#ff9b8f',
      nose: '#ffb03b'
    },
  },
  biscuit: {
    kind: 'critter',
    hatY: -26,
    food: 'seed',
    critter: {body: {rx: 25, ry: 23, cy: -32}, head: {rx: 30, ry: 25}, ears: 'round', face: 'muzzle', eyes: {x: 12, y: -5, rx: 6, ry: 7}, belly: true, arms: 'paws', legs: 'stubby', pouches: true, nose: 'pink', catMouth: true, mouthY: 11},
    palette: {
      main: '#f0b675',
      light: '#ffdcae',
      dark: '#c98a46',
      belly: '#fff6ea',
      bellyDark: '#efdcc4',
      accent: '#e39c5c',
      accentDark: '#b06b2e',
      outline: '#5c3517',
      iris: '#2b1d17',
      irisDark: '#0c0705',
      inner: '#ffb3c2',
      cheek: '#ff9fb5',
      nose: '#ff8fa8'
    },
  },
  zib: {
    kind: 'critter',
    hatY: -28,
    food: 'star',
    critter: {body: {rx: 18, ry: 22, cy: -32}, head: {rx: 32, ry: 27}, ears: 'antennae', face: 'plain', eyes: {x: 13, y: -3, rx: 10, ry: 12}, belly: true, arms: 'paws', legs: 'feet', spots: true, nose: 'none', mouthY: 13},
    palette: {
      main: '#7ee08a',
      light: '#c4ffc8',
      dark: '#3fa851',
      belly: '#e4ffe6',
      bellyDark: '#b9e8bd',
      accent: '#c48bff',
      accentDark: '#7f4ac9',
      outline: '#1f4a2a',
      iris: '#141414',
      irisDark: '#000000',
      inner: '#ffb3c2',
      cheek: '#ff9fbf',
      nose: '#3fa851'
    },
  },
  boo: {
    kind: 'critter',
    hatY: -30,
    food: 'marshmallow',
    floaty: true,
    critter: {body: {rx: 30, ry: 30, cy: -55}, head: {rx: 28, ry: 24}, ears: 'none', face: 'plain', eyes: {x: 11, y: -2, rx: 7, ry: 9}, arms: 'nubs', legs: 'ghost', nose: 'none', mouthY: 11},
    palette: {
      main: '#eef0ff',
      light: '#ffffff',
      dark: '#c7cbe8',
      belly: '#ffffff',
      bellyDark: '#e5e8f7',
      accent: '#cfd4f2',
      accentDark: '#9da4cf',
      outline: '#4b4f73',
      iris: '#1d1f33',
      irisDark: '#000000',
      inner: '#ffc2d8',
      cheek: '#ffa3c4',
      nose: '#c27a9a'
    },
  },
  shelly: {
    kind: 'critter',
    hatY: -27,
    food: 'lettuce',
    critter: {body: {rx: 21, ry: 24, cy: -34}, head: {rx: 26, ry: 23}, ears: 'none', face: 'plain', eyes: {x: 10, y: -3, rx: 6.5, ry: 8}, belly: true, arms: 'paws', legs: 'stubby', shell: true, tail: 'stub', nose: 'none', mouthY: 10},
    palette: {
      main: '#8fd18a',
      light: '#c9f2c2',
      dark: '#5ea65c',
      belly: '#f6efc7',
      bellyDark: '#e2d79b',
      accent: '#b07a3f',
      accentDark: '#6e4a22',
      outline: '#2f4a26',
      iris: '#2b1d17',
      irisDark: '#0c0705',
      inner: '#ffb3c2',
      cheek: '#ff9fb5',
      nose: '#2f4a26'
    },
  },
  inky: {
    kind: 'critter',
    hatY: -30,
    food: 'fish',
    critter: {body: {rx: 20, ry: 16, cy: -30}, head: {rx: 33, ry: 30}, ears: 'none', face: 'plain', eyes: {x: 12, y: 0, rx: 8, ry: 9.5}, arms: 'tentacles', legs: 'tentacles', spots: true, nose: 'none', mouthY: 14},
    palette: {
      main: '#b38cff',
      light: '#dcc8ff',
      dark: '#7e58cf',
      belly: '#f1e7ff',
      bellyDark: '#d7c6f5',
      accent: '#ff8fc7',
      accentDark: '#c95a92',
      outline: '#3c2569',
      iris: '#1a1230',
      irisDark: '#000000',
      inner: '#ffb3e0',
      cheek: '#ff9fd0',
      nose: '#7e58cf'
    },
  },
  bao: {
    kind: 'critter',
    hatY: -28,
    food: 'bamboo',
    critter: {body: {rx: 25, ry: 26, cy: -35}, head: {rx: 30, ry: 26}, ears: 'round', face: 'panda', eyes: {x: 12, y: -4, rx: 5.5, ry: 6.5}, belly: true, arms: 'paws', legs: 'stubby', tail: 'stub', nose: 'dot', mouthY: 11},
    palette: {
      main: '#f6f6f2',
      light: '#ffffff',
      dark: '#d4d4cc',
      belly: '#ffffff',
      bellyDark: '#e7e7df',
      accent: '#2a2a30',
      accentDark: '#111114',
      outline: '#1d1d22',
      iris: '#4a3a2e',
      irisDark: '#0d0907',
      inner: '#5a5a62',
      cheek: '#ffa3b5',
      nose: '#1d1d22'
    },
  },
};

// ---------------------------------------------------------------------------------------------
// Color variants
// ---------------------------------------------------------------------------------------------

function toHsl(hex: string): [number, number, number] {
  let [r, g, b] = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

const HUE: Partial<Record<ColorVariant, number>> = { rose: 335, mint: 155, sky: 210, golden: 42 };

export function hdPalette(base: HdPalette, v: ColorVariant): HdPalette {
  if (v === 'classic') return base;
  const out = { ...base };
  const [bh] = toHsl(base.main);
  for (const k of ['main', 'light', 'dark', 'accent', 'accentDark'] as const) {
    let [h, s, l] = toHsl(base[k]);
    if (v === 'shadow') {
      s *= 0.25;
      l *= 0.42;
    } else {
      h += HUE[v]! - bh;
      s = Math.max(s, 0.5);
    }
    out[k] = fromHsl(h, s, l);
  }
  if (v === 'shadow') {
    out.outline = '#07060c';
    out.light = fromHsl(toHsl(out.main)[0], 0.15, 0.42);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------------------------

export function ell(c: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}

export function paint(c: Ctx, fill: string | CanvasGradient, outline: string, lw = 2) {
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = lw;
  c.strokeStyle = outline;
  c.lineJoin = 'round';
  c.stroke();
}

export function shade(c: Ctx, x: number, y: number, r: number, pal: HdPalette) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.08, x, y, r * 1.08);
  g.addColorStop(0, pal.light);
  g.addColorStop(0.45, pal.main);
  g.addColorStop(1, pal.dark);
  return g;
}

export function rrect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

export function limb(c: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, fill: string | CanvasGradient, outline: string) {
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = outline;
  c.lineWidth = w + 4;
  c.stroke();
  c.strokeStyle = fill;
  c.lineWidth = w;
  c.stroke();
}

export function armEnd(side: number, a: number, sx: number, sy: number, len: number): [number, number] {
  return [sx + side * Math.sin(a) * len, sy + Math.cos(a) * len];
}

// ---------------------------------------------------------------------------------------------
// Faces
// ---------------------------------------------------------------------------------------------

export interface EyeSpec {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export function drawEyes(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number], e: EyeSpec, lid: string) {
  for (const side of [-1, 1]) {
    const ex = side * e.x + p.face * 3;
    const ey = e.y;
    c.lineCap = 'round';
    c.strokeStyle = pal.outline;
    if (p.eyes === 'happy' || p.eyes === 'closed') {
      c.lineWidth = 2.8;
      c.beginPath();
      if (p.eyes === 'happy') c.arc(ex, ey + 3, e.rx * 0.75, Math.PI * 1.15, Math.PI * 1.85);
      else c.arc(ex, ey - 1, e.rx * 0.75, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      continue;
    }
    if (p.eyes === 'dizzy') {
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 28; i++) {
        const a = i * 0.55;
        const r = (i / 28) * e.rx;
        const px = ex + Math.cos(a * side) * r;
        const py = ey + Math.sin(a * side) * r;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
      continue;
    }
    // Sclera
    ell(c, ex, ey, e.rx, e.ry);
    paint(c, '#ffffff', pal.outline, 1.8);
    // Iris + pupil, following the gaze
    const ir = e.rx * (p.eyes === 'wide' ? 0.5 : 0.74);
    const gx = ex + gaze[0] * e.rx * 0.28 + p.face * 1.5;
    const gy = ey + gaze[1] * e.ry * 0.22 + 1;
    c.save();
    ell(c, ex, ey, e.rx - 0.8, e.ry - 0.8);
    c.clip();
    const g = c.createRadialGradient(gx, gy - ir * 0.3, ir * 0.1, gx, gy, ir);
    g.addColorStop(0, pal.iris);
    g.addColorStop(1, pal.irisDark);
    ell(c, gx, gy, ir, ir * 1.08);
    c.fillStyle = g;
    c.fill();
    ell(c, gx, gy, ir * 0.55, ir * 0.62);
    c.fillStyle = '#120a14';
    c.fill();
    ell(c, gx - ir * 0.32, gy - ir * 0.4, ir * 0.3, ir * 0.3);
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.fill();
    ell(c, gx + ir * 0.35, gy + ir * 0.35, ir * 0.13, ir * 0.13);
    c.fill();
    // Eyelid (blink / angry squint)
    const lidAmt = Math.max(p.blink, p.eyes === 'angry' ? 0.4 : 0);
    if (lidAmt > 0.01) {
      c.fillStyle = lid;
      c.fillRect(ex - e.rx - 2, ey - e.ry - 2, e.rx * 2 + 4, (e.ry * 2 + 4) * lidAmt);
    }
    c.restore();
    ell(c, ex, ey, e.rx, e.ry);
    c.lineWidth = 1.8;
    c.strokeStyle = pal.outline;
    c.stroke();
    if (p.eyes === 'angry') {
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(ex - side * e.rx * 1.1, ey - e.ry - 4);
      c.lineTo(ex + side * e.rx * 0.6, ey - e.ry + 1);
      c.stroke();
    }
  }
}

export function drawMouth(c: Ctx, p: Pose, pal: HdPalette, x: number, y: number, w: number, catStyle = false) {
  c.strokeStyle = pal.outline;
  c.lineWidth = 2;
  c.lineCap = 'round';
  const open = p.mouth === 'open' || p.mouth === 'talk' || p.mouth === 'grin' ? Math.max(0.15, p.mouth === 'talk' ? p.mouthOpen : Math.max(0.6, p.mouthOpen)) : 0;
  if (open > 0) {
    const h = 2 + open * 8;
    c.beginPath();
    c.moveTo(x - w * 0.5, y);
    c.quadraticCurveTo(x, y - 1, x + w * 0.5, y);
    c.quadraticCurveTo(x + w * 0.42, y + h, x, y + h);
    c.quadraticCurveTo(x - w * 0.42, y + h, x - w * 0.5, y);
    c.closePath();
    c.fillStyle = '#5c1d2b';
    c.fill();
    c.save();
    c.clip();
    ell(c, x, y + h, w * 0.32, h * 0.55);
    c.fillStyle = '#ff7f95';
    c.fill();
    c.restore();
    c.stroke();
    return;
  }
  c.beginPath();
  switch (p.mouth) {
    case 'o':
      ell(c, x, y + 2, 2.8, 3.6);
      c.fillStyle = '#5c1d2b';
      c.fill();
      c.stroke();
      return;
    case 'frown':
      c.arc(x, y + 6, w * 0.35, Math.PI * 1.2, Math.PI * 1.8);
      break;
    case 'small':
      c.moveTo(x - w * 0.18, y + 1);
      c.quadraticCurveTo(x, y + 2.5, x + w * 0.18, y + 1);
      break;
    default:
      if (catStyle) {
        c.arc(x - 3.2, y, 3.2, 0.1, Math.PI * 0.95);
        c.moveTo(x + 6.4, y);
        c.arc(x + 3.2, y, 3.2, 0.05, Math.PI * 0.9);
      } else {
        c.arc(x, y - 3, w * 0.42, Math.PI * 0.2, Math.PI * 0.8);
      }
  }
  c.stroke();
}

export function blush(c: Ctx, p: Pose, pal: HdPalette, x: number, y: number, r: number) {
  const a = Math.min(1, p.blush) * 0.55;
  if (a <= 0.02) return;
  for (const side of [-1, 1]) {
    const g = c.createRadialGradient(side * x + p.face * 2, y, 0, side * x + p.face * 2, y, r);
    g.addColorStop(0, pal.cheek);
    g.addColorStop(1, 'rgba(255,143,168,0)');
    c.globalAlpha = a;
    ell(c, side * x + p.face * 2, y, r, r * 0.65);
    c.fillStyle = g;
    c.fill();
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------------------------------------
// Shared body parts
// ---------------------------------------------------------------------------------------------

export function legs(c: Ctx, p: Pose, pal: HdPalette, footColor: string, w = 11, spread = 12) {
  for (const side of [-1, 1]) {
    const lift = side < 0 ? p.legL : p.legR;
    const fx = side * (spread + 1);
    const fy = -4 - lift;
    limb(c, side * spread, -22, fx, fy, w, pal.main, pal.outline);
    ell(c, fx + side * 1.5, fy + 1, w * 0.8, w * 0.55);
    paint(c, footColor, pal.outline, 2);
    c.strokeStyle = pal.outline;
    c.lineWidth = 1.3;
    for (const t of [-0.3, 0.3]) {
      c.beginPath();
      c.moveTo(fx + side * 1.5 + t * w * 0.8, fy + 1 + w * 0.15);
      c.lineTo(fx + side * 1.5 + t * w * 0.8, fy + 1 + w * 0.5);
      c.stroke();
    }
  }
}

export function arms(c: Ctx, p: Pose, pal: HdPalette, pawColor: string, shoulderY = -50, w = 9, len = 21) {
  for (const side of [-1, 1]) {
    const a = side < 0 ? p.armL : p.armR;
    const sx = side * 17;
    const [ex, ey] = armEnd(side, a, sx, shoulderY, len);
    limb(c, sx, shoulderY, ex, ey, w, pal.main, pal.outline);
    ell(c, ex, ey, w * 0.68, w * 0.62);
    paint(c, pawColor, pal.outline, 1.8);
  }
}

export function belly(c: Ctx, pal: HdPalette, x: number, y: number, rx: number, ry: number) {
  const g = c.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, pal.belly);
  g.addColorStop(1, pal.bellyDark);
  ell(c, x, y, rx, ry);
  c.fillStyle = g;
  c.fill();
}

// ---------------------------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------------------------

function cat(c: Ctx, p: Pose, pal: HdPalette, head: () => void) {
  // Tail
  c.save();
  c.translate(16, -16);
  c.rotate(-0.3 + p.tail * 0.5);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(22, 2, 30, -20, 22, -40);
  c.strokeStyle = pal.outline;
  c.lineWidth = 13;
  c.stroke();
  c.strokeStyle = pal.main;
  c.lineWidth = 9;
  c.stroke();
  c.strokeStyle = pal.accent;
  c.lineWidth = 9;
  c.setLineDash([3, 6]);
  c.stroke();
  c.setLineDash([]);
  c.restore();

  legs(c, p, pal, pal.belly);
  // Body
  ell(c, 0, -36, 22, 25);
  paint(c, shade(c, 0, -36, 25, pal), pal.outline, 2.2);
  belly(c, pal, 0, -31, 13, 18);
  c.strokeStyle = pal.accent;
  c.lineWidth = 3;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (const yy of [-48, -38, -28]) {
      c.beginPath();
      c.moveTo(side * 21, yy);
      c.quadraticCurveTo(side * 16, yy + 2, side * 14, yy + 6);
      c.stroke();
    }
  }
  arms(c, p, pal, pal.belly);
  head();
}

function catHead(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number]) {
  // Ears
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 30, -6);
    c.quadraticCurveTo(side * 30, -30, side * 24, -38);
    c.quadraticCurveTo(side * 14, -30, side * 6, -24);
    c.closePath();
    paint(c, shade(c, side * 20, -22, 20, pal), pal.outline, 2.2);
    c.beginPath();
    c.moveTo(side * 25, -12);
    c.quadraticCurveTo(side * 25, -28, side * 22, -32);
    c.quadraticCurveTo(side * 15, -26, side * 11, -22);
    c.closePath();
    c.fillStyle = pal.inner;
    c.fill();
  }
  // Head
  ell(c, 0, 0, 32, 27);
  paint(c, shade(c, 0, 0, 32, pal), pal.outline, 2.4);
  // Cheek fluff
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 29, 2);
    c.lineTo(side * 36, 6);
    c.lineTo(side * 30, 9);
    c.lineTo(side * 35, 13);
    c.lineTo(side * 26, 15);
    c.closePath();
    paint(c, pal.main, pal.outline, 1.8);
  }
  // Forehead stripes
  c.strokeStyle = pal.accent;
  c.lineCap = 'round';
  c.lineWidth = 3;
  for (const dx of [-7, 0, 7]) {
    c.beginPath();
    c.moveTo(dx + p.face * 2, -25);
    c.lineTo(dx * 0.8 + p.face * 2, -16);
    c.stroke();
  }
  // Muzzle
  const f = p.face * 2.5;
  for (const side of [-1, 1]) {
    ell(c, side * 6 + f, 9, 9, 7);
    c.fillStyle = pal.belly;
    c.fill();
  }
  ell(c, f, 14, 8, 4);
  c.fill();
  drawEyes(c, p, pal, gaze, { x: 12, y: -4, rx: 7.5, ry: 9 }, pal.main);
  blush(c, p, pal, 21, 9, 7);
  // Nose
  c.beginPath();
  c.moveTo(f - 3.5, 3);
  c.quadraticCurveTo(f, 1.5, f + 3.5, 3);
  c.quadraticCurveTo(f, 8, f - 3.5, 3);
  paint(c, pal.nose, pal.outline, 1.4);
  drawMouth(c, p, pal, f, 8, 11, true);
  // Whiskers
  c.strokeStyle = 'rgba(80,40,20,0.55)';
  c.lineWidth = 1.1;
  for (const side of [-1, 1]) {
    for (const dy of [-2, 2, 6]) {
      c.beginPath();
      c.moveTo(side * 14 + f, 8 + dy * 0.4);
      c.lineTo(side * 33 + f, 4 + dy);
      c.stroke();
    }
  }
}

function frog(c: Ctx, p: Pose, pal: HdPalette, head: () => void) {
  legs(c, p, pal, pal.main, 12, 14);
  ell(c, 0, -32, 25, 22);
  paint(c, shade(c, 0, -32, 25, pal), pal.outline, 2.2);
  belly(c, pal, 0, -28, 16, 15);
  // Spots
  c.fillStyle = pal.dark;
  for (const [x, y, r] of [[-17, -40, 3], [18, -34, 2.5], [-12, -20, 2]]) {
    ell(c, x, y, r, r * 0.8);
    c.fill();
  }
  arms(c, p, pal, pal.light, -44, 9, 19);
  head();
}

function frogHead(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number]) {
  // Leaf sprout
  c.save();
  c.translate(0, -24);
  c.rotate(p.tail * 0.25);
  c.strokeStyle = pal.accentDark;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(0, 4);
  c.quadraticCurveTo(-2, -6, 2, -12);
  c.stroke();
  for (const [dir, len] of [[1, 14], [-1, 11]]) {
    c.beginPath();
    c.moveTo(2, -12);
    c.quadraticCurveTo(2 + dir * len * 0.6, -12 - len * 0.7, 2 + dir * len, -10);
    c.quadraticCurveTo(2 + dir * len * 0.5, -6, 2, -12);
    const g = c.createLinearGradient(0, -24, 0, -6);
    g.addColorStop(0, pal.light);
    g.addColorStop(1, pal.accent);
    paint(c, g, pal.outline, 1.6);
  }
  c.restore();
  // Eye domes
  for (const side of [-1, 1]) {
    ell(c, side * 15, -16, 12.5, 11.5);
    paint(c, shade(c, side * 15, -16, 13, pal), pal.outline, 2.2);
  }
  ell(c, 0, 2, 35, 21);
  paint(c, shade(c, 0, 0, 35, pal), pal.outline, 2.4);
  for (const side of [-1, 1]) {
    ell(c, side * 15, -14, 11, 9);
    c.fillStyle = pal.main;
    c.fill();
  }
  drawEyes(c, p, pal, gaze, { x: 15, y: -14, rx: 8.5, ry: 8.5 }, pal.main);
  blush(c, p, pal, 24, 8, 7);
  // Nostrils
  c.fillStyle = pal.nose;
  for (const side of [-1, 1]) {
    ell(c, side * 3 + p.face * 2.5, 2, 1.2, 0.9);
    c.fill();
  }
  if (p.mouth === 'smile' || p.mouth === 'small') {
    c.strokeStyle = pal.outline;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    const f = p.face * 2.5;
    c.moveTo(-17 + f, 6);
    c.quadraticCurveTo(f, p.mouth === 'smile' ? 17 : 11, 17 + f, 6);
    c.stroke();
  } else {
    drawMouth(c, p, pal, p.face * 2.5, 8, 16);
  }
}

function dragon(c: Ctx, p: Pose, pal: HdPalette, head: () => void) {
  // Wings
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * 14, -50);
    c.rotate(side * (-0.35 - Math.abs(p.tail) * 0.35));
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(side * 16, -22, side * 34, -18);
    c.quadraticCurveTo(side * 30, -8, side * 32, 0);
    c.quadraticCurveTo(side * 24, -2, side * 22, 8);
    c.quadraticCurveTo(side * 14, 2, side * 10, 12);
    c.closePath();
    const g = c.createLinearGradient(0, -20, 0, 12);
    g.addColorStop(0, pal.accent);
    g.addColorStop(1, pal.accentDark);
    paint(c, g, pal.outline, 2);
    c.restore();
  }
  // Tail
  c.save();
  c.translate(16, -14);
  c.rotate(-0.15 + p.tail * 0.35);
  c.beginPath();
  c.moveTo(0, -7);
  c.quadraticCurveTo(26, -6, 36, -22);
  c.lineTo(39, -16);
  c.quadraticCurveTo(28, 6, 0, 7);
  c.closePath();
  paint(c, shade(c, 18, -6, 22, pal), pal.outline, 2);
  c.beginPath();
  c.moveTo(36, -22);
  c.lineTo(46, -30);
  c.lineTo(44, -17);
  c.lineTo(39, -16);
  c.closePath();
  paint(c, pal.accent, pal.outline, 1.8);
  c.restore();
  legs(c, p, pal, pal.main, 12, 12);
  ell(c, 0, -36, 22, 24);
  paint(c, shade(c, 0, -36, 24, pal), pal.outline, 2.2);
  belly(c, pal, 0, -31, 13, 18);
  c.strokeStyle = pal.bellyDark;
  c.lineWidth = 1.6;
  for (const yy of [-42, -34, -26, -18]) {
    c.beginPath();
    c.moveTo(-11, yy);
    c.quadraticCurveTo(0, yy + 3, 11, yy);
    c.stroke();
  }
  arms(c, p, pal, pal.main);
  head();
}

function dragonHead(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number]) {
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 12, -20);
    c.quadraticCurveTo(side * 16, -36, side * 26, -42);
    c.quadraticCurveTo(side * 22, -30, side * 22, -16);
    c.closePath();
    const g = c.createLinearGradient(0, -42, 0, -16);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(1, pal.inner);
    paint(c, g, pal.outline, 2);
    // Ear fins
    c.beginPath();
    c.moveTo(side * 28, -4);
    c.lineTo(side * 40, -12);
    c.lineTo(side * 36, 2);
    c.lineTo(side * 41, 6);
    c.lineTo(side * 29, 8);
    c.closePath();
    paint(c, pal.accent, pal.outline, 1.8);
  }
  ell(c, 0, 0, 31, 26);
  paint(c, shade(c, 0, 0, 31, pal), pal.outline, 2.4);
  const f = p.face * 2.5;
  ell(c, f, 11, 15, 9);
  const g = c.createLinearGradient(0, 2, 0, 20);
  g.addColorStop(0, pal.light);
  g.addColorStop(1, pal.main);
  c.fillStyle = g;
  c.fill();
  c.fillStyle = pal.nose;
  for (const side of [-1, 1]) {
    ell(c, side * 4 + f, 7, 1.5, 1.1);
    c.fill();
  }
  drawEyes(c, p, pal, gaze, { x: 12, y: -5, rx: 8, ry: 9 }, pal.main);
  blush(c, p, pal, 21, 8, 7);
  drawMouth(c, p, pal, f, 13, 12);
  if (p.mouth === 'smile' || p.mouth === 'small') {
    c.beginPath();
    c.moveTo(f + 4, 13.5);
    c.lineTo(f + 5.5, 17);
    c.lineTo(f + 7, 13);
    c.closePath();
    paint(c, '#ffffff', pal.outline, 1);
  }
}

function robot(c: Ctx, p: Pose, pal: HdPalette, t: number, head: () => void) {
  for (const side of [-1, 1]) {
    const lift = side < 0 ? p.legL : p.legR;
    const fy = -4 - lift;
    limb(c, side * 10, -20, side * 10, fy, 8, '#9aa6c4', pal.outline);
    rrect(c, side * 10 - 8, fy - 3, 16, 8, 4);
    paint(c, pal.dark, pal.outline, 2);
  }
  rrect(c, -21, -56, 42, 38, 11);
  const g = c.createLinearGradient(-21, -56, 21, -18);
  g.addColorStop(0, pal.light);
  g.addColorStop(0.5, pal.main);
  g.addColorStop(1, pal.dark);
  paint(c, g, pal.outline, 2.2);
  rrect(c, -11, -48, 22, 16, 5);
  paint(c, pal.inner, pal.outline, 1.6);
  const on = (Math.sin(t * 3) + 1) / 2;
  for (const [i, col] of [[-1, '#5be37d'], [0, pal.accent], [1, '#ff6b8f']] as [number, string][]) {
    ell(c, i * 6, -40, 2.2, 2.2);
    c.fillStyle = col;
    c.globalAlpha = 0.4 + 0.6 * (i === 0 ? on : 1 - on);
    c.fill();
    c.globalAlpha = 1;
  }
  for (const side of [-1, 1]) {
    const a = side < 0 ? p.armL : p.armR;
    const sx = side * 21;
    const [ex, ey] = armEnd(side, a, sx, -50, 20);
    limb(c, sx, -50, ex, ey, 7, '#9aa6c4', pal.outline);
    ell(c, sx, -50, 5, 5);
    paint(c, pal.dark, pal.outline, 1.6);
    ell(c, ex, ey, 6, 6);
    paint(c, pal.main, pal.outline, 1.8);
  }
  head();
}

function robotHead(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number], t: number) {
  // Antenna
  c.save();
  c.translate(0, -26);
  c.rotate(p.tail * 0.3);
  limb(c, 0, 0, 0, -12, 3, '#9aa6c4', pal.outline);
  c.shadowColor = pal.accent;
  c.shadowBlur = 10 + 6 * Math.sin(t * 4);
  ell(c, 0, -16, 5, 5);
  paint(c, pal.accent, pal.outline, 1.6);
  c.restore();
  for (const side of [-1, 1]) {
    ell(c, side * 32, 0, 5, 7);
    paint(c, pal.dark, pal.outline, 1.8);
  }
  rrect(c, -31, -26, 62, 50, 14);
  const g = c.createLinearGradient(-31, -26, 31, 24);
  g.addColorStop(0, pal.light);
  g.addColorStop(0.45, pal.main);
  g.addColorStop(1, pal.dark);
  paint(c, g, pal.outline, 2.4);
  rrect(c, -24, -18, 48, 34, 9);
  const s = c.createLinearGradient(0, -18, 0, 16);
  s.addColorStop(0, '#22305a');
  s.addColorStop(1, pal.inner);
  paint(c, s, pal.outline, 1.8);
  // Screen face
  const f = p.face * 3 + gaze[0] * 2;
  c.save();
  c.shadowColor = pal.iris;
  c.shadowBlur = 8;
  c.fillStyle = pal.iris;
  c.strokeStyle = pal.iris;
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    const ex = side * 10 + f;
    const ey = -5 + gaze[1] * 1.5;
    c.beginPath();
    switch (p.eyes) {
      case 'happy':
        c.arc(ex, ey + 3, 5, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
        break;
      case 'closed':
        c.moveTo(ex - 5, ey + 1);
        c.lineTo(ex + 5, ey + 1);
        c.stroke();
        break;
      case 'angry':
        c.moveTo(ex - side * 5, ey - 4);
        c.lineTo(ex + side * 5, ey + 1);
        c.moveTo(ex - side * 4, ey + 4);
        c.lineTo(ex + side * 4, ey + 4);
        c.stroke();
        break;
      case 'dizzy':
        c.moveTo(ex - 4, ey - 4);
        c.lineTo(ex + 4, ey + 4);
        c.moveTo(ex + 4, ey - 4);
        c.lineTo(ex - 4, ey + 4);
        c.stroke();
        break;
      default: {
        const h = (p.eyes === 'wide' ? 12 : 10) * (1 - p.blink * 0.9);
        rrect(c, ex - 3.5, ey - h / 2, 7, Math.max(1.5, h), 3);
        c.fill();
      }
    }
  }
  c.beginPath();
  const my = 9;
  if (p.mouth === 'talk' || p.mouth === 'open' || p.mouth === 'o') {
    const h = p.mouth === 'o' ? 3 : 1 + p.mouthOpen * 5;
    rrect(c, f - 6, my - h / 2, 12, h, 2);
    c.fill();
  } else if (p.mouth === 'frown') {
    c.arc(f, my + 5, 6, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
  } else {
    c.arc(f, my - 4, 7, Math.PI * 0.2, Math.PI * 0.8);
    c.stroke();
  }
  c.restore();
  if (p.blush > 0.3) {
    c.globalAlpha = Math.min(0.6, p.blush * 0.5);
    c.fillStyle = pal.cheek;
    for (const side of [-1, 1]) {
      rrect(c, side * 17 - 3 + f, 5, 6, 2.5, 1);
      c.fill();
    }
    c.globalAlpha = 1;
  }
}

function fluff(c: Ctx, pal: HdPalette, puffs: [number, number, number][]) {
  c.save();
  for (const [x, y, r] of puffs) {
    ell(c, x, y, r + 1.2, r + 1.2);
    c.fillStyle = pal.outline;
    c.fill();
  }
  for (const [x, y, r] of puffs) {
    ell(c, x, y, r, r);
    c.fillStyle = shade(c, x, y, r, pal);
    c.fill();
  }
  c.restore();
}

function sheep(c: Ctx, p: Pose, pal: HdPalette, head: () => void) {
  for (const side of [-1, 1]) {
    const lift = side < 0 ? p.legL : p.legR;
    const fy = -4 - lift;
    limb(c, side * 9, -18, side * 9, fy, 7, pal.accentDark, pal.outline);
    rrect(c, side * 9 - 5, fy - 2, 10, 5, 2);
    paint(c, '#3a2f57', pal.outline, 1.5);
  }
  fluff(c, pal, [
    [-16, -30, 11],
    [16, -30, 11],
    [0, -24, 13],
    [-10, -44, 12],
    [10, -44, 12],
    [0, -50, 11],
    [-20, -40, 8],
    [20, -40, 8],
  ]);
  for (const side of [-1, 1]) {
    const a = side < 0 ? p.armL : p.armR;
    const [ex, ey] = armEnd(side, a, side * 20, -40, 13);
    limb(c, side * 20, -40, ex, ey, 6, pal.accentDark, pal.outline);
    ell(c, ex, ey, 4.5, 4);
    paint(c, '#3a2f57', pal.outline, 1.4);
  }
  head();
}

function sheepHead(c: Ctx, p: Pose, pal: HdPalette, gaze: [number, number]) {
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * 22, -2);
    c.rotate(side * (0.5 + p.tail * 0.15));
    ell(c, side * 8, 0, 11, 5.5);
    paint(c, pal.accent, pal.outline, 2);
    ell(c, side * 8, 0, 7, 3);
    c.fillStyle = pal.inner;
    c.fill();
    c.restore();
  }
  fluff(c, pal, [
    [-14, -18, 9],
    [0, -23, 10],
    [14, -18, 9],
    [-21, -8, 7],
    [21, -8, 7],
  ]);
  ell(c, 0, 4, 23, 20);
  const g = c.createRadialGradient(-6, -4, 2, 0, 4, 24);
  g.addColorStop(0, '#fffaf4');
  g.addColorStop(1, pal.bellyDark);
  paint(c, g, pal.outline, 2.2);
  fluff(c, pal, [
    [-9, -14, 7],
    [2, -16, 8],
    [11, -13, 6],
  ]);
  drawEyes(c, p, pal, gaze, { x: 9, y: 3, rx: 6.5, ry: 7.5 }, pal.belly);
  blush(c, p, pal, 15, 13, 5.5);
  const f = p.face * 2;
  c.fillStyle = pal.nose;
  ell(c, f, 12, 3, 2);
  c.fill();
  drawMouth(c, p, pal, f, 15, 9);
}

// ---------------------------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------------------------

function accessoryHead(c: Ctx, a: Accessory, sp: HdSpecies, p: Pose) {
  const y = sp.hatY;
  switch (a) {
    case 'tophat': {
      c.save();
      c.translate(4, y + 2);
      c.rotate(0.12);
      ell(c, 0, 0, 20, 4.5);
      paint(c, '#2b2633', '#0d0b12', 2);
      rrect(c, -12, -22, 24, 22, 3);
      const g = c.createLinearGradient(-12, 0, 12, 0);
      g.addColorStop(0, '#3a3346');
      g.addColorStop(1, '#1d1924');
      paint(c, g, '#0d0b12', 2);
      c.fillStyle = '#e2493a';
      c.fillRect(-12, -7, 24, 5);
      c.restore();
      break;
    }
    case 'crown': {
      c.save();
      c.translate(0, y + 1);
      c.beginPath();
      c.moveTo(-15, 0);
      c.lineTo(-15, -12);
      c.lineTo(-8, -6);
      c.lineTo(0, -16);
      c.lineTo(8, -6);
      c.lineTo(15, -12);
      c.lineTo(15, 0);
      c.closePath();
      const g2 = c.createLinearGradient(0, -16, 0, 0);
      g2.addColorStop(0, '#fff1a6');
      g2.addColorStop(1, '#e0a51e');
      paint(c, g2, '#8a5a06', 2);
      for (const [x, col] of [[-8, '#ff3b5c'], [0, '#4aa8ff'], [8, '#5be37d']] as [number, string][]) {
        ell(c, x, -3, 2.2, 2.2);
        c.fillStyle = col;
        c.fill();
      }
      c.restore();
      break;
    }
    case 'bow':
      c.save();
      c.translate(17, y + 6);
      c.rotate(0.3);
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(side * 12, -10, side * 12, 0);
        c.quadraticCurveTo(side * 12, 10, 0, 0);
        paint(c, '#ff5c8a', '#a8204e', 1.8);
      }
      ell(c, 0, 0, 3.5, 3.5);
      paint(c, '#ffb0c8', '#a8204e', 1.6);
      c.restore();
      break;
    case 'flower':
      c.save();
      c.translate(-18, y + 6);
      for (let i = 0; i < 5; i++) {
        const a2 = (i / 5) * TAU;
        ell(c, Math.cos(a2) * 5, Math.sin(a2) * 5, 4, 4);
        paint(c, '#ff9ad5', '#b03a83', 1.2);
      }
      ell(c, 0, 0, 3.2, 3.2);
      paint(c, '#ffe066', '#b08a10', 1.2);
      c.restore();
      break;
    case 'glasses': {
      const [ex, ey] = eyesOf(sp);
      c.strokeStyle = '#1f1b2b';
      c.lineWidth = 2.4;
      for (const side of [-1, 1]) {
        ell(c, side * ex + p.face * 3, ey, ex * 0.8, ex * 0.8);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(-ex * 0.2 + p.face * 3, ey - 2);
      c.quadraticCurveTo(p.face * 3, ey - 5, ex * 0.2 + p.face * 3, ey - 2);
      c.stroke();
      break;
    }
  }
}

function scarf(c: Ctx) {
  rrect(c, -20, -62, 40, 9, 4.5);
  const g = c.createLinearGradient(0, -62, 0, -53);
  g.addColorStop(0, '#ff7b6b');
  g.addColorStop(1, '#d2453d');
  paint(c, g, '#7a1f1a', 1.8);
  rrect(c, 6, -56, 9, 20, 3);
  paint(c, g, '#7a1f1a', 1.8);
  c.fillStyle = '#ffd34a';
  c.fillRect(6, -42, 9, 2.5);
}

// ---------------------------------------------------------------------------------------------
// Food held while eating
// ---------------------------------------------------------------------------------------------

export function drawFood(c: Ctx, kind: FoodKind, x: number, y: number, left: number) {
  if (left <= 0.05) return;
  c.save();
  c.translate(x, y);
  c.scale(0.6 + left * 0.4, 0.6 + left * 0.4);
  switch (kind) {
    case 'fish':
      c.beginPath();
      c.ellipse(0, 0, 10, 6, 0, 0, TAU);
      paint(c, '#7ec8ff', '#2b5a8a', 1.6);
      c.beginPath();
      c.moveTo(9, 0);
      c.lineTo(16, -6);
      c.lineTo(16, 6);
      c.closePath();
      paint(c, '#4a90d9', '#2b5a8a', 1.6);
      ell(c, -5, -1, 1.5, 1.5);
      c.fillStyle = '#1d2b3a';
      c.fill();
      break;
    case 'berry':
      ell(c, 0, 0, 8, 8);
      paint(c, '#ff4f6d', '#8a1a2e', 1.6);
      c.fillStyle = '#4caf50';
      c.fillRect(-1, -11, 2, 4);
      break;
    case 'pepper':
      c.beginPath();
      c.moveTo(-3, -8);
      c.quadraticCurveTo(10, -6, 6, 10);
      c.quadraticCurveTo(-6, 4, -3, -8);
      paint(c, '#ff3b30', '#8a160f', 1.6);
      c.fillStyle = '#4caf50';
      c.fillRect(-4, -11, 3, 4);
      break;
    case 'battery':
      rrect(c, -10, -6, 18, 12, 2);
      paint(c, '#5be37d', '#1f6b38', 1.6);
      c.fillStyle = '#ffd34a';
      c.fillRect(8, -3, 3, 6);
      break;
    case 'carrot':
      c.beginPath();
      c.moveTo(-4, -8);
      c.lineTo(4, -8);
      c.lineTo(0, 11);
      c.closePath();
      paint(c, '#ff8a2b', '#a14a08', 1.6);
      c.fillStyle = '#4caf50';
      c.fillRect(-3, -13, 2, 5);
      c.fillRect(1, -13, 2, 5);
      break;
    case 'bone':
      rrect(c, -9, -2.5, 18, 5, 2);
      paint(c, '#f7f1e3', '#8a7f6a', 1.4);
      for (const s of [-1, 1]) {
        for (const d of [-1, 1]) {
          ell(c, s * 9, d * 2.5, 3.2, 3.2);
          paint(c, '#f7f1e3', '#8a7f6a', 1.4);
        }
      }
      break;
    case 'cookie':
      ell(c, 0, 0, 9, 9);
      paint(c, '#d99a54', '#7a4a1e', 1.6);
      c.fillStyle = '#5c3317';
      for (const [x, y] of [[-3, -3], [3, -1], [-1, 4], [4, 4]]) {
        ell(c, x, y, 1.6, 1.6);
        c.fill();
      }
      break;
    case 'seed':
      ell(c, 0, 0, 5, 8);
      paint(c, '#3d3a33', '#111', 1.4);
      ell(c, 0, 0, 2, 6);
      c.fillStyle = '#d8d2c0';
      c.fill();
      break;
    case 'star':
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 4 : 9;
        const a = (i / 10) * TAU - Math.PI / 2;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      paint(c, '#ffd34a', '#a87a00', 1.6);
      break;
    case 'marshmallow':
      rrect(c, -7, -6, 14, 12, 4);
      paint(c, '#ffffff', '#b7a3b0', 1.4);
      break;
    case 'lettuce':
      for (const [x, y] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) {
        ell(c, x, y, 6, 5);
        paint(c, '#7ed957', '#3c8a2a', 1.2);
      }
      break;
    case 'bamboo':
      rrect(c, -3, -12, 6, 24, 2);
      paint(c, '#7cc46b', '#3c7a33', 1.4);
      c.fillStyle = '#4f8f43';
      c.fillRect(-3, -4, 6, 1.5);
      c.fillRect(-3, 4, 6, 1.5);
      break;
    case 'clover':
      for (const a of [0, 2.1, 4.2]) {
        ell(c, Math.cos(a) * 5, Math.sin(a) * 5, 5, 5);
        paint(c, '#5fbf5a', '#2a6b28', 1.2);
      }
      break;
  }
  c.restore();
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

export const HEAD_Y = -82;

export function drawCharacter(
  c: Ctx,
  sp: HdSpecies,
  pal: HdPalette,
  p: Pose,
  gaze: [number, number],
  accessory: Accessory,
  t: number,
  food: { kind: FoodKind; left: number } | null,
) {
  // Ground shadow
  const air = Math.max(0, -p.y) + (sp.floaty ? 6 : 0);
  ell(c, 0, 0, 26 * Math.max(0.5, 1 - air / 60), 5 * Math.max(0.5, 1 - air / 60));
  c.fillStyle = `rgba(0,0,0,${0.22 * p.alpha})`;
  c.fill();

  if (p.alpha <= 0.01) return;
  c.save();
  c.globalAlpha = p.alpha;
  const float = sp.floaty ? -6 + Math.sin(t * 2.2) * 2.5 : 0;
  c.translate(p.x, p.y + float);
  if (p.spin) {
    c.translate(0, -55);
    c.rotate(p.spin);
    c.translate(0, 55);
  }
  c.scale(p.turn * p.sx, p.sy);
  c.rotate(p.lean);

  const head = () => {
    if (accessory === 'scarf') scarf(c);
    c.save();
    c.translate(0, HEAD_Y + p.headY);
    c.rotate(p.headTilt);
    switch (sp.kind) {
      case 'cat':
        catHead(c, p, pal, gaze);
        break;
      case 'frog':
        frogHead(c, p, pal, gaze);
        break;
      case 'dragon':
        dragonHead(c, p, pal, gaze);
        break;
      case 'robot':
        robotHead(c, p, pal, gaze, t);
        break;
      case 'sheep':
        sheepHead(c, p, pal, gaze);
        break;
      case 'critter':
        critterHead(c, p, pal, sp.critter!, gaze);
        break;
    }
    if (p.anger > 0.05) {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = p.anger * 0.25;
      ell(c, 0, 4, 30, 22);
      c.fillStyle = '#ff2a1a';
      c.fill();
      c.restore();
    }
    if (accessory !== 'none' && accessory !== 'scarf') accessoryHead(c, accessory, sp, p);
    c.restore();
    if (food) drawFood(c, food.kind, p.face * 3, HEAD_Y + p.headY + 26, food.left);
  };

  switch (sp.kind) {
    case 'cat':
      cat(c, p, pal, head);
      break;
    case 'frog':
      frog(c, p, pal, head);
      break;
    case 'dragon':
      dragon(c, p, pal, head);
      break;
    case 'robot':
      robot(c, p, pal, t, head);
      break;
    case 'sheep':
      sheep(c, p, pal, head);
      break;
    case 'critter':
      critterBody(c, p, pal, sp.critter!, t, head);
      break;
  }
  c.restore();
}

// ---------------------------------------------------------------------------------------------
// Trick props
// ---------------------------------------------------------------------------------------------

const EYES: Record<Exclude<HdKind, 'critter'>, [number, number]> = { cat: [12, -4], frog: [15, -14], dragon: [12, -5], robot: [10, -5], sheep: [9, 3] };

export function eyesOf(sp: HdSpecies): [number, number] {
  return sp.critter ? [sp.critter.eyes.x, sp.critter.eyes.y] : EYES[sp.kind as Exclude<HdKind, 'critter'>];
}

/** Props for tricks, drawn in character space on top of the character. `t` = seconds in state. */
export function drawProps(c: Ctx, sp: HdSpecies, p: Pose, state: string, t: number) {
  const headY = HEAD_Y + p.headY + p.y;
  switch (state) {
    case 'juggle': {
      const colors = ['#ff5c5c', '#ffd34a', '#4aa8ff'];
      for (let i = 0; i < 3; i++) {
        const ph = t * 1.4 + i / 3;
        const x = Math.sin(ph * TAU) * 24;
        const y = headY - 38 - Math.abs(Math.cos(ph * TAU)) * 28;
        ell(c, x, y, 5.5, 5.5);
        const g = c.createRadialGradient(x - 2, y - 2, 0.5, x, y, 6);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, colors[i]);
        g.addColorStop(1, colors[i]);
        paint(c, g, 'rgba(40,20,50,0.7)', 1.4);
      }
      break;
    }
    case 'shades': {
      const drop = Math.min(1, t / 0.7);
      const ease = 1 - Math.pow(1 - drop, 3);
      const [ex, ey] = eyesOf(sp);
      const y = headY + ey + 2 - (1 - ease) * 70 + (drop < 1 ? 0 : Math.sin(t * 2) * 0.5);
      c.save();
      c.translate(0, y);
      c.rotate(p.headTilt);
      for (const side of [-1, 1]) {
        c.beginPath();
        c.roundRect(side * ex - 11 + p.face * 3, -8, 22, 15, [3, 3, 9, 9]);
        const g = c.createLinearGradient(0, -6, 0, 5);
        g.addColorStop(0, '#2b2b3a');
        g.addColorStop(1, '#07070c');
        paint(c, g, '#000000', 1.6);
        c.fillStyle = 'rgba(255,255,255,0.45)';
        c.fillRect(side * ex - 7 + p.face * 3, -6, 6, 2.5);
      }
      c.strokeStyle = '#000';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-ex + 11 + p.face * 3, -4);
      c.lineTo(ex - 11 + p.face * 3, -4);
      c.stroke();
      c.restore();
      break;
    }
    case 'magic': {
      if (t > 0.75) break;
      c.save();
      c.translate(30, headY + 8);
      c.rotate(-0.6 + 0.4 * Math.sin(t * 18));
      c.lineCap = 'round';
      c.strokeStyle = '#1d1924';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -26);
      c.stroke();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, -22);
      c.lineTo(0, -26);
      c.stroke();
      c.restore();
      break;
    }
    case 'bubblegum': {
      if (t < 1.0 || t > 2.42) break;
      const r = Math.min(17, 2 + (t - 1.0) * 12);
      const [, ey] = eyesOf(sp);
      const y = headY + ey + 14 + r * 0.6;
      ell(c, p.face * 2.5, y, r, r * 0.92);
      const g = c.createRadialGradient(-r * 0.3, y - r * 0.35, 1, 0, y, r);
      g.addColorStop(0, '#ffe0ef');
      g.addColorStop(1, '#ff7ab8');
      c.save();
      c.globalAlpha *= 0.92;
      paint(c, g, '#c2457f', 1.6);
      c.restore();
      ell(c, -r * 0.35, y - r * 0.4, r * 0.18, r * 0.12);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.fill();
      break;
    }
    case 'yoyo': {
      const [hx, hy] = armEnd(1, p.armR, 17, -50, 21);
      const drop = 26 + 22 * Math.abs(Math.sin(t * 3.5));
      c.strokeStyle = 'rgba(40,30,50,0.8)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(hx, hy + drop);
      c.stroke();
      ell(c, hx, hy + drop, 6, 6);
      paint(c, '#ff4f6d', '#7a1a2e', 1.6);
      c.save();
      c.translate(hx, hy + drop);
      c.rotate(t * 12);
      c.fillStyle = '#ffd34a';
      c.fillRect(-1, -6, 2, 12);
      c.restore();
      break;
    }
    case 'selfie': {
      const [hx, hy] = armEnd(1, p.armR, 17, -50, 21);
      rrect(c, hx - 5, hy - 16, 10, 17, 2.5);
      paint(c, '#2b2b3a', '#0b0b12', 1.6);
      ell(c, hx, hy - 12, 1.4, 1.4);
      c.fillStyle = '#9fd3ff';
      c.fill();
      if (t > 1.45 && t < 1.75) {
        c.save();
        c.globalAlpha = 1 - (t - 1.45) / 0.3;
        ell(c, hx, hy - 12, 60, 60);
        const g = c.createRadialGradient(hx, hy - 12, 0, hx, hy - 12, 60);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fill();
        c.restore();
      }
      break;
    }
    case 'meditate': {
      const r = 34 + 4 * Math.sin(t * 2);
      const g = c.createRadialGradient(0, -48, 4, 0, -48, r * 1.6);
      g.addColorStop(0, 'rgba(255,240,160,0.35)');
      g.addColorStop(1, 'rgba(255,240,160,0)');
      c.save();
      c.globalCompositeOperation = 'destination-over';
      ell(c, 0, -48, r * 1.6, r * 1.6);
      c.fillStyle = g;
      c.fill();
      c.restore();
      break;
    }
  }
}
