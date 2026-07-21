/**
 * versus-trivia — the authority for Trivia 1v1 moderate/hard matches.
 *
 * Actions (POST { action, matchId, ... }):
 *   provision — fetch the OpenTDB round ONCE per match (15 active + 5 swap
 *               spares) into private.versus_trivia_questions. Idempotent.
 *   question  — return the SANITIZED question at `index` (never the correct
 *               index); applies the 50-50 / Host Hint lifelines server-side.
 *   swap      — Topic Swap lifeline: replace the active question with a spare
 *               of a different topic.
 *   answer    — adjudicate a pick against the stored answer, apply the ladder
 *               × mode multiplier + streak bonus (parity with Trivia.tsx via
 *               scoring.ts), handle Plus One second chances, and accumulate
 *               the authoritative score in private.versus_trivia_progress.
 *   finalize  — write the authoritative score to versus_participants via the
 *               finalize_versus_trivia RPC (called with the PLAYER's JWT so
 *               auth.uid() is the player).
 *
 * The `private` schema is not exposed through PostgREST, so all private-table
 * access goes through the vt_* SECURITY DEFINER RPCs (service_role only).
 * The caller's JWT is verified and membership checked before every action.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  ROUND_SIZE,
  applyCorrect,
  applyWrong,
  maxPoints,
  worth,
  type ScoreState,
  type TriviaMode,
} from "./scoring.ts";
import { ROUND, fetchMatchRound } from "./opentdb.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

interface MatchRow {
  id: string;
  game_id: string;
  status: string;
  max_score: number;
  host_id: string;
  guest_id: string | null;
  config: { topic?: string; mode?: string; lifelines?: string[] };
}

interface QuestionRow {
  match_id: string;
  ordinal: number;
  question: string;
  choices: string[];
  correct_index: number;
  topic: string | null;
  hint: string | null;
}

interface ProgressRow {
  match_id: string;
  user_id: string;
  index: number;
  score: number;
  streak: number;
  correct: number;
  used: string[];
  struck: number[];
  second_chance: boolean;
  finished: boolean;
}

function admin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

function userClient(authHeader: string): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

async function loadContext(req: Request, matchId: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw json({ error: "missing authorization" }, 401);

  const asUser = userClient(authHeader);
  const {
    data: { user },
    error: userError,
  } = await asUser.auth.getUser();
  if (userError || !user) throw json({ error: "invalid token" }, 401);

  const db = admin();
  const { data: match, error: matchError } = await db
    .from("versus_matches")
    .select("id, game_id, status, max_score, host_id, guest_id, config")
    .eq("id", matchId)
    .single();
  if (matchError || !match) throw json({ error: "no such match" }, 404);

  const m = match as MatchRow;
  if (m.game_id !== "trivia") throw json({ error: "not a trivia match" }, 400);
  if (user.id !== m.host_id && user.id !== m.guest_id) {
    throw json({ error: "not a participant" }, 403);
  }

  const mode = (m.config.mode ?? "moderate") as TriviaMode;
  if (mode !== "moderate" && mode !== "hard") {
    throw json({ error: "easy matches are client-scored; no server authority" }, 400);
  }

  return { db, asUser, uid: user.id, match: m, mode };
}

async function getProgress(db: SupabaseClient, matchId: string, uid: string): Promise<ProgressRow> {
  const { data, error } = await db.rpc("vt_get_progress", {
    p_match_id: matchId,
    p_user_id: uid,
  });
  if (error || !data) throw json({ error: "progress read failed" }, 500);
  return data as ProgressRow;
}

async function saveProgress(db: SupabaseClient, p: ProgressRow): Promise<void> {
  const { error } = await db.rpc("vt_save_progress", {
    p_match_id: p.match_id,
    p_user_id: p.user_id,
    p_state: {
      index: p.index,
      score: p.score,
      streak: p.streak,
      correct: p.correct,
      used: p.used,
      struck: p.struck,
      second_chance: p.second_chance,
      finished: p.finished,
    },
  });
  if (error) throw json({ error: "progress write failed" }, 500);
}

async function getQuestion(
  db: SupabaseClient,
  matchId: string,
  ordinal: number,
): Promise<QuestionRow> {
  const { data, error } = await db.rpc("vt_get_question", {
    p_match_id: matchId,
    p_ordinal: ordinal,
  });
  if (error || !data) throw json({ error: "question not provisioned" }, 409);
  return data as QuestionRow;
}

/** A lifeline is usable when packed in the match config and not yet consumed. */
function lifelineReady(match: MatchRow, p: ProgressRow, id: string): boolean {
  return (match.config.lifelines ?? []).includes(id) && !p.used.includes(id);
}

function pickTwoWrong(correctIndex: number, struck: number[]): number[] {
  const wrongs = [0, 1, 2, 3].filter((i) => i !== correctIndex && !struck.includes(i));
  for (let i = wrongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongs[i], wrongs[j]] = [wrongs[j], wrongs[i]];
  }
  return wrongs.slice(0, 2);
}

// ---------------------------------------------------------------- actions

async function actionProvision(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const { db, match, mode } = ctx;

  const { data: count } = await db.rpc("vt_count_questions", { p_match_id: match.id });
  if (((count as number) ?? 0) >= ROUND) return json({ ready: true, count });

  const topic = match.config.topic ?? "misc";
  let round;
  try {
    round = await fetchMatchRound(topic, mode);
  } catch {
    // Fairness rule: no silent substitute — surface a retry to both players.
    return json({ ready: false, error: "couldn't load questions, retry" }, 502);
  }

  // One atomic insert: either this caller provisions the whole round or a
  // concurrent caller already did (unique violation → treat as ready).
  const { error } = await db.rpc("vt_insert_questions", {
    p_match_id: match.id,
    p_rows: round,
  });
  if (error && !`${error.code}`.includes("23505")) {
    const { data: recount } = await db.rpc("vt_count_questions", { p_match_id: match.id });
    if (((recount as number) ?? 0) < ROUND) {
      return json({ ready: false, error: "couldn't store questions, retry" }, 500);
    }
  }
  return json({ ready: true, count: ROUND });
}

function sanitized(q: QuestionRow, index: number, mode: TriviaMode, p: ProgressRow) {
  return {
    index,
    q: q.question,
    choices: q.choices,
    topic: q.topic ?? "History",
    worth: worth(index, mode),
    struck: p.struck,
    score: p.score,
    streak: p.streak,
    correctCount: p.correct,
    used: p.used,
    secondChance: p.second_chance,
  };
}

async function actionQuestion(
  ctx: Awaited<ReturnType<typeof loadContext>>,
  body: { index?: number; lifelines?: { fifty?: boolean; hint?: boolean } },
) {
  const { db, match, mode, uid } = ctx;
  const index = body.index ?? 0;
  const p = await getProgress(db, match.id, uid);
  if (p.finished) return json({ error: "round already finished" }, 409);
  if (index !== p.index) return json({ error: "out-of-order question request" }, 409);
  if (index >= ROUND_SIZE) return json({ error: "round is over" }, 409);

  const q = await getQuestion(db, match.id, index);
  let hint: string | undefined;
  let dirty = false;

  if (body.lifelines?.fifty && lifelineReady(match, p, "fifty")) {
    p.struck = [...p.struck, ...pickTwoWrong(q.correct_index, p.struck)];
    p.used = [...p.used, "fifty"];
    dirty = true;
  }
  if (body.lifelines?.hint && lifelineReady(match, p, "hint")) {
    p.used = [...p.used, "hint"];
    dirty = true;
  }
  // hint text is leak-checked at provision time (first-letter style)
  if (p.used.includes("hint")) hint = q.hint ?? undefined;

  if (dirty) await saveProgress(db, p);
  return json({ ...sanitized(q, index, mode, p), hint });
}

async function actionSwap(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const { db, match, mode, uid } = ctx;
  const p = await getProgress(db, match.id, uid);
  if (p.finished) return json({ error: "round already finished" }, 409);
  if (p.second_chance) return json({ error: "swap is blocked during a second chance" }, 409);
  if (!lifelineReady(match, p, "swap")) return json({ error: "swap not available" }, 409);

  const current = await getQuestion(db, match.id, p.index);
  const { data: sparesData } = await db.rpc("vt_get_spares", {
    p_match_id: match.id,
    p_from: ROUND_SIZE,
  });
  const spares = (sparesData ?? []) as QuestionRow[];
  const spare = spares.find((s) => s.topic !== current.topic) ?? spares[0];
  if (!spare) return json({ error: "no spare question available" }, 409);

  const { error } = await db.rpc("vt_swap_question", {
    p_match_id: match.id,
    p_a: p.index,
    p_b: spare.ordinal,
  });
  if (error) return json({ error: "swap failed, retry" }, 500);

  p.used = [...p.used, "swap"];
  p.struck = [];
  await saveProgress(db, p);

  const fresh = await getQuestion(db, match.id, p.index);
  return json(sanitized(fresh, p.index, mode, p));
}

async function actionAnswer(
  ctx: Awaited<ReturnType<typeof loadContext>>,
  body: { index?: number; pick?: number; plusOneArmed?: boolean },
) {
  const { db, match, mode, uid } = ctx;
  const index = body.index ?? -1;
  const pick = body.pick ?? -1;
  const p = await getProgress(db, match.id, uid);
  if (p.finished) return json({ error: "round already finished" }, 409);
  if (index !== p.index) return json({ error: "out-of-order answer" }, 409);
  if (pick < 0 || pick > 3) return json({ error: "invalid pick" }, 400);
  if (p.struck.includes(pick)) return json({ error: "that option is struck" }, 400);

  const q = await getQuestion(db, match.id, index);
  const isCorrect = pick === q.correct_index;

  // Plus One catches a first miss — the question stays open.
  if (!isCorrect && !p.second_chance && body.plusOneArmed && lifelineReady(match, p, "plusOne")) {
    p.used = [...p.used, "plusOne"];
    p.struck = [...p.struck, pick];
    p.second_chance = true;
    await saveProgress(db, p);
    return json({
      correct: false,
      secondChance: true,
      score: p.score,
      streak: p.streak,
      correctCount: p.correct,
    });
  }

  // Final adjudication (a correct second pick still earns full points).
  const state: ScoreState = { score: p.score, streak: p.streak, correct: p.correct };
  let gain = 0;
  let next: ScoreState;
  if (isCorrect) {
    const applied = applyCorrect(state, index, mode);
    next = applied.state;
    gain = applied.gain;
  } else {
    next = applyWrong(state);
  }

  p.score = next.score;
  p.streak = next.streak;
  p.correct = next.correct;
  p.index = index + 1;
  p.struck = [];
  p.second_chance = false;
  await saveProgress(db, p);

  return json({
    correct: isCorrect,
    correctIndex: q.correct_index,
    gain,
    score: p.score,
    streak: p.streak,
    correctCount: p.correct,
  });
}

async function actionFinalize(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const { db, asUser, match, mode, uid } = ctx;
  const p = await getProgress(db, match.id, uid);
  if (p.index < ROUND_SIZE && !p.finished) {
    return json({ error: "round not finished yet" }, 409);
  }
  if (!p.finished) {
    p.finished = true;
    await saveProgress(db, p);
  }

  const max = Math.min(maxPoints(mode), match.max_score);
  const score = Math.min(p.score, max);

  // Called with the player's JWT so auth.uid() inside the RPC is the player.
  const { data, error } = await asUser.rpc("finalize_versus_trivia", {
    p_match_id: match.id,
    p_score: score,
    p_max: max,
    p_correct: p.correct,
  });
  if (error) return json({ error: error.message }, 500);
  const status = (data as { status?: string } | null)?.status ?? "active";
  return json({ score, max, correct: p.correct, status });
}

// ---------------------------------------------------------------- dispatch

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: {
    action?: string;
    matchId?: string;
    index?: number;
    pick?: number;
    plusOneArmed?: boolean;
    lifelines?: { fifty?: boolean; hint?: boolean };
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!body.matchId) return json({ error: "matchId required" }, 400);

  try {
    const ctx = await loadContext(req, body.matchId);
    switch (body.action) {
      case "provision":
        return await actionProvision(ctx);
      case "question":
        return await actionQuestion(ctx, body);
      case "swap":
        return await actionSwap(ctx);
      case "answer":
        return await actionAnswer(ctx, body);
      case "finalize":
        return await actionFinalize(ctx);
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: (e as Error).message ?? "internal error" }, 500);
  }
});
