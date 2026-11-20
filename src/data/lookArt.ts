/**
 * Hat artwork drawn by `scripts/draw-looks.py`: an ink layer and a solid
 * layer that hides the head's outline under the hat. Kept apart from
 * `looks.ts` so data tests never have to load images.
 */
export const LOOK_ART: Record<string, { ink: number; fill: number }> = {
  'grad-cap': { ink: require('@/assets/looks/grad-cap.png'), fill: require('@/assets/looks/grad-cap-fill.png') },
  beanie: { ink: require('@/assets/looks/beanie.png'), fill: require('@/assets/looks/beanie-fill.png') },
  'party-hat': { ink: require('@/assets/looks/party-hat.png'), fill: require('@/assets/looks/party-hat-fill.png') },
  'top-hat': { ink: require('@/assets/looks/top-hat.png'), fill: require('@/assets/looks/top-hat-fill.png') },
  explorer: { ink: require('@/assets/looks/explorer.png'), fill: require('@/assets/looks/explorer-fill.png') },
  'flower-crown': { ink: require('@/assets/looks/flower-crown.png'), fill: require('@/assets/looks/flower-crown-fill.png') },
  crown: { ink: require('@/assets/looks/crown.png'), fill: require('@/assets/looks/crown-fill.png') },
  wizard: { ink: require('@/assets/looks/wizard.png'), fill: require('@/assets/looks/wizard-fill.png') },
};

/**
 * Where a hat's art meets the head: (150, 240) on its 300 canvas, with the
 * head band 222 wide. `scripts/measure-heads.py` uses the same numbers.
 */
export const HAT_BASE = { x: 0.5, y: 0.8 } as const;
export const HAT_SPAN = 0.74;
