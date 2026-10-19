// Buddy codes: share a pet as a short text code (no accounts, no servers). A code holds the
// species, color, accessory, name and who sent it, plus a checksum to catch typos.

import type { Accessory, ColorVariant } from '../sprites/types';

// Order matters: these indexes are what codes store. Only ever append.
const SPECIES = ['mochi', 'pip', 'ember', 'bolt', 'nimbus', 'pickles', 'clover', 'waffles', 'hoot', 'biscuit', 'zib', 'boo', 'shelly', 'inky', 'bao'];
const COLORS: ColorVariant[] = ['classic', 'rose', 'mint', 'sky', 'golden', 'shadow'];
const ACCESSORIES: Accessory[] = ['none', 'bow', 'tophat', 'crown', 'scarf', 'glasses', 'flower'];
const PREFIX = 'PB1-';

export interface Buddy {
  species: string;
  color: ColorVariant;
  accessory: Accessory;
  name: string;
  /** Who shared it (their name in Personality settings), if set. */
  from: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

function checksum(bytes: Uint8Array) {
  let h = 7;
  for (const b of bytes) h = (h * 31 + b) & 0xff;
  return h;
}

function toBase64Url(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

function text(s: string, max: number) {
  const bytes = enc.encode(s.trim().slice(0, 16));
  return bytes.slice(0, max);
}

export function encodeBuddy(b: Buddy): string {
  const species = SPECIES.indexOf(b.species);
  const color = COLORS.indexOf(b.color);
  const accessory = ACCESSORIES.indexOf(b.accessory);
  if (species < 0 || color < 0 || accessory < 0) throw new Error('This pet cannot be shared.');
  const name = text(b.name, 48);
  const from = text(b.from, 48);
  const body = new Uint8Array([species, (color << 4) | accessory, name.length, ...name, from.length, ...from]);
  return PREFIX + toBase64Url(new Uint8Array([...body, checksum(body)]));
}

/** Reads a code (spaces and surrounding text are ignored). Throws a friendly error. */
export function decodeBuddy(code: string): Buddy {
  const m = code.replace(/\s+/g, '').match(/PB1-([A-Za-z0-9_-]+)/i);
  if (!m) throw new Error('That does not look like a buddy code. They start with PB1-.');
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(m[1]);
  } catch {
    throw new Error('That buddy code is broken. Copy it again?');
  }
  const body = bytes.slice(0, -1);
  if (bytes.length < 5 || checksum(body) !== bytes[bytes.length - 1]) throw new Error('That buddy code has a typo. Copy it again?');
  const species = SPECIES[body[0]];
  const color = COLORS[body[1] >> 4];
  const accessory = ACCESSORIES[body[1] & 0x0f];
  const nameLen = body[2];
  const fromLen = body[3 + nameLen];
  if (!species || !color || !accessory || fromLen === undefined || 4 + nameLen + fromLen !== body.length) {
    throw new Error('This buddy code is from a newer PixelBuddy. Update first!');
  }
  try {
    const name = dec.decode(body.slice(3, 3 + nameLen)).trim();
    const from = dec.decode(body.slice(4 + nameLen)).trim();
    return { species, color, accessory, name: name || species, from };
  } catch {
    throw new Error('That buddy code is broken. Copy it again?');
  }
}

const VISITOR_KEY = (petId: number) => `pb-visitor-${petId}`;

/** Remembers that a pet just arrived from someone else, so it can say hello. */
export function markVisitor(petId: number, from: string) {
  try {
    localStorage.setItem(VISITOR_KEY(petId), from || 'a friend');
  } catch {
    // storage unavailable; the pet just greets normally
  }
}

/** Who sent this pet, once (cleared after reading). */
export function takeVisitor(petId: number): string | null {
  try {
    const v = localStorage.getItem(VISITOR_KEY(petId));
    if (v !== null) localStorage.removeItem(VISITOR_KEY(petId));
    return v;
  } catch {
    return null;
  }
}
