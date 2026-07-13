-- ============================================================================
-- Quiet Arcade — accounts + leaderboards schema
--
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh
-- project. See supabase/README.md for the full setup checklist (anonymous
-- auth, Google OAuth, the daily-seed secret, and pg_cron).
--
-- Security model, in one line: every user table has RLS ENABLED **and**
-- FORCED, every policy is scoped to auth.uid(), user_id columns default to
-- auth.uid() and reject mismatches, and the only world-readable rows are the
-- precomputed leaderboard tables — restricted, via column grants, to
-- {handle, score, rank, updated_at}.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- private schema: secrets + definer helpers. No API role may touch it.
-- ----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.secrets (
  name  text primary key,
  value text not null
);
revoke all on table private.secrets from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- game catalog: allowed game ids + a generous per-game score ceiling.
-- Reference data, not user data — world-readable.
-- ----------------------------------------------------------------------------
create table public.game_catalog (
  game_id       text primary key,
  max_score_cap integer not null check (max_score_cap > 0)
);

alter table public.game_catalog enable row level security;
alter table public.game_catalog force row level security;
create policy "catalog is public" on public.game_catalog
  for select to anon, authenticated using (true);
revoke insert, update, delete on public.game_catalog from anon, authenticated;

insert into public.game_catalog (game_id, max_score_cap) values
  ('map-drop',      5000),
  ('time-capsule',  5000),
  ('borderline',    5000),
  ('trivia',      100000),
  ('word-grid',     1000),
  ('pattern-groups',1000),
  ('mini-crossword',1000),
  ('hidden-strands',1000),
  ('letter-hive',  10000),
  ('globe-hunt',    1000),
  ('country-shape', 1000),
  ('time-lens',     1000),
  ('higher-lower',  1000),
  ('cat-pairs',     1000),
  ('odd-one-out',   1000);

-- ----------------------------------------------------------------------------
-- profiles: one row per (non-anonymous or upgraded) user. Created lazily by
-- the signed-in client itself, so RLS covers the insert path too — no
-- auth-schema triggers needed.
-- ----------------------------------------------------------------------------
create table public.profiles (
  user_id             uuid primary key default auth.uid()
                      references auth.users (id) on delete cascade,
  handle              text unique
                      check (handle is null or handle ~ '^[A-Za-z0-9_-]{3,20}$'),
  avatar              text not null default '🦊' check (char_length(avatar) <= 16),
  show_on_leaderboard boolean not null default false,
  settings            jsonb
                      check (settings is null or pg_column_size(settings) < 16384),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index profiles_handle_lower_idx on public.profiles (lower(handle));

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "select own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own profile" on public.profiles
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- scores: append-only round results; the single source for both leaderboards.
-- seed_sig is stamped server-side (HMAC of the daily seed input) — the client
-- never supplies it. No UPDATE/DELETE policies: rows are immutable and vanish
-- only via the account-deletion cascade.
-- ----------------------------------------------------------------------------
create table public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  game_id    text not null references public.game_catalog (game_id),
  mode       text not null check (mode in ('daily', 'practice')),
  score      integer not null check (score >= 0),
  max        integer not null check (max >= 1),
  date_key   text not null check (date_key ~ '^\d{4}-\d{2}-\d{2}$'),
  seed_sig   text,
  created_at timestamptz not null default now(),
  constraint score_within_max check (score <= max)
);

create index scores_user_idx on public.scores (user_id);
create index scores_game_idx on public.scores (game_id);
-- one daily result per player per game per day
create unique index scores_one_daily_idx
  on public.scores (user_id, game_id, date_key) where (mode = 'daily');

alter table public.scores enable row level security;
alter table public.scores force row level security;

create policy "select own scores" on public.scores
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own scores" on public.scores
  for insert to authenticated with check (auth.uid() = user_id);
-- deliberately no update/delete policies
revoke update, delete on public.scores from anon, authenticated;

-- HMAC signature over the deterministic daily-seed input (dateKey:gameId).
create or replace function private.sign_seed(p_date_key text, p_game_id text)
returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_secret text;
begin
  select value into v_secret from private.secrets where name = 'daily_seed_secret';
  if v_secret is null then
    return null; -- secret not provisioned yet; casual anti-cheat degrades gracefully
  end if;
  return encode(
    extensions.hmac((p_date_key || ':' || p_game_id)::bytea, v_secret::bytea, 'sha256'),
    'hex'
  );
end;
$$;
revoke execute on function private.sign_seed(text, text) from public, anon, authenticated;

-- Server-side validation: ownership, score ceilings, plausible dates,
-- and the seed signature stamp.
create or replace function private.validate_score()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_cap integer;
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'scores.user_id must be the signed-in user';
  end if;
  select max_score_cap into v_cap from public.game_catalog where game_id = new.game_id;
  if v_cap is null then
    raise exception 'unknown game_id %', new.game_id;
  end if;
  if new.max > v_cap then
    raise exception 'max % exceeds cap % for %', new.max, v_cap, new.game_id;
  end if;
  -- date must be "today" give or take client timezones
  if abs(new.date_key::date - current_date) > 2 then
    raise exception 'date_key % is not a current date', new.date_key;
  end if;
  new.created_at := now();
  new.seed_sig := case
    when new.mode = 'daily' then private.sign_seed(new.date_key, new.game_id)
    else null
  end;
  return new;
end;
$$;
revoke execute on function private.validate_score() from public, anon, authenticated;

create trigger scores_validate
  before insert on public.scores
  for each row execute function private.validate_score();

-- ----------------------------------------------------------------------------
-- user_stats: synced aggregate stats. One row per (user, game, kind):
--   kind 'game'     — PerGameStats for one game
--   kind 'flagship' — FlagshipGameStats for one flagship game
--   kind 'overall'  — the account-wide Stats object (game_id = '__overall')
-- Stored as jsonb so the client types stay the source of truth; isolation
-- comes from RLS, and leaderboards never read this table (they read scores).
-- ----------------------------------------------------------------------------
create table public.user_stats (
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  game_id    text not null,
  kind       text not null check (kind in ('game', 'flagship', 'overall')),
  data       jsonb not null check (pg_column_size(data) < 32768),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, kind)
);

alter table public.user_stats enable row level security;
alter table public.user_stats force row level security;

create policy "select own stats" on public.user_stats
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own stats" on public.user_stats
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own stats" on public.user_stats
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own stats" on public.user_stats
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- daily_completions: one row per finished daily puzzle.
-- ----------------------------------------------------------------------------
create table public.daily_completions (
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  date_key   text not null check (date_key ~ '^\d{4}-\d{2}-\d{2}$'),
  game_id    text not null,
  entry      jsonb not null check (pg_column_size(entry) < 8192),
  created_at timestamptz not null default now(),
  primary key (user_id, date_key, game_id)
);

alter table public.daily_completions enable row level security;
alter table public.daily_completions force row level security;

create policy "select own completions" on public.daily_completions
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own completions" on public.daily_completions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own completions" on public.daily_completions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own completions" on public.daily_completions
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- leaderboards: precomputed once a day from scores × opted-in profiles.
-- Readable by everyone, but ONLY {handle, score, rank, updated_at} — the
-- user_id column exists for the refresh job and is hidden via column grants.
-- Writes happen only inside refresh_leaderboards() (definer) — API roles
-- have no write privilege and no write policies exist.
-- ----------------------------------------------------------------------------
create table public.leaderboard_overall (
  user_id      uuid primary key,
  handle       text not null,
  total_points bigint not null,
  rank         integer not null,
  updated_at   timestamptz not null
);

create table public.leaderboard_by_game (
  game_id    text not null,
  user_id    uuid not null,
  handle     text not null,
  best_score integer not null,
  rank       integer not null,
  updated_at timestamptz not null,
  primary key (game_id, user_id)
);

alter table public.leaderboard_overall enable row level security;
alter table public.leaderboard_overall force row level security;
alter table public.leaderboard_by_game enable row level security;
alter table public.leaderboard_by_game force row level security;

create policy "leaderboard is public" on public.leaderboard_overall
  for select to anon, authenticated using (true);
create policy "leaderboard is public" on public.leaderboard_by_game
  for select to anon, authenticated using (true);

-- column-level privileges: the API roles can never select user_id here,
-- so `select *` fails and only the three public fields (+ timestamp) work.
revoke all on table public.leaderboard_overall from anon, authenticated;
revoke all on table public.leaderboard_by_game from anon, authenticated;
grant select (handle, total_points, rank, updated_at)
  on public.leaderboard_overall to anon, authenticated;
grant select (game_id, handle, best_score, rank, updated_at)
  on public.leaderboard_by_game to anon, authenticated;

create or replace function public.refresh_leaderboards()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.leaderboard_overall;
  insert into public.leaderboard_overall (user_id, handle, total_points, rank, updated_at)
  select s.user_id,
         p.handle,
         sum(s.score)::bigint as total_points,
         rank() over (order by sum(s.score) desc) as rank,
         now()
  from public.scores s
  join public.profiles p on p.user_id = s.user_id
  where p.show_on_leaderboard and p.handle is not null
  group by s.user_id, p.handle;

  delete from public.leaderboard_by_game;
  insert into public.leaderboard_by_game (game_id, user_id, handle, best_score, rank, updated_at)
  select t.game_id,
         t.user_id,
         t.handle,
         t.best_score,
         rank() over (partition by t.game_id order by t.best_score desc) as rank,
         now()
  from (
    select s.game_id, s.user_id, p.handle, max(s.score) as best_score
    from public.scores s
    join public.profiles p on p.user_id = s.user_id
    where p.show_on_leaderboard and p.handle is not null
    group by s.game_id, s.user_id, p.handle
  ) t;
end;
$$;
-- only the cron job / service role may refresh
revoke execute on function public.refresh_leaderboards() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- account deletion: removes the auth user; every user table cascades from
-- auth.users(id), so all rows disappear with it.
-- ----------------------------------------------------------------------------
create or replace function public.delete_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- ----------------------------------------------------------------------------
-- keep updated_at honest
-- ----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger user_stats_updated_at
  before update on public.user_stats
  for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- daily refresh via pg_cron (00:10 UTC). Wrapped so the migration still
-- applies on projects where the extension isn't enabled yet — see README.
-- ----------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'quiet-arcade-refresh-leaderboards';
  perform cron.schedule(
    'quiet-arcade-refresh-leaderboards',
    '10 0 * * *',
    'select public.refresh_leaderboards()'
  );
exception when others then
  raise notice 'pg_cron not available (%) — schedule refresh_leaderboards() manually, see README', sqlerrm;
end;
$$;
