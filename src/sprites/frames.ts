import type { FrameSpec, PetState, StateAnim } from './types';

const idle: StateAnim = {
  frameMs: 230,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'small', cheeks: true },
    { eyes: 'open', mouth: 'small', cheeks: true, sy: 0.97, sx: 1.02, wiggle: 1 },
    { eyes: 'open', mouth: 'small', cheeks: true, sy: 0.95, sx: 1.03, wiggle: 1 },
    { eyes: 'open', mouth: 'small', cheeks: true, sy: 0.97, sx: 1.02 },
    { eyes: 'open', mouth: 'small', cheeks: true, wiggle: -1 },
    { eyes: 'closed', mouth: 'small', cheeks: true },
  ],
};

const walk: StateAnim = {
  frameMs: 120,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'small', look: 1, shear: 0.05, feet: { l: [1, 0], r: [-1, -1] }, wiggle: 1 },
    { eyes: 'open', mouth: 'small', look: 1, shear: 0.05, dy: -1, wiggle: 0 },
    { eyes: 'open', mouth: 'small', look: 1, shear: 0.05, feet: { l: [-1, -1], r: [1, 0] }, wiggle: -1 },
    { eyes: 'open', mouth: 'small', look: 1, shear: 0.05, dy: -1, wiggle: 0 },
  ],
};

const sleep: StateAnim = {
  frameMs: 520,
  loop: true,
  frames: [
    { eyes: 'closed', mouth: 'none', dy: 1, sy: 0.92, sx: 1.04, particles: [{ p: 'z', x: 24, y: 9 }] },
    { eyes: 'closed', mouth: 'small', dy: 1, sy: 0.9, sx: 1.05, particles: [{ p: 'z', x: 25, y: 6 }] },
    { eyes: 'closed', mouth: 'small', dy: 1, sy: 0.9, sx: 1.05, particles: [{ p: 'z', x: 26, y: 3 }, { p: 'z', x: 23, y: 9 }] },
    { eyes: 'closed', mouth: 'none', dy: 1, sy: 0.92, sx: 1.04, particles: [{ p: 'z', x: 24, y: 6 }] },
  ],
};

const eat: StateAnim = {
  frameMs: 190,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'open', food: 0, cheeks: true },
    { eyes: 'happy', mouth: 'small', food: 1, cheeks: true, sy: 0.96, sx: 1.03 },
    { eyes: 'happy', mouth: 'o', food: 1, cheeks: true, particles: [{ p: 'crumb', x: 12, y: 27 }] },
    { eyes: 'open', mouth: 'open', food: 2, cheeks: true },
    { eyes: 'happy', mouth: 'small', food: 3, cheeks: true, sy: 0.96, sx: 1.03, particles: [{ p: 'crumb', x: 20, y: 28 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true, particles: [{ p: 'heart', x: 24, y: 5 }] },
  ],
};

const dance: StateAnim = {
  frameMs: 140,
  loop: true,
  frames: [
    { eyes: 'happy', mouth: 'smile', cheeks: true, shear: 0.12, wiggle: 1, particles: [{ p: 'note', x: 3, y: 6 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, shear: 0.12, dy: -2, feet: { l: [0, -1] }, wiggle: 1, particles: [{ p: 'note', x: 3, y: 4 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true, wiggle: 0, sy: 0.95, sx: 1.04 },
    { eyes: 'happy', mouth: 'open', cheeks: true, dy: -2, feet: { r: [0, -1] }, wiggle: -1, particles: [{ p: 'sparkle', x: 26, y: 6 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true, shear: -0.12, wiggle: -1, particles: [{ p: 'note', x: 26, y: 6 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, shear: -0.12, dy: -2, feet: { r: [0, -1] }, wiggle: -1, particles: [{ p: 'note', x: 26, y: 4 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true, wiggle: 0, sy: 0.95, sx: 1.04 },
    { eyes: 'happy', mouth: 'open', cheeks: true, dy: -2, feet: { l: [0, -1] }, wiggle: 1, particles: [{ p: 'sparkle', x: 3, y: 6 }] },
  ],
};

const happy: StateAnim = {
  frameMs: 120,
  loop: true,
  frames: [
    { eyes: 'happy', mouth: 'open', cheeks: true, sy: 0.92, sx: 1.06 },
    { eyes: 'happy', mouth: 'open', cheeks: true, dy: -3, sy: 1.05, sx: 0.97, wiggle: 1, particles: [{ p: 'heart', x: 22, y: 7 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, dy: -5, wiggle: 1, particles: [{ p: 'heart', x: 23, y: 4 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, dy: -3, wiggle: -1, particles: [{ p: 'heart', x: 24, y: 1 }, { p: 'sparkle', x: 4, y: 8 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true, sy: 0.9, sx: 1.08, particles: [{ p: 'sparkle', x: 4, y: 6 }] },
    { eyes: 'happy', mouth: 'smile', cheeks: true },
  ],
};

const angry: StateAnim = {
  frameMs: 110,
  loop: true,
  frames: [
    { eyes: 'angry', mouth: 'frown', dx: -1, tint: 'angry', particles: [{ p: 'anger', x: 24, y: 8 }] },
    { eyes: 'angry', mouth: 'frown', dx: 1, tint: 'angry', particles: [{ p: 'anger', x: 24, y: 8 }, { p: 'steam', x: 5, y: 9 }] },
    { eyes: 'angry', mouth: 'frown', dx: -1, tint: 'angry', particles: [{ p: 'steam', x: 4, y: 7 }] },
    { eyes: 'angry', mouth: 'frown', dx: 1, tint: 'angry', particles: [{ p: 'anger', x: 25, y: 7 }, { p: 'steam', x: 26, y: 10 }] },
    { eyes: 'angry', mouth: 'frown', tint: 'angry', sy: 0.95, sx: 1.04, particles: [{ p: 'anger', x: 25, y: 7 }] },
    { eyes: 'angry', mouth: 'frown', tint: 'angry' },
  ],
};

const fall: StateAnim = {
  frameMs: 130,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'o', sy: 1.07, sx: 0.95, feet: { l: [0, 1], r: [0, 1] }, particles: [{ p: 'bang', x: 25, y: 5 }] },
    { eyes: 'open', mouth: 'o', sy: 1.09, sx: 0.94, feet: { l: [0, 1], r: [0, 1] }, wiggle: 1, particles: [{ p: 'bang', x: 25, y: 4 }] },
  ],
};

const land: StateAnim = {
  frameMs: 150,
  loop: false,
  frames: [
    { eyes: 'dizzy', mouth: 'o', sy: 0.8, sx: 1.15 },
    { eyes: 'dizzy', mouth: 'small', sy: 0.9, sx: 1.07, particles: [{ p: 'sparkle', x: 6, y: 9 }] },
    { eyes: 'dizzy', mouth: 'small', sy: 1.03, sx: 0.98, particles: [{ p: 'sparkle', x: 14, y: 6 }] },
    { eyes: 'dizzy', mouth: 'small', particles: [{ p: 'sparkle', x: 23, y: 9 }] },
    { eyes: 'open', mouth: 'smile', cheeks: true },
  ],
};

const drag: StateAnim = {
  frameMs: 220,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'o', sy: 1.08, sx: 0.95, feet: { l: [0, 1], r: [0, 2] }, wiggle: 1 },
    { eyes: 'open', mouth: 'small', sy: 1.1, sx: 0.94, feet: { l: [0, 2], r: [0, 1] }, wiggle: -1 },
  ],
};

const wave: StateAnim = {
  frameMs: 150,
  loop: true,
  frames: [
    { eyes: 'happy', mouth: 'smile', cheeks: true, paw: [0, -2] },
    { eyes: 'happy', mouth: 'open', cheeks: true, paw: [1, -4], shear: -0.03 },
    { eyes: 'happy', mouth: 'smile', cheeks: true, paw: [0, -2] },
    { eyes: 'happy', mouth: 'open', cheeks: true, paw: [1, -4], shear: -0.03, particles: [{ p: 'sparkle', x: 27, y: 6 }] },
  ],
};

const yawn: StateAnim = {
  frameMs: 230,
  loop: false,
  frames: [
    { eyes: 'closed', mouth: 'small' },
    { eyes: 'closed', mouth: 'o', sy: 1.04, sx: 0.98 },
    { eyes: 'closed', mouth: 'open', sy: 1.08, sx: 0.96, paw: [0, -3] },
    { eyes: 'closed', mouth: 'open', sy: 1.08, sx: 0.96, paw: [0, -3] },
    { eyes: 'closed', mouth: 'o', sy: 1.02 },
    { eyes: 'open', mouth: 'small', cheeks: true },
  ],
};

const laugh: StateAnim = {
  frameMs: 100,
  loop: true,
  frames: [
    { eyes: 'happy', mouth: 'open', cheeks: true, shear: 0.05 },
    { eyes: 'happy', mouth: 'smile', cheeks: true, dy: -1, sy: 0.96, sx: 1.03, particles: [{ p: 'star', x: 3, y: 8 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, shear: -0.05 },
    { eyes: 'happy', mouth: 'smile', cheeks: true, dy: -1, sy: 0.96, sx: 1.03, particles: [{ p: 'star', x: 26, y: 7 }] },
  ],
};

const spin: StateAnim = {
  frameMs: 85,
  loop: true,
  frames: [
    { eyes: 'happy', mouth: 'open', sx: 1, wiggle: 1 },
    { eyes: 'happy', mouth: 'open', sx: 0.55, dy: -1 },
    { eyes: 'none', mouth: 'none', sx: -0.55, dy: -2 },
    { eyes: 'happy', mouth: 'open', sx: -1, dy: -1, wiggle: -1 },
    { eyes: 'happy', mouth: 'open', sx: -0.55 },
    { eyes: 'none', mouth: 'none', sx: 0.55, particles: [{ p: 'puff', x: 3, y: 26 }, { p: 'puff', x: 26, y: 26 }] },
  ],
};

const sneeze: StateAnim = {
  frameMs: 170,
  loop: false,
  frames: [
    { eyes: 'closed', mouth: 'o', sy: 1.03 },
    { eyes: 'closed', mouth: 'o', sy: 1.06, sx: 0.97, dy: -1 },
    { eyes: 'closed', mouth: 'o', sy: 1.09, sx: 0.95, dy: -1, particles: [{ p: 'bang', x: 25, y: 5 }] },
    { eyes: 'closed', mouth: 'open', sy: 0.88, sx: 1.1, dx: -1, particles: [{ p: 'puff', x: 22, y: 17 }, { p: 'puff', x: 26, y: 14 }, { p: 'steam', x: 27, y: 19 }] },
    { eyes: 'dizzy', mouth: 'small', particles: [{ p: 'puff', x: 27, y: 14 }] },
    { eyes: 'open', mouth: 'small', cheeks: true },
  ],
};

const scared: StateAnim = {
  frameMs: 80,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'o', dx: -1, sy: 0.94, sx: 1.04, particles: [{ p: 'sweat', x: 24, y: 9 }] },
    { eyes: 'open', mouth: 'o', dx: 1, sy: 0.94, sx: 1.04, particles: [{ p: 'sweat', x: 24, y: 10 }, { p: 'bang', x: 5, y: 5 }] },
  ],
};

const sit: StateAnim = {
  frameMs: 320,
  loop: true,
  frames: [
    { eyes: 'open', mouth: 'small', cheeks: true, dy: 2, sy: 0.88, sx: 1.07, feet: { l: [-1, 0], r: [1, 0] } },
    { eyes: 'open', mouth: 'small', cheeks: true, dy: 2, sy: 0.87, sx: 1.08, feet: { l: [-1, 0], r: [1, 0] }, wiggle: 1 },
    { eyes: 'open', mouth: 'smile', cheeks: true, dy: 2, sy: 0.88, sx: 1.07, feet: { l: [-1, 0], r: [1, 0] }, wiggle: 1 },
    { eyes: 'closed', mouth: 'small', cheeks: true, dy: 2, sy: 0.88, sx: 1.07, feet: { l: [-1, 0], r: [1, 0] } },
  ],
};

const sing: StateAnim = {
  frameMs: 170,
  loop: true,
  frames: [
    { eyes: 'closed', mouth: 'o', cheeks: true, shear: 0.06, particles: [{ p: 'note', x: 3, y: 7 }] },
    { eyes: 'closed', mouth: 'open', cheeks: true, shear: 0.06, sy: 1.04, particles: [{ p: 'note', x: 4, y: 4 }] },
    { eyes: 'happy', mouth: 'o', cheeks: true, particles: [{ p: 'note', x: 26, y: 8 }] },
    { eyes: 'closed', mouth: 'open', cheeks: true, shear: -0.06, sy: 1.04, particles: [{ p: 'note', x: 26, y: 5 }] },
    { eyes: 'closed', mouth: 'o', cheeks: true, shear: -0.06, particles: [{ p: 'note', x: 27, y: 2 }, { p: 'sparkle', x: 3, y: 9 }] },
    { eyes: 'happy', mouth: 'open', cheeks: true, paw: [0, -3], particles: [{ p: 'confetti', x: 4, y: 5 }] },
  ],
};

export const ANIMS: Record<PetState, StateAnim> = {
  idle, walk, sleep, eat, dance, happy, angry, fall, land, drag, wave, yawn, laugh, spin, sneeze, scared, sit, sing,
  // Tricks: the HD style has dedicated animations; pixel art reuses the closest move.
  backflip: spin,
  moonwalk: walk,
  juggle: laugh,
  magic: spin,
  karate: angry,
  flex: wave,
  peekaboo: yawn,
  shades: happy,
  trip: land,
  hiccup: scared,
  meditate: sleep,
  toot: sneeze,
  stretch: yawn,
};
export const STATES = Object.keys(ANIMS) as PetState[];
/** Extra bob for floaty species so they hover instead of standing. */
export function floatyBob(state: PetState, frame: number, spec: FrameSpec): FrameSpec {
  if (state !== 'idle' && state !== 'walk' && state !== 'sleep' && state !== 'sit') return spec;
  return { ...spec, dy: (spec.dy ?? 0) + (frame % 2 === 0 ? -1 : 0) };
}
