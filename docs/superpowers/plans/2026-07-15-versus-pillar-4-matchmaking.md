# Versus Pillar 4 — Random Matchmaking Queue — Implementation Plan

> **For agentic workers:** execute inline (user prefers inline over subagent fleets — memory `execution-cost-preference`). Verify: `cd quiet-arcade && npx tsc -b` + `npm run lint` (0 new oxlint warnings), SQL isolation tests, two-session browser E2E. Steps use `- [ ]`.

**Goal:** Pair two strangers automatically into a live Versus match. Two entry points, one queue: **Quick Match** (one tap, default config) and **Find a match** (pick game + config, then queue). Matches created by pairing are `live` and flow into the Pillar 3 realtime room.

**Architecture:** A `versus_queue` table + a row-locking `enqueue_match` RPC that atomically pairs the caller with the oldest waiting player in the same `(game_id, config_key)` bucket — creating a live match and deleting both queue rows — or parks the caller. Pairing is signalled over a per-user realtime channel (Pillar 3's helper) so the waiting player navigates into the room.

**Prereq:** Pillars 1–3. Existing: match schema + RPCs, `versusRepo`, `openVersusChannel`, `VersusPage`, `VersusRoomPage`, the Pillar 3 live room.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-versus-1v1-design.md` (user chose **both** entry points; pair only within the same `(game_id, config_key)` bucket — no mismatched configs).
- Security model per `0001`/`0002`: RLS enabled+forced, `auth.uid()`-scoped, pairing via `SECURITY DEFINER` RPC with `for update skip locked` to avoid double-pairing under concurrency.
- `config_key` is a stable, canonical string derived from `(game_id, config)`: `map-drop:<difficulty>`, `trivia:<topic>:<mode>` (lifelines excluded — they're per-player, not shared). Define once in `src/lib/versus/configKey.ts`; document the format in the migration.
- A user holds **at most one** queue row (primary key on `user_id`); re-enqueue replaces it. `dequeue_match` removes it. Stale rows (`enqueued_at < now() - interval '2 minutes'`) are ignored by pairing.
- `erasableSyntaxOnly`; GateGuard first-write gate applies.

---

### Task 1: Migration `0004_versus_queue.sql` — queue + enqueue/dequeue RPCs

**Files:**
- Create: `quiet-arcade/supabase/migrations/0004_versus_queue.sql`
- Create: `quiet-arcade/supabase/tests/versus_queue_isolation_tests.sql`

**Schema + RPCs:**
```sql
create table public.versus_queue (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  game_id     text not null references public.game_catalog (game_id),
  config_key  text not null,
  config      jsonb not null default '{}'::jsonb check (pg_column_size(config) < 8192),
  enqueued_at timestamptz not null default now()
);
alter table public.versus_queue enable row level security;
alter table public.versus_queue force row level security;
create policy "see own queue row" on public.versus_queue
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.versus_queue from anon, authenticated;

-- Pairs with the oldest compatible waiter or parks the caller.
-- Returns jsonb: { matched: bool, match: <versus_matches row or null> }.
create or replace function public.enqueue_match(p_game_id text, p_config_key text, p_config jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_cap int; opp record; m public.versus_matches; v_code text; tries int := 0;
begin
  if v_uid is null then raise exception 'must be signed in'; end if;
  select max_score_cap into v_cap from public.game_catalog where game_id = p_game_id;
  if v_cap is null then raise exception 'unknown game_id %', p_game_id; end if;

  select * into opp from public.versus_queue
    where game_id = p_game_id and config_key = p_config_key and user_id <> v_uid
      and enqueued_at > now() - interval '2 minutes'
    order by enqueued_at asc
    for update skip locked
    limit 1;

  if opp.user_id is not null then
    delete from public.versus_queue where user_id in (opp.user_id, v_uid);
    loop
      v_code := private.gen_versus_code();
      begin
        insert into public.versus_matches (code, game_id, seed, config, max_score, host_id, guest_id, status, live)
        values (v_code, p_game_id, (floor(random()*2147483647))::bigint,
                coalesce(p_config,'{}'::jsonb), v_cap, opp.user_id, v_uid, 'active', true)
        returning * into m;
        exit;
      exception when unique_violation then tries := tries + 1; if tries > 5 then raise; end if;
      end;
    end loop;
    return jsonb_build_object('matched', true, 'match', to_jsonb(m));
  end if;

  insert into public.versus_queue (user_id, game_id, config_key, config)
    values (v_uid, p_game_id, p_config_key, coalesce(p_config,'{}'::jsonb))
  on conflict (user_id) do update set game_id = excluded.game_id,
    config_key = excluded.config_key, config = excluded.config, enqueued_at = now();
  return jsonb_build_object('matched', false, 'match', null);
end $$;
revoke execute on function public.enqueue_match(text, text, jsonb) from anon;
grant  execute on function public.enqueue_match(text, text, jsonb) to authenticated;

create or replace function public.dequeue_match() returns void
language sql security definer set search_path = '' as $$
  delete from public.versus_queue where user_id = auth.uid();
$$;
revoke execute on function public.dequeue_match() from anon;
grant  execute on function public.dequeue_match() to authenticated;

-- Poll fallback for a parked client: newest active match I'm in.
create or replace function public.find_my_match() returns public.versus_matches
language sql stable security definer set search_path = '' as $$
  select * from public.versus_matches
   where (host_id = auth.uid() or guest_id = auth.uid()) and live and status = 'active'
   order by created_at desc limit 1;
$$;
revoke execute on function public.find_my_match() from anon;
grant  execute on function public.find_my_match() to authenticated;
```

**Isolation test:** A enqueues (matched=false, parked). B enqueues same bucket (matched=true, live match host=A/guest=B, both queue rows gone). C enqueues a *different* bucket → parked, not paired with A/B. A cannot read B's/C's queue rows (RLS). `dequeue_match` removes only own row. `for update skip locked` prevents two callers grabbing the same waiter.

- [ ] Write failing test → run (FAIL) → write migration → apply → run (PASS) → commit `feat(versus): matchmaking queue + enqueue/dequeue RPCs`.

---

### Task 2: `configKey.ts` + `versusRepo` enqueue/dequeue

**Files:** Create `quiet-arcade/src/lib/versus/configKey.ts`; Modify `quiet-arcade/src/lib/versus/versusRepo.ts`

```ts
// configKey.ts
import type { GameId } from "../../types";
export function configKey(gameId: GameId, config: Record<string, unknown>): string {
  if (gameId === "map-drop") return `map-drop:${config.difficulty ?? "hard"}`;
  if (gameId === "trivia") return `trivia:${config.topic ?? "misc"}:${config.mode ?? "moderate"}`;
  return gameId;
}
```
```ts
// versusRepo.ts additions
export interface EnqueueResult { matched: boolean; match: VersusMatch | null; }
export async function enqueue(gameId: GameId, config: VersusConfig): Promise<EnqueueResult> {
  const { data, error } = await client().rpc("enqueue_match", {
    p_game_id: gameId, p_config_key: configKey(gameId, config as Record<string, unknown>), p_config: config,
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
  return (data as VersusMatch | null) ?? null;
}
```

- [ ] Add files/functions → `tsc -b` + lint → commit `feat(versus): matchmaking repo + config key`.

---

### Task 3: `useMatchmaking` hook — enqueue, wait, navigate on pair

**Files:** Create `quiet-arcade/src/lib/versus/useMatchmaking.ts`

**Behaviour:** `start(gameId, config)` → `enqueue`. If `matched`, the caller also broadcasts `paired` (the match code) to `matchmaking:<opponentUid>` via `openVersusChannel`, then navigates to `/versus/<code>`. If parked, subscribe to `matchmaking:<selfUid>`; on `paired` → navigate. **Poll fallback:** while parked, call `findMyMatch()` every 2s; if it returns a match, navigate (covers a missed broadcast). `cancel()` → `dequeue()` + leave channel + stop the poll.

**Interfaces produced:** `useMatchmaking()` → `{ start(gameId, config), cancel(), status: 'idle'|'searching'|'matched', code: string | null }`.

- [ ] Add hook → `tsc -b` + lint → commit `feat(versus): matchmaking hook (push + poll fallback)`.

---

### Task 4: Lobby entry points

**Files:** Modify `quiet-arcade/src/pages/VersusPage.tsx`

- **Quick Match** buttons: `start('map-drop', { difficulty: 'hard' })` and `start('trivia', { topic:'misc', mode:'moderate', lifelines:['fifty'] })` (defaults).
- **Find a match:** reuse the existing config controls, but the primary button calls `start(gameId, config)` instead of `createMatch`.
- While `status==='searching'` show a "Finding an opponent…" panel with a **Cancel** button (`cancel()`); auto-navigate when `status==='matched'`.

- [ ] Modify lobby → `tsc -b` + lint → commit `feat(versus): quick match + find-a-match lobby`.

---

### Task 5: End-to-end verification

- [ ] Two anon sessions both hit Quick Match (same game) → pair into one live match, land in the Pillar 3 room together; play resolves.
- [ ] Two sessions pick **different** configs → do NOT pair (each stays searching) — proves bucket isolation.
- [ ] Cancel removes the queue row (`dequeue`); a stale (>2 min) waiter isn't paired.
- [ ] `tsc -b` + lint clean → commit `test(versus): pillar 4 matchmaking e2e verified`.

## Self-Review
- Spec's "both entry points, same-bucket only" covered; no mismatched pairing. ✓
- Concurrency-safe pairing (`for update skip locked`, delete-both-then-create). ✓
- Notify path decided: push-broadcast (`paired`) with a 2s `findMyMatch()` poll fallback — not poll-only. ✓
- Reuses Pillar 3 realtime + the existing match/room; no new game code. ✓

## Human setup (beyond code)
- Apply `0004_versus_queue.sql`; run `versus_queue_isolation_tests.sql`.
- (Realtime already enabled in Pillar 3.)
