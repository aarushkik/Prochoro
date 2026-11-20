import type { PlacementQuestion } from '../types';

/** An answer can be checked once one of this question's own choices is picked. */
export function choiceCanBeSubmitted(question: PlacementQuestion | undefined, selected: string | null): boolean {
  return selected !== null && Boolean(question?.choices?.some((choice) => choice.id === selected));
}
