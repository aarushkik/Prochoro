/**
 * Border widths.
 *
 * There was no token for these, so every file picked its own: forty-two
 * surfaces hard-coded `borderWidth: 3` — the heavy sticker outline from the
 * original design — sitting next to the 1.5px hairline the shared primitives
 * moved to. The app read as two design languages at once, one outlined in
 * marker and one in pencil, and which one you got depended on which screen
 * you were on.
 *
 * Four weights, chosen by what the edge is *for* rather than by taste:
 *
 * - `hairline` separates things that are not interactive — dividers, quiet
 *   chips, progress tracks.
 * - `surface` is the edge of anything you read: cards, panels, sheets. It
 *   matches `BORDER` in `chunky.ts`, which is derived from it.
 * - `control` is the edge of anything you press: inputs, answer choices,
 *   secondary buttons, the stops on the map. Slightly firmer, because an
 *   edge is part of how something says it can be tapped.
 * - `focus` marks the one thing that is selected or current. Reserved, so it
 *   still means something when it appears.
 */
export const stroke = {
  hairline: 1,
  surface: 1,
  control: 1,
  focus: 1.5,
} as const;

export type StrokeToken = keyof typeof stroke;
