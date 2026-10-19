// Pet window: one transparent, always-on-top window per pet. Renders the character, walks along
// the bottom of its monitor, talks, handles drag/drop with gravity, clicks, tickles, the context
// menu and click-through on transparent pixels.

import { LogicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';
import { listen } from '@tauri-apps/api/event';
import { Menu, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Brain, type Action } from '../engine/brain';
import { bubbleMs, idleTopic, nextChatDelayMs, pickJoke, pickLine, type Chattiness, type Topic } from '../engine/chatter';
import { FrameLoop, pickMonitor, stepFall, stepWalk } from '../engine/motion';
import { api } from '../shared/api';
import { createRenderer, type ArtStyle, type BodyPart, type Renderer } from '../shared/renderer';
import type { MonitorInfo, Pet, Reaction, Settings, SystemState } from '../shared/types';
import { Voice, type Sfx } from '../shared/voice';
import { SIZE } from '../sprites/raster';
import type { PetState } from '../sprites/types';
import { Social } from './social';
import { fontsReady } from '../shared/fonts';
import { plain, typeMs } from '../shared/bubble';

const id = Number(new URLSearchParams(location.search).get('id'));
const win = getCurrentWindow();
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

let pet: Pet;
let settings: Settings;
let system: SystemState;
let monitors: MonitorInfo[] = [];
let mon: MonitorInfo;
let sprite: Renderer;
let brain: Brain;
let voice: Voice;

// Window top-left and size, in physical pixels.
let x = 0;
let y = 0;
let winW = 0;
let winH = 0;
let shownX = NaN;
let shownY = NaN;

type Mode = 'ground' | 'perched' | 'falling' | 'dragging';
let mode: Mode = 'ground';
const fall = { y: 0, vy: 0, vx: 0, from: 0 };
let dragTrail: { t: number; x: number; y: number }[] = [];
let lastLocal = { action: '', at: 0 };
let social: Social;
let ignoring = false;
let hovered = false;
let hoverSince = 0;
let cursorX: number | null = null;
let lastCursor: [number, number] | null = null;
let tickle = { dist: 0, since: 0 };
let cursorAwaySince = Date.now();
let hidden = false;
let lastSave = { x: NaN, y: NaN, at: 0 };
let nextChatAt = Date.now() + 20_000;
let prevState: PetState = 'idle';
let lastTalkAt = 0;

const loop = new FrameLoop(fps, tick);

function fps() {
  if (brain?.state === 'sleep' && system?.idle) return 4;
  const f = settings.performanceMode ? Math.min(12, settings.fps) : settings.fps;
  // HD characters are smooth vector art; give them more frames unless the user capped it.
  return Math.max(1, settings.artStyle === 'hd' && !settings.performanceMode ? Math.max(f, 60) : f);
}

function logicalSize(scale: number): [number, number] {
  const s = SIZE * scale;
  return [Math.max(s + 120, 300), s + 96];
}

function sf() {
  return mon?.scaleFactor ?? window.devicePixelRatio ?? 1;
}

function bounds() {
  const spritePx = SIZE * settings.scale * sf();
  const slack = (winW - spritePx) / 2;
  return {
    minX: mon.workX - slack,
    maxX: mon.workX + mon.workWidth - winW + slack,
    floorY: mon.workY + mon.workHeight - winH,
  };
}

function walkSpeed() {
  return 38 * settings.walkSpeed * sf() * Math.max(1, settings.scale / 3);
}

async function applySize() {
  const [w, h] = logicalSize(settings.scale);
  await win.setSize(new LogicalSize(w, h));
  const size = await win.outerSize();
  winW = size.width;
  winH = size.height;
  resizeCanvas();
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.opacity = String(settings.opacity);
}

function chooseMonitor() {
  if (!monitors.length) return;
  const byName = pet.monitor ? monitors.find((m) => m.name === pet.monitor) : undefined;
  if (byName) {
    mon = byName;
    return;
  }
  if (pet.posX !== null && pet.posY !== null) {
    mon = monitors[pickMonitor(monitors.map((m) => ({ x: m.x, y: m.y, width: m.width, height: m.height })), pet.posX, pet.posY)];
    return;
  }
  mon = monitors.find((m) => m.primary) ?? monitors[0];
}

async function moveWindow() {
  const rx = Math.round(x);
  const ry = Math.round(y);
  if (rx === shownX && ry === shownY) return;
  shownX = rx;
  shownY = ry;
  await win.setPosition(new PhysicalPosition(rx, ry));
}

function savePosition(force = false) {
  const now = Date.now();
  if (!force && (now - lastSave.at < 15_000 || (Math.abs(x - lastSave.x) < 2 && Math.abs(y - lastSave.y) < 2))) return;
  lastSave = { x, y, at: now };
  api.savePetPosition(id, x, y, mon?.name ?? null).catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// Talking
// ---------------------------------------------------------------------------------------------

let talkToken = 0;

/**
 * Says a line. With a voice, the bubble waits for the audio to start (showing "..." while a
 * natural voice is being generated) and then types at exactly the speed of the speech.
 */
/** Returns how long the line takes to say/type (ms), or -1 if a newer line replaced it. */
async function talk(text: string, opts: { voice?: boolean } = {}): Promise<number> {
  lastTalkAt = Date.now();
  const letters = Math.max(1, plain(text).length);
  if (opts.voice === false || settings.voiceMode === 'off' || settings.voiceVolume <= 0) {
    if (opts.voice !== false) talkToken++;
    sprite.say(text, bubbleMs(text));
    return typeMs(text);
  }
  const token = ++talkToken;
  if (settings.voiceMode === 'natural') sprite.say('...', 7000, undefined, 160);
  const ms = await voice.say(text);
  if (token !== talkToken) return -1; // a newer line took over
  if (ms) {
    sprite.say(text, ms + 1800, undefined, Math.max(14, (ms * 0.95) / letters));
    return ms;
  }
  sprite.say(text, bubbleMs(text));
  return typeMs(text);
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Setup, a beat, punchline, ba-dum-tss, laugh. */
async function tellJoke() {
  const [setup, punch] = pickJoke(pet.species);
  const d1 = await talk(setup);
  if (d1 < 0) return;
  const token = talkToken;
  await wait(d1 + 1100);
  if (token !== talkToken) return;
  const d2 = await talk(punch);
  if (d2 < 0) return;
  await wait(d2 + 150);
  voice.sfx('rimshot');
  brain.act('tickle', Date.now());
}

function chat(topic: Topic, chance = 1) {
  if (topic === 'joke') {
    if (Math.random() <= chance) void tellJoke();
    return;
  }
  if (settings.chattiness === 'off' || Math.random() > chance) return;
  void talk(pickLine(topic, pet.species, pet.name, settings.userName));
}

const STATE_TOPIC: Partial<Record<PetState, [Topic, number]>> = {
  yawn: ['yawn', 0.6],
  sneeze: ['sneeze', 0.9],
  spin: ['trick', 0.5],
  sit: ['sit', 0.35],
  scared: ['scared', 0.9],
  sing: ['sing', 0.8],
  backflip: ['backflip', 0.9],
  moonwalk: ['moonwalk', 0.8],
  juggle: ['juggle', 0.8],
  magic: ['magic', 0.9],
  karate: ['karate', 0.9],
  flex: ['flex', 0.9],
  peekaboo: ['peekaboo', 0.6],
  shades: ['shades', 0.9],
  trip: ['trip', 0.9],
  hiccup: ['hiccup', 0.9],
  meditate: ['meditate', 0.8],
  toot: ['toot', 1],
  stretch: ['stretch', 0.6],
};

const STATE_SFX: Partial<Record<PetState, Sfx>> = {
  eat: 'chomp',
  happy: 'boing',
  land: 'thud',
  angry: 'grumble',
  sneeze: 'achoo',
  spin: 'whoosh',
  laugh: 'sparkle',
  wave: 'pop',
  backflip: 'whoosh',
  moonwalk: 'sparkle',
  juggle: 'pop',
  magic: 'sparkle',
  karate: 'whoosh',
  flex: 'sparkle',
  peekaboo: 'pop',
  shades: 'whoosh',
  trip: 'thud',
  hiccup: 'hic',
  toot: 'toot',
  stretch: 'pop',
};

function onStateChange(s: PetState) {
  const fx = s === 'sleep' && system.idle ? null : STATE_SFX[s];
  if (fx) voice.sfx(fx);
  if (pet.species === 'bolt' && (s === 'happy' || s === 'wave')) voice.sfx('beep');
  const t = STATE_TOPIC[s];
  if (t && !social?.busy && Date.now() - lastTalkAt > 3000) chat(t[0], t[1]);
  if (s === 'magic') window.setTimeout(() => brain.state === 'magic' && chat('magicDone'), 2150);
  if (s === 'hiccup') [900, 1800, 2700].forEach((d) => window.setTimeout(() => brain.state === 'hiccup' && voice.sfx('hic'), d));
  if (s === 'karate') window.setTimeout(() => voice.sfx('pop'), 550);
}

/** Plays an action locally and records it so the echo from the core is not played twice. */
function doLocal(a: Action, topic?: Topic) {
  brain.act(a, Date.now());
  if (topic) chat(topic);
  lastLocal = { action: a, at: Date.now() };
  api.petAction(id, a).catch(() => {});
}

function maybeChat(now: number) {
  if (now < nextChatAt) return;
  nextChatAt = now + nextChatDelayMs(settings.chattiness as Chattiness);
  if (social?.busy) return;
  if (system.idle || hidden || mode !== 'ground' || !['idle', 'walk', 'sit'].includes(brain.state)) return;
  chat(idleTopic(pet, new Date()));
}

// ---------------------------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------------------------

function tick(dt: number) {
  const now = Date.now();
  if (mode === 'falling') {
    const b = bounds();
    const landed = stepFall(fall, b.floorY, dt, 2600 * sf());
    y = fall.y;
    if (fall.vx) {
      x += fall.vx * dt;
      fall.vx *= Math.pow(0.6, dt);
      if (x < b.minX || x > b.maxX) {
        x = Math.min(b.maxX, Math.max(b.minX, x));
        fall.vx = -fall.vx * 0.55;
        voice.sfx('thud');
        brain.facing = fall.vx > 0 ? 1 : -1;
      }
    }
    if (y < mon.workY - winH * 0.4) {
      y = mon.workY - winH * 0.4;
      fall.y = y;
      fall.vy = Math.abs(fall.vy) * 0.3;
    }
    if (landed) {
      mode = 'ground';
      fall.vx = 0;
      brain.landed(now);
      const drop = (b.floorY - fall.from) / sf();
      chat('drop', drop > 250 ? 1 : 0.5);
      savePosition(true);
    }
  } else if (mode !== 'dragging') {
    const b = bounds();
    const vx = brain.update({
      now,
      x,
      minX: b.minX,
      maxX: b.maxX,
      walking: settings.walking && mode === 'ground',
      systemIdle: system.idle,
      needs: pet,
      cursorX: settings.mouseInteraction ? cursorX : null,
    });
    if (vx) x = stepWalk(x, vx, dt, b.minX, b.maxX);
    if (mode === 'ground' && settings.gravity) y = b.floorY;
    social?.tick(now, x, brain.state === 'walk');
    savePosition();
    maybeChat(now);
  }
  void moveWindow();

  if (brain.state !== prevState) {
    prevState = brain.state;
    onStateChange(brain.state);
  }
  sprite.setState(brain.state);
  sprite.facing = brain.facing;
  sprite.advance(dt * 1000, settings.animationSpeed);
  draw();
}

function pixelSize() {
  return Math.max(1, Math.round(settings.scale * (window.devicePixelRatio || 1)));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  sprite.draw(ctx, canvas.width / 2, canvas.height, pixelSize());
}

function canvasPoint(sx: number, sy: number): [number, number] | null {
  const lx = sx - x;
  const ly = sy - y;
  if (lx < 0 || ly < 0 || lx >= winW || ly >= winH) return null;
  return [(lx * canvas.width) / winW, (ly * canvas.height) / winH];
}

async function setIgnore(v: boolean) {
  if (v === ignoring) return;
  ignoring = v;
  await win.setIgnoreCursorEvents(v).catch(() => {});
}

async function pollCursor() {
  if (hidden || mode === 'dragging') return;
  let pos: [number, number];
  try {
    pos = await api.cursorPosition();
  } catch {
    return;
  }
  const [cx, cy] = pos;
  const now = Date.now();
  const centerX = x + winW / 2;
  const centerY = y + winH - (SIZE * settings.scale * sf()) * 0.75;
  const onMonitor = cx >= mon.x && cx < mon.x + mon.width && cy >= mon.y && cy < mon.y + mon.height;
  const near = onMonitor && Math.abs(cx - centerX) < 320 * sf() && Math.abs(cy - centerY) < 400 * sf();
  cursorX = near ? cx - winW / 2 : null;

  // Eyes follow the cursor.
  if (settings.mouseInteraction && onMonitor) {
    const range = 260 * sf();
    sprite.setGaze((cx - centerX) / range, (cy - centerY) / range);
  } else {
    sprite.setGaze(0, 0);
  }

  // Say hi when the cursor comes back after a while.
  if (near) {
    if (now - cursorAwaySince > 90_000 && settings.mouseInteraction && ['idle', 'walk', 'sit'].includes(brain.state)) {
      brain.act('wave', now);
      chat('wave', 0.7);
    }
    cursorAwaySince = now;
  }

  const pt = canvasPoint(cx, cy);
  const hit = pt !== null && sprite.hitAt(pt[0], pt[1]);
  await setIgnore(settings.clickThrough ? !hit : false);

  // Tickle: wiggling the cursor over the pet.
  if (hit && lastCursor) {
    const moved = Math.abs(cx - lastCursor[0]) + Math.abs(cy - lastCursor[1]);
    if (now - tickle.since > 1500) tickle = { dist: 0, since: now };
    tickle.dist += moved;
    if (tickle.dist > 900 * sf() && brain.state !== 'laugh') {
      tickle = { dist: 0, since: now };
      brain.act('tickle', now);
      chat('tickle');
      lastLocal = { action: 'tickle', at: now };
      api.petAction(id, 'tickle').catch(() => {});
    }
  }
  lastCursor = [cx, cy];

  const t = performance.now();
  if (hit) {
    if (!hovered) {
      hovered = true;
      hoverSince = t;
    } else if (t - hoverSince > 700 && !sprite.bubble) {
      talk(pet.name, { voice: false });
      hoverSince = t + 6000;
    }
  } else {
    hovered = false;
  }
}

// ---------------------------------------------------------------------------------------------
// Mouse: click, drag, context menu
// ---------------------------------------------------------------------------------------------

let down: { sx: number; sy: number; part: BodyPart; t: number; consumed: boolean } | null = null;
let holdTimer = 0;
let dragTimer = 0;

function partUnderMouse(e: MouseEvent): BodyPart {
  const dpr = window.devicePixelRatio || 1;
  return sprite.partAt(e.offsetX * dpr, e.offsetY * dpr);
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const part = partUnderMouse(e);
  down = { sx: e.screenX, sy: e.screenY, part, t: Date.now(), consumed: false };
  window.clearTimeout(holdTimer);
  // Press and hold = hug.
  holdTimer = window.setTimeout(() => {
    if (!down || down.consumed || mode === 'dragging') return;
    down.consumed = true;
    social?.stop(true);
    doLocal('happy', 'hug');
    voice.sfx('sparkle');
  }, 650);
});

canvas.addEventListener('mousemove', (e) => {
  if (!down || down.consumed || !(e.buttons & 1) || mode === 'dragging') return;
  if (Math.hypot(e.screenX - down.sx, e.screenY - down.sy) > 4) {
    window.clearTimeout(holdTimer);
    if (down.part === 'tail') {
      // Tail pull: grumpy, then scoot away from the cursor.
      down.consumed = true;
      social?.stop(true);
      doLocal('angry', 'tail');
      voice.sfx('grumble');
      const away = e.screenX > down.sx ? -1 : 1;
      const b = bounds();
      window.setTimeout(() => {
        brain.lockUntil = Date.now() + 2600;
        brain.goTo(Math.min(b.maxX, Math.max(b.minX, x + away * 220 * sf())), Date.now(), 2.2);
      }, 900);
      return;
    }
    down = null;
    void beginDrag();
  }
});

canvas.addEventListener('mouseup', (e) => {
  window.clearTimeout(holdTimer);
  if (e.button !== 0 || !down) return;
  const d = down;
  down = null;
  if (d.consumed) return;
  social?.stop(true);
  const now = Date.now();
  switch (d.part) {
    case 'nose':
      doLocal('sneeze', 'boop');
      voice.sfx('pop');
      return;
    case 'belly':
      doLocal('tickle', 'belly');
      return;
    case 'foot':
      doLocal('happy', 'foot');
      voice.sfx('boing');
      return;
    case 'ear':
      doLocal('scared', 'ear');
      return;
    case 'tail':
      doLocal('angry', 'tail');
      voice.sfx('grumble');
      return;
  }
  const a = brain.click(now);
  lastLocal = { action: a, at: now };
  if (a === 'angry') {
    chat('angry');
    voice.sfx('grumble');
  } else if (a === 'wake') {
    chat('welcomeBack');
  } else {
    voice.sfx('pop');
    if (Math.random() < 0.5) chat('pat');
    else sprite.say('♥', 1000);
  }
  api.petAction(id, a).catch(() => {});
});

canvas.addEventListener('dblclick', () => {
  doLocal('trick', 'trick');
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  void showMenu();
});

async function beginDrag() {
  mode = 'dragging';
  social?.stop(true);
  brain.startDrag();
  sprite.setState('drag');
  chat('drag', 0.7);
  voice.sfx('whoosh');
  dragTrail = [];
  await setIgnore(false);
  await win.startDragging().catch(() => {});
  window.clearInterval(dragTimer);
  dragTimer = window.setInterval(async () => {
    const pos = await win.outerPosition().catch(() => null);
    if (pos) {
      x = pos.x;
      y = pos.y;
      shownX = x;
      shownY = y;
      dragTrail.push({ t: performance.now(), x, y });
      if (dragTrail.length > 12) dragTrail.shift();
    }
    const pressed = await api.mouseButtonDown().catch(() => false);
    if (!pressed) void endDrag();
  }, 30);
}

/** Release velocity from the last ~120 ms of dragging, in physical px per second. */
function releaseVelocity(): [number, number] {
  const now = performance.now();
  const recent = dragTrail.filter((p) => now - p.t < 160);
  if (recent.length < 2) return [0, 0];
  const a = recent[0];
  const b = recent[recent.length - 1];
  const dt = (b.t - a.t) / 1000;
  return dt > 0.02 ? [(b.x - a.x) / dt, (b.y - a.y) / dt] : [0, 0];
}

async function endDrag() {
  window.clearInterval(dragTimer);
  const [vx, vy] = releaseVelocity();
  monitors = await api.monitors().catch(() => monitors);
  const centerX = x + winW / 2;
  const centerY = y + winH / 2;
  const i = pickMonitor(monitors.map((m) => ({ x: m.x, y: m.y, width: m.width, height: m.height })), centerX, centerY);
  mon = monitors[i] ?? mon;
  const size = await win.outerSize().catch(() => null);
  if (size) {
    winW = size.width;
    winH = size.height;
  }
  const b = bounds();
  x = Math.min(b.maxX, Math.max(b.minX, x));
  const thrown = Math.hypot(vx, vy) > 700 * sf();
  if (settings.gravity || thrown) {
    y = Math.min(y, b.floorY);
    fall.y = y;
    fall.from = y;
    fall.vy = thrown ? Math.max(-2200 * sf(), Math.min(1500 * sf(), vy)) : 0;
    fall.vx = thrown ? Math.max(-2600 * sf(), Math.min(2600 * sf(), vx)) : 0;
    mode = 'falling';
    brain.startFall();
    if (thrown) {
      chat('throw');
      voice.sfx('whoosh');
    }
  } else {
    y = Math.min(Math.max(mon.workY, y), b.floorY);
    mode = 'perched';
    brain.landed(Date.now());
    savePosition(true);
  }
}

function act(a: Action, topic?: Topic) {
  return () => {
    social?.stop(true);
    lastLocal = { action: a, at: Date.now() };
    if (a === 'joke') void tellJoke();
    else {
      brain.act(a, Date.now());
      if (topic) chat(topic);
    }
    void api.petAction(id, a).catch(() => {});
  };
}

async function showMenu() {
  const sleeping = brain.state === 'sleep';
  const fun = await Submenu.new({
    text: 'Fun',
    items: [
      { id: 'joke', text: 'Tell me a joke', action: act('joke', 'joke') },
      { id: 'sing', text: 'Sing a song', action: act('sing', 'sing') },
      { id: 'trick', text: 'Surprise me!', action: act('trick') },
      { id: 'wave', text: 'Say hi', action: act('wave', 'wave') },
      { id: 'tickle', text: 'Tickle', action: act('tickle', 'tickle') },
      { id: 'boo', text: 'Boo!', action: act('scared', 'scared') },
      ...(social?.others.size ? [{ id: 'friend', text: 'Play with a friend', action: () => void social.invite() }] : []),
    ],
  });
  const trickMenu = await Submenu.new({
    text: 'Tricks',
    items: (
      [
        ['backflip', 'Backflip'],
        ['moonwalk', 'Moonwalk'],
        ['juggle', 'Juggle'],
        ['magic', 'Magic vanish'],
        ['karate', 'Karate chop'],
        ['flex', 'Flex'],
        ['shades', 'Deal with it'],
        ['peekaboo', 'Peekaboo'],
        ['meditate', 'Meditate'],
        ['stretch', 'Stretch'],
      ] as [Action, string][]
    ).map(([a, text]) => ({ id: a, text, action: act(a) })),
  });
  const menu = await Menu.new({
    items: [
      { id: 'feed', text: `Feed ${pet.name}`, action: act('feed', 'feed') },
      { id: 'play', text: 'Play', action: act('play', 'play') },
      { id: 'dance', text: 'Dance', action: act('dance', 'dance') },
      fun,
      trickMenu,
      { id: 'sleep', text: sleeping ? 'Wake up' : 'Take a nap', action: act(sleeping ? 'wake' : 'sleep', sleeping ? 'welcomeBack' : 'tired') },
      await PredefinedMenuItem.new({ item: 'Separator' }),
      { id: 'hide', text: `Hide ${pet.name}`, action: () => void api.updatePet(id, { visible: false }) },
      { id: 'settings', text: 'Settings...', action: () => void api.showSettings('pets') },
    ],
  });
  await menu.popup();
}

// ---------------------------------------------------------------------------------------------
// Events from the core
// ---------------------------------------------------------------------------------------------

function applyVisibility() {
  const shouldHide = system.fullscreen;
  if (shouldHide !== hidden) {
    hidden = shouldHide;
    if (hidden) {
      loop.stop();
      void win.hide();
    } else {
      void win.show();
    }
  }
  if (!hidden) {
    if (settings.animationsPaused) loop.stop();
    else loop.start();
  }
}

function makeRenderer() {
  const r = createRenderer(settings.artStyle as ArtStyle, pet.species, pet.color, pet.accessory);
  r.effects = !settings.performanceMode;
  if (sprite) {
    r.facing = sprite.facing;
    r.setState(sprite.state);
  }
  sprite = r;
}

const REACTION_TOPIC: Record<string, Topic> = {
  feed: 'feed',
  play: 'play',
  dance: 'dance',
  celebrate: 'play',
  joke: 'joke',
  sing: 'sing',
  trick: 'trick',
  wave: 'wave',
  tickle: 'tickle',
  scared: 'scared',
  sneeze: 'sneeze',
  yawn: 'yawn',
  sleep: 'tired',
};

async function listenAll() {
  await listen<Reaction>('pet://reaction', (e) => {
    const r = e.payload;
    if (r.petId !== null && r.petId !== id) return;
    const own = r.source === 'user' && r.petId === id;
    if (own && r.action === lastLocal.action && Date.now() - lastLocal.at < 2500) return;
    if (r.action !== 'joke') brain.act(r.action as Action, Date.now());
    if (r.label) {
      talk(r.label);
    } else if (!own && REACTION_TOPIC[r.action]) {
      // Actions from the tray, settings or Twitch: say something fitting.
      chat(REACTION_TOPIC[r.action]);
    }
  });
  await listen<Pet>('pet://updated', (e) => {
    if (e.payload.id !== id) return;
    const p = e.payload;
    sprite.setLook(p.species, p.color, p.accessory);
    voice.setSpecies(p.species);
    if (p.monitor && p.monitor !== pet.monitor && p.posX === null) {
      pet = p;
      chooseMonitor();
      const b = bounds();
      x = (b.minX + b.maxX) / 2;
      y = settings.gravity ? b.floorY : y;
      mode = 'ground';
    }
    pet = p;
  });
  await listen<Settings>('settings://changed', async (e) => {
    const prev = settings;
    settings = e.payload;
    brain.speed = walkSpeed();
    if (prev.artStyle !== settings.artStyle || prev.performanceMode !== settings.performanceMode) makeRenderer();
    if (prev.scale !== settings.scale) await applySize();
    if (prev.chattiness !== settings.chattiness) nextChatAt = Date.now() + nextChatDelayMs(settings.chattiness as Chattiness);
    canvas.style.opacity = String(settings.opacity);
    if (!settings.clickThrough) await setIgnore(false);
    if (settings.gravity && mode === 'perched') {
      fall.y = y;
      fall.from = y;
      fall.vy = 0;
      mode = 'falling';
      brain.startFall();
    }
    applyVisibility();
    draw();
  });
  await listen<SystemState>('system://state', (e) => {
    const wasIdle = system.idle;
    system = e.payload;
    if (wasIdle && !system.idle) window.setTimeout(() => chat('welcomeBack', 0.8), 1500);
    applyVisibility();
  });
  window.addEventListener('resize', resizeCanvas);
}

async function boot() {
  const b = await api.petBootstrap(id);
  pet = b.pet;
  settings = b.settings;
  system = b.system;
  monitors = b.monitors;
  chooseMonitor();
  makeRenderer();
  voice = new Voice(pet.species, () => ({
    mode: settings.voiceMode,
    volume: settings.voiceVolume,
    sfx: settings.soundEffects,
  }));
  brain = new Brain(walkSpeed());
  social = new Social({
    id,
    brain,
    self: () => ({
      id,
      name: pet.name,
      species: pet.species,
      x,
      y,
      monitor: mon?.name ?? '',
      state: brain.state,
      busy: social.busy || mode !== 'ground' || hidden,
      at: Date.now(),
    }),
    sf,
    bounds,
    say: (t) => talk(t),
    chatTopic: (t) => chat(t),
    act: (a) => brain.act(a, Date.now()),
    chattiness: () => settings.chattiness,
    canSocialize: () => !hidden && !system.idle && mode === 'ground' && !settings.animationsPaused,
    sfx: (k) => voice.sfx(k),
  });
  await applySize();

  const bd = bounds();
  if (pet.posX !== null && pet.posX >= bd.minX && pet.posX <= bd.maxX) {
    x = pet.posX;
  } else {
    x = bd.minX + Math.random() * Math.max(1, bd.maxX - bd.minX);
  }
  if (!settings.gravity && pet.posY !== null && pet.posY >= mon.workY && pet.posY <= bd.floorY) {
    y = pet.posY;
    mode = 'perched';
  } else {
    y = bd.floorY;
  }
  await moveWindow();
  await listenAll();
  await social.start();
  draw();
  await setIgnore(settings.clickThrough);
  hidden = true;
  applyVisibility();
  window.setTimeout(() => {
    brain.act('wave', Date.now());
    const hour = new Date().getHours();
    chat(hour >= 6 && hour < 10 ? 'morning' : 'greet');
  }, 1200 + Math.random() * 1500);
  nextChatAt = Date.now() + 30_000 + nextChatDelayMs(settings.chattiness as Chattiness) / 2;
  window.setInterval(() => void pollCursor(), settings.performanceMode ? 200 : 80);
  window.setInterval(async () => {
    monitors = await api.monitors().catch(() => monitors);
    if (!monitors.some((m) => m.name === mon.name)) {
      mon = monitors.find((m) => m.primary) ?? monitors[0];
      const b2 = bounds();
      x = Math.min(b2.maxX, Math.max(b2.minX, x));
      y = b2.floorY;
    } else {
      mon = monitors.find((m) => m.name === mon.name)!;
    }
  }, 15_000);
}

fontsReady.then(boot).catch((e) => console.error('pet window failed to start', e));
