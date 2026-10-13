-- StudyPlat — database schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query → paste → Run). It is written to be safe to run twice.
--
-- There is exactly one table. The map itself is generated in the app from the
-- course id, so the only things worth storing are which course a student
-- chose and what they have cleared. Storing the generated map would mean a
-- migration every time a unit title changes.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,

  -- Setup answers.
  course_id           text,
  experience_level_id text,
  goal_score_id       text,
  exam_timeframe_id   text,
  placement_level_id  text,
  onboarded           boolean     not null default false,

  -- Progress.
  xp                  integer     not null default 0,
  gems                integer     not null default 0,
  streak_days         integer     not null default 0,
  last_session_on     date,
  -- Stop ids the student actually played. The placement head start is
  -- recomputed from placement_level_id on load, so it is deliberately absent.
  completed_stops     text[]      not null default '{}',
  -- Per-skill tally: { "<skillTag>": { "seen": n, "correct": n } }. Held as
  -- JSON rather than a second table because nothing ever queries across
  -- students by skill — it is only ever read back whole for one profile.
  skills              jsonb       not null default '{}'::jsonb,
  sessions            integer     not null default 0,
  perfect_sessions    integer     not null default 0,
  best_streak         integer     not null default 0,
  -- Which companion is equipped, and whether its streak shield has already
  -- covered a missed day in the current streak.
  equipped_companion  text,
  streak_shield_used  boolean     not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Columns added after the first release. Safe to run against an existing
-- table: each is a no-op if it is already there.
alter table public.profiles add column if not exists skills           jsonb   not null default '{}'::jsonb;
alter table public.profiles add column if not exists sessions         integer not null default 0;
alter table public.profiles add column if not exists perfect_sessions integer not null default 0;
alter table public.profiles add column if not exists best_streak      integer not null default 0;
alter table public.profiles add column if not exists equipped_companion text;
alter table public.profiles add column if not exists streak_shield_used boolean not null default false;

-- Keep updated_at honest without the client having to send it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- This is the part that matters. The app ships with the anon key, which is
-- public by design — anyone who downloads the app has it. RLS is what stops
-- one student reading or writing another's row, so it is not optional.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy on purpose: deleting the auth user cascades to this row,
-- which is the only route that should remove one.

-- ---------------------------------------------------------------------------
-- Create the row automatically on sign-up
--
-- The app also creates it on first load, so this is a belt-and-braces measure
-- that guarantees a row exists even if the first session never completes.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Account deletion
--
-- App Store guideline 5.1.1(ii) requires an app that creates accounts to let
-- someone delete theirs from inside the app. A support email address is not
-- accepted, and this is a common rejection.
--
-- Deleting a user is a privileged operation: it touches `auth.users`, which the
-- publishable key cannot write to — correctly, since otherwise any client could
-- delete any account. `security definer` lets this function run with the
-- owner's rights, and `auth.uid()` pins it to the caller, so a student can only
-- ever delete themselves. There is no argument to pass and therefore nothing to
-- tamper with.
--
-- The profile row goes with it through the `on delete cascade` on
-- `profiles.id`, so there is nothing else to clean up.
-- ---------------------------------------------------------------------------

create or replace function public.delete_account()
returns void
language plpgsql
security definer set search_path = auth, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  -- Apple grants must be revoked by the authenticated Edge Function first.
  -- This also covers an Apple-linked account currently signed in with Google.
  if exists (select 1 from auth.identities where user_id = auth.uid() and provider = 'apple') then
    raise exception 'APPLE_REVOCATION_REQUIRED';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Signed-in callers only. Without this revoke, the anonymous role could call it
-- too — it would fail on the uid check, but the smaller surface is worth having.
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Durable daily count and idempotent multi-device synchronization.
alter table public.profiles add column if not exists today_count integer not null default 0;

create table if not exists public.profile_sync_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id)
);
alter table public.profile_sync_receipts enable row level security;
drop policy if exists "read own sync receipt" on public.profile_sync_receipts;
drop policy if exists "insert own sync receipt" on public.profile_sync_receipts;
create policy "read own sync receipt" on public.profile_sync_receipts for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own sync receipt" on public.profile_sync_receipts for insert to authenticated with check (user_id = (select auth.uid()));
grant select, insert on public.profile_sync_receipts to authenticated;

-- JSON counter helper keeps malformed or extreme clients from overflowing SQL integers.
create or replace function public.studyplat_counter(value jsonb)
returns integer language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(value) = 'number'
    then greatest(0, least(1000000000::numeric, floor((value #>> '{}')::numeric)))::integer
    else 0 end;
$$;

create or replace function public.sync_profile(p_mutation_id uuid, p_profile jsonb, p_baseline jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_profile public.profiles%rowtype;
  merged jsonb;
  field text;
  local_skill jsonb;
  prior_skill jsonb;
  server_skill jsonb;
  seen_count integer;
  correct_count integer;
  latest_day date;
  proposed_day date;
  base_day date;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if p_mutation_id is null or jsonb_typeof(p_profile) <> 'object' or jsonb_typeof(p_baseline) <> 'object' then
    raise exception 'Invalid progress';
  end if;
  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  -- All devices serialize at this lock. A replay returns the latest profile
  -- without adding rewards again, even after an earlier request timed out.
  select * into current_profile from public.profiles where id = uid for update;
  if exists (select 1 from public.profile_sync_receipts where user_id = uid and mutation_id = p_mutation_id) then
    return to_jsonb(current_profile);
  end if;
  merged := to_jsonb(current_profile);
  foreach field in array array['course_id','experience_level_id','goal_score_id','exam_timeframe_id','placement_level_id','equipped_companion'] loop
    if p_profile ? field and (p_profile->field) is distinct from (p_baseline->field) then
      merged := jsonb_set(merged, array[field], p_profile->field);
    end if;
  end loop;
  foreach field in array array['xp','gems','sessions','perfect_sessions'] loop
    merged := jsonb_set(merged, array[field], to_jsonb(least(1000000000,
      public.studyplat_counter(merged->field) + greatest(0, public.studyplat_counter(p_profile->field) - public.studyplat_counter(p_baseline->field)))));
  end loop;
  merged := jsonb_set(merged, '{onboarded}', to_jsonb(current_profile.onboarded or coalesce((p_profile->>'onboarded')::boolean, false)));
  merged := jsonb_set(merged, '{best_streak}', to_jsonb(greatest(current_profile.best_streak, public.studyplat_counter(p_profile->'best_streak'))));
  merged := jsonb_set(merged, '{completed_stops}', coalesce((
    select jsonb_agg(distinct stop) from jsonb_array_elements(coalesce(merged->'completed_stops','[]'::jsonb) || coalesce(p_profile->'completed_stops','[]'::jsonb)) as stops(stop)
    where jsonb_typeof(stop) = 'string'
  ), '[]'::jsonb));
  for field, local_skill in select * from jsonb_each(coalesce(p_profile->'skills','{}'::jsonb)) loop
    prior_skill := coalesce(p_baseline->'skills'->field, '{}'::jsonb);
    server_skill := coalesce(merged->'skills'->field, '{}'::jsonb);
    seen_count := least(1000000000, public.studyplat_counter(server_skill->'seen') + greatest(0, public.studyplat_counter(local_skill->'seen') - public.studyplat_counter(prior_skill->'seen')));
    correct_count := least(seen_count, public.studyplat_counter(server_skill->'correct') + greatest(0, public.studyplat_counter(local_skill->'correct') - public.studyplat_counter(prior_skill->'correct')));
    merged := jsonb_set(merged, array['skills',field], jsonb_build_object('seen', seen_count, 'correct', correct_count));
  end loop;
  latest_day := current_profile.last_session_on;
  proposed_day := (p_profile->>'last_session_on')::date;
  base_day := (p_baseline->>'last_session_on')::date;
  if proposed_day is not null and (latest_day is null or proposed_day >= latest_day) then
    merged := jsonb_set(merged, '{last_session_on}', to_jsonb(proposed_day));
    merged := jsonb_set(merged, '{today_count}', to_jsonb(case when proposed_day = latest_day
      then least(1000000000, current_profile.today_count + greatest(0, public.studyplat_counter(p_profile->'today_count') - case when base_day = proposed_day then public.studyplat_counter(p_baseline->'today_count') else 0 end))
      else public.studyplat_counter(p_profile->'today_count') end));
    merged := jsonb_set(merged, '{streak_days}', to_jsonb(case when proposed_day = latest_day then greatest(current_profile.streak_days, public.studyplat_counter(p_profile->'streak_days')) else public.studyplat_counter(p_profile->'streak_days') end));
    merged := jsonb_set(merged, '{streak_shield_used}', to_jsonb(coalesce((p_profile->>'streak_shield_used')::boolean, false) or (proposed_day = latest_day and current_profile.streak_shield_used)));
  end if;
  update public.profiles set
    course_id = merged->>'course_id', experience_level_id = merged->>'experience_level_id',
    goal_score_id = merged->>'goal_score_id', exam_timeframe_id = merged->>'exam_timeframe_id',
    placement_level_id = merged->>'placement_level_id', onboarded = (merged->>'onboarded')::boolean,
    xp = (merged->>'xp')::integer, gems = (merged->>'gems')::integer,
    sessions = (merged->>'sessions')::integer, perfect_sessions = least((merged->>'sessions')::integer, (merged->>'perfect_sessions')::integer),
    best_streak = (merged->>'best_streak')::integer, streak_days = (merged->>'streak_days')::integer,
    last_session_on = (merged->>'last_session_on')::date, today_count = (merged->>'today_count')::integer,
    completed_stops = array(select jsonb_array_elements_text(merged->'completed_stops')),
    skills = merged->'skills', equipped_companion = merged->>'equipped_companion',
    streak_shield_used = (merged->>'streak_shield_used')::boolean
  where id = uid returning * into current_profile;
  insert into public.profile_sync_receipts(user_id, mutation_id) values (uid, p_mutation_id);
  return to_jsonb(current_profile);
end;
$$;
revoke all on function public.sync_profile(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.sync_profile(uuid, jsonb, jsonb) to authenticated;
