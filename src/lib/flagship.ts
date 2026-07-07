import type { FlagshipGameStats, FlagshipStats, GameId, Mode } from "../types";
import type { Rng } from "./random";

/**
 * Flagship-game plumbing: separate daily / free-play stat tracking,
 * recently-played puzzle memory (so free play avoids immediate repeats),
 * and clipboard sharing. Everything lives in localStorage, like the rest
 * of the arcade.
 */

const KEY = "quietArcade.flagshipStats";
/** how many recently played puzzle ids we remember per game */
const RECENT_CAP = 40;

const EMPTY: FlagshipGameStats = {
  dailyPlays: 0,
  freePlays: 0,
  wins: 0,
  bestDaily: 0,
  bestDailyMax: 0,
  bestFree: 0,
  bestFreeMax: 0,
  freeScoreSum: 0,
  perfectDailies: 0,
  hintsUsed: 0,
  recentPuzzles: [],
};

export function loadFlagshipStats(): FlagshipStats {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FlagshipStats) : {};
  } catch {
    return {};
  }
}

export function flagshipStatsFor(gameId: GameId): FlagshipGameStats {
  return { ...EMPTY, ...loadFlagshipStats()[gameId] };
}

function save(all: FlagshipStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode: stats simply stay in-memory for the session */
  }
}

export function recordFlagshipRound(
  gameId: GameId,
  mode: Mode,
  round: {
    score: number;
    max: number;
    won: boolean;
    perfect: boolean;
    hintsUsed: number;
    puzzleId: string;
  },
): void {
  const all = loadFlagshipStats();
  const s = { ...EMPTY, ...all[gameId] };

  if (round.won) s.wins += 1;
  s.hintsUsed += round.hintsUsed;
  s.recentPuzzles = [
    round.puzzleId,
    ...s.recentPuzzles.filter((id) => id !== round.puzzleId),
  ].slice(0, RECENT_CAP);

  const better = (score: number, max: number, bScore: number, bMax: number) =>
    (bMax > 0 ? bScore / bMax : -1) < (max > 0 ? score / max : 0);

  if (mode === "daily") {
    s.dailyPlays += 1;
    if (round.perfect) s.perfectDailies += 1;
    if (s.dailyPlays === 1 || better(round.score, round.max, s.bestDaily, s.bestDailyMax)) {
      s.bestDaily = round.score;
      s.bestDailyMax = round.max;
    }
  } else {
    s.freePlays += 1;
    s.freeScoreSum += round.score;
    if (s.freePlays === 1 || better(round.score, round.max, s.bestFree, s.bestFreeMax)) {
      s.bestFree = round.score;
      s.bestFreeMax = round.max;
    }
  }

  all[gameId] = s;
  save(all);
}

/**
 * Pick a free-play puzzle index, skipping recently played ids until enough
 * of the database has been visited. Daily selection never uses this — it
 * stays purely date-deterministic.
 */
export function pickFreshIndex(gameId: GameId, ids: readonly string[], rng: Rng): number {
  const recent = new Set(flagshipStatsFor(gameId).recentPuzzles.slice(0, Math.floor(ids.length / 2)));
  const fresh: number[] = [];
  for (let i = 0; i < ids.length; i++) if (!recent.has(ids[i])) fresh.push(i);
  const pool = fresh.length > 0 ? fresh : ids.map((_, i) => i);
  return pool[Math.floor(rng() * pool.length)];
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
