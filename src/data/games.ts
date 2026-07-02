import type { GameMeta } from "../types";

export const GAMES: GameMeta[] = [
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
    id: "map-drop",
    title: "Map Drop",
    short: "Drop a pin where you think the city is.",
    description:
      "Five cities, one quiet stone map. Drop your pin, watch the distance unfold, and learn how far your inner compass drifts.",
    minutes: "~3 min",
    difficulty: "Medium",
    type: "Geography",
    accent: "teal",
    howTo: [
      "A city name appears. Click the map (or use arrow keys + Enter) to drop your pin.",
      "The closer your pin, the more of the 100 points you keep.",
      "Five cities per round. 450+ total is a perfect day.",
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
      "Eight stylised stone silhouettes, four names each. No borders, no labels — just the quiet shape of a place you may know by heart.",
    minutes: "~3 min",
    difficulty: "Gentle",
    type: "Geography",
    accent: "clay",
    howTo: [
      "Look at the carved silhouette and pick the matching country.",
      "Shapes are gently stylised, so trust the overall outline.",
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
];

export const GAME_INDEX = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameMeta["id"],
  GameMeta
>;
