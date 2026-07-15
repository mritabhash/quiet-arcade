-- ============================================================================
-- Quiet Arcade — Versus RLS + RPC isolation tests
--
-- Paste the whole file into the Supabase SQL editor and run it AFTER applying
-- supabase/migrations/0002_versus.sql (which itself needs 0001).
--
-- Simulates three users (A host, B guest, C stranger) by setting the same GUCs
-- PostgREST sets, asserts every isolation guarantee, and ROLLS BACK at the end.
--
-- Expected output: "PASS: ..." notices ending in "ALL VERSUS TESTS PASSED",
-- then ROLLBACK. Any failure raises "VERSUS FAILURE: ...".
-- ============================================================================

begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'versus-a@test.local', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'versus-b@test.local', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'versus-c@test.local', now(), now());

do $$
declare
  a constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  b constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  c constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  m public.versus_matches;
  v_code text;
  n bigint;
  blocked boolean;
begin
  ------------------------------------------------------------------
  -- 1. A creates a match
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  m := public.create_versus_match('map-drop', '{"difficulty":"hard"}'::jsonb);
  v_code := m.code;
  if m.host_id <> a then raise exception 'VERSUS FAILURE: host is not A'; end if;
  if m.status <> 'open' then raise exception 'VERSUS FAILURE: new match not open'; end if;
  if m.max_score <> 5000 then raise exception 'VERSUS FAILURE: cap not applied from game_catalog'; end if;
  raise notice 'PASS: A created match % (open, cap 5000)', v_code;

  ------------------------------------------------------------------
  -- 2. B joins by code -> becomes guest, status active
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  m := public.join_versus_match(v_code);
  if m.guest_id <> b then raise exception 'VERSUS FAILURE: guest is not B'; end if;
  if m.status <> 'active' then raise exception 'VERSUS FAILURE: joined match not active'; end if;
  raise notice 'PASS: B joined as guest (active)';

  ------------------------------------------------------------------
  -- 3. C (stranger) cannot read the base match row via RLS
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.versus_matches where id = m.id;
  if n <> 0 then raise exception 'VERSUS FAILURE: stranger C read a match row'; end if;
  raise notice 'PASS: stranger cannot select match row';

  ------------------------------------------------------------------
  -- 4. C cannot read participants of a match they are not in
  ------------------------------------------------------------------
  select count(*) into n from public.versus_participants where match_id = m.id;
  if n <> 0 then raise exception 'VERSUS FAILURE: stranger C read participants'; end if;
  raise notice 'PASS: stranger cannot select participants';

  ------------------------------------------------------------------
  -- 5. C cannot join a full match
  ------------------------------------------------------------------
  blocked := false;
  begin
    m := public.join_versus_match(v_code);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'VERSUS FAILURE: stranger joined a full match'; end if;
  raise notice 'PASS: full match rejects a third player';

  ------------------------------------------------------------------
  -- 6. A submitting a score above the ceiling is rejected
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  blocked := false;
  begin
    m := public.submit_versus_score(m.id, 6000, 6000, '{}'::jsonb);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'VERSUS FAILURE: over-cap score accepted'; end if;
  raise notice 'PASS: over-cap score rejected';

  ------------------------------------------------------------------
  -- 7. A submits a valid score -> still active (one submitted)
  ------------------------------------------------------------------
  m := public.submit_versus_score(m.id, 4200, 5000, '{"dist":140}'::jsonb);
  if m.status <> 'active' then raise exception 'VERSUS FAILURE: one submit should stay active'; end if;
  raise notice 'PASS: A submitted 4200 (active)';

  ------------------------------------------------------------------
  -- 8. B submits -> match complete
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  m := public.submit_versus_score(m.id, 3900, 5000, '{"dist":410}'::jsonb);
  if m.status <> 'complete' then raise exception 'VERSUS FAILURE: both submitted should be complete'; end if;
  raise notice 'PASS: B submitted 3900 (complete)';

  ------------------------------------------------------------------
  -- 9. Idempotent submit: A re-submitting does not overwrite the first score
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  m := public.submit_versus_score(m.id, 1, 5000, '{}'::jsonb);
  select score into n from public.versus_participants where match_id = m.id and user_id = a;
  if n <> 4200 then raise exception 'VERSUS FAILURE: resubmit overwrote first score'; end if;
  raise notice 'PASS: resubmit is idempotent (first submit wins)';

  raise notice 'ALL VERSUS TESTS PASSED';
end $$;

rollback;
