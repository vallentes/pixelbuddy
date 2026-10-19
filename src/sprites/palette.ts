import type { ColorKey, ColorVariant, Palette } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

const VARIANT_HUE: Partial<Record<ColorVariant, number>> = { rose: 340, mint: 150, sky: 205, golden: 44 };
const RECOLORED: ColorKey[] = ['body', 'shade', 'light', 'accent', 'accentShade'];

export const VARIANTS: { id: ColorVariant; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'rose', label: 'Rose' },
  { id: 'mint', label: 'Mint' },
  { id: 'sky', label: 'Sky' },
  { id: 'golden', label: 'Golden' },
  { id: 'shadow', label: 'Shadow' },
];

/** Recolors a species palette while keeping its internal light/shade relationships. */
export function variantPalette(base: Palette, variant: ColorVariant): Palette {
  if (variant === 'classic') return base;
  const out = { ...base };
  const [bodyHue] = rgbToHsl(...hexToRgb(base.body));
  for (const key of RECOLORED) {
    let [h, s, l] = rgbToHsl(...hexToRgb(base[key]));
    if (variant === 'shadow') {
      s *= 0.35;
      l = Math.max(0.12, l * 0.55);
    } else {
      h += VARIANT_HUE[variant]! - bodyHue;
      s = Math.max(s, 0.45);
    }
    out[key] = rgbToHex(...hslToRgb(h, s, l));
  }
  if (variant === 'shadow') {
    out.outline = '#0f0c18';
    out.eye = '#ffe66d';
    out.shine = '#fffbe0';
  }
  return out;
}

export function tintAngry(p: Palette): Palette {
  return {
    ...p,
    body: mix(p.body, '#ff5a4f', 0.35),
    shade: mix(p.shade, '#d93a32', 0.35),
    light: mix(p.light, '#ff9a8f', 0.3),
  };
}
