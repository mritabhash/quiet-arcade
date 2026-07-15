# Versus (1v1 Multiplayer) — Design

**Date:** 2026-07-15
**Status:** Approved (design), pending implementation plan
**Games in scope:** Map Drop, Trivia

## Goal

Add an **online** 1v1 multiplayer mode to Map Drop and Trivia. Two players
complete the same puzzle content and their scores are compared to pick a winner.
Three entry flows, all built on one match abstraction:

1. **Async challenge** — Player A plays, shares a code/link, Player B plays later,
   scores compared once both have submitted.
2. **Real-time rooms** — both join a room via code and play simultaneously with
   **live progress** visible to each other.
3. **Random matchmaking** — a queue pairs two players automatically (two entry
   points: pick game+config, or one-tap Quick Match with defaults).

Local pass-and-play is explicitly **out of scope**.

## Decisions (locked with the user)

- **Online only.** No same-device pass-and-play.
- **Identity: anonymous OK.** Uses the existing auto-anonymous Supabase session
  plus a display `handle`; an unobtrusive "sign in to keep your match history"
  nudge. No sign-in gate before playing.
- **Real-time shows live progress** (opponent presence + running score / current
  question), not just an end reveal.
- **Friend flows are code/link based**; random matchmaking is queue based. No
  spectators.
- **Trivia moderate + hard use OpenTDB**, fetched **once per match** so both
  players get identical questions. Trivia easy uses the local seeded vault.
- **Trivia is authoritative** (cheat-resistant) via a Supabase **Edge Function**:
  answers stay server-side, scoring is computed server-side.
- **Map Drop is client-scored / trusted**, capped by `game_catalog.max_score_cap`.
  Making it authoritative (porting the gazetteer + proximity scoring server-side)
  is a deliberate non-goal for this iteration.
- **No random matchmaking with mismatched config** — players are paired only
  within the same `(game_id, config_key)` bucket.
- **Versus requires Supabase configured.** When `isSupabaseConfigured()` is false,
  the Versus entry is hidden with a friendly note (same pattern as accounts /
  leaderboards).

## Core abstraction: the match

A **match** is the single durable unit. Real-time and async are the *same* match;
Realtime is an optional live transport layered on top.

```
match = {
  id, code, game_id,
  seed,                     // deterministic content driver (Map Drop; Trivia easy)
  config,                   // per-game settings both players share (jsonb)
  max_score,                // ceiling for this game+config
  host_id, guest_id,
  status,                   // 'open' | 'ready' | 'active' | 'complete' | 'expired'
  live,                     // was this a realtime room / matchmaking pairing
  created_at, expires_at
}
```

Winner = higher score. Tiebreaks: **Map Drop** → closer distance (km);
**Trivia** → earlier `finished_at`.

### Per-game config + content

- **Map Drop** — `config = { difficulty }` where difficulty ∈
  `novice | easy | moderate | hard`. Content is derived deterministically from
  `seed` (same puzzle, same hint order). `max_score` from the mode's ceiling.
- **Trivia** — `config = { topic, mode, lifelines }`.
  - `mode = easy` → local seeded vault (`drawRound`), deterministic from `seed`,
    client-scored.
  - `mode = moderate | hard` → OpenTDB, fetched **once** by the Edge Function and
    stored; server-adjudicated and server-scored.

## The adapter contract (why both games "just work")

Both games are already pure consumers of `GameApi` — they take `seed` in and call
`finish(result)` out (`src/components/GameShell.tsx`, `src/types.ts`). Versus adds
a **`VersusShell`** parallel to `GameShell` that provides the same `GameApi`, but:

- `seed` = the **match seed** (not daily/practice)
- `finish` = **submit score to the match** (not `recordResult`/`setDailyCompletion`)
- a new optional `api.versus` hook:

```ts
interface VersusHooks {
  config: MapDropVersusConfig | TriviaVersusConfig; // shared match config
  onProgress: (p: VersusProgress) => void;          // live updates (realtime)
  // Trivia authoritative path only:
  adjudicate?: (answer: TriviaAnswer) => Promise<TriviaAdjudication>;
}

// api.versus is optional on GameApi; when absent, games behave exactly as today.
```

Each game gets a **small, contained edit**: when `api.versus` is present, read its
`config` instead of localStorage, emit `onProgress` at each step, and (Trivia
mod/hard) route answers through `adjudicate` instead of local checking. Otherwise
the games are unchanged and single-player is untouched.

- **Map Drop** — `onProgress`: presence + "locked in" + final. Client computes and
  submits the score via `finish` (trusted, capped).
- **Trivia** — `onProgress`: `{ questionIndex, score }`. Easy: local scoring.
  Moderate/hard: each pick goes through `adjudicate` (server), which returns
  correct/incorrect (+ Plus One retry allowance) and the running authoritative
  score; the final score comes from the server, not the client.

## Data flow

```
Async:
  Host  create_versus_match(game, config) -> code + link -> play -> submit
  Guest open code/link -> get_versus_match(code) -> same seed+config -> play -> submit
  both submitted -> reveal winner

Real-time:
  same match, both join Realtime channel versus:<code>
  presence -> host broadcasts start -> both play, broadcasting live progress -> reveal

Matchmaking:
  enqueue_match(game, config_key) -> atomically pair oldest waiting compatible player
  on pair: create live match, notify both via Realtime -> real-time flow above
```

## Supabase schema — new migration `0002_versus.sql`

Follows the existing security model (`0001_accounts_and_leaderboards.sql`): strict
RLS ENABLED + FORCED, `auth.uid()`-scoped policies, `SECURITY DEFINER` RPCs for
anything that needs cross-user discovery, reuse of `game_catalog` for score caps,
and a `private` schema for anything the API roles must never read.

### Tables

- **`public.versus_matches`** — the match rows above.
  RLS: `select`/`update` only where `auth.uid() in (host_id, guest_id)`. No direct
  `insert` by API roles (created via RPC).
- **`public.versus_participants`** — `(match_id, user_id, handle, score, max,
  detail jsonb, finished_at)`. RLS scoped so a user reads participants of matches
  they belong to; writes go through the submit RPC / Edge Function only.
- **`public.versus_queue`** — `(user_id, game_id, config_key, config jsonb,
  enqueued_at)`. RLS: a user sees/deletes only their own queue row; pairing is done
  by a `SECURITY DEFINER` RPC with row locking.
- **`private.versus_trivia_questions`** — `(match_id, ordinal, question, choices,
  correct_index, meta)`. **Service-role only** (revoked from anon/authenticated).
  Holds OpenTDB answers; never exposed to clients.

### RPCs (SECURITY DEFINER, in `public`)

- `create_versus_match(game_id, config)` → inserts a match with a unique 6-char
  code, `host_id = auth.uid()`, computes `seed` and `max_score`, returns the row.
- `join_versus_match(code)` → atomically sets `guest_id = auth.uid()` if empty and
  not the host; errors if full. Returns the match.
- `get_versus_match(code)` → returns seed + config + status to anyone holding the
  code (these are not secret) so the guest can load and play; participant identity
  fields limited for non-participants.
- `submit_versus_score(match_id, score, max, detail)` → validates
  `score <= game_catalog.max_score_cap`, upserts the caller's participant row,
  flips match `status` to `complete` when both submitted. **Map Drop + Trivia easy.**
- `enqueue_match(game_id, config_key, config)` → row-locks `versus_queue`, pairs
  with the oldest compatible waiting row (creates a live match, deletes both queue
  rows, returns the match) or inserts the caller and returns `waiting`.
- `dequeue_match()` → removes the caller's queue row (cancel).

### Edge Function `versus-trivia` (Deno) — Trivia moderate/hard authority

One function, `action`-dispatched:

- `provision(match_id)` — fetch the OpenTDB round once (mode→difficulty,
  topic→category, `type=multiple`, `encode=url3986`, retry without category if
  sparse — mirrors `src/data/trivia/opentdb.ts`), insert into
  `private.versus_trivia_questions`, mark match `ready`. Idempotent per match.
- `question(match_id, index)` — return the **sanitized** question (text + shuffled
  choices, no correct flag). Applies 50-50 (strike 2 wrongs) and Host Hint
  (first-letter, leak-checked) server-side when those lifelines are armed.
- `answer(match_id, index, pick, lifelines)` — check against the stored answer,
  apply ladder × mode multiplier + streak bonus + lifeline rules (Plus One retry,
  etc.), accumulate the **authoritative** score, reveal correctness. Ported from
  `src/games/Trivia.tsx` scoring.
- `finalize(match_id)` — write the authoritative `score`/`finished_at` to
  `versus_participants`, flip status when both done.

Invoked from the client via `supabase.functions.invoke`. Uses the service-role key
(function env only) to read `private.versus_trivia_questions`.

## Client layer

- **`src/lib/versus/versusRepo.ts`** — thin wrapper over the RPCs + Edge Function
  (`createMatch`, `joinMatch`, `getMatch`, `submitScore`, `enqueue`, `dequeue`,
  and trivia `provision`/`question`/`answer`/`finalize`). Null-safe when Supabase
  is unconfigured (Versus hidden).
- **`src/lib/versus/realtime.ts`** — Supabase Realtime channel helper: presence,
  `start`/`progress`/`reveal` broadcast events on `versus:<code>`.
- **`src/context/VersusMatchContext.tsx`** — loads a match by code, tracks
  opponent state (presence, live progress, submitted), exposes it to the room UI.
- **`src/components/VersusShell.tsx`** — parallel to `GameShell`; builds the
  `GameApi` (match seed + submit `finish` + `api.versus` hooks) and renders the
  game component. No daily/practice toggle; shows the versus scoreboard/live strip.

## Routes / UI

- **`/versus`** — lobby: Create match (pick game + config), Join by code, Quick
  Match, "Find a match" (pick game+config → queue), and a list of your recent
  matches. Hidden when Supabase unconfigured.
- **`/versus/:code`** — match room. Renders the game through `VersusShell`;
  handles async vs live; shows challenge link `…/quiet-arcade/versus/<code>`;
  **Rematch** = same config, new seed/code.
- Nav gains **"Versus"** (hidden when Supabase unconfigured).

## Error handling

- **Unconfigured Supabase** → Versus routes/nav hidden; direct navigation shows a
  friendly "multiplayer needs an account backend" panel.
- **Match full / not found / expired** → clear message on join; expired matches
  (`expires_at`) are read-only with the final result if any.
- **OpenTDB fetch fails** (Edge Function `provision`) → surface a retry; the match
  stays `open`/`ready` and both players see "couldn't load questions, retry."
  (No silent fallback to different questions — that would break fairness.)
- **Opponent disconnects (realtime)** → presence drop shows "opponent left"; the
  match can still complete async (the durable row persists), so the present player
  finishes and the result resolves when/if the opponent submits, or on expiry.
- **Double submit / race** → submit RPC is idempotent per `(match_id, user_id)`;
  status flip to `complete` is guarded.

## Testing strategy

- **SQL isolation tests** (`supabase/tests/`, extending the existing GUC-simulated
  A/B pattern): RLS on `versus_matches`/`participants`/`queue` (non-participant
  cannot read/write), `join`/`enqueue` race/atomicity, score cap enforcement,
  `private.versus_trivia_questions` unreadable by anon/authenticated.
- **Edge Function**: unit-test scoring parity against `src/games/Trivia.tsx`
  (same inputs → same score), answer hiding (sanitized payload never contains the
  correct index), idempotent `provision`.
- **Client**: `versusRepo` against a local/preview Supabase; `VersusShell` builds a
  correct `GameApi`; both game adapters read versus config and emit progress.
- **End-to-end in the preview browser** (two tabs / two anon sessions): async Map
  Drop, async Trivia (easy + hard), realtime room with live progress, matchmaking
  pairing + Quick Match. Verify `npx tsc -b` clean and `npm run lint` (oxlint) with
  no new warnings — per project convention.

## Build order (each pillar ships + verifies independently)

1. **Schema + RPCs + `versusRepo` + `VersusShell`/`api.versus` + Map Drop async.**
   Cheapest path that exercises the whole match abstraction end-to-end.
2. **Trivia Edge Function** (fetch / adjudicate / score) → Trivia async challenge.
3. **Realtime layer** — presence, live progress, start/reveal (both games).
4. **Matchmaking queue** — bucket + Quick Match, on top of realtime.

## Known limitations (explicit)

- **Map Drop scores are trusted** (client-submitted, capped). Only Trivia
  mod/hard is cheat-resistant this iteration.
- **Trivia mod/hard matches are online-only** and involve a per-question server
  round-trip (the cost of hiding answers while keeping interactivity).
- **Daily leaderboards remain unaffected** — Versus is a separate surface and does
  not write to the daily score tables.

## Human setup (beyond code)

- Run `supabase/migrations/0002_versus.sql`.
- Deploy the `versus-trivia` Edge Function; set its OpenTDB + service-role env.
- Enable Supabase **Realtime** on the relevant channels/tables.
- (Existing) anonymous auth already enabled per `0001`.
