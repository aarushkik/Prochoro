import test from 'node:test';
import assert from 'node:assert/strict';
import { companionsFor } from '../src/data/companions';
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

test('pet level unlocks are countable, ignore duplicate/foreign IDs and retain previous area-based unlocks', () => {
  for (const course of ['ap-biology', 'ap-csa', 'ap-psych']) {
    const map = getQuestMap(course);
    const roster = (completed: string[]) => companionsFor({ map, completed, skills: {}, bestStreak: 0, sessions: 0 });
    assert.equal(roster([...map.order.slice(0, 71), map.order[0], 'foreign']).find(pet => pet.id === 'slate')!.owned, false);
    assert.equal(roster(map.order.slice(0, 72)).find(pet => pet.id === 'slate')!.owned, true);
    assert.equal(roster(map.order.slice(0, 107)).find(pet => pet.id === 'nix')!.owned, false);
    assert.equal(roster(map.order.slice(0, 108)).find(pet => pet.id === 'nix')!.owned, true);
    const previouslyUnlocked = roster(map.units.slice(0, 6).flatMap(unit => unit.nodes.map(node => node.id)));
    assert.equal(previouslyUnlocked.find(pet => pet.id === 'slate')!.owned, true);
    assert.equal(previouslyUnlocked.find(pet => pet.id === 'nix')!.owned, true);
  }
});
