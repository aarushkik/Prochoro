import { deviceStorage } from './storage';

/**
 * The most floors climbed in the endless climb, per course, on this device.
 * A personal best rather than synced progress: losing it never costs a level.
 */
const key = (courseId: string | null) => `prochoro.climbBest2.${courseId ?? 'none'}`;

export async function readBestFloor(courseId: string | null): Promise<number> {
  try {
    const value = Number(await deviceStorage.getItem(key(courseId)));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}

/** Saves `floor` if it beats the current best; resolves to the best afterwards. */
export async function saveBestFloor(courseId: string | null, floor: number): Promise<number> {
  const best = await readBestFloor(courseId);
  if (floor <= best) return best;
  try { await deviceStorage.setItem(key(courseId), String(Math.floor(floor))); } catch { return best; }
  return Math.floor(floor);
}
