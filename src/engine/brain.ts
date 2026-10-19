// Pet behavior state machine. Pure: time and randomness are injected so it is fully testable.

import type { PetState } from '../sprites/types';

export type Action =
  | 'feed'
  | 'play'
  | 'pat'
  | 'happy'
  | 'dance'
  | 'angry'
  | 'sleep'
  | 'wake'
  | 'celebrate'
  | 'wave'
  | 'joke'
  | 'sing'
  | 'trick'
  | 'tickle'
  | 'yawn'
  | 'sneeze'
  | 'scared'
  | 'sit'
  | 'backflip'
  | 'moonwalk'
  | 'juggle'
  | 'magic'
  | 'karate'
  | 'flex'
  | 'peekaboo'
  | 'shades'
  | 'trip'
  | 'hiccup'
  | 'meditate'
  | 'toot'
  | 'stretch';

export interface Needs {
  hunger: number;
  happiness: number;
  energy: number;
}

export interface World {
  now: number;
  x: number;
  minX: number;
  maxX: number;
  walking: boolean;
  systemIdle: boolean;
  needs: Needs;
  /** Cursor x in the same coordinate space as x, or null when far away / disabled. */
  cursorX: number | null;
}

export const DURATION: Record<string, number> = {
  eat: 3400,
  dance: 4200,
  happy: 1900,
  angry: 2600,
  land: 900,
  nap: 25_000,
  wave: 1900,
  yawn: 1400,
  laugh: 2400,
  spin: 1500,
  sneeze: 1100,
  scared: 1500,
  sit: 9000,
  sing: 5200,
  backflip: 2200,
  moonwalk: 3200,
  juggle: 4500,
  magic: 3000,
  karate: 1900,
  flex: 2600,
  peekaboo: 2500,
  shades: 4000,
  trip: 2100,
  hiccup: 3300,
  meditate: 7000,
  toot: 2400,
  stretch: 2000,
};

/** Tricks a pet can show off (also what 'trick' picks from). */
export const TRICKS = ['backflip', 'moonwalk', 'juggle', 'magic', 'karate', 'flex', 'peekaboo', 'shades', 'meditate', 'stretch'] as const;

const ANGRY_CLICKS = 5;
const CLICK_WINDOW = 2000;

export class Brain {
  state: PetState = 'idle';
  until = 0;
  targetX: number | null = null;
  facing: 1 | -1 = 1;
  /** While now < lockUntil the pet follows a script and does not pick its own activities. */
  lockUntil = 0;
  /** Walk speed multiplier for scripted walks (chases run faster). */
  speedMul = 1;
  private clicks: number[] = [];
  private systemSleep = false;

  constructor(
    /** Walk speed in position units per second. */
    public speed: number,
    private rand: () => number = Math.random,
  ) {}

  private set(state: PetState, now: number, ms: number) {
    this.state = state;
    this.until = now + ms;
    this.targetX = null;
  }

  act(action: Action, now: number) {
    if (this.state === 'drag' || this.state === 'fall') return;
    switch (action) {
      case 'feed':
        return this.set('eat', now, DURATION.eat);
      case 'play':
      case 'dance':
      case 'celebrate':
        return this.set('dance', now, DURATION.dance);
      case 'pat':
      case 'happy':
        return this.set('happy', now, DURATION.happy);
      case 'angry':
        return this.set('angry', now, DURATION.angry);
      case 'sleep':
        return this.set('sleep', now, DURATION.nap);
      case 'wake':
        if (this.state === 'sleep') this.set('happy', now, DURATION.happy);
        return;
      case 'wave':
        return this.set('wave', now, DURATION.wave);
      case 'joke':
      case 'tickle':
        return this.set('laugh', now, DURATION.laugh);
      case 'sing':
        return this.set('sing', now, DURATION.sing);
      case 'trick': {
        const pool = [...TRICKS, 'spin'] as string[];
        const pick = pool[Math.floor(this.rand() * pool.length)];
        return this.set(pick as PetState, now, DURATION[pick] ?? DURATION.spin);
      }
      case 'yawn':
        return this.set('yawn', now, DURATION.yawn);
      case 'sneeze':
        return this.set('sneeze', now, DURATION.sneeze);
      case 'scared':
        return this.set('scared', now, DURATION.scared);
      case 'sit':
        return this.set('sit', now, DURATION.sit);
      default:
        if (action in DURATION) return this.set(action as PetState, now, DURATION[action]);
    }
  }

  /** A click on the pet. Returns the resulting action. Five quick clicks make it grumpy. */
  click(now: number): Action {
    this.clicks = this.clicks.filter((t) => now - t < CLICK_WINDOW);
    this.clicks.push(now);
    if (this.clicks.length >= ANGRY_CLICKS) {
      this.clicks = [];
      this.act('angry', now);
      return 'angry';
    }
    if (this.state === 'sleep') {
      this.systemSleep = false;
      this.act('wake', now);
      return 'wake';
    }
    this.act('pat', now);
    return 'pat';
  }

  startDrag() {
    this.state = 'drag';
    this.until = Infinity;
    this.targetX = null;
  }

  startFall() {
    this.state = 'fall';
    this.until = Infinity;
  }

  landed(now: number) {
    this.set('land', now, DURATION.land);
  }

  /** Returns horizontal velocity for this tick. */
  update(w: World): number {
    if (this.state === 'drag' || this.state === 'fall') return 0;

    if (w.systemIdle) {
      if (this.state !== 'sleep' || !this.systemSleep) {
        this.state = 'sleep';
        this.until = Infinity;
        this.targetX = null;
        this.systemSleep = true;
      }
      return 0;
    }
    if (this.systemSleep) {
      this.systemSleep = false;
      this.set('happy', w.now, DURATION.happy);
      return 0;
    }

    if (this.state === 'walk') {
      const scripted = w.now < this.lockUntil;
      if ((!w.walking && !scripted) || this.targetX === null || w.now >= this.until) {
        this.idle(w.now);
        return 0;
      }
      const target = Math.min(w.maxX, Math.max(w.minX, this.targetX));
      const d = target - w.x;
      if (Math.abs(d) < 2) {
        this.idle(w.now);
        return 0;
      }
      this.facing = d > 0 ? 1 : -1;
      return this.facing * this.speed * (scripted ? this.speedMul : 1);
    }

    if (this.state === 'moonwalk' && w.now < this.until) {
      const v = -this.facing * this.speed * 0.55;
      if ((v < 0 && w.x <= w.minX + 2) || (v > 0 && w.x >= w.maxX - 2)) return 0;
      return v;
    }
    if (w.now < this.until) {
      if (this.state === 'idle' && w.cursorX !== null) this.facing = w.cursorX >= w.x ? 1 : -1;
      return 0;
    }
    if (w.now < this.lockUntil) {
      if (this.state !== 'idle') this.idle(w.now);
      return 0;
    }
    this.pickNext(w);
    return 0;
  }

  /** Scripted walk to an x position (social interactions). */
  goTo(x: number, now: number, speedMul = 1) {
    if (this.state === 'drag' || this.state === 'fall') return;
    this.state = 'walk';
    this.targetX = x;
    this.until = now + 12_000;
    this.speedMul = speedMul;
  }

  face(dir: number) {
    if (dir) this.facing = dir > 0 ? 1 : -1;
  }

  private idle(now: number) {
    this.set('idle', now, 1800 + this.rand() * 4200);
  }

  private walkTo(x: number, w: World) {
    this.state = 'walk';
    this.targetX = Math.min(w.maxX, Math.max(w.minX, x));
    this.until = w.now + 20_000;
  }

  private pickNext(w: World) {
    const r = this.rand();
    const { hunger, happiness, energy } = w.needs;
    if (energy < 25 && r < 0.35) return this.set('sleep', w.now, DURATION.nap);
    if (hunger > 85 && r < 0.15) return this.set('angry', w.now, DURATION.angry);
    if (w.walking && w.cursorX !== null && r < 0.3) {
      const side = w.cursorX >= w.x ? -1 : 1;
      return this.walkTo(w.cursorX + side * 40, w);
    }
    if (w.walking && r < 0.6 && w.maxX - w.minX > 60) {
      let x = w.minX + this.rand() * (w.maxX - w.minX);
      if (Math.abs(x - w.x) < 40) x = w.x + (x >= w.x ? 60 : -60);
      return this.walkTo(x, w);
    }
    if (happiness > 75 && r < 0.66) return this.set('dance', w.now, DURATION.dance);
    // Little bits of personality between walks.
    const s = this.rand();
    if (s < (energy < 40 ? 0.12 : 0.04)) return this.set('yawn', w.now, DURATION.yawn);
    if (s < 0.16) return this.set('sit', w.now, DURATION.sit * (0.6 + this.rand() * 0.8));
    if (s < 0.19) return this.set('sneeze', w.now, DURATION.sneeze);
    if (s < 0.23 && happiness > 50) return this.set('spin', w.now, DURATION.spin);
    if (s < 0.25 && happiness > 60) return this.set('sing', w.now, DURATION.sing);
    if (s < 0.31 && happiness > 40) {
      const trick = TRICKS[Math.floor(this.rand() * TRICKS.length)];
      return this.set(trick, w.now, DURATION[trick]);
    }
    if (s < 0.325) return this.set('hiccup', w.now, DURATION.hiccup);
    if (s < 0.335) return this.set('toot', w.now, DURATION.toot);
    if (s < 0.35) return this.set('trip', w.now, DURATION.trip);
    this.idle(w.now);
  }
}
