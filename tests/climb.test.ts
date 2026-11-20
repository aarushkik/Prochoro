import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAFT_SIZE, FLOORS, START_HP, REMOVE_COST, REST_MISS_HEAL, dealtCard,
  advance, bestStat, buy, cardFor, chooseRoom, climbXp, deal, enemyFor, fight, floorsClimbed, heightLabel, leaveShop,
  mysteryHealth, newRun, rarityOf, removeCard, restAnswer, restHeal, restTrain, roomsFor, shuffleWith, skipReward,
  statOf, takeCard, takeCharm, type Card, type Run,
} from '../src/utils/climb';
import { isQuick, secondsFor } from '../src/utils/battleClock';
import { bossBattle } from '../src/utils/bossBattle';
import { climbQuestions, getPlacementQuiz } from '../src/data/placementQuestions';
import { apCourses } from '../src/data/apCourses';

const drafted = (seed = 'test'): Run => {
  let run = newRun(seed);
  while (run.phase === 'draft') run = takeCard(run, run.offer[0].uid);
  return run;
};
const card = (recall: number, logic: number, insight: number): Card => ({ uid: `c${recall}${logic}${insight}`, kind: 'waves', tier: 1, name: 'Test', rarity: 'common', recall, logic, insight });
/** A battle on floor 1 with chosen cards on each side. */
const battleWith = (mine: Card, theirs: Card, extra: Partial<Run> = {}): Run => {
  const start = { ...drafted(), ...extra };
  const run = chooseRoom(start, 'battle');
  return { ...run, battle: { ...run.battle!, mine, theirs } };
};

test('a climb opens with a five-card draft of everyday rivals, then the first floor', () => {
  let run = newRun('draft');
  assert.equal(run.phase, 'draft'); assert.equal(run.hp, START_HP); assert.equal(run.offer.length, 3);
  assert.ok(run.offer.every((offered) => offered.tier >= 1 && offered.tier <= 3));
  for (let i = 0; i < DRAFT_SIZE; i += 1) run = takeCard(run, run.offer[1].uid);
  assert.equal(run.deck.length, DRAFT_SIZE); assert.equal(run.phase, 'map'); assert.equal(run.floor, 1);
  assert.ok(run.rooms.includes('battle'));
  assert.ok(!run.rooms.some((room) => room === 'rest' || room === 'shop' || room === 'elite'), 'floor 1 is a plain start');
  assert.equal(takeCard(run, 'nope'), run);
});

test('cards follow their family and grow with rank, within 0–20', () => {
  for (const kind of ['waves', 'towers', 'chimneys', 'mesa', 'gears', 'islands', 'ridge', 'reeds', 'pylons', 'peak'] as const) {
    let previous = -1;
    for (let tier = 1; tier <= 6; tier += 1) {
      const made = cardFor(kind, tier, 'x');
      const total = made.recall + made.logic + made.insight;
      for (const value of [made.recall, made.logic, made.insight]) assert.ok(value >= 0 && value <= 20);
      assert.ok(total > previous, `${kind} ${tier} is stronger than the rank below`);
      previous = total;
    }
  }
  assert.equal(bestStat(cardFor('towers', 3, 'x')), 'recall');
  assert.equal(bestStat(cardFor('chimneys', 3, 'x')), 'insight');
  assert.equal(bestStat(cardFor('gears', 3, 'x')), 'logic');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(rarityOf), ['common', 'common', 'uncommon', 'uncommon', 'rare', 'epic']);
});

test('the higher stat wins the round, the gap is the damage, and streaks multiply it', () => {
  let run = battleWith(card(15, 5, 5), card(9, 12, 12));
  const hp = run.battle!.enemy.hp;
  run = fight(run, 'recall', 'me');
  assert.equal(run.battle!.outcome!.winner, 'me'); assert.equal(run.battle!.outcome!.damage, 6); assert.equal(run.battle!.enemy.hp, hp - 6);
  run = { ...deal(run), battle: { ...deal(run).battle!, mine: card(15, 5, 5), theirs: card(9, 12, 12) } };
  run = fight(run, 'recall', 'me');
  assert.equal(run.battle!.outcome!.streak, 2); assert.equal(run.battle!.outcome!.damage, 12, 'second win in a row doubles');
  run = { ...deal(run), battle: { ...deal(run).battle!, mine: card(15, 5, 5), theirs: card(9, 12, 12) } };
  run = fight(run, 'logic', 'them');
  assert.equal(run.battle!.outcome!.winner, 'them'); assert.equal(run.battle!.myStreak, 0); assert.equal(run.hp, START_HP - 7);
  assert.equal(fight(run, 'logic', 'me'), run, 'one stat per round');
});

test('a tie does no damage and breaks both streaks; a wrong answer hands the rival its best stat', () => {
  let run = battleWith(card(10, 10, 10), card(10, 4, 4));
  run = fight(run, 'recall', 'me');
  assert.equal(run.battle!.outcome!.winner, 'tie'); assert.equal(run.battle!.outcome!.damage, 0); assert.equal(run.hp, START_HP);
  assert.equal(bestStat(card(3, 17, 9)), 'logic');
});

test('winning pays coins and offers three cards; bosses add a charm; losing all health ends the climb', () => {
  let run = battleWith(card(20, 20, 20), card(0, 0, 0));
  run = { ...run, battle: { ...run.battle!, enemy: { ...run.battle!.enemy, hp: 5 } } };
  run = fight(run, 'recall', 'me');
  assert.equal(run.phase, 'reward'); assert.equal(run.coins, 20); assert.equal(run.offer.length, 3); assert.equal(run.charmOffer.length, 0);
  assert.equal(run.record.battles, 1);
  const after = takeCard(run, run.offer[0].uid);
  assert.equal(after.phase, 'map'); assert.equal(after.floor, 2); assert.equal(after.deck.length, DRAFT_SIZE + 1);

  let lost = battleWith(card(0, 0, 0), card(20, 20, 20), { hp: 10 });
  lost = fight(lost, 'recall', 'them');
  assert.equal(lost.hp, 0); assert.equal(lost.phase, 'over');
});

test('the top floor is the boss, and beating it starts a harder tower', () => {
  const top = { ...drafted(), floor: FLOORS };
  assert.deepEqual(roomsFor(top), ['boss']);
  assert.equal(enemyFor(top, 'boss').maxHp, 70);
  assert.equal(enemyFor({ ...top, tower: 2 }, 'boss').maxHp, 100);
  assert.equal(enemyFor({ ...top, tower: 3 }, 'boss').maxHp, 150);
  assert.equal(enemyFor({ ...top, tower: 4 }, 'boss').maxHp, 200);
  assert.equal(enemyFor(top, 'boss').tier, 6);
  assert.ok(enemyFor({ ...top, tower: 3 }, 'battle').maxHp >= enemyFor(top, 'battle').maxHp);
  let run = chooseRoom({ ...top, rooms: ['boss'] }, 'boss');
  run = { ...run, battle: { ...run.battle!, mine: card(20, 20, 20), theirs: card(0, 0, 0), enemy: { ...run.battle!.enemy, hp: 1 } } };
  run = fight(run, 'logic', 'me');
  assert.equal(run.phase, 'reward'); assert.equal(run.charmOffer.length, 2); assert.equal(run.record.bosses, 1);
  run = takeCharm(run, run.charmOffer[0]);
  assert.equal(run.charms.length, 1); assert.equal(run.phase, 'reward');
  run = skipReward(run);
  assert.equal(run.tower, 2); assert.equal(run.floor, 1); assert.deepEqual(run.path, []); assert.equal(run.phase, 'map');
});

test('charms change battles: stat bonuses, a stronger streak, an eraser and flashcards', () => {
  assert.equal(statOf(card(10, 10, 10), 'recall', ['highlighter']), 12);
  assert.equal(statOf(card(19, 10, 10), 'recall', ['highlighter']), 20);
  assert.equal(statOf(card(10, 10, 10), 'logic', ['highlighter']), 10);
  let run = battleWith(card(12, 5, 5), card(9, 9, 9), { charms: ['study-group'] });
  run = fight(run, 'recall', 'me');
  assert.equal(run.battle!.outcome!.streak, 2); assert.equal(run.battle!.outcome!.damage, 6);
  let erased = battleWith(card(5, 5, 5), card(15, 15, 15), { charms: ['eraser'] });
  erased = fight(erased, 'recall', 'them');
  assert.equal(erased.hp, START_HP); assert.equal(erased.battle!.outcome!.erased, true);
  erased = { ...deal(erased), battle: { ...deal(erased).battle!, mine: card(5, 5, 5), theirs: card(15, 15, 15) } };
  erased = fight(erased, 'recall', 'them');
  assert.ok(erased.hp < START_HP, 'only the first loss is erased');
  let healed = battleWith(card(20, 20, 20), card(0, 0, 0), { charms: ['flashcards'], hp: 50 });
  healed = { ...healed, battle: { ...healed.battle!, enemy: { ...healed.battle!.enemy, hp: 1 } } };
  assert.equal(fight(healed, 'recall', 'me').hp, 58);
});

test('a rest is one question: right earns heal or train, a miss still rests a little', () => {
  let run: Run = chooseRoom({ ...drafted(), floor: 3, rooms: ['rest'] }, 'rest');
  assert.equal(run.restLeft, 1);
  assert.equal(restHeal(run), run, 'no rest before the answer');
  const missed = restAnswer({ ...run, hp: 50 }, false);
  assert.equal(missed.hp, 50 + REST_MISS_HEAL); assert.equal(missed.phase, 'map');
  run = restAnswer(run, true);
  assert.equal(run.restLeft, 0); assert.equal(run.phase, 'rest');
  assert.equal(restHeal({ ...run, hp: 50 }).hp, 75);
  const target = run.deck[0];
  const trained = restTrain(run, target.uid).deck.find((item) => item.uid === target.uid)!;
  assert.equal(trained.recall, Math.min(20, target.recall + 2)); assert.equal(trained.insight, Math.min(20, target.insight + 2));
});

test('a missed unlock deals one of the offered cards, the same one every time for a seed', () => {
  const run = newRun('dealt');
  const uid = dealtCard(run);
  assert.ok(run.offer.some((item) => item.uid === uid));
  assert.equal(dealtCard(run), uid);
  assert.equal(dealtCard({ ...run, offer: [] }), null);
});

test('the shop sells for coins, removes cards for a fee, and never empties the deck', () => {
  let run = chooseRoom({ ...drafted(), floor: 3, rooms: ['shop'], coins: 200 }, 'shop');
  assert.ok(run.shop.length >= 5);
  const index = run.shop.findIndex((item) => item.kind === 'card');
  const bought = buy(run, index);
  assert.equal(bought.coins, 200 - run.shop[index].price); assert.equal(bought.deck.length, run.deck.length + 1);
  assert.equal(buy(bought, index), bought, 'sold out');
  assert.equal(buy({ ...run, coins: 0 }, index).coins, 0, 'no coins, no sale');
  run = removeCard(run, run.deck[0].uid);
  assert.equal(run.coins, 200 - REMOVE_COST); assert.equal(run.deck.length, DRAFT_SIZE - 1);
  const single = { ...run, deck: run.deck.slice(0, 1) };
  assert.equal(removeCard(single, single.deck[0].uid), single);
  assert.equal(leaveShop(run).phase, 'map');
});

test('a mystery is either a find or a trap, and every choice moves the climb on', () => {
  const outcomes = new Set<string>();
  for (let i = 0; i < 40; i += 1) {
    const run = chooseRoom({ ...drafted(`m${i}`), rooms: ['mystery'] }, 'mystery');
    outcomes.add(run.mystery!);
    const after = mysteryHealth({ ...run, hp: 50 });
    assert.equal(after.hp, run.mystery === 'good' ? 65 : 40); assert.equal(after.phase, 'map');
    assert.equal(takeCard(run, run.offer[0].uid).deck.length, DRAFT_SIZE + 1);
  }
  assert.deepEqual([...outcomes].sort(), ['bad', 'good']);
});

test('a seed replays the same climb exactly, and scoring counts floors and bosses', () => {
  const play = (seed: string) => { let run = drafted(seed); run = chooseRoom(run, run.rooms[0]); return JSON.stringify(run); };
  assert.equal(play('same'), play('same'));
  assert.notEqual(play('one'), play('two'));
  const run = advance(advance({ ...drafted(), tick: 1 }));
  assert.equal(floorsClimbed(run), 2);
  assert.equal(heightLabel(0), 'Tower 1 · Floor 1'); assert.equal(heightLabel(FLOORS + 2), 'Tower 2 · Floor 3');
  assert.equal(climbXp({ ...run, record: { battles: 2, bosses: 1 } }, 10), 10 * 4 + 2 * 5 + 25);
});

test('the deck shuffle is repeatable and never drops or repeats a question', () => {
  const items = Array.from({ length: 40 }, (_, i) => i);
  assert.deepEqual(shuffleWith(items, 'a'), shuffleWith(items, 'a'));
  assert.notDeepEqual(shuffleWith(items, 'a'), shuffleWith(items, 'b'));
  assert.deepEqual([...shuffleWith(items, 'c')].sort((a, b) => a - b), items);
});

test('the clock gives time to read, more for code and data, double for screen readers', () => {
  assert.equal(secondsFor({ prompt: 'Short?', choices: [{ id: 'a', text: 'Yes' }] }), 20);
  assert.equal(secondsFor({ prompt: 'word '.repeat(400), choices: [] }), 90);
  const code = { prompt: 'What prints?', stimulus: { kind: 'code' as const, content: 'x ← 1' }, choices: [{ id: 'a', text: '1' }] };
  assert.ok(secondsFor(code) > secondsFor({ ...code, stimulus: undefined }));
  assert.equal(secondsFor(code, true), secondsFor(code) * 2);
  assert.equal(isQuick(10, 20), true); assert.equal(isQuick(9.9, 20), false); assert.equal(isQuick(5, 0), false);
});

test('fast boss answers hit harder but a boss still never falls before the set is passed', () => {
  const slow = bossBattle(3, 3, 8, false, 8, 0);
  const fast = bossBattle(3, 3, 8, false, 8, 3);
  assert.ok(fast.bossHealth < slow.bossHealth);
  assert.equal(bossBattle(3, 3, 8, false, 8, 99).bossHealth, fast.bossHealth, 'crits cannot exceed right answers');
  for (let correct = 0; correct <= 7; correct += 1) assert.ok(bossBattle(correct, 7, 8, false, 8, correct).bossHealth >= 1);
  assert.equal(bossBattle(8, 8, 8, true, 8, 8).defeated, true);
  assert.equal(bossBattle(4, 8, 8, true, 8, 4).defeated, false, 'below 60% the finisher never lands');
});

test('the climb pool is only tap-to-answer questions, from reached units when there are enough', () => {
  for (const course of apCourses) {
    const pool = climbQuestions(course.id, 0);
    assert.ok(pool.length >= 20, course.id);
    assert.ok(pool.every((q) => (q.choices?.length ?? 0) > 1 && q.correctAnswerId), course.id);
    assert.ok(pool.length <= getPlacementQuiz(course.id).questions.length);
  }
});

test('a rival streak tops out at ×3, while yours keeps climbing', () => {
  let run = battleWith(card(1, 1, 1), card(9, 9, 9));
  for (let round = 0; round < 5; round += 1) {
    run = fight(run, 'recall', 'them');
    const dealt = deal(run);
    run = { ...dealt, battle: { ...dealt.battle!, mine: card(1, 1, 1), theirs: card(9, 9, 9) } };
  }
  assert.equal(run.hp, START_HP - 8 * (1 + 2 + 3 + 3 + 3));
  let mine = battleWith(card(9, 9, 9), card(1, 1, 1));
  mine = { ...mine, battle: { ...mine.battle!, enemy: { ...mine.battle!.enemy, hp: 999, maxHp: 999 } } };
  for (let round = 0; round < 5; round += 1) {
    mine = fight(mine, 'recall', 'me');
    const dealt = deal(mine);
    mine = { ...dealt, battle: { ...dealt.battle!, mine: card(9, 9, 9), theirs: card(1, 1, 1) } };
  }
  assert.equal(mine.battle!.enemy.hp, 999 - 8 * (1 + 2 + 3 + 4 + 5));
});

test('every offer is three different rivals', () => {
  for (let i = 0; i < 60; i += 1) {
    const run = newRun(`offer${i}`);
    assert.equal(new Set(run.offer.map((item) => `${item.kind}-${item.tier}`)).size, 3);
  }
});
