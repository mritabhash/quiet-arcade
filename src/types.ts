export type GameId =
  | "map-drop"
  | "time-capsule"
  | "borderline"
  | "word-grid"
  | "pattern-groups"
  | "mini-crossword"
  | "hidden-strands"
  | "letter-hive"
  | "globe-hunt"
  | "country-shape"
  | "time-lens"
  | "higher-lower"
  | "trivia"
  | "cat-pairs"
  | "odd-one-out";

export type Mode = "daily" | "practice";

export type Accent = "clay" | "sage" | "teal" | "gold";

export interface GameMeta {
  id: GameId;
  title: string;
  short: string;
  description: string;
  minutes: string;
  difficulty: "Gentle" | "Medium" | "Tricky";
  type: "Words" | "Logic" | "Geography" | "Trivia" | "Memory" | "Comparison";
  accent: Accent;
  howTo: string[];
  /** flagship games get a large puzzle database, free-play mode, and share results */
  flagship?: boolean;
  /** CTA label shown after the daily is done, e.g. "Play another Map Drop" */
  freePlayLabel?: string;
}

export interface GameResult {
  score: number;
  max: number;
  perfect: boolean;
  label?: string;
  /** shareable result lines (flagship games); the shell appends the streak */
  share?: string[];
}

export interface GameApi {
  seed: number;
  mode: Mode;
  dateKey: string;
  showExplanations: boolean;
  finish: (result: GameResult) => void;
}

export interface Settings {
  darkMode: boolean;
  reducedMotion: boolean;
  showExplanations: boolean;
  highContrast: boolean;
}

export interface PerGameStats {
  plays: number;
  best: number;
  bestMax: number;
  perfect: number;
  lastPlayed: string | null;
}

export interface Stats {
  totalPlays: number;
  perfectRounds: number;
  dailyCompleted: number;
  practiceRounds: number;
  lastPlayed: string | null;
  lastDailyDate: string | null;
  currentStreak: number;
  longestStreak: number;
  perGame: Partial<Record<GameId, PerGameStats>>;
}

export interface DailyEntry {
  score: number;
  max: number;
  perfect: boolean;
}

export type DailyCompletions = Record<string, Partial<Record<GameId, DailyEntry>>>;

/** Separate daily / free-play tracking for the flagship games. */
export interface FlagshipGameStats {
  dailyPlays: number;
  freePlays: number;
  wins: number;
  bestDaily: number;
  bestDailyMax: number;
  bestFree: number;
  bestFreeMax: number;
  freeScoreSum: number;
  perfectDailies: number;
  hintsUsed: number;
  recentPuzzles: string[];
}

export type FlagshipStats = Partial<Record<GameId, FlagshipGameStats>>;

export interface ReportedItem {
  gameId: GameId;
  dateKey: string;
  mode: Mode;
  note: string;
  at: string;
}
