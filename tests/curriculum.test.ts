import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_FRAMEWORKS, gameAreaOrder, unitBossId } from '../src/data/courseFrameworks';
import { getPlacementQuiz, questionsForStop } from '../src/data/placementQuestions';
import { getQuestMap, questionCountFor } from '../src/data/questMap';

const expectedUnits: Record<string, number> = { 'ap-biology': 8, 'ap-calc-ab': 8, 'ap-chem': 9, 'ap-world': 9, 'ap-us-history': 9, 'ap-eng-lang': 9, 'ap-psych': 5, 'ap-csa': 4 };
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
    assert.ok(bank.length >= 75, id);
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
