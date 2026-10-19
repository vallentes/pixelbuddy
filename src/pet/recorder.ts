// "Record My Buddy": films the pet into its own video canvas (never the screen) with a clean
// background and a small watermark, ready for TikTok/Shorts (portrait) or YouTube/X (landscape).

import type { Renderer } from '../shared/renderer';

export type ClipShape = 'portrait' | 'landscape';

const SIZES: Record<ClipShape, [number, number]> = {
  portrait: [720, 1280],
  landscape: [1280, 720],
};

/** Best container the webview can record: MP4 where supported (macOS), WebM otherwise. */
export function clipFormat(): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const options: [string, 'mp4' | 'webm'][] = [
    ['video/mp4;codecs=avc1,mp4a', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9,opus', 'webm'],
    ['video/webm;codecs=vp8,opus', 'webm'],
    ['video/webm', 'webm'],
  ];
  for (const [mime, ext] of options) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  return null;
}

export class ClipRecorder {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rec: MediaRecorder;
  private chunks: Blob[] = [];
  private started = performance.now();
  readonly done: Promise<Blob>;

  constructor(
    readonly shape: ClipShape,
    private name: string,
    audio: MediaStreamTrack | null,
    format: { mime: string },
  ) {
    const [w, h] = SIZES[shape];
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d')!;
    const stream = this.canvas.captureStream(30);
    if (audio) stream.addTrack(audio);
    this.rec = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: 6_000_000 });
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.done = new Promise((resolve) => {
      this.rec.onstop = () => resolve(new Blob(this.chunks, { type: format.mime.split(';')[0] }));
    });
    this.rec.start(1000);
  }

  get elapsed() {
    return performance.now() - this.started;
  }

  stop() {
    if (this.rec.state !== 'inactive') this.rec.stop();
  }

  /** Draws one video frame: background, the pet, the watermark. */
  frame(sprite: Renderer) {
    const c = this.ctx;
    const { width: w, height: h } = this.canvas;
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1b2b6b');
    g.addColorStop(0.55, '#2457d6');
    g.addColorStop(1, '#0f1d4d');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.16;
    c.fillStyle = '#7fb0ff';
    c.beginPath();
    c.ellipse(w * 0.7, h * 0.32, w * 0.42, h * 0.36, -0.4, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;

    const portrait = this.shape === 'portrait';
    const floor = portrait ? h * 0.74 : h * 0.86;
    // Soft shadow on the "ground".
    c.fillStyle = 'rgba(0, 0, 0, 0.22)';
    c.beginPath();
    c.ellipse(w / 2, floor, portrait ? 170 : 150, 18, 0, 0, Math.PI * 2);
    c.fill();
    sprite.draw(c, w / 2, floor + 6, portrait ? 14 : 12);

    // Name on top, watermark at the bottom.
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255, 255, 255, 0.95)';
    c.font = `700 ${portrait ? 58 : 46}px Fredoka, sans-serif`;
    c.fillText(this.name, w / 2, portrait ? 150 : 84);
    c.font = `600 ${portrait ? 30 : 24}px Fredoka, sans-serif`;
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    c.fillText('PixelBuddy', w / 2, h - (portrait ? 92 : 52));
    c.font = `500 ${portrait ? 22 : 18}px Fredoka, sans-serif`;
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.fillText('free desktop pets · vallentes.github.io/pixelbuddy', w / 2, h - (portrait ? 58 : 26));
  }
}
