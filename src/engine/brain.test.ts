import { describe, expect, it } from 'vitest';
import { Brain, DURATION, type World } from './brain';
import { pickMonitor, stepFall, stepWalk } from './motion';

const needs = { hunger: 20, happiness: 50, energy: 80 };
const world = (over: Partial<World> = {}): World => ({
  now: 0,
  x: 500,
  minX: 0,
  maxX: 1000,
  walking: true,
  systemIdle: false,
  needs,
  cursorX: null,
  ...over,
});

function seq(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('Brain', () => {
  it('eats for the eat duration after feeding, then moves on', () => {
    const b = new Brain(60, seq(0.99));
    b.act('feed', 0);
    expect(b.state).toBe('eat');
    expect(b.update(world({ now: DURATION.eat - 1 }))).toBe(0);
    expect(b.state).toBe('eat');
    b.update(world({ now: DURATION.eat + 1 }));
    expect(b.state).not.toBe('eat');
  });

  it('gets angry after five quick clicks, but not five slow ones', () => {
    const b = new Brain(60);
    for (let i = 0; i < 4; i++) expect(b.click(i * 100)).toBe('pat');
    expect(b.click(500)).toBe('angry');
    expect(b.state).toBe('angry');

    const slow = new Brain(60);
    for (let i = 0; i < 5; i++) expect(slow.click(i * 3000)).toBe('pat');
  });

  it('sleeps while the user is away and wakes up happy', () => {
    const b = new Brain(60);
    b.update(world({ systemIdle: true }));
    expect(b.state).toBe('sleep');
    b.update(world({ now: 100_000, systemIdle: true }));
    expect(b.state).toBe('sleep');
    b.update(world({ now: 100_100 }));
    expect(b.state).toBe('happy');
  });

  it('walks toward its target and stops there', () => {
    const b = new Brain(100, seq(0.5, 0.9, 0.1));
    let x = 500;
    let now = 0;
    b.update(world({ now, x }));
    expect(b.state).toBe('walk');
    const target = b.targetX!;
    for (let i = 0; i < 400 && b.state === 'walk'; i++) {
      now += 50;
      const vx = b.update(world({ now, x }));
      x = stepWalk(x, vx, 0.05, 0, 1000);
    }
    expect(b.state).toBe('idle');
    expect(Math.abs(x - target)).toBeLessThan(6);
  });

  it('does not walk when walking is disabled', () => {
    const b = new Brain(100, seq(0.5));
    b.update(world({ walking: false }));
    expect(b.state).not.toBe('walk');
  });

  it('faces the cursor while idling', () => {
    const b = new Brain(60, seq(0.95));
    b.update(world());
    expect(b.state).toBe('idle');
    b.update(world({ now: 10, cursorX: 100 }));
    expect(b.facing).toBe(-1);
    b.update(world({ now: 20, cursorX: 900 }));
    expect(b.facing).toBe(1);
  });

  it('ignores reactions while dragged, then lands', () => {
    const b = new Brain(60);
    b.startDrag();
    b.act('dance', 0);
    expect(b.state).toBe('drag');
    expect(b.update(world())).toBe(0);
    b.startFall();
    b.landed(10);
    expect(b.state).toBe('land');
  });

  it('naps when tired', () => {
    const b = new Brain(60, seq(0.1));
    b.update(world({ needs: { ...needs, energy: 10 } }));
    expect(b.state).toBe('sleep');
  });
});

describe('motion', () => {
  it('clamps walking to the monitor bounds', () => {
    expect(stepWalk(990, 100, 1, 0, 1000)).toBe(1000);
    expect(stepWalk(5, -100, 1, 0, 1000)).toBe(0);
  });

  it('falls and lands on the floor', () => {
    const body = { y: 0, vy: 0 };
    let landed = false;
    for (let i = 0; i < 200 && !landed; i++) landed = stepFall(body, 800, 1 / 60);
    expect(landed).toBe(true);
    expect(body.y).toBe(800);
  });

  it('shows off for Twitch evolve and parties for confetti', () => {
    const b = new Brain(60);
    b.act('evolve', 0);
    expect(b.state).toBe('flex');
    b.act('confetti', 10_000);
    expect(b.state).toBe('dance');
  });

  it('picks the monitor under a point, or the nearest one', () => {
    const rects = [
      { x: 0, y: 0, width: 1920, height: 1080 },
      { x: 1920, y: 0, width: 2560, height: 1440 },
    ];
    expect(pickMonitor(rects, 100, 100)).toBe(0);
    expect(pickMonitor(rects, 3000, 500)).toBe(1);
    expect(pickMonitor(rects, 5000, 5000)).toBe(1);
    expect(pickMonitor(rects, -50, 50)).toBe(0);
  });
});
