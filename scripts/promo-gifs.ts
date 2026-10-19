// Renders promotional GIFs for the README / landing page straight from the real HD pet renderer.
// Run with: npx vite-node scripts/promo-gifs.ts
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { HdSprite } from '../src/hd/HdSprite';
import type { PetState } from '../src/sprites/types';

GlobalFonts.registerFromPath('node_modules/@fontsource/fredoka/files/fredoka-latin-600-normal.woff2', 'Fredoka');

type Ctx = CanvasRenderingContext2D;
interface Actor {
  species: string;
  x: number;
  state: PetState;
  facing?: 1 | -1;
  says?: { at: number; text: string; ms: number }[];
  states?: { at: number; state: PetState }[];
  gaze?: [number, number];
}

function background(c: SKRSContext2D, w: number, h: number, taskbar: number) {
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#1b2b6b');
  g.addColorStop(0.55, '#2457d6');
  g.addColorStop(1, '#0f1d4d');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // Soft wallpaper swirl.
  c.globalAlpha = 0.18;
  c.fillStyle = '#7fb0ff';
  c.beginPath();
  c.ellipse(w * 0.72, h * 0.35, w * 0.32, h * 0.5, -0.4, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  if (taskbar) {
    c.fillStyle = 'rgba(15, 18, 32, 0.92)';
    c.fillRect(0, h - taskbar, w, taskbar);
    c.fillStyle = '#4d8cff';
    for (let i = 0; i < 4; i++) c.fillRect(w / 2 - 44 + i * 24, h - taskbar + taskbar / 2 - 6, 12, 12);
  }
}

function label(c: SKRSContext2D, text: string, x: number, y: number) {
  c.font = '600 15px Fredoka';
  c.textAlign = 'center';
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.fillText(text, x, y);
}

function render(name: string, w: number, h: number, seconds: number, fps: number, pixel: number, actors: Actor[], opts: { taskbar?: number; labels?: boolean } = {}) {
  const canvas = createCanvas(w, h);
  const c = canvas.getContext('2d');
  const sprites = actors.map((a) => {
    const s = new HdSprite(a.species, 'classic', 'none');
    s.setState(a.state);
    s.facing = a.facing ?? 1;
    s.setGaze(...(a.gaze ?? [0.3, 0.1]));
    return s;
  });
  const gif = GIFEncoder();
  const dt = 1000 / fps;
  const taskbar = opts.taskbar ?? 0;
  const floor = h - taskbar - (opts.labels ? 26 : 4);
  for (let f = 0; f < seconds * fps; f++) {
    const now = f * dt;
    background(c, w, h, taskbar);
    actors.forEach((a, i) => {
      const s = sprites[i];
      for (const st of a.states ?? []) if (now >= st.at && now - dt < st.at) s.setState(st.state);
      for (const say of a.says ?? []) if (now >= say.at && now - dt < say.at) s.say(say.text, say.ms, now);
      // Advance in small steps for smooth easing.
      for (let k = 0; k < 4; k++) s.advance(dt / 4, 1);
      s.draw(c as unknown as Ctx, a.x, floor, pixel, now);
      if (opts.labels) label(c, a.state === 'airguitar' ? 'air guitar' : a.state, a.x, h - 8);
    });
    const { data } = c.getImageData(0, 0, w, h);
    const palette = quantize(data, 256, { format: 'rgb565' });
    gif.writeFrame(applyPalette(data, palette, 'rgb565'), w, h, { palette, delay: Math.round(dt) });
  }
  gif.finish();
  mkdirSync('docs', { recursive: true });
  writeFileSync(`docs/${name}.gif`, gif.bytes());
  console.log(`docs/${name}.gif  ${(gif.bytes().length / 1024).toFixed(0)} KB`);
}

// 1. Hero: a desktop full of pets, one of them talking.
render(
  'hero',
  760,
  250,
  6,
  15,
  3,
  [
    { species: 'mochi', x: 70, state: 'dance' },
    { species: 'pickles', x: 190, state: 'juggle' },
    { species: 'clover', x: 310, state: 'idle', says: [{ at: 300, text: 'Hi! I live on your *desktop* now.', ms: 2800 }], states: [{ at: 3300, state: 'happy' }] },
    { species: 'zib', x: 430, state: 'airguitar' },
    { species: 'waffles', x: 550, state: 'idle', says: [{ at: 3300, text: 'Who wants to *play*?!', ms: 2600 }], states: [{ at: 1000, state: 'wave' }, { at: 3300, state: 'dance' }] },
    { species: 'boo', x: 680, state: 'idle', states: [{ at: 1500, state: 'magic' }] },
  ],
  { taskbar: 28 },
);

// 2. Tricks: a row of pets showing off, labeled.
render(
  'tricks',
  760,
  230,
  3.2,
  15,
  3,
  [
    { species: 'ember', x: 70, state: 'backflip' },
    { species: 'bao', x: 195, state: 'shades' },
    { species: 'inky', x: 320, state: 'yoyo' },
    { species: 'hoot', x: 445, state: 'karate' },
    { species: 'biscuit', x: 570, state: 'bubblegum' },
    { species: 'bolt', x: 695, state: 'airguitar' },
  ],
  { labels: true },
);

// 3. Friends: two pets having a conversation.
render(
  'friends',
  520,
  260,
  8,
  12,
  3.4,
  [
    { species: 'waffles', x: 150, state: 'idle', facing: 1, gaze: [1, 0], says: [{ at: 200, text: 'Mochi! Want to *play*?!', ms: 2400 }, { at: 5000, text: 'Okay! Want to play *later*?!', ms: 2800 }], states: [{ at: 5000, state: 'happy' }] },
    { species: 'mochi', x: 370, state: 'sit', facing: -1, gaze: [-1, 0], says: [{ at: 2800, text: 'No.', ms: 2000 }], states: [{ at: 7200, state: 'sleep' }] },
  ],
);

// 4. Portrait sheet of every pet (PNG) for the landing page.
{
  const all = ['mochi', 'pip', 'ember', 'bolt', 'nimbus', 'pickles', 'clover', 'waffles', 'hoot', 'biscuit', 'zib', 'boo', 'shelly', 'inky', 'bao'];
  const names = ['Mochi', 'Pip', 'Ember', 'Bolt', 'Nimbus', 'Pickles', 'Clover', 'Waffles', 'Hoot', 'Biscuit', 'Zib', 'Boo', 'Shelly', 'Inky', 'Bao'];
  const cw = 170;
  const ch = 190;
  const canvas = createCanvas(cw * 5, ch * 3);
  const c = canvas.getContext('2d');
  all.forEach((sp, i) => {
    const s = new HdSprite(sp, 'classic', 'none');
    s.setState('wave');
    s.setGaze(0.2, 0.3);
    for (let k = 0; k < 30; k++) s.advance(1000 / 60, 1);
    const x = (i % 5) * cw + cw / 2;
    const y = Math.floor(i / 5) * ch + ch - 30;
    s.draw(c as unknown as Ctx, x, y, 4, 0);
    c.font = '600 18px Fredoka';
    c.textAlign = 'center';
    c.fillStyle = '#2a2240';
    c.fillText(names[i], x, y + 22);
  });
  writeFileSync('docs/pets.png', canvas.toBuffer('image/png'));
  console.log('docs/pets.png');
}

// 5. itch.io cover (630x500) and a wide banner, written to the launch kit folder.
{
  GlobalFonts.registerFromPath('node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2', 'FredokaBold');
  const out = process.env.KIT_DIR ?? 'docs';
  mkdirSync(out, { recursive: true });
  const poster = (w: number, h: number, file: string, pets: string[], pixel: number) => {
    const canvas = createCanvas(w, h);
    const c = canvas.getContext('2d');
    background(c, w, h, 0);
    c.textAlign = 'center';
    c.fillStyle = '#fff';
    c.font = `${Math.round(h * 0.15)}px FredokaBold`;
    c.fillText('PixelBuddy', w / 2, h * 0.2);
    c.font = `600 ${Math.round(h * 0.055)}px Fredoka`;
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.fillText('Desktop pets that talk, joke and do tricks', w / 2, h * 0.3);
    const step = w / (pets.length + 1);
    pets.forEach((sp, i) => {
      const s = new HdSprite(sp, 'classic', i === 2 ? 'crown' : 'none');
      s.setState(i % 2 ? 'happy' : 'wave');
      s.setGaze(0, 0.3);
      for (let k = 0; k < 24; k++) s.advance(1000 / 60, 1);
      s.draw(c as unknown as Ctx, step * (i + 1), h * 0.88, pixel, 0);
    });
    c.font = `600 ${Math.round(h * 0.045)}px Fredoka`;
    c.fillStyle = '#ffcf4a';
    c.fillText('FREE · Windows & macOS', w / 2, h * 0.97);
    writeFileSync(`${out}/${file}`, canvas.toBuffer('image/png'));
    console.log(`${out}/${file}`);
  };
  poster(630, 500, 'itch-cover.png', ['mochi', 'waffles', 'ember', 'boo', 'bao'], 3.2);
  poster(1200, 630, 'social-card.png', ['pickles', 'mochi', 'zib', 'ember', 'waffles', 'clover', 'bao'], 4);
}
