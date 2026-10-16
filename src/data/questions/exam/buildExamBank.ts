import type { PlacementQuestion, Stimulus } from '@/types';
import { subject } from '../builders';
import { frameworkFor, officialUnitForArea } from '@/data/courseFrameworks';
export type Pattern = 'Concept application' | 'Data analysis' | 'Experimental design' | 'Mathematical reasoning' | 'Code analysis' | 'Source analysis' | 'Writing revision';
export interface ExamItem {
  skill: string; pattern: Pattern; prompt: string; answer: string; wrong: string[]; explanation: string; stimulus?: Stimulus; apUnit?: number;
}
export type Family = (variant: number) => ExamItem;
export function item(skill: string, pattern: Pattern, prompt: string, answer: string | number, wrong: (string | number)[], explanation: string, stimulus?: Stimulus): ExamItem {
  return { skill, pattern, prompt, answer: String(answer), wrong: wrong.map(String), explanation, stimulus };
}
export const passage = (content: string, caption = 'Original practice passage.'): Stimulus => ({ kind: 'paragraph', content, caption });
export const table = (content: string): Stimulus => ({ kind: 'chart', content, caption: 'Constructed data for practice.' });
export const code = (content: string): Stimulus => ({ kind: 'code', content });
export const formula = (content: string): Stimulus => ({ kind: 'formula', content });
export const pick = <T,>(values: readonly T[], variant: number): T => values[variant % values.length];

/** Forty reasoning families, each allowing up to three scenario variants.
 * Identical variants are discarded, not counted as additional questions.
 * Saved game-stop identities are preserved independently of bank content.
 * Every stem, scenario, dataset and explanation is original; sources identify
 * the public framework and sample-exam format, not official authorship.
 */
export function buildExamBank(courseId: string, areas: Family[][]): PlacementQuestion[] {
  const builder = subject(courseId); const out: PlacementQuestion[] = []; const issues: string[] = []; const seen = new Set<string>();
  if (areas.length !== 10 || areas.some(families => families.length !== 4)) throw new Error(courseId + ': expected four reasoning families in each of ten game areas');
  areas.forEach((families, area) => {
    builder.inUnit(area);
    for (let variant = 0; variant < 3; variant += 1) families.forEach((family, familyIndex) => {
      const entry = family(variant);
      const options = [entry.answer, ...entry.wrong];
      if (options.length !== 4 || new Set(options.map(value => value.trim().toLocaleLowerCase())).size !== options.length) issues.push('area ' + area + ', family ' + familyIndex + ', variant ' + variant + ': ' + options.join(' | '));
      const apUnit = entry.apUnit ?? officialUnitForArea(courseId, area);
      if (apUnit === null || apUnit < 0 || apUnit >= frameworkFor(courseId).units.length) throw new Error(courseId + ': missing or invalid official unit in area ' + area);
      const signature = JSON.stringify([entry.prompt, entry.stimulus?.content ?? '', entry.answer, [...entry.wrong].sort()]);
      if (seen.has(signature)) return;
      seen.add(signature);
      const question = builder.mc(pick(['developing', 'ap_ready', 'advanced', 'ap_ready'] as const, familyIndex), entry.skill, entry.prompt, options, 0, entry.explanation, entry.stimulus);
      out.push({ ...question, frameworkUnit: apUnit, examSource: { url: frameworkFor(courseId).cedURL, pattern: entry.pattern } });
    });
  });
  if (issues.length) throw new Error(courseId + ': invalid answer choices\n' + issues.join('\n'));
  return out;
}
