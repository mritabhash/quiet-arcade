export interface PatternGroup {
  title: string;
  words: [string, string, string, string];
}

export interface PatternPuzzle {
  /** groups ordered easiest -> hardest */
  groups: [PatternGroup, PatternGroup, PatternGroup, PatternGroup];
}

export const PATTERN_PUZZLES: PatternPuzzle[] = [
  {
    groups: [
      { title: "Seen in a desert", words: ["DUNE", "OASIS", "CACTUS", "MIRAGE"] },
      { title: "Quiet sounds", words: ["WHISPER", "RUSTLE", "MURMUR", "HUSH"] },
      { title: "Shades of green", words: ["SAGE", "OLIVE", "FERN", "MOSS"] },
      { title: "Things with keys", words: ["PIANO", "MAP", "LOCK", "KEYBOARD"] },
    ],
  },
  {
    groups: [
      { title: "Kinds of puzzle", words: ["CROSSWORD", "SUDOKU", "MAZE", "RIDDLE"] },
      { title: "Packed for camp", words: ["LANTERN", "TENT", "COMPASS", "CANTEEN"] },
      { title: "Moon words", words: ["CRATER", "PHASE", "TIDE", "ECLIPSE"] },
      { title: "Famously slow", words: ["SLOTH", "SNAIL", "TORTOISE", "KOALA"] },
    ],
  },
  {
    groups: [
      { title: "Warm colours", words: ["AMBER", "RUST", "CORAL", "OCHRE"] },
      { title: "Breads", words: ["PITA", "RYE", "SOURDOUGH", "BRIOCHE"] },
      { title: "Gentle weather", words: ["DRIZZLE", "BREEZE", "FROST", "HAZE"] },
      { title: "Card games", words: ["BRIDGE", "HEARTS", "SOLITAIRE", "RUMMY"] },
    ],
  },
  {
    groups: [
      { title: "Kinds of tea", words: ["CHAI", "OOLONG", "MATCHA", "SENCHA"] },
      { title: "Desert dwellers", words: ["FENNEC", "GECKO", "CAMEL", "VIPER"] },
      { title: "Things you shuffle", words: ["DECK", "PLAYLIST", "FEET", "TILES"] },
      { title: "Soft fabrics", words: ["VELVET", "FLANNEL", "FLEECE", "CASHMERE"] },
    ],
  },
  {
    groups: [
      { title: "Chess pieces", words: ["ROOK", "KNIGHT", "BISHOP", "PAWN"] },
      { title: "Pottery words", words: ["KILN", "GLAZE", "WHEEL", "CLAY"] },
      { title: "Constellations", words: ["ORION", "LYRA", "DRACO", "PHOENIX"] },
      { title: "Legendary places", words: ["ATLANTIS", "AVALON", "ELDORADO", "CAMELOT"] },
    ],
  },
  {
    groups: [
      { title: "Ways to say quiet", words: ["SILENT", "STILL", "HUSHED", "MUTED"] },
      { title: "Sunset shades", words: ["PEACH", "ROSE", "GOLD", "VIOLET"] },
      { title: "Arcade things", words: ["TOKEN", "CABINET", "JOYSTICK", "HIGHSCORE"] },
      { title: "Stone structures", words: ["ARCH", "PILLAR", "OBELISK", "PLINTH"] },
    ],
  },
  {
    groups: [
      { title: "Great rivers", words: ["NILE", "DANUBE", "GANGES", "AMAZON"] },
      { title: "Tiny amounts", words: ["PINCH", "DASH", "SMIDGE", "TRACE"] },
      { title: "Herb garden", words: ["THYME", "BASIL", "MINT", "ROSEMARY"] },
      { title: "Long stretches of time", words: ["EPOCH", "ERA", "EON", "AGE"] },
    ],
  },
  {
    groups: [
      { title: "Palindromes", words: ["LEVEL", "ROTOR", "KAYAK", "CIVIC"] },
      { title: "Things with rings", words: ["SATURN", "TREE", "PHONE", "CIRCUS"] },
      { title: "Cloud types", words: ["CIRRUS", "CUMULUS", "STRATUS", "NIMBUS"] },
      { title: "Coffee orders", words: ["LATTE", "MOCHA", "CORTADO", "RISTRETTO"] },
    ],
  },
];
