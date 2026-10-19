// Natural pet voices with Kokoro-82M (Apache-2.0), running locally via ONNX Runtime WebAssembly.
// Lives in the main window (always loaded, usually hidden) so the model is loaded once and every
// pet window just sends `voice://speak` events. Model weights download once from Hugging Face
// and are cached by the webview; the runtime files ship inside the app (public/ort).

import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';

export const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

interface PetVoice {
  voice: string;
  /** Playback rate: raises pitch and speed together for a cartoon voice. */
  rate: number;
  /** Speaking speed passed to the model (1 = normal). */
  speed?: number;
  robot?: boolean;
}

export const PET_VOICES: Record<string, PetVoice> = {
  mochi: { voice: 'af_nicole', rate: 1.16 },
  pip: { voice: 'af_sky', rate: 1.3 },
  ember: { voice: 'am_michael', rate: 0.94 },
  bolt: { voice: 'am_adam', rate: 1.05, robot: true },
  nimbus: { voice: 'af_heart', rate: 1.1 },
  pickles: { voice: 'bm_george', rate: 1.04 },
  clover: { voice: 'af_bella', rate: 1.32, speed: 1.1 },
  waffles: { voice: 'am_puck', rate: 1.2, speed: 1.1 },
  hoot: { voice: 'bm_fable', rate: 0.96 },
  biscuit: { voice: 'af_jessica', rate: 1.36 },
  zib: { voice: 'am_eric', rate: 1.38, robot: true },
  boo: { voice: 'af_river', rate: 1.12, speed: 0.9 },
  shelly: { voice: 'am_santa', rate: 0.86, speed: 0.75 },
  inky: { voice: 'af_nova', rate: 1.22 },
  bao: { voice: 'am_onyx', rate: 0.94, speed: 0.85 },
};

export type VoiceStatus =
  | { state: 'idle' }
  | { state: 'downloading'; progress: number }
  | { state: 'ready' }
  | { state: 'error'; message: string };

type Tts = {
  generate: (text: string, opts: { voice: string; speed?: number }) => Promise<{ audio: Float32Array; sampling_rate: number }>;
};

let tts: Tts | null = null;
let loading: Promise<void> | null = null;
let status: VoiceStatus = { state: 'idle' };
let audioCtx: AudioContext | null = null;
let volume = 0.6;
let queue: Promise<void> = Promise.resolve();
let pending = 0;

// Generated audio per species + line, so repeated lines play instantly.
const cache = new Map<string, { audio: Float32Array; sr: number }>();
const CACHE_MAX = 300;

async function synth(text: string, species: string) {
  const key = `${species}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pv = PET_VOICES[species] ?? PET_VOICES.mochi;
  const t0 = performance.now();
  const out = await tts!.generate(text, { voice: pv.voice, speed: pv.speed ?? 1 });
  console.debug(`voice: ${text.length} chars in ${Math.round(performance.now() - t0)} ms, ${(out.audio.length / out.sampling_rate).toFixed(1)} s audio`);
  const v = { audio: out.audio, sr: out.sampling_rate };
  cache.set(key, v);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return v;
}

function setStatus(s: VoiceStatus) {
  status = s;
  try {
    void emit('voice://status', s).catch(() => {});
  } catch {
    // Not inside Tauri (dev gallery); nothing to notify.
  }
}

export function voiceStatus() {
  return status;
}

export function setVolume(v: number) {
  volume = v;
}

/** Loads (and on first use downloads) the model. Safe to call many times. */
/** Picks the fastest backend: WebGPU when the machine has a usable GPU, else multi-threaded CPU. */
export async function pickBackend(): Promise<{ device: 'webgpu' | 'wasm'; dtype: 'fp32' | 'fp16' | 'q8' }> {
  const forced = new URLSearchParams(location.search);
  if (forced.get('device')) return { device: forced.get('device') as 'webgpu' | 'wasm', dtype: (forced.get('dtype') as 'fp32') ?? 'q8' };
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (gpu && (await gpu.requestAdapter())) return { device: 'webgpu', dtype: 'fp32' };
  } catch {
    // fall through to CPU
  }
  return { device: 'wasm', dtype: 'q8' };
}

export function loadVoices(): Promise<void> {
  if (tts) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    try {
      setStatus({ state: 'downloading', progress: 0 });
      const { env } = await import('@huggingface/transformers');
      const onnx = env.backends.onnx as { wasm?: { wasmPaths?: string; numThreads?: number; proxy?: boolean } };
      if (onnx.wasm) {
        // Bundled copy in production; the dev server cannot import .mjs files from public/.
        onnx.wasm.wasmPaths = import.meta.env.DEV ? '/node_modules/@huggingface/transformers/dist/' : '/ort/';
        // Several threads when the page is cross-origin isolated (set via response headers).
        onnx.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
        onnx.wasm.proxy = false;
      }
      const { KokoroTTS } = await import('kokoro-js');
      const backend = await pickBackend();
      console.debug(`voice: loading on ${backend.device} (${backend.dtype})`);
      if (isTauri()) {
        // The app downloads the model to disk once (Rust) and serves it via pbmodel://.
        const un = await listen<{ overall: number }>('voice://download', (e) => setStatus({ state: 'downloading', progress: e.payload.overall }));
        try {
          await invoke('voice_model_download', { variant: backend.dtype });
        } finally {
          un();
        }
        env.localModelPath = convertFileSrc('', 'pbmodel');
        env.allowLocalModels = true;
        env.allowRemoteModels = false;
      } else {
        env.allowLocalModels = false;
      }
      const files = new Map<string, { loaded: number; total: number }>();
      tts = (await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: backend.dtype,
        device: backend.device,
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status === 'progress' && p.file && p.total) {
            files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
            let l = 0;
            let t = 0;
            files.forEach((f) => {
              l += f.loaded;
              t += f.total;
            });
            setStatus({ state: 'downloading', progress: t ? l / t : 0 });
          }
        },
      })) as unknown as Tts;
      // Warm up (compiles GPU shaders) so the first real line is quick.
      await tts.generate('Hi!', { voice: PET_VOICES.mochi.voice }).catch(() => {});
      setStatus({ state: 'ready' });
    } catch (e) {
      loading = null;
      tts = null;
      setStatus({ state: 'error', message: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  })();
  return loading;
}

function context() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

async function play(samples: Float32Array, sampleRate: number, pv: PetVoice, onStart?: (ms: number) => void) {
  const ctx = context();
  const buf = ctx.createBuffer(1, samples.length, sampleRate);
  buf.copyToChannel(new Float32Array(samples), 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = pv.rate;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  let node: AudioNode = src;
  if (pv.robot) {
    // Ring modulation gives Bolt a friendly robot timbre.
    const ring = ctx.createGain();
    ring.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 55;
    const depth = ctx.createGain();
    depth.gain.value = 0.9;
    lfo.connect(depth).connect(ring.gain);
    const dry = ctx.createGain();
    dry.gain.value = 0.35;
    src.connect(ring);
    src.connect(dry);
    const mix = ctx.createGain();
    ring.connect(mix);
    dry.connect(mix);
    lfo.start();
    src.addEventListener('ended', () => lfo.stop());
    node = mix;
  }
  node.connect(gain).connect(ctx.destination);
  const done = new Promise<void>((r) => src.addEventListener('ended', () => r()));
  src.start();
  onStart?.((samples.length / sampleRate / pv.rate) * 1000);
  await done;
}

function clean(text: string) {
  return text.replace(/♥/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

/** Speaks a line for a species. Lines queue so pets do not talk over each other. */
function notify(event: string, payload: unknown) {
  try {
    void emit(event, payload).catch(() => {});
  } catch {
    // not inside Tauri
  }
}

export function speak(text: string, species: string, reqId?: string) {
  const t = clean(text);
  if (!t || !tts || pending > 3) {
    if (reqId) notify('voice://failed', { reqId });
    return;
  }
  const pv = PET_VOICES[species] ?? PET_VOICES.mochi;
  pending++;
  queue = queue
    .then(async () => {
      const v = await synth(t, species);
      await play(v.audio, v.sr, pv, (ms) => reqId && notify('voice://started', { reqId, ms }));
    })
    .catch((e) => {
      console.warn('voice failed', e);
      if (reqId) notify('voice://failed', { reqId });
    })
    .finally(() => {
      pending--;
    });
}

/** Starts listening for pet speech requests. Called once by the main window. */
export async function startVoiceService(initial: { mode: string; volume: number }) {
  volume = initial.volume;
  if (initial.mode === 'natural') loadVoices().catch(() => {});
  await listen<{ text: string; species: string; reqId?: string }>('voice://speak', (e) => {
    if (tts) speak(e.payload.text, e.payload.species, e.payload.reqId);
    else if (e.payload.reqId) notify('voice://failed', { reqId: e.payload.reqId });
  });
}

/** Quietly pre-generates common lines so the first time a pet says them there is no wait. */
export async function prewarm(lines: { text: string; species: string }[]) {
  if (!tts) return;
  for (const l of lines) {
    if (pending > 0) await queue;
    const t = clean(l.text);
    if (!t || cache.has(`${l.species}|${t}`)) continue;
    await new Promise((r) => setTimeout(r, 400));
    await synth(t, l.species).catch(() => {});
  }
}
