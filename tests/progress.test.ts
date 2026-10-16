import { weakSpots } from '../src/data/weakSpots';
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, bankSession, sessionClearsStop, sanitizeSkills } from '../src/utils/questProgress';
import { daysBetween, nextStreak, visibleStreak } from '../src/utils/studyDates';
import { scorePlacement } from '../src/utils/placementScoring';
import { getPlacementQuiz, placementQuestions, questionsForStop, questionsForSkills } from '../src/data/placementQuestions';
import { apCourses } from '../src/data/apCourses';
import { getQuestMap, questionCountFor } from '../src/data/questMap';
import { gameAreaOrder, officialUnitForArea } from '../src/data/courseFrameworks';
import { sanitizeOnboarding } from '../src/utils/onboarding';
const answers = [true, true, true, false, false].map(correct => ({ skillTag: 'Water and bonding', correct }));

test('days and streaks use calendar dates across DST, leap days, gaps and clock rollback', () => {
  assert.equal(daysBetween('2026-03-08','2026-03-09'), 1);
  assert.equal(daysBetween('2024-02-28','2024-03-01'), 2);
  assert.equal(daysBetween('2025-02-29','2025-03-01'), null);
  assert.equal(nextStreak(3,'2026-09-01','2026-09-01'), 3);
  assert.equal(nextStreak(3,'2026-09-01','2026-09-02'), 4);
  assert.equal(nextStreak(3,'2026-09-01','2026-09-03'), 1);
  assert.equal(nextStreak(3,'2026-09-01','2026-08-31'), 3);
  assert.equal(visibleStreak(3,'2026-09-01','2026-09-03'), 0);
});
test('banking is atomic, immutable and resets daily counts', () => {
  const first = bankSession(emptyProgress(), { xp: 20, answers, today: '2026-09-01', clearedNodeId: 'one' });
  const second = bankSession(first, { xp: 15, answers, today: '2026-09-01', clearedNodeId: 'one' });
  const nextDay = bankSession(second, { xp: 10, answers, today: '2026-09-02' });
  assert.deepEqual(first.earned, ['one']); assert.equal(first.skills['Water and bonding'].seen, 5);
  assert.equal(second.xp, 35); assert.equal(second.todayCount, 2); assert.equal(second.earned.length, 1);
  assert.equal(nextDay.todayCount, 1); assert.equal(nextDay.streakDays, 2); assert.equal(nextDay.sessions, 3);
});
test('empty or invalid sessions award nothing; passing needs a complete 60% attempt', () => {
  const empty = emptyProgress();
  assert.equal(bankSession(empty, { xp: 5, answers: [], today: '2026-09-01' }), empty);
  assert.equal(bankSession(empty, { xp: Infinity, answers, today: '2026-09-01' }), empty);
  assert.equal(sessionClearsStop(answers, 5), true);
  assert.equal(sessionClearsStop(answers.slice(0, 3), 5), false);
  assert.equal(sessionClearsStop(answers.map(a => ({ ...a, correct: false })), 5), false);
});
test('a shield is spent once and resets only after the streak breaks', () => {
  let p = bankSession(emptyProgress(), { xp: 10, answers, today: '2026-09-01' });
  p = bankSession(p, { xp: 10, answers, today: '2026-09-03', ability: 'shield', shieldDays: 1 });
  assert.equal(p.streakShieldUsed, true); assert.equal(p.streakDays, 1);
  p = bankSession(p, { xp: 10, answers, today: '2026-09-05', ability: 'shield', shieldDays: 1 });
  assert.equal(p.streakShieldUsed, false); assert.equal(p.streakDays, 1);
});
test('malformed progress cannot create negative or impossible skill accuracy', () => {
  assert.deepEqual(sanitizeSkills({ bad: { seen: -3, correct: 10 }, good: { seen: 5, correct: 8 } }), { bad: { seen: 0, correct: 0 }, good: { seen: 5, correct: 5 } });
  const result = sanitizeOnboarding({ courseId: 'missing', placementLevelId: 'invalid' } as never);
  assert.equal(result.courseId, null); assert.equal(result.placementLevelId, null);
});
for (const course of apCourses) {
  test(`${course.name}: every bank item is valid and every map stop is playable`, () => {
    const all = getPlacementQuiz(course.id).questions;
    assert.equal(new Set(all.map(q => q.id)).size, all.length);
    for (const q of all) {
      assert.equal(q.courseId, course.id); assert.ok(q.explanation.trim()); assert.ok(q.skillTag.trim());
      if (q.choices) { assert.equal(q.choices.filter(c => c.id === q.correctAnswerId).length, 1); assert.equal(new Set(q.choices.map(c => c.id)).size, q.choices.length); }
      else assert.ok(q.acceptedAnswers?.length);
    }
    const sample = placementQuestions(course.id);
    assert.equal(sample.length, 8); assert.equal(new Set(sample.map(q => q.id)).size, 8);
    assert.ok(new Set(sample.map(q => q.unit)).size >= 6);
    assert.ok(!sample.some(q => q.unit === 9));
    assert.ok(new Set(sample.map(q => q.difficulty)).size >= 3);
    assert.equal(scorePlacement(sample.map(question => ({ question, correct: true }))).level, 'advanced_review');
    assert.equal(scorePlacement(sample.map(question => ({ question, correct: false }))).level, 'beginner');
    const map = getQuestMap(course.id);
    assert.equal(new Set(map.order).size, map.order.length);
    for (const unit of map.units) for (const node of unit.nodes) {
      const count = questionCountFor(node);
      const selected = questionsForStop(course.id, unit.index, count, node.id);
      assert.equal(selected.length, count, node.id);
      const areaOrder = gameAreaOrder(course.id);
      assert.ok(selected.every(q => areaOrder.indexOf(q.unit!) <= areaOrder.indexOf(unit.index)), `${node.id} uses an unseen future area`);
      if (node.unitBoss) assert.ok(selected.every(q => (q.frameworkUnit ?? officialUnitForArea(course.id, q.unit!)) === node.apUnit));
      else assert.ok(selected.some(q => q.unit === unit.index));
      assert.equal(sessionClearsStop(selected.map(q => ({ skillTag: q.skillTag, correct: true })), count), true);
    }
    const tag = all[0].skillTag;
    assert.ok(questionsForSkills(course.id, [tag], 12, 'focus').every(q => q.skillTag === tag));
    assert.deepEqual(questionsForSkills(course.id, ['nonexistent'], 12, 'focus'), []);
  });
}

test('perfect practice is not mislabeled unattempted by recommendations', () => {
  const skills = { 'Water and bonding': { seen: 5, correct: 5 } };
  const suggestions = weakSpots(skills, 'ap-biology', 100);
  const water = suggestions.find(s => s.name === 'Water and bonding');
  assert.equal(water?.seen, 5);
  assert.equal(water?.pct, 100);
  assert.notEqual(suggestions[0].name, 'Water and bonding');
});
