import { bossForNode } from './bosses';
import type { AccentName } from '@/theme';
import { trackAt, tracksFor, type TrackTheme } from './tracks';
import type { BossTier, QuestMap, QuestNode, QuestNodeKindId, QuestUnit } from '@/types/quest';
import type { CourseCategory, PlacementLevelId } from '@/types';
import { apCourses } from './apCourses';
import { COURSE_UNITS, DEFAULT_UNITS, type UnitSpec } from './courseUnits';
import { getPlacementQuiz, questionsForStop } from './placementQuestions';
import { bossUnitIndex, gameAreaOrder, officialUnitForArea } from './courseFrameworks';

/**
 * Builds the quest map for a course.
 *
 * Every course is ten *areas*, and every area is six stages. A stage is always
 * the same three beats — learn it, work it, then fight for it — so an area ends
 * up with six lessons, six support stops, and six bosses. The trail *shape* is
 * identical everywhere; only the subject topics and the landscape change, which
 * is why the map can cover eight courses without eight hand-built layouts.
 *
 * Practice ordering follows official AP units while preserving saved IDs. The game
 * difficulty label ramps on two axes: across the ten areas, and again across
 * the six stages inside each one. The last boss of area 10 is the hardest thing
 * on the map by a wide margin.
 */

const STAGES_PER_UNIT = 6;

/** The support stop that sits between each lesson and its boss. */
const SUPPORT_CYCLE: QuestNodeKindId[] = ['drill', 'study', 'drill', 'bonus', 'study', 'drill'];

/**
 * The six checks at the end of an area, easiest first. The sixth opens the
 * next area. The sixth boss in each official unit’s final area is that unit’s boss.
 * Smaller boss battles remain along the route.
 */
export const BOSS_TIERS = ['Warm-up', 'Quick check', 'Challenge', 'Deep dive', 'Big review', 'Final check'] as const;

/** The "study a source" stop is named for how the subject actually reads. */
const READING_BY_CATEGORY: Record<CourseCategory, { title: string; summary: string }> = {
  stem: { title: 'Knowledge check', summary: 'Apply the ideas from this study unit and review the reasoning behind each answer.' },
  history: { title: 'Knowledge check', summary: 'Connect the ideas from this study unit and review the reasoning behind each answer.' },
  english: { title: 'Knowledge check', summary: 'Practice the reading and writing concepts in this study unit.' },
};

const BASE_XP: Record<QuestNodeKindId, number> = { lesson: 20, drill: 25, study: 25, bonus: 15, boss: 60 };
const BASE_MINUTES: Record<QuestNodeKindId, number> = { lesson: 5, drill: 7, study: 8, bonus: 3, boss: 12 };

/** Rounds to the nearest 5 so reward numbers stay readable. */
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

const clampDifficulty = (n: number) => Math.min(10, Math.max(1, Math.round(n)));

/**
 * How hard a stop should feel, 1–10, from its position on the whole map.
 * Both the area index and the stage inside it push it up.
 */
function difficultyFor(unitIndex: number, stage: number, kind: QuestNodeKindId): number {
  const base = 1 + unitIndex * 0.85 + (stage - 1) * 0.3;
  return clampDifficulty(kind === 'boss' ? base + 0.8 : base);
}

/** How many questions a stop is worth. Bosses grow with their rank. */
export function questionCountFor(node: QuestNode): number {
  const requested = node.kind === 'boss' ? 6 + (node.tier ?? 1) : node.kind === 'bonus' ? 4 : node.kind === 'drill' ? 6 : 5;
  const match = node.id.match(/^(.*)-u(\d+)-s\d+-/);
  if (!match) return requested;
  return questionsForStop(match[1], Number(match[2]) - 1, requested, node.id).length;
}

function buildStage(
  courseId: string,
  category: CourseCategory,
  track: TrackTheme,
  unitIndex: number,
  spec: UnitSpec,
  stage: number,
): QuestNode[] {
  const unitSkills = [...new Set(getPlacementQuiz(courseId).questions.filter((question) => question.unit === unitIndex).map((question) => question.skillTag))];
  const topic = unitSkills[(stage - 1) % unitSkills.length] ?? spec.topics[stage - 1];
  const area = track.place;
  const tier = stage as BossTier;
  const idBase = `${courseId}-u${unitIndex + 1}-s${stage}`;
  const xpScale = 1 + unitIndex * 0.12;

  const lesson: QuestNode = {
    id: `${idBase}-lesson`,
    kind: 'lesson',
    title: topic,
    // Topics lead the sentence rather than being lowercased into it — half of
    // them are proper nouns ("Song China", "DNA structure", "Hess's law").
    summary: `Review ${topic} and related ideas in ${spec.title}, then put them into practice. Get 60% correct to clear this stop.`,
    skills: [topic, ...unitSkills.filter((skill) => skill !== topic).slice(0, 2)],
    xp: round5(BASE_XP.lesson * xpScale),
    minutes: BASE_MINUTES.lesson,
    stage,
    difficulty: difficultyFor(unitIndex, stage, 'lesson'),
  };

  const supportKind = SUPPORT_CYCLE[(stage - 1) % SUPPORT_CYCLE.length];
  const reading = READING_BY_CATEGORY[category];
  const support: QuestNode = {
    id: `${idBase}-${supportKind}`,
    kind: supportKind,
    title:
      supportKind === 'drill' ? 'Skill drill' : supportKind === 'study' ? reading.title : 'Bonus cache',
    summary:
      supportKind === 'drill'
        ? `Mixed practice from ${spec.title}. Get 60% correct to clear this stop.`
        : supportKind === 'study'
          ? reading.summary
          : 'A short bonus round off the main trail. Clear it for extra XP.',
    skills: unitSkills.slice(0, 6),
    xp: round5(BASE_XP[supportKind] * xpScale),
    minutes: BASE_MINUTES[supportKind],
    stage,
    difficulty: difficultyFor(unitIndex, stage, supportKind),
  };

  const isFinal = stage === STAGES_PER_UNIT;
  const unitBoss = bossUnitIndex(courseId, idBase + '-boss') !== null;
  const boss: QuestNode = {
    id: `${idBase}-boss`,
    kind: 'boss',
    tier,
    apUnit: officialUnitForArea(courseId, unitIndex) ?? undefined,
    unitBoss,
    title: bossForNode(`${idBase}-boss`)?.name ?? `${BOSS_TIERS[stage - 1]} of ${area}`,
    summary: isFinal
      ? `The area boss — questions from ${spec.title} and earlier study units. Get 60% correct to open the next area.`
      : `A challenge on ${spec.title} and earlier study units. Get 60% correct to move deeper into ${area}.`,
    skills: unitSkills.slice(0, 6),
    xp: round5((BASE_XP.boss + tier * 10 + unitIndex * 8) * (isFinal ? 1.25 : 1)),
    minutes: BASE_MINUTES.boss + tier,
    stage,
    difficulty: difficultyFor(unitIndex, stage, 'boss'),
  };

  return [lesson, support, boss];
}

function buildUnit(
  courseId: string,
  category: CourseCategory,
  accent: AccentName,
  spec: UnitSpec,
  track: TrackTheme,
  index: number,
): QuestUnit {
  const nodes = Array.from({ length: STAGES_PER_UNIT }, (_, i) =>
    buildStage(courseId, category, track, index, spec, i + 1),
  ).flat();

  return {
    id: `${courseId}-u${index + 1}`,
    section: `Track ${index + 1}`,
    unit: `Unit ${index + 1}`,
    title: spec.title,
    blurb: spec.blurb,
    accent,
    track,
    areaName: track.place,
    index,
    nodes,
  };
}

/** Build the full quest map for a course. Falls back to AP Biology. */
export function getQuestMap(courseId: string | null): QuestMap {
  const course = apCourses.find((c) => c.id === courseId) ?? apCourses[0];
  const specs = COURSE_UNITS[course.id] ?? DEFAULT_UNITS;
  const route = tracksFor(course.id);

  const units = specs.map((spec, i) =>
    buildUnit(course.id, course.category, course.accent, spec, route[i % route.length], i),
  );

  // Reorder the path into official AP units without changing any saved stop ID.
  return { courseId: course.id, units, order: gameAreaOrder(course.id).flatMap(index => units[index]?.nodes.map(node => node.id) ?? []) };
}

/** Stops in one area — a lesson, a support stop and a boss per stage. */
export const STOPS_PER_UNIT = STAGES_PER_UNIT * 3;
const NODES_PER_UNIT = STOPS_PER_UNIT;

/**
 * How far into the map a placement result drops the student. Passing at a
 * higher level should visibly skip ground, so the map opens on a trail that
 * already has areas behind it rather than a few stops.
 */
const HEAD_START: Record<PlacementLevelId, number> = {
  beginner: 0,
  builder: Math.round(NODES_PER_UNIT * 0.5),
  ap_ready: NODES_PER_UNIT * 2,
  advanced_review: NODES_PER_UNIT * 4,
};

export function headStartFor(level: PlacementLevelId | null): number {
  return level ? HEAD_START[level] : 0;
}

/** Look up a node (and the area it belongs to) anywhere in a map. */
export function findNode(map: QuestMap, nodeId: string): { unit: QuestUnit; node: QuestNode } | undefined {
  for (const unit of map.units) {
    const node = unit.nodes.find((n) => n.id === nodeId);
    if (node) return { unit, node };
  }
  return undefined;
}
