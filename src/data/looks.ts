import { apCourses } from './apCourses';
import { frameworkFor } from './courseFrameworks';
import { getQuestMap } from './questMap';

/**
 * Hats the platypus can wear.
 *
 * Purely for fun: a hat never changes how a lesson is asked or scored. Each is
 * earned by studying, so there is nothing to buy and nothing to manage. The
 * IDs are saved in profiles (`equipped_companion`), so keep them stable.
 */
export interface Look {
  id: string;
  name: string;
  /** Null for the bare head, which everyone has. */
  unlock: { measure: keyof LookProgress; need: number; label: string } | null;
}

/** Everything an unlock is allowed to look at, across every course. */
export interface LookProgress {
  sessions: number;
  perfectSessions: number;
  bestStreak: number;
  unitsDone: number;
  bossesBeaten: number;
}

export interface LookStatus extends Look {
  owned: boolean;
  have: number;
  need: number;
}

export const NO_LOOK = 'none';

export const LOOKS: Look[] = [
  { id: NO_LOOK, name: 'No hat', unlock: null },
  { id: 'grad-cap', name: 'Grad cap', unlock: { measure: 'sessions', need: 1, label: 'Finish a lesson' } },
  { id: 'beanie', name: 'Beanie', unlock: { measure: 'sessions', need: 5, label: 'Finish 5 lessons' } },
  { id: 'party-hat', name: 'Party hat', unlock: { measure: 'perfectSessions', need: 1, label: 'Get a lesson all right' } },
  { id: 'top-hat', name: 'Top hat', unlock: { measure: 'bestStreak', need: 3, label: 'Study 3 days in a row' } },
  { id: 'explorer', name: 'Explorer hat', unlock: { measure: 'unitsDone', need: 1, label: 'Finish a unit' } },
  { id: 'flower-crown', name: 'Flower crown', unlock: { measure: 'sessions', need: 20, label: 'Finish 20 lessons' } },
  { id: 'crown', name: 'Crown', unlock: { measure: 'bossesBeaten', need: 5, label: 'Beat 5 bosses' } },
  { id: 'wizard', name: 'Wizard hat', unlock: { measure: 'bestStreak', need: 7, label: 'Study 7 days in a row' } },
];

export const lookById = (id: string | null | undefined): Look | undefined => LOOKS.find((look) => look.id === id);

/** Where this student stands with every hat. */
export function looksFor(progress: LookProgress): LookStatus[] {
  return LOOKS.map((look) => {
    if (!look.unlock) return { ...look, owned: true, have: 0, need: 0 };
    const have = Math.max(0, Math.floor(progress[look.unlock.measure] || 0));
    return { ...look, owned: have >= look.unlock.need, have: Math.min(have, look.unlock.need), need: look.unlock.need };
  });
}

/**
 * Units finished and bosses beaten in every course, from the stops actually
 * played. Counting every course means switching subject never takes a hat away.
 */
export function courseProgressFor(earned: string[]): Pick<LookProgress, 'unitsDone' | 'bossesBeaten'> {
  const done = new Set(earned);
  let unitsDone = 0;
  let bossesBeaten = 0;
  for (const course of apCourses) {
    const map = getQuestMap(course.id);
    for (const unit of frameworkFor(course.id).units) {
      const nodes = unit.areas.flatMap((area) => map.units[area]?.nodes ?? []);
      if (nodes.length && nodes.every((node) => done.has(node.id))) unitsDone += 1;
    }
    bossesBeaten += map.units.flatMap((unit) => unit.nodes).filter((node) => node.kind === 'boss' && done.has(node.id)).length;
  }
  return { unitsDone, bossesBeaten };
}
