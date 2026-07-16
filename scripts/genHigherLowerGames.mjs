// Generates the Higher or Lower game database: TARGET unique games.
//
// A game is two segments from two different categories, each a chain of six
// items (5 + 5 = 10 comparisons). Each entry is a flat tuple of 14 numbers:
//
//   [catA, a0,a1,a2,a3,a4,a5, catB, b0,b1,b2,b3,b4,b5]
//
// where catA/catB index COMPARISON_CATEGORIES and the item numbers index that
// category's `items` array, in chain order. Every value within a category is
// distinct, so any six item indices form a valid, tie-free chain.
//
// Games are deduplicated by their content (unordered category pair + the SET of
// six items per category), so no two games present the same six-vs-six matchup.
//
//   node scripts/genHigherLowerGames.mjs
//
// Deterministic: re-running produces the identical database.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TARGET = 10000;
const CHAIN = 6;
const SEED = 20260716;

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

// Parse comparisons.ts for category order and item counts (avoids importing TS).
const src = readFileSync(join(root, "src/data/comparisons.ts"), "utf8");
const idMatches = [...src.matchAll(/id:\s*"([^"]+)"/g)];
if (idMatches.length < 2) throw new Error("Could not parse categories");

const itemCounts = idMatches.map((m, i) => {
  const start = m.index;
  const end = i + 1 < idMatches.length ? idMatches[i + 1].index : src.length;
  const block = src.slice(start, end);
  return (block.match(/\{\s*name:/g) || []).length;
});

const catCount = idMatches.length;
const eligible = itemCounts.map((n, i) => (n >= CHAIN ? i : -1)).filter((i) => i >= 0);
if (eligible.length < 2) throw new Error("Need at least two categories with six+ items");

const rng = mulberry32(SEED);

function pickDistinct(count, n) {
  // n distinct indices in [0, count), returned in random order
  const set = new Set();
  while (set.size < n) set.add(Math.floor(rng() * count));
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const seen = new Set();
const games = [];
let guard = 0;

while (games.length < TARGET && guard < TARGET * 200) {
  guard++;
  // two distinct categories
  const catA = eligible[Math.floor(rng() * eligible.length)];
  const catB = eligible[Math.floor(rng() * eligible.length)];
  if (catA === catB) continue;

  const itemsA = pickDistinct(itemCounts[catA], CHAIN);
  const itemsB = pickDistinct(itemCounts[catB], CHAIN);

  // content key: order categories, and sort each item set, so two games with
  // the same matchup (regardless of chain order or side) collapse to one.
  const segA = { c: catA, sorted: [...itemsA].sort((a, b) => a - b).join(".") };
  const segB = { c: catB, sorted: [...itemsB].sort((a, b) => a - b).join(".") };
  const [lo, hi] = segA.c < segB.c ? [segA, segB] : [segB, segA];
  const key = `${lo.c}:${lo.sorted}|${hi.c}:${hi.sorted}`;
  if (seen.has(key)) continue;
  seen.add(key);

  games.push([catA, ...itemsA, catB, ...itemsB]);
}

if (games.length < TARGET) {
  console.warn(`Only produced ${games.length} unique games (pool may be small).`);
}

const lines = games.map((g) => `  [${g.join(",")}],`).join("\n");
const out = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node scripts/genHigherLowerGames.mjs\` to regenerate.
 *
 * ${games.length} unique Higher or Lower games. Each entry is a flat tuple:
 *   [catA, a0..a5, catB, b0..b5]
 * catA/catB index COMPARISON_CATEGORIES (src/data/comparisons.ts); the six
 * numbers after each are item indices into that category, in chain order.
 * No two games present the same six-vs-six matchup.
 */

export const HIGHER_LOWER_GAMES: readonly (readonly number[])[] = [
${lines}
];
`;

writeFileSync(join(root, "src/data/higherLowerGames.ts"), out);
console.log(`Wrote ${games.length} games (${catCount} categories) to src/data/higherLowerGames.ts`);
