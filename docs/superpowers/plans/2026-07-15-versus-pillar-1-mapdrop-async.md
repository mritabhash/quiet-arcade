# Versus Pillar 1 — Schema + Shell + Map Drop Async — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship end-to-end **asynchronous 1v1** for Map Drop: two players load the same match by code, each plays the same seeded puzzle, scores are submitted to Supabase and compared to pick a winner.

**Architecture:** One durable `versus_matches` + `versus_participants` schema fronted by `SECURITY DEFINER` RPCs (mirroring `0001`'s security model). A `versusRepo` client wraps the RPCs. A `VersusShell` parallel to `GameShell` supplies the existing `GameApi` but with the match seed and a submit-to-match `finish`, plus an optional `api.versus` hook. Map Drop gets a small adapter edit so that when `api.versus` is present it plays a single shared puzzle and submits its trusted (capped) score. This is Pillar 1 of 4; realtime, the Trivia Edge Function, and matchmaking are separate plans that build on this foundation.

**Tech Stack:** React 19 + Vite 8 + Tailwind 4, TypeScript (`erasableSyntaxOnly` — no constructor parameter properties, no enums), `@supabase/supabase-js`, Supabase Postgres (RLS + plpgsql RPCs), react-router-dom v6.

## Global Constraints

- **Design spec:** `docs/superpowers/specs/2026-07-15-versus-1v1-design.md` — this plan implements only Pillar 1 of its build order.
- **Vite base is `/quiet-arcade/`**; `BrowserRouter` uses `basename={import.meta.env.BASE_URL}`. Challenge links are `<origin>/quiet-arcade/versus/<code>`.
- **Verify with** `cd quiet-arcade && npx tsc -b` (run inside the project dir or npx installs a bogus `tsc`) and `npm run lint` (oxlint — a handful of pre-existing warnings are expected; add **zero** new ones).
- **No JS unit-test runner exists.** Frontend "tests" = `tsc -b` + `npm run lint` + browser E2E via the preview tools. Backend tests = SQL isolation tests in `supabase/tests/` (self-rolling-back, GUC-simulated users, matching `isolation_tests.sql`).
- **Supabase security model (copy verbatim from `0001`):** every user table `enable`+`force row level security`; policies scoped to `auth.uid()`; cross-user discovery only via `SECURITY DEFINER ... set search_path = ''` functions with `execute` revoked from `public` and granted narrowly; reuse `public.game_catalog.max_score_cap` for score ceilings; anything secret lives in `private` with all grants revoked from `anon, authenticated`.
- **Guest/offline parity:** when `isSupabaseConfigured()` is false (`src/lib/supabaseClient.ts`), Versus nav + routes are hidden and direct navigation shows a friendly panel. Single-player behavior must be byte-for-byte unchanged when `api.versus` is absent.
- **`erasableSyntaxOnly`:** use `type`/`interface` + `as const` unions (see `Difficulty` in `MapDrop.tsx`), never `enum`, never `private x` constructor params (see the trivia-overhaul note: `Bank` de-sugars `topic` explicitly).
- **GateGuard hook:** the first Bash/Edit/Write per file per session is blocked until you state facts (importers, affected API, the user's verbatim instruction). Present them and retry. For brand-new large files, expect the first Write to be gated once.

---

### Task 1: Migration `0002_versus.sql` — tables, RLS, RPCs, isolation tests

**Files:**
- Create: `quiet-arcade/supabase/migrations/0002_versus.sql`
- Create: `quiet-arcade/supabase/tests/versus_isolation_tests.sql`
- Modify: `quiet-arcade/supabase/README.md` (append a Versus setup line)

**Interfaces:**
- Consumes: `public.game_catalog(game_id, max_score_cap)` from `0001`.
- Produces (called by Task 2 `versusRepo` via `supabase.rpc(...)`):
  - `create_versus_match(p_game_id text, p_config jsonb) returns public.versus_matches`
  - `join_versus_match(p_code text) returns public.versus_matches`
  - `get_versus_match(p_code text) returns jsonb` — `{ id, code, game_id, seed, config, max_score, status, host_id, guest_id, you_are ('host'|'guest'|'none'), participants: [{ role, handle, score, max, finished_at }] }`
  - `submit_versus_score(p_match_id uuid, p_score int, p_max int, p_detail jsonb) returns public.versus_matches`

- [ ] **Step 1: Write the failing isolation test**

Create `quiet-arcade/supabase/tests/versus_isolation_tests.sql`. It runs in a transaction that rolls back, simulating two users by setting the `request.jwt.claims` GUC (same technique as `isolation_tests.sql`).

```sql
-- Versus RLS + RPC isolation tests. Run in the SQL editor; rolls itself back.
begin;

-- two fake users
create or replace function tests.as_user(p uuid) returns void
  language sql as $$ select set_config('request.jwt.claims', json_build_object('sub', p, 'role','authenticated')::text, true); $$;

do $$
declare
  a uuid := '11111111-1111-1111-1111-111111111111';
  b uuid := '22222222-2222-2222-2222-222222222222';
  c uuid := '33333333-3333-3333-3333-333333333333';
  m public.versus_matches;
  code text;
begin
  -- A creates a match
  perform tests.as_user(a);
  m := public.create_versus_match('map-drop', '{"difficulty":"hard"}'::jsonb);
  code := m.code;
  assert m.host_id = a, 'host is A';
  assert m.status = 'open', 'new match is open';

  -- B joins by code
  perform tests.as_user(b);
  m := public.join_versus_match(code);
  assert m.guest_id = b, 'guest is B';

  -- C (stranger) cannot read the base row directly
  perform tests.as_user(c);
  assert (select count(*) from public.versus_matches where id = m.id) = 0,
    'stranger cannot select match row';

  -- but C also cannot join a full match
  begin
    perform public.join_versus_match(code);
    assert false, 'join should fail on full match';
  exception when others then null;
  end;

  -- A submits a score above the cap -> rejected
  perform tests.as_user(a);
  begin
    perform public.submit_versus_score(m.id, 999999, 5000, '{}'::jsonb);
    assert false, 'over-cap score should fail';
  exception when others then null;
  end;

  -- A submits a valid score
  m := public.submit_versus_score(m.id, 4200, 5000, '{"dist":140}'::jsonb);
  assert m.status = 'active', 'one submitted -> active';

  -- B submits -> complete
  perform tests.as_user(b);
  m := public.submit_versus_score(m.id, 3900, 5000, '{"dist":410}'::jsonb);
  assert m.status = 'complete', 'both submitted -> complete';

  raise notice 'versus isolation tests passed';
end $$;

rollback;
```

- [ ] **Step 2: Run it to verify it fails**

Run in the Supabase SQL editor (or `supabase db execute`). Expected: FAIL — `function public.create_versus_match(...) does not exist` (migration not applied yet). This confirms the test exercises the real objects.

- [ ] **Step 3: Write the migration — tables + RLS**

Create `quiet-arcade/supabase/migrations/0002_versus.sql`:

```sql
-- ============================================================================
-- Quiet Arcade — Versus (1v1) schema. Pillar 1: matches, participants, RPCs.
-- Security model mirrors 0001: RLS enabled+forced, auth.uid()-scoped policies,
-- SECURITY DEFINER RPCs for code-based discovery, game_catalog score caps.
-- ============================================================================

create table public.versus_matches (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  game_id    text not null references public.game_catalog (game_id),
  seed       bigint not null,
  config     jsonb not null default '{}'::jsonb
             check (pg_column_size(config) < 8192),
  max_score  integer not null check (max_score > 0),
  host_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  guest_id   uuid references auth.users (id) on delete set null,
  status     text not null default 'open'
             check (status in ('open','active','complete','expired')),
  live       boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 days'
);

create index versus_matches_host_idx  on public.versus_matches (host_id);
create index versus_matches_guest_idx on public.versus_matches (guest_id);

alter table public.versus_matches enable row level security;
alter table public.versus_matches force row level security;

-- Participants read/update their own match rows only. Discovery-by-code and all
-- writes go through the SECURITY DEFINER RPCs below.
create policy "participants read match" on public.versus_matches
  for select to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id);
revoke insert, update, delete on public.versus_matches from anon, authenticated;

create table public.versus_participants (
  match_id    uuid not null references public.versus_matches (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  handle      text check (handle is null or handle ~ '^[A-Za-z0-9_ -]{1,24}$'),
  score       integer check (score is null or score >= 0),
  max         integer check (max is null or max >= 1),
  detail      jsonb not null default '{}'::jsonb check (pg_column_size(detail) < 8192),
  finished_at timestamptz,
  primary key (match_id, user_id)
);

alter table public.versus_participants enable row level security;
alter table public.versus_participants force row level security;

create policy "read participants of my match" on public.versus_participants
  for select to authenticated
  using (exists (
    select 1 from public.versus_matches m
    where m.id = match_id and (auth.uid() = m.host_id or auth.uid() = m.guest_id)
  ));
revoke insert, update, delete on public.versus_participants from anon, authenticated;
```

- [ ] **Step 4: Write the migration — RPCs**

Append to `0002_versus.sql`:

```sql
-- Random 6-char A-Z0-9 code (no ambiguous chars omitted — casual use).
create or replace function private.gen_versus_code() returns text
  language sql volatile security definer set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    (floor(random()*32)+1)::int, 1), '') from generate_series(1,6);
$$;
revoke execute on function private.gen_versus_code() from public, anon, authenticated;

create or replace function public.create_versus_match(p_game_id text, p_config jsonb)
returns public.versus_matches
language plpgsql security definer set search_path = '' as $$
declare v_cap int; v_code text; m public.versus_matches; tries int := 0;
begin
  if auth.uid() is null then raise exception 'must be signed in'; end if;
  select max_score_cap into v_cap from public.game_catalog where game_id = p_game_id;
  if v_cap is null then raise exception 'unknown game_id %', p_game_id; end if;
  loop
    v_code := private.gen_versus_code();
    begin
      insert into public.versus_matches (code, game_id, seed, config, max_score, host_id)
      values (v_code, p_game_id,
              (floor(random() * 2147483647))::bigint,
              coalesce(p_config, '{}'::jsonb), v_cap, auth.uid())
      returning * into m;
      return m;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;
revoke execute on function public.create_versus_match(text, jsonb) from anon;
grant  execute on function public.create_versus_match(text, jsonb) to authenticated;

create or replace function public.join_versus_match(p_code text)
returns public.versus_matches
language plpgsql security definer set search_path = '' as $$
declare m public.versus_matches;
begin
  select * into m from public.versus_matches where code = p_code for update;
  if m.id is null then raise exception 'no such match'; end if;
  if m.status = 'expired' or m.expires_at < now() then raise exception 'match expired'; end if;
  if m.host_id = auth.uid() then return m; end if;              -- host re-opening
  if m.guest_id is not null and m.guest_id <> auth.uid() then
    raise exception 'match is full';
  end if;
  update public.versus_matches
    set guest_id = auth.uid(), status = case when status = 'open' then 'active' else status end
    where id = m.id returning * into m;
  return m;
end $$;
revoke execute on function public.join_versus_match(text) from anon;
grant  execute on function public.join_versus_match(text) to authenticated;

-- Returns seed+config to any signed-in holder of the code (not secret), plus a
-- sanitized participant list. Non-participants get you_are='none'.
create or replace function public.get_versus_match(p_code text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.versus_matches; parts jsonb;
begin
  select * into m from public.versus_matches where code = p_code;
  if m.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'role', case when p.user_id = m.host_id then 'host' else 'guest' end,
      'handle', p.handle, 'score', p.score, 'max', p.max, 'finished_at', p.finished_at)), '[]'::jsonb)
    into parts from public.versus_participants p where p.match_id = m.id;
  return jsonb_build_object(
    'id', m.id, 'code', m.code, 'game_id', m.game_id, 'seed', m.seed,
    'config', m.config, 'max_score', m.max_score, 'status', m.status, 'live', m.live,
    'host_id', m.host_id, 'guest_id', m.guest_id, 'expires_at', m.expires_at,
    'you_are', case when auth.uid() = m.host_id then 'host'
                    when auth.uid() = m.guest_id then 'guest' else 'none' end,
    'participants', parts);
end $$;
revoke execute on function public.get_versus_match(text) from anon;
grant  execute on function public.get_versus_match(text) to authenticated;

create or replace function public.submit_versus_score(
  p_match_id uuid, p_score int, p_max int, p_detail jsonb)
returns public.versus_matches
language plpgsql security definer set search_path = '' as $$
declare m public.versus_matches; v_handle text; both int;
begin
  select * into m from public.versus_matches where id = p_match_id for update;
  if m.id is null then raise exception 'no such match'; end if;
  if auth.uid() not in (m.host_id, coalesce(m.guest_id, m.host_id)) then
    raise exception 'not a participant';
  end if;
  if p_score < 0 or p_max < 1 or p_score > p_max then raise exception 'invalid score'; end if;
  if p_max > m.max_score then raise exception 'max exceeds ceiling'; end if;

  select handle into v_handle from public.profiles where user_id = auth.uid();
  insert into public.versus_participants (match_id, user_id, handle, score, max, detail, finished_at)
    values (m.id, auth.uid(), v_handle, p_score, p_max, coalesce(p_detail,'{}'::jsonb), now())
  on conflict (match_id, user_id) do nothing;  -- idempotent: first submit wins

  select count(*) into both from public.versus_participants
    where match_id = m.id and finished_at is not null;
  update public.versus_matches
    set status = case when both >= 2 then 'complete'
                      when status = 'open' then 'active' else status end
    where id = m.id returning * into m;
  return m;
end $$;
revoke execute on function public.submit_versus_score(uuid, int, int, jsonb) from anon;
grant  execute on function public.submit_versus_score(uuid, int, int, jsonb) to authenticated;
```

- [ ] **Step 5: Apply migration + run the isolation test to verify it passes**

Apply `0002_versus.sql` (SQL editor or `supabase db push`), then re-run `versus_isolation_tests.sql`. Expected: `NOTICE: versus isolation tests passed`, transaction rolls back. If the `tests.as_user` helper schema is missing, reuse the one already defined in `isolation_tests.sql` (run that file's helper section first, as the existing suite does).

- [ ] **Step 6: Append the human-setup note to README**

In `quiet-arcade/supabase/README.md`, add under the setup checklist: `- Run migrations/0002_versus.sql, then supabase/tests/versus_isolation_tests.sql to confirm Versus RLS.`

- [ ] **Step 7: Commit**

```bash
cd quiet-arcade
git add supabase/migrations/0002_versus.sql supabase/tests/versus_isolation_tests.sql supabase/README.md
git commit -m "feat(versus): match schema + RPCs + isolation tests (pillar 1)"
```

---

### Task 2: `versusRepo` client wrapper + shared types

**Files:**
- Create: `quiet-arcade/src/lib/versus/types.ts`
- Create: `quiet-arcade/src/lib/versus/versusRepo.ts`
- Test: `npx tsc -b` (type-level contract check)

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabaseClient.ts`; the four RPCs from Task 1.
- Produces (used by Tasks 4–6):
  - types `VersusMatch`, `VersusParticipant`, `VersusView`, `MapDropVersusConfig`
  - `createMatch(gameId, config): Promise<VersusMatch>`
  - `joinMatch(code): Promise<VersusMatch>`
  - `getMatch(code): Promise<VersusView | null>`
  - `submitScore(matchId, score, max, detail): Promise<VersusMatch>`
  - `versusAvailable(): boolean`

- [ ] **Step 1: Write the types**

Create `quiet-arcade/src/lib/versus/types.ts`:

```ts
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
```

- [ ] **Step 2: Write the repo wrapper**

Create `quiet-arcade/src/lib/versus/versusRepo.ts`:

```ts
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
```

- [ ] **Step 3: Verify it typechecks**

Run: `cd quiet-arcade && npx tsc -b`
Expected: PASS (no errors). Then `npm run lint` — expected: no new warnings.

- [ ] **Step 4: Commit**

```bash
cd quiet-arcade
git add src/lib/versus/types.ts src/lib/versus/versusRepo.ts
git commit -m "feat(versus): client repo wrapper + shared types"
```

---

### Task 3: Extend `GameApi` with the optional `api.versus` hook

**Files:**
- Modify: `quiet-arcade/src/types.ts:47-55`

**Interfaces:**
- Consumes: `VersusConfig`, `VersusProgress` from Task 2.
- Produces: `GameApi.versus?: VersusHooks` — read by `VersusShell` (Task 4) and Map Drop (Task 5). Single-player callers leave it `undefined`, so existing games are unaffected.

- [ ] **Step 1: Add the type**

In `quiet-arcade/src/types.ts`, add above `GameApi` (import types at top of file):

```ts
import type { VersusConfig, VersusProgress } from "./lib/versus/types";

export interface VersusHooks {
  /** the shared, both-players-identical match config */
  config: VersusConfig;
  /** which side the local player is */
  role: "host" | "guest";
  /** live update to broadcast (no-op until the realtime pillar wires it up) */
  onProgress: (p: VersusProgress) => void;
}
```

Then add one optional field to `GameApi`:

```ts
export interface GameApi {
  seed: number;
  mode: Mode;
  dateKey: string;
  showExplanations: boolean;
  finish: (result: GameResult) => void;
  playAgain?: () => void;
  /** present only in a Versus match; single-player leaves it undefined */
  versus?: VersusHooks;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `cd quiet-arcade && npx tsc -b`
Expected: PASS — no existing game references `api.versus`, so nothing breaks.

- [ ] **Step 3: Commit**

```bash
cd quiet-arcade
git add src/types.ts
git commit -m "feat(versus): optional api.versus hook on GameApi"
```

---

### Task 4: `VersusShell` + `useVersusMatch` hook

**Files:**
- Create: `quiet-arcade/src/lib/versus/useVersusMatch.ts`
- Create: `quiet-arcade/src/components/VersusShell.tsx`

**Interfaces:**
- Consumes: `getMatch`/`joinMatch`/`submitScore` (Task 2), `GameApi`/`VersusHooks` (Task 3).
- Produces: `<VersusShell code={string} render={(api: GameApi) => ReactNode} />` and `useVersusMatch(code)` → `{ view, loading, error, refresh }`.

- [ ] **Step 1: Write the match-loading hook**

Create `quiet-arcade/src/lib/versus/useVersusMatch.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { getMatch, joinMatch } from "./versusRepo";
import type { VersusView } from "./types";

/** Loads a match by code and, if the viewer isn't already a participant and a
 *  slot is open, claims the guest seat. Poll `refresh` to see the opponent's
 *  submission in the async flow (realtime replaces polling in pillar 3). */
export function useVersusMatch(code: string) {
  const [view, setView] = useState<VersusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const v = await getMatch(code);
      setView(v);
      setError(v ? null : "Match not found.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let v = await getMatch(code);
        if (v && v.you_are === "none" && v.guest_id === null && v.status !== "expired") {
          await joinMatch(code);
          v = await getMatch(code);
        }
        if (alive) {
          setView(v);
          setError(v ? null : "Match not found.");
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  return { view, loading, error, refresh };
}
```

- [ ] **Step 2: Write `VersusShell`**

Create `quiet-arcade/src/components/VersusShell.tsx`. It builds a `GameApi` whose `finish` submits to the match instead of recording daily/practice stats, and passes `api.versus`. It renders a lightweight scoreboard (opponent's submitted score via `refresh`), not the daily/practice toggle.

```tsx
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { GameApi, GameResult } from "../types";
import type { VersusView } from "../lib/versus/types";
import { submitScore } from "../lib/versus/versusRepo";
import { Button, Chip } from "./ui";

export function VersusShell({
  view,
  onSubmitted,
  render,
}: {
  view: VersusView;
  onSubmitted: () => void; // parent refreshes to reveal the opponent
  render: (api: GameApi) => ReactNode;
}) {
  const [result, setResult] = useState<GameResult | null>(null);
  const role: "host" | "guest" = view.you_are === "guest" ? "guest" : "host";

  const finish = useCallback(
    (r: GameResult) => {
      setResult((prev) => {
        if (prev) return prev;
        void submitScore(view.id, r.score, r.max, { detail: r.label ?? "" }).then(onSubmitted);
        return r;
      });
    },
    [view.id, onSubmitted],
  );

  const api: GameApi = useMemo(
    () => ({
      seed: view.seed,
      mode: "practice", // versus never writes daily stats
      dateKey: "",
      showExplanations: false,
      finish,
      versus: {
        config: view.config,
        role,
        onProgress: () => {}, // wired up in the realtime pillar
      },
    }),
    [view.seed, view.config, role, finish],
  );

  const me = view.participants.find((p) => p.role === role);
  const them = view.participants.find((p) => p.role !== role);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Versus — {view.game_id}</h1>
        <div className="flex items-center gap-2">
          <Chip>You: {me?.score ?? "—"}</Chip>
          <Chip>Opponent: {them?.score ?? "waiting…"}</Chip>
        </div>
      </div>

      {result ? (
        <VersusResult view={view} onRefresh={onSubmitted} />
      ) : (
        <div className="mt-6">{render(api)}</div>
      )}
    </div>
  );
}

function VersusResult({ view, onRefresh }: { view: VersusView; onRefresh: () => void }) {
  const host = view.participants.find((p) => p.role === "host");
  const guest = view.participants.find((p) => p.role === "guest");
  const complete = view.status === "complete";
  const winner =
    complete && host?.score != null && guest?.score != null
      ? host.score === guest.score
        ? "Tie"
        : host.score > guest.score
          ? "host"
          : "guest"
      : null;

  return (
    <div className="mt-8 qa-card rounded-3xl p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest qa-muted">
        {complete ? "Match complete" : "Your score is in"}
      </p>
      <div className="mt-4 flex items-center justify-center gap-8 font-display text-4xl font-semibold">
        <span>{host?.score ?? "—"}</span>
        <span className="text-base qa-muted">vs</span>
        <span>{guest?.score ?? "—"}</span>
      </div>
      {complete ? (
        <p className="mt-4 text-sm qa-muted">
          {winner === "Tie" ? "A dead heat." : `Winner: the ${winner}.`}
        </p>
      ) : (
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={onRefresh}>Check for opponent</Button>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/versus">
          <Button variant="secondary">Back to Versus</Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it typechecks + lints**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: PASS / no new warnings. (Map Drop isn't wired in yet — that's Task 5.)

- [ ] **Step 4: Commit**

```bash
cd quiet-arcade
git add src/lib/versus/useVersusMatch.ts src/components/VersusShell.tsx
git commit -m "feat(versus): VersusShell + match-loading hook"
```

---

### Task 5: Map Drop adapter — play a shared puzzle in versus, submit trusted score

**Files:**
- Modify: `quiet-arcade/src/games/MapDrop.tsx` (difficulty source; skip flagship recording; single-round versus)

**Interfaces:**
- Consumes: `api.versus` (Task 3). When present, `api.versus.config` is a `MapDropVersusConfig`.
- Produces: nothing new — reuses the existing `api.finish(GameResult)`; `VersusShell.finish` routes it to `submitScore`.

Map Drop already derives its puzzle from `api.seed` and computes a capped score, so the adapter is small: (1) in versus, force the difficulty from config and hide the difficulty tabs; (2) don't call `recordFlagshipRound` (versus isn't a flagship daily/free-play round). No scoring math changes — the trusted score flows through `api.finish` untouched.

- [ ] **Step 1: Source difficulty from versus config**

In `MapDrop.tsx`, replace the difficulty initial state (line 97) so a versus match pins it:

```tsx
  const versusDifficulty = api.versus
    ? (api.versus.config as { difficulty?: Difficulty }).difficulty
    : undefined;
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => versusDifficulty ?? readDifficulty(),
  );
```

- [ ] **Step 2: Hide the difficulty tabs + block switching in versus**

In `switchDifficulty` (line 191) add an early return, and in the tablist render (lines 366-386) wrap the difficulty `<div className="flex rounded-xl …">` in `{!api.versus && ( … )}`:

```tsx
  const switchDifficulty = (d: Difficulty) => {
    if (api.versus) return; // config is fixed for a match
    if (d === difficulty || outcome) return;
    setDifficulty(d);
    write(DIFFICULTY_KEY, d);
    setRevealed(1);
    bump();
  };
```

- [ ] **Step 3: Skip flagship recording in versus**

In `finishRound` (line 244), guard the `recordFlagshipRound` call so versus rounds don't touch flagship stats (the score still goes out via `api.finish`):

```tsx
  const finishRound = () => {
    if (!outcome) return;
    if (!api.versus) {
      recordFlagshipRound("map-drop", api.mode, {
        score: outcome.score,
        max: maxScore,
        won: outcome.dist <= 600,
        perfect: outcome.score === maxScore,
        hintsUsed: revealed,
        puzzleId: place.id,
      });
    }
    api.finish({
      score: outcome.score,
      max: maxScore,
      perfect: outcome.score === maxScore,
      label: `${place.name}, ${place.country} — ${modeLabel}, ${revealed}/${totalHints} hints, ${outcome.dist.toLocaleString()} km off.`,
      share: [
        "Quiet Arcade: Map Drop",
        `Score: ${outcome.score.toLocaleString()}/${maxScore.toLocaleString()}`,
        `Difficulty: ${modeLabel}`,
        `Distance: ${outcome.dist.toLocaleString()} km`,
        `Hints used: ${revealed}/${totalHints}`,
      ],
    });
  };
```

Note: the easy-mode path delegates to `MapTapEasy` (line 271), which runs five rounds. For versus, easy still works but scores its five-round total; that is consistent between both players (same seed) and needs no change here. Difficulty `easy` remains valid config.

- [ ] **Step 4: Verify single-player is unchanged + versus compiles**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: PASS / no new warnings. Manual reasoning check: when `api.versus` is `undefined`, every new branch is skipped, so single-player Map Drop is byte-for-byte the same.

- [ ] **Step 5: Commit**

```bash
cd quiet-arcade
git add src/games/MapDrop.tsx
git commit -m "feat(versus): Map Drop adapter (fixed config, trusted submit)"
```

---

### Task 6: Routes, Nav entry, Versus lobby + match room pages

**Files:**
- Create: `quiet-arcade/src/pages/VersusPage.tsx` (lobby)
- Create: `quiet-arcade/src/pages/VersusRoomPage.tsx` (match room)
- Modify: `quiet-arcade/src/App.tsx:87-96` (add two routes)
- Modify: the nav component (find via grep in Step 1) — add a Versus link gated on `versusAvailable()`

**Interfaces:**
- Consumes: `versusAvailable`/`createMatch` (Task 2), `useVersusMatch` (Task 4), `VersusShell` (Task 4), `MapDropGame` (`src/games/MapDrop.tsx`).
- Produces: routes `/versus` and `/versus/:code`.

- [ ] **Step 1: Locate the nav component**

Run: `cd quiet-arcade && grep -rl "leaderboards\|Ranks\|to=\"/account\"" src/components src/App.tsx`
Expected: the file rendering the nav links (e.g. `src/components/Nav.tsx`). Read it to copy the existing link markup pattern.

- [ ] **Step 2: Write the lobby page**

Create `quiet-arcade/src/pages/VersusPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { versusAvailable, createMatch } from "../lib/versus/versusRepo";
import type { MapDropVersusConfig } from "../lib/versus/types";
import { Button, Chip } from "../components/ui";

const DIFFICULTIES = ["novice", "easy", "moderate", "hard"] as const;

export function VersusPage() {
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState<MapDropVersusConfig["difficulty"]>("hard");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!versusAvailable()) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Versus</h1>
        <p className="mt-4 qa-muted">
          1v1 matches need the accounts backend. Once Supabase is configured, you can
          challenge a friend to the same puzzle.
        </p>
        <Link to="/games" className="mt-6 inline-block">
          <Button variant="secondary">Back to games</Button>
        </Link>
      </div>
    );
  }

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await createMatch("map-drop", { difficulty });
      nav(`/versus/${m.code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) nav(`/versus/${c}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="font-display text-3xl font-semibold">Versus — 1v1</h1>
      <p className="mt-2 qa-muted">Create a match, share the code, play the same puzzle.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="qa-card rounded-3xl p-6">
          <h2 className="font-display text-xl font-semibold">Create a Map Drop match</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={`rounded-lg px-3 py-1 text-sm font-semibold capitalize ${
                  difficulty === d ? "bg-teal-600 text-sand-50" : "qa-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <Button className="mt-5" onClick={create} disabled={busy}>
            {busy ? "Creating…" : "Create match"}
          </Button>
        </div>

        <form className="qa-card rounded-3xl p-6" onSubmit={join}>
          <h2 className="font-display text-xl font-semibold">Join by code</h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC123"
            maxLength={6}
            aria-label="Match code"
            className="mt-4 w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2 font-mono uppercase tracking-widest"
          />
          <Button className="mt-5" type="submit" variant="secondary">
            Join match
          </Button>
        </form>
      </div>

      {error && <Chip className="mt-6">{error}</Chip>}
    </div>
  );
}
```

- [ ] **Step 3: Write the match-room page**

Create `quiet-arcade/src/pages/VersusRoomPage.tsx`:

```tsx
import { useParams } from "react-router-dom";
import { useVersusMatch } from "../lib/versus/useVersusMatch";
import { VersusShell } from "../components/VersusShell";
import { MapDropGame } from "../games/MapDrop";

export function VersusRoomPage() {
  const { code = "" } = useParams();
  const { view, loading, error, refresh } = useVersusMatch(code);

  if (loading) return <p className="mx-auto max-w-2xl px-4 pt-16 qa-muted">Loading match…</p>;
  if (error || !view)
    return <p className="mx-auto max-w-2xl px-4 pt-16 qa-muted">{error ?? "Match not found."}</p>;

  const link = `${window.location.origin}${import.meta.env.BASE_URL}versus/${view.code}`;

  return (
    <div>
      {view.status === "open" && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <p className="qa-muted text-sm">
            Share this link with your opponent:{" "}
            <code className="rounded bg-[var(--card-2)] px-2 py-1">{link}</code>
          </p>
        </div>
      )}
      <VersusShell
        view={view}
        onSubmitted={refresh}
        render={(api) => {
          if (view.game_id === "map-drop") return <MapDropGame api={api} />;
          return <p className="qa-muted">This game isn't wired for Versus yet.</p>;
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Register the routes**

In `quiet-arcade/src/App.tsx`, add inside `<Routes>` (after the `/account` route, ~line 92), and import the pages at the top:

```tsx
            <Route path="/versus" element={<Page><VersusPage /></Page>} />
            <Route path="/versus/:code" element={<Page><VersusRoomPage /></Page>} />
```

- [ ] **Step 5: Add the gated Nav link**

In the nav file found in Step 1, mirror the existing "Ranks"/"Account" link markup, gated on `versusAvailable()`:

```tsx
import { versusAvailable } from "../lib/versus/versusRepo";
// …inside the links list:
{versusAvailable() && <NavLinkComponent to="/versus">Versus</NavLinkComponent>}
```

(Use whatever link component/class the existing nav links use — copy their exact markup.)

- [ ] **Step 6: Verify build + lint**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: PASS / no new warnings.

- [ ] **Step 7: Commit**

```bash
cd quiet-arcade
git add src/pages/VersusPage.tsx src/pages/VersusRoomPage.tsx src/App.tsx src/components/
git commit -m "feat(versus): lobby + match room routes and nav entry"
```

---

### Task 7: End-to-end verification in the preview browser

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Use the preview tool: `preview_start { name: "quiet-arcade" }` (port from `.claude/launch.json`, real port in `preview_logs`). Confirm the app builds with no console errors.

- [ ] **Step 2: Create a match as Player A**

Navigate to `…/quiet-arcade/versus`. Pick a difficulty, click **Create match**. Confirm redirect to `/versus/<CODE>` and that the share link renders. Note the code.

- [ ] **Step 3: Join as Player B in a second anon session**

Open a second browser tab/context (a fresh anon Supabase session). Navigate to the share link. Confirm B is joined as guest (match status flips to `active`), and both see the same Map Drop puzzle (same place — verify the hidden-place name after each drops).

- [ ] **Step 4: Both play + submit**

Drop a pin and bank the score in each session. Confirm each side shows "Your score is in," then click **Check for opponent** and confirm the winner resolves once both have submitted (status `complete`, higher score wins; equal = Tie).

- [ ] **Step 5: Verify guest-mode hiding**

Temporarily run without `VITE_SUPABASE_URL`/`ANON_KEY` (or confirm via `versusAvailable()` returning false): the Versus nav link is absent and `/versus` shows the friendly "needs the accounts backend" panel.

- [ ] **Step 6: Final gate**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: PASS / no new warnings. Capture a screenshot of a completed match for the handoff.

- [ ] **Step 7: Commit any verification fixes**

```bash
cd quiet-arcade
git add -A
git commit -m "test(versus): pillar 1 end-to-end verified"
```

---

## Self-Review

**Spec coverage (Pillar 1 scope only):**
- Match abstraction (seed+config+max_score, code, status) → Task 1. ✓
- Async challenge flow (create → share code → join → submit → reveal) → Tasks 1, 4, 6, 7. ✓
- Anon OK, no sign-in gate → uses existing auto-anon session; `create/join` require `auth.uid()` which the anon session provides. ✓
- Supabase-gated feature (hidden when unconfigured) → `versusAvailable()` in Tasks 2, 6. ✓
- Map Drop trusted/capped score → Task 5 (no scoring change) + Task 1 `submit_versus_score` cap check. ✓
- Adapter contract (`api.versus`, single-player untouched) → Tasks 3, 5. ✓
- Strict RLS + definer RPCs + isolation tests → Task 1. ✓
- **Deferred to later pillars (correctly out of scope here):** realtime live progress (`onProgress` is a no-op stub, wired in pillar 3), Trivia + Edge Function (pillar 2), matchmaking queue (pillar 4). The `VersusProgress` type and `onProgress` hook are defined now so pillar 3 is additive.

**Placeholder scan:** no TBD/TODO; every code step shows complete code. The two "copy the existing nav markup" instructions (Task 6) are deliberate — they depend on the nav file discovered in Step 1 and must match its exact link component, which is why Step 1 reads it first.

**Type consistency:** `VersusMatch`/`VersusView`/`VersusConfig`/`VersusProgress` defined in Task 2 are used unchanged in Tasks 3–6. RPC names (`create_versus_match`, `join_versus_match`, `get_versus_match`, `submit_versus_score`) match between Task 1 SQL and Task 2 `versusRepo`. `api.versus.config` typed as `VersusConfig`, narrowed to `MapDropVersusConfig` in Task 5. `useVersusMatch` returns `{ view, loading, error, refresh }` — consumed exactly so in Task 6.

## Notes for later pillars
- **Pillar 2 (Trivia + Edge Function):** add `versus-trivia` function, `private.versus_trivia_questions`, and a `provision`/`question`/`answer`/`finalize` path; extend `versusRepo` and add a Trivia branch in `VersusRoomPage.render`. Trivia's authoritative score is written by the function, not `submit_versus_score`.
- **Pillar 3 (realtime):** implement `src/lib/versus/realtime.ts` (presence + `start`/`progress`/`reveal` on `versus:<code>`); replace `onProgress: () => {}` in `VersusShell` with a broadcast; replace polling in `useVersusMatch` with a subscription.
- **Pillar 4 (matchmaking):** add `versus_queue` + `enqueue_match`/`dequeue_match` RPCs and lobby "Quick Match" / "Find a match" entry points feeding the realtime room.
