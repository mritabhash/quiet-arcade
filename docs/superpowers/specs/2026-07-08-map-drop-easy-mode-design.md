# Map Drop Easy Mode — Design

**Date:** 2026-07-08
**Status:** Approved by user (this session)
**Game:** Map Drop (`src/games/MapDrop.tsx`), Quiet Arcade

## Summary

Add an **Easy** difficulty to Map Drop. Instead of the standard seven
evidence-based hints, an easy round deals exactly three hints that identify
the *country* the hidden place belongs to:

1. **Two colours from the country's flag** — e.g. "The flag flies green and gold."
2. **A sentence in the local language** — shown raw and untranslated,
   e.g. *"Onde fica a estação?"*
3. **A unique fact about the country** — hand-written, never naming the country.

The player still has to place the pin at the specific place, so knowing the
country is a strong but not total giveaway.

## How a round plays

- A small **Standard / Easy** segmented toggle sits in the Map Drop header,
  next to the points display. It is available in **both Daily and Free Play**.
- The last-used difficulty persists in localStorage under
  `quietArcade.mapDropDifficulty` (values `"standard" | "easy"`).
- Easy rounds use **progressive reveal**, mirroring the standard mechanic:
  - Round starts with hint 1 (flag colours) revealed.
  - The player may reveal hint 2 (local-language sentence), then hint 3 (fact).
  - Score ceiling per hints revealed: **4,000 → 3,000 → 2,000 pts**
    (`EASY_HINT_POINTS = [4000, 3000, 2000]`, indexed by `revealed - 1`).
    Easy max score is **4,000** (standard stays 5,000).
- Distance scoring is unchanged: full points within 25 km, fading to zero at
  1,500 km (`BULLSEYE_KM` / `FADE_KM`).
- Switching the toggle mid-round resets hint state (revealed count returns to
  the mode's starting value); it does nothing once a drop is confirmed.
- Result screen and share text mark the round:
  - label gains `Easy — n/3 hints` phrasing instead of `n/7 hints`;
  - share lines include `Difficulty: Easy` and `Hints used: n/3`.
- `recordFlagshipRound` receives the easy round's `score`, `max: 4000`,
  `hintsUsed: revealed` (1–3); win threshold stays `dist <= 600`.

## Hint selection (determinism & variety)

Per round, picks are made with `rngFor([api.seed, "easy"])` from the country's
pools:

- a **pair of colours** chosen from the flag's palette (3–4 colours → 3–6 pairs),
- one **sentence** from the country's language pool (~4–6 per language),
- one **fact** from the country's fact pool (4–5 per country).

Daily easy hints are therefore identical for every player on a given date;
free play varies round to round. Combinatorially this yields roughly 75–150
distinct hint triples per country — comfortably over 10,000 across the pool,
satisfying the "big easy-hint variety pool" requirement.

## Data — three new files

All keyed by country name as it appears in the puzzle data (`place.country`,
or `place.name` when the puzzle itself is a country). Coverage target: every
country reachable from `MAP_DROP_PUZZLES` (~1,190 puzzles; curated countries +
all `COUNTRY_ROWS` names + `PLACE_ROWS` countries).

1. **`src/data/flagColours.ts`** — `FLAG_COLOURS: Record<string, string[]>`;
   country → 3–4 plain-English colour names from its flag
   (e.g. `Brazil: ["green", "yellow", "blue", "white"]`).
2. **`src/data/languageSentences.ts`** —
   `COUNTRY_LANGUAGE: Record<string, string>` (country → primary language key)
   and `LANGUAGE_SENTENCES: Record<string, string[]>` (~70 languages, 4–6
   short everyday sentences each, written in that language's own script).
   Countries sharing a language share its sentence pool. The existing
   gazetteer `lang` field is a cultural grouping ("Romance", "Arab"), not a
   language, so this mapping is authored fresh.
3. **`src/data/countryFacts.ts`** — `COUNTRY_FACTS: Record<string, string[]>`;
   4–5 hand-written unique facts per country. Facts must never contain the
   country's name (they are hints). ~900+ facts total.

A small helper (`easyHintsFor(place, seed)` in `src/lib/easyMode.ts` or
colocated in `MapDrop.tsx`) resolves the country, draws the three hints
deterministically, and returns `null` when the country is unmapped.

## Edge cases

- **Country-kind generated puzzles** store the continent in `place.country`;
  the lookup must use `place.name` when the name itself is a mapped country.
- **Unmapped country fallback:** if lookup returns `null`, the round falls
  back to the full standard flow — 7 hints, 3 revealed at start, standard
  ceilings and 5,000 max — even though the toggle shows Easy, and a
  `console.warn` fires in dev builds. The game never breaks.
- Multi-country entities already resolved by existing data conventions
  (e.g. Hong Kong → China, Edinburgh → United Kingdom) follow `place.country`
  as stored — the flag/language/facts belong to that stored country.

## Out of scope

- No changes to the shared `Mode` type, `GameShell` tabs, or other games.
- No expansion of the place database (stays ~1,190).
- No translations/hover-reveals for the local-language sentence.

## Verification

- `npx tsc -b` (from inside the project dir) and `npm run lint` pass
  (pre-existing oxlint warnings excepted).
- A `preview_eval` sweep dynamically imports the data modules and asserts
  every puzzle in `MAP_DROP_PUZZLES` resolves easy hints (no fallback fires).
- Live browser check: play an easy round in Free Play and confirm hint
  content, ceiling drops (4,000 → 3,000 → 2,000), result stats, and share
  text; confirm Daily easy hints are deterministic for the date; confirm
  the Standard toggle restores the 7-hint flow.
