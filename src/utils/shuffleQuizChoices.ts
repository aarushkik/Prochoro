import type { PlacementQuestion } from '@/types';

/** Stable during an attempt, fresh on replay, balanced across each answer-count group. */
export function shuffleQuizChoices(questions: readonly PlacementQuestion[], seed: string): PlacementQuestion[] {
  let state = 2166136261;
  for (const letter of seed) state = Math.imul(state ^ letter.charCodeAt(0), 16777619) >>> 0;
  const random = () => { state = (state + 0x6d2b79f5) >>> 0; let value = Math.imul(state ^ state >>> 15, 1 | state); value ^= value + Math.imul(value ^ value >>> 7, 61 | value); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let index = out.length - 1; index > 0; index -= 1) { const other = Math.floor(random() * (index + 1)); [out[index], out[other]] = [out[other], out[index]]; }
    return out;
  };
  const bags = new Map<number, number[]>();
  return questions.map(question => {
    if (!question.choices?.length) return question;
    const answer = question.choices.find(choice => choice.id === question.correctAnswerId);
    if (!answer) return question;
    const count = question.choices.length;
    let bag = bags.get(count);
    if (!bag?.length) { bag = shuffle(Array.from({ length: count }, (_, index) => index)); bags.set(count, bag); }
    const target = bag.pop()!;
    const choices = shuffle(question.choices.filter(choice => choice.id !== answer.id));
    choices.splice(target, 0, answer);
    return { ...question, choices };
  });
}
