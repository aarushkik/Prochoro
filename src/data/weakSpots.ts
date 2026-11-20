import { countForSkills, skillTagsFor } from './placementQuestions';
import type { SkillTally } from '@/state/QuestContext';

/**
 * What a student is worst at, from what they have actually answered.
 *
 * This replaced a hard-coded trio of AP Biology topics that every course
 * showed — a Calculus student was told to drill Photosynthesis. Accuracy is
 * now read from the real per-skill tally.
 *
 * Ranking is by a *smoothed* score rather than raw accuracy. Raw accuracy
 * makes one wrong answer out of one attempt a 0%, which would sit at the top
 * of the list forever on the strength of a single tap, above a topic genuinely
 * missed nine times out of ten. Adding one notional right and one notional
 * wrong answer to every tally (Laplace) pulls thin evidence towards the middle:
 * 0-from-1 scores 33% and 0-from-10 scores 8%, so the topic with real evidence
 * against it wins. The percentage *shown* is always the true one.
 *
 * An earlier version simply required three attempts before a skill could
 * appear, which meant the list stayed on its fallback for several sessions.
 */
function smoothed(correct: number, seen: number): number {
  return (correct + 1) / (seen + 2);
}

/**
 * How long the drill for one topic should be.
 *
 * Sized to the bank rather than fixed at six. A tag the course only asks twice
 * about would spend two thirds of a six-question drill on other topics, which
 * is how the button ends up not doing what its label says. Three is the floor
 * because a two-question session is not a drill.
 */
function drillLength(courseId: string | null, tag: string): number {
  return Math.min(8, countForSkills(courseId, [tag]));
}

export interface WeakSpot {
  name: string;
  /** Accuracy as a whole percentage. */
  pct: number;
  /** How many have been answered, for the supporting line. */
  seen: number;
  wrong: number;
  /** Suggested drill length. */
  count: number;
}

export function weakSpots(skills: SkillTally, courseId: string | null, limit = 3): WeakSpot[] {
  const ranked = Object.entries(skills)
    .filter(([, s]) => s.seen > 0 && s.correct < s.seen)
    .map(([name, s]) => ({
      name,
      pct: Math.round((s.correct / s.seen) * 100),
      seen: s.seen,
      wrong: s.seen - s.correct,
      count: drillLength(courseId, name),
      rank: smoothed(s.correct, s.seen),
    }))
    .sort((a, b) => a.rank - b.rank || b.seen - a.seen)
    .map(({ rank: _rank, ...s }) => s);

  if (ranked.length > 0) return ranked.slice(0, limit);

  // With no mistakes, suggest untried topics first; retain real accuracy
  // when revisiting a topic that has already been answered perfectly.
  return skillTagsFor(courseId)
    .sort((a, b) => (skills[a]?.seen ?? 0) - (skills[b]?.seen ?? 0))
    .slice(0, limit)
    .map((name) => {
      const tally = skills[name];
      const seen = tally?.seen ?? 0;
      return { name, pct: seen ? Math.round(tally.correct / seen * 100) : -1,
        seen, wrong: seen - (tally?.correct ?? 0), count: drillLength(courseId, name) };
    });
}
