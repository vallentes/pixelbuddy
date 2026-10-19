// What pets say about what you are doing. {user} = your name, {label} = app ("YouTube"),
// {song} = "Artist - Song", {minutes} = focus length.

export type AwareTopic =
  | 'video'
  | 'music'
  | 'song'
  | 'meeting'
  | 'meetingEnd'
  | 'chat'
  | 'mail'
  | 'code'
  | 'game'
  | 'social'
  | 'shopping'
  | 'docs'
  | 'browse'
  | 'videoLong'
  | 'musicLong'
  | 'chatLong'
  | 'mailLong'
  | 'codeLong'
  | 'gameLong'
  | 'socialLong'
  | 'shoppingLong'
  | 'docsLong'
  | 'typing'
  | 'night'
  | 'break'
  | 'water'
  | 'focusStart'
  | 'focusDone'
  | 'climb';

export const AWARE_LINES: Record<AwareTopic, string[]> = {
  video: [
    'Ooh, what are we watching? Is it about *cats*?',
    'Movie time! I will get the *popcorn*.',
    'Shhh, everyone. *{label}* is on.',
    'Can the next one be about *dogs*? Asking for a friend.',
    'I love {label}! Do not skip the *good* part.',
  ],
  music: [
    'Is that {label}? Turn it *up*!',
    'My tail is tapping. This is a *bop*.',
    'Dance break! Everybody *move*!',
    'Music! Finally, my time to *shine*.',
  ],
  song: [
    'Ooh, *{song}*! Great taste, {user}.',
    '*{song}*? This one is my *jam*!',
    'Is it *{song}* again? ...I love it.',
    'Wait wait wait. *{song}*! I know all the words! Mostly.',
  ],
  meeting: ['Shh... meeting. I will be *quiet*.', 'Good luck in the meeting! *Tiptoes away.*', 'Mute button: *check*. Me: silent.'],
  meetingEnd: [
    'How was the meeting? Did they mention *snacks*?',
    'That meeting could have been an *email*.',
    'You survived the meeting! *Proud* of you.',
    'Meeting over! Can I talk now? I have *so* much to say.',
  ],
  chat: [
    'Who are you talking to on {label}? Tell them I said *hi*!',
    'Is it gossip? I *love* gossip.',
    'Add a cat emoji. Trust me.',
    'Type something *nice*. Or something *funny*. Ideally both.',
  ],
  mail: [
    'Another email? Want me to *bite* it?',
    'Dear {user}, per my last *snack*...',
    'Inbox zero is a myth. Like *unicorns*.',
    'Reply-all? *Bold* move.',
  ],
  code: [
    'Ooh, code! Is it a game about *me*?',
    'Missing semicolon? I am no expert.',
    'Have you tried turning it off and on again?',
    'I believe in you. And in *rubber ducks*. I can be your duck.',
  ],
  game: ['Game time! Can I be *player two*?', 'Go go go! *Win* it!', 'I will watch. I am *great* at watching.'],
  social: ['Scrolling again? Find me a *cat video*.', 'Five more minutes. I am *counting*, {user}.', 'Like this one! No, *that* one!'],
  shopping: ['Ooh, shopping! Is any of it *for me*?', 'Add snacks to the cart. *Lots* of snacks.', 'Do we *need* it? ...Yes. We need it.'],
  docs: [
    'Writing something important? Use *big* words.',
    'Make the font Comic Sans. *Trust me.*',
    'Spreadsheets! So many *boxes*. I love boxes.',
  ],
  browse: ['What are we looking up?', 'Search for "cute desktop pets". For *research*.'],
  videoLong: ['Still watching? Me too. *No spoilers*.', 'Is this the part where they *fall in love*?', 'One more episode? I will allow it.'],
  musicLong: ['This playlist is a *masterpiece*.', 'Encore! *Encore!*'],
  chatLong: ['Still chatting? Tell them about *me*!', 'That is a *lot* of typing. Is it a love letter?'],
  mailLong: ['That is a *lot* of email. Are you okay?', 'Let us escape. Just you, me and *zero* emails.'],
  codeLong: ['You have been coding forever. Have you *pet* anyone today?', 'It compiles? *Ship it!*', 'Bug or feature? Call it a *feature*.'],
  gameLong: ['Okay, one more round. *Then* one more.', 'Are you winning? You look like you are *winning*.'],
  socialLong: ['Doomscroll alert! Look at *me* instead.', 'The internet will still be there. I might *not*. (I will.)'],
  shoppingLong: ['The cart is getting *heavy*.', 'Is it a sale if you buy *everything*?'],
  docsLong: ['Save your work! Ctrl+S! *Ctrl+S*!', 'Page three already? You are *unstoppable*.'],
  typing: [
    'Whoa, {user}! Your fingers are on *fire*!',
    'Type type type! Are you writing a *novel*?',
    'Slow down! The keyboard needs a *nap*.',
    'So fast! Are you a *robot*? ...Bolt, is that you?',
  ],
  night: [
    'It is late, {user}. Go to *bed*!',
    'Night owl! I am *sleepy*, but I will stay up with you.',
    'The moon called. It says *go to sleep*.',
  ],
  break: ['You have been sitting for an hour! *Stretch* with me!', 'Break time! Wiggle your toes. I am wiggling mine.', 'Stand up, {user}! Your chair needs a *rest*.'],
  water: ['Drink some water, {user}! I am having some too.', 'Hydration check! *Glug glug*.', 'Water break! Plants need water. So do *you*.'],
  focusStart: ['Focus mode! {minutes} minutes. We will be *super* quiet.', 'Shh, everyone! {user} is focusing for {minutes} minutes.'],
  focusDone: ['Time is up! You did *amazing*. Break time!', 'Focus done! You are a *legend*!', 'Ding! Stretch, snack, and pet me. In that order.'],
  climb: ['*Parkour!*', 'Nice view from up here!', 'I am the *king* of this window!', 'Do not move it! ...Okay, move it. *Wheee!*'],
};

export function fillAware(text: string, v: { user: string; label?: string | null; song?: string | null; minutes?: number }) {
  return text
    .replace(/\{user\}/g, v.user || 'friend')
    .replace(/\{label\}/g, v.label || 'this')
    .replace(/\{song\}/g, v.song || 'this song')
    .replace(/\{minutes\}/g, String(v.minutes ?? 25));
}

export function pickAware(topic: AwareTopic, v: Parameters<typeof fillAware>[1], rand = Math.random) {
  const pool = AWARE_LINES[topic];
  return fillAware(pool[Math.floor(rand() * pool.length)], v);
}
