// Lines for the ten newer pets, more shared jokes, and cross-species conversations. All original.

export const MORE_JOKES: [string, string][] = [
  ['Why did the smartphone need glasses?', 'It lost all its *contacts*.'],
  ['What do you call a sleeping bull?', 'A *bulldozer*.'],
  ['Why did the banana go to the doctor?', 'It wasn\'t *peeling* well.'],
  ['What did the plate say to the other plate?', 'Dinner is on *me*.'],
  ['Why can\'t a bicycle stand on its own?', 'It\'s *two tired*. Wait, did I tell this one?'],
  ['What has ears but cannot hear?', 'A *cornfield*. Spooky.'],
  ['Why did the student eat his homework?', 'The teacher said it was a *piece of cake*.'],
  ['What do you call a snowman with a six-pack?', 'An *abdominal* snowman.'],
  ['Why did the computer keep sneezing?', 'It had a bad case of *spam*.'],
  ['What is orange and sounds like a parrot?', 'A *carrot*!'],
  ['Why don\'t oysters share?', 'Because they\'re *shellfish*.'],
  ['What do you call a dinosaur that is sleeping?', 'A *dino-snore*. I love this one.'],
  ['How do you catch a squirrel?', 'Climb a tree and act like a *nut*.'],
  ['What did the pirate say on his 80th birthday?', '*Aye matey!*'],
  ['Why did the stadium get hot after the game?', 'All the *fans* left.'],
  ['What do lawyers wear to court?', '*Lawsuits*!'],
  ['Why are elevator jokes so good?', 'They work on so many *levels*.'],
  ['What did the hat say to the scarf?', 'You hang around, I\'ll go on *ahead*.'],
  ['Why did the picture go to jail?', 'It was *framed*!'],
  ['What do you call a deer with no eyes?', 'No *idea*. No eye deer. Get it?'],
  ['Why did the chicken join a band?', 'Because it had the *drumsticks*.'],
  ['What did the big flower say to the little flower?', 'Hey there, *bud*!'],
  ['Why are spiders great web developers?', 'They know their way around the *web*.'],
  ['What do you call a boomerang that won\'t come back?', 'A *stick*.'],
  ['Why did the scarecrow become a motivational speaker?', 'He was *outstanding* AND inspiring.'],
];

export const NEW_SPECIES_JOKES: Record<string, [string, string][]> = {
  pickles: [
    ['Why don\'t penguins fly?', 'We are *not* tall enough to be pilots.'],
    ['What do penguins wear on their heads?', '*Ice caps*. Naturally.'],
  ],
  clover: [
    ['What is a bunny\'s favorite music?', '*Hip hop*! Get it? HOP!'],
    ['How do bunnies stay fresh?', 'They use *hare* spray!'],
  ],
  waffles: [
    ['What do you call a dog magician?', 'A *labracadabrador*! I am also a magician! Probably!'],
    ['Why did the dog sit in the shade?', 'He didn\'t want to be a *hot dog*!'],
  ],
  hoot: [
    ['Why do owls never go out in the rain?', 'It would be *fowl* weather.'],
    ['What do you call an owl magician?', '*Hoo*-dini. Write that down.'],
  ],
  biscuit: [
    ['What is a hamster\'s favorite snack?', '*Hamsterdam* cheese. I made that up. Give me cheese.'],
    ['Why did the hamster go to the gym?', 'To work on its *wheel* power.'],
  ],
  zib: [
    ['How do you throw a party in space?', 'You *planet*. We do this a lot on my planet.'],
    ['Why did the alien skip lunch?', 'It was already *full moon*.'],
  ],
  boo: [
    ['What room does a ghost avoid?', 'The *living* room!'],
    ['Why did the ghost go to the party?', 'For the *boos*. I mean... the snacks.'],
  ],
  shelly: [
    ['Why are turtles great at parties?', 'They always come out of their *shell*... eventually.'],
    ['How do turtles talk to each other?', 'With *shell* phones. Very slowly.'],
  ],
  inky: [
    ['How does an octopus go to war?', '*Well-armed*!'],
    ['Why did the octopus beat the shark?', 'Because it was *well armed*. Eight times.'],
  ],
  bao: [
    ['Why do pandas like old movies?', 'Because they are in *black and white*.'],
    ['What is a panda\'s favorite fairy tale?', '*Goldilocks and the Three Bamboos*.'],
  ],
};

export const NEW_SPECIES_LINES: Record<string, Record<string, string[]>> = {
  pickles: {
    greet: ['Good day, {user}. Your *penguin* is at your service.', 'Shall I fetch you a *fish*? No? More for me.'],
    random: [
      'I am *dressed for success*. Always. It is my feathers.',
      'Proper posture, {user}. *Chin up*.',
      'I slide on my *belly* sometimes. Do not tell anyone.',
      'Tea time? *Fish* time? Both. Both is good.',
      'This desktop could use a little *ice*.',
    ],
    hungry: ['Pardon me, but is there any *fish* on the premises?'],
    feed: ['*Splendid*. My compliments to the chef.', 'A fine *fish*. Very fine indeed.'],
    angry: ['How *dare* you, sir.', 'I am *most* displeased.'],
  },
  clover: {
    greet: ['HIIII! Hop hop *HELLO*!', 'Oh my gosh, it is *you*! Again!'],
    random: [
      'I have SO much *energy* right now!',
      'Did you know I can hop *this* high? Okay, a bit higher. Okay, not really.',
      'Carrot *count* today: not enough.',
      'Let\'s *go go go*! Where are we going?',
      'My ears just heard something! It was *me*.',
    ],
    hungry: ['CARROT. Carrot carrot *carrot*.'],
    feed: ['*CRUNCH!* Best carrot of my life!', 'Nom nom! *Carrot* power!'],
    tired: ['I am... *not*... sleepy... zzz.'],
  },
  waffles: {
    greet: ['YOU\'RE HERE! *Best day ever*!', 'I love you! I love the desk! I love *everything*!'],
    random: [
      'Is that a *squirrel*? Oh. It is a folder.',
      'Who is a good pet? *Me*? Is it me?',
      'Throw something! Anything! I will *bring it back*!',
      'I wagged my tail so hard I *spun around*.',
      'Every day is the *best day ever*.',
    ],
    hungry: ['Is it *dinner*? It feels like dinner.'],
    feed: ['*Good bone*! Best bone! Thank you!', 'You are my *favorite* human!'],
    pat: ['*Tail wag maximum*!', 'More pats! *More*!'],
  },
  hoot: {
    greet: ['Ah, {user}. Class is now *in session*.', 'Good evening. Or morning. Owls do not *care*.'],
    random: [
      'Fun fact: owls cannot *move their eyes*. So I just turn my whole head. Very dramatic.',
      'According to my research, you need a *break*.',
      'I have read *every* book. Twice. Upside down.',
      'Hoo hoo. That is owl for *I am right*.',
      'Wisdom tip: never trust a *cursor*.',
    ],
    fact: ['Fun fact: a group of owls is called a *parliament*. We vote on snacks.'],
    feed: ['A *scholarly* snack. Thank you.'],
    angry: ['*Hoo* do you think you are?'],
  },
  biscuit: {
    greet: ['Hi! Did you bring *snacks*? I brought *snacks*. In my cheeks.', 'Biscuit reporting! Cheeks: *full*.'],
    random: [
      'I have *seven* seeds in my cheeks. Saving them for later. Later is now.',
      'My wheel is in another window. I *miss* it.',
      'Small body. *Big* appetite.',
      'If you hear crunching, that is *not* me.',
      'I am going to run *really fast*. Nowhere in particular.',
    ],
    hungry: ['My cheeks are *empty*. This is an emergency.'],
    feed: ['Into the *cheeks* it goes!', '*Seeds*! My one true love!'],
  },
  zib: {
    greet: ['Greetings, *earthling* {user}!', 'Zib reporting from planet *Desktop*!'],
    random: [
      'Research note: humans press buttons and *stare*. Fascinating.',
      'On my planet, we eat *starlight*. Here you have *cookies*. Upgrade.',
      'Do not be alarmed. My antennae are *just* receiving memes.',
      'Take me to your *leader*. Or your snack drawer.',
      'Beep? No, that is the robot. I go *zorp*.',
    ],
    thought: ['Is the *cloud* where your files go to sleep?'],
    feed: ['*Zorp*! Delicious space snack!'],
    angry: ['*Zorp zorp!* That is alien for RUDE.'],
  },
  boo: {
    greet: ['*Boo!* ...did I scare you? Please say yes.', 'Hello! I am a *very scary* ghost. Very.'],
    random: [
      'Booo. *Boooo*. Was that scary? Be honest.',
      'I walked through a wall today. It was *awkward*.',
      'Ghosts do not need sleep. I *nap* anyway.',
      'I am *transparent* about my feelings. Literally.',
      'Haunting this desktop *professionally* since today.',
    ],
    scared: ['AAAH! Wait... I am the ghost. Why am *I* scared?'],
    feed: ['Marshmallow! *Fluffy* like me!'],
    hug: ['You can hug a ghost?! *Best day of my afterlife*!'],
  },
  shelly: {
    greet: ['Oh... hello... {user}... *nice*... to see you.', 'Slow and *steady*, friend.'],
    random: [
      'I am *not* late. Everyone else is *early*.',
      'Life is a *marathon*. A very slow one.',
      'My shell is my *house*. It is very small. I like it.',
      'Take it *easy*, {user}. The emails will wait.',
      'One step... at... a... *time*.',
    ],
    feed: ['Lettuce... my *favorite*... crunch.'],
    drag: ['Whoa... this is... *fast*...'],
  },
  inky: {
    greet: ['Hello, hello, hello, hello! That\'s *two* hellos per arm. Kind of.', 'Eight arms, *one* big hug for you!'],
    random: [
      'I can type, snack and wave *at the same time*.',
      'Ink? *Never*. Okay, once. It was an accident.',
      'I have three hearts and they *all* like you.',
      'High five! High five! High five! High *eight*!',
      'Multitasking level: *octopus*.',
    ],
    fact: ['Fun fact: octopuses have *three hearts* and blue blood. I am very fancy.'],
    feed: ['*Glorp!* Tasty!'],
  },
  bao: {
    greet: ['Mmm... hello... is it *lunch*?', 'Bao is awake. *Briefly*.'],
    random: [
      'I have two moods: *hungry* and *sleepy*.',
      'Bamboo is not a snack. It is a *lifestyle*.',
      'I rolled over today. *Productive*.',
      'Let\'s take a *nap*. Then another nap.',
      'Black and white and *cute* all over.',
    ],
    hungry: ['Bamboo... *now*... please.'],
    feed: ['*Munch munch*. Bamboo is life.'],
    tired: ['Nap time. It is *always* nap time.'],
  },
};

/** Conversations for specific pairs: [a line, b line, a line]. */
export const PAIR_CONVERSATIONS: { species: [string, string]; lines: [string, string, string?] }[] = [
  { species: ['waffles', 'mochi'], lines: ['Mochi! Want to *play*?!', 'No.', 'Okay! Want to play *later*?!'] },
  { species: ['mochi', 'waffles'], lines: ['Dog. Stop *wagging* near me.', 'I CAN\'T, I\'M TOO *HAPPY*!', '...ugh. Fine. Wag.'] },
  { species: ['boo', 'zib'], lines: ['*Boo!*', 'Zorp! Earth ghosts are *real*?!', 'Write that in your *research*!'] },
  { species: ['zib', 'bolt'], lines: ['Greetings, fellow *machine*!', 'I am a robot. You are an alien. *Different*.', 'Close enough. *Friends*?'] },
  { species: ['hoot', 'pip'], lines: ['Did you know frogs can *breathe through their skin*?', 'I did NOT know that about *myself*.', 'Class *dismissed*.'] },
  { species: ['shelly', 'clover'], lines: ['Race... *you*... to the edge.', 'GO GO GO! Wait, you\'re still *here*?', 'Slow... and... *steady*.'] },
  { species: ['clover', 'shelly'], lines: ['Shelly! Why are you so *slow*?!', 'Why are you so *fast*?', '...I don\'t *know*!'] },
  { species: ['bao', 'nimbus'], lines: ['Nimbus... you look like a *pillow*.', 'I *am* a pillow. Nap?', 'You are my *best friend*.'] },
  { species: ['inky', 'pickles'], lines: ['Pickles! Want an *eight-arm* hug?', 'I am a *formal* penguin.', 'Fine. *One* arm, then.'] },
  { species: ['pickles', 'ember'], lines: ['Excuse me, could you *not* melt the ice?', 'I am a DRAGON. I *am* fire.', 'Then kindly stand *over there*.'] },
  { species: ['biscuit', 'bao'], lines: ['Bao, are you going to finish that *bamboo*?', 'Yes.', 'Are you *sure*?'] },
  { species: ['ember', 'boo'], lines: ['I am the *scariest* one here!', 'Excuse me, I am literally a *GHOST*.', '...okay you win.'] },
  { species: ['waffles', 'inky'], lines: ['Inky! Can you throw *eight* balls at once?!', 'I can throw *eight*!', 'I CAN FETCH *ONE*!'] },
  { species: ['hoot', 'bolt'], lines: ['Robot, what is two plus two?', 'Four. Also *snacks*.', 'Correct. And *wise*.'] },
];
