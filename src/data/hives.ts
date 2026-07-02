/**
 * Letter Hive sets. Each hive has 7 letters (center must appear in every word),
 * one pangram using all 7, and a curated list of accepted words.
 * Letters may be reused within a word.
 */

export interface Hive {
  center: string;
  outer: [string, string, string, string, string, string];
  pangram: string;
  words: string[];
}

export const HIVES: Hive[] = [
  {
    center: "A",
    outer: ["G", "R", "D", "E", "N", "S"],
    pangram: "GARDENS",
    words: [
      "AGENDA", "AGENDAS", "AREA", "AREAS", "ARENA", "ARENAS", "DARE", "DARES", "DARN", "DARNS",
      "DEAD", "DEAN", "DEANS", "DEAR", "DEARS", "DANGER", "DANGERS", "DRAG", "DRAGS", "DREAD",
      "DREADS", "EARN", "EARNS", "ERAS", "GANDER", "GANDERS", "GARAGE", "GARAGES", "GARDEN",
      "GARDENS", "GRADE", "GRADES", "GRAND", "GREASE", "NEAR", "NEARS", "RAGE", "RAGES", "RANGE",
      "RANGED", "RANGES", "READ", "READS", "SAGA", "SAGAS", "SAGE", "SAGES", "SAND", "SANE",
      "SANER", "SANG", "SEDAN", "SEDANS", "SNARE", "SNARED"
    ],
  },
  {
    center: "T",
    outer: ["M", "O", "U", "N", "A", "I"],
    pangram: "MOUNTAIN",
    words: [
      "AMOUNT", "ANOINT", "ATOM", "AUNT", "AUTO", "AUTOMATON", "INTO", "INTUIT", "IOTA", "MANTA",
      "MATT", "MINT", "MOAT", "MOTION", "MOUNT", "MOUNTAIN", "MUTANT", "MUTATION",
      "MUTTON", "NATION", "NOTION", "TAINT", "TAUNT", "TAUT", "TINT", "TITAN", "TITANIUM",
      "TOMATO", "TOUT", "TUITION", "TUNA", "UNIT", "UNTO"
    ],
  },
  {
    center: "E",
    outer: ["T", "H", "R", "M", "A", "L"],
    pangram: "THERMAL",
    words: [
      "ALERT", "ALTER", "EARTH", "HALE", "HALTER", "HAMLET", "HARE", "HATER", "HATTER", "HEAL",
      "HEALTH", "HEART", "HEATER", "HELM", "LAME", "LATE", "LATER", "LATHER", "LEATHER", "LETTER",
      "MALE", "MARE", "MATE", "MATTER", "MEAL", "MEAT", "MELT", "METAL", "METTLE", "RATE",
      "RATTLE", "REAL", "REALM", "TAMALE", "TAME", "TEAL", "TEAM", "TERM", "THEME", "THERE",
      "THERMAL", "THREE", "TREAT", "TREE"
    ],
  },
  {
    center: "A",
    outer: ["P", "L", "S", "T", "I", "C"],
    pangram: "PLASTIC",
    words: [
      "ATLAS", "CAPITAL", "CAPITALS", "CAST", "CASTS", "CATS", "CLAP", "CLAPS", "CLASP", "CLASS",
      "ITALICS", "LAST", "LASTS", "PACT", "PACTS", "PAIL", "PAILS", "PASCAL", "PASTA", "PLAIT",
      "PLAITS", "PLASTIC", "SAIL", "SAILS", "SALT", "SALTS", "SLAP", "SLAPS", "SPATIAL", "SPLAT",
      "TACT", "TAIL", "TAILS", "TALC", "TAPS"
    ],
  },
  {
    center: "O",
    outer: ["C", "U", "N", "S", "E", "L"],
    pangram: "COUNSEL",
    words: [
      "CELLO", "CLONE", "CLONES", "CLOSE", "COCOON", "COCOONS", "COLON", "COLONS", "CONE",
      "CONES", "CONSOLE", "CONSOLES", "COUNSEL", "COUNSELS", "LESSON", "LESSONS", "LOOSE",
      "LOUSE", "NOOSE", "NOSE", "NOSES", "NOUN", "NOUNS", "ONCE", "OUNCE", "OUNCES", "SCONE",
      "SCONES", "SOLE", "SOLES", "SOLO", "SOLOS", "SOON", "SOUL", "SOULS"
    ],
  },
  {
    center: "R",
    outer: ["E", "A", "D", "I", "N", "G"],
    pangram: "READING",
    words: [
      "DARE", "DARING", "DEAR", "DINER", "DINNER", "DRAIN", "DREAD", "EARN", "EARRING", "GANDER",
      "GARDEN", "GEAR", "GRADE", "GRADER", "GRAIN", "GRAND", "GRENADE", "GRIN", "GRIND", "NADIR",
      "NEAR", "RAGE", "RAID", "RAIN", "RANG", "RANGE", "RANGED", "RARE", "READ", "READING",
      "REAR", "REGAIN", "REIGN", "REIN", "RIDE", "RIDING", "RIND", "RING", "RINGED"
    ],
  },
];

export const HIVE_RANKS = [
  { name: "Grain of sand", frac: 0 },
  { name: "Pebble", frac: 0.1 },
  { name: "Breeze", frac: 0.25 },
  { name: "Oasis", frac: 0.4 },
  { name: "Radiant", frac: 0.6 },
  { name: "Hive mind", frac: 0.85 },
] as const;
