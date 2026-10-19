import type { Accessory, FoodKind, ParticleKind } from './types';

/** A tiny bitmap: rows of characters, each mapped to a color ('.' is transparent). */
export interface Bitmap {
  rows: string[];
  colors: Record<string, string>;
}

export const PARTICLES: Record<ParticleKind, Bitmap> = {
  z: { rows: ['ZZZZ', '..Z.', '.Z..', 'ZZZZ'], colors: { Z: '#dfe6ff' } },
  heart: { rows: ['.H.H.', 'HhHHH', 'HHHHH', '.HHH.', '..H..'], colors: { H: '#ff5c8a', h: '#ffc2d4' } },
  note: { rows: ['..NN', '..N.', '..N.', 'NNN.', 'NNN.'], colors: { N: '#7ee0b5' } },
  sparkle: { rows: ['.S.', 'SWS', '.S.'], colors: { S: '#ffe066', W: '#ffffff' } },
  steam: { rows: ['.ss', 'sss', 'ss.'], colors: { s: '#e4e4ee' } },
  anger: { rows: ['R.R', '.R.', 'R.R'], colors: { R: '#ff3b3b' } },
  bang: { rows: ['Y', 'Y', 'Y', '.', 'Y'], colors: { Y: '#ffd34a' } },
  crumb: { rows: ['c'], colors: { c: '#c98a4a' } },
  sweat: { rows: ['.b.', 'bwb', 'bbb', '.b.'], colors: { b: '#6ec6ff', w: '#e6f6ff' } },
  confetti: { rows: ['r..y', '..b.', 'g...', '..p.'], colors: { r: '#ff5c5c', y: '#ffd34a', b: '#4aa8ff', g: '#5be37d', p: '#ff7ad9' } },
  puff: { rows: ['.ww.', 'wwww', '.ww.'], colors: { w: '#f2f0fa' } },
  star: { rows: ['..y..', '.yyy.', 'yyyyy', '.y.y.'], colors: { y: '#ffd34a' } },
};

export const FOOD: Record<FoodKind, Bitmap> = {
  fish: { rows: ['.BBB.b', 'BwBBBb', '.BBB.b'], colors: { B: '#7ec8ff', b: '#4a90d9', w: '#1d2b3a' } },
  berry: { rows: ['.g.', 'RRR', 'RrR', '.R.'], colors: { R: '#ff4f6d', r: '#ffb3c1', g: '#4caf50' } },
  pepper: { rows: ['..g', '.PP', 'PPP', 'PP.'], colors: { P: '#ff3b30', g: '#4caf50' } },
  battery: { rows: ['GGGG.', 'GgGGy', 'GGGG.'], colors: { G: '#5be37d', g: '#c8ffd6', y: '#ffd34a' } },
  clover: { rows: ['C.C', '.C.', 'C.C', '..s'], colors: { C: '#5fbf5a', s: '#3e7d3a' } },
};

/** Accessories are anchored by `anchor`: 'head' bottom row sits on the head top, 'neck' top row at the neck. */
export const ACCESSORIES: Record<Exclude<Accessory, 'none' | 'glasses'>, Bitmap & { anchor: 'head' | 'neck'; dx: number }> = {
  bow: { rows: ['rR.Rr', 'RRoRR', 'rR.Rr'], colors: { R: '#ff5c8a', r: '#c23866', o: '#ffd0dc' }, anchor: 'head', dx: 4 },
  tophat: {
    rows: ['..KKKKK..', '..KkKKK..', '..KkKKK..', '..RRRRR..', 'KKKKKKKKK'],
    colors: { K: '#2b2633', k: '#4a4258', R: '#e2493a' },
    anchor: 'head',
    dx: 0,
  },
  crown: {
    rows: ['Y..Y..Y', 'YY.Y.YY', 'YYYYYYY', 'yRyyyBy'],
    colors: { Y: '#ffd34a', y: '#d9a520', R: '#ff3b5c', B: '#4aa8ff' },
    anchor: 'head',
    dx: 0,
  },
  flower: { rows: ['.P.', 'PYP', '.P.', '.G.'], colors: { P: '#ff9ad5', Y: '#ffe066', G: '#5fbf5a' }, anchor: 'head', dx: 5 },
  scarf: {
    rows: ['SSSSSSSSSSSS', 'ssssssssssss', '........Ss..', '........Ss..'],
    colors: { S: '#ff6b5a', s: '#d2453d' },
    anchor: 'neck',
    dx: 0,
  },
};

export const ACCESSORY_LIST: { id: Accessory; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'bow', label: 'Bow' },
  { id: 'tophat', label: 'Top hat' },
  { id: 'crown', label: 'Crown' },
  { id: 'scarf', label: 'Scarf' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'flower', label: 'Flower' },
];

export const GLASSES_COLOR = '#1f1b2b';
