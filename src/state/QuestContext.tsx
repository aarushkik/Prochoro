import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { findNode, getQuestMap, headStartFor, questionCountFor } from '@/data/questMap';
import { apCourses } from '@/data/apCourses';
import { courseProgressFor, looksFor, NO_LOOK, type LookStatus } from '@/data/looks';
import { WornLookContext } from '@/components/Mascot/WornLook';
import { todayKey, visibleStreak } from '@/utils/studyDates';
import { bankSession, emptyProgress, nonnegativeInteger, sanitizeSkills, sessionClearsStop, type AnswerOutcome, type QuestProgress, type SkillTally } from '@/utils/questProgress';
import type { QuestMap, QuestNodeState } from '@/types/quest';
import { useOnboarding } from './OnboardingContext';

export type { AnswerOutcome, SkillTally } from '@/utils/questProgress';

/** Everything ProfileSync can restore; missing fields retain their values. */
export interface QuestHydration {
  xp?: number;
  gems?: number;
  streakDays?: number;
  completedStops?: string[];
  lastSessionOn?: string | null;
  todayCount?: number;
  skills?: SkillTally;
  sessions?: number;
  perfectSessions?: number;
  bestStreak?: number;
  /** The hat being worn; stored in the profile's old companion field. */
  equippedId?: string | null;
  streakShieldUsed?: boolean;
}

interface QuestContextValue {
  map: QuestMap;
  /** Placement head start plus played stops, for path navigation only. */
  completed: string[];
  /** Actually played and passed stops, for persistence and achievements. */
  earned: string[];
  currentNodeId: string | null;
  stateOf: (nodeId: string) => QuestNodeState;
  xp: number;
  gems: number;
  streakDays: number;
  /** The streak counter as saved at the last session. */
  storedStreakDays: number;
  todayCount: number;
  /** Count associated with lastSessionOn; display-only midnight resets are not persisted. */
  storedTodayCount: number;
  dailyGoal: number;
  /** Bank once per quiz route. Empty attempts and locked stops are rejected. */
  recordSession: (earnedXp: number, nodeId?: string, answers?: AnswerOutcome[], sessionId?: string) => boolean;
  skills: SkillTally;
  sessions: number;
  perfectSessions: number;
  bestStreak: number;
  lastSessionOn: string | null;
  /** Every hat, and whether this student has earned it yet. */
  looks: LookStatus[];
  /** The hat being worn, or `none`. */
  lookId: string;
  wear: (id: string) => void;
  /** Kept only so synced profiles round-trip; nothing sets it any more. */
  streakShieldUsed: boolean;
  hydrate: (next: QuestHydration) => void;
  reset: () => void;
}

const QuestContext = createContext<QuestContextValue | null>(null);
const validStops = new Set(apCourses.flatMap((course) => getQuestMap(course.id).order));

export function QuestProvider({ children }: { children: React.ReactNode }) {
  const { courseId, placementLevelId } = useOnboarding();
  const map = useMemo(() => getQuestMap(courseId), [courseId]);
  const seeded = useMemo(() => map.order.slice(0, headStartFor(placementLevelId)), [map, placementLevelId]);
  const [progress, setProgress] = useState<QuestProgress>(emptyProgress);
  // Updated atomically during events, never inside a React updater/render.
  const progressRef = useRef(progress);
  const bankedSessions = useRef(new Set<string>());
  const [lookRaw, setLookRaw] = useState(NO_LOOK);
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setToday(todayKey());
      clearTimeout(timer);
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 100);
      timer = setTimeout(refresh, Math.max(100, midnight.getTime() - Date.now()));
    };
    refresh();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);

  const commit = useCallback((next: QuestProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);
  const completed = useMemo(() => {
    const ownIds = new Set(map.order);
    return [...new Set([...seeded, ...progress.earned.filter((id) => ownIds.has(id))])];
  }, [seeded, progress.earned, map]);
  const completedSet = useMemo(() => new Set(completed), [completed]);
  const currentNodeId = map.order.find((id) => !completedSet.has(id)) ?? null;
  const courseProgress = useMemo(() => courseProgressFor(progress.earned), [progress.earned]);
  const looks = useMemo(() => looksFor({
    sessions: progress.sessions, perfectSessions: progress.perfectSessions, bestStreak: progress.bestStreak, ...courseProgress,
  }), [progress.sessions, progress.perfectSessions, progress.bestStreak, courseProgress]);
  // A saved ID that is not an earned hat (an old pet, say) shows no hat.
  const lookId = looks.some((look) => look.id === lookRaw && look.owned) ? lookRaw : NO_LOOK;
  const wear = useCallback((id: string) => {
    if (looks.some((look) => look.id === id && look.owned)) setLookRaw(id);
  }, [looks]);
  const streakDays = visibleStreak(progress.streakDays, progress.lastSessionOn, today, 0);
  const todayCount = progress.lastSessionOn === today ? progress.todayCount : 0;
  const stateOf = useCallback((nodeId: string): QuestNodeState =>
    completedSet.has(nodeId) ? 'complete' : nodeId === currentNodeId ? 'current' : 'locked',
  [completedSet, currentNodeId]);

  const recordSession = useCallback((earnedXp: number, nodeId?: string, answers: AnswerOutcome[] = [], sessionId?: string) => {
    if (!answers.length || !Number.isFinite(earnedXp) || earnedXp < 0 || (sessionId && bankedSessions.current.has(sessionId))) return false;
    const previous = progressRef.current;
    let clearedNodeId: string | undefined;
    if (nodeId) {
      const stop = findNode(map, nodeId);
      if (!stop) return false;
      const liveCompleted = new Set([...seeded, ...previous.earned]);
      const liveCurrent = map.order.find((id) => !liveCompleted.has(id));
      if (nodeId !== liveCurrent && !liveCompleted.has(nodeId)) return false;
      if (sessionClearsStop(answers, questionCountFor(stop.node))) clearedNodeId = nodeId;
    }
    if (sessionId) bankedSessions.current.add(sessionId);
    const day = todayKey();
    setToday(day);
    commit(bankSession(previous, { xp: earnedXp, answers, today: day, clearedNodeId }));
    return true;
  }, [map, seeded, commit]);

  const hydrate = useCallback((next: QuestHydration) => {
    const restored = { ...progressRef.current };
    for (const key of ['xp', 'gems', 'streakDays', 'todayCount', 'sessions', 'perfectSessions', 'bestStreak'] as const) {
      if (next[key] !== undefined) restored[key] = nonnegativeInteger(next[key]);
    }
    if (next.completedStops !== undefined) restored.earned = [...new Set(next.completedStops.filter((id) => validStops.has(id)))];
    if (next.lastSessionOn !== undefined) restored.lastSessionOn = next.lastSessionOn;
    if (next.skills !== undefined) restored.skills = sanitizeSkills(next.skills);
    if (next.streakShieldUsed !== undefined) restored.streakShieldUsed = Boolean(next.streakShieldUsed);
    restored.perfectSessions = Math.min(restored.sessions, restored.perfectSessions);
    restored.bestStreak = Math.max(restored.bestStreak, restored.streakDays);
    if (next.equippedId !== undefined) setLookRaw(next.equippedId ?? NO_LOOK);
    commit(restored);
  }, [commit]);

  const reset = useCallback(() => {
    bankedSessions.current.clear();
    setLookRaw(NO_LOOK);
    commit(emptyProgress());
  }, [commit]);

  const value = useMemo<QuestContextValue>(() => ({
    map, completed, currentNodeId, stateOf,
    ...progress, streakDays, storedStreakDays: progress.streakDays, storedTodayCount: progress.todayCount, todayCount, dailyGoal: 3,
    looks, lookId, wear, recordSession, hydrate, reset,
  }), [map, completed, progress, currentNodeId, stateOf, streakDays, todayCount, looks, lookId, wear, recordSession, hydrate, reset]);
  return <QuestContext.Provider value={value}><WornLookContext.Provider value={lookId === NO_LOOK ? null : lookId}>{children}</WornLookContext.Provider></QuestContext.Provider>;
}

export function useQuest(): QuestContextValue {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuest must be used within a QuestProvider');
  return context;
}
