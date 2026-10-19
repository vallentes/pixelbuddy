// Pose rig for the HD characters: every state is a function of time that returns a target pose.
// The renderer eases the current pose toward the target, so transitions are always smooth.

import type { PetState } from '../sprites/types';

export type HdEyes = 'open' | 'closed' | 'happy' | 'angry' | 'dizzy' | 'wide';
export type HdMouth = 'smile' | 'open' | 'o' | 'frown' | 'small' | 'talk' | 'grin';

export interface Pose {
  x: number;
  y: number;
  sx: number;
  sy: number;
  lean: number;
  turn: number;
  headTilt: number;
  headY: number;
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  tail: number;
  blink: number;
  mouthOpen: number;
  blush: number;
  anger: number;
  face: number;
  /** Whole-body rotation around the body centre (backflips, faceplants). */
  spin: number;
  /** 0 = invisible (magic vanish). */
  alpha: number;
  eyes: HdEyes;
  mouth: HdMouth;
}

export const BASE: Pose = {
  x: 0,
  y: 0,
  sx: 1,
  sy: 1,
  lean: 0,
  turn: 1,
  headTilt: 0,
  headY: 0,
  armL: 0.25,
  armR: 0.25,
  legL: 0,
  legR: 0,
  tail: 0,
  blink: 0,
  mouthOpen: 0,
  blush: 0.35,
  anger: 0,
  face: 0,
  spin: 0,
  alpha: 1,
  eyes: 'open',
  mouth: 'smile',
};

const S = Math.sin;
const TAU = Math.PI * 2;
const pulse = (t: number, hz: number) => Math.max(0, S(t * TAU * hz));

/** Natural blinking: quick lid close roughly every 3-5 seconds. */
export function blinkAt(t: number, seed: number): number {
  const period = 3.4 + (seed % 1) * 1.6;
  const p = (t + seed * 7) % period;
  return p < 0.13 ? S((p / 0.13) * Math.PI) : 0;
}

export function poseFor(state: PetState, t: number, seed: number): Partial<Pose> {
  switch (state) {
    case 'idle':
      return {
        sy: 1 + 0.018 * S(t * TAU / 2.6),
        sx: 1 - 0.01 * S(t * TAU / 2.6),
        headTilt: 0.05 * S(t * 0.8 + seed),
        tail: 0.35 * S(t * 1.7),
        armL: 0.25 + 0.05 * S(t * 1.3),
        armR: 0.25 + 0.05 * S(t * 1.3 + 1),
        blink: blinkAt(t, seed),
      };
    case 'walk': {
      const w = S(t * TAU * 2.1);
      return {
        legL: Math.max(0, w) * 7,
        legR: Math.max(0, -w) * 7,
        y: -Math.abs(w) * 2.6,
        lean: 0.09,
        armL: 0.25 + 0.45 * w,
        armR: 0.25 - 0.45 * w,
        tail: 0.45 * S(t * TAU * 1.05),
        headTilt: 0.03 * w,
        face: 1,
        blink: blinkAt(t, seed),
      };
    }
    case 'sleep':
      return {
        eyes: 'closed',
        mouth: 'small',
        sy: 0.94 + 0.03 * S(t * TAU / 3.2),
        sx: 1.04,
        y: 2,
        headY: 6,
        headTilt: 0.18,
        armL: 0.1,
        armR: 0.1,
        tail: 0.1 * S(t * 0.6),
        blush: 0.5,
      };
    case 'eat': {
      const chew = pulse(t, 3.6);
      return {
        mouth: 'talk',
        mouthOpen: chew,
        eyes: chew < 0.3 ? 'happy' : 'open',
        armL: 2.0,
        armR: 2.0,
        headTilt: 0.06 * S(t * 7),
        tail: 0.6 * S(t * 3),
        blush: 0.6,
      };
    }
    case 'dance': {
      const b = S(t * Math.PI * 2.5);
      return {
        y: -Math.abs(b) * 9,
        lean: 0.22 * b,
        headTilt: -0.15 * b,
        armL: 2.6 + 0.5 * b,
        armR: 2.6 - 0.5 * b,
        legL: Math.max(0, b) * 6,
        legR: Math.max(0, -b) * 6,
        tail: 0.7 * b,
        eyes: 'happy',
        mouth: 'open',
        mouthOpen: 0.6,
        blush: 0.7,
      };
    }
    case 'happy': {
      const ph = (t * 1.7) % 1;
      const air = S(ph * Math.PI);
      const land = ph > 0.85 ? 1 : 0;
      return {
        y: -air * 20,
        sy: land ? 0.86 : 1 + air * 0.06,
        sx: land ? 1.1 : 1 - air * 0.03,
        armL: 2.7,
        armR: 2.7,
        legL: air * 4,
        legR: air * 4,
        tail: 0.8 * S(t * 12),
        eyes: 'happy',
        mouth: 'open',
        mouthOpen: 0.8,
        blush: 0.9,
      };
    }
    case 'angry':
      return {
        x: S(t * 42) * 1.6,
        eyes: 'angry',
        mouth: 'frown',
        armL: -0.5,
        armR: -0.5,
        headTilt: -0.05,
        tail: 0.9 * S(t * 18),
        anger: 1,
        blush: 0,
      };
    case 'fall':
      return {
        armL: 2.9 + 0.35 * S(t * 22),
        armR: 2.9 - 0.35 * S(t * 22),
        legL: -4,
        legR: -4,
        sy: 1.07,
        sx: 0.95,
        eyes: 'wide',
        mouth: 'o',
        tail: 0.9,
      };
    case 'land': {
      const k = Math.exp(-t * 7);
      return {
        sy: 1 - 0.28 * k * Math.cos(t * 22),
        sx: 1 + 0.2 * k * Math.cos(t * 22),
        eyes: t < 0.7 ? 'dizzy' : 'open',
        mouth: t < 0.7 ? 'o' : 'smile',
        headTilt: 0.15 * S(t * 9) * k,
        armL: 1.2 * k + 0.25,
        armR: 1.2 * k + 0.25,
      };
    }
    case 'drag':
      return {
        sy: 1.09,
        sx: 0.94,
        armL: 3.0,
        armR: 3.0,
        legL: -5 + 2 * S(t * 6),
        legR: -5 - 2 * S(t * 6),
        tail: -0.4 + 0.3 * S(t * 4),
        eyes: 'wide',
        mouth: 'o',
        headTilt: 0.08 * S(t * 3),
      };
    case 'wave':
      return {
        armR: 2.7 + 0.45 * S(t * 13),
        armL: 0.3,
        headTilt: 0.12,
        eyes: 'happy',
        mouth: 'open',
        mouthOpen: 0.5,
        tail: 0.5 * S(t * 5),
        blush: 0.7,
      };
    case 'yawn': {
      const k = S(Math.min(1, t / 1.3) * Math.PI);
      return {
        eyes: 'closed',
        mouth: 'talk',
        mouthOpen: k,
        armL: 0.25 + k * 2.7,
        armR: 0.25 + k * 2.7,
        sy: 1 + k * 0.07,
        sx: 1 - k * 0.04,
        headTilt: -0.12 * k,
      };
    }
    case 'laugh':
      return {
        y: -Math.abs(S(t * 16)) * 3,
        x: S(t * 20) * 0.8,
        lean: -0.08,
        headTilt: -0.15 + 0.06 * S(t * 16),
        armL: 0.9,
        armR: 0.9,
        eyes: 'happy',
        mouth: 'talk',
        mouthOpen: 0.5 + 0.5 * pulse(t, 7),
        tail: 0.6 * S(t * 14),
        blush: 1,
      };
    case 'spin':
      return {
        turn: Math.cos(t * TAU * 1.4),
        y: -Math.abs(S(t * TAU * 1.4)) * 8,
        armL: 2.2,
        armR: 2.2,
        eyes: 'happy',
        mouth: 'open',
        mouthOpen: 0.6,
        tail: 1.0,
      };
    case 'sneeze': {
      const before = t < 0.7;
      return {
        headTilt: before ? -0.25 * (t / 0.7) : 0.3 * Math.exp(-(t - 0.7) * 6),
        eyes: before ? 'closed' : t < 0.95 ? 'dizzy' : 'open',
        mouth: before ? 'o' : 'talk',
        mouthOpen: before ? 0.3 : Math.exp(-(t - 0.7) * 5),
        sy: before ? 1 + 0.05 * (t / 0.7) : 0.9 + 0.1 * (1 - Math.exp(-(t - 0.7) * 8)),
        sx: before ? 1 : 1.08,
        armL: 0.4,
        armR: 0.4,
      };
    }
    case 'scared':
      return {
        x: S(t * 50) * 1.4,
        sy: 0.93,
        sx: 1.04,
        armL: 2.3,
        armR: 2.3,
        eyes: 'wide',
        mouth: 'o',
        tail: -0.5,
        blush: 0,
      };
    case 'sit':
      return {
        y: 6,
        sy: 0.9,
        sx: 1.06,
        legL: -1,
        legR: -1,
        armL: 0.1,
        armR: 0.1,
        tail: 0.25 * S(t * 1.1),
        headTilt: 0.07 * S(t * 0.6),
        blink: blinkAt(t, seed),
        mouth: 'small',
      };
    case 'backflip': {
      if (t < 0.25) return { sy: 0.84, sx: 1.08, y: 2, armL: -0.3, armR: -0.3, eyes: 'closed', mouth: 'small' };
      if (t < 1.05) {
        const q = (t - 0.25) / 0.8;
        return { y: -Math.sin(q * Math.PI) * 58, spin: -TAU * q, armL: 2.8, armR: 2.8, legL: 4, legR: 4, eyes: 'happy', mouth: 'open', mouthOpen: 0.7, tail: 1 };
      }
      if (t < 1.3) return { sy: 0.8, sx: 1.12, armL: 1.6, armR: 1.6, eyes: 'happy', mouth: 'open' };
      return { armL: 2.9, armR: 2.9, eyes: 'happy', mouth: 'open', mouthOpen: 0.8, blush: 0.9, y: -Math.abs(S(t * 9)) * 3 };
    }
    case 'moonwalk': {
      const w = S(t * TAU * 1.6);
      return { lean: -0.14, legL: Math.max(0, w) * 3, legR: Math.max(0, -w) * 3, armL: 0.6 + 0.3 * w, armR: 1.2 - 0.3 * w, headTilt: 0.12 * S(t * 3.2), eyes: 'happy', mouth: 'smile', blush: 0.6, face: -1 };
    }
    case 'juggle':
      return { armL: 2.1 + 0.55 * S(t * 9), armR: 2.1 + 0.55 * S(t * 9 + Math.PI), headTilt: -0.08 + 0.05 * S(t * 4.5), eyes: 'open', mouth: 'small', sy: 1 + 0.01 * S(t * 9) };
    case 'magic': {
      if (t < 0.7) return { armR: 2.6 + 0.4 * S(t * 18), armL: 0.6, eyes: 'happy', mouth: 'open', mouthOpen: 0.4 };
      if (t < 1.0) return { alpha: 1 - (t - 0.7) / 0.3, sx: 1 + (t - 0.7), sy: 1 - (t - 0.7), armL: 2.6, armR: 2.6, eyes: 'closed' };
      if (t < 2.0) return { alpha: 0 };
      if (t < 2.3) return { alpha: (t - 2.0) / 0.3, y: -10, armL: 2.9, armR: 2.9, eyes: 'happy', mouth: 'open' };
      return { armL: 2.9, armR: 2.9, eyes: 'happy', mouth: 'open', mouthOpen: 0.9, blush: 1 };
    }
    case 'karate': {
      const punch = t > 0.5 && t < 0.8;
      const kick = t > 1.0 && t < 1.35;
      return { lean: 0.16, sy: 0.95, armR: punch ? 1.6 : 2.3, armL: 1.0, legR: kick ? 13 : 0, x: punch ? 3 : 0, eyes: 'angry', mouth: punch || kick ? 'open' : 'frown', mouthOpen: 0.8, anger: 0, tail: 0.6 };
    }
    case 'flex':
      return { armL: 2.35 + 0.08 * S(t * 10), armR: 2.35 + 0.08 * S(t * 10 + 1), sy: 1.05, sx: 1.04, eyes: t % 1.2 < 0.6 ? 'happy' : 'closed', mouth: 'grin', mouthOpen: 0.6, headTilt: 0.1 * S(t * 2), blush: 0.6 };
    case 'peekaboo':
      if (t < 1.4) return { armL: 2.75, armR: 2.75, eyes: 'closed', mouth: 'small', sy: 0.96, headTilt: 0.05 * S(t * 6) };
      return { armL: 1.7, armR: 1.7, eyes: 'wide', mouth: 'open', mouthOpen: 0.9, y: -Math.max(0, S((t - 1.4) * 6)) * 8, blush: 0.9 };
    case 'shades':
      return { lean: -0.08, headTilt: 0.12, armL: -0.55, armR: -0.55, eyes: 'open', mouth: 'smile', blush: 0.2, tail: 0.2 * S(t * 2) };
    case 'trip': {
      if (t < 0.3) return { lean: t * 1.6, legR: 6, armL: 1.6, armR: 1.6, eyes: 'wide', mouth: 'o' };
      if (t < 1.5) return { spin: 1.35, y: 6, armL: 2.9, armR: 2.9, legL: 3, legR: 5, eyes: 'dizzy', mouth: 'o' };
      const q = Math.min(1, (t - 1.5) / 0.4);
      return { spin: 1.35 * (1 - q), y: 6 * (1 - q), eyes: q < 1 ? 'dizzy' : 'open', mouth: 'small', blush: 0.9 };
    }
    case 'hiccup': {
      const ph = t % 0.9;
      const hic = ph < 0.18;
      return { y: hic ? -7 : 0, sy: hic ? 1.08 : 0.97, eyes: hic ? 'wide' : 'open', mouth: hic ? 'o' : 'small', armL: hic ? 0.9 : 0.3, armR: hic ? 0.9 : 0.3 };
    }
    case 'meditate':
      return { y: -12 - 3 * S(t * 1.6), sy: 0.92, legL: -2, legR: -2, armL: 1.25, armR: 1.25, eyes: 'closed', mouth: 'small', headTilt: 0.04 * S(t * 0.8), blush: 0.4 };
    case 'toot': {
      if (t < 0.35) return { eyes: 'wide', mouth: 'o', sy: 1.03 };
      return { eyes: 'happy', mouth: 'grin', mouthOpen: 0.5, blush: 1.2, headTilt: 0.15 * S(t * 5), armL: 0.9, armR: 0.9 };
    }
    case 'stretch': {
      const k = S(Math.min(1, t / 1.6) * Math.PI);
      return { armL: 0.25 + 2.85 * k, armR: 0.25 + 2.85 * k, sy: 1 + 0.12 * k, sx: 1 - 0.05 * k, eyes: 'closed', mouth: k > 0.5 ? 'talk' : 'small', mouthOpen: k * 0.8, lean: 0.04 * S(t * 3) };
    }
    case 'sing':
      return {
        lean: 0.12 * S(t * TAU * 0.6),
        headTilt: -0.12 * S(t * TAU * 0.6),
        armR: 1.9 + 0.3 * S(t * 3),
        armL: 0.4,
        eyes: 'closed',
        mouth: 'talk',
        mouthOpen: 0.35 + 0.55 * pulse(t, 2),
        tail: 0.5 * S(t * 2.5),
        blush: 0.7,
      };
  }
}

const NUMERIC = Object.keys(BASE).filter((k) => typeof BASE[k as keyof Pose] === 'number') as (keyof Pose)[];

/** Eases `cur` toward `target` with frame-rate independent smoothing. */
export function easePose(cur: Pose, target: Pose, dt: number, rate = 14): Pose {
  const a = 1 - Math.exp(-dt * rate);
  const out = { ...cur };
  for (const k of NUMERIC) {
    // turn crosses zero during spins; follow it exactly so the flip is visible.
    const r = k === 'turn' || k === 'blink' || k === 'mouthOpen' || k === 'spin' || k === 'alpha' ? 1 : a;
    (out[k] as number) = (cur[k] as number) + ((target[k] as number) - (cur[k] as number)) * r;
  }
  out.eyes = target.eyes;
  out.mouth = target.mouth;
  return out;
}

export function targetPose(state: PetState, t: number, seed: number, talking: number | null): Pose {
  const p = { ...BASE, ...poseFor(state, t, seed) };
  if (talking !== null && (state === 'idle' || state === 'walk' || state === 'sit' || state === 'wave')) {
    p.mouth = 'talk';
    p.mouthOpen = 0.15 + 0.65 * pulse(talking, 7.5);
  }
  return p;
}
