import type { PlacementQuestion } from '@/types';

const words = (text: string | undefined) => (text ?? '').split(/\s+/).filter(Boolean).length;

/**
 * How long a timed battle gives you to answer. Enough to read the question
 * properly at a comfortable pace, so the clock rewards knowing the material
 * rather than skimming: about 0.4 s a word, more for code, data and passages,
 * never under 20 s and never over 90 s. Screen readers get double.
 */
export function secondsFor(question: Pick<PlacementQuestion, 'prompt' | 'stimulus' | 'choices'>, relaxed = false): number {
  const reading = words(question.prompt) + words(question.stimulus?.content) + (question.choices ?? []).reduce((sum, choice) => sum + words(choice.text), 0);
  const dense = question.stimulus && question.stimulus.kind !== 'paragraph' ? 10 : 0;
  const seconds = Math.min(90, Math.max(20, Math.round(12 + reading * 0.4 + dense)));
  return relaxed ? seconds * 2 : seconds;
}

/** A right answer with at least half the clock left lands as a critical hit. */
export const isQuick = (remaining: number, total: number): boolean => total > 0 && remaining >= total / 2;
