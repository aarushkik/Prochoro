import type { ImageSourcePropType } from 'react-native';

/**
 * Hand-drawn pieces of the learning path, exported by
 * `scripts/draw-path-art.py`. Every image is one colour on a transparent
 * ground, so the theme's ink tints it.
 */
export const PATH_ART = {
  stopFill: require('@/assets/path/prochoro/stop-fill.png'),
  stopLine: require('@/assets/path/prochoro/stop-line.png'),
  bossFill: require('@/assets/path/prochoro/stop-boss-fill.png'),
  bossLine: require('@/assets/path/prochoro/stop-boss-line.png'),
  badgeFill: require('@/assets/path/prochoro/badge-fill.png'),
  badgeCheck: require('@/assets/path/prochoro/badge-check.png'),
  badgeLock: require('@/assets/path/prochoro/badge-lock.png'),
  badgeCrown: require('@/assets/path/prochoro/badge-crown.png'),
  badgePlay: require('@/assets/path/prochoro/badge-play.png'),
} as const satisfies Record<string, ImageSourcePropType>;

/** Stop `n` to stop `n + 1`, for the right-hand half of the wave. */
export const PATH_TRAILS: readonly ImageSourcePropType[] = [
  require('@/assets/path/prochoro/trail-0.png'),
  require('@/assets/path/prochoro/trail-1.png'),
  require('@/assets/path/prochoro/trail-2.png'),
  require('@/assets/path/prochoro/trail-3.png'),
];

/** Small scenery beside the trail. Sizes are the drawings' own, in points. */
export const PATH_PROPS: readonly { source: ImageSourcePropType; width: number; height: number }[] = [
  { source: require('@/assets/path/prochoro/prop-tuft.png'), width: 44, height: 36 },
  { source: require('@/assets/path/prochoro/prop-rocks.png'), width: 58, height: 34 },
  { source: require('@/assets/path/prochoro/prop-flower.png'), width: 40, height: 54 },
  { source: require('@/assets/path/prochoro/prop-bush.png'), width: 64, height: 38 },
  { source: require('@/assets/path/prochoro/prop-mushroom.png'), width: 42, height: 44 },
  { source: require('@/assets/path/prochoro/prop-sparkle.png'), width: 38, height: 38 },
];

export const PATH_SIGN = { source: require('@/assets/path/prochoro/prop-sign.png'), width: 48, height: 58 } as const;
