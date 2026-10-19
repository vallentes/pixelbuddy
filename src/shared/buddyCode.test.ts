import { describe, expect, it } from 'vitest';
import { decodeBuddy, encodeBuddy, type Buddy } from './buddyCode';

const b: Buddy = { species: 'waffles', color: 'golden', accessory: 'crown', name: 'Sir Waffles', from: 'Valentin' };

describe('buddy codes', () => {
  it('round-trips a pet', () => {
    const code = encodeBuddy(b);
    expect(code).toMatch(/^PB1-[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(48);
    expect(decodeBuddy(code)).toEqual(b);
  });

  it('handles emoji and accents in names', () => {
    const x = { ...b, name: 'Ștefan 🐶', from: '' };
    expect(decodeBuddy(encodeBuddy(x))).toEqual(x);
  });

  it('finds the code inside a pasted message', () => {
    expect(decodeBuddy(`meet my pet! ${encodeBuddy(b)} :)`).name).toBe('Sir Waffles');
  });

  it('rejects typos and junk', () => {
    const code = encodeBuddy(b);
    const typo = code.slice(0, -3) + (code.at(-3) === 'A' ? 'B' : 'A') + code.slice(-2);
    expect(() => decodeBuddy(typo)).toThrow();
    expect(() => decodeBuddy('hello')).toThrow(/PB1-/);
    expect(() => decodeBuddy('PB1-')).toThrow();
  });

  it('refuses pets it does not know', () => {
    expect(() => encodeBuddy({ ...b, species: 'dog' })).toThrow();
  });
});
