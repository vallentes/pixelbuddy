import type { Palette, Species } from './types';

// Pixel-art versions of the ten newer pets. Same 32x32 grid conventions as species.ts.

const base = (p: Partial<Palette>): Palette => ({
  outline: '#2a2240',
  body: '#ffffff',
  shade: '#cccccc',
  light: '#ffffff',
  belly: '#ffffff',
  accent: '#ff8fa8',
  accentShade: '#d9668a',
  cheek: '#ff9fb5',
  eye: '#1d1720',
  extra: '#2a1d22',
  shine: '#ffffff',
  ...p,
});

const SH = ['shade', 'light'] as ['shade', 'light'];

export const pickles: Species = {
  id: 'pickles',
  name: 'Pickles',
  blurb: 'A very formal penguin butler. Will serve you snacks. Will eat them first.',
  palette: base({ outline: '#141a2b', body: '#3a4a6b', shade: '#1f2840', light: '#6b7fa8', accent: '#ffb03b', accentShade: '#d47f12', extra: '#2e3b57', eye: '#141414' }),
  shapes: [
    { k: 'ellipse', cx: 6.5, cy: 22, rx: 2.5, ry: 5, c: 'extra', tag: 'wing' },
    { k: 'ellipse', cx: 25.5, cy: 22, rx: 2.5, ry: 5, c: 'extra', tag: 'wing' },
    { k: 'ellipse', cx: 16, cy: 20, rx: 10, ry: 10, c: 'body', shade: SH },
    { k: 'ellipse', cx: 16, cy: 19.5, rx: 7, ry: 6, c: 'belly' },
    { k: 'ellipse', cx: 16, cy: 25.5, rx: 6, ry: 4, c: 'belly' },
    { k: 'px', pts: [[15, 21], [16, 21]], c: 'accent' },
  ],
  eyes: { l: [11, 17], r: [19, 17] },
  mouth: [15, 22],
  mouthColor: 'accentShade',
  cheeks: [[9, 20], [21, 20]],
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'accent' },
  head: [16, 10],
  neck: [16, 24],
  food: 'fish',
};

export const clover: Species = {
  id: 'clover',
  name: 'Clover',
  blurb: 'A bouncy bunny with zero chill and infinite carrots.',
  palette: base({ outline: '#5a4440', body: '#f4e9e1', shade: '#d6c3b6', light: '#ffffff', accent: '#ffb6c9', accentShade: '#e88aa5', eye: '#5e1c35' }),
  shapes: [
    { k: 'ellipse', cx: 12.5, cy: 8, rx: 2.3, ry: 5.5, c: 'body', tag: 'ear' },
    { k: 'ellipse', cx: 19.5, cy: 8, rx: 2.3, ry: 5.5, c: 'body', tag: 'ear' },
    { k: 'ellipse', cx: 12.5, cy: 8.5, rx: 1, ry: 4, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 19.5, cy: 8.5, rx: 1, ry: 4, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 26, cy: 24, rx: 2.5, ry: 2.5, c: 'light', tag: 'tail' },
    { k: 'ellipse', cx: 16, cy: 21, rx: 10, ry: 9, c: 'body', shade: SH },
    { k: 'ellipse', cx: 16, cy: 25.5, rx: 5.5, ry: 3.6, c: 'belly' },
  ],
  eyes: { l: [11, 18], r: [19, 18] },
  mouth: [15, 21],
  cheeks: [[8, 21], [22, 21]],
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'body' },
  head: [16, 12],
  neck: [16, 25],
  food: 'carrot',
};

export const waffles: Species = {
  id: 'waffles',
  name: 'Waffles',
  blurb: 'A puppy who loves you. And the mailman. And this pixel. And that one.',
  palette: base({ outline: '#4a2c16', body: '#e0a96b', shade: '#b07a42', light: '#f7d4a2', belly: '#fff3e2', accent: '#8a5a33', accentShade: '#5e3a1e', extra: '#2a1d22', eye: '#2a160a' }),
  shapes: [
    { k: 'px', pts: [[26, 22], [27, 21], [27, 20], [28, 19]], c: 'body', tag: 'tail' },
    { k: 'ellipse', cx: 16, cy: 20, rx: 10, ry: 9.5, c: 'body', shade: SH },
    { k: 'ellipse', cx: 6.5, cy: 18, rx: 2.5, ry: 5, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 25.5, cy: 18, rx: 2.5, ry: 5, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 16, cy: 23, rx: 4.5, ry: 3, c: 'belly' },
    { k: 'px', pts: [[15, 21], [16, 21]], c: 'extra' },
  ],
  eyes: { l: [11, 17], r: [19, 17] },
  mouth: [15, 23],
  cheeks: [[9, 21], [21, 21]],
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'belly' },
  head: [16, 11],
  neck: [16, 26],
  food: 'bone',
};

export const hoot: Species = {
  id: 'hoot',
  name: 'Hoot',
  blurb: 'A know-it-all owl professor. Ask him anything. He will answer. Correctly? Unclear.',
  palette: base({ outline: '#33241a', body: '#8c6a4f', shade: '#5f4532', light: '#c49a74', belly: '#f2dcc0', accent: '#6e523c', accentShade: '#463324', extra: '#ffb03b', eye: '#1d1209' }),
  shapes: [
    { k: 'tri', pts: [[7, 14], [9, 6], [12.5, 12]], c: 'accent', tag: 'ear' },
    { k: 'tri', pts: [[25, 14], [23, 6], [19.5, 12]], c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 6, cy: 22, rx: 2.5, ry: 5.5, c: 'accent', tag: 'wing' },
    { k: 'ellipse', cx: 26, cy: 22, rx: 2.5, ry: 5.5, c: 'accent', tag: 'wing' },
    { k: 'ellipse', cx: 16, cy: 20, rx: 10.5, ry: 10, c: 'body', shade: SH },
    { k: 'ellipse', cx: 12, cy: 18, rx: 3.6, ry: 3.6, c: 'belly' },
    { k: 'ellipse', cx: 20, cy: 18, rx: 3.6, ry: 3.6, c: 'belly' },
    { k: 'ellipse', cx: 16, cy: 25.5, rx: 6, ry: 3.8, c: 'belly' },
    { k: 'px', pts: [[15, 20], [16, 20], [15, 21], [16, 21]], c: 'extra' },
  ],
  eyes: { l: [11, 17], r: [19, 17] },
  mouth: [15, 22],
  mouthColor: 'accentShade',
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'extra' },
  head: [16, 10],
  neck: [16, 25],
  food: 'cookie',
};

export const biscuit: Species = {
  id: 'biscuit',
  name: 'Biscuit',
  blurb: 'A hamster with cheeks full of snacks and a heart full of more snacks.',
  palette: base({ outline: '#5c3517', body: '#f0b675', shade: '#c98a46', light: '#ffdcae', belly: '#fff6ea', accent: '#e39c5c', accentShade: '#b06b2e', eye: '#0c0705' }),
  shapes: [
    { k: 'ellipse', cx: 9, cy: 12.5, rx: 2.6, ry: 2.6, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 23, cy: 12.5, rx: 2.6, ry: 2.6, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 16, cy: 21, rx: 11, ry: 9, c: 'body', shade: SH },
    { k: 'ellipse', cx: 8.5, cy: 22, rx: 3, ry: 2.5, c: 'belly' },
    { k: 'ellipse', cx: 23.5, cy: 22, rx: 3, ry: 2.5, c: 'belly' },
    { k: 'ellipse', cx: 16, cy: 26, rx: 6, ry: 3, c: 'belly' },
  ],
  eyes: { l: [11, 18], r: [19, 18] },
  mouth: [15, 21],
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'accent' },
  head: [16, 12],
  neck: [16, 25],
  food: 'seed',
};

export const zib: Species = {
  id: 'zib',
  name: 'Zib',
  blurb: 'A tiny alien on a research mission to study humans. Findings so far: you are weird.',
  palette: base({ outline: '#1f4a2a', body: '#7ee08a', shade: '#3fa851', light: '#c4ffc8', belly: '#e4ffe6', accent: '#c48bff', accentShade: '#7f4ac9', eye: '#141414' }),
  shapes: [
    { k: 'px', pts: [[12, 9], [12, 10], [20, 9], [20, 10]], c: 'shade', tag: 'antenna' },
    { k: 'ellipse', cx: 11.5, cy: 7.5, rx: 1.7, ry: 1.7, c: 'accent', tag: 'antenna' },
    { k: 'ellipse', cx: 20.5, cy: 7.5, rx: 1.7, ry: 1.7, c: 'accent', tag: 'antenna' },
    { k: 'ellipse', cx: 16, cy: 25.5, rx: 5.5, ry: 4.5, c: 'body', shade: SH },
    { k: 'ellipse', cx: 16, cy: 17, rx: 10, ry: 7.5, c: 'body', shade: SH },
    { k: 'ellipse', cx: 16, cy: 26.5, rx: 3, ry: 2.4, c: 'belly' },
    { k: 'px', pts: [[12, 12], [20, 11], [21, 12]], c: 'shade' },
  ],
  eyes: { l: [11, 16], r: [19, 16] },
  mouth: [15, 20],
  cheeks: [[8, 19], [22, 19]],
  feet: { l: [11, 28], r: [17, 28], w: 4, h: 3, c: 'shade' },
  head: [16, 10],
  neck: [16, 24],
  food: 'star',
};

export const boo: Species = {
  id: 'boo',
  name: 'Boo',
  blurb: 'A ghost who really wants to be scary. Is instead extremely huggable.',
  palette: base({ outline: '#4b4f73', body: '#eef0ff', shade: '#c7cbe8', light: '#ffffff', accent: '#cfd4f2', accentShade: '#9da4cf', eye: '#1d1f33' }),
  shapes: [
    { k: 'ellipse', cx: 6, cy: 20, rx: 2.2, ry: 1.6, c: 'body', tag: 'wing' },
    { k: 'ellipse', cx: 26, cy: 20, rx: 2.2, ry: 1.6, c: 'body', tag: 'wing' },
    { k: 'ellipse', cx: 9, cy: 28, rx: 2.2, ry: 2, c: 'body' },
    { k: 'ellipse', cx: 14, cy: 28.5, rx: 2.2, ry: 2, c: 'body' },
    { k: 'ellipse', cx: 19, cy: 28, rx: 2.2, ry: 2, c: 'body' },
    { k: 'ellipse', cx: 23.5, cy: 28.5, rx: 2, ry: 2, c: 'body' },
    { k: 'rect', x: 7, y: 16, w: 18, h: 12, c: 'body', shade: SH },
    { k: 'ellipse', cx: 16, cy: 16, rx: 9, ry: 9, c: 'body', shade: SH },
  ],
  eyes: { l: [11, 16], r: [19, 16] },
  mouth: [15, 20],
  cheeks: [[9, 19], [21, 19]],
  feet: { l: [12, 26], r: [17, 26], w: 3, h: 2, c: 'body' },
  head: [16, 7],
  neck: [16, 23],
  food: 'marshmallow',
  floaty: true,
};

export const shelly: Species = {
  id: 'shelly',
  name: 'Shelly',
  blurb: 'A turtle who is never in a hurry. Wisdom level: very high. Speed level: no.',
  palette: base({ outline: '#2f4a26', body: '#8fd18a', shade: '#5ea65c', light: '#c9f2c2', belly: '#f6efc7', accent: '#b07a3f', accentShade: '#6e4a22', eye: '#0c0705' }),
  shapes: [
    { k: 'ellipse', cx: 5.5, cy: 21, rx: 2.2, ry: 2.6, c: 'body', tag: 'wing' },
    { k: 'ellipse', cx: 26.5, cy: 21, rx: 2.2, ry: 2.6, c: 'body', tag: 'wing' },
    { k: 'ellipse', cx: 16, cy: 21.5, rx: 11.5, ry: 8.5, c: 'accent', shade: ['accentShade'] },
    { k: 'px', pts: [[7, 19], [8, 23], [24, 19], [23, 23]], c: 'accentShade' },
    { k: 'ellipse', cx: 16, cy: 23.5, rx: 7.5, ry: 6, c: 'belly' },
    { k: 'ellipse', cx: 16, cy: 13, rx: 6.5, ry: 5.5, c: 'body', shade: SH },
  ],
  eyes: { l: [12, 12], r: [18, 12] },
  mouth: [15, 15],
  cheeks: [[10, 15], [20, 15]],
  feet: { l: [9, 28], r: [19, 28], w: 4, h: 3, c: 'shade' },
  head: [16, 8],
  neck: [16, 18],
  food: 'lettuce',
};

export const inky: Species = {
  id: 'inky',
  name: 'Inky',
  blurb: 'An octopus who can do eight things at once. Mostly snacking.',
  palette: base({ outline: '#3c2569', body: '#b38cff', shade: '#7e58cf', light: '#dcc8ff', belly: '#f1e7ff', accent: '#ff8fc7', accentShade: '#c95a92', eye: '#1a1230' }),
  shapes: [
    { k: 'ellipse', cx: 8, cy: 25, rx: 2, ry: 4.5, c: 'body', tag: 'tail' },
    { k: 'ellipse', cx: 12.5, cy: 26, rx: 2, ry: 4.5, c: 'body', tag: 'tail' },
    { k: 'ellipse', cx: 16, cy: 26.5, rx: 2, ry: 4.5, c: 'body' },
    { k: 'ellipse', cx: 19.5, cy: 26, rx: 2, ry: 4.5, c: 'body', tag: 'tail' },
    { k: 'ellipse', cx: 24, cy: 25, rx: 2, ry: 4.5, c: 'body', tag: 'tail' },
    { k: 'ellipse', cx: 16, cy: 15.5, rx: 10.5, ry: 9.5, c: 'body', shade: SH },
    { k: 'px', pts: [[11, 10], [20, 9], [22, 12]], c: 'light' },
  ],
  eyes: { l: [11, 15], r: [19, 15] },
  mouth: [15, 19],
  cheeks: [[8, 18], [22, 18]],
  feet: { l: [12, 27], r: [17, 27], w: 3, h: 2, c: 'body' },
  head: [16, 6],
  neck: [16, 23],
  food: 'fish',
};

export const bao: Species = {
  id: 'bao',
  name: 'Bao',
  blurb: 'A panda whose hobbies are bamboo, naps, and bamboo naps.',
  palette: base({ outline: '#1d1d22', body: '#f6f6f2', shade: '#d4d4cc', light: '#ffffff', accent: '#2a2a30', accentShade: '#111114', eye: '#ffffff', shine: '#1d1d22' }),
  shapes: [
    { k: 'ellipse', cx: 8.5, cy: 12.5, rx: 2.7, ry: 2.7, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 23.5, cy: 12.5, rx: 2.7, ry: 2.7, c: 'accent', tag: 'ear' },
    { k: 'ellipse', cx: 6.5, cy: 23, rx: 2.2, ry: 3, c: 'accent', tag: 'wing' },
    { k: 'ellipse', cx: 25.5, cy: 23, rx: 2.2, ry: 3, c: 'accent', tag: 'wing' },
    { k: 'ellipse', cx: 16, cy: 21, rx: 10.5, ry: 9.5, c: 'body', shade: SH },
    { k: 'ellipse', cx: 12, cy: 19, rx: 2.8, ry: 2.2, c: 'accent' },
    { k: 'ellipse', cx: 20, cy: 19, rx: 2.8, ry: 2.2, c: 'accent' },
    { k: 'px', pts: [[15, 21], [16, 21]], c: 'accent' },
  ],
  eyes: { l: [11, 18], r: [19, 18] },
  mouth: [15, 22],
  cheeks: [[8, 22], [22, 22]],
  feet: { l: [10, 28], r: [18, 28], w: 4, h: 3, c: 'accent' },
  head: [16, 12],
  neck: [16, 26],
  food: 'bamboo',
};

export const NEW_SPECIES: Species[] = [pickles, clover, waffles, hoot, biscuit, zib, boo, shelly, inky, bao];
