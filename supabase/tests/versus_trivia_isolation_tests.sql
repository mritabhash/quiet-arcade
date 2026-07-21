-- ============================================================================
-- Quiet Arcade — Versus Trivia isolation tests (Pillar 2)
--
-- Paste the whole file into the Supabase SQL editor and run it AFTER applying
-- supabase/migrations/0003_versus_trivia.sql (which needs 0001 + 0002).
--
-- Verifies: (a) anon/authenticated cannot read the private trivia tables;
-- (b) finalize_versus_trivia enforces membership, the score ceiling, and
-- first-write idempotency. Simulates users via the same GUCs PostgREST sets,
-- and ROLLS BACK at the end.
--
-- Expected output: "PASS: ..." notices ending in "ALL VERSUS TRIVIA TESTS
-- PASSED", then ROLLBACK. Any failure raises "TRIVIA FAILURE: ...".
-- ============================================================================

begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vt-a@test.local', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vt-b@test.local', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vt-c@test.local', now(), now());

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
  -- 1. A creates a trivia match, B joins
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  m := public.create_versus_match('trivia', '{"topic":"misc","mode":"hard","lifelines":["fifty"]}'::jsonb);
  v_code := m.code;

  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  m := public.join_versus_match(v_code);
  if m.guest_id <> b then raise exception 'TRIVIA FAILURE: guest is not B'; end if;
  raise notice 'PASS: trivia match created and joined';

  ------------------------------------------------------------------
  -- 2. authenticated cannot read the private question store
  ------------------------------------------------------------------
  blocked := false;
  begin
    select count(*) into n from private.versus_trivia_questions;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: authenticated read versus_trivia_questions'; end if;
  raise notice 'PASS: authenticated cannot read question store';

  ------------------------------------------------------------------
  -- 3. authenticated cannot read the private progress table
  ------------------------------------------------------------------
  blocked := false;
  begin
    select count(*) into n from private.versus_trivia_progress;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: authenticated read versus_trivia_progress'; end if;
  raise notice 'PASS: authenticated cannot read progress table';

  ------------------------------------------------------------------
  -- 4. anon cannot read the private question store either
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  blocked := false;
  begin
    select count(*) into n from private.versus_trivia_questions;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: anon read versus_trivia_questions'; end if;
  raise notice 'PASS: anon cannot read question store';

  ------------------------------------------------------------------
  -- 4b. authenticated cannot execute the service-role-only vt_* RPCs
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  blocked := false;
  begin
    perform public.vt_get_question(m.id, 0);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: authenticated executed vt_get_question'; end if;
  blocked := false;
  begin
    perform public.vt_get_progress(m.id, a);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: authenticated executed vt_get_progress'; end if;
  raise notice 'PASS: vt_* helpers are service-role only';

  ------------------------------------------------------------------
  -- 5. stranger C cannot finalize a match they are not in
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  blocked := false;
  begin
    m := public.finalize_versus_trivia(m.id, 100, 1000, 3);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: stranger finalized a match'; end if;
  raise notice 'PASS: stranger cannot finalize';

  ------------------------------------------------------------------
  -- 6. max above the match ceiling is rejected
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  blocked := false;
  begin
    m := public.finalize_versus_trivia(m.id, 1, 99999999, 1);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'TRIVIA FAILURE: over-ceiling max accepted'; end if;
  raise notice 'PASS: over-ceiling max rejected';

  ------------------------------------------------------------------
  -- 7. valid finalize for A -> active; idempotent re-finalize
  ------------------------------------------------------------------
  m := public.finalize_versus_trivia(m.id, 4200, m.max_score, 12);
  if m.status <> 'active' then raise exception 'TRIVIA FAILURE: one finalize should stay active'; end if;

  m := public.finalize_versus_trivia(m.id, 1, m.max_score, 1);
  select score into n from public.versus_participants where match_id = m.id and user_id = a;
  if n <> 4200 then raise exception 'TRIVIA FAILURE: re-finalize overwrote first score'; end if;
  raise notice 'PASS: finalize is idempotent (first write wins)';

  ------------------------------------------------------------------
  -- 8. B finalizes -> complete
  ------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  m := public.finalize_versus_trivia(m.id, 3900, m.max_score, 11);
  if m.status <> 'complete' then raise exception 'TRIVIA FAILURE: both finalized should be complete'; end if;
  raise notice 'PASS: both finalized -> complete';

  raise notice 'ALL VERSUS TRIVIA TESTS PASSED';
end $$;

rollback;
