// Pet-to-pet interactions. Pet windows share presence over events; the pet with the lower id
// initiates and both windows run the same timed script (each plays its own role).
// Templates: {a} = initiator's name, {b} = partner's name.

import { TRICKS, type Action } from './brain';
import { JOKES, MORE_CONVERSATIONS, SPECIES_JOKES } from './lines';
import { PAIR_CONVERSATIONS } from './lines2';
import { ARGUMENTS, BANTER, BYSTANDER, COMPLIMENTS, COMPLIMENT_BACK, GOSSIP } from './lines3';

export type Role = 'a' | 'b';

export type Step =
  | { at: number; role: Role; do: 'goto'; gap: number; speed?: number }
  | { at: number; role: Role; do: 'face' }
  | { at: number; role: Role; do: 'say'; text: string }
  | { at: number; role: Role; do: 'act'; action: Action }
  | { at: number; role: Role; do: 'chase' | 'flee'; ms: number }
  /** Walk `dist` logical px away from the partner (to hide, or to escape a smell). */
  | { at: number; role: Role; do: 'away'; dist: number; speed?: number };

export type Kind =
  | 'chat'
  | 'tag'
  | 'highfive'
  | 'prank'
  | 'danceoff'
  | 'duet'
  | 'snack'
  | 'nap'
  | 'jokeoff'
  | 'copycat'
  | 'magicshow'
  | 'staring'
  | 'argue'
  | 'hideseek'
  | 'toot'
  | 'selfie'
  | 'compliments'
  | 'hiccupcure'
  | 'snackthief'
  | 'wrestle'
  | 'gossip';

export const KINDS: Kind[] = [
  'chat', 'tag', 'highfive', 'prank', 'danceoff', 'duet', 'snack', 'nap', 'jokeoff', 'copycat', 'magicshow',
  'staring', 'argue', 'hideseek', 'toot', 'selfie', 'compliments', 'hiccupcure', 'snackthief', 'wrestle', 'gossip',
];

export interface Script {
  kind: Kind;
  steps: Step[];
  /** Total length in ms; both pets are busy until then. */
  length: number;
}

export interface Presence {
  id: number;
  name: string;
  species: string;
  x: number;
  y: number;
  monitor: string;
  state: string;
  busy: boolean;
  at: number;
}

const CONVERSATIONS: { species?: [string, string]; lines: [string, string, string?] }[] = [
  { lines: ['Hey {b}, did you see that cursor?', 'It went zoom! Terrifying.', 'I am going to catch it one day.'] },
  { lines: ['{b}, what are we doing today?', 'Same as always. Napping, then more napping.', 'Love the plan.'] },
  { lines: ['Psst, {b}. I think the human is working.', 'Should we distract them?', 'Absolutely.'] },
  { lines: ['Do you ever think about the recycle bin, {b}?', 'Every day. What is in there?!', 'Nobody knows...'] },
  { lines: ['Race you to the clock!', 'You are on, {a}!', 'Okay maybe later. I am comfy.'] },
  { lines: ['I had the weirdest dream, {b}.', 'Were you a screensaver again?', 'HOW DID YOU KNOW.'] },
  { lines: ['{b}, rate my look today.', 'Eleven out of ten.', 'You are too kind!'] },
  { lines: ['Knock knock.', 'Who is there?', 'Lettuce. Lettuce in, it is cold out here!'] },
  { lines: ['Is it snack time, {b}?', 'It is always snack time.', 'Wise words.'] },
  { lines: ['Shhh. If we stay still they think we are icons.', '...', 'It is working!'] },
  { lines: ['I bet I can jump higher than you!', 'Prove it, {a}!', 'Tomorrow. My legs are on vacation.'] },
  { lines: ['Nice weather on the desktop today.', 'A little cloudy near the taskbar.', 'Classic Tuesday.'] },
  { species: ['ember', 'bolt'], lines: ['Robot! Prepare to be roasted!', 'Warning: I am fireproof.', 'Then I will roast you with JOKES.'] },
  { species: ['bolt', 'ember'], lines: ['Dragon detected. Threat level: adorable.', 'I am TERRIFYING!', 'Updating database... still adorable.'] },
  { species: ['mochi', 'pip'], lines: ['Frog. You are sitting in my sun spot.', 'Ribbit? It is a shared sun spot.', 'There is no such thing.'] },
  { species: ['pip', 'nimbus'], lines: ['Nimbus, can you make it rain? My leaf is thirsty.', 'I am more of a fluffy cloud, sorry.', 'Fluffy is good too!'] },
  { species: ['nimbus', 'mochi'], lines: ['Mochi, want to nap on me? I am very soft.', 'Finally, someone who understands me.', 'Zzz together then.'] },
  { species: ['bolt', 'pip'], lines: ['Frog, your leaf is at 72 percent efficiency.', 'Is that good?', 'For a leaf? Outstanding.'] },
  { species: ['ember', 'mochi'], lines: ['Bow before the mighty dragon!', 'No.', '...okay, fair.'] },
];

export function pickConversation(aSpecies: string, bSpecies: string, rand: () => number): [string, string, string?] {
  const special = [...CONVERSATIONS, ...PAIR_CONVERSATIONS].filter((c) => c.species && c.species[0] === aSpecies && c.species[1] === bSpecies);
  if (special.length && rand() < 0.6) return special[Math.floor(rand() * special.length)].lines;
  const general = [...CONVERSATIONS.filter((c) => !c.species), ...[...MORE_CONVERSATIONS, ...BANTER].map((lines) => ({ lines }))];
  return general[Math.floor(rand() * general.length)].lines;
}

export function fillNames(text: string, a: string, b: string) {
  return text.replace(/\{a\}/g, a).replace(/\{b\}/g, b);
}

/** Builds a script. Pure: the same seed gives the same script in both windows. */
export function buildScript(kind: Kind, a: Presence, b: Presence, seed: number): Script {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const say = (at: number, role: Role, text: string): Step => ({ at, role, do: 'say', text: fillNames(text, a.name, b.name) });
  const steps: Step[] = [];
  const one = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  switch (kind) {
    case 'chat': {
      const [l1, l2, l3] = pickConversation(a.species, b.species, rand);
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 90 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2600, role: 'a', do: 'face' }, { at: 2600, role: 'b', do: 'face' });
      steps.push(say(2800, 'a', l1), say(5600, 'b', l2));
      if (l3) steps.push(say(8400, 'a', l3));
      steps.push({ at: l3 ? 11000 : 8400, role: 'a', do: 'act', action: rand() < 0.5 ? 'happy' : 'joke' });
      steps.push({ at: l3 ? 11200 : 8600, role: 'b', do: 'act', action: 'happy' });
      return { kind, steps, length: l3 ? 13000 : 10500 };
    }
    case 'tag':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 30, speed: 1.6 });
      steps.push(say(2200, 'a', 'Tag! You are it!'), { at: 2300, role: 'a', do: 'flee', ms: 6000 });
      steps.push(say(2600, 'b', 'Hey! Come back here!'), { at: 2600, role: 'b', do: 'chase', ms: 5700 });
      steps.push(say(8600, 'b', 'Gotcha! Now YOU are it!'), { at: 8700, role: 'b', do: 'flee', ms: 5000 });
      steps.push({ at: 8900, role: 'a', do: 'chase', ms: 4800 });
      steps.push(say(14000, 'a', 'Okay okay, I need a nap.'));
      steps.push({ at: 14200, role: 'a', do: 'act', action: 'tickle' }, { at: 14200, role: 'b', do: 'act', action: 'tickle' });
      return { kind, steps, length: 16500 };
    case 'highfive':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 45 }, { at: 0, role: 'b', do: 'goto', gap: 45 });
      steps.push(say(2000, 'a', 'High five, {b}!'));
      steps.push({ at: 2600, role: 'a', do: 'act', action: 'wave' }, { at: 2600, role: 'b', do: 'act', action: 'wave' });
      steps.push(say(3200, 'b', 'Yeah! Teamwork!'));
      steps.push({ at: 4600, role: 'a', do: 'act', action: 'happy' }, { at: 4600, role: 'b', do: 'act', action: 'happy' });
      return { kind, steps, length: 6800 };
    case 'prank':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 28, speed: 0.6 });
      steps.push(say(3400, 'a', 'BOO!'), { at: 3400, role: 'a', do: 'act', action: 'happy' });
      steps.push({ at: 3600, role: 'b', do: 'act', action: 'scared' }, say(3700, 'b', 'AAAAH!'));
      steps.push({ at: 5300, role: 'b', do: 'face' }, { at: 5300, role: 'b', do: 'act', action: 'angry' });
      steps.push(say(5400, 'b', 'Not funny, {a}!'));
      steps.push({ at: 6200, role: 'a', do: 'act', action: 'tickle' }, say(6300, 'a', 'Hehehe! It was a little funny.'));
      return { kind, steps, length: 9500 };
    case 'danceoff':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 110 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2400, 'a', 'Dance off, {b}! Watch this!'), { at: 2600, role: 'a', do: 'act', action: 'dance' });
      steps.push(say(7000, 'b', 'Pfff. Amateur. My turn!'), { at: 7200, role: 'b', do: 'act', action: 'dance' });
      steps.push({ at: 11600, role: 'b', do: 'act', action: 'trick' });
      steps.push(say(13300, 'a', rand() < 0.5 ? 'Okay, you win this time.' : 'It is a tie! We are both legends.'));
      steps.push({ at: 13500, role: 'a', do: 'act', action: 'happy' }, { at: 13600, role: 'b', do: 'act', action: 'happy' });
      return { kind, steps, length: 15500 };
    case 'duet':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 70 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2400, 'a', 'Sing with me, {b}!'));
      steps.push({ at: 3000, role: 'a', do: 'act', action: 'sing' }, { at: 3600, role: 'b', do: 'act', action: 'sing' });
      steps.push(say(4200, 'b', 'La la laaa!'), say(6500, 'a', 'Harmony!'));
      steps.push({ at: 9000, role: 'a', do: 'act', action: 'happy' }, { at: 9000, role: 'b', do: 'act', action: 'happy' });
      return { kind, steps, length: 11000 };
    case 'snack':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 60 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2300, 'a', 'Want half of my snack, {b}?'), say(4300, 'b', 'You are the best!'));
      steps.push({ at: 4600, role: 'a', do: 'act', action: 'feed' }, { at: 4600, role: 'b', do: 'act', action: 'feed' });
      steps.push(say(8400, 'b', 'Yum. Friends forever.'));
      return { kind, steps, length: 10000 };
    case 'jokeoff': {
      const pick = (sp: string) => {
        const pool = [...(SPECIES_JOKES[sp] ?? []), ...JOKES];
        return pool[Math.floor(rand() * pool.length)];
      };
      const [s1, p1] = pick(a.species);
      const [s2, p2] = pick(b.species);
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 90 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2300, 'a', 'Joke-off, {b}! Me first.'), { at: 2400, role: 'b', do: 'face' });
      steps.push(say(4800, 'a', s1), say(8600, 'a', p1));
      steps.push({ at: 11400, role: 'b', do: 'act', action: 'tickle' }, say(11500, 'b', 'Hahaha! Okay, my turn.'));
      steps.push(say(14800, 'b', s2), say(18600, 'b', p2));
      steps.push({ at: 21400, role: 'a', do: 'act', action: 'tickle' }, say(21500, 'a', rand() < 0.5 ? 'You win. That was *terrible*. I loved it.' : 'Tie! We are both *comedy legends*.'));
      return { kind, steps, length: 24500 };
    }
    case 'copycat': {
      const t1 = TRICKS[Math.floor(rand() * TRICKS.length)] as Action;
      const t2 = TRICKS[Math.floor(rand() * TRICKS.length)] as Action;
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 100 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2300, 'a', 'Bet you can\'t do *this*, {b}!'), { at: 2600, role: 'a', do: 'act', action: t1 });
      steps.push(say(6200, 'b', 'Pfff. Easy.'), { at: 6500, role: 'b', do: 'act', action: t1 });
      steps.push(say(10200, 'a', 'Okay, then try *this*!'), { at: 10500, role: 'a', do: 'act', action: t2 });
      steps.push({ at: 14300, role: 'b', do: 'act', action: rand() < 0.6 ? 'trip' : t2 });
      steps.push(say(14500, 'b', 'Watch and learn...'));
      steps.push({ at: 17000, role: 'a', do: 'act', action: 'tickle' }, say(17100, 'a', 'Hehe! Nice try!'));
      return { kind, steps, length: 19500 };
    }
    case 'magicshow':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 110 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2300, 'a', 'Ladies and gentle-pets... prepare to be *amazed*!'));
      steps.push({ at: 5200, role: 'a', do: 'act', action: 'magic' });
      steps.push({ at: 6200, role: 'b', do: 'act', action: 'scared' }, say(6300, 'b', 'WHERE DID {a} GO?!'));
      steps.push(say(7600, 'a', '*Ta-da!* Did you miss me?'));
      steps.push({ at: 9200, role: 'b', do: 'act', action: 'happy' }, say(9300, 'b', '*Bravo!* Do it again!'));
      steps.push({ at: 11200, role: 'a', do: 'act', action: 'flex' });
      return { kind, steps, length: 13800 };
    case 'staring': {
      const cheat = rand() < 0.35;
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 80 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2200, role: 'a', do: 'face' }, say(2300, 'a', 'Staring contest, {b}. No blinking. *Go.*'));
      steps.push(say(4800, 'b', '...'), say(6200, 'a', '...'), say(7600, 'b', '......'));
      if (cheat) {
        steps.push({ at: 9000, role: 'a', do: 'act', action: 'toot' }, { at: 9600, role: 'b', do: 'act', action: 'scared' });
        steps.push(say(9700, 'b', 'You *CHEATED*!'), say(11300, 'a', 'Rules said no blinking. Not no *tooting*.'));
        steps.push({ at: 13600, role: 'b', do: 'act', action: 'angry' });
      } else {
        steps.push({ at: 9000, role: 'b', do: 'act', action: 'sneeze' });
        steps.push({ at: 10200, role: 'a', do: 'act', action: 'happy' }, say(10300, 'a', 'HA! You blinked! I *win*!'));
        steps.push({ at: 12200, role: 'b', do: 'act', action: 'angry' }, say(12300, 'b', 'Sneezing does *not* count!'));
      }
      return { kind, steps, length: 15500 };
    }
    case 'argue': {
      const [claim, counter] = one(ARGUMENTS);
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 85 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2200, role: 'a', do: 'face' }, say(2300, 'a', claim));
      steps.push({ at: 5000, role: 'b', do: 'act', action: 'angry' }, say(5100, 'b', counter));
      steps.push({ at: 8000, role: 'a', do: 'act', action: 'angry' }, say(8100, 'a', 'Is *NOT*!'));
      steps.push(say(9600, 'b', 'Is *TOO*!'), say(11000, 'a', 'Is *NOT* times infinity!'));
      steps.push(say(13000, 'b', '...hug it out?'), { at: 14200, role: 'a', do: 'goto', gap: 30 });
      steps.push({ at: 15400, role: 'a', do: 'act', action: 'happy' }, { at: 15400, role: 'b', do: 'act', action: 'happy' });
      steps.push(say(15600, 'a', rand() < 0.5 ? 'Hug it out. But I am still *right*.' : 'Agree to disagree. *Forever.*'));
      return { kind, steps, length: 18500 };
    }
    case 'hideseek':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 60 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2200, 'a', 'Hide and seek! You count, {b}!'));
      steps.push({ at: 3600, role: 'b', do: 'act', action: 'peekaboo' }, say(3800, 'b', 'One... two... *skip a few*...'));
      steps.push({ at: 3700, role: 'a', do: 'away', dist: 420, speed: 1.9 });
      steps.push(say(7400, 'b', 'TEN! Ready or not, here I *come*!'), { at: 8200, role: 'b', do: 'chase', ms: 4800 });
      steps.push(say(8600, 'a', '*Shhh.* I am a *rock*.'));
      steps.push(say(13200, 'b', 'Found you!'), { at: 13300, role: 'a', do: 'act', action: 'tickle' });
      steps.push(say(14800, 'a', 'How?! I was *so* hidden!'), { at: 15000, role: 'b', do: 'act', action: 'flex' });
      return { kind, steps, length: 17500 };
    case 'toot':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 35, speed: 0.7 }, { at: 0, role: 'b', do: 'face' });
      steps.push(say(2600, 'a', rand() < 0.5 ? 'Hey {b}. Pull my *finger*.' : 'Hi {b}! Nice day, huh?'));
      steps.push({ at: 4600, role: 'a', do: 'act', action: 'toot' });
      steps.push({ at: 5300, role: 'b', do: 'act', action: 'scared' }, say(5400, 'b', 'WHO DID THAT?!'));
      steps.push(say(7200, 'a', "Wasn't me."), { at: 7900, role: 'a', do: 'away', dist: 260, speed: 1.4 });
      steps.push({ at: 8600, role: 'b', do: 'act', action: 'angry' }, say(8700, 'b', '{a}!!!'));
      steps.push(say(10600, 'a', 'Hehehe! *Bye!*'));
      return { kind, steps, length: 12500 };
    case 'selfie':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 40 }, { at: 0, role: 'b', do: 'goto', gap: 40 });
      steps.push(say(2200, 'a', 'Selfie with my *bestie*!'));
      steps.push({ at: 3000, role: 'b', do: 'act', action: 'shades' }, say(3100, 'b', 'Get my *good* side.'));
      steps.push({ at: 3600, role: 'a', do: 'act', action: 'selfie' });
      steps.push(say(6600, 'a', rand() < 0.5 ? 'You only *have* good sides!' : 'Oops. I got my *thumb*.'));
      steps.push({ at: 8600, role: 'a', do: 'act', action: 'happy' }, { at: 8600, role: 'b', do: 'act', action: 'happy' });
      return { kind, steps, length: 10500 };
    case 'compliments': {
      const c1 = one(COMPLIMENTS);
      const c2 = one(COMPLIMENTS.filter((c) => c !== c1));
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 75 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2200, role: 'a', do: 'face' }, say(2300, 'a', c1));
      steps.push(say(5300, 'b', one(COMPLIMENT_BACK)));
      steps.push(say(8300, 'a', c2.replace('{b}, ', '')));
      steps.push(say(11300, 'b', 'You are... you are... *the best*!'), { at: 11400, role: 'b', do: 'act', action: 'happy' });
      steps.push({ at: 13600, role: 'a', do: 'act', action: 'happy' }, say(13700, 'a', 'Stop it, I am *blushing*!'));
      return { kind, steps, length: 16000 };
    }
    case 'hiccupcure':
      steps.push({ at: 0, role: 'b', do: 'act', action: 'hiccup' }, { at: 0, role: 'a', do: 'goto', gap: 50 });
      steps.push(say(1200, 'b', "*Hic!* I can't *hic* stop!"));
      steps.push({ at: 3600, role: 'a', do: 'face' }, say(3700, 'a', 'I know a cure. Close your eyes.'));
      steps.push({ at: 6200, role: 'a', do: 'act', action: 'happy' }, say(6200, 'a', '*BOO!*'));
      steps.push({ at: 6400, role: 'b', do: 'act', action: 'scared' }, say(6500, 'b', 'AAAH!'));
      steps.push(say(8600, 'b', "...they're gone! You are a *genius*!"), { at: 8700, role: 'b', do: 'act', action: 'happy' });
      steps.push({ at: 11000, role: 'b', do: 'act', action: 'hiccup' }, say(11300, 'b', '*Hic.*'));
      steps.push({ at: 12300, role: 'a', do: 'act', action: 'tickle' });
      return { kind, steps, length: 14500 };
    case 'snackthief':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 55 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2200, role: 'a', do: 'act', action: 'feed' });
      steps.push(say(3600, 'b', 'Wait. Is that... *MY* snack?!'));
      steps.push(say(6000, 'a', 'Finders *keepers*!'), { at: 6600, role: 'a', do: 'flee', ms: 5600 });
      steps.push({ at: 6800, role: 'b', do: 'chase', ms: 5400 }, say(7000, 'b', 'Get back here, {a}!'));
      steps.push(say(12600, 'a', '*Burp.* Worth it.'), { at: 12800, role: 'b', do: 'act', action: 'angry' });
      return { kind, steps, length: 15000 };
    case 'wrestle':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 70 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2200, role: 'a', do: 'face' }, say(2300, 'a', 'En garde, {b}!'), { at: 2700, role: 'a', do: 'act', action: 'karate' });
      steps.push({ at: 4600, role: 'b', do: 'act', action: 'karate' }, say(4700, 'b', '*Hi-YAH!*'));
      if (rand() < 0.5) {
        steps.push({ at: 6800, role: 'a', do: 'act', action: 'trip' }, { at: 7400, role: 'b', do: 'act', action: 'flex' });
        steps.push(say(7500, 'b', '*Undefeated!*'), say(9600, 'a', '...best two out of *three*?'));
      } else {
        steps.push({ at: 6800, role: 'a', do: 'act', action: 'trip' }, { at: 7000, role: 'b', do: 'act', action: 'trip' });
        steps.push(say(8800, 'a', 'Ow.'), say(9800, 'b', 'Double knockout. *Rematch tomorrow.*'));
      }
      return { kind, steps, length: 12500 };
    case 'gossip': {
      const [g1, g2] = one(GOSSIP);
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 45, speed: 0.8 }, { at: 0, role: 'b', do: 'face' });
      steps.push({ at: 2600, role: 'a', do: 'face' }, say(2700, 'a', '*Psst.* {b}. Come here.'));
      steps.push(say(5000, 'a', g1), say(8400, 'b', g2));
      steps.push({ at: 11000, role: 'a', do: 'act', action: 'tickle' }, { at: 11100, role: 'b', do: 'act', action: 'tickle' });
      return { kind, steps, length: 13500 };
    }
    case 'nap':
      steps.push({ at: 0, role: 'a', do: 'goto', gap: 55 }, say(2200, 'a', 'Nap buddy?'), say(3600, 'b', 'Nap buddy.'));
      steps.push({ at: 4200, role: 'a', do: 'act', action: 'sleep' }, { at: 4400, role: 'b', do: 'act', action: 'sleep' });
      return { kind, steps, length: 22000 };
  }
}

/**
 * Chooses what to do together. Talkative settings favour chats; `wild` (the human has ignored
 * them for a while) favours chaos: tag, pranks, toots, arguments and hide-and-seek.
 */
export function chooseKind(rand: () => number, chatty: boolean, wild = false): Kind {
  const w = wild ? 2 : 1;
  const table: [Kind, number][] = [
    ['chat', chatty ? 26 : 14],
    ['tag', 12 * w],
    ['highfive', 8],
    ['prank', 9 * w],
    ['danceoff', 8],
    ['duet', 6],
    ['snack', 5],
    ['nap', wild ? 2 : 5],
    ['jokeoff', chatty ? 12 : 7],
    ['copycat', 10],
    ['magicshow', 7],
    ['staring', 8],
    ['argue', 9 * w],
    ['hideseek', 9 * w],
    ['toot', 6 * w],
    ['selfie', 7],
    ['compliments', 6],
    ['hiccupcure', 6],
    ['snackthief', 7 * w],
    ['wrestle', 8 * w],
    ['gossip', chatty ? 11 : 7],
  ];
  const total = table.reduce((n, [, w]) => n + w, 0);
  let r = rand() * total;
  for (const [k, w] of table) {
    if ((r -= w) < 0) return k;
  }
  return 'chat';
}

/** What a third pet shouts while watching two others. */
export function bystanderLine(kind: Kind, a: string, b: string, rand: () => number): string {
  const pool = BYSTANDER[kind] ?? BYSTANDER.default;
  return fillNames(pool[Math.floor(rand() * pool.length)], a, b);
}

/**
 * Extra start chance for pets that have been ignored: nothing for the first minute, then rising
 * to +0.4 over the next ten, so a neglected desktop turns into a playground.
 */
export function boredomBonus(ignoredMs: number) {
  return Math.min(0.4, (Math.max(0, ignoredMs - 60_000) / 600_000) * 0.4);
}

/** Initiation chance per check (every few seconds) by chattiness. */
export const SOCIAL_CHANCE: Record<string, number> = { off: 0.02, rare: 0.04, normal: 0.08, chatty: 0.14 };

export function isFree(state: string) {
  return state === 'idle' || state === 'walk' || state === 'sit';
}
