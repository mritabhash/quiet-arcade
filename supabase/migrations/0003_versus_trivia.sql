-- ============================================================================
-- Quiet Arcade — Versus Pillar 2: authoritative Trivia (moderate/hard).
--
-- A private question store holds the OpenTDB answers; a private progress table
-- holds server-authoritative per-player state. The `private` schema is not
-- exposed through PostgREST, so the versus-trivia Edge Function reaches these
-- tables ONLY via the vt_* SECURITY DEFINER RPCs below, which are executable
-- by service_role alone. Clients never see a correct index before answering.
--
-- Security model mirrors 0001/0002: RLS enabled+forced, all grants revoked
-- from anon/authenticated, SECURITY DEFINER finalize RPC guarded by membership.
-- ============================================================================

create table private.versus_trivia_questions (
  match_id      uuid not null references public.versus_matches (id) on delete cascade,
  ordinal       int  not null,               -- 0-14 active; 15-19 swap spares
  question      text not null,
  choices       jsonb not null,              -- string[4]
  correct_index int  not null check (correct_index between 0 and 3),
  topic         text,
  hint          text,
  primary key (match_id, ordinal)
);
revoke all on table private.versus_trivia_questions from public, anon, authenticated;
alter table private.versus_trivia_questions enable row level security;
alter table private.versus_trivia_questions force row level security;

create table private.versus_trivia_progress (
  match_id       uuid not null references public.versus_matches (id) on delete cascade,
  user_id        uuid not null,
  index          int  not null default 0,    -- next expected question ordinal
  score          int  not null default 0,
  streak         int  not null default 0,
  correct        int  not null default 0,
  used           jsonb not null default '[]'::jsonb,  -- lifeline ids consumed
  struck         jsonb not null default '[]'::jsonb,  -- struck indices this question
  second_chance  boolean not null default false,      -- Plus One caught a miss
  finished       boolean not null default false,
  primary key (match_id, user_id)
);
revoke all on table private.versus_trivia_progress from public, anon, authenticated;
alter table private.versus_trivia_progress enable row level security;
alter table private.versus_trivia_progress force row level security;

-- ----------------------------------------------------------------------------
-- vt_* helpers — the Edge Function's only door into the private tables.
-- Executable by service_role ONLY; never by anon/authenticated/public.
-- ----------------------------------------------------------------------------

create or replace function public.vt_count_questions(p_match_id uuid) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from private.versus_trivia_questions where match_id = p_match_id;
$$;
revoke execute on function public.vt_count_questions(uuid) from public, anon, authenticated;
grant  execute on function public.vt_count_questions(uuid) to service_role;

-- Atomic multi-row insert: either this call stores the whole round or a
-- concurrent provision already did (unique_violation -> caller treats as ready).
-- p_rows: jsonb array of { question, choices, correct_index, topic, hint };
-- the array position becomes the ordinal.
create or replace function public.vt_insert_questions(p_match_id uuid, p_rows jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into private.versus_trivia_questions
    (match_id, ordinal, question, choices, correct_index, topic, hint)
  select p_match_id, (o.ordinality - 1)::int,
         o.value->>'question', o.value->'choices',
         (o.value->>'correct_index')::int, o.value->>'topic', o.value->>'hint'
  from jsonb_array_elements(p_rows) with ordinality as o;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.vt_insert_questions(uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.vt_insert_questions(uuid, jsonb) to service_role;

create or replace function public.vt_get_question(p_match_id uuid, p_ordinal int) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(q) from private.versus_trivia_questions q
  where q.match_id = p_match_id and q.ordinal = p_ordinal;
$$;
revoke execute on function public.vt_get_question(uuid, int) from public, anon, authenticated;
grant  execute on function public.vt_get_question(uuid, int) to service_role;

create or replace function public.vt_get_spares(p_match_id uuid, p_from int) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(q) order by q.ordinal), '[]'::jsonb)
  from private.versus_trivia_questions q
  where q.match_id = p_match_id and q.ordinal >= p_from;
$$;
revoke execute on function public.vt_get_spares(uuid, int) from public, anon, authenticated;
grant  execute on function public.vt_get_spares(uuid, int) to service_role;

-- Swap the CONTENT of two ordinals atomically (Topic Swap lifeline).
create or replace function public.vt_swap_question(p_match_id uuid, p_a int, p_b int) returns void
language plpgsql security definer set search_path = '' as $$
declare qa private.versus_trivia_questions; qb private.versus_trivia_questions;
begin
  select * into qa from private.versus_trivia_questions
    where match_id = p_match_id and ordinal = p_a for update;
  select * into qb from private.versus_trivia_questions
    where match_id = p_match_id and ordinal = p_b for update;
  if qa.match_id is null or qb.match_id is null then raise exception 'missing question'; end if;
  update private.versus_trivia_questions set
    question = qb.question, choices = qb.choices, correct_index = qb.correct_index,
    topic = qb.topic, hint = qb.hint
    where match_id = p_match_id and ordinal = p_a;
  update private.versus_trivia_questions set
    question = qa.question, choices = qa.choices, correct_index = qa.correct_index,
    topic = qa.topic, hint = qa.hint
    where match_id = p_match_id and ordinal = p_b;
end $$;
revoke execute on function public.vt_swap_question(uuid, int, int) from public, anon, authenticated;
grant  execute on function public.vt_swap_question(uuid, int, int) to service_role;

-- Fetch-or-create the caller's progress row.
create or replace function public.vt_get_progress(p_match_id uuid, p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p private.versus_trivia_progress;
begin
  insert into private.versus_trivia_progress (match_id, user_id)
    values (p_match_id, p_user_id)
  on conflict (match_id, user_id) do nothing;
  select * into p from private.versus_trivia_progress
    where match_id = p_match_id and user_id = p_user_id;
  return to_jsonb(p);
end $$;
revoke execute on function public.vt_get_progress(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.vt_get_progress(uuid, uuid) to service_role;

create or replace function public.vt_save_progress(p_match_id uuid, p_user_id uuid, p_state jsonb) returns void
language sql security definer set search_path = '' as $$
  update private.versus_trivia_progress set
    index         = coalesce((p_state->>'index')::int, index),
    score         = coalesce((p_state->>'score')::int, score),
    streak        = coalesce((p_state->>'streak')::int, streak),
    correct       = coalesce((p_state->>'correct')::int, correct),
    used          = coalesce(p_state->'used', used),
    struck        = coalesce(p_state->'struck', struck),
    second_chance = coalesce((p_state->>'second_chance')::boolean, second_chance),
    finished      = coalesce((p_state->>'finished')::boolean, finished)
  where match_id = p_match_id and user_id = p_user_id;
$$;
revoke execute on function public.vt_save_progress(uuid, uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.vt_save_progress(uuid, uuid, jsonb) to service_role;

-- ----------------------------------------------------------------------------
-- finalize_versus_trivia: writes the server-computed score to the participant
-- row and flips the match when both are done. Invoked by the Edge Function
-- forwarding the player's JWT, so auth.uid() is the player; the score is
-- authoritative because the function computed it from the private answers.
-- ----------------------------------------------------------------------------
create or replace function public.finalize_versus_trivia(
  p_match_id uuid, p_score int, p_max int, p_correct int)
returns public.versus_matches
language plpgsql security definer set search_path = '' as $$
declare m public.versus_matches; v_handle text; both int; v_uid uuid := auth.uid();
begin
  select * into m from public.versus_matches where id = p_match_id for update;
  if m.id is null then raise exception 'no such match'; end if;
  if v_uid is null or v_uid not in (m.host_id, coalesce(m.guest_id, m.host_id)) then
    raise exception 'not a participant';
  end if;
  if p_max > m.max_score then raise exception 'max exceeds ceiling'; end if;
  if p_score < 0 or p_score > p_max then raise exception 'invalid score'; end if;

  select handle into v_handle from public.profiles where user_id = v_uid;
  insert into public.versus_participants (match_id, user_id, handle, score, max, detail, finished_at)
    values (m.id, v_uid, v_handle, p_score, p_max, jsonb_build_object('correct', p_correct), now())
  on conflict (match_id, user_id) do nothing;  -- idempotent: first finalize wins

  select count(*) into both from public.versus_participants
    where match_id = m.id and finished_at is not null;
  update public.versus_matches
    set status = case when both >= 2 then 'complete'
                      when status = 'open' then 'active' else status end
    where id = m.id returning * into m;
  return m;
end $$;
revoke execute on function public.finalize_versus_trivia(uuid, int, int, int) from public, anon;
grant  execute on function public.finalize_versus_trivia(uuid, int, int, int) to authenticated;
