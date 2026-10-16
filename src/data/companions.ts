import { palette } from '@/theme';
import type { QuestMap } from '@/types/quest';
import type { SkillTally } from '@/state/QuestContext';

/**
 * Study buddies with real session effects and progress-based unlocks.
 * Display names and artwork can change; IDs must remain stable because saved
 * profiles store the equipped companion ID.
 */

/** What an equipped companion changes. Each one is read somewhere real. */
export type CompanionEffect =
  /** Reveal the explanation before answering, once per session. */
  | 'hint'
  /** Strike out one wrong option, once per session. */
  | 'eliminate'
  /** One second attempt after a wrong answer. */
  | 'retry'
  /** Ask everything missed again at the end of the session. */
  | 'requeue'
  /** Double the gems a session pays. */
  | 'gems'
  /** +20% XP on off-map practice. */
  | 'xpDrill'
  /** +50% XP from a boss stop. */
  | 'xpBoss'
  /** Double XP for a session with nothing wrong. */
  | 'xpPerfect'
  /** Hold the streak through a missed day. */
  | 'shield';

/** Everything an unlock condition is allowed to look at. */
export interface CompanionState {
  completed: string[];
  map: QuestMap;
  skills: SkillTally;
  bestStreak: number;
  sessions: number;
}

interface Unlock {
  /** Shown on the locked card, and as the reason in the tap message. */
  label: string;
  /** Progress towards it. Owned once `have >= need`. */
  measure: (s: CompanionState) => { have: number; need: number };
}

export interface Companion {
  id: string;
  name: string;
  /** What it does in a session, in one line. */
  ability: string;
  /** Its colour on the roster tile. */
  tint: string;
  effect: CompanionEffect;
  /** How many missed days a shield covers. Only read for `shield`. */
  shieldDays?: number;
  /** Null for the starter set, which is owned from the first session. */
  unlock: Unlock | null;
}

/** A companion plus where this student stands with it. */
export interface CompanionStatus extends Companion {
  owned: boolean;
  /** Progress towards the unlock. Both 0 for the starter set. */
  have: number;
  need: number;
}



/** A skill counts as mastered at 80% over a meaningful number of attempts. */
const MASTERY_PCT = 80;
const MASTERY_MIN = 5;

const bossesBeaten = (s: CompanionState): number => {
  const done = new Set(s.completed);
  return s.map.units.flatMap((u) => u.nodes.filter((n) => n.kind === 'boss')).filter((b) => done.has(b.id))
    .length;
};

const tracksCleared = (s: CompanionState): number => {
  const done = new Set(s.completed);
  return s.map.units.filter((u) => u.nodes.every((n) => done.has(n.id))).length;
};

const mastered = (s: CompanionState): number =>
  Object.values(s.skills).filter((t) => t.seen >= MASTERY_MIN && (t.correct / t.seen) * 100 >= MASTERY_PCT)
    .length;

export const COMPANIONS: Companion[] = [
  {
    id: 'mira',
    name: 'Ellie',
    ability: 'Reveals one hint per session',
    effect: 'hint',
    tint: palette.turquoise,
    unlock: null,
  },
  {
    id: 'ember',
    name: 'Buddy',
    ability: 'Shields a streak day',
    effect: 'shield',
    shieldDays: 1,
    tint: palette.orange,
    unlock: null,
  },
  {
    id: 'pilot',
    name: 'Penny',
    ability: 'Doubles the gems a session pays',
    effect: 'gems',
    tint: palette.turquoise,
    unlock: null,
  },
  {
    id: 'quill',
    name: 'Benny',
    ability: 'One retry per session',
    effect: 'retry',
    tint: palette.violet,
    unlock: null,
  },
  {
    id: 'cobalt',
    name: 'Stella',
    // Was "Freezes a boss timer once" — there is no boss timer to freeze.
    ability: 'Doubles XP for a flawless session',
    effect: 'xpPerfect',
    tint: palette.turquoise,
    unlock: { label: '14-day streak', measure: (s) => ({ have: s.bestStreak, need: 14 }) },
  },
  {
    id: 'marrow',
    name: 'Bruno',
    // Was "Skips one boss phase" — bosses do not have phases in this build.
    ability: '+50% XP from boss stops',
    effect: 'xpBoss',
    tint: palette.turquoise,
    unlock: { label: 'Beat 5 bosses', measure: (s) => ({ have: bossesBeaten(s), need: 5 }) },
  },
  {
    id: 'tessel',
    name: 'Toby',
    ability: '+20% XP on practice drills',
    effect: 'xpDrill',
    tint: palette.turquoise,
    unlock: { label: 'Master 3 categories', measure: (s) => ({ have: mastered(s), need: 3 }) },
  },
  {
    id: 'nix',
    name: 'Daisy',
    ability: 'Strikes out one wrong option',
    effect: 'eliminate',
    tint: palette.turquoise,
    unlock: { label: 'Clear 6 tracks', measure: (s) => ({ have: tracksCleared(s), need: 6 }) },
  },
  {
    id: 'fen',
    name: 'Oakley',
    ability: 'Shields two streak days',
    effect: 'shield',
    shieldDays: 2,
    tint: palette.turquoise,
    unlock: { label: '30-day streak', measure: (s) => ({ have: s.bestStreak, need: 30 }) },
  },
  {
    id: 'slate',
    name: 'Remy',
    ability: 'Re-asks anything you get wrong',
    effect: 'requeue',
    tint: palette.turquoise,
    unlock: { label: 'Clear 4 tracks', measure: (s) => ({ have: tracksCleared(s), need: 4 }) },
  },
  {
    id: 'vesper',
    name: 'Wally',
    ability: 'Doubles the gems a session pays',
    effect: 'gems',
    tint: palette.turquoise,
    unlock: { label: 'Finish 50 sessions', measure: (s) => ({ have: s.sessions, need: 50 }) },
  },
  {
    id: 'orrin',
    name: 'Leo',
    // Was "Starts every boss one phase down" — see Bruno.
    ability: '+50% XP from boss stops',
    effect: 'xpBoss',
    tint: palette.turquoise,
    unlock: { label: 'Beat 15 bosses', measure: (s) => ({ have: bossesBeaten(s), need: 15 }) },
  },
];

/** The starter set, owned from the first session. */
export const STARTER_COMPANION_ID = 'mira';

/**
 * The roster, with each companion's real standing.
 *
 * Sorted owned-first, then by how close the unlock is — so the next thing
 * within reach sits at the top of the locked half rather than wherever the
 * list happened to declare it.
 */
export function companionsFor(s: CompanionState): CompanionStatus[] {
  return COMPANIONS.map((c) => {
    if (!c.unlock) return { ...c, owned: true, have: 0, need: 0 };
    const { have, need } = c.unlock.measure(s);
    return { ...c, owned: have >= need, have, need };
  }).sort((a, b) => {
    if (a.owned !== b.owned) return a.owned ? -1 : 1;
    if (a.owned) return 0;
    return b.have / b.need - a.have / a.need;
  });
}

/** The line on a locked card: the condition, and how far along it is. */
export function unlockLabel(c: CompanionStatus): string {
  if (c.owned) return 'Owned';
  return c.unlock ? c.unlock.label : 'Locked';
}

export const companionById = (id: string | null): Companion | undefined =>
  COMPANIONS.find((c) => c.id === id);
