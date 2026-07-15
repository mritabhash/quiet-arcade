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

-- Participants read their own match rows only. Discovery-by-code and all writes
-- go through the SECURITY DEFINER RPCs below.
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

-- ----------------------------------------------------------------------------
-- RPCs (SECURITY DEFINER): all cross-user discovery + writes flow through here.
-- ----------------------------------------------------------------------------

-- Random 6-char code from an unambiguous alphabet (no 0/O/1/I).
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
