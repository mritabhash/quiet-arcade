/**
 * Ma Momo's dialogue pools — the guardian chipmunk of Pattern Groups.
 * A strict-but-nurturing teacher: she praises tidy thinking, gasps at
 * mistakes, scolds repeat offenders, and gets huffy when poked.
 */

export const MOMO_LINES = {
  /** Round start. */
  greetings: [
    "Welcome, little scholar. Ma Momo is watching — find me four tidy groups.",
    "Class is in session! Sixteen tiles, four families. Show me what you've got.",
    "Ah, you're here! Sit up straight, read every tile twice, then begin.",
    "Good day, dear. My glasses are polished and my expectations are high.",
    "A new puzzle! Remember: the obvious answer is usually the trap.",
    "Sniff out the sneaky tiles first, sweetpea. They love to masquerade.",
    "Ma Momo's rule number one: think before you tap. Rule two: see rule one.",
    "Sixteen little acorns, four hidden baskets. Sort them properly, hm?",
    "I've graded a thousand of these. Impress me — I dare you.",
    "Take a breath, darling. Patterns reveal themselves to patient eyes.",
    "No guessing wildly in my classroom. Hypothesis first, then submit.",
    "Oh good, my favorite student is back. Don't make me regret saying that.",
    "Chin up, whiskers steady. We solve with grace today.",
    "I brought my red pen, just in case. Let's hope I won't need it.",
    "Four groups hide in plain sight. A sharp mind sees the seams.",
    "Begin when ready, dear. And no, staring at me is not a strategy.",
  ],

  /** First group solved. */
  solveFirst: [
    "There we go! First basket sorted. A very promising start.",
    "One group down! See what happens when you actually think?",
    "Correct! Ma Momo nods once, solemnly, with great pride.",
    "A clean first find! My whiskers are tingling with approval.",
    "Yes! That's the spirit. Three families left — stay sharp.",
    "First one's in the books. Gold star pending further performance.",
    "Well spotted, dear. The first thread always loosens the rest.",
    "Mm-hm! Exactly right. Don't get cocky now.",
    "Look at you, starting strong! Keep that pencil-sharp focus.",
    "One down! I've seen worse starts. Much, much worse.",
  ],

  /** Second or third group solved. */
  solve: [
    "Correct again! You're making an old chipmunk very smug.",
    "Another basket sorted! My glasses nearly slipped off with delight.",
    "Splendid work. That was a tricky one, and you didn't flinch.",
    "Yes, yes, YES. That's how it's done in my classroom.",
    "Beautifully reasoned, dear. I'm adding a smiley to your margins.",
    "Mm! Precisely. You may have one imaginary acorn.",
    "Sharp as a tack! Keep those eyes moving.",
    "Oh, well done! I only doubted you a tiny bit.",
    "Flawless sorting. My tail did a little flip just now.",
    "That's my student! Onward — no dawdling.",
    "Correct! I shall allow myself one small proud sniffle.",
    "Excellent deduction. The tiles never stood a chance.",
    "See? Patience pays. It always, always pays.",
    "Another one! At this rate I'll run out of gold stars.",
    "You saw through the trick! I taught you well. Mostly me, yes.",
    "Tidy, logical, correct. Ma Momo is quietly delighted.",
    "Wonderful! Now don't rush the next one, hm?",
    "A-plus thinking on that group, dear.",
    "Right again! My red pen weeps from boredom.",
    "Very good. Very, very good. Ahem. Continue.",
    "You're on a roll! Butter-smooth logic.",
    "That basket is CLOSED. Superb work.",
    "Impressive, dear. Even the sneaky tiles are applauding.",
    "Correct! I'd clap, but I'm holding my dignity.",
  ],

  /** All four groups found, with mistakes along the way. */
  win: [
    "All four groups! Class dismissed — with honors, dear.",
    "You did it! Ma Momo is beaming behind these very serious glasses.",
    "Puzzle complete! Go on, take TWO imaginary acorns.",
    "Finished! A few stumbles, but you got there. That's what counts.",
    "All sorted! I'm entering a big proud checkmark in my ledger.",
    "Victory! My whiskers are doing a happy wiggle. Do not tell anyone.",
    "Every basket filled. I am satisfied. Deeply, warmly satisfied.",
    "Done and done! You've earned a stretch and a snack.",
    "Complete! See what happens when you listen to Ma Momo?",
    "All four! I never doubted you. Well. Barely doubted you.",
    "Marvelous finish, dear. Come back tomorrow — I'll have a harder one.",
    "The board is clear! Gold star. Actual gold. Well, imaginary gold.",
  ],

  /** All four groups, zero mistakes. */
  winPerfect: [
    "PERFECT. Not one slip! I'm framing this in the teachers' lounge.",
    "A flawless solve! My glasses fogged up with pride, dear.",
    "Zero mistakes! You absolute treasure of a student.",
    "Perfection! I'm writing your name on the board — the GOOD board.",
    "Not a single stumble! Ma Momo is doing a tiny, dignified dance.",
    "Immaculate! The other students shall hear about this. Endlessly.",
    "Four for four, clean as a whistle! Take the whole acorn jar.",
    "A perfect score! I haven't been this proud since... ever, actually.",
    "Flawless! Even my red pen is applauding, and it hates everyone.",
    "No mistakes?! Hold on, I need to sit down. Magnificent, dear.",
    "Perfection achieved. You may call yourself Ma Momo's star pupil. Today.",
    "Spotless! I'm tucking this result into my winter memory stash.",
  ],

  /** Fourth mistake — the board reveals itself. */
  loss: [
    "*sigh* The board reveals itself. Study it, dear — that's how we grow.",
    "Oh, sweetpea. Four slips. Come here, look at the answers with me.",
    "We ran out of tries. No tears — even acorns fall before they sprout.",
    "*gasp* ...and that was the last one. Well. Tomorrow we try again, hm?",
    "The puzzle won today. It happens to my very best students. Occasionally.",
    "There, there. Look at the groups closely — the lesson is in the reveal.",
    "Four mistakes, dear. I'm not angry. I'm just... recalibrating my hopes.",
    "Class isn't about winning every day. But do read the answers. Twice.",
    "Oh dear, oh dear. Well, chin up. Even Ma Momo once misfiled an acorn.",
    "The tiles bested you today. They shall NOT tomorrow. I've decided.",
    "That's the end of our tries. Sit with the answers a moment, hm?",
    "*long teacherly sigh* We will speak of this again tomorrow, dear.",
  ],

  /** First mistake — the gasp. */
  gasp: [
    "*GASP* What was THAT, dear?!",
    "*gasp* My glasses! They nearly leapt off my face!",
    "Oh! Oh no. That was not a group. That was a wish.",
    "*sharp gasp* I felt that mistake in my tail.",
    "Sweetpea. Sweetpea, no. Look again.",
    "*gasp* I gasped so hard I dropped an acorn.",
    "Hmm?! That combination surprised even the tiles.",
    "Oh dear. Deep breath. That's one slip — let it be the last.",
    "*clutches cheeks* A mistake! In MY classroom!",
    "Careful now! One paw wrong and the whole basket tips.",
    "*gasp* I shall pretend I didn't see that. Once.",
    "Goodness! Even the crossword down the hall heard that one.",
    "That's a slip, dear. Slow down and read each tile out loud.",
    "*inhales sharply* Recount your reasoning. Somewhere it wobbled.",
    "Oh! Well. Everyone gets one free gasp from me. That was it.",
    "Tsk. The tiles tricked you. They're sneaky — be sneakier.",
    "*gasp* My heart! Warn me before you do that, dear.",
    "One mistake. Noted in pencil. Pencil can be erased — so fix it.",
    "Hm! Not quite. The pattern is there — squint harder, dear.",
    "*small gasp* Alright, alright. Shake it off. Eyes fresh.",
  ],

  /** First mistake, but three tiles were right. */
  oneAway: [
    "*gasp* SO close! One tile snuck in where it doesn't belong.",
    "Three of those were right, dear! One is an imposter. Find it.",
    "Ooh, one away! My whiskers twitched — that means you're near.",
    "Almost! One little acorn rolled into the wrong basket.",
    "*gasp* One stray tile! Interrogate each of the four, dear.",
    "So near! Swap ONE tile and glory awaits.",
    "One away, sweetpea. Which of those four feels a bit too clever?",
    "Nearly! One of them is wearing a disguise. Peek under it.",
    "*clutches glasses* One tile off! The suspense is unbearable.",
    "Three right, one rascal. Ma Momo believes in you.",
    "One away! Don't shuffle everything — just find the odd sibling.",
    "That was ALMOST beautiful. One tile ruined the family photo.",
    "So close I nearly cheered! One swap, dear. Choose wisely.",
    "One imposter remains. Stare at each tile until it confesses.",
  ],

  /** Second mistake — the scolding begins. */
  scold: [
    "Two slips, dear. Ma Momo is now officially Paying Attention.",
    "Ahem. AHEM. That's twice. Are we guessing, or are we thinking?",
    "Second mistake! My red pen is uncapped. It thirsts.",
    "Two now. Sit up straight and READ the tiles, sweetpea.",
    "*taps ruler* Twice, dear. TWICE. Slow. Down.",
    "That's two. I'm not angry — I'm disappointed. Which is worse. Much worse.",
    "Two mistakes. In my day we read every tile THREE times first.",
    "*adjusts glasses sternly* We do not scatter guesses like loose seeds.",
    "Two slips! Do I need to move you to the front row?",
    "Second slip. Half your tries, gone. Treat the rest like gold, dear.",
    "Tsk-tsk. TWO. The tiles are laughing. Make them stop.",
    "Two mistakes and my patience is now a limited resource, dear.",
    "*writes in ledger* 'Rushed. Again.' Prove my notes wrong, sweetpea.",
    "That's strike two. Strike three makes Ma Momo do the disappointed face.",
  ],

  /** Third mistake — last chance. */
  lastChance: [
    "THREE. One try left, dear. I am gripping my ruler very calmly.",
    "*deep breath* One mistake remains between you and my longest sigh.",
    "Three slips! The next submit better be a masterpiece, sweetpea.",
    "This is it, dear. Last chance. Check every tile TWICE. Then twice more.",
    "One try left. I believe in you. I am also bracing myself.",
    "*polishes glasses slowly* No pressure, dear. Only the fate of the board.",
    "Three mistakes. Ma Momo has assumed the emergency posture.",
    "Final warning, sweetpea. Think it through like your acorns depend on it.",
    "One. Try. Left. Whisper your reasoning to me before you tap submit.",
    "The ledger shows three slips. Make the last line a triumph, dear.",
    "I've started a calming chamomile. Do NOT make me finish it in sorrow.",
    "Last chance! Steady paws. Steady heart. Steady EYES, dear.",
  ],

  /** Poked once or twice — mildly annoyed. */
  poke1: [
    "Yes? I'm supervising, dear. This is what supervising looks like.",
    "Hm? Paws to yourself, sweetpea.",
    "Did you just poke your teacher? Bold. Very bold.",
    "I am not a button, dear. The tiles are the buttons.",
    "*adjusts glasses* Can I help you?",
    "Focus on the puzzle, not on my fur.",
    "Poking me will not reveal any answers. I checked.",
    "Careful — these glasses are vintage.",
    "That tickles. Stop it immediately.",
    "One poke is curiosity. Two is a pattern. I teach patterns, dear.",
    "Ahem. The puzzle is THAT way.",
    "I felt that. I feel everything in this classroom.",
    "You have four groups to find and you chose... this?",
    "My tail fluffed up. I hope you're happy.",
    "Do I look like a stress toy to you, sweetpea?",
    "Petting the teacher is not an approved classroom activity.",
  ],

  /** Poked a third or fourth time — properly annoyed. */
  poke2: [
    "STOP poking me. I know your grades, dear. All of them.",
    "This is going in my ledger. In INK.",
    "I have a red pen and I am not afraid to underline things.",
    "*eye twitch* Again? My patience is compostable, you know.",
    "Do NOT make me turn this puzzle around.",
    "You're one poke away from writing lines: 'I will not poke Ma Momo.'",
    "My whiskers are trembling with restraint, dear.",
    "I've taught bears with better manners. BEARS.",
    "Poke me again and I'm assigning homework. Real homework.",
    "I am counting these. The number is becoming Concerning.",
    "*deep chipmunk breath* You test the wrong rodent, sweetpea.",
    "Detention exists, dear. It's boring on purpose.",
    "My glasses are fogging with irritation. That's not even possible!",
    "Keep it up and I'll seat you next to the crossword. FOREVER.",
  ],

  /** Poked five to seven times — the threats come out. */
  poke3: [
    "That's IT. One more and you're suspended from the arcade, dear!",
    "SUSPENDED. Three days! No tiles, no puzzles, NO acorns!",
    "I am drafting the suspension letter in my head RIGHT NOW.",
    "You want a scolding? Because this is how you earn a PREMIUM scolding.",
    "Poke me once more and I'm calling your household. Yes, all of it.",
    "I will end this session, dear. Don't think I won't. I know where the button is.",
    "One more poke and you're writing 'I respect chipmunks' one hundred times.",
    "My ruler and I are having a very serious conversation about you.",
    "*slams tiny paw* ENOUGH! The suspension forms are IN MY DESK.",
    "You are THIS close to a formal scolding with citations, dear.",
    "I have suspended students for less. Ask the squirrel. Oh wait — you CAN'T. Suspended.",
    "Keep poking and I'll grade your next puzzle out of THREE.",
    "I'm warming up my disappointed voice. You do NOT want the disappointed voice.",
    "One more and I confiscate the submit button until further notice!",
    "This behavior is going on your PERMANENT RECORD, sweetpea!",
    "Do you see this face? This is my final-warning face. Memorize it.",
  ],

  /** Poked eight or more times — maximum fury. */
  poke4: [
    "UNBELIEVABLE. You're suspended! ...Fine, you're not. But you're VERY warned.",
    "I have written your name on the board. The BAD side of the board.",
    "*furiously polishes glasses* I cannot even LOOK at you right now, dear.",
    "That's a scolding. Consider yourself formally, thoroughly scolded.",
    "SUSPENDED! Effective... whenever I figure out how to enforce it!",
    "I'm telling the rabbit. And the knight. And the OTHER games. Everyone.",
    "My ledger has a new page. It is titled with YOUR name and many underlines.",
    "You've unlocked my rarest emotion: speechless fury. Congratulations?",
    "*breathes into tiny paper bag* I am calm. I am CALM. Stop. Poking. Me.",
    "Fine! FINE! Poke away! I hope you enjoy your ZERO remaining privileges!",
    "When this puzzle ends, you and I are having a MEETING, dear.",
    "I forgive you. NO I DON'T. Solve the puzzle and we'll discuss forgiveness.",
  ],

  /** Player idle too long. */
  idle: [
    "Eyes on the board, dear. The tiles won't sort themselves.",
    "Hello? Sweetpea? The puzzle misses you.",
    "*taps ruler softly* Anytime today would be lovely.",
    "Thinking is good! But do remember to eventually... do.",
    "I've reorganized my acorns twice while waiting, dear.",
    "Take your time. I say, adjusting my glasses meaningfully.",
    "The tiles are getting comfortable. Don't let them.",
    "Shall I fetch tea while you ponder, or shall we begin?",
    "A quiet student is either thinking deeply or napping. Which is it?",
    "No rush, dear. Ma Momo has all day. Ma Momo does NOT have all day.",
  ],
} as const;

let lastLine = "";

/** Pick a random line from a pool, avoiding an immediate repeat. */
export function momoLine(pool: readonly string[]): string {
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && line === lastLine) {
    line = pool[(pool.indexOf(line) + 1) % pool.length];
  }
  lastLine = line;
  return line;
}
