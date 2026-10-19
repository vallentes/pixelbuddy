import { describe, expect, it } from 'vitest';
import { Brain } from './brain';
import { KINDS, boredomBonus, buildScript, bystanderLine, chooseKind, isFree, pickConversation, type Presence } from './social';

const p = (id: number, name: string, species: string, x: number): Presence => ({
  id,
  name,
  species,
  x,
  y: 0,
  monitor: 'A',
  state: 'idle',
  busy: false,
  at: 0,
});


describe('social scripts', () => {
  it('are identical in both windows for the same seed', () => {
    const a = p(1, 'Mochi', 'mochi', 100);
    const b = p(2, 'Bolt', 'bolt', 600);
    for (const k of KINDS) expect(buildScript(k, a, b, 42)).toEqual(buildScript(k, a, b, 42));
  });

  it('give both pets something to do and fit inside the script length', () => {
    const a = p(1, 'Mochi', 'mochi', 100);
    const b = p(2, 'Pip', 'pip', 600);
    for (const k of KINDS) {
      const s = buildScript(k, a, b, 7);
      expect(s.steps.some((st) => st.role === 'a'), k).toBe(true);
      expect(s.steps.some((st) => st.role === 'b'), k).toBe(true);
      for (const st of s.steps) expect(st.at, k).toBeLessThan(s.length);
    }
  });

  it('fills in names', () => {
    const s = buildScript('highfive', p(1, 'Mochi', 'mochi', 0), p(2, 'Ember', 'ember', 500), 1);
    const said = s.steps.filter((st) => st.do === 'say').map((st) => (st as { text: string }).text);
    expect(said.join(' ')).toContain('Ember');
    expect(said.join(' ')).not.toContain('{');
  });

  it('uses species-specific conversations when they exist', () => {
    let hits = 0;
    for (let i = 0; i < 50; i++) {
      const [line] = pickConversation('ember', 'bolt', () => (i % 10) / 10);
      if (line.includes('Robot')) hits++;
    }
    expect(hits).toBeGreaterThan(0);
  });

  it('picks every kind of interaction eventually', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(chooseKind(() => i / 1000, true));
    expect(seen.size).toBe(KINDS.length);
  });

  it('fills in every line for every kind and seed', () => {
    const a = p(1, 'Mochi', 'mochi', 100);
    const b = p(2, 'Bolt', 'bolt', 700);
    for (const k of KINDS) {
      for (let seed = 0; seed < 40; seed++) {
        const s = buildScript(k, a, b, seed * 977);
        for (const st of s.steps) if (st.do === 'say') expect(st.text, k).not.toMatch(/[{}]|undefined/);
      }
    }
  });

  it('gets more playful the longer pets are ignored', () => {
    expect(boredomBonus(30_000)).toBe(0);
    expect(boredomBonus(6 * 60_000)).toBeGreaterThan(0.1);
    expect(boredomBonus(60 * 60_000)).toBe(0.4);
    const count = (wild: boolean) => {
      let n = 0;
      for (let i = 0; i < 1000; i++) if (['tag', 'prank', 'toot', 'argue', 'hideseek'].includes(chooseKind(() => i / 1000, false, wild))) n++;
      return n;
    };
    expect(count(true)).toBeGreaterThan(count(false));
  });

  it('bystanders shout something for every kind', () => {
    for (const k of KINDS) expect(bystanderLine(k, 'Mochi', 'Bolt', () => 0.5)).not.toMatch(/[{}]/);
  });

  it('only interrupts pets that are free', () => {
    expect(isFree('idle')).toBe(true);
    expect(isFree('drag')).toBe(false);
    expect(isFree('sleep')).toBe(false);
  });
});

describe('scripted brain control', () => {
  it('does not wander off during a script and walks at the script speed', () => {
    const b = new Brain(100, () => 0.1);
    b.lockUntil = 10_000;
    b.goTo(800, 0, 2);
    const vx = b.update({ now: 10, x: 100, minX: 0, maxX: 1000, walking: false, systemIdle: false, needs: { hunger: 10, happiness: 90, energy: 90 }, cursorX: null });
    expect(vx).toBe(200);
    // Arrive, then stay idle instead of picking a new activity while locked.
    b.update({ now: 20, x: 800, minX: 0, maxX: 1000, walking: true, systemIdle: false, needs: { hunger: 10, happiness: 90, energy: 90 }, cursorX: null });
    for (let t = 30; t < 9000; t += 500) {
      b.update({ now: t, x: 800, minX: 0, maxX: 1000, walking: true, systemIdle: false, needs: { hunger: 10, happiness: 90, energy: 90 }, cursorX: null });
      expect(b.state).toBe('idle');
    }
  });
});
