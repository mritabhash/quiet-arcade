import { supabase } from "../supabaseClient";
import type { GameId } from "../../types";
import type { VersusConfig, VersusMatch, VersusView } from "./types";

/** Versus needs the account backend; guests/offline get a hidden feature. */
export function versusAvailable(): boolean {
  return supabase !== null;
}

function client() {
  if (!supabase) throw new Error("Versus requires Supabase to be configured");
  return supabase;
}

export async function createMatch(gameId: GameId, config: VersusConfig): Promise<VersusMatch> {
  const { data, error } = await client().rpc("create_versus_match", {
    p_game_id: gameId,
    p_config: config,
  });
  if (error) throw error;
  return data as VersusMatch;
}

export async function joinMatch(code: string): Promise<VersusMatch> {
  const { data, error } = await client().rpc("join_versus_match", { p_code: code });
  if (error) throw error;
  return data as VersusMatch;
}

export async function getMatch(code: string): Promise<VersusView | null> {
  const { data, error } = await client().rpc("get_versus_match", { p_code: code });
  if (error) throw error;
  return (data as VersusView | null) ?? null;
}

export async function submitScore(
  matchId: string,
  score: number,
  max: number,
  detail: Record<string, unknown>,
): Promise<VersusMatch> {
  const { data, error } = await client().rpc("submit_versus_score", {
    p_match_id: matchId,
    p_score: score,
    p_max: max,
    p_detail: detail,
  });
  if (error) throw error;
  return data as VersusMatch;
}
