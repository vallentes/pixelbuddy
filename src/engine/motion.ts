export const GRAVITY = 2600;

export function stepWalk(x: number, vx: number, dt: number, minX: number, maxX: number): number {
  return Math.min(maxX, Math.max(minX, x + vx * dt));
}

export interface Fall {
  y: number;
  vy: number;
}

/** Advances a falling body; returns true once it lands on the floor. */
export function stepFall(b: Fall, floorY: number, dt: number, gravity = GRAVITY): boolean {
  b.vy += gravity * dt;
  b.y += b.vy * dt;
  if (b.y >= floorY) {
    b.y = floorY;
    b.vy = 0;
    return true;
  }
  return false;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Index of the rect containing the point, else the nearest one. */
export function pickMonitor(rects: Rect[], px: number, py: number): number {
  let best = 0;
  let bestD = Infinity;
  rects.forEach((r, i) => {
    const dx = px < r.x ? r.x - px : px > r.x + r.width ? px - (r.x + r.width) : 0;
    const dy = py < r.y ? r.y - py : py > r.y + r.height ? py - (r.y + r.height) : 0;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Calls `cb(dt)` at most `fps` times per second using requestAnimationFrame. */
export class FrameLoop {
  private raf = 0;
  private last = 0;
  private acc = 0;
  running = false;

  constructor(
    private fps: () => number,
    private cb: (dt: number, now: number) => void,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (t: number) => {
      if (!this.running) return;
      const interval = 1000 / Math.max(1, this.fps());
      this.acc += t - this.last;
      this.last = t;
      if (this.acc >= interval) {
        const dt = Math.min(this.acc, 250) / 1000;
        this.acc %= interval;
        this.cb(dt, t);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
