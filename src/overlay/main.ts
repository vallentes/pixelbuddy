// OBS browser-source overlay. Served by the app on 127.0.0.1; pets walk along the bottom of the
// source with a transparent background and react to Twitch or test events over SSE.

import { Brain, type Action } from '../engine/brain';
import { FrameLoop, stepWalk } from '../engine/motion';
import { REACTION_TEXT, createRenderer, evolve, type ArtStyle, type Renderer } from '../shared/renderer';
import type { Reaction } from '../shared/types';
import { SIZE } from '../sprites/raster';
import '../shared/fonts';
import type { Accessory, ColorVariant } from '../sprites/types';

interface OverlayPet {
  id: number;
  species: string;
  name: string;
  color: ColorVariant;
  accessory: Accessory;
}
interface OverlayState {
  allowed: boolean;
  scale: number;
  animationSpeed: number;
  walkSpeed: number;
  fps: number;
  artStyle: ArtStyle;
  pets: OverlayPet[];
}

const params = new URLSearchParams(location.search);
const base = params.get('api') ?? location.origin;
const scaleOverride = Number(params.get('scale')) || null;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const note = document.getElementById('note')!;

let state: OverlayState = { allowed: true, scale: 4, animationSpeed: 1, walkSpeed: 1, fps: 30, artStyle: 'hd', pets: [] };
interface Actor {
  pet: OverlayPet;
  sprite: Renderer;
  style: ArtStyle;
  brain: Brain;
  x: number;
}
let actors: Actor[] = [];

function scale() {
  return scaleOverride ?? state.scale;
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function bounds() {
  const half = (SIZE * scale()) / 2;
  return { minX: half, maxX: Math.max(half, canvas.width - half) };
}

async function loadState() {
  try {
    const res = await fetch(`${base}/api/state`, { cache: 'no-store' });
    state = await res.json();
  } catch {
    return;
  }
  note.style.display = state.allowed ? 'none' : 'block';
  note.textContent = '';
  const prev = new Map(actors.map((a) => [a.pet.id, a]));
  const b = bounds();
  actors = state.pets.map((p) => {
    const a = prev.get(p.id);
    if (a && a.style === state.artStyle) {
      a.sprite.setLook(p.species, p.color, p.accessory);
      a.pet = p;
      a.brain.speed = 60 * state.walkSpeed;
      return a;
    }
    return {
      pet: p,
      sprite: createRenderer(state.artStyle, p.species, p.color, p.accessory),
      style: state.artStyle,
      brain: new Brain(60 * state.walkSpeed),
      x: a?.x ?? b.minX + Math.random() * (b.maxX - b.minX),
    };
  });
}

function tick(dt: number) {
  const now = Date.now();
  const b = bounds();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const px = Math.max(1, Math.round(scale()));
  for (const a of actors) {
    const vx = a.brain.update({
      now,
      x: a.x,
      minX: b.minX,
      maxX: b.maxX,
      walking: true,
      systemIdle: false,
      needs: { hunger: 30, happiness: 70, energy: 80 },
      cursorX: null,
    });
    a.x = stepWalk(a.x, vx, dt, b.minX, b.maxX);
    a.sprite.setState(a.brain.state);
    a.sprite.facing = a.brain.facing;
    a.sprite.advance(dt * 1000, state.animationSpeed);
    a.sprite.draw(ctx, a.x, canvas.height, px);
  }
}

function onReaction(r: Reaction) {
  const now = Date.now();
  for (const a of actors) {
    if (r.petId !== null && r.petId !== a.pet.id) continue;
    a.brain.act(r.action as Action, now);
    if (r.action === 'evolve') evolve(a.sprite, () => [a.pet.species, a.pet.color, a.pet.accessory]);
    else if (r.action === 'confetti') a.sprite.boost('confetti');
    a.sprite.say(r.label ?? REACTION_TEXT[r.action] ?? '!', r.label ? 4000 : 1500);
  }
}

function connect() {
  const es = new EventSource(`${base}/api/events`);
  es.addEventListener('reaction', (e) => {
    const ev = JSON.parse((e as MessageEvent).data);
    onReaction(ev as Reaction);
  });
  es.addEventListener('state', () => void loadState());
  es.onerror = () => {
    es.close();
    setTimeout(() => {
      void loadState();
      connect();
    }, 3000);
  };
}

window.addEventListener('resize', resize);
resize();
void loadState().then(() => {
  new FrameLoop(() => (state.artStyle === 'hd' ? Math.max(30, state.fps) : state.fps), tick).start();
  connect();
});
