// Pet voices and sound effects, all synthesized at runtime (no audio files).
// "babble": cute per-species blips in the rhythm of the text (like a tiny animal talking).
// "speech": the operating system's text-to-speech voice, pitched per species.
// "natural": free Kokoro neural voices, played by the main window's voice service.

import { emit, listen } from '@tauri-apps/api/event';

// Natural-voice requests waiting for the main window to start playing them.
const waiting = new Map<string, (ms: number | null) => void>();
let listening = false;
function listenOnce() {
  if (listening) return;
  listening = true;
  void listen<{ reqId: string; ms: number }>('voice://started', (e) => {
    waiting.get(e.payload.reqId)?.(e.payload.ms);
    waiting.delete(e.payload.reqId);
  }).catch(() => {});
  void listen<{ reqId: string }>('voice://failed', (e) => {
    waiting.get(e.payload.reqId)?.(null);
    waiting.delete(e.payload.reqId);
  }).catch(() => {});
}

export type VoiceMode = 'off' | 'babble' | 'speech' | 'natural';
export type Sfx = 'chomp' | 'boing' | 'pop' | 'snore' | 'whoosh' | 'thud' | 'grumble' | 'sparkle' | 'achoo' | 'beep' | 'toot' | 'hic' | 'rimshot' | 'guitar' | 'shutter';

interface VoiceProfile {
  base: number;
  wave: OscillatorType;
  spread: number;
  pitch: number;
  rate: number;
}

const PROFILES: Record<string, VoiceProfile> = {
  mochi: { base: 560, wave: 'triangle', spread: 0.35, pitch: 1.35, rate: 1.0 },
  pip: { base: 760, wave: 'square', spread: 0.5, pitch: 1.8, rate: 1.15 },
  ember: { base: 300, wave: 'sawtooth', spread: 0.3, pitch: 0.6, rate: 0.95 },
  bolt: { base: 880, wave: 'square', spread: 0.15, pitch: 0.3, rate: 1.05 },
  nimbus: { base: 470, wave: 'sine', spread: 0.25, pitch: 1.15, rate: 0.85 },
  pickles: { base: 420, wave: 'triangle', spread: 0.2, pitch: 0.9, rate: 0.95 },
  clover: { base: 820, wave: 'triangle', spread: 0.55, pitch: 1.7, rate: 1.25 },
  waffles: { base: 600, wave: 'square', spread: 0.45, pitch: 1.4, rate: 1.2 },
  hoot: { base: 380, wave: 'sine', spread: 0.3, pitch: 0.8, rate: 0.9 },
  biscuit: { base: 900, wave: 'triangle', spread: 0.4, pitch: 1.8, rate: 1.3 },
  zib: { base: 700, wave: 'square', spread: 0.6, pitch: 1.6, rate: 1.1 },
  boo: { base: 500, wave: 'sine', spread: 0.5, pitch: 1.2, rate: 0.9 },
  shelly: { base: 300, wave: 'sine', spread: 0.15, pitch: 0.7, rate: 0.6 },
  inky: { base: 650, wave: 'triangle', spread: 0.5, pitch: 1.4, rate: 1.15 },
  bao: { base: 330, wave: 'triangle', spread: 0.2, pitch: 0.75, rate: 0.8 },
};

const VOWELS: Record<string, number> = { a: 0, e: 0.2, i: 0.35, o: -0.15, u: -0.25, y: 0.25 };

export interface VoiceSettings {
  mode: VoiceMode;
  volume: number;
  sfx: boolean;
}

/** Splits text into syllable-ish chunks with a pitch offset each (exported for tests). */
export function syllables(text: string): { offset: number; accent: boolean }[] {
  const out: { offset: number; accent: boolean }[] = [];
  const words = text.toLowerCase().match(/[a-z0-9']+|[!?]/g) ?? [];
  for (const w of words) {
    if (w === '!' || w === '?') {
      if (out.length) {
        out[out.length - 1].accent = true;
        if (w === '?') out[out.length - 1].offset += 0.35;
      }
      continue;
    }
    const groups = w.match(/[^aeiouy]*[aeiouy]+|[^aeiouy]+$/g) ?? [w];
    for (const g of groups.slice(0, 4)) {
      const v = [...g].find((c) => c in VOWELS);
      out.push({ offset: v ? VOWELS[v] : 0.1, accent: false });
    }
  }
  return out.slice(0, 40);
}

export class Voice {
  private ctx: AudioContext | null = null;
  private busyUntil = 0;

  constructor(
    private species: string,
    private settings: () => VoiceSettings,
  ) {}

  setSpecies(s: string) {
    this.species = s;
  }

  private audio(): AudioContext | null {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private profile() {
    return PROFILES[this.species] ?? PROFILES.mochi;
  }

  /**
   * Speaks a line. Resolves with the audio length in ms at the moment sound starts (so the
   * bubble can type in sync), or null if there is no voice to wait for.
   */
  say(text: string): Promise<number | null> {
    const s = this.settings();
    if (s.mode === 'off' || s.volume <= 0) return Promise.resolve(null);
    if (s.mode === 'natural') {
      listenOnce();
      const reqId = `${this.species}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          waiting.delete(reqId);
          resolve(null);
        }, 6000);
        waiting.set(reqId, (ms) => {
          window.clearTimeout(timer);
          resolve(ms);
        });
        void emit('voice://speak', { text, species: this.species, reqId }).catch(() => resolve(null));
      });
    }
    if (s.mode === 'speech' && 'speechSynthesis' in window) {
      this.speak(text, s.volume);
      return Promise.resolve(null);
    }
    return Promise.resolve(this.babble(text, s.volume));
  }

  private speak(text: string, volume: number) {
    const p = this.profile();
    const u = new SpeechSynthesisUtterance(text.replace(/♥/g, ' ').replace(/\*/g, ''));
    u.pitch = p.pitch;
    u.rate = p.rate;
    u.volume = Math.min(1, volume);
    const lang = navigator.language?.slice(0, 2) ?? 'en';
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang));
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  private babble(text: string, volume: number): number | null {
    const ctx = this.audio();
    if (!ctx) return null;
    const p = this.profile();
    const now = ctx.currentTime;
    if (now < this.busyUntil) return null;
    let t = now + 0.02;
    const parts = syllables(text);
    for (const s of parts) {
      const freq = p.base * (1 + s.offset * p.spread + (Math.random() - 0.5) * 0.12);
      const len = s.accent ? 0.11 : 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = p.wave;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * (s.accent ? 1.25 : 0.92), t + len);
      const peak = 0.12 * volume * (s.accent ? 1.3 : 1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len + 0.02);
      t += len + 0.025;
    }
    this.busyUntil = t;
    return (t - now) * 1000;
  }

  /** Little synthesized sound effects for actions. */
  sfx(kind: Sfx) {
    const s = this.settings();
    if (!s.sfx || s.volume <= 0) return;
    const ctx = this.audio();
    if (!ctx) return;
    const v = 0.15 * s.volume;
    const t = ctx.currentTime + 0.01;
    const tone = (type: OscillatorType, f0: number, f1: number, start: number, len: number, vol = v) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, start);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + len);
      g.gain.setValueAtTime(vol, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + len);
      o.connect(g).connect(ctx.destination);
      o.start(start);
      o.stop(start + len + 0.02);
    };
    const noise = (start: number, len: number, freq: number, vol = v) => {
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      src.buffer = buf;
      f.type = 'bandpass';
      f.frequency.value = freq;
      g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(start);
    };
    switch (kind) {
      case 'chomp':
        for (let i = 0; i < 3; i++) noise(t + i * 0.16, 0.07, 900 + i * 120);
        break;
      case 'boing':
        tone('sine', 220, 660, t, 0.25);
        break;
      case 'pop':
        tone('sine', 900, 300, t, 0.08);
        break;
      case 'snore':
        noise(t, 0.7, 180, v * 0.6);
        break;
      case 'whoosh':
        noise(t, 0.3, 1500, v * 0.7);
        break;
      case 'thud':
        tone('sine', 140, 50, t, 0.18, v * 1.4);
        break;
      case 'grumble':
        tone('sawtooth', 120, 90, t, 0.35, v * 0.5);
        break;
      case 'sparkle':
        [1320, 1760, 2093].forEach((f, i) => tone('triangle', f, f, t + i * 0.07, 0.12, v * 0.6));
        break;
      case 'achoo':
        tone('triangle', 500, 900, t, 0.25, v * 0.5);
        noise(t + 0.3, 0.25, 2500);
        break;
      case 'toot': {
        // A polite little brass-section toot.
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(110, t);
        o.frequency.linearRampToValueAtTime(70, t + 0.45);
        f.type = 'lowpass';
        f.frequency.value = 500;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v * 0.9, t + 0.03);
        for (let i = 1; i < 8; i++) g.gain.setValueAtTime(v * (i % 2 ? 0.5 : 0.9), t + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.55);
        break;
      }
      case 'guitar': {
        // A tiny distorted power chord.
        for (const f0 of [110, 165, 220]) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          const sh = ctx.createWaveShaper();
          const curve = new Float32Array(256);
          for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            curve[i] = Math.tanh(x * 6);
          }
          sh.curve = curve;
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f0, t);
          g.gain.setValueAtTime(v * 0.35, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
          o.connect(sh).connect(g).connect(ctx.destination);
          o.start(t);
          o.stop(t + 1.15);
        }
        break;
      }
      case 'shutter':
        noise(t, 0.05, 3000, v * 1.2);
        noise(t + 0.09, 0.05, 2500, v);
        break;
      case 'hic':
        tone('square', 900, 1400, t, 0.07, v * 0.5);
        break;
      case 'rimshot':
        noise(t, 0.08, 2000, v * 1.2);
        tone('triangle', 180, 120, t, 0.1, v);
        noise(t + 0.18, 0.08, 2200, v * 1.2);
        tone('triangle', 180, 120, t + 0.18, 0.1, v);
        noise(t + 0.38, 0.6, 7000, v * 0.9);
        break;
      case 'beep':
        tone('square', 1000, 1000, t, 0.06, v * 0.5);
        tone('square', 1400, 1400, t + 0.09, 0.06, v * 0.5);
        break;
    }
  }
}
