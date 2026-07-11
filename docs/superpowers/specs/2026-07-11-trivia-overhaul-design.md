# Trivia Overhaul — Modes, Topics, Lifelines, 10k Questions per Topic

Date: 2026-07-11 · Game: `trivia` in Quiet Arcade

## Goal

Rebuild the Trivia game around: 9 new topics with ~10,000 questions each, three
difficulty modes, 15-question rounds, four lifelines with a per-mode allowance,
and a warm, rewarding points system. It is a cozy game, not a tryhard game.

## Topics

History, Geography, Flags, Countries, Movies & TV, Pop Culture, Tech, Science,
Cosmos. These REPLACE the old nine. Player picks one topic per round, or
"Misc" (a mix, capped at 2 questions per topic per round).

## Question bank

- New directory `src/data/trivia/` (old `src/data/trivia.ts` is deleted;
  `../data/trivia` resolves to the directory index).
- Every question: exactly 4 choices, `tier: 0|1|2` (easy/moderate/hard),
  optional `hint` (Host Hint lifeline) and `note` (explanation).
- Same deterministic pattern as the flagship DBs: compact hand-authored fact
  tables (each row carries a fame/difficulty tier) expanded by builders with a
  fixed-seed mulberry32 RNG. Volume comes from two layers:
  1. direct template questions (who directed X / capital of Y / emoji flag →
     country / what does CPU stand for …),
  2. combinatorial fills — deterministic sampling of 4-entity superlative and
     ordering questions ("Which of these came first?", "Which has the largest
     population?") until the per-tier quota is met. Difficulty of a
     combinatorial question comes from entity fame tiers and gap size (wide
     numeric gaps = easy, close calls = hard).
- Per-topic quotas: tier0 ≥ 3,500 · tier1 ≥ 3,500 · tier2 ≥ 3,000 (≥10,000
  total). Dedupe key: question text + correct + sorted choice set.
- Pools are built lazily per topic (memoized) so a round only pays for the
  topics it uses; determinism is per-topic seeds, unaffected by build order.
- Reuses existing data: gazetteer COUNTRY_ROWS/PLACE_ROWS, ICONIC_FACTS,
  FLAG_COLOURS, LANGUAGE_HINTS, TIME_EVENTS, plus the old trivia.ts fact
  tables (capitals, elements, arts, dishes, animals…) extracted into
  `legacyFacts.ts`. New authored tables: films/TV/characters, music & pop,
  tech companies/inventions/acronyms, space missions/moons/constellations,
  leaders/history events, flag emoji codes & features, currencies.

## Modes

- Easy = tier 0 only. Moderate = tier 1 only. Hard = mostly tier 2 with some
  tier 1 mixed in ("hard can feel moderate but not easy").
- Rounds ramp gently: within the chosen tier, later questions lean spicier.
- Lifeline allowance: Easy picks 1 of the 4, Moderate 2, Hard 3.

## Lifelines (each usable once per round, chosen on the setup screen)

- **50-50** — removes two wrong options.
- **Plus One** — arm it before answering; a wrong first pick doesn't end the
  question, the second pick counts (full points — cozy game).
- **Topic Swap** — replaces the current question with one of the same tier
  from a random different topic.
- **Host Hint** — shows the question's one-line hint (builders generate one;
  fallback: "It starts with '…'"). Lifelines may stack on one question.

## Scoring (no punishment, ever)

- Points ladder over the 15 questions:
  `[100,100,100,150,150,150,200,200,200,250,250,300,300,350,400]`,
  × mode multiplier (easy ×1, moderate ×1.5, hard ×2).
- Streak bonus: from the 3rd consecutive correct, +25 × (streak − 2), capped
  at +150 per question.
- Wrong answer = just no points banked; the host stays kind. Milestone
  flourishes at Q5/Q10/Q15. Final screen awards a rank title by share of max
  points (Warm-Up Wanderer → Curious Mind → Quiz Whiz → Trivia Star →
  Walking Encyclopedia at 100%); `perfect` = 15/15 correct.

## Game flow (`src/games/Trivia.tsx`)

setup phase (topic grid incl. Misc → mode → lifeline picks, remembered in
localStorage `quietArcade.triviaSetup`) → play phase (question card, lifeline
bar, 4 options, feedback + note, points/streak header) → `api.finish({score:
points, max, perfect, label})`. Draw is `drawRound(api.seed, topic, mode)` so
daily stays deterministic per setup. games.ts copy updated (15 questions,
three modes, vault of ~90,000).

## Verification

`npx tsc -b`, `npm run lint`, then a browser dynamic-import check: every topic
≥10,000 with per-tier quotas met, all questions have 4 unique choices and a
valid answer index, hints never contain the correct answer, and a played
round exercises all four lifelines.
