import { HdSprite } from '../hd/HdSprite';
import { buildSheet, drawFrame, hitTest, type SpriteSheet } from '../sprites/sheet';
import { SIZE } from '../sprites/raster';
import { getSpecies } from '../sprites/species';
import type { Accessory, ColorVariant, PetState } from '../sprites/types';
import { drawSmoothBubble } from './bubble';

export const REACTION_TEXT: Record<string, string> = {
  feed: 'Yum!',
  play: 'Wheee!',
  dance: '♥',
  celebrate: 'Yay!',
  evolve: 'I EVOLVED!',
  confetti: 'Party!',
  happy: '♥',
  pat: '♥',
  angry: 'Hmph!',
  sleep: 'Zzz',
  wake: 'Hi!',
};

export type ArtStyle = 'pixel' | 'hd';

/** Where on the pet a click landed. */
export type BodyPart = 'head' | 'nose' | 'ear' | 'belly' | 'foot' | 'tail' | 'body';

/** What the pet window, overlay and previews need from a character renderer. */
export interface Renderer {
  state: PetState;
  facing: 1 | -1;
  bubble: { text: string; until: number; start: number; charMs?: number } | null;
  effects: boolean;
  setLook(species: string, color: ColorVariant, accessory: Accessory): void;
  setState(s: PetState): void;
  setGaze(x: number, y: number): void;
  advance(dtMs: number, speed: number): void;
  /** Shows a bubble; `charMs` sets letter speed so text can match the voice. */
  say(text: string, ms: number, now?: number, charMs?: number): void;
  /** Draws with feet on `bottom`, centred on `cx`; `pixel` = device pixels per sprite pixel. */
  draw(ctx: CanvasRenderingContext2D, cx: number, bottom: number, pixel: number, now?: number): void;
  /** Twitch moments: "evolve" (bigger and sparkly for `ms`) or a confetti shower. */
  boost(kind: 'evolve' | 'confetti', ms?: number): void;
  /** Is the character opaque at this canvas point? */
  hitAt(x: number, y: number): boolean;
  /** Which body part is at this canvas point (call only after hitAt is true). */
  partAt(x: number, y: number): BodyPart;
}

/** Twitch sub "evolution": golden, crowned and sparkly for a minute, then back to normal. */
export function evolve(r: Renderer, look: () => [string, ColorVariant, Accessory], ms = 60_000) {
  r.setLook(look()[0], 'golden', 'crown');
  r.boost('evolve', ms);
  window.setTimeout(() => {
    const [species, color, accessory] = look();
    r.setLook(species, color, accessory);
  }, ms);
}

export function createRenderer(style: ArtStyle, species: string, color: ColorVariant, accessory: Accessory): Renderer {
  return style === 'hd' ? new HdSprite(species, color, accessory) : new PetSprite(species, color, accessory);
}

/** Pixel-art renderer: frame-based sprite sheets. */
export class PetSprite implements Renderer {
  sheet: SpriteSheet;
  state: PetState = 'idle';
  frame = 0;
  private frameT = 0;
  facing: 1 | -1 = 1;
  bubble: { text: string; until: number; start: number; charMs?: number } | null = null;
  effects = true;
  private last = { x: 0, y: 0, pixel: 1 };

  constructor(
    public species: string,
    public color: ColorVariant,
    public accessory: Accessory,
  ) {
    this.sheet = buildSheet(species, color, accessory);
  }

  setLook(species: string, color: ColorVariant, accessory: Accessory) {
    if (species === this.species && color === this.color && accessory === this.accessory) return;
    Object.assign(this, { species, color, accessory });
    this.sheet = buildSheet(species, color, accessory);
  }

  setState(s: PetState) {
    if (s === this.state) return;
    this.state = s;
    this.frame = 0;
    this.frameT = 0;
  }

  setGaze() {}

  boost() {
    // Pixel art has no particle effects; evolving still changes the look (see evolve()).
  }

  advance(dtMs: number, speed: number) {
    const r = this.sheet.rows[this.state];
    this.frameT += dtMs * speed;
    while (this.frameT >= r.frameMs) {
      this.frameT -= r.frameMs;
      this.frame = r.loop ? (this.frame + 1) % r.count : Math.min(this.frame + 1, r.count - 1);
    }
  }

  say(text: string, ms: number, now = performance.now(), charMs?: number) {
    this.bubble = { text, until: now + ms, start: now, charMs };
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, bottom: number, pixel: number, now = performance.now()) {
    const size = SIZE * pixel;
    const x = Math.round(cx - size / 2);
    const y = Math.round(bottom - size);
    this.last = { x, y, pixel };
    drawFrame(ctx, this.sheet, this.state, this.frame, x, y, pixel, this.facing);
    if (this.bubble && now < this.bubble.until) {
      drawSmoothBubble(ctx, this.bubble.text, cx, y + 4 * pixel, Math.max(1, pixel / 3), now - this.bubble.start, this.bubble.until - now, this.bubble.charMs);
    } else {
      this.bubble = null;
    }
  }

  hitAt(x: number, y: number) {
    const { x: ox, y: oy, pixel } = this.last;
    return hitTest(this.sheet, this.state, this.frame, (x - ox) / pixel, (y - oy) / pixel, this.facing);
  }

  partAt(x: number, y: number): BodyPart {
    const { x: ox, y: oy, pixel } = this.last;
    let px = (x - ox) / pixel;
    const py = (y - oy) / pixel;
    if (this.facing === -1) px = SIZE - px;
    const sp = getSpecies(this.species);
    const [mx, my] = sp.mouth;
    if (py >= 27) return 'foot';
    if ((this.species === 'mochi' || this.species === 'ember') && px >= 24 && py >= 15) return 'tail';
    if (py < sp.head[1] + 3) return 'ear';
    if (Math.abs(px - (mx + 1)) <= 2.5 && py >= my - 3 && py <= my + 1) return 'nose';
    if (py <= my + 2) return 'head';
    if (Math.abs(px - 16) < 7) return 'belly';
    return 'body';
  }
}
