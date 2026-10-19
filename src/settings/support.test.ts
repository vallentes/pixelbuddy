import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';

const REVOLUT_URL = 'https://revolut.me/vallentes';

/** Renders a QR to RGBA the same way the canvas would (dark modules, white quiet zone). */
function render(text: string, scale = 8, margin = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const size = (n + margin * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.modules.get(x, y)) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4;
          data[i] = data[i + 1] = data[i + 2] = 25;
        }
      }
    }
  }
  return { data, size };
}

describe('support links', () => {
  it('the Revolut QR code scans to revolut.me/vallentes', () => {
    const { data, size } = render(REVOLUT_URL);
    const decoded = jsQR(data, size, size);
    expect(decoded?.data).toBe(REVOLUT_URL);
  });

  it('the Support screen and Rust command use the same links', async () => {
    const fs = await import('node:fs');
    const screen = fs.readFileSync('src/settings/screens/Support.tsx', 'utf8');
    const rust = fs.readFileSync('src-tauri/src/commands.rs', 'utf8');
    expect(screen).toContain(`'${REVOLUT_URL}'`);
    expect(rust).toContain(`"${REVOLUT_URL}"`);
    expect(rust).toContain('"https://buymeacoffee.com/vallentes"');
  });
});
