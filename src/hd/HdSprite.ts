import type { Accessory, ColorVariant, PetState } from '../sprites/types';
import { drawSmoothBubble } from '../shared/bubble';
import type { BodyPart, Renderer } from '../shared/renderer';
import { typeMs } from '../shared/bubble';
import { DURATION } from '../engine/brain';
import { HD_SPECIES, HEAD_Y, drawCharacter, drawProps, hdPalette, type HdPalette, type HdSpecies } from './draw';
import type { PKind } from './particles';

/** One-off particle bursts at moments inside a trick: [seconds, kind, count, x, y]. */
const EVENTS: Partial<Record<PetState, [number, PKind, number, number, number][]>> = {
  backflip: [[0.25, 'puff', 5, 0, -4], [1.05, 'puff', 6, 0, -4], [1.3, 'star', 5, 0, -120]],
  magic: [[0.72, 'puff', 10, 0, -50], [0.8, 'confetti', 12, 0, -80], [2.0, 'puff', 10, 0, -50], [2.1, 'sparkle', 10, 0, -70]],
  karate: [[0.55, 'impact', 1, 48, -52], [1.08, 'impact', 1, 36, -14]],
  toot: [[0.3, 'stink', 6, -26, -18]],
  hiccup: [[0.02, 'bubble', 1, 6, -70], [0.92, 'bubble', 1, -4, -70], [1.82, 'bubble', 1, 8, -70], [2.72, 'bubble', 1, 0, -70]],
  peekaboo: [[1.42, 'heart', 4, 0, -110]],
  shades: [[0.72, 'sparkle', 4, 0, -90]],
  trip: [[0.32, 'star', 5, 34, -40], [0.32, 'puff', 4, 30, -4]],
};
import { Particles } from './particles';
import { BASE, easePose, targetPose, type Pose } from './pose';

/** Units of the HD rig drawn per "sprite box" (the pixel art's 32px box at the same scale). */
const UNITS = 118;

export class HdSprite implements Renderer {
  state: PetState = 'idle';
  facing: 1 | -1 = 1;
  bubble: { text: string; until: number; start: number; charMs?: number } | null = null;
  particles = new Particles();
  effects = true;
  private sp: HdSpecies;
  private pal: HdPalette;
  private pose: Pose = { ...BASE };
  private t = 0;
  private clock = 0;
  private talkT = 0;
  private gaze: [number, number] = [0, 0];
  private seed = Math.random();
  private lastCtx: CanvasRenderingContext2D | null = null;
  private lastDraw = { cx: 0, base: 0, u: 1 };

  constructor(
    public species: string,
    public color: ColorVariant,
    public accessory: Accessory,
  ) {
    this.sp = HD_SPECIES[species] ?? HD_SPECIES.mochi;
    this.pal = hdPalette(this.sp.palette, color);
  }

  setLook(species: string, color: ColorVariant, accessory: Accessory) {
    Object.assign(this, { species, color, accessory });
    this.sp = HD_SPECIES[species] ?? HD_SPECIES.mochi;
    this.pal = hdPalette(this.sp.palette, color);
  }

  setState(s: PetState) {
    if (s === this.state) return;
    if (s === 'happy') this.particles.burst('heart', 3, 0, -100);
    if (s === 'land') this.particles.burst('puff', 4, 0, -4);
    this.state = s;
    this.t = 0;
  }

  /** Where the eyes look, each component in -1..1. */
  setGaze(x: number, y: number) {
    this.gaze = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
  }

  advance(dtMs: number, speed: number) {
    const dt = (dtMs / 1000) * speed;
    const prevT = this.t;
    this.t += dt;
    if (this.effects) {
      for (const [at, kind, n, x, y] of EVENTS[this.state] ?? []) {
        if (prevT < at && this.t >= at) this.particles.burst(kind, n, x, y);
      }
    }
    this.clock += dt;
    const nowMs = performance.now();
    const talking = !!this.bubble && nowMs < this.bubble.until && nowMs - this.bubble.start < typeMs(this.bubble.text, this.bubble.charMs) - 50 && this.bubble.text !== '...';
    this.talkT = talking ? this.talkT + dt : 0;
    const target = targetPose(this.state, this.t, this.seed, talking ? this.talkT : null);
    this.pose = easePose(this.pose, target, dt);
    this.particles.update(dt, this.state, this.effects);
  }

  say(text: string, ms: number, now = performance.now(), charMs?: number) {
    this.bubble = { text, until: now + ms, start: now, charMs };
    this.talkT = 0;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, bottom: number, pixel: number, now = performance.now()) {
    this.lastCtx = ctx;
    const size = 32 * pixel;
    const u = size / UNITS;
    ctx.save();
    this.lastDraw = { cx, base: bottom - 3 * u, u };
    ctx.translate(cx, bottom - 3 * u);
    ctx.scale(u * this.facing, u);
    const eatLeft = this.state === 'eat' ? Math.max(0, 1 - this.t / (DURATION.eat / 1000)) : 0;
    drawCharacter(ctx, this.sp, this.pal, this.pose, [this.gaze[0] * this.facing, this.gaze[1]], this.accessory, this.clock, this.state === 'eat' ? { kind: this.sp.food, left: eatLeft } : null);
    drawProps(ctx, this.sp, this.pose, this.state, this.t);
    this.particles.draw(ctx);
    ctx.restore();
    if (this.bubble && now < this.bubble.until) {
      const headTop = bottom - 3 * u + (HEAD_Y - 34 + this.pose.y + this.pose.headY) * u;
      drawSmoothBubble(ctx, this.bubble.text, cx, headTop, Math.max(1, pixel / 3), now - this.bubble.start, this.bubble.until - now, this.bubble.charMs);
    } else {
      this.bubble = null;
    }
  }

  partAt(x: number, y: number): BodyPart {
    const { cx, base, u } = this.lastDraw;
    const p = this.pose;
    const float = this.sp.floaty ? -6 : 0;
    const ux = ((x - cx) / u) * this.facing - p.x;
    const uy = (y - base) / u - p.y - float;
    const hy = HEAD_Y + p.headY;
    const dy = uy - hy;
    const tailKind = this.sp.kind === 'cat' || this.sp.kind === 'dragon';
    if (tailKind && ux > 20 && uy > -62 && uy < -6) return 'tail';
    if (uy > -12) return 'foot';
    if (dy < -24 && Math.abs(ux) < 44) return 'ear';
    if (Math.abs(ux) < 10 && dy > -2 && dy < 15) return 'nose';
    if ((ux / 34) ** 2 + (dy / 30) ** 2 <= 1) return 'head';
    if (Math.abs(ux) < 16 && uy > -55 && uy < -14) return 'belly';
    return 'body';
  }

  hitAt(x: number, y: number): boolean {
    const c = this.lastCtx;
    if (!c) return false;
    const ix = Math.round(x) - 2;
    const iy = Math.round(y) - 2;
    if (ix < 0 || iy < 0 || ix + 5 > c.canvas.width || iy + 5 > c.canvas.height) return false;
    try {
      const d = c.getImageData(ix, iy, 5, 5).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 40) return true;
    } catch {
      return false;
    }
    return false;
  }
}
