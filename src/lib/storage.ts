import type {
  DailyCompletions,
  DailyEntry,
  GameId,
  ReportedItem,
  Settings,
  Stats,
} from "../types";
import { todayKey, yesterdayKeyOf } from "./date";
import { track } from "./analytics";

export const STORAGE_KEYS = {
  settings: "quietArcade.settings",
  stats: "quietArcade.stats",
  dailyCompletions: "quietArcade.dailyCompletions",
  reportedItems: "quietArcade.reportedItems",
  gameSaves: "quietArcade.gameSaves",
} as const;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); the app still works in-memory */
  }
}

/* ---------------- settings ---------------- */

export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  reducedMotion: false,
  showExplanations: true,
  highContrast: false,
};

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(STORAGE_KEYS.settings, {}) };
}

export function saveSettings(s: Settings): void {
  write(STORAGE_KEYS.settings, s);
}

/* ---------------- stats ---------------- */

const EMPTY_STATS: Stats = {
  totalPlays: 0,
  perfectRounds: 0,
  dailyCompleted: 0,
  practiceRounds: 0,
  lastPlayed: null,
  lastDailyDate: null,
  currentStreak: 0,
  longestStreak: 0,
  perGame: {},
};

export function loadStats(): Stats {
  return { ...EMPTY_STATS, ...read<Partial<Stats>>(STORAGE_KEYS.stats, {}) };
}

export function recordResult(
  gameId: GameId,
  mode: "daily" | "practice",
  score: number,
  max: number,
  perfect: boolean,
): Stats {
  const stats = loadStats();
  const dateKey = todayKey();

  stats.totalPlays += 1;
  stats.lastPlayed = dateKey;
  if (perfect) stats.perfectRounds += 1;
  if (mode === "practice") stats.practiceRounds += 1;

  const pg = stats.perGame[gameId] ?? {
    plays: 0,
    best: 0,
    bestMax: max,
    perfect: 0,
    lastPlayed: null,
  };
  pg.plays += 1;
  pg.lastPlayed = dateKey;
  if (perfect) pg.perfect += 1;
  const oldRatio = pg.bestMax > 0 ? pg.best / pg.bestMax : 0;
  const newRatio = max > 0 ? score / max : 0;
  if (pg.plays === 1 || newRatio > oldRatio) {
    pg.best = score;
    pg.bestMax = max;
  }
  stats.perGame[gameId] = pg;

  if (mode === "daily") {
    stats.dailyCompleted += 1;
    if (stats.lastDailyDate !== dateKey) {
      if (stats.lastDailyDate === yesterdayKeyOf(dateKey)) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
      stats.lastDailyDate = dateKey;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    }
  }

  write(STORAGE_KEYS.stats, stats);
  track("game_finished", { game_id: gameId, mode, score, max, perfect });
  return stats;
}

/** A streak only survives if the last daily was today or yesterday. */
export function effectiveStreak(stats: Stats): number {
  if (!stats.lastDailyDate) return 0;
  const today = todayKey();
  if (stats.lastDailyDate === today || stats.lastDailyDate === yesterdayKeyOf(today)) {
    return stats.currentStreak;
  }
  return 0;
}

export function resetStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.stats);
    localStorage.removeItem(STORAGE_KEYS.dailyCompletions);
  } catch {
    /* ignore */
  }
}

/* ---------------- daily completions ---------------- */

export function loadDailyCompletions(): DailyCompletions {
  return read<DailyCompletions>(STORAGE_KEYS.dailyCompletions, {});
}

export function dailyEntryFor(gameId: GameId, dateKey: string): DailyEntry | undefined {
  return loadDailyCompletions()[dateKey]?.[gameId];
}

export function setDailyCompletion(gameId: GameId, dateKey: string, entry: DailyEntry): void {
  const all = loadDailyCompletions();
  all[dateKey] = { ...all[dateKey], [gameId]: entry };
  write(STORAGE_KEYS.dailyCompletions, all);
}

export function completedTodayCount(): number {
  const today = loadDailyCompletions()[todayKey()];
  return today ? Object.keys(today).length : 0;
}

/* ---------------- reported items ---------------- */

export function reportItem(item: ReportedItem): void {
  const items = read<ReportedItem[]>(STORAGE_KEYS.reportedItems, []);
  items.push(item);
  write(STORAGE_KEYS.reportedItems, items.slice(-100));
}

/* ---------------- in-progress game saves (daily only) ---------------- */

export function loadGameSave<T>(gameId: GameId, dateKey: string): T | undefined {
  const saves = read<Record<string, unknown>>(STORAGE_KEYS.gameSaves, {});
  return saves[`${gameId}:${dateKey}`] as T | undefined;
}

export function storeGameSave<T>(gameId: GameId, dateKey: string, data: T): void {
  const saves = read<Record<string, unknown>>(STORAGE_KEYS.gameSaves, {});
  // keep only saves for the current day so the store never grows unbounded
  const pruned: Record<string, unknown> = {};
  for (const key of Object.keys(saves)) {
    if (key.endsWith(`:${dateKey}`)) pruned[key] = saves[key];
  }
  pruned[`${gameId}:${dateKey}`] = data;
  write(STORAGE_KEYS.gameSaves, pruned);
}

export function clearAllData(): void {
  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
