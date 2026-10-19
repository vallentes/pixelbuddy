// Speech bubbles: rounded comic font, soft gradient, letters that fade in one by one,
// a gentle float, and *emphasis* in color.

export const CHAR_MS = 26;
const FONT = 'Fredoka, system-ui, -apple-system, "Segoe UI", sans-serif';

export interface Word {
  text: string;
  em: boolean;
}

/** Splits text into words, tracking *emphasis* spans. */
export function parseWords(text: string): Word[] {
  const out: Word[] = [];
  let em = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw;
    let startEm: boolean = em;
    if (w.startsWith('*')) {
      startEm = true;
      w = w.slice(1);
    }
    let endEm: boolean = startEm;
    if (w.endsWith('*') || /\*[!?.,]+$/.test(w)) {
      w = w.replace(/\*(?=[!?.,]*$)/, '');
      endEm = false;
    }
    if (w) out.push({ text: w, em: startEm });
    em = endEm;
  }
  return out;
}

/** Plain text without emphasis markers (for voices and length). */
export function plain(text: string) {
  return text.replace(/\*/g, '');
}

/** Milliseconds until every letter is visible. */
export function typeMs(text: string, charMs = CHAR_MS) {
  return plain(text).length * charMs + 200;
}

function layout(ctx: CanvasRenderingContext2D, words: Word[], maxW: number, space: number) {
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let w = 0;
  for (const word of words) {
    const ww = ctx.measureText(word.text).width;
    if (cur.length && w + space + ww > maxW) {
      lines.push(cur);
      cur = [];
      w = 0;
    }
    w += (cur.length ? space : 0) + ww;
    cur.push(word);
  }
  if (cur.length) lines.push(cur);
  return lines.slice(0, 5);
}

/**
 * Draws a speech bubble whose tail points at (cx, bottom). `s` is the device scale; `age`
 * and `left` (ms) drive the pop-in, letter fade-in and fade-out.
 */
export function drawSmoothBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  bottom: number,
  s: number,
  age = 1e9,
  left = 1e9,
  charMs = CHAR_MS,
) {
  const alpha = Math.min(1, left / 260, age / 90);
  if (alpha <= 0) return;
  const pop = Math.min(1, age / 260);
  const scale = pop < 1 ? 1 - Math.pow(1 - pop, 3) * 0.6 + Math.sin(pop * Math.PI) * 0.12 : 1;
  const bob = Math.sin(age / 520) * 1.6 * s;

  const fontPx = Math.round(15 * s);
  ctx.save();
  ctx.font = `600 ${fontPx}px ${FONT}`;
  const space = ctx.measureText(' ').width;
  const words = parseWords(text);
  const maxW = Math.min(ctx.canvas.width - 20 * s, 240 * s);
  const lines = layout(ctx, words, maxW - 26 * s, space);
  const lineWidths = lines.map((l) => l.reduce((n, w, i) => n + ctx.measureText(w.text).width + (i ? space : 0), 0));
  const lh = fontPx * 1.22;
  const padX = 13 * s;
  const padY = 9 * s;
  const w = Math.max(...lineWidths, 24 * s) + padX * 2;
  const h = lines.length * lh + padY * 2 - fontPx * 0.12;
  const left0 = Math.max(6 * s, Math.min(ctx.canvas.width - w - 6 * s, cx - w / 2));
  const top = Math.max(6 * s, bottom - h - 12 * s) + bob;

  ctx.globalAlpha = alpha;
  ctx.translate(cx, bottom);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -bottom);

  // Body with tail as one path, so the outline is continuous.
  const tx = Math.max(left0 + 18 * s, Math.min(left0 + w - 18 * s, cx));
  const r = Math.min(16 * s, h / 2);
  ctx.beginPath();
  ctx.moveTo(left0 + r, top);
  ctx.arcTo(left0 + w, top, left0 + w, top + h, r);
  ctx.arcTo(left0 + w, top + h, left0, top + h, r);
  ctx.lineTo(tx + 8 * s, top + h);
  ctx.quadraticCurveTo(tx + 2 * s, top + h + 4 * s, tx - 2 * s, top + h + 11 * s);
  ctx.quadraticCurveTo(tx - 3 * s, top + h + 4 * s, tx - 9 * s, top + h);
  ctx.arcTo(left0, top + h, left0, top, r);
  ctx.arcTo(left0, top, left0 + w, top, r);
  ctx.closePath();
  ctx.shadowColor = 'rgba(25, 12, 45, 0.28)';
  ctx.shadowBlur = 12 * s;
  ctx.shadowOffsetY = 3 * s;
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#fff3e3');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.6 * s;
  ctx.strokeStyle = 'rgba(42, 34, 64, 0.22)';
  ctx.stroke();

  // Letters fade in one after another.
  const shown = age / charMs;
  let idx = 0;
  ctx.textBaseline = 'top';
  lines.forEach((line, li) => {
    let x = left0 + (w - lineWidths[li]) / 2;
    const y = top + padY + li * lh;
    line.forEach((word, wi) => {
      if (wi) {
        x += space;
        idx++;
      }
      ctx.fillStyle = word.em ? '#e8457a' : '#2a2240';
      for (const ch of word.text) {
        const a = Math.max(0, Math.min(1, shown - idx));
        if (a > 0) {
          ctx.globalAlpha = alpha * a;
          const rise = (1 - a) * 4 * s;
          ctx.fillText(ch, x, y + rise);
        }
        x += ctx.measureText(ch).width;
        idx++;
      }
    });
  });
  ctx.restore();
}
