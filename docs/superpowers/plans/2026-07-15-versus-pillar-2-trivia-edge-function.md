# Versus Pillar 2 — Trivia + OpenTDB Edge Function — Implementation Plan

> **For agentic workers:** execute inline (the user prefers inline over subagent fleets — see memory `execution-cost-preference`). Keep TDD/verify discipline: `cd quiet-arcade && npx tsc -b` + `npm run lint`, SQL isolation tests, browser E2E. Steps use `- [ ]`.

**Goal:** Add authoritative, cheat-resistant **Trivia 1v1** on top of Pillar 1. Moderate/hard fetch a single shared OpenTDB round via a Supabase **Edge Function** that keeps answers server-side and scores per answer; easy uses the local seeded vault. Both players get identical questions.

**Architecture:** A `versus-trivia` Deno Edge Function owns moderate/hard matches: `provision` (fetch OpenTDB once → store in a service-role-only table), `question` (sanitized, no answer), `answer` (adjudicate + accumulate authoritative score), `finalize` (write participant score). Easy-mode Trivia matches reuse Pillar 1's `submit_versus_score` with the local deterministic vault. `Trivia.tsx` gains an `api.versus` adapter.

**Prereq:** Pillar 1 merged/available (branch `versus-1v1`): `versus_matches`, `versus_participants`, `submit_versus_score`, `VersusShell`, `api.versus` hook, `versusRepo`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-versus-1v1-design.md`. Pillar 1 plan: `docs/superpowers/plans/2026-07-15-versus-pillar-1-mapdrop-async.md`.
- **Trivia scoring — copy verbatim from `src/games/Trivia.tsx`:**
  - `LADDER = [100,100,100,150,150,150,200,200,200,250,250,300,300,350,400]` (15 slots)
  - `MODE_MULT = { easy: 1, moderate: 1.5, hard: 2 }`
  - `worth(i, mode) = LADDER[i] * MODE_MULT[mode]`
  - `streakBonus(streak) = streak >= 3 ? min(150, 25*(streak-2)) : 0`
  - On correct at 1-based new streak `ns`: `gain = worth + streakBonus(ns)`, `points += gain`, `streak = ns`, `correct++`.
  - On final wrong: `streak = 0`.
  - `maxPoints(mode) = Σ_{i=0..14} LADDER[i]*MODE_MULT[mode] + streakBonus(i+1)`.
  - `perfect = correct === 15`. `ROUND_SIZE = 15`.
- **Lifelines** (each once/round; allowance easy 1 / moderate 2 / hard 3): `fifty` (strike 2 wrong indices), `plusOne` (arm before answering; a wrong pick with it armed strikes that pick and grants exactly one more guess, no points penalty), `swap` (replace the current question — see note), `hint` (reveal `q.hint`, never contains the answer). Blocked combo from source: `swap` blocked while `secondChance`.
- **OpenTDB fetch** — mirror `src/data/trivia/opentdb.ts`: `amount=15`, `type=multiple`, `encode=url3986`; `DIFFICULTY = {easy:'easy',moderate:'medium',hard:'hard'}`; category map (History 23, Geography/Flags/Countries 22, Movies&TV [11,14], Pop Culture [12,26,29], Tech [18,30], Science 17, Cosmos 17); `misc` → no category; retry without category if a batch is too sparse; decode `decodeURIComponent`; keep only 4-choice questions; synth first-letter hint `It starts with "X".`; throw if <15 usable.
- **Fairness rule:** never silently substitute different questions. If provision fails, surface a retry; both players wait.
- **Security:** `private.versus_trivia_questions` holds correct answers and is **revoked from anon + authenticated**; only the Edge Function's service-role key reads it. The Edge Function verifies the caller's JWT and that they are a participant before every action. Sanitized `question` payloads must **never** include the correct index.
- **erasableSyntaxOnly** in the client (no enums, no `private x` ctor params). The Edge Function is separate Deno code (its own tsconfig), so that constraint is client-only.
- **GateGuard:** first Write/Edit per file (and first Bash) is gated — state importers/affected API/data schema/user instruction, retry once.
- Verify: `cd quiet-arcade && npx tsc -b` + `npm run lint` (0 new oxlint warnings). Edge Function: `deno check`. E2E: two anon sessions, hard-mode Trivia match, identical questions, authoritative score.

---

### Task 1: Migration `0003_versus_trivia.sql` — private question store + finalize RPC

**Files:**
- Create: `quiet-arcade/supabase/migrations/0003_versus_trivia.sql`
- Create: `quiet-arcade/supabase/tests/versus_trivia_isolation_tests.sql`

**Interfaces produced:**
- table `private.versus_trivia_questions(match_id uuid, ordinal int, question text, choices jsonb, correct_index int, topic text, hint text, primary key (match_id, ordinal))` — service-role only.
- table `private.versus_trivia_progress(match_id uuid, user_id uuid, index int, score int, streak int, correct int, used jsonb, struck jsonb, answered_index int, primary key (match_id, user_id))` — service-role only, server-authoritative per-player state.
- `public.finalize_versus_trivia(p_match_id uuid, p_score int, p_max int, p_correct int)` — SECURITY DEFINER, upserts the caller's participant row (idempotent) and flips match status to `complete` when both finished. Trusts the server-computed score (still capped at `game_catalog` = 100000 for trivia).

- [ ] **Step 1** — write the failing isolation test: (a) `anon`/`authenticated` cannot `select` from `private.versus_trivia_questions` or `private.versus_trivia_progress`; (b) `finalize_versus_trivia` not executable by `authenticated`. GUC-simulated, self-rolling-back, matches `versus_isolation_tests.sql` style.
- [ ] **Step 2** — run it; expect FAIL (objects don't exist).
- [ ] **Step 3** — write the migration:

```sql
-- Versus Trivia: private question store (answers) + server-authoritative finalize.
create table private.versus_trivia_questions (
  match_id      uuid not null references public.versus_matches (id) on delete cascade,
  ordinal       int  not null,
  question      text not null,
  choices       jsonb not null,          -- string[4]
  correct_index int  not null check (correct_index between 0 and 3),
  topic         text,
  hint          text,
  primary key (match_id, ordinal)
);
revoke all on table private.versus_trivia_questions from public, anon, authenticated;
alter table private.versus_trivia_questions enable row level security;
alter table private.versus_trivia_questions force row level security;

create table private.versus_trivia_progress (
  match_id      uuid not null references public.versus_matches (id) on delete cascade,
  user_id       uuid not null,
  index         int  not null default 0,
  score         int  not null default 0,
  streak        int  not null default 0,
  correct       int  not null default 0,
  used          jsonb not null default '[]'::jsonb,     -- lifeline ids consumed
  struck        jsonb not null default '[]'::jsonb,     -- struck indices this question
  answered_index int,                                    -- guards replay/skip
  primary key (match_id, user_id)
);
revoke all on table private.versus_trivia_progress from public, anon, authenticated;
alter table private.versus_trivia_progress enable row level security;
alter table private.versus_trivia_progress force row level security;

create or replace function public.finalize_versus_trivia(
  p_match_id uuid, p_score int, p_max int, p_correct int)
returns public.versus_matches
language plpgsql security definer set search_path = '' as $$
declare m public.versus_matches; v_handle text; both int; v_uid uuid := auth.uid();
begin
  select * into m from public.versus_matches where id = p_match_id for update;
  if m.id is null then raise exception 'no such match'; end if;
  if v_uid not in (m.host_id, coalesce(m.guest_id, m.host_id)) then
    raise exception 'not a participant';
  end if;
  if p_max > m.max_score then raise exception 'max exceeds ceiling'; end if;
  if p_score < 0 or p_score > p_max then raise exception 'invalid score'; end if;

  select handle into v_handle from public.profiles where user_id = v_uid;
  insert into public.versus_participants (match_id, user_id, handle, score, max, detail, finished_at)
    values (m.id, v_uid, v_handle, p_score, p_max, jsonb_build_object('correct', p_correct), now())
  on conflict (match_id, user_id) do nothing;

  select count(*) into both from public.versus_participants
    where match_id = m.id and finished_at is not null;
  update public.versus_matches
    set status = case when both >= 2 then 'complete'
                      when status = 'open' then 'active' else status end
    where id = m.id returning * into m;
  return m;
end $$;
-- Invoked by the Edge Function forwarding the player's JWT, so auth.uid() is the
-- player. Not callable directly by clients.
revoke execute on function public.finalize_versus_trivia(uuid, int, int, int) from public, anon, authenticated;
grant  execute on function public.finalize_versus_trivia(uuid, int, int, int) to authenticated;
```

Identity note: the Edge Function reads the private tables with the **service-role** client, but calls `finalize_versus_trivia` with the **player's JWT** so `auth.uid()` is the player (hence the `authenticated` grant, guarded by the membership check inside). Keep the score authoritative because it's computed server-side from the private answers, not supplied by the browser.
- [ ] **Step 4** — apply, run isolation test, expect pass.
- [ ] **Step 5** — commit `feat(versus): trivia private question + progress store + finalize RPC`.

---

### Task 2: Edge Function `versus-trivia` — provision / question / answer / finalize

**Files:**
- Create: `quiet-arcade/supabase/functions/versus-trivia/index.ts`
- Create: `quiet-arcade/supabase/functions/versus-trivia/scoring.ts` (pure, unit-tested)
- Create: `quiet-arcade/supabase/functions/versus-trivia/scoring.test.ts`
- Create: `quiet-arcade/supabase/functions/versus-trivia/opentdb.ts` (Deno port of the fetch)

**Interfaces produced (called by Task 3 `versusRepo`):** POST `versus-trivia` with `{ action, matchId, ... }`:
- `provision` → `{ ready: true, count: 15 }` (idempotent; first caller fetches + stores; others no-op).
- `question { index, lifelines: {fifty?:bool, hint?:bool} }` → `{ q, choices, topic, worth, struck?: number[], hint?: string }` (**no** correct index).
- `answer { index, pick, plusOneArmed, secondPick? }` → `{ correct, correctIndex, gain, score, streak, correctCount, secondChance?: bool }`.
- `finalize` → `{ score, max, correct, status }`.

**Design notes:**
- **Auth:** read `Authorization` header, make a JWT-bound client, confirm caller is host/guest of a `game_id='trivia'` match; reject otherwise. Use a separate service-role client for the private tables.
- **Server-authoritative state:** running score/streak/correct/used/struck live in `private.versus_trivia_progress` keyed by `(match_id,user_id)`. `answer` validates `index` == expected (monotonic) and not already answered → prevents replay/skip/inflation.
- **provision race:** `insert ... on conflict do nothing`; take a `pg_advisory_xact_lock(hashtext(match_id::text))` around fetch+insert so two provisions don't double-fetch. If rows exist, no-op.
- **50-50 / hint:** applied in `question` when the lifeline is requested + unused; persist `struck` so `answer` validates picks; `hint` returns stored `hint`.
- **plusOne:** `answer` with `plusOneArmed` + wrong `pick` + plusOne unused → `{correct:false, secondChance:true}`, mark used + strike `pick`, don't finalize the question. Next `answer` carries `secondPick`, which is final and scored normally (a correct second pick still earns `worth + streakBonus`).
- **swap:** over-fetch 20 at provision (15 active + 5 spares stored at ordinals 15-19); `swap` swaps the active ordinal's content with a spare of a different topic. If over-fetch is unreliable, **scope-cut swap in versus mod/hard** and tell the user — do not silently drop.
- **scoring.ts** exports pure `worth`, `streakBonus`, `maxPoints`, `applyCorrect(state)` — unit-tested for parity with the constants.

- [ ] **Step 1** — `scoring.ts` + `scoring.test.ts`; `deno test` proves `maxPoints('hard')` etc. equal `Trivia.tsx`.
- [ ] **Step 2** — `opentdb.ts` (Deno fetch; same params/category map/decode/adapt; over-fetch 20).
- [ ] **Step 3** — `index.ts` dispatch with auth + membership + progress table.
- [ ] **Step 4** — `deno check` clean; `supabase functions serve versus-trivia`; curl each action against a seeded match.
- [ ] **Step 5** — commit `feat(versus): versus-trivia edge function (fetch/adjudicate/score)`.

---

### Task 3: `versusRepo` trivia methods + types

**Files:**
- Modify: `quiet-arcade/src/lib/versus/versusRepo.ts`
- Modify: `quiet-arcade/src/lib/versus/types.ts`

**Interfaces produced (called by Task 4):**
```ts
export interface TriviaVersusConfig { topic: string; mode: "easy" | "moderate" | "hard"; lifelines: string[]; }
export interface TriviaSanitizedQuestion { q: string; choices: string[]; topic: string; worth: number; struck?: number[]; hint?: string; }
export interface TriviaAdjudication { correct: boolean; correctIndex: number; gain: number; score: number; streak: number; correctCount: number; secondChance?: boolean; }

export async function provisionTrivia(matchId: string): Promise<{ ready: boolean; count: number }>;
export async function fetchTriviaQuestion(matchId: string, index: number, lifelines: { fifty?: boolean; hint?: boolean }): Promise<TriviaSanitizedQuestion>;
export async function answerTrivia(matchId: string, body: { index: number; pick: number; plusOneArmed: boolean; secondPick?: number }): Promise<TriviaAdjudication>;
export async function finalizeTrivia(matchId: string): Promise<{ score: number; max: number; correct: number; status: string }>;
```
Each wraps `supabase.functions.invoke("versus-trivia", { body: { action, matchId, ... } })`.

- [ ] Add types; add the four functions; `tsc -b` + lint clean; commit.

---

### Task 4: `Trivia.tsx` adapter + page wiring

**Files:**
- Modify: `quiet-arcade/src/games/Trivia.tsx`
- Modify: `quiet-arcade/src/pages/VersusRoomPage.tsx` (render `TriviaGame` for `game_id==='trivia'`)
- Modify: `quiet-arcade/src/pages/VersusPage.tsx` (Trivia create card: topic + mode + lifelines → `createMatch('trivia', config)`)
- Modify: `quiet-arcade/src/types.ts` (`VersusHooks.matchId: string`)
- Modify: `quiet-arcade/src/components/VersusShell.tsx` (pass `matchId`; skip `submitScore` for authoritative trivia)

**Approach (guarded so single-player is byte-identical):**
- When `api.versus` present: force `setup` from `api.versus.config`; skip the setup phase (auto-start); no daily/practice.
- **Easy versus:** unchanged local flow; `api.finish` → Pillar 1 `submitScore` (deterministic from `api.seed`, both players identical). No server.
- **Moderate/hard versus:** replace local `start`/`pick`/`next` scoring with the server path:
  - `start` → `await provisionTrivia(matchId)` then `fetchTriviaQuestion(matchId,0,{})`.
  - Render the sanitized question (no client-side `answer`). Correctness comes from the `answerTrivia` response.
  - `pick` → `await answerTrivia(...)`; use returned `correct/correctIndex/gain/score/streak`; Plus One second chance from `secondChance`.
  - `fifty`/`hint` → `fetchTriviaQuestion` with the flag (server returns `struck`/`hint`); `swap` per Task 2's decision.
  - `next` → `fetchTriviaQuestion(index+1)`; last → `await finalizeTrivia(...)` then `api.finish({ score, max, perfect: correct===15, ... })`.
- **`VersusShell` change:** for `game_id==='trivia'` mod/hard, the Edge Function already wrote the authoritative participant row via `finalize_versus_trivia`, so `VersusShell.finish` must **not** also call `submitScore` (would double-write / conflict). Gate `submitScore` on `game_id !== 'trivia' || easy mode`. Still flip to the result view + `onSubmitted`.
- Add `matchId` to `VersusHooks` (`types.ts`), set from `view.id` in `VersusShell`.

- [ ] Add `matchId`; branch `Trivia.tsx` on `api.versus` + mode; wire pages + shell; `tsc -b` + lint; commit.

---

### Task 5: End-to-end verification

- [ ] Apply `0003`, run trivia isolation tests, deploy `versus-trivia`.
- [ ] Two anon sessions: create a **hard** Trivia match, join, confirm **identical questions** both sides, per-question adjudication, lifelines, authoritative final score, winner resolves.
- [ ] Confirm answers never appear in network payloads before locking (inspect `versus-trivia` responses).
- [ ] Easy Trivia match still deterministic + client-scored.
- [ ] `tsc -b` + lint clean; commit `test(versus): pillar 2 trivia e2e verified`.

## Self-Review

- Covers spec's Pillar 2: OpenTDB-once, hidden answers, authoritative per-question scoring, easy=vault. ✓
- Scoring constants copied verbatim from `Trivia.tsx`. ✓
- Open risk flagged honestly: **swap** lifeline in server mode (over-fetch spares or scope-cut) — decide with the user during Task 2, don't silently drop.
- `VersusShell.finish` must skip `submitScore` for authoritative trivia (Edge Function writes the row) — noted in Task 4.

## Notes for later pillars
- Pillar 3 (realtime): the `versus_trivia_progress` table + `onProgress` broadcast make live score display straightforward.
- Pillar 4 (matchmaking): `enqueue_match` pairs → provision trivia on pair.
