import test from 'node:test';
import assert from 'node:assert/strict';
import { answerDamage, bossBattle } from '../src/utils/bossBattle';

test('correct answers damage the boss and misses damage the player', () => {
  assert.equal(bossBattle(0, 0, 7).bossHealth, 100);
  assert.equal(bossBattle(1, 1, 7).bossHealth, 86);
  assert.equal(bossBattle(1, 2, 7).playerHealth, 86);
  assert.equal(bossBattle(1, 2, 7).bossHealth, 86);
  assert.equal(answerDamage(0, 7), 14);
});
test('a finisher requires the complete set and the actual 60% passing score', () => {
  assert.equal(bossBattle(5, 5, 7, true).defeated, false);
  assert.equal(bossBattle(4, 7, 7, true).defeated, false);
  assert.equal(bossBattle(5, 7, 7).canFinish, true);
  assert.equal(bossBattle(5, 7, 7, true).bossHealth, 0);
  assert.equal(bossBattle(7, 7, 7).defeated, true);
});
test('retry and additional review rounds recalculate from real recorded answers', () => {
  assert.equal(bossBattle(2, 3, 7).playerHealth, 86);
  assert.equal(bossBattle(2, 2, 7).playerHealth, 100);
  assert.equal(bossBattle(5, 7, 9, true).defeated, false);
  assert.equal(bossBattle(7, 9, 9, true).defeated, true);
  const beforeReview = bossBattle(5, 7, 7, false, 7);
  const duringReview = bossBattle(5, 7, 9, false, 7);
  assert.equal(duringReview.bossHealth, beforeReview.bossHealth);
  assert.equal(duringReview.playerHealth, beforeReview.playerHealth);
  assert.equal(bossBattle(7, 8, 9, false, 7).bossHealth, 1);
  assert.equal(bossBattle(7, 8, 9, false, 7).defeated, false);
  assert.equal(bossBattle(7, 9, 9, false, 7).defeated, true);
});
