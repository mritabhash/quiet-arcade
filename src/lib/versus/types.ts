import type { GameId } from "../../types";

export type VersusStatus = "open" | "active" | "complete" | "expired";
export type VersusRole = "host" | "guest" | "none";

export interface MapDropVersusConfig {
  difficulty: "novice" | "easy" | "moderate" | "hard";
}
export type VersusConfig = MapDropVersusConfig | Record<string, unknown>;

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
