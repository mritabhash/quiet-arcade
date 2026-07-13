import type {
  DailyCompletions,
  FlagshipGameStats,
  FlagshipStats,
  GameId,
  PerGameStats,
  Stats,
} from "../types";

/**
 * Merging local (guest) data with an account's server data. The rule from the
 * spec: never overwrite — take the better / the union of both sides. Used on
 * first sign-in (guest history joins the account) and on later devices.
 */

function laterDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function ratio(score: number, max: number): number {
  return max > 0 ? score / max : 0;
}

function mergePerGame(a: PerGameStats, b: PerGameStats): PerGameStats {
  const bestOfA = ratio(a.best, a.bestMax);
  const bestOfB = ratio(b.best, b.bestMax);
  return {
    plays: Math.max(a.plays, b.plays),
    best: bestOfA >= bestOfB ? a.best : b.best,
    bestMax: bestOfA >= bestOfB ? a.bestMax : b.bestMax,
    perfect: Math.max(a.perfect, b.perfect),
    lastPlayed: laterDate(a.lastPlayed, b.lastPlayed),
  };
}

export function mergeStats(a: Stats, b: Stats): Stats {
  // streak state follows whichever side played a daily most recently
  const streakSource = laterDate(a.lastDailyDate, b.lastDailyDate) === a.lastDailyDate ? a : b;
  const perGame: Stats["perGame"] = { ...a.perGame };
  for (const key of Object.keys(b.perGame) as GameId[]) {
    const theirs = b.perGame[key]!;
    const ours = perGame[key];
    perGame[key] = ours ? mergePerGame(ours, theirs) : theirs;
  }
  return {
    totalPlays: Math.max(a.totalPlays, b.totalPlays),
    perfectRounds: Math.max(a.perfectRounds, b.perfectRounds),
    dailyCompleted: Math.max(a.dailyCompleted, b.dailyCompleted),
    practiceRounds: Math.max(a.practiceRounds, b.practiceRounds),
    lastPlayed: laterDate(a.lastPlayed, b.lastPlayed),
    lastDailyDate: streakSource.lastDailyDate,
    currentStreak: streakSource.currentStreak,
    longestStreak: Math.max(a.longestStreak, b.longestStreak),
    perGame,
  };
}

function mergeFlagshipGame(a: FlagshipGameStats, b: FlagshipGameStats): FlagshipGameStats {
  const dailyA = ratio(a.bestDaily, a.bestDailyMax);
  const dailyB = ratio(b.bestDaily, b.bestDailyMax);
  const freeA = ratio(a.bestFree, a.bestFreeMax);
  const freeB = ratio(b.bestFree, b.bestFreeMax);
  const recent: string[] = [];
  for (const id of [...a.recentPuzzles, ...b.recentPuzzles]) {
    if (!recent.includes(id)) recent.push(id);
  }
  return {
    dailyPlays: Math.max(a.dailyPlays, b.dailyPlays),
    freePlays: Math.max(a.freePlays, b.freePlays),
    wins: Math.max(a.wins, b.wins),
    bestDaily: dailyA >= dailyB ? a.bestDaily : b.bestDaily,
    bestDailyMax: dailyA >= dailyB ? a.bestDailyMax : b.bestDailyMax,
    bestFree: freeA >= freeB ? a.bestFree : b.bestFree,
    bestFreeMax: freeA >= freeB ? a.bestFreeMax : b.bestFreeMax,
    freeScoreSum: Math.max(a.freeScoreSum, b.freeScoreSum),
    perfectDailies: Math.max(a.perfectDailies, b.perfectDailies),
    hintsUsed: Math.max(a.hintsUsed, b.hintsUsed),
    recentPuzzles: recent.slice(0, 40),
  };
}

export function mergeFlagshipStats(a: FlagshipStats, b: FlagshipStats): FlagshipStats {
  const out: FlagshipStats = { ...a };
  for (const key of Object.keys(b) as GameId[]) {
    const theirs = b[key]!;
    const ours = out[key];
    out[key] = ours ? mergeFlagshipGame(ours, theirs) : theirs;
  }
  return out;
}

export function mergeDailyCompletions(a: DailyCompletions, b: DailyCompletions): DailyCompletions {
  const out: DailyCompletions = {};
  for (const dateKey of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const day: DailyCompletions[string] = { ...a[dateKey] };
    const theirs = b[dateKey] ?? {};
    for (const gameId of Object.keys(theirs) as GameId[]) {
      const t = theirs[gameId]!;
      const o = day[gameId];
      day[gameId] = !o || ratio(t.score, t.max) > ratio(o.score, o.max) ? t : o;
    }
    out[dateKey] = day;
  }
  return out;
}
