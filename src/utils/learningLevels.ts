import type { QuestMap } from '@/types/quest';

/** One course level per saved stop. XP remains a reward, never a second rank. */
export function levelNumber(map: QuestMap, nodeId?: string | null): number | null {
  if (!nodeId) return null;
  const index = map.order.indexOf(nodeId);
  return index < 0 ? null : index + 1;
}

export function learningLevels(map: QuestMap, completed: readonly string[]) {
  const done = new Set(completed);
  const nextId = map.order.find(id => !done.has(id)) ?? null;
  return { nextId, next: levelNumber(map, nextId), total: map.order.length,
    cleared: map.order.filter(id => done.has(id)).length, finished: nextId === null };
}
