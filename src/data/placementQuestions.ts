import type {
  PlacementLevel,
  PlacementQuestion,
  PlacementQuiz,
} from '@/types';

/**
 * The question banks, and the placement quiz built on top of them.
 *
 * Original applied practice written against public course frameworks and
 * sample-exam formats, not official or licensed exam items. Tagged with the study area
 * they belong to so a stop on the map can
 * ask about the topic on its own plaque rather than about the course at large.
 *
 * The banks themselves live one file per course under `./questions`.
 */

import { apBiologyQuestions } from './questions/apBiology';
import { apCalcABQuestions } from './questions/apCalcAB';
import { apWorldQuestions } from './questions/apWorld';
import { apUSHQuestions } from './questions/apUSH';
import { apCSAQuestions } from './questions/apCSA';
import { apChemQuestions } from './questions/apChem';
import { apPsychQuestions } from './questions/apPsych';
import { apEngLangQuestions } from './questions/apEngLang';
import { bossUnitIndex, frameworkFor, gameAreaOrder } from './courseFrameworks';

/** Plain on purpose: say what the check is and what it decides. */
const quizIntros: Record<string, string> = {
  'ap-biology': 'A few questions from across AP Biology. Your answers decide where on the map you start.',
  'ap-calc-ab': 'A few questions from across AP Calculus AB. Your answers decide where on the map you start.',
  'ap-world': 'A few questions from across AP World History. Your answers decide where on the map you start.',
  'ap-us-history': 'A few questions from across AP U.S. History. Your answers decide where on the map you start.',
  'ap-csa': 'A few questions from across AP Computer Science A. Your answers decide where on the map you start.',
  'ap-chem': 'A few questions from across AP Chemistry. Your answers decide where on the map you start.',
  'ap-psych': 'A few questions from across AP Psychology. Your answers decide where on the map you start.',
  'ap-eng-lang': 'A few questions from across AP English Language. Your answers decide where on the map you start.',
};

const questionsByCourse: Record<string, PlacementQuestion[]> = {
  'ap-biology': apBiologyQuestions,
  'ap-calc-ab': apCalcABQuestions,
  'ap-world': apWorldQuestions,
  'ap-us-history': apUSHQuestions,
  'ap-csa': apCSAQuestions,
  'ap-chem': apChemQuestions,
  'ap-psych': apPsychQuestions,
  'ap-eng-lang': apEngLangQuestions,
};

/** The starting levels a student can be placed into. */
export const PLACEMENT_LEVELS: Record<string, PlacementLevel> = {
  beginner: {
    id: 'beginner',
    title: 'Beginner',
    headline: 'Start at Unit 1 foundations',
    description: 'For students who are new or want a fresh start.',
  },
  builder: {
    id: 'builder',
    title: 'Builder',
    headline: 'Start with early unit lessons and guided practice',
    description: 'For students who know some ideas but need structure.',
  },
  ap_ready: {
    id: 'ap_ready',
    title: 'Confident Builder',
    headline: 'Start with AP-style practice and targeted review',
    description: 'A suggested starting point for focused practice. This short check does not predict an AP score.',
  },
  advanced_review: {
    id: 'advanced_review',
    title: 'Advanced Review',
    headline: 'Start with challenge questions, weak-area review, and boss duels',
    description: 'A suggested review route based on this short check. Practice results do not predict an AP score.',
  },
};

/**
 * Get the placement quiz for a course. Falls back to AP Biology so the flow
 * always has a usable bank while onboarding is being restored.
 */
export function getPlacementQuiz(courseId: string | null): PlacementQuiz {
  const id = courseId && questionsByCourse[courseId] ? courseId : 'ap-biology';
  return { courseId: id, intro: quizIntros[id], questions: questionsByCourse[id] };
}

/** Deterministic shuffle — the same stop asks the same questions every time. */
function shuffleBy<T>(items: T[], key: string): T[] {
  let a = ([...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) * 2654435761) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Select this stop’s unit first, then previously introduced units if needed. */
export function questionsForStop(
  courseId: string | null,
  unit: number,
  count: number,
  key: string,
): PlacementQuestion[] {
  const all = getPlacementQuiz(courseId).questions;
  const id = getPlacementQuiz(courseId).courseId;
  const apUnit = bossUnitIndex(id, key);
  if (apUnit !== null) {
    const areas = frameworkFor(id).units[apUnit].areas;
    const order = gameAreaOrder(id);
    const introduced = order.slice(0, order.indexOf(unit) + 1);
    return shuffleBy(all.filter(question => question.unit !== undefined && introduced.includes(question.unit) && (question.frameworkUnit === apUnit || (question.frameworkUnit === undefined && areas.includes(question.unit)))), key).slice(0, count);
  }
  const unitBank = all.filter((q) => q.unit === unit);
  const stage = key.match(/-s(\d+)-(lesson|drill|study|bonus|boss)$/);
  const tags = [...new Set(unitBank.map((question) => question.skillTag))];
  const focus = stage?.[2] === 'lesson' ? tags[(Number(stage[1]) - 1) % tags.length] : undefined;
  const own = focus
    ? [...shuffleBy(unitBank.filter((q) => q.skillTag === focus), key), ...shuffleBy(unitBank.filter((q) => q.skillTag !== focus), key)]
    : shuffleBy(unitBank, key);
  const order = gameAreaOrder(id);
  const previous = order.slice(0, order.indexOf(unit));
  const rest = shuffleBy(all.filter((q) => q.unit !== undefined && previous.includes(q.unit)), key);
  return [...own, ...rest].slice(0, drillSize(courseId, count));
}

/**
 * The questions a topic drill should ask.
 *
 * Every "Drill this" button in the app names a topic — "Water and bonding, 6
 * questions" — and until now the quiz behind it drew from the whole course at
 * random. The button was telling the truth about what it had noticed and a lie
 * about what it was going to do, which is the worse half to get wrong: a
 * student drilling their weakest topic and being asked about something else
 * has no way to tell the recommendation was ever real.
 *
 * Topic drills stay on-topic. Their count is bounded by the matching bank,
 * so an unrelated tail cannot dilute the skill the student chose to review.
 */
export function questionsForSkills(
  courseId: string | null,
  tags: string[],
  count: number,
  key: string,
): PlacementQuestion[] {
  const all = getPlacementQuiz(courseId).questions;
  const wanted = new Set(tags);
  const own = shuffleBy(all.filter((q) => wanted.has(q.skillTag)), key);
  return own.slice(0, drillSize(courseId, count));
}

/**
 * Every skill tag this course actually asks about, in unit order.
 *
 * The unit outlines in `courseUnits.ts` and the tags on the questions are two
 * different vocabularies for the same syllabus — the outline says "Moles and
 * molar mass" where the bank says "Moles". Anything that means to *drill* a
 * topic has to speak the bank's vocabulary, or it selects nothing and quietly
 * falls back to the whole course. The outline stays the right source for prose
 * on the map; this is the right one for a filter.
 */
export function skillTagsFor(courseId: string | null): string[] {
  const seen = new Set<string>();
  for (const q of getPlacementQuiz(courseId).questions) seen.add(q.skillTag);
  return [...seen];
}

/** How many questions in this course carry any of these tags. */
export function countForSkills(courseId: string | null, tags: string[]): number {
  const wanted = new Set(tags);
  return getPlacementQuiz(courseId).questions.filter((q) => wanted.has(q.skillTag)).length;
}

/**
 * The placement quiz samples across the whole course rather than running all
 * forty questions — it is meant to find a level, not to be the course.
 */
export function placementQuestions(courseId: string | null, count = 8): PlacementQuestion[] {
  const all = getPlacementQuiz(courseId).questions;
  const units = [...new Set(all.map((question) => question.unit).filter((unit): unit is number => unit !== undefined))].sort((a, b) => a - b);
  // The final area teaches test-taking habits; those do not measure subject knowledge.
  const learningUnits = units.slice(0, -1);
  const size = drillSize(courseId, count);
  const difficulty = ['foundation', 'developing', 'ap_ready', 'advanced'] as const;
  const out: PlacementQuestion[] = [];
  for (let i = 0; i < size; i += 1) {
    const unit = learningUnits[Math.round((i % learningUnits.length) * (learningUnits.length - 1) / Math.max(1, Math.min(size, learningUnits.length) - 1))];
    const available = all.filter((question) => question.unit === unit && !out.includes(question));
    const question = available.find((candidate) => candidate.difficulty === difficulty[i % difficulty.length])
      ?? available[0] ?? all.find((candidate) => !out.includes(candidate));
    if (question) out.push(question);
  }
  return out;
}

/**
 * How many questions a session can actually run for this course.
 *
 * The quiz engine draws from a fixed bank and silently clamps to its length,
 * so anything that *displays* a count has to clamp with it. Otherwise a card
 * offering twelve questions opens a quiz that says "1 / 8", and the number the
 * student was shown was never true.
 */
export function drillSize(courseId: string | null, wanted: number): number {
  return Math.max(1, Math.min(Number.isFinite(wanted) ? Math.floor(wanted) : 5, getPlacementQuiz(courseId).questions.length));
}
