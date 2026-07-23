import type { GameMeta } from "../types";

export const GAMES: GameMeta[] = [
  {
    id: "map-drop",
    title: "Map Drop",
    short: "Use short clues to drop your marker as close as possible to the mystery location.",
    description:
      "One hidden place, seven short hints — weather, food, scripts, festivals. Drop your pin early for the full 5,000 points, or trade the ceiling for certainty while a small rabbit judges your bravery.",
    minutes: "~4 min",
    difficulty: "Medium",
    type: "Geography",
    accent: "teal",
    flagship: true,
    freePlayLabel: "Play another Map Drop",
    howTo: [
      "Pick a difficulty: Novice tells you the place's name outright — you just have to find it; Easy deals five distinct photo clues; Moderate is a five-round street-view hunt — look around a real Mapillary street, then drop your pin; Hard deals seven cryptic hints one at a time.",
      "Extra clues lower the round's ceiling — on Novice one 2,000-point reveal says where it sits; each extra photo costs 150 on Easy; on Hard every reveal drops it. Moderate scores each of its five rounds purely by how close your pin lands.",
      "Click or drag on the map to place your pin, then press Confirm drop.",
      "Closer pins keep more points: within 25 km is a bullseye, and any pin under 1,500 km always banks at least a tenth of the ceiling.",
    ],
  },
  {
    id: "trivia",
    title: "Trivia",
    short: "Fifteen questions, nine topics, three moods — from a vault of ninety thousand.",
    description:
      "The arcade's deepest vault: around ninety thousand questions across history, geography, flags, countries, movies & TV, pop culture, tech, science, and the cosmos. Pick a topic or mix them, choose easy, moderate, or hard, pack a lifeline or three, and let the points pile up.",
    minutes: "~5 min",
    difficulty: "Medium",
    type: "Trivia",
    accent: "gold",
    howTo: [
      "Pick a topic (or Misc for a blend), a mode, and your lifelines — easy packs 1, moderate 2, hard 3.",
      "Fifteen questions, four options each. Later questions are worth more, and a streak of three or more adds bonus points.",
      "Lifelines, once per round: 50-50 clears two wrong options, Plus One grants a second guess, Topic Swap trades the question, Host Hint drops a clue.",
      "Misses never subtract points. The daily round is the same for everyone with your setup; free play draws fresh questions.",
    ],
  },
  {
    id: "time-capsule",
    title: "Time Capsule",
    short: "Study a mysterious scene and guess where and when it belongs.",
    description:
      "An archive card surfaces from the vault: a scene, a handful of clues, and no date. Pin the place on the map, pick the decade, and see how sharp your inner historian really is.",
    minutes: "~4 min",
    difficulty: "Medium",
    type: "Geography",
    accent: "gold",
    flagship: true,
    freePlayLabel: "Try a random Time Capsule",
    howTo: [
      "Read the archive card and the first three clues.",
      "Reveal extra clues if you must — each costs 50 bonus points.",
      "Drop a pin where the scene belongs, then pick a decade (or era).",
      "Score comes from location accuracy, time accuracy, and clues saved.",
    ],
  },
  {
    id: "borderline",
    title: "Borderline",
    short: "Guess the hidden place using borders, distance, climate, population, and regional clues.",
    description:
      "A place is hiding. Every guess returns clean clue chips — distance, direction, borders, climate, population, coastline — until you corner it or run out of guesses. The feedback loop is the whole game.",
    minutes: "~5 min",
    difficulty: "Tricky",
    type: "Geography",
    accent: "sage",
    flagship: true,
    freePlayLabel: "Play Borderline Free Mode",
    howTo: [
      "Type any country, region, city, or island and pick it from the list.",
      "Read the clue chips: distance, direction, borders, climate, population, coast.",
      "Use them to narrow the field — you have six guesses.",
      "Fewer guesses, higher score. First-guess solves are perfect rounds.",
    ],
  },
  {
    id: "word-grid",
    title: "Daily Word Grid",
    short: "Six tries to find the five-letter word.",
    description:
      "Guess the hidden five-letter word in six tries. Every guess warms the grid — gold means right letter, wrong place; terracotta means perfect.",
    minutes: "~4 min",
    difficulty: "Medium",
    type: "Words",
    accent: "clay",
    howTo: [
      "Type a real five-letter word and press Enter.",
      "Terracotta tiles are correct letters in the correct spot.",
      "Gold tiles are in the word but somewhere else.",
      "Faded tiles are not in the word at all. You have six tries.",
    ],
  },
  {
    id: "pattern-groups",
    title: "Pattern Groups",
    short: "Sort sixteen tiles into four hidden groups.",
    description:
      "Sixteen carved tiles, four secret connections. Select four tiles that belong together — but watch out, some tiles fit more than one pattern.",
    minutes: "~5 min",
    difficulty: "Tricky",
    type: "Logic",
    accent: "sage",
    howTo: [
      "Select four tiles you think share a connection, then press Submit.",
      "Solve all four groups before you run out of four mistakes.",
      "If exactly one tile is wrong, you'll get a gentle 'one away' nudge.",
    ],
  },
  {
    id: "mini-crossword",
    title: "Mini Crossword",
    short: "A tiny 5×5 crossword you can finish with coffee.",
    description:
      "A pocket-sized crossword where every row and every column is a word. Checks are allowed, but the cleanest solves score highest.",
    minutes: "~4 min",
    difficulty: "Medium",
    type: "Words",
    accent: "gold",
    howTo: [
      "Click a cell and type. Click the active cell again to switch between Across and Down.",
      "Use Check to mark wrong letters (costs 2 points each use).",
      "Use Reveal on a stuck cell (costs 5 points).",
      "The puzzle completes itself the moment every letter is right.",
    ],
  },
  {
    id: "hidden-strands",
    title: "Hidden Strands",
    short: "Six themed words woven into a letter field.",
    description:
      "A theme, a quiet field of letters, and six words hiding in straight lines. Drag across letters to pull each strand out of the sand.",
    minutes: "~4 min",
    difficulty: "Gentle",
    type: "Words",
    accent: "teal",
    howTo: [
      "Read the theme, then find the six hidden words.",
      "Drag from the first letter to the last (or tap the first and last letter).",
      "Words run in straight lines: across, down, or diagonally.",
      "Hints highlight a word's first letter, but cost your perfect.",
    ],
  },
  {
    id: "letter-hive",
    title: "Letter Hive",
    short: "Build words from seven letters around a core.",
    description:
      "Seven stone letters, one glowing core. Make as many words as you can — every word must use the core letter, and one hidden word uses all seven.",
    minutes: "~6 min",
    difficulty: "Medium",
    type: "Words",
    accent: "gold",
    howTo: [
      "Build words of four letters or more. Letters can repeat.",
      "Every word must include the glowing core letter.",
      "Longer words score more. The pangram (all seven letters) is worth a big bonus.",
      "Climb the ranks, then press 'Finish day' to bank your score.",
    ],
  },
  {
    id: "globe-hunt",
    title: "Globe Hunt",
    short: "Name the country from a trail of clues.",
    description:
      "A mystery country reveals itself one clue at a time — continent, story, colors, capital. The fewer clues you need, the brighter your score.",
    minutes: "~4 min",
    difficulty: "Medium",
    type: "Trivia",
    accent: "sage",
    howTo: [
      "Read the first clue and type your guess.",
      "Wrong guesses reveal the next clue, and each clue lowers the round's value.",
      "Three countries per day. Guessing on clue one earns 5 points.",
    ],
  },
  {
    id: "country-shape",
    title: "Country Shape",
    short: "Recognise a country by its silhouette alone.",
    description:
      "Eight true silhouettes lifted straight from the world map, four names each. No borders, no labels — just the quiet shape of a place you may know by heart.",
    minutes: "~3 min",
    difficulty: "Gentle",
    type: "Geography",
    accent: "clay",
    howTo: [
      "Look at the carved silhouette and pick the matching country.",
      "Outlines are real but simplified, and every country is scaled to fit — trust the shape, not the size.",
      "Eight shapes per day, one point each.",
    ],
  },
  {
    id: "time-lens",
    title: "Time Lens",
    short: "Put six moments of history back in order.",
    description:
      "Six events from history, shuffled by the wind. Drag them back into chronological order and see how well your inner timeline holds.",
    minutes: "~3 min",
    difficulty: "Medium",
    type: "Memory",
    accent: "gold",
    howTo: [
      "Drag the event cards (or use the arrow buttons) into order, oldest at the top.",
      "Press 'Set in stone' when the order feels right.",
      "Each event in its true position earns a point.",
    ],
  },
  {
    id: "higher-lower",
    title: "Higher or Lower",
    short: "A calm chain of ten comparisons.",
    description:
      "One fact stands revealed; its challenger keeps a secret number. Feel your way through a chain of ten comparisons — populations, peaks, rivers, and years.",
    minutes: "~3 min",
    difficulty: "Gentle",
    type: "Comparison",
    accent: "clay",
    howTo: [
      "The left card shows its value. The challenger on the right hides one.",
      "Guess whether the challenger's value is higher or lower.",
      "After each reveal, the challenger becomes the new anchor. Ten links per day.",
    ],
  },
  {
    id: "cat-pairs",
    title: "Tile Pairs",
    short: "Flip the cards and match six tiles from a library of ten thousand.",
    description:
      "Twelve face-down cards, six matching pairs beneath — drawn nightly from a library of over ten thousand tiles: desert creatures, charms, and curios. Trust your memory of the sand; every reunion earns one small compliment, free of charge.",
    minutes: "~3 min",
    difficulty: "Gentle",
    type: "Memory",
    accent: "clay",
    howTo: [
      "Flip two cards at a time to look for matching tiles.",
      "Matched pairs stay face up; mismatches quietly turn back over.",
      "Fewer moves means a higher score — nine moves or fewer is a perfect round.",
      "Every match comes with one small compliment, free of charge.",
    ],
  },
  {
    id: "odd-one-out",
    title: "Odd Tile Out",
    short: "Nine tiles, one quiet impostor. Spot it.",
    description:
      "Nine tiles surface from the arcade's library of ten thousand — eight identical, one subtly wrong. A different charm, a missing stripe, a shifted hue. Eight rounds of gentle suspicion.",
    minutes: "~3 min",
    difficulty: "Gentle",
    type: "Logic",
    accent: "teal",
    howTo: [
      "Study the nine tiles — eight are identical, one differs.",
      "The difference is small: a charm, a pattern, a hue, or an aura.",
      "Click the odd tile. Eight tile sets per day, one point each.",
    ],
  },
];

export const GAME_INDEX = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameMeta["id"],
  GameMeta
>;
