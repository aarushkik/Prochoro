import test from 'node:test';
import assert from 'node:assert/strict';
import { courseProgressFor, LOOKS, looksFor, NO_LOOK } from '../src/data/looks';
import { frameworkFor } from '../src/data/courseFrameworks';
import { learningLevels, levelNumber } from '../src/utils/learningLevels';
import { getQuestMap } from '../src/data/questMap';

test('one numbered level follows saved progress, including placement and gaps', () => {
  const map = getQuestMap('ap-biology');
  assert.equal(levelNumber(map, map.order[2]), 3);
  assert.equal(levelNumber(map, 'old-or-unknown'), null);
  assert.equal(learningLevels(map, []).next, 1);
  assert.equal(learningLevels(map, [...map.order.slice(0, 18), map.order[20]]).next, 19);
  assert.equal(learningLevels(map, [map.order[0], map.order[0], 'unknown']).cleared, 1);
  assert.equal(learningLevels(map, map.order).finished, true);
  assert.equal(learningLevels(map, map.order).next, null);
});

test('hats are earned only by real study, and the bare head is always available', () => {
  const none = { sessions: 0, perfectSessions: 0, bestStreak: 0, unitsDone: 0, bossesBeaten: 0 };
  const owned = (progress: typeof none) => looksFor(progress).filter(look => look.owned).map(look => look.id);
  assert.deepEqual(owned(none), [NO_LOOK]);
  assert.ok(owned({ ...none, sessions: 1 }).includes('grad-cap'));
  assert.ok(!owned({ ...none, sessions: 4 }).includes('beanie'));
  assert.ok(owned({ ...none, sessions: 5 }).includes('beanie'));
  assert.ok(owned({ ...none, bestStreak: 7 }).includes('wizard'));
  const partial = looksFor({ ...none, sessions: 3 }).find(look => look.id === 'beanie')!;
  assert.equal(partial.have, 3); assert.equal(partial.need, 5);
  assert.equal(new Set(LOOKS.map(look => look.id)).size, LOOKS.length);
});

test('units and bosses count across every course and ignore duplicate or foreign IDs', () => {
  const map = getQuestMap('ap-biology');
  const unit = frameworkFor('ap-biology').units[0].areas.flatMap(area => map.units[area].nodes.map(node => node.id));
  assert.equal(courseProgressFor([...unit.slice(0, -1), unit[0], 'foreign']).unitsDone, 0);
  const done = courseProgressFor(unit);
  assert.equal(done.unitsDone, 1);
  assert.equal(done.bossesBeaten, unit.filter(id => map.units.flatMap(u => u.nodes).find(node => node.id === id)?.kind === 'boss').length);
  const other = getQuestMap('ap-csp');
  const both = courseProgressFor([...unit, ...frameworkFor('ap-csp').units[0].areas.flatMap(area => other.units[area].nodes.map(node => node.id))]);
  assert.equal(both.unitsDone, 2);
});
