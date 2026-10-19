// Even more pet-to-pet material: banter, silly arguments, gossip about the human, and what
// bystanders shout while two friends are busy. {a} = initiator, {b} = partner.

import type { Kind } from './social';

export const BANTER: [string, string, string?][] = [
  ['{b}, I have decided I am a *cat* now.', 'You are literally a different animal.', 'And yet. *Meow.*'],
  ['I named the cursor *Steve*.', 'Steve is a terrible name for a cursor.', 'Steve can hear you, {b}.'],
  ['{b}, if you were a file, what would you be?', 'A *zip* file. Full of surprises.', 'I would be *final_final_v3*.'],
  ['I tried to download more RAM.', 'Did it work?', 'I am now *0.5 percent* smarter.'],
  ['What if the taskbar is just a very long *floor*?', 'It IS a floor, {a}.', '*Mind. Blown.*'],
  ['{b}, do you think the human likes me more?', 'Obviously not.', 'Rude. Correct, but *rude*.'],
  ['I ate a pixel by accident.', 'Which one?!', 'The one that *used* to be over there.'],
  ['Wanna start a band, {b}?', 'Only if we are called *The Taskbars*.', 'First album: *Ctrl Alt Delicious*.'],
  ['I think I am getting a cold.', 'Is that why you sound *buffering*?', 'I am *not* buffer... *buff... ing*.'],
  ['{b}, I have a plan to take over the desktop.', 'What is step one?', 'Step one is *a nap*. It is a long plan.'],
  ['Why is the recycle bin always so *hungry*?', 'It eats files, {a}.', 'So it is just like me. *Respect.*'],
  ['I just did 100 push-ups.', 'I watched you. It was *two*.', 'Two *really good* ones.'],
  ['{b}, be honest. Am I a little *chunky*?', 'You are *perfectly* round.', 'Thank you. I worked hard on this.'],
  ['I learned to whistle!', 'Show me!', '*Pfffffff.* ...I am still learning.'],
  ['If I sit very still, do I count as a *widget*?', 'A very cute widget.', 'Then I demand to be *pinned*.'],
  ['{b}, do you dream in pixels?', 'I dream in *snacks*.', 'Same thing, honestly.'],
  ['Everyone is so busy today.', 'Except us.', 'We are busy being *adorable*. Full-time job.'],
  ['I challenged the clock to a staring contest.', 'And?', 'It has been *hours*. It never blinks. I am scared.'],
  ['Is it weird that I talk to the wallpaper?', 'Only if it talks back.', '...it does not. *Yet.*'],
  ['{b}, guess what I am thinking.', 'Snacks.', 'How do you *always* know?!'],
  ['I want to go on vacation.', 'Where?', 'The *other* monitor. I hear it is lovely.'],
  ['My horoscope says I will meet a *tall stranger*.', 'That is the mouse cursor.', 'Oh no. Not *Steve*.'],
  ['What is the human typing so fast for?', 'Probably an angry email.', 'Should we cheer them up?! *Wiggle* at them!'],
  ['I tried meditating.', 'How did it go?', 'I fell asleep and dreamed I was meditating. *Double* zen.'],
  ['{b}, you have something on your face.', 'Where?!', 'Oh wait. That is just your *face*. Lovely.'],
];

/** Silly arguments: claim, counter. Both get very worked up, then hug it out. */
export const ARGUMENTS: [string, string][] = [
  ['Cereal is a *soup*.', 'Take that back RIGHT NOW!'],
  ['A hot dog is a *sandwich*.', 'It is a *taco*, and you know it!'],
  ['The cursor is our *friend*.', 'The cursor is a *spy*!'],
  ['Naps are a *sport*.', 'Then I am an *olympic champion*!'],
  ['Pineapple belongs on pizza.', 'Pineapple belongs in *jail*!'],
  ['The taskbar should be on the *top*.', 'Chaos! *Pure chaos!*'],
  ['Socks with sandals are *fashion*.', 'They are a *crime*!'],
  ['Dark mode is better.', 'Light mode is *happier*!'],
  ['Water is *wet*.', 'Water makes things wet. It is not *itself* wet!'],
  ['The best snack is a *cookie*.', 'The best snack is a *second cookie*!'],
];

/** Whispered gossip about the human. */
export const GOSSIP: [string, string][] = [
  ['The human talks to the screen when nobody is looking.', 'We are *always* looking.'],
  ['I saw the human eat cereal at *three in the afternoon*.', '*Iconic.*'],
  ['The human has *forty-seven tabs* open.', 'That is not a browser. That is a *lifestyle*.'],
  ['The human said "one more episode" *four* episodes ago.', 'Rookie numbers.'],
  ['The human just searched "how to look busy".', 'We should teach them our ways.'],
  ['The human sighed at an email again.', 'Should we *bite* the email?'],
  ['I think the human forgot to drink water today.', 'Hydration *intervention*. Tonight.'],
  ['The human laughed at a meme for *ten minutes*.', 'It was about us, right? It was *definitely* about us.'],
  ['The human named a folder "stuff".', 'And inside is a folder called "*more stuff*".'],
  ['The human pressed save *eleven times* in a row.', 'Trust issues. I respect it.'],
];

export const COMPLIMENTS: string[] = [
  '{b}, you have *very* nice ears.',
  'Your tail is a *masterpiece*.',
  'You walk like a *supermodel*.',
  'Your snack-finding skills are *legendary*.',
  'You are the *roundest* friend I have.',
  'Your nap game is *unmatched*.',
  'Your eyes sparkle like a *brand-new pixel*.',
  'You are *funnier* than the recycle bin.',
];

export const COMPLIMENT_BACK: string[] = [
  'Well YOU are the *cutest* thing on this desktop!',
  'Oh yeah? Your *smile* could charge a laptop!',
  'Stop it! No, keep going. *Your* face is perfect!',
  'You are the *best pet* on this screen. Fact.',
];

/** What a third pet shouts while two others are busy. */
export const BYSTANDER: Partial<Record<Kind, string[]>> & { default: string[] } = {
  tag: ['Can I play too?!', 'Run, {a}, *run*!', 'I am not it! I am *never* it!'],
  danceoff: ['Go {a}! Go {a}!', 'Those moves should be *illegal*.', 'I give it a *ten*. And a snack.'],
  jokeoff: ['*Booo!* ...kidding, I loved it.', 'I have heard better. From a *toaster*.', 'Ba-dum-*tss*!'],
  prank: ['Hehehe! Classic {a}.', 'Oh no. Oh no no *no*.'],
  toot: ['*Ew!* I can smell it from *here*!', 'Open a window! *ANY* window!', 'That was *definitely* {a}.'],
  argue: ['Hot take. I am staying *out* of this.', 'I need *popcorn* for this.', 'You are *both* wrong!'],
  wrestle: ['Fight! Fight! Fight!', 'My money is on {b}!', 'Somebody call the *referee*!'],
  magicshow: ['How does {a} *DO* that?!', 'It is a trick. It is *always* a trick.'],
  staring: ['Do not blink, {b}!', 'I cannot watch. Actually I can. I *am*.'],
  hideseek: ['{a} is over there! Oops. Did I say that *out loud*?'],
  snackthief: ['Is there more snack? Asking for *me*.', 'Justice for {b}!'],
  selfie: ['Hey! I want to be in the picture too!', 'Tag me! *Tag me!*'],
  compliments: ['Get a room. A *desktop* room.', 'Aww. I am *not* crying. You are crying.'],
  gossip: ['What are you two *whispering* about?', 'I heard my name! Did I hear my name?!'],
  hiccupcure: ['Try holding your breath! For a *year*!'],
  duet: ['Encore! *Encore!*', 'Can you sing quieter? Or *louder*. One of those.'],
  default: ['What are you two up to?', 'Count me in next time!', 'Without *me*?!'],
};
