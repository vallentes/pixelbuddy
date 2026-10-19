import { describe, expect, it } from 'vitest';
import { AWARE_LINES, pickAware } from './lines4';

describe('awareness lines', () => {
  it('every topic has lines and every placeholder gets filled', () => {
    for (const [topic, lines] of Object.entries(AWARE_LINES)) {
      expect(lines.length, topic).toBeGreaterThan(0);
      for (let i = 0; i < lines.length; i++) {
        const text = pickAware(topic as keyof typeof AWARE_LINES, { user: 'Val', label: 'YouTube', song: 'Daft Punk - One More Time', minutes: 25 }, () => i / lines.length);
        expect(text, topic).not.toMatch(/[{}]/);
        expect(text, topic).not.toMatch(/—/);
      }
    }
  });

  it('falls back to friendly words when details are missing', () => {
    const t = pickAware('song', { user: '' }, () => 0);
    expect(t).toContain('this song');
    expect(t).toContain('friend');
  });
});
