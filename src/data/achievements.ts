import type { MascotPose } from '@/components/Mascot';
import type { QuestMap } from '@/types/quest';
import type { SkillTally } from '@/state/QuestContext';

/**
 * Achievements, computed from what the student has actually done.
 *
 * These were three fixed rows — "Boss Hunter III, 3/3" showed complete to
 * someone who had never answered a question. Every one is now derived, and
 * every one names a target the student can work towards rather than a number
 * that never moves.
 *
 * Ordered so the closest-to-done sits first: a list led by something four
 * fifths finished reads as progress, one led by a locked 0/50 reads as a wall.
 */

export interface AchievementState {
  completed: string[];
  map: QuestMap;
  skills: SkillTally;
  sessions: number;
  perfectSessions: number;
  bestStreak: number;
  xp: number;
}

export interface Achievement {
  id: string;
  name: string;
  note: string;
  art: MascotPose;
  have: number;
  need: number;
}

/** A skill counts as mastered at 80% over a meaningful number of attempts. */
const MASTERY_PCT = 80;
const MASTERY_MIN = 5;

export function achievementsFor(s: AchievementState): Achievement[] {
  const done = new Set(s.completed);
  const bosses = s.map.units.flatMap((u) => u.nodes.filter((n) => n.kind === 'boss'));
  const bossesBeaten = bosses.filter((b) => done.has(b.id)).length;

  const mastered = Object.values(s.skills).filter(
    (t) => t.seen >= MASTERY_MIN && (t.correct / t.seen) * 100 >= MASTERY_PCT,
  ).length;

  const tracksCleared = s.map.units.filter((u) => u.nodes.every((n) => done.has(n.id))).length;

  const all: Achievement[] = [
    {
      id: 'first-steps',
      name: 'First Steps',
      note: 'Clear five levels',
      art: 'wave',
      have: s.completed.length,
      need: 5,
    },
    {
      id: 'boss-hunter',
      name: 'Boss Hunter',
      note: 'Beat three bosses',
      art: 'trophy',
      have: bossesBeaten,
      need: 3,
    },
    {
      id: 'flawless',
      name: 'Flawless',
      note: 'Finish a session with nothing wrong',
      art: 'proud',
      have: s.perfectSessions,
      need: 1,
    },
    {
      id: 'specialist',
      name: 'Specialist',
      note: `Reach ${MASTERY_PCT}% on three categories`,
      art: 'thinking',
      have: mastered,
      need: 3,
    },
    {
      id: 'regular',
      name: 'Regular',
      note: 'Reach a seven-day streak',
      art: 'streakOn',
      have: s.bestStreak,
      need: 7,
    },
    {
      id: 'cartographer',
      name: 'Cartographer',
      note: 'Finish all levels in one area',
      art: 'map',
      have: tracksCleared,
      need: 1,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      note: 'Earn 1,000 XP',
      art: 'reading',
      have: s.xp,
      need: 1000,
    },
    {
      id: 'committed',
      name: 'Committed',
      note: 'Finish twenty-five sessions',
      art: 'excited',
      have: s.sessions,
      need: 25,
    },
  ];

  return all.sort((a, b) => ratio(b) - ratio(a));
}

/** Progress toward the target, capped so finished ones do not out-sort. */
function ratio(a: Achievement): number {
  return Math.min(1, a.have / a.need);
}

export const isEarned = (a: Achievement): boolean => a.have >= a.need;
