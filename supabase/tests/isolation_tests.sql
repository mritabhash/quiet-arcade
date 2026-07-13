-- ============================================================================
-- Quiet Arcade — RLS isolation tests
--
-- Paste the whole file into the Supabase SQL editor and run it AFTER applying
-- supabase/migrations/0001_accounts_and_leaderboards.sql.
--
-- It simulates two users (A and B) by setting the same GUCs PostgREST sets
-- (`role` + `request.jwt.claims`), asserts every isolation guarantee, and
-- ROLLS BACK at the end — nothing is left behind.
--
-- Expected output: a stream of "PASS: ..." notices ending in
-- "ALL ISOLATION TESTS PASSED", then ROLLBACK. Any failure raises an
-- exception whose message starts with "ISOLATION FAILURE".
-- ============================================================================

begin;

-- throwaway auth users (removed by the final rollback)
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'isolation-a@test.local', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'isolation-b@test.local', now(), now());

do $$
declare
  a constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  b constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  today text := to_char(current_date, 'YYYY-MM-DD');
  n bigint;
  blocked boolean;
begin
  ------------------------------------------------------------------
  -- 1. user A creates one row in every user table
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims',
    json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  insert into public.profiles (handle, show_on_leaderboard)
    values ('isolation_a', true);
  insert into public.scores (game_id, mode, score, max, date_key)
    values ('map-drop', 'daily', 4200, 5000, today);
  insert into public.user_stats (game_id, kind, data)
    values ('map-drop', 'game', '{"plays": 1, "best": 4200, "bestMax": 5000}');
  insert into public.daily_completions (date_key, game_id, entry)
    values (today, 'map-drop', '{"score": 4200, "max": 5000, "perfect": false}');

  -- ownership was derived from the session, not from the payload
  perform 1 from public.scores where user_id = a and game_id = 'map-drop';
  if not found then
    raise exception 'ISOLATION FAILURE: score not attributed to auth.uid()';
  end if;
  raise notice 'PASS: user A created rows in all four user tables';

  ------------------------------------------------------------------
  -- 2. user B cannot SELECT any of A''s rows
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims',
    json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.profiles where user_id = a;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B can read A profile'; end if;
  select count(*) into n from public.scores where user_id = a;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B can read A scores'; end if;
  select count(*) into n from public.user_stats where user_id = a;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B can read A stats'; end if;
  select count(*) into n from public.daily_completions where user_id = a;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B can read A completions'; end if;
  -- and unfiltered scans leak nothing either
  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'ISOLATION FAILURE: unfiltered profiles scan leaked % rows', n; end if;
  raise notice 'PASS: user B sees zero of A''s rows in every table';

  ------------------------------------------------------------------
  -- 3. user B cannot UPDATE or DELETE A''s rows (0 rows affected)
  ------------------------------------------------------------------
  update public.profiles set handle = 'hijacked' where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B updated A profile'; end if;

  update public.user_stats set data = '{}' where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B updated A stats'; end if;

  update public.daily_completions set entry = '{}' where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B updated A completions'; end if;

  delete from public.profiles where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B deleted A profile'; end if;

  delete from public.user_stats where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B deleted A stats'; end if;

  delete from public.daily_completions where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ISOLATION FAILURE: B deleted A completions'; end if;

  -- scores are immutable: update/delete privileges were revoked outright,
  -- and there are no policies either
  begin
    update public.scores set score = 0 where user_id = a;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'ISOLATION FAILURE: B updated A scores'; end if;
  exception when insufficient_privilege then null; -- privilege revoked entirely: also fine
  end;
  begin
    delete from public.scores where user_id = a;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'ISOLATION FAILURE: B deleted A scores'; end if;
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: user B cannot update or delete any of A''s rows';

  ------------------------------------------------------------------
  -- 4. user B cannot INSERT rows carrying A''s user_id
  ------------------------------------------------------------------
  blocked := false;
  begin
    insert into public.scores (user_id, game_id, mode, score, max, date_key)
      values (a, 'trivia', 'practice', 10, 100, today);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: B inserted a score as A'; end if;

  blocked := false;
  begin
    insert into public.user_stats (user_id, game_id, kind, data)
      values (a, 'trivia', 'game', '{}');
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: B inserted stats as A'; end if;

  blocked := false;
  begin
    insert into public.profiles (user_id, handle) values (a, 'spoofed');
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: B inserted a profile as A'; end if;

  blocked := false;
  begin
    insert into public.daily_completions (user_id, date_key, game_id, entry)
      values (a, today, 'trivia', '{}');
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: B inserted a completion as A'; end if;
  raise notice 'PASS: inserts with someone else''s user_id are rejected';

  ------------------------------------------------------------------
  -- 5. signed-out (anon) sees nothing in user tables
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);

  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'ISOLATION FAILURE: anon can read profiles'; end if;
  select count(*) into n from public.scores;
  if n <> 0 then raise exception 'ISOLATION FAILURE: anon can read scores'; end if;
  select count(*) into n from public.user_stats;
  if n <> 0 then raise exception 'ISOLATION FAILURE: anon can read user_stats'; end if;
  select count(*) into n from public.daily_completions;
  if n <> 0 then raise exception 'ISOLATION FAILURE: anon can read daily_completions'; end if;
  raise notice 'PASS: anonymous role reads zero rows from every user table';

  ------------------------------------------------------------------
  -- 6. leaderboards expose only {handle, score, rank, updated_at}
  ------------------------------------------------------------------
  execute 'reset role';
  perform public.refresh_leaderboards(); -- definer; A opted in above

  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);

  select count(*) into n from (
    select handle, total_points, rank, updated_at from public.leaderboard_overall
  ) x;
  if n < 1 then raise exception 'ISOLATION FAILURE: opted-in user missing from leaderboard'; end if;

  blocked := false;
  begin
    perform user_id from public.leaderboard_overall;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: anon can select leaderboard user_id'; end if;

  blocked := false;
  begin
    perform user_id from public.leaderboard_by_game;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: anon can select per-game leaderboard user_id'; end if;

  blocked := false;
  begin
    insert into public.leaderboard_overall (user_id, handle, total_points, rank, updated_at)
      values (b, 'cheater', 999999999, 1, now());
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: anon wrote to the leaderboard'; end if;
  raise notice 'PASS: leaderboards are read-only and expose only handle/score/rank';

  ------------------------------------------------------------------
  -- 7. server-side score validation
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims',
    json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  blocked := false;
  begin
    insert into public.scores (game_id, mode, score, max, date_key)
      values ('map-drop', 'practice', 6000, 6000, today); -- above the 5000 cap
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: score above game cap accepted'; end if;

  blocked := false;
  begin
    insert into public.scores (game_id, mode, score, max, date_key)
      values ('map-drop', 'practice', 9001, 5000, today); -- score > max
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: score > max accepted'; end if;

  blocked := false;
  begin
    insert into public.scores (game_id, mode, score, max, date_key)
      values ('map-drop', 'daily', 100, 5000, '2020-01-01'); -- stale date
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: stale date_key accepted'; end if;

  insert into public.scores (game_id, mode, score, max, date_key)
    values ('map-drop', 'daily', 100, 5000, today);
  blocked := false;
  begin
    insert into public.scores (game_id, mode, score, max, date_key)
      values ('map-drop', 'daily', 5000, 5000, today); -- second daily, same day
  exception when unique_violation then blocked := true;
  end;
  if not blocked then raise exception 'ISOLATION FAILURE: duplicate daily score accepted'; end if;

  -- the daily row got a server-stamped seed signature (when the secret exists)
  select count(*) into n from public.scores
    where user_id = b and mode = 'daily' and seed_sig is not null;
  if n = 0 then
    raise notice 'NOTE: seed_sig is null — provision private.secrets (''daily_seed_secret'') per the README';
  else
    raise notice 'PASS: daily score was stamped with a server-side seed signature';
  end if;
  raise notice 'PASS: score range, date, and one-daily-per-day rules enforced';

  execute 'reset role';
  raise notice 'ALL ISOLATION TESTS PASSED';
end;
$$;

rollback;
