// A flexible "critter" rig for the newer HD characters: ear styles, beaks, flippers, wings,
// tentacles, shells, ghost sheets and face markings. All designs are original.

import type { Pose } from './pose';
import { arms, belly, blush, drawEyes, drawMouth, ell, legs, limb, armEnd, paint, shade, type EyeSpec, type HdPalette } from './draw';

type Ctx = CanvasRenderingContext2D;

export interface CritterSpec {
  body: { rx: number; ry: number; cy: number };
  head: { rx: number; ry: number };
  ears: 'none' | 'round' | 'long' | 'floppy' | 'tufts' | 'antennae';
  face: 'plain' | 'muzzle' | 'beak' | 'penguin' | 'panda';
  eyes: EyeSpec;
  belly?: boolean;
  arms: 'paws' | 'flippers' | 'wings' | 'tentacles' | 'nubs';
  legs: 'feet' | 'stubby' | 'tentacles' | 'ghost';
  tail?: 'puff' | 'curl' | 'stub';
  shell?: boolean;
  pouches?: boolean;
  spots?: boolean;
  catMouth?: boolean;
  nose?: 'dot' | 'pink' | 'none';
  mouthY?: number;
}

function earShapes(c: Ctx, p: Pose, pal: HdPalette, s: CritterSpec) {
  const wig = p.tail * 0.12;
  for (const side of [-1, 1]) {
    switch (s.ears) {
      case 'round':
        ell(c, side * (s.head.rx - 6), -s.head.ry + 4, 10, 10);
        paint(c, pal.accent, pal.outline, 2.2);
        ell(c, side * (s.head.rx - 6), -s.head.ry + 5, 5.5, 5.5);
        c.fillStyle = pal.inner;
        c.fill();
        break;
      case 'long':
        c.save();
        c.translate(side * 11, -s.head.ry + 6);
        c.rotate(side * (0.12 + wig));
        ell(c, 0, -20, 8, 22);
        paint(c, shade(c, 0, -20, 22, pal), pal.outline, 2.2);
        ell(c, 0, -19, 4, 16);
        c.fillStyle = pal.inner;
        c.fill();
        c.restore();
        break;
      case 'floppy':
        c.save();
        c.translate(side * (s.head.rx - 4), -10);
        c.rotate(side * (0.25 + wig * 1.5));
        ell(c, side * 3, 14, 9, 18);
        paint(c, pal.accent, pal.outline, 2.2);
        c.restore();
        break;
      case 'tufts':
        c.beginPath();
        c.moveTo(side * (s.head.rx - 14), -s.head.ry + 6);
        c.lineTo(side * (s.head.rx - 2), -s.head.ry - 14);
        c.lineTo(side * (s.head.rx + 1), -s.head.ry + 10);
        c.closePath();
        paint(c, pal.accent, pal.outline, 2);
        break;
      case 'antennae': {
        c.save();
        c.translate(side * 10, -s.head.ry + 4);
        c.rotate(side * (0.35 + wig));
        limb(c, 0, 0, 0, -18, 3, pal.dark, pal.outline);
        ell(c, 0, -21, 5, 5);
        paint(c, pal.accent, pal.outline, 1.8);
        c.restore();
        break;
      }
    }
  }
}

function faceMarks(c: Ctx, p: Pose, pal: HdPalette, s: CritterSpec) {
  const f = p.face * 2.5;
  switch (s.face) {
    case 'muzzle':
      ell(c, f, 10, s.head.rx * 0.45, s.head.ry * 0.36);
      c.fillStyle = pal.belly;
      c.fill();
      break;
    case 'penguin':
      for (const side of [-1, 1]) {
        ell(c, side * 9 + f, -1, 13, 15);
        c.fillStyle = pal.belly;
        c.fill();
      }
      ell(c, f, 10, 17, 11);
      c.fill();
      break;
    case 'panda':
      ell(c, f, 9, s.head.rx * 0.42, s.head.ry * 0.33);
      c.fillStyle = pal.belly;
      c.fill();
      for (const side of [-1, 1]) {
        ell(c, side * s.eyes.x + f * 0.6, s.eyes.y + 1, s.eyes.rx + 5, s.eyes.ry + 6, side * -0.5);
        c.fillStyle = pal.accent;
        c.fill();
      }
      break;
  }
  if (s.spots) {
    c.fillStyle = pal.dark;
    for (const [x, y, r] of [[-14, -16, 3], [12, -19, 2.4], [-4, -22, 2]]) {
      ell(c, x, y, r, r * 0.8);
      c.fill();
    }
  }
  if (s.pouches) {
    for (const side of [-1, 1]) {
      ell(c, side * (s.head.rx - 8) + f, 8, 11, 9);
      c.fillStyle = pal.belly;
      c.fill();
    }
  }
}

function beak(c: Ctx, p: Pose, pal: HdPalette, y: number) {
  const f = p.face * 2.5;
  const open = p.mouth === 'open' || p.mouth === 'talk' || p.mouth === 'o' || p.mouth === 'grin' ? Math.max(0.3, p.mouthOpen) : 0;
  c.beginPath();
  c.moveTo(f - 7, y);
  c.quadraticCurveTo(f, y - 5, f + 7, y);
  c.quadraticCurveTo(f, y + 6, f - 7, y);
  paint(c, '#ffb03b', pal.outline, 1.8);
  if (open > 0) {
    c.beginPath();
    c.moveTo(f - 6, y + 2);
    c.quadraticCurveTo(f, y + 4 + open * 7, f + 6, y + 2);
    c.quadraticCurveTo(f, y + 4, f - 6, y + 2);
    paint(c, '#f08a1f', pal.outline, 1.6);
  }
}

export function critterHead(c: Ctx, p: Pose, pal: HdPalette, s: CritterSpec, gaze: [number, number]) {
  earShapes(c, p, pal, s);
  if (s.legs !== 'ghost') {
    ell(c, 0, 0, s.head.rx, s.head.ry);
    paint(c, shade(c, 0, 0, Math.max(s.head.rx, s.head.ry), pal), pal.outline, 2.4);
  }
  faceMarks(c, p, pal, s);
  if (s.ears === 'tufts') {
    // Owl eye discs.
    for (const side of [-1, 1]) {
      ell(c, side * s.eyes.x + p.face * 3, s.eyes.y, s.eyes.rx + 5, s.eyes.ry + 5);
      c.fillStyle = pal.belly;
      c.fill();
    }
  }
  drawEyes(c, p, pal, gaze, s.eyes, s.face === 'panda' ? pal.accent : pal.main);
  blush(c, p, pal, s.eyes.x + 9, s.eyes.y + 12, 6);
  const my = s.mouthY ?? 10;
  if (s.face === 'beak' || s.face === 'penguin') {
    beak(c, p, pal, my - 2);
    return;
  }
  const f = p.face * 2.5;
  if (s.nose !== 'none') {
    ell(c, f, my - 5, s.nose === 'pink' ? 2.6 : 3.6, s.nose === 'pink' ? 2 : 2.8);
    paint(c, s.nose === 'pink' ? pal.nose : '#2a1d22', pal.outline, 1.2);
  }
  drawMouth(c, p, pal, f, my, 10, s.catMouth);
}

function ghostBody(c: Ctx, pal: HdPalette, s: CritterSpec, t: number) {
  const w = s.body.rx;
  const top = -110;
  const bottom = -8;
  c.beginPath();
  c.moveTo(-w, -50);
  c.bezierCurveTo(-w, top, w, top, w, -50);
  c.lineTo(w, bottom);
  const waves = 4;
  for (let i = waves; i > 0; i--) {
    const x0 = -w + ((i - 0.5) / waves) * 2 * w;
    const x1 = -w + ((i - 1) / waves) * 2 * w;
    const dip = 7 + 3 * Math.sin(t * 4 + i);
    c.quadraticCurveTo(x0, bottom + dip, x1, bottom);
  }
  c.closePath();
  const g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, pal.light);
  g.addColorStop(1, pal.main);
  c.globalAlpha *= 0.95;
  paint(c, g, pal.outline, 2.2);
  c.globalAlpha /= 0.95;
}

function tentacleLegs(c: Ctx, p: Pose, pal: HdPalette, t: number) {
  for (let i = 0; i < 5; i++) {
    const x = -18 + i * 9;
    const sway = Math.sin(t * 3 + i) * 4 + (i < 2 ? -p.legL : i > 2 ? -p.legR : 0) * 0.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, -22);
    c.quadraticCurveTo(x + sway, -8, x + sway * 1.6 + (i - 2) * 3, -2);
    c.strokeStyle = pal.outline;
    c.lineWidth = 10;
    c.stroke();
    c.strokeStyle = pal.main;
    c.lineWidth = 6.5;
    c.stroke();
  }
}

function flipperArms(c: Ctx, p: Pose, pal: HdPalette, s: CritterSpec, kind: 'flippers' | 'wings') {
  for (const side of [-1, 1]) {
    const a = side < 0 ? p.armL : p.armR;
    c.save();
    c.translate(side * (s.body.rx - 3), s.body.cy - s.body.ry * 0.45);
    c.rotate(side * -Math.min(2.9, a) * 0.85);
    if (kind === 'flippers') {
      ell(c, side * 2, 13, 5.5, 15, side * 0.15);
      paint(c, pal.accent, pal.outline, 2);
    } else {
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(side * 12, 10, side * 6, 26);
      c.quadraticCurveTo(side * 2, 22, side * 1, 27);
      c.quadraticCurveTo(side * -3, 20, side * -4, 24);
      c.quadraticCurveTo(side * -6, 10, 0, 0);
      paint(c, pal.accent, pal.outline, 2);
    }
    c.restore();
  }
}

function shellBack(c: Ctx, pal: HdPalette, s: CritterSpec) {
  ell(c, 0, s.body.cy - 2, s.body.rx + 7, s.body.ry + 5);
  paint(c, pal.accentDark, pal.outline, 2.4);
  ell(c, 0, s.body.cy - 4, s.body.rx + 3, s.body.ry + 1);
  const g = c.createRadialGradient(-6, s.body.cy - 14, 2, 0, s.body.cy, s.body.ry + 4);
  g.addColorStop(0, '#d9a45f');
  g.addColorStop(1, pal.accent);
  c.fillStyle = g;
  c.fill();
}

export function critterBody(c: Ctx, p: Pose, pal: HdPalette, s: CritterSpec, t: number, head: () => void) {
  // Tail behind everything.
  if (s.tail === 'puff') {
    ell(c, s.body.rx - 4, s.body.cy + s.body.ry * 0.45, 7, 7);
    paint(c, pal.light, pal.outline, 1.8);
  } else if (s.tail === 'curl') {
    c.save();
    c.translate(s.body.rx - 4, s.body.cy + 6);
    c.rotate(-0.4 + p.tail * 0.5);
    limb(c, 0, 0, 12, -10, 6, pal.main, pal.outline);
    c.restore();
  } else if (s.tail === 'stub') {
    ell(c, s.body.rx - 2, s.body.cy + s.body.ry * 0.5, 5, 4);
    paint(c, pal.main, pal.outline, 1.6);
  }
  if (s.shell) shellBack(c, pal, s);

  switch (s.legs) {
    case 'feet':
      legs(c, p, pal, s.face === 'penguin' || s.face === 'beak' ? '#ffb03b' : pal.belly, 11, Math.min(13, s.body.rx - 8));
      break;
    case 'stubby':
      legs(c, p, pal, pal.accent, 12, Math.min(12, s.body.rx - 8));
      break;
    case 'tentacles':
      tentacleLegs(c, p, pal, t);
      break;
  }

  if (s.legs === 'ghost') {
    ghostBody(c, pal, s, t);
  } else {
    ell(c, 0, s.body.cy, s.body.rx, s.body.ry);
    paint(c, shade(c, 0, s.body.cy, Math.max(s.body.rx, s.body.ry), pal), pal.outline, 2.2);
    if (s.belly) belly(c, pal, 0, s.body.cy + 4, s.body.rx * 0.62, s.body.ry * 0.72);
  }

  switch (s.arms) {
    case 'paws':
      arms(c, p, pal, pal.belly, s.body.cy - s.body.ry * 0.55, 9, 20);
      break;
    case 'nubs': {
      for (const side of [-1, 1]) {
        const a = side < 0 ? p.armL : p.armR;
        const [ex, ey] = armEnd(side, a, side * (s.body.rx - 4), -60, 14);
        limb(c, side * (s.body.rx - 4), -60, ex, ey, 9, pal.main, pal.outline);
      }
      break;
    }
    case 'tentacles':
      arms(c, p, pal, pal.main, s.body.cy - s.body.ry * 0.5, 7, 22);
      break;
    default:
      flipperArms(c, p, pal, s, s.arms);
  }
  head();
}
