// Pet side of "React to what I'm doing", the focus timer and wellbeing reminders. Receives only
// a category from the core (never window titles) and turns it into behavior: watching videos,
// dancing to music, going silent in meetings, commenting on email, cheering fast typing.

import { listen } from '@tauri-apps/api/event';
import type { Action } from '../engine/brain';
import { pickAware, type AwareTopic } from '../engine/lines4';
import type { Activity, ActivityKind, Settings, SystemState } from '../shared/types';

interface Host {
  id: number;
  /** Says a line (voice unless quiet). */
  say(text: string, opts?: { voice?: boolean }): void;
  act(action: Action): void;
  state(): string;
  settings(): Settings;
  system(): SystemState;
  /** Lowest-id visible pet does the talking so pets do not all say the same thing. */
  isSpeaker(): boolean;
  /** Not hidden, not dragged, not filming. */
  canReact(): boolean;
}

const ENTER_CHANCE: Partial<Record<ActivityKind, number>> = {
  video: 0.8,
  music: 0.7,
  chat: 0.5,
  mail: 0.6,
  code: 0.5,
  game: 0.7,
  social: 0.5,
  shopping: 0.6,
  docs: 0.4,
  browse: 0.12,
};
const LONG: Partial<Record<ActivityKind, AwareTopic>> = {
  video: 'videoLong',
  music: 'musicLong',
  chat: 'chatLong',
  mail: 'mailLong',
  code: 'codeLong',
  game: 'gameLong',
  social: 'socialLong',
  shopping: 'shoppingLong',
  docs: 'docsLong',
};
const MIN = 60_000;

export class Awareness {
  activity: Activity = { kind: 'off', label: null, detail: null, typing: 0, window: null };
  private since = Date.now();
  private lastLine = 0;
  private lastSong: string | null = null;
  private lastStorm = 0;
  private focusUntil = 0;
  private focusTimer = 0;
  private activeMs = 0;
  private waterMs = 0;
  private nightShown = '';
  private enterTimer = 0;

  constructor(private h: Host) {}

  async start() {
    await listen<Activity>('activity://state', (e) => this.onActivity(e.payload));
    await listen<{ minutes: number }>('focus://start', (e) => this.startFocus(e.payload.minutes));
    await listen('focus://stop', () => this.endFocus(false));
    window.setInterval(() => this.tick(), 20_000);
  }

  /** Pets keep quiet (no voice, no chatter, no games) during calls and focus time. */
  quiet() {
    return this.inMeeting() || this.focusing();
  }

  focusing() {
    return Date.now() < this.focusUntil;
  }

  private inMeeting() {
    return this.activity.kind === 'meeting' && this.h.settings().meetingMode;
  }

  /** Should random pet games pause (watching a video together, meetings, focus)? */
  calm() {
    return this.quiet() || this.activity.kind === 'video';
  }

  private user() {
    return this.h.settings().userName;
  }

  private line(topic: AwareTopic, opts: { voice?: boolean; minutes?: number } = {}) {
    if (this.h.settings().chattiness === 'off' && !['break', 'water', 'focusStart', 'focusDone'].includes(topic)) return;
    this.lastLine = Date.now();
    const a = this.activity;
    this.h.say(pickAware(topic, { user: this.user(), label: a.label, song: a.detail, minutes: opts.minutes }), { voice: opts.voice });
  }

  private free() {
    return this.h.canReact() && ['idle', 'walk', 'sit'].includes(this.h.state());
  }

  private onActivity(next: Activity) {
    const prev = this.activity;
    this.activity = next;
    const now = Date.now();
    if (next.kind !== prev.kind) {
      this.since = now;
      window.clearTimeout(this.enterTimer);
      if (prev.kind === 'meeting' && this.h.settings().meetingMode) {
        window.setTimeout(() => this.h.isSpeaker() && this.free() && this.line('meetingEnd'), 3000);
      }
      // Wait until the user settles on the app before reacting (no reaction to alt-tabbing).
      this.enterTimer = window.setTimeout(() => this.onEnter(next.kind), 6000);
    }
    if (next.kind === 'music' && next.detail && next.detail !== this.lastSong) {
      this.lastSong = next.detail;
      if (prev.kind === 'music' || prev.detail) {
        window.setTimeout(() => {
          if (this.activity.detail === next.detail && this.h.isSpeaker() && this.free() && Math.random() < 0.6) this.line('song');
        }, 4000);
      }
    }
    if (next.typing >= 3 && now - this.lastStorm > 10 * MIN && !this.quiet()) {
      this.lastStorm = now;
      if (this.h.isSpeaker() && this.free()) {
        this.line('typing');
        this.h.act('scared');
      } else if (this.free() && Math.random() < 0.4) {
        this.h.act('happy');
      }
    }
  }

  private onEnter(kind: ActivityKind) {
    if (this.activity.kind !== kind || !this.h.canReact()) return;
    if (kind === 'meeting') {
      if (!this.h.settings().meetingMode) return;
      if (this.free()) this.h.act('sit');
      if (this.h.isSpeaker()) this.line('meeting', { voice: false });
      return;
    }
    if (kind === 'video') {
      if (this.free()) this.h.act('sit');
    } else if (kind === 'music') {
      if (this.free()) this.h.act('dance');
    }
    if (this.quiet() || !this.h.isSpeaker() || !this.free()) return;
    const chance = ENTER_CHANCE[kind] ?? 0;
    if (Math.random() < chance) {
      if (kind === 'music' && this.activity.detail && Math.random() < 0.6) this.line('song');
      else if (kind in ENTER_CHANCE) this.line(kind as AwareTopic);
    }
  }

  private tick() {
    const now = Date.now();
    const s = this.h.settings();
    const sys = this.h.system();
    const kind = this.activity.kind;

    // While watching, pets sit and watch too; while music plays, they bop now and then.
    if (kind === 'video' && this.free() && this.h.state() !== 'sit' && Math.random() < 0.5) this.h.act('sit');
    if (kind === 'music' && !this.quiet() && this.free() && Math.random() < 0.35) this.h.act('dance');
    if (kind === 'meeting' && this.inMeeting() && this.free() && this.h.state() !== 'sit') this.h.act('sit');

    // A comment if you have been at the same thing for a long time.
    const long = LONG[kind];
    if (long && !this.quiet() && now - this.since > 20 * MIN && now - this.lastLine > 20 * MIN && this.h.isSpeaker() && this.free()) {
      this.line(long);
    }

    // Wellbeing: counts time at the computer, resets when you step away.
    if (sys.idle) {
      this.activeMs = 0;
      this.waterMs = 0;
    } else {
      this.activeMs += 20_000;
      this.waterMs += 20_000;
    }
    if (s.breakReminders && this.activeMs >= 60 * MIN && !this.quiet()) {
      this.activeMs = 0;
      if (this.free()) this.h.act('stretch');
      if (this.h.isSpeaker()) this.line('break');
    }
    if (s.waterReminders && this.waterMs >= 90 * MIN && !this.quiet()) {
      this.waterMs = 0;
      if (this.h.isSpeaker()) this.line('water');
    }

    // Up past 1 a.m. and still busy: one gentle nudge per night.
    const d = new Date();
    const night = d.toDateString();
    if (d.getHours() >= 1 && d.getHours() < 5 && !sys.idle && this.nightShown !== night && !this.quiet()) {
      this.nightShown = night;
      if (this.h.isSpeaker() && this.free()) {
        this.line('night');
        this.h.act('yawn');
      }
    }
  }

  startFocus(minutes: number) {
    const m = Math.max(1, Math.min(180, Math.round(minutes)));
    window.clearTimeout(this.focusTimer);
    if (this.h.isSpeaker()) this.line('focusStart', { minutes: m });
    // Let the announcement finish before going silent.
    window.setTimeout(() => {
      this.focusUntil = Date.now() + m * MIN;
      if (this.free()) this.h.act('meditate');
      this.focusTimer = window.setTimeout(() => this.endFocus(true), m * MIN);
    }, 3500);
  }

  endFocus(cheer: boolean) {
    if (!this.focusing() && !cheer) return;
    window.clearTimeout(this.focusTimer);
    this.focusUntil = 0;
    if (!cheer) return;
    if (this.free()) this.h.act('dance');
    if (this.h.isSpeaker()) this.line('focusDone');
  }
}
