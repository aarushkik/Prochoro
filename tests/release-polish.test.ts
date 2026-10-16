import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveQueue } from '../src/lib/saveQueue';
import { choiceCanBeSubmitted, eliminatedChoiceFor } from '../src/utils/quizChoices';
import { resolveAppearance } from '../src/theme/appearance';
import { getPlacementQuiz } from '../src/data/placementQuestions';
import { apCourses } from '../src/data/apCourses';
import { colors, darkColors } from '../src/theme/colors';

test('retry saves the newest in-memory progress after storage fails', async () => {
  let fail = true;
  let saved = 0;
  const queue = createSaveQueue<number>(async value => { if (fail) throw new Error('disk full'); saved = value; });
  await assert.rejects(queue.save(10));
  await assert.rejects(queue.save(30));
  assert.equal(saved, 0);
  fail = false;
  await queue.flush();
  assert.equal(saved, 30);
});

test('concurrent saves serialize and flush includes newer snapshots', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const committed: number[] = [];
  let active = 0;
  const queue = createSaveQueue<number>(async value => { assert.equal(++active, 1); if (value === 1) await gate; committed.push(value); active--; });
  const first = queue.save(1);
  const second = queue.save(2);
  const third = queue.save(3);
  release();
  await Promise.all([first, second, third]);
  assert.deepEqual(committed, [1, 3]);
  await queue.flush();
  assert.deepEqual(committed, [1, 3]);
});

test('a snapshot arriving during a failed write is retained for retry', async () => {
  let reject!: (reason: Error) => void;
  let fail = true;
  let saved = 0;
  const queue = createSaveQueue<number>(async value => { if (fail) await new Promise<void>((_, no) => { reject = no; }); saved = value; });
  const first = queue.save(1);
  const second = queue.save(2);
  const settled = Promise.allSettled([first, second]);
  reject(new Error('storage unavailable'));
  await settled;
  fail = false;
  await queue.flush();
  assert.equal(saved, 2);
});

test('companion elimination never removes the correct answer or permits a removed choice', () => {
  for (const course of apCourses) for (const question of getPlacementQuiz(course.id).questions) {
    const removed = eliminatedChoiceFor(question);
    if (!question.choices) { assert.equal(removed, null); continue; }
    assert.equal(removed, eliminatedChoiceFor(question));
    assert.notEqual(removed, question.correctAnswerId);
    assert.equal(choiceCanBeSubmitted(question, removed, removed), false);
    assert.equal(choiceCanBeSubmitted(question, 'missing-choice', removed), false);
    assert.equal(choiceCanBeSubmitted(question, question.correctAnswerId!, removed), true);
  }
  assert.equal(choiceCanBeSubmitted(undefined, null, null), false);
});

test('explicit appearances override the device and system safely falls back to light', () => {
  assert.equal(resolveAppearance('dark', 'light'), 'dark');
  assert.equal(resolveAppearance('light', 'dark'), 'light');
  assert.equal(resolveAppearance('system', 'dark'), 'dark');
  assert.equal(resolveAppearance('system', null), 'light');
});

test('page and content surfaces invert between pure white and black', () => {
  for (const key of ['background', 'surface', 'surfaceSelected', 'surfaceSunken', 'primaryTint', 'primarySoft', 'locked', 'disabledBg', 'successSoft', 'dangerSoft'] as const) {
    assert.equal(colors[key], '#FFFFFF', key);
    assert.equal(darkColors[key], '#000000', key);
  }
  assert.equal(colors.primary, '#000000');
  assert.equal(darkColors.primary, '#FFFFFF');
  assert.equal(colors.textOnPrimary, '#FFFFFF');
  assert.equal(darkColors.textOnPrimary, '#000000');
});

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map(c => parseInt(c, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
test('reading and action colors meet normal-text contrast in both themes', () => {
  for (const theme of [colors, darkColors]) for (const [foreground, background] of [
    [theme.textPrimary, theme.background], [theme.textSecondary, theme.surface],
    [theme.textOnPrimary, theme.primary], [theme.successDark, theme.successSoft], [theme.dangerDark, theme.dangerSoft],
  ]) {
    const a = luminance(foreground), b = luminance(background);
    assert.ok((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05) >= 4.5, `${foreground} on ${background}`);
  }
});
