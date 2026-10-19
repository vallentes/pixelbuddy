// What pets say. Every line is original. Each species has a personality; shared lines fill gaps.
// Templates: {name} = pet name, {user} = your name (or "friend").
// Lines only use characters the pixel font can draw (letters, digits, space and ! ? . , : ' - + / # & < > ♥).

import { EXTRA_SHARED, EXTRA_SPECIES, JOKES, SPECIES_JOKES } from './lines';

export type Topic =
  | 'greet'
  | 'welcomeBack'
  | 'random'
  | 'hungry'
  | 'tired'
  | 'lonely'
  | 'pat'
  | 'angry'
  | 'drag'
  | 'drop'
  | 'feed'
  | 'play'
  | 'dance'
  | 'joke'
  | 'sing'
  | 'trick'
  | 'tickle'
  | 'wave'
  | 'yawn'
  | 'sneeze'
  | 'scared'
  | 'sit'
  | 'morning'
  | 'lunch'
  | 'evening'
  | 'lateNight'
  | 'friday'
  | 'monday'
  | 'boop'
  | 'belly'
  | 'foot'
  | 'tail'
  | 'ear'
  | 'hug'
  | 'throw'
  | 'bonk'
  | 'fact'
  | 'roast'
  | 'motivation'
  | 'thought'
  | 'backflip'
  | 'moonwalk'
  | 'juggle'
  | 'magic'
  | 'magicDone'
  | 'karate'
  | 'flex'
  | 'peekaboo'
  | 'shades'
  | 'trip'
  | 'hiccup'
  | 'meditate'
  | 'toot'
  | 'stretch'
  | 'airguitar'
  | 'bubblegum'
  | 'bubblePop'
  | 'cartwheel'
  | 'tiptoe'
  | 'yoyo'
  | 'selfie'
  | 'update';

export type Chattiness = 'off' | 'rare' | 'normal' | 'chatty';

type Lines = Partial<Record<Topic, string[]>>;

const SHARED: Partial<Record<Topic, string[]>> = {
  greet: ['Hi {user}!', 'Hello hello!', "I'm back! Did you miss me?", "Let's have a great day, {user}!"],
  welcomeBack: ['Welcome back, {user}!', 'Oh! You came back!', 'I kept your desktop warm.', 'Where did you go? I was guarding stuff.'],
  random: [
    'Is it snack time yet?',
    'Nice wallpaper. Very... pixels.',
    "I'm not lazy, I'm on energy saving mode.",
    'Remember to drink some water!',
    'Stretch break? Stretch break.',
    'This taskbar is my runway.',
    "You're doing great, {user}.",
    'I counted all your icons. Twice.',
    'Fun fact: I am adorable.',
    'Psst. Blink a few times. Eyes need love too.',
  ],
  hungry: ['My tummy is making noises.', 'Feeeed meee.', "{user}... I'm sooo hungry.", 'Right-click me for snacks!'],
  tired: ['So... sleepy...', 'Five more minutes...', "I could nap for a week.", 'Yaaawn. Nap time?'],
  lonely: ['Play with me?', 'I miss you, {user}.', 'Pat me? Just once?', 'Is anyone there?'],
  pat: ['♥', 'Hehe!', 'More pats please!', 'That tickles!', 'Best human ever.'],
  angry: ['HEY! Stop poking!', 'Hmph!', 'I am NOT a button!', 'Rude!', "That's it, I'm telling the mouse."],
  drag: ['Wheee!', 'Where are we going?', 'Put me down!', "I'm flying!", 'Careful, careful!'],
  drop: ['Ow.', 'Ten out of ten landing.', 'I saw stars.', 'Again! Again!', 'Nailed it.'],
  feed: ['Yum!', 'Delicious!', 'Nom nom nom.', 'Chef kiss!', 'Thank you, {user}!'],
  play: ['Wheee!', 'Best day ever!', 'Again!', 'Tag, you are it!'],
  dance: ['Dance party!', 'Look at these moves!', 'Boogie time!'],
  joke: [
    'Why did the pixel go to school? To get more resolution!',
    'I told a joke about RAM. I forgot the ending.',
    'What do you call a sleepy pet? A desk-nap-top.',
    'My favorite exercise? Running in the background.',
    'Why was the computer cold? It left its Windows open.',
    'I would tell a UDP joke, but you might not get it.',
    'Knock knock. Who is there? Cache. Cache who? Bless you!',
    'Why do pets love keyboards? Tons of space to nap.',
  ],
  sing: ['La la laaa!', 'Do re mi fa SNACK!', 'This one is for you, {user}!'],
  trick: ['Ta-daa!', 'Did you see that?!', 'Practicing for the talent show.'],
  tickle: ['Hahaha stop!', 'Hehehe! No fair!', 'I am VERY ticklish!'],
  wave: ['Hi {user}!', 'Heyyy!', 'Hello there!', 'Oh hi! Did not see you there.'],
  yawn: ['Yaaawn...','Mmm... cozy.', 'Is it bedtime?'],
  sneeze: ['Achoo!', 'Excuse me!', 'Too much dust in here.'],
  scared: ['Eek!', 'What was that?!', 'Too fast, too fast!'],
  sit: ['Just sitting. Professionally.', 'Taking a little break.', 'This spot is mine now.'],
  morning: ['Good morning, {user}!', 'Rise and shine!', 'Coffee first, then work.'],
  lunch: ['Lunch time! For both of us?', "Don't skip lunch, {user}!"],
  evening: ['Long day? You did good.', 'Almost time to relax!'],
  lateNight: ["It's late, {user}. Bed soon?", 'Night owl mode activated.', 'Even I am sleepy and I am pixels.'],
  friday: ['It is FRIDAY!', 'Weekend is almost here!'],
  monday: ['Monday again? We got this.', 'New week, new snacks.'],
  boop: ['Boop!', 'You booped my nose!', 'Beep... I mean boop!', 'Hey! That is my sniffer!'],
  belly: ['Hehehe! Not the belly!', 'That tickles!', 'Belly rubs are illegal. Do it again.', 'Hahaha stop it!'],
  foot: ['Ow, my toe!', 'Hey, those are my walking feet!', 'Hop hop hop!', 'Did you just step on me?'],
  tail: ['HEY! Not the tail!', 'Let go of my tail!', 'That is attached to me, you know!', 'Rude!'],
  ear: ['My ears!', 'I can hear you just fine.', 'Hehe, that tickles my ear.', 'Ear flick!'],
  hug: ['Awww, a hug!', 'Squeeeze!', 'I love you too, {user}!', 'Best hug ever.'],
  throw: ['WHEEEE!', 'I am flying!', 'I think I left my stomach up there.', 'Again! Again!', 'Ow. Worth it.'],
  bonk: ['Ow!', 'Watch where you are going!', 'Bonk!', 'Oof, sorry!'],
};

const SPECIES_LINES: Record<string, Lines> = {
  mochi: {
    greet: ['Oh. You. Hi.', 'I allow you to use the computer today.'],
    random: [
      'I sat on your taskbar. It is mine now.',
      'If I fits, I sits.',
      'I could knock an icon off the desk. I am thinking about it.',
      'Nap. Eat. Judge. Repeat.',
      'Your cursor looks like a laser pointer. Just saying.',
    ],
    hungry: ['Fish. Now. Please.', 'I have not eaten in at least 4 minutes.'],
    feed: ['Acceptable fish.', 'Purr. More.'],
    angry: ['Hiss!', 'Paws off.'],
    sit: ['This is my loaf pose.', 'Do not disturb the loaf.'],
    tail: ['Touch the tail again. I dare you.', 'HISS. The tail is sacred.'],
    belly: ['It is a trap! Classic cat move.'],
    joke: ['What is a cat favorite color? Purr-ple.'],
  },
  pip: {
    greet: ['RIBBIT! Hi hi hi!', 'Hop hop hello!'],
    random: [
      'Leaf me alone? Never!',
      "I'm toad-ally happy to be here!",
      'Hop to it, {user}!',
      'My leaf needs sunlight. Is your monitor a sun?',
      'I hopped 3,000 pixels today!',
    ],
    hungry: ['I could eat a whole berry bush!'],
    feed: ['Berry nice!', 'Ribbit! Yummy!'],
    joke: ['What do frogs order? French flies!', 'Why are frogs happy? They eat what bugs them.'],
    sing: ['Ribbit ribbit, la la la!'],
  },
  ember: {
    greet: ['Behold! The mighty Ember!', 'Fear me! ...Please pat me.'],
    random: [
      'I am a FEARSOME dragon.',
      'One day I will hoard ALL the icons.',
      'Rawr! ...Did that sound scary?',
      'My fire is very hot. I think. I never tried.',
      'Bow before me, mortal! Or just wave, that is fine too.',
    ],
    hungry: ['A dragon needs SPICY snacks!'],
    feed: ['Spicy! My favorite!', 'Fire in my belly!'],
    angry: ['I will burn your recycle bin!', 'RAWR!'],
    joke: ['Why do dragons sleep all day? They hunt knights.'],
    scared: ['I was not scared. Dragons are never scared.'],
    tail: ['Careful, it is spiky!', 'My mighty tail!'],
  },
  bolt: {
    greet: ['BOOT SEQUENCE COMPLETE. HELLO {user}.', 'Beep boop. Hi!'],
    random: [
      'Scanning... you look great today.',
      'Beep. Boop. Beep.',
      'My battery is 87 percent. Emotionally.',
      'Running happiness.exe',
      'Error 404: snacks not found.',
      'Calculating... yes, you need a break.',
    ],
    hungry: ['Low battery. Please insert snack.', 'Power at 3 percent...'],
    feed: ['Recharging! Bzzt!', 'Battery full! Thank you, human.'],
    tired: ['Entering sleep mode...', 'Defragmenting my dreams...'],
    joke: ['Why was the robot tired? It had a hard drive.', 'I tried to catch fog. I mist. Beep.'],
    angry: ['DOES NOT COMPUTE!', 'Unauthorized poke detected!'],
    sneeze: ['Achoo.exe has stopped working.'],
    boop: ['BOOP RECEIVED.', 'Nose sensor activated.'],
    tail: ['I do not have a tail. Nice try.'],
  },
  nimbus: {
    greet: ['Oh... hello, sunshine.', 'Floating by to say hi.'],
    random: [
      'Do clouds dream of sheep?',
      'I am soft. You are soft. Everything is soft.',
      'Take a deep breath with me...',
      'The sky is just a big blanket.',
      'I am 90 percent fluff.',
    ],
    feed: ['Clover! My favorite.', 'Mmm... fluffy food.'],
    tired: ['Drifting off...', 'Cloud nap incoming.'],
    joke: ['Why are clouds lazy? They just hang around.'],
    sing: ['Baaa baaa la laaa...'],
  },
};

export const CHAT_INTERVAL_MIN: Record<Chattiness, [number, number] | null> = {
  off: null,
  rare: [6, 12],
  normal: [2.5, 6],
  chatty: [0.75, 2],
};

export function linesFor(topic: Topic, species: string): string[] {
  const own = [...(SPECIES_LINES[species]?.[topic] ?? []), ...(EXTRA_SPECIES[species]?.[topic] ?? [])];
  const shared = [...(SHARED[topic] ?? []), ...(EXTRA_SHARED[topic] ?? [])];
  return [...own, ...shared];
}

function ownCount(topic: Topic, species: string) {
  return (SPECIES_LINES[species]?.[topic]?.length ?? 0) + (EXTRA_SPECIES[species]?.[topic]?.length ?? 0);
}

/** A two-part joke for this species: [setup, punchline]. */
export function pickJoke(species: string, rand: () => number = Math.random): [string, string] {
  const own = SPECIES_JOKES[species] ?? [];
  const pool = own.length && rand() < 0.35 ? own : JOKES;
  return pool[Math.floor(rand() * pool.length)];
}

export function fill(line: string, name: string, user: string): string {
  return line.replace(/\{name\}/g, name).replace(/\{user\}/g, user.trim() || 'friend');
}

export function pickLine(topic: Topic, species: string, name: string, user: string, rand: () => number = Math.random): string {
  const lines = linesFor(topic, species);
  // Species lines are listed first; weight them so personalities shine through.
  const own = ownCount(topic, species);
  const i = own && rand() < 0.55 ? Math.floor(rand() * own) : Math.floor(rand() * lines.length);
  return fill(lines[Math.min(i, lines.length - 1)], name, user);
}

/** A time-of-day topic for "now", if any. */
export function timeTopic(d: Date): Topic | null {
  const h = d.getHours();
  const day = d.getDay();
  if (day === 5 && h >= 14) return 'friday';
  if (day === 1 && h >= 8 && h < 11) return 'monday';
  if (h >= 6 && h < 10) return 'morning';
  if (h >= 12 && h < 14) return 'lunch';
  if (h >= 18 && h < 21) return 'evening';
  if (h >= 0 && h < 4) return 'lateNight';
  return null;
}

/** What to talk about unprompted, given needs and the clock. */
export function idleTopic(needs: { hunger: number; happiness: number; energy: number }, now: Date, rand: () => number = Math.random): Topic {
  if (needs.hunger > 75 && rand() < 0.6) return 'hungry';
  if (needs.energy < 25 && rand() < 0.5) return 'tired';
  if (needs.happiness < 30 && rand() < 0.5) return 'lonely';
  const t = timeTopic(now);
  if (t && rand() < 0.3) return t;
  const r = rand();
  if (r < 0.2) return 'joke';
  if (r < 0.3) return 'fact';
  if (r < 0.38) return 'roast';
  if (r < 0.46) return 'motivation';
  if (r < 0.54) return 'thought';
  return 'random';
}

export function nextChatDelayMs(c: Chattiness, rand: () => number = Math.random): number {
  const r = CHAT_INTERVAL_MIN[c];
  if (!r) return Infinity;
  return (r[0] + rand() * (r[1] - r[0])) * 60_000;
}

/** How long a bubble stays up, scaled by length. */
export function bubbleMs(text: string): number {
  return Math.min(11000, 2200 + text.replace(/\*/g, '').length * 75);
}

export const ALL_TOPICS = [...new Set([...Object.keys(SHARED), ...Object.keys(EXTRA_SHARED)])] as Topic[];
export const SPECIES_WITH_LINES = [...new Set([...Object.keys(SPECIES_LINES), ...Object.keys(EXTRA_SPECIES)])];
