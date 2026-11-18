import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_FRAMEWORKS, gameAreaOrder, unitBossId } from '../src/data/courseFrameworks';
import { getPlacementQuiz, questionsForStop } from '../src/data/placementQuestions';
import { getQuestMap, questionCountFor } from '../src/data/questMap';

const expectedUnits: Record<string, number> = { 'ap-biology': 8, 'ap-calc-ab': 8, 'ap-chem': 9, 'ap-world': 9, 'ap-us-history': 9, 'ap-eng-lang': 9, 'ap-psych': 5, 'ap-csa': 4, 'ap-csp': 5, 'ap-stats': 9 };
test('every current official AP unit ends with its own playable boss without rekeying saved levels', () => {
  for (const [id, count] of Object.entries(expectedUnits)) {
    const framework = COURSE_FRAMEWORKS[id]; const map = getQuestMap(id);
    assert.equal(framework.units.length, count, id);
    assert.equal(map.order.length, 180, id);
    assert.deepEqual([...gameAreaOrder(id)].sort((a, b) => a - b), Array.from({ length: 10 }, (_, index) => index));
    const expectedIds = Array.from({ length: 10 }, (_, area) => Array.from({ length: 6 }, (_, stage) => [
      `${id}-u${area + 1}-s${stage + 1}-lesson`,
      `${id}-u${area + 1}-s${stage + 1}-${['drill', 'study', 'drill', 'bonus', 'study', 'drill'][stage]}`,
      `${id}-u${area + 1}-s${stage + 1}-boss`,
    ]).flat()).flat();
    assert.deepEqual([...map.order].sort(), expectedIds.sort());
    framework.units.forEach((unit, index) => {
      const boss = map.units[unit.bossArea].nodes.find(node => node.id === unitBossId(id, index))!;
      assert.ok(boss?.unitBoss, id + ' unit ' + (index + 1)); assert.equal(boss.apUnit, index);
      const unitNodes = unit.areas.flatMap(area => map.units[area].nodes);
      assert.equal(Math.max(...unitNodes.map(node => map.order.indexOf(node.id))), map.order.indexOf(boss.id));
      const pool = questionsForStop(id, unit.bossArea, questionCountFor(boss), boss.id);
      assert.ok(pool.length >= 4); assert.ok(pool.every(question => question.frameworkUnit === index));
    });
  }
});

test('original banks have distinct choices, complete explanations, valid source/unit tags and no identical counted variants', () => {
  for (const id of Object.keys(expectedUnits)) {
    const bank = getPlacementQuiz(id).questions; const signatures = new Set<string>();
    // Every map area needs enough distinct questions for its levels; the
    // builder already discards relabelled copies, so this counts real items.
    for (let area = 0; area < 10; area += 1) assert.ok(bank.filter(question => question.unit === area).length >= 4, id + ' area ' + area);
    assert.ok(bank.length >= 40, id);
    for (const question of bank) {
      assert.equal(question.choices?.length, 4);
      assert.equal(new Set(question.choices!.map(choice => choice.text.trim().toLowerCase())).size, 4);
      assert.ok(question.choices!.some(choice => choice.id === question.correctAnswerId));
      assert.ok(question.explanation.length > 65);
      assert.ok(question.frameworkUnit! >= 0 && question.frameworkUnit! < expectedUnits[id]);
      assert.equal(question.examSource?.url, COURSE_FRAMEWORKS[id].cedURL);
      assert.ok(question.examSource?.pattern);
      if (question.stimulus) assert.ok(question.stimulus.content.trim());
      const answer = question.choices!.find(choice => choice.id === question.correctAnswerId)!.text;
      const signature = JSON.stringify([question.prompt, question.stimulus?.content ?? '', answer, question.choices!.filter(choice => choice.id !== question.correctAnswerId).map(choice => choice.text).sort()]);
      assert.ok(!signatures.has(signature), id + ': duplicate question'); signatures.add(signature);
    }
  }
});

test('selected computed problems agree with independent solutions across all variants', () => {
  const answers = (id: string, skill: string) => getPlacementQuiz(id).questions.filter(question => question.skillTag === skill).map(question => question.choices!.find(choice => choice.id === question.correctAnswerId)!.text);
  assert.deepEqual(answers('ap-biology', 'Independent assortment'), [80, 120, 160].map(total => String(total * 0.5 * 0.5)));
  assert.deepEqual(answers('ap-biology', 'Energy flow'), [10000, 20000, 40000].map(energy => energy * 0.1 * 0.1 + ' kJ'));
  assert.deepEqual(answers('ap-calc-ab', 'Euler’s method'), [0.1, 0.2, 0.3].map(h => { let x = 0, y = 1; for (let step = 0; step < 2; step++) { y += h * (x + y); x += h; } return y.toFixed(2); }));
  assert.deepEqual(answers('ap-calc-ab', 'Volumes of revolution'), [3, 6, 9].map(b => b ** 3 / 3 + 'π'));
  assert.deepEqual(answers('ap-chem', 'Limiting reactants'), [1, 2, 3].map(scale => Math.min(2 * scale, 3 * scale / 3) * 2 + ' mol'));
  assert.deepEqual(answers('ap-chem', 'Cell potentials'), [0.34, 0.8, 1.1].map(cathode => (cathode - -0.76).toFixed(2) + ' V'));
  assert.deepEqual(answers('ap-csa', 'Loop tracing'), [3, 4, 5].map(n => { let sum = 0; for (let index = 1; index <= n; index++) sum += index; return String(sum); }));
  assert.deepEqual(answers('ap-csa', 'Column traversal'), [0, 1, 2].map(v => [[1, 2 + v], [3, 4 + v], [5, 6 + v]].reduce((sum, row) => sum + row[1], 0).toString()));
});

test('wrong answers are believable mistakes, not giveaways', () => {
  // Absolute words let a student eliminate a choice without knowing the
  // content. Real AP distractors are plausible misconceptions instead.
  const giveaway = /\b(immediately|instantly|without limit|automatically|magically|permanently|impossible|never|always)\b/i;
  for (const id of Object.keys(expectedUnits)) for (const question of getPlacementQuiz(id).questions) {
    for (const choice of question.choices!) {
      if (choice.id === question.correctAnswerId) continue;
      // "never terminates" is a real outcome for a loop, not an overstatement.
      assert.ok(!giveaway.test(choice.text.replace(/never terminates/i, '')), id + ': "' + choice.text + '"');
    }
  }
});

test('variants are different problems, not relabelled copies', () => {
  for (const id of Object.keys(expectedUnits)) {
    const seen = new Set<string>();
    for (const question of getPlacementQuiz(id).questions) {
      const answer = question.choices!.find(choice => choice.id === question.correctAnswerId)!.text;
      const key = question.unit + '|' + question.skillTag + '|' + (question.stimulus?.content ?? '') + '|' + answer + '|' + question.choices!.map(choice => choice.text).sort().join('|');
      assert.ok(!seen.has(key), id + ': repeated variant of ' + question.skillTag); seen.add(key);
    }
  }
});

test('new courses compute their answers from the stated numbers', () => {
  const answers = (id: string, skill: string) => getPlacementQuiz(id).questions.filter(question => question.skillTag === skill).map(question => question.choices!.find(choice => choice.id === question.correctAnswerId)!.text);
  assert.deepEqual(answers('ap-csp', 'Binary numbers'), ['11', '26', '39']);
  assert.deepEqual(answers('ap-csp', 'REPEAT UNTIL'), ['5', '4', '3']);
  assert.deepEqual(answers('ap-csp', 'List operations'), ['[8, 9, 2, 6]', '[6, 8, 1, 4, 5]', '[2, 1, 4]']);
  assert.deepEqual(answers('ap-stats', 'z-scores'), ['1.5', '−1.5', '2']);
  assert.deepEqual(answers('ap-stats', 'Binomial probability'), ['0.3125', '0.4116', '0.0960']);
  assert.deepEqual(answers('ap-stats', 'Chi-square components'), ['1.00', '1.50', '2.50']);
});
