/**
 * Pure trivia scoring — copied verbatim from src/games/Trivia.tsx so the
 * server-authoritative score matches the single-player game exactly.
 * Unit-tested in scoring.test.ts for parity with those constants.
 */

export type TriviaMode = "easy" | "moderate" | "hard";

export const ROUND_SIZE = 15;

/** points per question slot, before the mode multiplier */
export const LADDER = [
  100, 100, 100, 150, 150, 150, 200, 200, 200, 250, 250, 300, 300, 350, 400,
] as const;

export const MODE_MULT: Record<TriviaMode, number> = { easy: 1, moderate: 1.5, hard: 2 };

const STREAK_CAP = 150;

/** +25 per correct answer past the second in a row, capped per question */
export function streakBonus(streak: number): number {
  return streak >= 3 ? Math.min(STREAK_CAP, 25 * (streak - 2)) : 0;
}

export function worth(index: number, mode: TriviaMode): number {
  return LADDER[index] * MODE_MULT[mode];
}

export function maxPoints(mode: TriviaMode): number {
  let total = 0;
  for (let i = 0; i < ROUND_SIZE; i++) total += LADDER[i] * MODE_MULT[mode] + streakBonus(i + 1);
  return total;
}

export interface ScoreState {
  score: number;
  streak: number;
  correct: number;
}

/** Apply a final correct answer at `index`; returns the new state + gain. */
export function applyCorrect(
  state: ScoreState,
  index: number,
  mode: TriviaMode,
): { state: ScoreState; gain: number } {
  const ns = state.streak + 1;
  const gain = worth(index, mode) + streakBonus(ns);
  return {
    state: { score: state.score + gain, streak: ns, correct: state.correct + 1 },
    gain,
  };
}

/** Apply a final wrong answer; the streak resets, nothing is lost. */
export function applyWrong(state: ScoreState): ScoreState {
  return { ...state, streak: 0 };
}
