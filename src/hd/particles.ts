import type { PetState } from '../sprites/types';

export type PKind = 'heart' | 'note' | 'z' | 'star' | 'sparkle' | 'sweat' | 'puff' | 'crumb' | 'anger' | 'confetti' | 'stink' | 'bubble' | 'impact';

interface P {
  k: PKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

const CONFETTI = ['#ff5c5c', '#ffd34a', '#4aa8ff', '#5be37d', '#ff7ad9'];

/** Particles per second and where they spawn, per state. */
const EMIT: Partial<Record<PetState, { k: PKind; rate: number; x: [number, number]; y: [number, number] }[]>> = {
  sleep: [{ k: 'z', rate: 0.8, x: [16, 22], y: [-110, -100] }],
  happy: [{ k: 'heart', rate: 3, x: [-20, 20], y: [-110, -95] }],
  dance: [{ k: 'note', rate: 2.2, x: [-34, 34], y: [-105, -80] }],
  sing: [{ k: 'note', rate: 2.5, x: [10, 34], y: [-100, -80] }],
  eat: [{ k: 'crumb', rate: 4, x: [-6, 6], y: [-60, -55] }],
  angry: [
    { k: 'anger', rate: 1.6, x: [18, 28], y: [-112, -100] },
    { k: 'puff', rate: 2, x: [-30, 30], y: [-108, -100] },
  ],
  laugh: [{ k: 'star', rate: 2.5, x: [-34, 34], y: [-110, -80] }],
  land: [{ k: 'star', rate: 4, x: [-22, 22], y: [-118, -108] }],
  scared: [{ k: 'sweat', rate: 3, x: [18, 28], y: [-104, -96] }],
  spin: [{ k: 'sparkle', rate: 5, x: [-30, 30], y: [-90, -20] }],
  magic: [{ k: 'sparkle', rate: 6, x: [-30, 30], y: [-110, -10] }],
  meditate: [{ k: 'sparkle', rate: 1.5, x: [-40, 40], y: [-100, -20] }],
  flex: [{ k: 'sparkle', rate: 2, x: [-36, 36], y: [-80, -50] }],
  moonwalk: [{ k: 'note', rate: 1.2, x: [-30, 30], y: [-100, -80] }],
  wave: [{ k: 'sparkle', rate: 1.5, x: [30, 40], y: [-90, -70] }],
};

export class Particles {
  list: P[] = [];
  private acc = new Map<string, number>();

  burst(k: PKind, n: number, x: number, y: number) {
    for (let i = 0; i < n; i++) this.spawn(k, x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 10, true);
  }

  private spawn(k: PKind, x: number, y: number, burst = false) {
    const up = k === 'z' || k === 'heart' || k === 'note' || k === 'anger' || k === 'stink' || k === 'bubble';
    const sp = burst ? 60 : 20;
    this.list.push({
      k,
      x,
      y,
      vx: (Math.random() - 0.5) * sp + (k === 'z' ? 10 : 0),
      vy: up ? -18 - Math.random() * 14 : k === 'crumb' || k === 'sweat' || k === 'confetti' ? 10 + Math.random() * 20 : -10 - Math.random() * 30,
      life: 0,
      max: k === 'z' ? 2.2 : k === 'confetti' ? 2.4 : k === 'stink' ? 2.2 : k === 'impact' ? 0.35 : 1.4,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 6,
      size: 0.8 + Math.random() * 0.5,
      color: k === 'confetti' ? CONFETTI[Math.floor(Math.random() * CONFETTI.length)] : '',
    });
  }

  update(dt: number, state: PetState, enabled: boolean) {
    if (enabled) {
      for (const [i, e] of (EMIT[state] ?? []).entries()) {
        const key = `${state}${i}`;
        const a = (this.acc.get(key) ?? 0) + dt * e.rate;
        let n = Math.floor(a);
        this.acc.set(key, a - n);
        while (n-- > 0) this.spawn(e.k, e.x[0] + Math.random() * (e.x[1] - e.x[0]), e.y[0] + Math.random() * (e.y[1] - e.y[0]));
      }
    }
    for (const p of this.list) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.k === 'crumb' || p.k === 'sweat' || p.k === 'confetti') p.vy += 60 * dt;
    }
    this.list = this.list.filter((p) => p.life < p.max).slice(-60);
  }

  draw(c: CanvasRenderingContext2D) {
    for (const p of this.list) {
      const fade = 1 - p.life / p.max;
      c.save();
      c.globalAlpha = Math.min(1, fade * 1.6);
      c.translate(p.x, p.y);
      c.scale(p.size, p.size);
      shape(c, p);
      c.restore();
    }
  }
}

function shape(c: CanvasRenderingContext2D, p: P) {
  c.lineJoin = 'round';
  c.lineWidth = 1.4;
  c.strokeStyle = 'rgba(40,20,50,0.75)';
  switch (p.k) {
    case 'heart':
      c.beginPath();
      c.moveTo(0, 3);
      c.bezierCurveTo(-8, -3, -4, -9, 0, -5);
      c.bezierCurveTo(4, -9, 8, -3, 0, 3);
      c.fillStyle = '#ff5c8a';
      c.fill();
      c.stroke();
      break;
    case 'note':
      c.fillStyle = '#7ee0b5';
      c.beginPath();
      c.ellipse(-2, 3, 3, 2.3, -0.4, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillRect(0.5, -8, 1.6, 11);
      c.beginPath();
      c.moveTo(2, -8);
      c.quadraticCurveTo(7, -6, 6, -1);
      c.lineWidth = 1.8;
      c.strokeStyle = '#7ee0b5';
      c.stroke();
      break;
    case 'z':
      c.font = 'bold 12px system-ui, sans-serif';
      c.fillStyle = '#e8ecff';
      c.strokeText('Z', -4, 4);
      c.fillText('Z', -4, 4);
      break;
    case 'star':
    case 'sparkle': {
      c.rotate(p.rot);
      c.beginPath();
      const n = p.k === 'star' ? 5 : 4;
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 ? 2.2 : 6;
        const a = (i / (n * 2)) * Math.PI * 2;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fillStyle = p.k === 'star' ? '#ffd34a' : '#fff6a8';
      c.fill();
      if (p.k === 'star') c.stroke();
      break;
    }
    case 'sweat':
      c.beginPath();
      c.moveTo(0, -5);
      c.quadraticCurveTo(4, 1, 0, 3);
      c.quadraticCurveTo(-4, 1, 0, -5);
      c.fillStyle = '#6ec6ff';
      c.fill();
      c.stroke();
      break;
    case 'puff':
      c.fillStyle = 'rgba(240,238,250,0.9)';
      for (const [x, y, r] of [[0, 0, 4], [4, 1, 3], [-4, 1, 3]]) {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case 'stink':
      c.fillStyle = 'rgba(150, 200, 90, 0.75)';
      for (const [x, y, r] of [[0, 0, 6], [6, 2, 5], [-6, 2, 5], [0, -5, 4]]) {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case 'bubble':
      c.strokeStyle = 'rgba(160, 210, 255, 0.9)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, 4, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-2, -2, 1.5, 1.5);
      break;
    case 'impact': {
      c.rotate(p.rot);
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? 4 : 11;
        const a = (i / 16) * Math.PI * 2;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fillStyle = '#fff3a6';
      c.fill();
      c.strokeStyle = '#ff8a3d';
      c.lineWidth = 1.6;
      c.stroke();
      break;
    }
    case 'crumb':
      c.fillStyle = '#c98a4a';
      c.fillRect(-1.2, -1.2, 2.4, 2.4);
      break;
    case 'anger':
      c.strokeStyle = '#ff3b3b';
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 2, -5);
        c.quadraticCurveTo(s * 2, -2, s * 5, -2);
        c.moveTo(s * 2, 5);
        c.quadraticCurveTo(s * 2, 2, s * 5, 2);
        c.stroke();
      }
      break;
    case 'confetti':
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-2, -1, 4, 2);
      break;
  }
}
