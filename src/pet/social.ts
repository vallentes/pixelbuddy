// Runtime side of pet-to-pet interactions: shares presence with the other pet windows, starts
// scripted interactions (lower id initiates, partner accepts) and runs this pet's role.

import { emit, listen } from '@tauri-apps/api/event';
import type { Action, Brain } from '../engine/brain';
import { SOCIAL_CHANCE, buildScript, chooseKind, isFree, type Kind, type Presence, type Role, type Script } from '../engine/social';

interface Host {
  id: number;
  brain: Brain;
  self(): Presence;
  /** Physical px per logical px of the current monitor. */
  sf(): number;
  bounds(): { minX: number; maxX: number };
  say(text: string): void;
  chatTopic(topic: 'bonk'): void;
  act(action: Action): void;
  chattiness(): string;
  canSocialize(): boolean;
  sfx(kind: 'thud'): void;
}

type Msg =
  | { type: 'start'; from: number; to: number; kind: Kind; seed: number; a: Presence; b: Presence }
  | { type: 'accept'; from: number; to: number; kind: Kind; seed: number; a: Presence; b: Presence }
  | { type: 'abort'; from: number; to: number };

export class Social {
  others = new Map<number, Presence>();
  private script: { s: Script; role: Role; partner: number; timers: number[]; until: number } | null = null;
  private chase: { mode: 'chase' | 'flee'; partner: number; until: number } | null = null;
  private pendingInvite: number | null = null;
  private lastBonk = 0;
  private lastInteraction = Date.now();

  constructor(private h: Host) {}

  async start() {
    await listen<Presence>('pet://presence', (e) => {
      if (e.payload.id !== this.h.id) this.others.set(e.payload.id, { ...e.payload, at: Date.now() });
    });
    await listen<Msg>('pet://social', (e) => this.onMsg(e.payload));
    window.setInterval(() => this.broadcast(), 300);
    window.setInterval(() => this.maybeStart(), 5000);
  }

  get busy() {
    return this.script !== null;
  }

  private broadcast() {
    void emit('pet://presence', this.h.self()).catch(() => {});
    const now = Date.now();
    for (const [k, p] of this.others) if (now - p.at > 3000) this.others.delete(k);
  }

  private neighbors(): Presence[] {
    const me = this.h.self();
    return [...this.others.values()].filter((p) => p.monitor === me.monitor);
  }

  private maybeStart() {
    if (this.script || !this.h.canSocialize()) return;
    const me = this.h.self();
    if (!isFree(me.state)) return;
    const candidates = this.neighbors().filter((p) => p.id > this.h.id && !p.busy && isFree(p.state));
    if (!candidates.length) return;
    // A little extra chance after a long quiet spell so friends do not ignore each other.
    const quiet = Math.min(0.1, (Date.now() - this.lastInteraction) / 3_000_000);
    if (Math.random() > (SOCIAL_CHANCE[this.h.chattiness()] ?? 0.08) + quiet) return;
    const partner = candidates[Math.floor(Math.random() * candidates.length)];
    const kind = chooseKind(Math.random, this.h.chattiness() === 'chatty' || this.h.chattiness() === 'normal');
    const seed = Math.floor(Math.random() * 2 ** 31);
    this.pendingInvite = partner.id;
    void emit('pet://social', { type: 'start', from: this.h.id, to: partner.id, kind, seed, a: me, b: partner } satisfies Msg);
    window.setTimeout(() => {
      if (this.pendingInvite === partner.id) this.pendingInvite = null;
    }, 1500);
  }

  /** Lets the user trigger a playdate from the menu. */
  invite() {
    const me = this.h.self();
    const partner = this.neighbors().filter((p) => !p.busy)[0];
    if (!partner || this.script) return false;
    const kind = chooseKind(Math.random, true);
    const seed = Math.floor(Math.random() * 2 ** 31);
    this.pendingInvite = partner.id;
    void emit('pet://social', { type: 'start', from: this.h.id, to: partner.id, kind, seed, a: me, b: partner } satisfies Msg);
    return true;
  }

  private onMsg(m: Msg) {
    if (m.to !== this.h.id) return;
    if (m.type === 'start') {
      if (this.script || !this.h.canSocialize() || !isFree(this.h.self().state)) return;
      void emit('pet://social', { ...m, type: 'accept', from: this.h.id, to: m.from } satisfies Msg);
      this.run(buildScript(m.kind, m.a, m.b, m.seed), 'b', m.from);
    } else if (m.type === 'accept') {
      if (this.pendingInvite !== m.from || this.script) return;
      this.pendingInvite = null;
      this.run(buildScript(m.kind, m.a, m.b, m.seed), 'a', m.from);
    } else if (m.type === 'abort') {
      if (this.script?.partner === m.from) this.stop(false);
    }
  }

  private partnerX(partner: number): number | null {
    return this.others.get(partner)?.x ?? null;
  }

  private run(s: Script, role: Role, partner: number) {
    const now = Date.now();
    this.lastInteraction = now;
    this.h.brain.lockUntil = now + s.length;
    const timers = s.steps
      .filter((st) => st.role === role)
      .map((st) =>
        window.setTimeout(() => {
          const px = this.partnerX(partner);
          const me = this.h.self();
          const b = this.h.brain;
          switch (st.do) {
            case 'goto':
              if (px !== null) {
                const dir = Math.sign(px - me.x) || 1;
                b.goTo(px - dir * st.gap * this.h.sf(), Date.now(), st.speed ?? 1.3);
              }
              break;
            case 'face':
              if (px !== null) b.face(px - me.x);
              break;
            case 'say':
              this.h.say(st.text);
              break;
            case 'act':
              this.h.act(st.action);
              break;
            case 'chase':
            case 'flee':
              this.chase = { mode: st.do, partner, until: Date.now() + st.ms };
              break;
          }
        }, st.at),
      );
    timers.push(window.setTimeout(() => this.stop(false), s.length));
    this.script = { s, role, partner, timers, until: now + s.length };
  }

  /** Ends the current interaction (e.g. when the user picks the pet up). */
  stop(notify: boolean) {
    if (!this.script) return;
    this.script.timers.forEach((t) => window.clearTimeout(t));
    if (notify) void emit('pet://social', { type: 'abort', from: this.h.id, to: this.script.partner } satisfies Msg);
    this.script = null;
    this.chase = null;
    this.h.brain.lockUntil = 0;
    this.h.brain.speedMul = 1;
  }

  /** Per-frame work: chasing/fleeing and bumping into other pets. */
  tick(now: number, myX: number, walking: boolean) {
    const sf = this.h.sf();
    if (this.chase) {
      const px = this.partnerX(this.chase.partner);
      if (now > this.chase.until || px === null) {
        this.chase = null;
      } else if (this.chase.mode === 'chase') {
        this.h.brain.goTo(px, now, 2.0);
      } else {
        const b = this.h.bounds();
        const away = px > myX ? b.minX : b.maxX;
        // Turn around near the edge so the chase keeps going.
        const target = Math.abs(away - myX) < 60 * sf ? (px > myX ? b.maxX : b.minX) : away;
        this.h.brain.goTo(target, now, 1.7);
      }
      return;
    }
    if (this.script || !walking || now - this.lastBonk < 20_000) return;
    for (const p of this.neighbors()) {
      if (p.state !== 'walk' || p.busy) continue;
      if (Math.abs(p.x - myX) < 26 * sf && Math.sign(p.x - myX) === this.h.brain.facing) {
        this.lastBonk = now;
        this.h.brain.landed(now);
        this.h.sfx('thud');
        this.h.chatTopic('bonk');
        return;
      }
    }
  }
}
