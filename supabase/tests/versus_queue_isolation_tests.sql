-- ============================================================================
-- Quiet Arcade — Versus matchmaking queue isolation tests (Pillar 4)
--
-- Paste the whole file into the Supabase SQL editor and run it AFTER applying
-- supabase/migrations/0004_versus_queue.sql (which needs 0001 + 0002).
--
-- Verifies bucket pairing, bucket isolation, queue-row RLS, dequeue scoping,
-- and stale-waiter exclusion. Rolls back at the end.
--
-- Expected output: "PASS: ..." notices ending in "ALL VERSUS QUEUE TESTS
-- PASSED", then ROLLBACK. Any failure raises "QUEUE FAILURE: ...".
-- ============================================================================

begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vq-a@test.local', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vq-b@test.local', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vq-c@test.local', now(), now());

do $$
declare
  a constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  b constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  c constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  r jsonb;
  m public.versus_matches;
  n bigint;
begin
  ------------------------------------------------------------------
  -- 1. A enqueues -> parked (matched = false)
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.enqueue_match('map-drop', 'map-drop:hard', '{"difficulty":"hard"}'::jsonb);
  if (r->>'matched')::boolean then raise exception 'QUEUE FAILURE: first enqueue should park'; end if;
  raise notice 'PASS: A parked in the queue';

  ------------------------------------------------------------------
  -- 2. C enqueues a DIFFERENT bucket -> parked, not paired with A
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.enqueue_match('map-drop', 'map-drop:novice', '{"difficulty":"novice"}'::jsonb);
  if (r->>'matched')::boolean then raise exception 'QUEUE FAILURE: mismatched buckets paired'; end if;
  raise notice 'PASS: different bucket does not pair';

  ------------------------------------------------------------------
  -- 3. C can only see their own queue row (RLS)
  ------------------------------------------------------------------
  select count(*) into n from public.versus_queue;
  if n <> 1 then raise exception 'QUEUE FAILURE: C sees % queue rows (expected 1, own only)', n; end if;
  raise notice 'PASS: queue rows are RLS-scoped to the owner';

  ------------------------------------------------------------------
  -- 4. B enqueues A''s bucket -> paired into a live match, host = A
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.enqueue_match('map-drop', 'map-drop:hard', '{"difficulty":"hard"}'::jsonb);
  if not (r->>'matched')::boolean then raise exception 'QUEUE FAILURE: same bucket did not pair'; end if;
  m := jsonb_populate_record(null::public.versus_matches, r->'match');
  if m.host_id <> a or m.guest_id <> b then raise exception 'QUEUE FAILURE: wrong host/guest'; end if;
  if not m.live or m.status <> 'active' then raise exception 'QUEUE FAILURE: paired match not live+active'; end if;
  raise notice 'PASS: same bucket pairs into a live match (host = waiter)';

  ------------------------------------------------------------------
  -- 5. Both A and B queue rows are gone; C''s row remains
  ------------------------------------------------------------------
  execute 'reset role';
  select count(*) into n from public.versus_queue;
  if n <> 1 then raise exception 'QUEUE FAILURE: expected only C''s row to remain, found %', n; end if;
  raise notice 'PASS: paired players removed from the queue';

  ------------------------------------------------------------------
  -- 6. find_my_match returns the live match for B
  ------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  m := public.find_my_match();
  if m.id is null or m.guest_id <> b then raise exception 'QUEUE FAILURE: find_my_match missed the pairing'; end if;
  raise notice 'PASS: find_my_match poll fallback works';

  ------------------------------------------------------------------
  -- 7. dequeue removes only the caller''s row
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.dequeue_match();
  execute 'reset role';
  select count(*) into n from public.versus_queue;
  if n <> 0 then raise exception 'QUEUE FAILURE: dequeue left % rows', n; end if;
  raise notice 'PASS: dequeue removes the caller''s row';

  ------------------------------------------------------------------
  -- 8. A stale waiter (>2 min) is not paired
  ------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.enqueue_match('map-drop', 'map-drop:hard', '{"difficulty":"hard"}'::jsonb);
  execute 'reset role';
  update public.versus_queue set enqueued_at = now() - interval '3 minutes' where user_id = a;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.enqueue_match('map-drop', 'map-drop:hard', '{"difficulty":"hard"}'::jsonb);
  if (r->>'matched')::boolean then raise exception 'QUEUE FAILURE: paired with a stale waiter'; end if;
  raise notice 'PASS: stale waiters are ignored';

  raise notice 'ALL VERSUS QUEUE TESTS PASSED';
end $$;

rollback;
