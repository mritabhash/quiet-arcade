-- ============================================================================
-- Quiet Arcade — Versus Pillar 4: random matchmaking queue.
--
-- One queue table + a row-locking enqueue RPC that atomically pairs the caller
-- with the oldest waiting player in the same (game_id, config_key) bucket —
-- creating a LIVE match and deleting both queue rows — or parks the caller.
--
-- config_key format (canonical, derived client-side in configKey.ts):
--   map-drop:<difficulty>            e.g. map-drop:hard
--   trivia:<topic>:<mode>            e.g. trivia:misc:moderate
-- (lifelines are excluded — they're part of the shared config payload but two
--  players with different packs would still be a fair pairing bucket; we keep
--  them in `config` so the created match carries the HOST's pack for both.)
--
-- Security model per 0001/0002: RLS enabled+forced, auth.uid()-scoped,
-- pairing via SECURITY DEFINER with `for update skip locked` so two concurrent
-- callers can never grab the same waiter.
-- ============================================================================

create table public.versus_queue (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  game_id     text not null references public.game_catalog (game_id),
  config_key  text not null,
  config      jsonb not null default '{}'::jsonb check (pg_column_size(config) < 8192),
  enqueued_at timestamptz not null default now()
);

create index versus_queue_bucket_idx on public.versus_queue (game_id, config_key, enqueued_at);

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
declare
  v_uid uuid := auth.uid();
  v_cap int;
  opp record;
  m public.versus_matches;
  v_code text;
  tries int := 0;
begin
  if v_uid is null then raise exception 'must be signed in'; end if;
  select max_score_cap into v_cap from public.game_catalog where game_id = p_game_id;
  if v_cap is null then raise exception 'unknown game_id %', p_game_id; end if;

  select * into opp from public.versus_queue
    where game_id = p_game_id and config_key = p_config_key and user_id <> v_uid
      and enqueued_at > now() - interval '2 minutes'   -- stale waiters ignored
    order by enqueued_at asc
    for update skip locked
    limit 1;

  if opp.user_id is not null then
    delete from public.versus_queue where user_id in (opp.user_id, v_uid);
    loop
      v_code := private.gen_versus_code();
      begin
        insert into public.versus_matches
          (code, game_id, seed, config, max_score, host_id, guest_id, status, live)
        values (v_code, p_game_id, (floor(random() * 2147483647))::bigint,
                coalesce(p_config, '{}'::jsonb), v_cap, opp.user_id, v_uid, 'active', true)
        returning * into m;
        exit;
      exception when unique_violation then
        tries := tries + 1;
        if tries > 5 then raise; end if;
      end;
    end loop;
    return jsonb_build_object('matched', true, 'match', to_jsonb(m));
  end if;

  insert into public.versus_queue (user_id, game_id, config_key, config)
    values (v_uid, p_game_id, p_config_key, coalesce(p_config, '{}'::jsonb))
  on conflict (user_id) do update set
    game_id = excluded.game_id,
    config_key = excluded.config_key,
    config = excluded.config,
    enqueued_at = now();
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

-- Poll fallback for a parked client: newest live active match I'm in.
-- Covers a missed pairing broadcast.
create or replace function public.find_my_match() returns public.versus_matches
language sql stable security definer set search_path = '' as $$
  select * from public.versus_matches
   where (host_id = auth.uid() or guest_id = auth.uid()) and live and status = 'active'
   order by created_at desc limit 1;
$$;
revoke execute on function public.find_my_match() from anon;
grant  execute on function public.find_my_match() to authenticated;
