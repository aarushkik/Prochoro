import type { AccentName } from '@/theme';
import type { TrackTheme } from '@/data/tracks';

/**
 * The quest map: the course laid out as a walkable trail of areas.
 *
 * A unit is one *track* of the map, set in its own place. Each area is split
 * into six stages, and every stage ends in a boss — so a unit is a ladder of
 * six fights, not one. Node *kind* is about what the student does there (and
 * drives the art), while node *state* is derived from progress — see
 * `deriveNodeState`.
 */

/** What happens at a stop on the trail. */
export type QuestNodeKindId = 'lesson' | 'drill' | 'study' | 'bonus' | 'boss';

/** Where the student is relative to a node. Derived, never stored. */
export type QuestNodeState = 'locked' | 'current' | 'complete';

/**
 * Boss rank within an area, 1–6. The sixth is the area's own boss and is the
 * one that opens the next area; the first five are the climb to it.
 */
export type BossTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface QuestNode {
  id: string;
  kind: QuestNodeKindId;
  title: string;
  /** One line explaining what this stop covers, shown in the start sheet. */
  summary: string;
  /** Skills drilled here, shown as chips in the start sheet. */
  skills: string[];
  xp: number;
  minutes: number;
  /** Which of the area's six stages this stop belongs to, 1–6. */
  stage: number;
  /** Rank of the fight, on boss nodes only. */
  tier?: BossTier;
  /** Official AP unit, separate from the decorative game area. */
  apUnit?: number;
  unitBoss?: boolean;
  /** How hard this stop is meant to feel, 1–10. Drives question count. */
  difficulty: number;
}

export interface QuestUnit {
  id: string;
  /** e.g. "Area 3". */
  section: string;
  /** e.g. "Unit 3". */
  unit: string;
  title: string;
  /** Short flavor line under the unit title on the banner. */
  blurb: string;
  accent: AccentName;
  /** The place this track is set in — palette, skyline and name. */
  track: TrackTheme;
  /** The place's display name, e.g. "Furnace Foothills". */
  areaName: string;
  /** Zero-based position in the course. */
  index: number;
  nodes: QuestNode[];
}

export interface QuestMap {
  courseId: string;
  units: QuestUnit[];
  /** Flattened node ids in walking order — the map's spine. */
  order: string[];
}
