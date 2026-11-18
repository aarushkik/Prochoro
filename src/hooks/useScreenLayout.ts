import { useWindowDimensions } from 'react-native';

/**
 * How much room the window gives us, in three steps.
 *
 * - **compact**: phones, and narrow browser windows. One column, edge to edge.
 * - **medium**: iPad in portrait, Split View halves, small laptop windows.
 *   A wider column, two-up grids, larger artwork.
 * - **expanded**: iPad in landscape and desktop browsers. The widest column,
 *   side panels and three- or four-up grids.
 *
 * Measured from the window rather than the device, so iPad multitasking and a
 * resized browser both get the layout that fits the space they actually have.
 */
export type SizeClass = 'compact' | 'medium' | 'expanded';

export const MEDIUM_WIDTH = 700;
export const EXPANDED_WIDTH = 1100;

export function sizeClassFor(width: number): SizeClass {
  if (width >= EXPANDED_WIDTH) return 'expanded';
  if (width >= MEDIUM_WIDTH) return 'medium';
  return 'compact';
}

export interface ScreenLayout {
  width: number;
  height: number;
  size: SizeClass;
  /** Medium or expanded. */
  wide: boolean;
  expanded: boolean;
  /** The width content is laid out in: the window on a phone, a capped column above that. */
  column: number;
  /** Side margin outside the column. */
  gutter: number;
  /** How much artwork and display type grow: 1 on a phone. */
  scale: number;
  /** Grid columns for cards of the given minimum width. */
  columnsFor: (minWidth: number, max?: number) => number;
}

export function layoutFor(width: number, height: number): ScreenLayout {
  const size = sizeClassFor(width);
  const gutter = size === 'compact' ? 0 : size === 'medium' ? 32 : 48;
  const cap = size === 'compact' ? width : size === 'medium' ? 880 : 1280;
  const column = Math.max(0, Math.min(width - gutter * 2, cap));
  const scale = size === 'compact' ? 1 : size === 'medium' ? 1.18 : 1.26;
  return {
    width, height, size, gutter, column, scale,
    wide: size !== 'compact',
    expanded: size === 'expanded',
    columnsFor: (minWidth, max = 4) => Math.max(1, Math.min(max, Math.floor((column - 36 + 12) / (minWidth + 12)))),
  };
}

export function useScreenLayout(): ScreenLayout {
  const { width, height } = useWindowDimensions();
  return layoutFor(width, height);
}
