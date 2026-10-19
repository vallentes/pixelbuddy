// Dev-only art gallery: every species in the HD style, switchable state. Not part of the build.
import { FrameLoop } from '../engine/motion';
import '../shared/fonts';
import { pickLine } from '../engine/chatter';
import { HdSprite } from '../hd/HdSprite';
import { STATES } from '../sprites/frames';
import type { Accessory, PetState } from '../sprites/types';

const only = new URLSearchParams(location.search).get('sp');
const species = only ? only.split(',') : ['mochi', 'pip', 'ember', 'bolt', 'nimbus'];
const params = new URLSearchParams(location.search);
let state = (params.get('state') as PetState) ?? 'idle';
const accessory = (params.get('acc') as Accessory) ?? 'none';
const bar = document.getElementById('bar')!;
for (const s of STATES) {
  const b = document.createElement('button');
  b.textContent = s;
  b.onclick = () => {
    state = s;
  };
  bar.appendChild(b);
}
const voiceBtn = document.createElement('button');
voiceBtn.textContent = 'natural voice test';
voiceBtn.onclick = async () => {
  const { loadVoices, speak } = await import('../settings/voiceService');
  const t0 = performance.now();
  voiceBtn.textContent = 'loading...';
  try {
    await loadVoices();
    (window as unknown as { voiceLoadMs: number }).voiceLoadMs = performance.now() - t0;
    voiceBtn.textContent = 'speaking';
    speak('Hi! I am Mochi. Did somebody say fish?', 'mochi');
    speak('Beep boop. Hello human.', 'bolt');
  } catch (e) {
    voiceBtn.textContent = `error: ${e}`;
  }
};
bar.appendChild(voiceBtn);
const talk = document.createElement('button');
talk.textContent = 'talk';
bar.appendChild(talk);

const grid = document.getElementById('grid')!;
const sprites = species.map((sp) => {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const c = document.createElement('canvas');
  c.width = 520;
  c.height = 520;
  if (only) c.style.cssText = 'width:480px;height:480px';
  cell.appendChild(c);
  const label = document.createElement('div');
  label.textContent = sp;
  cell.appendChild(label);
  grid.appendChild(cell);
  const s = new HdSprite(sp, 'classic', accessory);
  s.setGaze(0.6, 0.2);
  return { c, s, sp };
});
talk.onclick = () => sprites.forEach((x) => x.s.say(pickLine('random', x.sp, x.sp, 'Valentin'), 6000));

new FrameLoop(
  () => 60,
  (dt) => {
    for (const { c, s } of sprites) {
      const ctx = c.getContext('2d')!;
      s.setState(state);
      s.advance(dt * 1000, 1);
      ctx.clearRect(0, 0, c.width, c.height);
      s.draw(ctx, c.width / 2, c.height - 10, 10);
    }
  },
).start();
