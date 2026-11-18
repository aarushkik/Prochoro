/**
 * Where things sit on the learning path.
 *
 * The trail tiles are drawn for exactly the base numbers here
 * (`scripts/draw-path-art.py`); change one and re-run the script. A larger
 * screen multiplies every number by the same `scale`, so the drawings grow
 * evenly and the trail still lands centre to centre. The PNGs are exported at
 * three times their base size, which covers any scale used here.
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

export interface PathGeometry {
  scale: number;
  step: number;
  amplitude: number;
  trailPad: number;
  trailWidth: number;
  stop: { width: number; height: number; face: number; icon: number };
  boss: { width: number; height: number; face: number; icon: number };
  /** Horizontal offset of stop `index` from the centre line. */
  offsetAt: (index: number) => number;
  /** Centre of stop `index`, from the top of the path. */
  stopY: (index: number) => number;
  height: (count: number) => number;
}

const sized = <T extends Record<string, number>>(value: T, scale: number) =>
  Object.fromEntries(Object.entries(value).map(([key, n]) => [key, Math.round(n * scale)])) as { [K in keyof T]: number };

export function pathGeometry(scale = 1): PathGeometry {
  const step = Math.round(STEP * scale);
  const amplitude = AMPLITUDE * scale;
  const top = Math.round(PATH_TOP * scale);
  return {
    scale, step, amplitude,
    trailPad: TRAIL_PAD * scale,
    trailWidth: TRAIL_WIDTH * scale,
    stop: sized(STOP, scale),
    boss: sized(BOSS_STOP, scale),
    offsetAt: index => Math.round(amplitude * Math.sin((index * Math.PI) / 4)),
    stopY: index => top + index * step,
    height: count => top + Math.max(0, count - 1) * step + Math.round(PATH_BOTTOM * scale),
  };
}

/** Which of the four trail drawings joins stop `index` to the next, and whether it is mirrored. */
export function trailTile(index: number): { tile: 0 | 1 | 2 | 3; mirrored: boolean } {
  const phase = ((index % 8) + 8) % 8;
  return { tile: (phase % 4) as 0 | 1 | 2 | 3, mirrored: phase >= 4 };
}

/** A stop's label sits on the side with more room: away from the swing. */
export function labelSide(index: number): 'left' | 'right' {
  const phase = ((index % 8) + 8) % 8;
  if (phase === 0) return 'right';
  if (phase === 4) return 'left';
  return phase < 4 ? 'left' : 'right';
}
