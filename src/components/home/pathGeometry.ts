/**
 * Where things sit on the learning path.
 *
 * The trail tiles are drawn for exactly these numbers
 * (`scripts/draw-path-art.py`), so the path never stretches a drawing: change
 * one here and re-run the script.
 */

/** Vertical distance between two stops. */
export const STEP = 124;
/** How far the path swings either side of the centre line. */
export const AMPLITUDE = 76;
/** Air either side of a trail tile. */
export const TRAIL_PAD = 14;
export const TRAIL_WIDTH = AMPLITUDE + TRAIL_PAD * 2;

export const STOP = { width: 80, height: 86, face: 38, icon: 42 } as const;
export const BOSS_STOP = { width: 104, height: 110, face: 49, icon: 70 } as const;

/** Room above the first stop and below the last. */
export const PATH_TOP = 76;
export const PATH_BOTTOM = 64;

/** The path is one slow wave: eight stops to swing right, back, left and back. */
export function offsetAt(index: number): number {
  return Math.round(AMPLITUDE * Math.sin((index * Math.PI) / 4));
}

/** The centre of a stop, measured from the top of the path. */
export function stopY(index: number): number {
  return PATH_TOP + index * STEP;
}

export function pathHeight(count: number): number {
  return PATH_TOP + Math.max(0, count - 1) * STEP + PATH_BOTTOM;
}

/** Which of the four trail drawings joins stop `index` to the next, and whether it is mirrored. */
export function trailTile(index: number): { tile: 0 | 1 | 2 | 3; mirrored: boolean } {
  const phase = ((index % 8) + 8) % 8;
  return { tile: (phase % 4) as 0 | 1 | 2 | 3, mirrored: phase >= 4 };
}

/** A stop's label sits on the side with more room: away from the swing. */
export function labelSide(index: number): 'left' | 'right' {
  const offset = offsetAt(index);
  if (offset !== 0) return offset > 0 ? 'left' : 'right';
  return index % 8 === 0 ? 'right' : 'left';
}
