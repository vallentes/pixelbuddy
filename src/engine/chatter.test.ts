import { describe, expect, it } from 'vitest';
import { syllables } from '../shared/voice';
import { ALL_TOPICS, SPECIES_WITH_LINES, bubbleMs, idleTopic, linesFor, nextChatDelayMs, pickJoke, pickLine, timeTopic } from './chatter';

describe('chatter', () => {
  it('has well-formed lines for every topic and species', () => {
    for (const sp of SPECIES_WITH_LINES) {
      for (const t of ALL_TOPICS) {
        const lines = linesFor(t, sp);
        expect(lines.length, `${sp}/${t}`).toBeGreaterThan(0);
        for (const l of lines) {
          const filled = l.replace(/\{name\}/g, 'Mochi').replace(/\{user\}/g, 'Sam');
          expect(filled, l).not.toMatch(/[{}]/);
          expect(filled.length, l).toBeLessThanOrEqual(110);
          expect((filled.match(/\*/g) ?? []).length % 2, `unbalanced emphasis in "${l}"`).toBe(0);
        }
      }
    }
  });

  it('fills in names and falls back to "friend"', () => {
    const rand = () => 0;
    expect(pickLine('welcomeBack', 'pip', 'Pip', 'Sam', rand)).not.toContain('{');
    const lines = linesFor('greet', 'nimbus').filter((l) => l.includes('{user}'));
    expect(lines.length).toBeGreaterThan(0);
    for (let i = 0; i < 50; i++) expect(pickLine('greet', 'mochi', 'Mochi', '')).not.toContain('{user}');
  });

  it('prefers needs over small talk', () => {
    const rand = () => 0;
    const d = new Date(2026, 9, 21, 15);
    expect(idleTopic({ hunger: 90, happiness: 80, energy: 80 }, d, rand)).toBe('hungry');
    expect(idleTopic({ hunger: 10, happiness: 80, energy: 10 }, d, rand)).toBe('tired');
    expect(idleTopic({ hunger: 10, happiness: 80, energy: 80 }, d, () => 0.99)).toBe('random');
  });

  it('knows the time of day', () => {
    expect(timeTopic(new Date(2026, 9, 21, 7))).toBe('morning');
    expect(timeTopic(new Date(2026, 9, 21, 2))).toBe('lateNight');
    expect(timeTopic(new Date(2026, 9, 23, 16))).toBe('friday');
    expect(timeTopic(new Date(2026, 9, 21, 16))).toBe(null);
  });

  it('respects chattiness', () => {
    expect(nextChatDelayMs('off')).toBe(Infinity);
    const chatty = nextChatDelayMs('chatty', () => 1);
    const rare = nextChatDelayMs('rare', () => 0);
    expect(chatty).toBeLessThan(rare);
    expect(bubbleMs('hi')).toBeLessThan(bubbleMs('a much longer sentence for the bubble'));
  });

  it('has two-part jokes for every species', () => {
    for (const sp of SPECIES_WITH_LINES) {
      const [setup, punch] = pickJoke(sp, () => 0.1);
      expect(setup.length).toBeGreaterThan(5);
      expect(punch.length).toBeGreaterThan(2);
    }
  });

  it('turns text into babble syllables with accents', () => {
    const s = syllables('Hello there!');
    expect(s.length).toBeGreaterThanOrEqual(3);
    expect(s[s.length - 1].accent).toBe(true);
    expect(syllables('')).toEqual([]);
  });
});
