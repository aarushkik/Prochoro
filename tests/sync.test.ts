import test from 'node:test';
import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { mergeProfile, mergeGuestProfile } from '../src/lib/profileMerge';
import type { Profile } from '../src/lib/profile';
const empty: Profile = { courseId: null, experienceLevelId: null, goalScoreId: null, examTimeframeId: null, placementLevelId: null, onboarded: false, xp: 0, gems: 0, streakDays: 0, lastSessionOn: null, completedStops: [], skills: {}, todayCount: 0, sessions: 0, perfectSessions: 0, bestStreak: 0, equippedId: null, streakShieldUsed: false };

test('offline merge preserves progress from both devices and unsubmitted work', () => {
  const base = { ...empty, xp: 10, sessions: 1, completedStops: ['first'] };
  const local = { ...base, xp: 25, sessions: 2, completedStops: ['first','second'] };
  const remote = { ...base, xp: 30, sessions: 2, completedStops: ['first','third'] };
  const merged = mergeProfile(local, base, remote);
  assert.equal(merged.xp, 45); assert.equal(merged.sessions, 3); assert.equal(merged.completedStops.length, 3);
  assert.equal(mergeProfile(local, local, remote).xp, 30, 'an acknowledged retry does not duplicate local progress');
});
test('guest upgrade imports into a new/same-course account and preserves a different course', () => {
  const guest = { ...empty, courseId: 'ap-biology', onboarded: true, xp: 20 };
  assert.equal(mergeGuestProfile(guest, empty, empty)?.xp, 20);
  assert.equal(mergeGuestProfile(guest, { ...guest, xp: 40 }, empty)?.xp, 60);
  assert.equal(mergeGuestProfile(guest, { ...guest, courseId: 'ap-chem' }, empty), null);
});

test('PostgreSQL: migration, concurrent device deltas, replay, RLS and account deletion', async () => {
  const db = await PGlite.create();
  const user1 = '10000000-0000-4000-8000-000000000001';
  const user2 = '10000000-0000-4000-8000-000000000002';
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create table auth.identities(user_id uuid references auth.users(id) on delete cascade, provider text); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;`);
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql);
    await db.exec(`grant select, insert, update on public.profiles to authenticated; grant select on public.profiles to anon; insert into auth.users(id) values ('${user1}'), ('${user2}'); set role authenticated; select set_config('request.jwt.claim.sub','${user1}',false);`);
    const baseline = { course_id: null, xp: 0, gems: 0, sessions: 0, perfect_sessions: 0, completed_stops: [], skills: {}, today_count: 0 };
    const p1 = { ...baseline, course_id: 'ap-biology', onboarded: true, xp: 20, gems: 1, sessions: 1, today_count: 1, streak_days: 1, best_streak: 1, last_session_on: '2026-09-06', completed_stops: ['one'], skills: { Water: { seen: 4, correct: 3 } } };
    const p2 = { ...p1, xp: 30, completed_stops: ['two'], skills: { Water: { seen: 4, correct: 4 } } };
    const sync = async (id: string, p: object, b = baseline) => (await db.query<{ profile: any }>('select public.sync_profile($1::uuid, $2::jsonb, $3::jsonb) as profile', [id, JSON.stringify(p), JSON.stringify(b)])).rows[0].profile;
    const first = await sync('20000000-0000-4000-8000-000000000001', p1);
    assert.equal(first.xp, 20); assert.equal(first.today_count, 1);
    const second = await sync('20000000-0000-4000-8000-000000000002', p2);
    assert.equal(second.xp, 50); assert.equal(second.sessions, 2); assert.equal(second.today_count, 2);
    assert.deepEqual(second.skills.Water, { seen: 8, correct: 7 });
    const replay = await sync('20000000-0000-4000-8000-000000000001', p1);
    assert.equal(replay.xp, 50); assert.equal(replay.sessions, 2);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 1, 'another account is invisible');
    assert.equal((await db.query(`update public.profiles set xp=999 where id='${user2}' returning id`)).rows.length, 0);
    await db.exec('reset role; set role anon;');
    await assert.rejects(sync('20000000-0000-4000-8000-000000000003', p1), /permission denied/);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${user1}',false); select public.delete_account(); reset role;`);
    assert.equal((await db.query(`select * from public.profiles where id='${user1}'`)).rows.length, 0);
    assert.equal((await db.query('select * from public.profile_sync_receipts')).rows.length, 0);
    assert.equal((await db.query('select * from auth.users')).rows.length, 1);
    await db.exec(`insert into auth.identities values ('${user2}', 'apple'); set role authenticated; select set_config('request.jwt.claim.sub','${user2}',false);`);
    await assert.rejects(db.query('select public.delete_account()'), /APPLE_REVOCATION_REQUIRED/);
    await db.exec('reset role;');
    assert.equal((await db.query(`select * from auth.users where id='${user2}'`)).rows.length, 1, 'Apple-linked account cannot bypass revocation through the RPC');
  } finally { await db.close(); }
});
