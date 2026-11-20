import { daysBetween, nextStreak } from './studyDates';

export interface AnswerOutcome { skillTag: string; correct: boolean }
export type SkillTally = Record<string, { seen: number; correct: number }>;

export interface QuestProgress {
  earned: string[];
  xp: number;
  gems: number;
  streakDays: number;
  lastSessionOn: string | null;
  todayCount: number;
  skills: SkillTally;
  sessions: number;
  perfectSessions: number;
  bestStreak: number;
  streakShieldUsed: boolean;
}

export function emptyProgress(): QuestProgress {
  return { earned: [], xp: 0, gems: 0, streakDays: 0, lastSessionOn: null, todayCount: 0,
    skills: {}, sessions: 0, perfectSessions: 0, bestStreak: 0, streakShieldUsed: false };
}

export const PASS_ACCURACY = 0.6;

export function sessionClearsStop(answers: AnswerOutcome[], requiredQuestions: number): boolean {
  return answers.length >= requiredQuestions && answers.length > 0 &&
    answers.filter((answer) => answer.correct).length / answers.length >= PASS_ACCURACY;
}

export function nonnegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function sanitizeSkills(value: SkillTally): SkillTally {
  const result: SkillTally = {};
  for (const [key, tally] of Object.entries(value ?? {})) {
    if (!key.trim() || !tally || typeof tally !== 'object' || ['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    const seen = nonnegativeInteger(tally.seen);
    result[key] = { seen, correct: Math.min(seen, nonnegativeInteger(tally.correct)) };
  }
  return result;
}

/** One pure, atomic transaction; React may render a state update more than once. */
export function bankSession(previous: QuestProgress, input: {
  xp: number;
  answers: AnswerOutcome[];
  today: string;
  clearedNodeId?: string;
}): QuestProgress {
  if (!input.answers.length || !Number.isFinite(input.xp) || input.xp < 0) return previous;
  const gap = daysBetween(previous.lastSessionOn, input.today);
  const streakDays = nextStreak(previous.streakDays, previous.lastSessionOn, input.today, 0);
  // Preserve the latest date when a timezone change moves the clock backwards.
  const day = gap !== null && gap < 0 ? previous.lastSessionOn! : input.today;
  const skills = { ...previous.skills };
  for (const answer of input.answers) {
    if (['__proto__', 'constructor', 'prototype'].includes(answer.skillTag)) continue;
    const tally = skills[answer.skillTag] ?? { seen: 0, correct: 0 };
    skills[answer.skillTag] = { seen: tally.seen + 1, correct: tally.correct + (answer.correct ? 1 : 0) };
  }
  return {
    ...previous,
    earned: input.clearedNodeId && !previous.earned.includes(input.clearedNodeId)
      ? [...previous.earned, input.clearedNodeId] : previous.earned,
    xp: previous.xp + Math.round(input.xp),
    gems: previous.gems + 1,
    sessions: previous.sessions + 1,
    perfectSessions: previous.perfectSessions + (input.answers.every((answer) => answer.correct) ? 1 : 0),
    todayCount: (previous.lastSessionOn === day ? previous.todayCount : 0) + 1,
    lastSessionOn: day,
    streakDays,
    bestStreak: Math.max(previous.bestStreak, streakDays),
    skills,
  };
}
