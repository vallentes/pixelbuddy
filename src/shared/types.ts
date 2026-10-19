import type { Accessory, ColorVariant } from '../sprites/types';

export interface Settings {
  onboarded: boolean;
  theme: 'system' | 'light' | 'dark';
  scale: number;
  opacity: number;
  animationSpeed: number;
  walkSpeed: number;
  fps: number;
  performanceMode: boolean;
  pauseWhenFullscreen: boolean;
  sleepWhenIdle: boolean;
  idleMinutes: number;
  notifications: boolean;
  walking: boolean;
  gravity: boolean;
  mouseInteraction: boolean;
  clickThrough: boolean;
  launchAtStartup: boolean;
  petsHidden: boolean;
  animationsPaused: boolean;
  overlayEnabled: boolean;
  overlayPort: number;
  overlayScale: number;
  twitchClientId: string;
  twitchFollowAction: string;
  twitchSubAction: string;
  twitchGiftAction: string;
  twitchCheerAction: string;
  twitchRaidAction: string;
  artStyle: 'pixel' | 'hd';
  chattiness: 'off' | 'rare' | 'normal' | 'chatty';
  voiceMode: 'off' | 'babble' | 'speech' | 'natural';
  voiceVolume: number;
  soundEffects: boolean;
  userName: string;
}

export interface Pet {
  id: number;
  species: string;
  name: string;
  color: ColorVariant;
  accessory: Accessory;
  visible: boolean;
  monitor: string | null;
  posX: number | null;
  posY: number | null;
  hunger: number;
  happiness: number;
  energy: number;
  createdAt: number;
  lastFedAt: number | null;
  lastPlayedAt: number | null;
}

export interface SystemState {
  idle: boolean;
  fullscreen: boolean;
}

export interface MonitorInfo {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  workX: number;
  workY: number;
  workWidth: number;
  workHeight: number;
  scaleFactor: number;
  primary: boolean;
}

export interface OverlayStatus {
  enabled: boolean;
  running: boolean;
  url: string;
  error: string | null;
}

export interface TwitchStatus {
  clientIdConfigured: boolean;
  account: { userId: string; login: string; displayName: string } | null;
  pending: { userCode: string; verificationUri: string; expiresAt: number } | null;
  eventsub: 'off' | 'connecting' | 'connected' | 'error' | '';
  subscriptions: { kind: string; label: string; ok: boolean; message: string | null }[];
  error: string | null;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  action: string | null;
  petId: number | null;
}

export interface Bootstrap {
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  settings: Settings;
  pets: Pet[];
  system: SystemState;
  overlay: OverlayStatus;
  twitch: TwitchStatus;
  maxPets: number;
}

export interface Reaction {
  action: string;
  petId: number | null;
  source: string;
  label: string | null;
}

export interface PetBootstrap {
  pet: Pet;
  settings: Settings;
  system: SystemState;
  monitors: MonitorInfo[];
}

export const ACTIONS: { id: string; label: string }[] = [
  { id: 'none', label: 'Do nothing' },
  { id: 'happy', label: 'Hop happily' },
  { id: 'dance', label: 'Dance' },
  { id: 'feed', label: 'Eat a snack' },
  { id: 'play', label: 'Play' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'angry', label: 'Grumble' },
  { id: 'sleep', label: 'Take a nap' },
  { id: 'wave', label: 'Wave hello' },
  { id: 'joke', label: 'Tell a joke' },
  { id: 'sing', label: 'Sing a song' },
  { id: 'trick', label: 'Do a trick' },
  { id: 'tickle', label: 'Giggle' },
  { id: 'sneeze', label: 'Sneeze' },
  { id: 'scared', label: 'Get spooked' },
  { id: 'backflip', label: 'Backflip' },
  { id: 'moonwalk', label: 'Moonwalk' },
  { id: 'juggle', label: 'Juggle' },
  { id: 'magic', label: 'Magic vanish' },
  { id: 'karate', label: 'Karate chop' },
  { id: 'flex', label: 'Flex muscles' },
  { id: 'shades', label: 'Deal with it (sunglasses)' },
  { id: 'meditate', label: 'Meditate' },
  { id: 'airguitar', label: 'Air guitar' },
  { id: 'cartwheel', label: 'Cartwheel' },
  { id: 'selfie', label: 'Selfie' },
  { id: 'yoyo', label: 'Yo-yo' },
];

