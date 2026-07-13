import type {
  DailyCompletions,
  DailyEntry,
  FlagshipStats,
  GameId,
  Mode,
  Settings,
  Stats,
} from "../types";
import { supabase } from "./supabaseClient";
import { mergeDailyCompletions, mergeFlagshipStats, mergeStats } from "./merge";
import { loadDailyCompletions, loadSettings, loadStats, read, write, STORAGE_KEYS } from "./storage";
import { FLAGSHIP_KEY } from "./flagship";

/**
 * Server push/pull for signed-in players. Everything here is fire-and-forget
 * and failure-tolerant: the localStorage write has always already happened,
 * so a dead network never costs the player anything — the next fullSync()
 * (every app load while signed in) reconciles.
 *
 * Ownership note: no user_id is ever sent. The database fills it from
 * auth.uid() and RLS rejects anything else.
 */

/** Fired after a sync writes merged server data into localStorage. */
export const SYNC_EVENT = "quietArcade:synced";

/** rows in user_stats that hold whole client-side stat objects */
const OVERALL_ROW = { game_id: "__overall", kind: "overall" } as const;
const FLAGSHIP_ROW = { game_id: "__flagship", kind: "flagship" } as const;

/** only this many recent days of completions are pushed per sync */
const COMPLETION_PUSH_DAYS = 60;

function warn(what: string, error: unknown): void {
  console.warn(`[quiet-arcade sync] ${what} failed:`, error);
}

/** Ensure the signed-in user has a profile row (no-op if it exists). */
export async function ensureProfile(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: uid }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) warn("ensureProfile", error);
}

export async function pushScore(
  gameId: GameId,
  mode: Mode,
  score: number,
  max: number,
  dateKey: string,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("scores").insert({
    game_id: gameId,
    mode,
    score: Math.round(score),
    max: Math.round(max),
    date_key: dateKey,
  });
  // 23505 = the daily row already exists (replayed merge, second device) — fine
  if (error && error.code !== "23505") warn("pushScore", error);
}

export async function pushStats(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("user_stats")
    .upsert({ ...OVERALL_ROW, data: loadStats() }, { onConflict: "user_id,game_id,kind" });
  if (error) warn("pushStats", error);
}

export async function pushFlagshipStats(): Promise<void> {
  if (!supabase) return;
  const flagship = read<FlagshipStats>(FLAGSHIP_KEY, {});
  const { error } = await supabase
    .from("user_stats")
    .upsert({ ...FLAGSHIP_ROW, data: flagship }, { onConflict: "user_id,game_id,kind" });
  if (error) warn("pushFlagshipStats", error);
}

export async function pushDailyCompletion(
  gameId: GameId,
  dateKey: string,
  entry: DailyEntry,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("daily_completions")
    .upsert(
      { date_key: dateKey, game_id: gameId, entry },
      { onConflict: "user_id,date_key,game_id" },
    );
  if (error) warn("pushDailyCompletion", error);
}

export async function pushSettings(settings: Settings): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { error } = await supabase.from("profiles").update({ settings }).eq("user_id", uid);
  if (error) warn("pushSettings", error);
}

export async function deleteServerStats(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const stats = await supabase.from("user_stats").delete().eq("user_id", uid);
  if (stats.error) warn("deleteServerStats(user_stats)", stats.error);
  const daily = await supabase.from("daily_completions").delete().eq("user_id", uid);
  if (daily.error) warn("deleteServerStats(daily_completions)", daily.error);
}

interface PulledData {
  stats: Stats | null;
  flagship: FlagshipStats | null;
  daily: DailyCompletions | null;
  settings: Settings | null;
}

async function pullAll(): Promise<PulledData | null> {
  if (!supabase) return null;
  const out: PulledData = { stats: null, flagship: null, daily: null, settings: null };

  const statRows = await supabase.from("user_stats").select("game_id, kind, data");
  if (statRows.error) {
    warn("pullAll(user_stats)", statRows.error);
    return null;
  }
  for (const row of statRows.data) {
    if (row.game_id === OVERALL_ROW.game_id) out.stats = row.data as Stats;
    if (row.game_id === FLAGSHIP_ROW.game_id) out.flagship = row.data as FlagshipStats;
  }

  const dailyRows = await supabase.from("daily_completions").select("date_key, game_id, entry");
  if (dailyRows.error) {
    warn("pullAll(daily_completions)", dailyRows.error);
    return null;
  }
  if (dailyRows.data.length > 0) {
    const daily: DailyCompletions = {};
    for (const row of dailyRows.data) {
      daily[row.date_key] = { ...daily[row.date_key], [row.game_id as GameId]: row.entry };
    }
    out.daily = daily;
  }

  const profile = await supabase.from("profiles").select("settings").maybeSingle();
  if (!profile.error && profile.data?.settings) out.settings = profile.data.settings as Settings;

  return out;
}

/**
 * Pull the account's server data, merge it with whatever this browser holds
 * (union / take-the-better — never overwrite), write the merged result back
 * to localStorage, notify the UI, and push the merged state up. Runs on
 * sign-in and on every app load while signed in.
 */
export async function fullSync(): Promise<void> {
  if (!supabase) return;
  try {
    await ensureProfile();
    const pulled = await pullAll();
    if (!pulled) return;

    const stats = pulled.stats ? mergeStats(loadStats(), pulled.stats) : loadStats();
    const flagship = pulled.flagship
      ? mergeFlagshipStats(read<FlagshipStats>(FLAGSHIP_KEY, {}), pulled.flagship)
      : read<FlagshipStats>(FLAGSHIP_KEY, {});
    const daily = pulled.daily
      ? mergeDailyCompletions(loadDailyCompletions(), pulled.daily)
      : loadDailyCompletions();

    write(STORAGE_KEYS.stats, stats);
    write(FLAGSHIP_KEY, flagship);
    write(STORAGE_KEYS.dailyCompletions, daily);
    if (pulled.settings) {
      write(STORAGE_KEYS.settings, { ...loadSettings(), ...pulled.settings });
    }
    window.dispatchEvent(new Event(SYNC_EVENT));

    await pushStats();
    await pushFlagshipStats();
    if (!pulled.settings) await pushSettings(loadSettings());

    // push recent completions (bounded so this never becomes a flood)
    const dateKeys = Object.keys(daily).sort().slice(-COMPLETION_PUSH_DAYS);
    for (const dateKey of dateKeys) {
      const games = daily[dateKey];
      for (const gameId of Object.keys(games) as GameId[]) {
        await pushDailyCompletion(gameId, dateKey, games[gameId]!);
      }
    }
  } catch (error) {
    warn("fullSync", error);
  }
}
