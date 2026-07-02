export type GameId =
  | "word-grid"
  | "pattern-groups"
  | "mini-crossword"
  | "hidden-strands"
  | "letter-hive"
  | "map-drop"
  | "globe-hunt"
  | "country-shape"
  | "time-lens"
  | "higher-lower";

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
}

export interface GameResult {
  score: number;
  max: number;
  perfect: boolean;
  label?: string;
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

export interface ReportedItem {
  gameId: GameId;
  dateKey: string;
  mode: Mode;
  note: string;
  at: string;
}
