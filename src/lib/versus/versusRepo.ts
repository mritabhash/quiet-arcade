import { supabase } from "../supabaseClient";
import type { GameId } from "../../types";
import { configKey } from "./configKey";
import type {
  TriviaAdjudication,
  TriviaSanitizedQuestion,
  VersusConfig,
  VersusMatch,
  VersusView,
} from "./types";

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

// ---------------------------------------------------------------------------
// Matchmaking queue
// ---------------------------------------------------------------------------

export interface EnqueueResult {
  matched: boolean;
  match: VersusMatch | null;
}

export async function enqueue(gameId: GameId, config: VersusConfig): Promise<EnqueueResult> {
  const { data, error } = await client().rpc("enqueue_match", {
    p_game_id: gameId,
    p_config_key: configKey(gameId, config as Record<string, unknown>),
    p_config: config,
  });
  if (error) throw error;
  return data as EnqueueResult;
}

export async function dequeue(): Promise<void> {
  const { error } = await client().rpc("dequeue_match");
  if (error) throw error;
}

export async function findMyMatch(): Promise<VersusMatch | null> {
  const { data, error } = await client().rpc("find_my_match");
  if (error) throw error;
  const m = data as VersusMatch | null;
  return m && m.id ? m : null;
}

// ---------------------------------------------------------------------------
// Trivia authoritative path — thin wrappers over the versus-trivia Edge
// Function. Moderate/hard only; easy trivia is client-scored via submitScore.
// ---------------------------------------------------------------------------

async function invokeTrivia<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().functions.invoke("versus-trivia", { body });
  if (error) {
    // FunctionsHttpError carries the response — surface the server's message
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === "function") {
      const detail = await res.json().then((b: { error?: string }) => b?.error).catch(() => null);
      if (detail) throw new Error(detail);
    }
    throw error;
  }
  const payload = data as T & { error?: string };
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(payload.error);
  }
  return payload;
}

export async function provisionTrivia(matchId: string): Promise<{ ready: boolean; count: number }> {
  return invokeTrivia({ action: "provision", matchId });
}

export async function fetchTriviaQuestion(
  matchId: string,
  index: number,
  lifelines: { fifty?: boolean; hint?: boolean } = {},
): Promise<TriviaSanitizedQuestion> {
  return invokeTrivia({ action: "question", matchId, index, lifelines });
}

export async function swapTriviaQuestion(matchId: string): Promise<TriviaSanitizedQuestion> {
  return invokeTrivia({ action: "swap", matchId });
}

export async function answerTrivia(
  matchId: string,
  body: { index: number; pick: number; plusOneArmed: boolean },
): Promise<TriviaAdjudication> {
  return invokeTrivia({ action: "answer", matchId, ...body });
}

export async function finalizeTrivia(
  matchId: string,
): Promise<{ score: number; max: number; correct: number; status: string }> {
  return invokeTrivia({ action: "finalize", matchId });
}
