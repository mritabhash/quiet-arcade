import type { DailyEntry, GameId, Mode, Settings, Stats } from "../types";
import { todayKey } from "./date";
import {
  recordResult as localRecordResult,
  resetStats as localResetStats,
  saveSettings as localSaveSettings,
  setDailyCompletion as localSetDailyCompletion,
} from "./storage";
import { recordFlagshipRound as localRecordFlagshipRound } from "./flagship";
import {
  deleteServerStats,
  pushDailyCompletion,
  pushFlagshipStats,
  pushScore,
  pushSettings,
  pushStats,
} from "./sync";

/**
 * The storage abstraction the games write through. Two implementations:
 *
 *  - LocalStorageRepo — the original behavior; guests and offline play.
 *  - SupabaseRepo     — write-through: every write lands in localStorage
 *    first (so the UI and offline reads never change), then is pushed to the
 *    server fire-and-forget.
 *
 * Games and the shell only ever call the module-level facade functions below;
 * they never know which repo is active. AuthContext flips the active repo as
 * sessions come and go. Reads stay in storage.ts/flagship.ts — local data is
 * always the source of truth for rendering.
 */

export interface FlagshipRound {
  score: number;
  max: number;
  won: boolean;
  perfect: boolean;
  hintsUsed: number;
  puzzleId: string;
}

export interface Repo {
  recordResult(gameId: GameId, mode: Mode, score: number, max: number, perfect: boolean): Stats;
  setDailyCompletion(gameId: GameId, dateKey: string, entry: DailyEntry): void;
  recordFlagshipRound(gameId: GameId, mode: Mode, round: FlagshipRound): void;
  saveSettings(settings: Settings): void;
  resetStats(): void;
}

class LocalStorageRepo implements Repo {
  recordResult(gameId: GameId, mode: Mode, score: number, max: number, perfect: boolean): Stats {
    return localRecordResult(gameId, mode, score, max, perfect);
  }
  setDailyCompletion(gameId: GameId, dateKey: string, entry: DailyEntry): void {
    localSetDailyCompletion(gameId, dateKey, entry);
  }
  recordFlagshipRound(gameId: GameId, mode: Mode, round: FlagshipRound): void {
    localRecordFlagshipRound(gameId, mode, round);
  }
  saveSettings(settings: Settings): void {
    localSaveSettings(settings);
  }
  resetStats(): void {
    localResetStats();
  }
}

class SupabaseRepo implements Repo {
  private local = new LocalStorageRepo();

  recordResult(gameId: GameId, mode: Mode, score: number, max: number, perfect: boolean): Stats {
    const stats = this.local.recordResult(gameId, mode, score, max, perfect);
    void pushScore(gameId, mode, score, max, todayKey());
    void pushStats();
    return stats;
  }
  setDailyCompletion(gameId: GameId, dateKey: string, entry: DailyEntry): void {
    this.local.setDailyCompletion(gameId, dateKey, entry);
    void pushDailyCompletion(gameId, dateKey, entry);
  }
  recordFlagshipRound(gameId: GameId, mode: Mode, round: FlagshipRound): void {
    this.local.recordFlagshipRound(gameId, mode, round);
    void pushFlagshipStats();
  }
  saveSettings(settings: Settings): void {
    this.local.saveSettings(settings);
    void pushSettings(settings);
  }
  resetStats(): void {
    this.local.resetStats();
    void (async () => {
      await deleteServerStats();
      await pushFlagshipStats(); // parity: local reset keeps flagship stats
    })();
  }
}

const localRepo = new LocalStorageRepo();
const supabaseRepo = new SupabaseRepo();
let active: Repo = localRepo;

/** AuthContext flips this when a Supabase session appears/disappears. */
export function setServerSyncEnabled(enabled: boolean): void {
  active = enabled ? supabaseRepo : localRepo;
}

/* ------------- the facade the app writes through ------------- */

export function recordResult(
  gameId: GameId,
  mode: Mode,
  score: number,
  max: number,
  perfect: boolean,
): Stats {
  return active.recordResult(gameId, mode, score, max, perfect);
}

export function setDailyCompletion(gameId: GameId, dateKey: string, entry: DailyEntry): void {
  active.setDailyCompletion(gameId, dateKey, entry);
}

export function recordFlagshipRound(gameId: GameId, mode: Mode, round: FlagshipRound): void {
  active.recordFlagshipRound(gameId, mode, round);
}

export function saveSettings(settings: Settings): void {
  active.saveSettings(settings);
}

export function resetStats(): void {
  active.resetStats();
}
