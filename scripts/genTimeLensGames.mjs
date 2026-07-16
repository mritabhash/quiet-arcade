// Generates the Time Lens puzzle dataset: TARGET unique six-event puzzles,
// each a tuple of six indices into TIME_EVENTS (src/data/events.ts).
//
// Every event in the pool has a unique year, so any six distinct indices form
// an unambiguous chronological ordering. Combinations are deduplicated by their
// sorted index set, so no two puzzles share the same six events.
//
//   node scripts/genTimeLensGames.mjs
//
// Deterministic: re-running produces the identical dataset.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TARGET = 10000;
const EVENTS_PER_GAME = 6;
const SEED = 19110412; // stable seed — regenerating gives the identical dataset

// mulberry32, matching src/lib/random.ts
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Count events in the pool by parsing the source (avoids importing TS).
const eventsSrc = readFileSync(join(root, "src/data/events.ts"), "utf8");
const poolSize = (eventsSrc.match(/\{\s*year:/g) || []).length;

if (poolSize < EVENTS_PER_GAME) {
  throw new Error(`Pool too small: ${poolSize} events`);
}

// C(poolSize, EVENTS_PER_GAME)
const maxCombos = (() => {
  let num = 1;
  let den = 1;
  for (let i = 0; i < EVENTS_PER_GAME; i++) {
    num *= poolSize - i;
    den *= i + 1;
  }
  return Math.round(num / den);
})();

const target = Math.min(TARGET, maxCombos);
if (target < TARGET) {
  console.warn(`Pool of ${poolSize} yields only ${maxCombos} unique games; capping at ${target}.`);
}

const rng = mulberry32(SEED);
const seen = new Set();
const games = [];

while (games.length < target) {
  const chosen = new Set();
  while (chosen.size < EVENTS_PER_GAME) {
    chosen.add(Math.floor(rng() * poolSize));
  }
  const tuple = [...chosen].sort((a, b) => a - b);
  const key = tuple.join(",");
  if (seen.has(key)) continue;
  seen.add(key);
  games.push(tuple);
}

const lines = games.map((t) => `  [${t.join(",")}],`).join("\n");
const out = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node scripts/genTimeLensGames.mjs\` to regenerate.
 *
 * ${games.length} unique Time Lens puzzles. Each entry is a tuple of six
 * indices into TIME_EVENTS (src/data/events.ts), drawn from a pool of
 * ${poolSize} events. No two puzzles share the same six events.
 */

export const TIME_LENS_GAMES: readonly (readonly number[])[] = [
${lines}
];
`;

writeFileSync(join(root, "src/data/timeLensGames.ts"), out);
console.log(`Wrote ${games.length} games (pool ${poolSize}) to src/data/timeLensGames.ts`);
