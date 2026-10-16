import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleQuizChoices } from '../src/utils/shuffleQuizChoices';
import { getPlacementQuiz } from '../src/data/placementQuestions';

test('attempts balance correct letters without changing answers or bank data', () => {
  const bank = getPlacementQuiz('ap-biology').questions.filter(q => q.choices?.length === 4).slice(0, 12);
  const original = JSON.stringify(bank);
  const shuffled = shuffleQuizChoices(bank, 'attempt-a');
  for (let start = 0; start < 12; start += 4) assert.equal(new Set(shuffled.slice(start, start + 4).map(q => q.choices!.findIndex(c => c.id === q.correctAnswerId))).size, 4);
  shuffled.forEach((q, index) => {
    assert.equal(q.choices!.find(c => c.id === q.correctAnswerId)?.text, bank[index].choices!.find(c => c.id === bank[index].correctAnswerId)?.text);
    assert.deepEqual(new Set(q.choices!.map(c => c.id)), new Set(bank[index].choices!.map(c => c.id)));
  });
  assert.equal(JSON.stringify(bank), original);
  assert.deepEqual(shuffleQuizChoices(bank, 'attempt-a'), shuffled);
  assert.notDeepEqual(shuffleQuizChoices(bank, 'attempt-b'), shuffled);
  assert.deepEqual(shuffleQuizChoices([...bank, ...bank.slice(0, 1)], 'attempt-a').slice(0, 12), shuffled);
});
