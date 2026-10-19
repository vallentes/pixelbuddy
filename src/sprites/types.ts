export type ColorKey =
  | 'outline'
  | 'body'
  | 'shade'
  | 'light'
  | 'belly'
  | 'accent'
  | 'accentShade'
  | 'cheek'
  | 'eye'
  | 'extra'
  | 'shine';

export type Palette = Record<ColorKey, string>;

export type PartTag = 'tail' | 'wing' | 'antenna' | 'leaf' | 'ear';

interface ShapeBase {
  c: ColorKey;
  tag?: PartTag;
  /** [shadow key, highlight key] applied inside the shape. */
  shade?: [ColorKey, ColorKey?];
}

export type Shape =
  | (ShapeBase & { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number })
  | (ShapeBase & { k: 'rect'; x: number; y: number; w: number; h: number; r?: number })
  | (ShapeBase & { k: 'tri'; pts: [[number, number], [number, number], [number, number]] })
  | (ShapeBase & { k: 'px'; pts: [number, number][] });

export type FoodKind = 'fish' | 'berry' | 'pepper' | 'battery' | 'clover';

export interface Species {
  id: string;
  name: string;
  blurb: string;
  palette: Palette;
  shapes: Shape[];
  /** Top-left of each 2x2 eye. */
  eyes: { l: [number, number]; r: [number, number] };
  /** Top-left of the 2-wide mouth. */
  mouth: [number, number];
  mouthColor?: ColorKey;
  cheeks?: [[number, number], [number, number]];
  feet: { l: [number, number]; r: [number, number]; w: number; h: number; c: ColorKey };
  /** Top-centre of the head (hats) and neck centre (scarf). */
  head: [number, number];
  neck: [number, number];
  food: FoodKind;
  floaty?: boolean;
  /** Where a raised paw sits (right side of the body). */
  paw?: [number, number];
}

export type PetState =
  | 'idle'
  | 'walk'
  | 'sleep'
  | 'eat'
  | 'dance'
  | 'happy'
  | 'angry'
  | 'fall'
  | 'land'
  | 'drag'
  | 'wave'
  | 'yawn'
  | 'laugh'
  | 'spin'
  | 'sneeze'
  | 'scared'
  | 'sit'
  | 'sing'
  | 'backflip'
  | 'moonwalk'
  | 'juggle'
  | 'magic'
  | 'karate'
  | 'flex'
  | 'peekaboo'
  | 'shades'
  | 'trip'
  | 'hiccup'
  | 'meditate'
  | 'toot'
  | 'stretch';

export type EyeStyle = 'open' | 'closed' | 'happy' | 'angry' | 'dizzy' | 'none';
export type MouthStyle = 'none' | 'small' | 'smile' | 'open' | 'o' | 'frown';
export type ParticleKind = 'z' | 'heart' | 'note' | 'sparkle' | 'steam' | 'anger' | 'bang' | 'crumb' | 'sweat' | 'confetti' | 'puff' | 'star';

export interface Particle {
  p: ParticleKind;
  x: number;
  y: number;
}

export interface FrameSpec {
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
  shear?: number;
  eyes: EyeStyle;
  mouth: MouthStyle;
  look?: number;
  cheeks?: boolean;
  feet?: { l?: [number, number]; r?: [number, number] };
  /** Offset applied to tagged parts (tail wag, wing flap...). */
  wiggle?: number;
  particles?: Particle[];
  /** Bites taken from the food, 0..3; undefined = no food. */
  food?: number;
  tint?: 'angry';
  /** Raised paw offset from the species paw anchor (waving). */
  paw?: [number, number];
}

export interface StateAnim {
  frames: FrameSpec[];
  frameMs: number;
  loop: boolean;
}

export type Accessory = 'none' | 'bow' | 'tophat' | 'crown' | 'scarf' | 'glasses' | 'flower';
export type ColorVariant = 'classic' | 'rose' | 'mint' | 'sky' | 'golden' | 'shadow';
