/**
 * Parity tests: these constants and formulas must match src/games/Trivia.tsx.
 * Run with: deno test supabase/functions/versus-trivia/scoring.test.ts
 */
import {
  LADDER,
  MODE_MULT,
  ROUND_SIZE,
  applyCorrect,
  applyWrong,
  maxPoints,
  streakBonus,
  worth,
} from "./scoring.ts";

function assertEq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

Deno.test("ladder shape matches Trivia.tsx", () => {
  assertEq(LADDER.length, 15, "ladder length");
  assertEq(LADDER[0], 100, "first slot");
  assertEq(LADDER[14], 400, "last slot");
  assertEq(ROUND_SIZE, 15, "round size");
});

Deno.test("mode multipliers", () => {
  assertEq(MODE_MULT.easy, 1, "easy mult");
  assertEq(MODE_MULT.moderate, 1.5, "moderate mult");
  assertEq(MODE_MULT.hard, 2, "hard mult");
  assertEq(worth(14, "hard"), 800, "hard Q15 worth");
  assertEq(worth(0, "moderate"), 150, "moderate Q1 worth");
});

Deno.test("streak bonus: none before 3, +25 per extra, capped at 150", () => {
  assertEq(streakBonus(1), 0, "streak 1");
  assertEq(streakBonus(2), 0, "streak 2");
  assertEq(streakBonus(3), 25, "streak 3");
  assertEq(streakBonus(4), 50, "streak 4");
  assertEq(streakBonus(8), 150, "streak 8 (cap)");
  assertEq(streakBonus(15), 150, "streak 15 (cap)");
});

Deno.test("maxPoints equals a perfect all-streak run", () => {
  for (const mode of ["easy", "moderate", "hard"] as const) {
    let state = { score: 0, streak: 0, correct: 0 };
    for (let i = 0; i < ROUND_SIZE; i++) {
      state = applyCorrect(state, i, mode).state;
    }
    assertEq(state.score, maxPoints(mode), `${mode} perfect run`);
    assertEq(state.correct, 15, `${mode} correct count`);
  }
});

Deno.test("wrong answers reset the streak but never subtract", () => {
  let state = { score: 0, streak: 0, correct: 0 };
  state = applyCorrect(state, 0, "hard").state;
  state = applyCorrect(state, 1, "hard").state;
  state = applyCorrect(state, 2, "hard").state; // streak 3 → +25
  assertEq(state.score, 200 + 200 + 225, "three correct with streak");
  const before = state.score;
  state = applyWrong(state);
  assertEq(state.score, before, "no penalty");
  assertEq(state.streak, 0, "streak reset");
  // next correct starts a fresh streak with no bonus
  const { gain } = applyCorrect(state, 3, "hard");
  assertEq(gain, 300, "fresh streak gain has no bonus");
});
