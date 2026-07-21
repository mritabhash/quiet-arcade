import type { GameId } from "../../types";

export type VersusStatus = "open" | "active" | "complete" | "expired";
export type VersusRole = "host" | "guest" | "none";

export interface MapDropVersusConfig {
  difficulty: "novice" | "easy" | "moderate" | "hard";
}

/** Trivia match config. `lifelines` is per-match here (both players get the
 *  same pack) so the server can validate lifeline use. */
export interface TriviaVersusConfig {
  topic: string;
  mode: "easy" | "moderate" | "hard";
  lifelines: string[];
}

export type VersusConfig = MapDropVersusConfig | TriviaVersusConfig | Record<string, unknown>;

export interface VersusMatch {
  id: string;
  code: string;
  game_id: GameId;
  seed: number;
  config: VersusConfig;
  max_score: number;
  status: VersusStatus;
  live: boolean;
  host_id: string;
  guest_id: string | null;
  expires_at: string;
}

export interface VersusParticipant {
  role: "host" | "guest";
  handle: string | null;
  score: number | null;
  max: number | null;
  finished_at: string | null;
}

export interface VersusView extends VersusMatch {
  you_are: VersusRole;
  participants: VersusParticipant[];
}

/** Live progress broadcast payload (used by the realtime pillar; defined now so
 *  the shell + adapters share one shape). */
export interface VersusProgress {
  role: "host" | "guest";
  score: number;
  step?: number;
  lockedIn?: boolean;
}

// ---------------------------------------------------------------------------
// Trivia authoritative path (versus-trivia Edge Function payloads)
// ---------------------------------------------------------------------------

/** A question as the server shows it — never contains the correct index. */
export interface TriviaSanitizedQuestion {
  index: number;
  q: string;
  choices: string[];
  topic: string;
  worth: number;
  struck: number[];
  hint?: string;
  /** server-authoritative running state, for rehydration */
  score: number;
  streak: number;
  correctCount: number;
  used: string[];
  secondChance: boolean;
}

/** The server's verdict on a pick. */
export interface TriviaAdjudication {
  correct: boolean;
  /** present only once the question is finally resolved */
  correctIndex?: number;
  gain?: number;
  score: number;
  streak: number;
  correctCount: number;
  /** Plus One caught the miss — guess again */
  secondChance?: boolean;
}
