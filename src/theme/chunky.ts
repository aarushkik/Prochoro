import type { ViewStyle } from 'react-native';
import { colors, type ThemeColors } from './colors';
import { stroke } from './stroke';
import type { GlassTokens } from './glass';

/** Compatibility names for the shared rounded surface API. All surfaces are now
 * monochrome, with fine rims and no offset sticker shadow. */
/** The edge of every chunky surface. See `stroke.surface`. */
export const BORDER = stroke.surface;

/** Depths used across the design, smallest surface to largest. */
export const depth = {
  chip: 2,
  card: 2,
  button: 3,
  prize: 3,
  stop: 7,
  current: 8,
} as const;

export const chunkyRadius = {
  chip: 20,
  prize: 22,
  button: 26,
  card: 26,
  flag: 14,
  nav: 15,
} as const;

export interface ChunkyStyles {
  /** Put on the outer view. Reserves room for the lip below the face. */
  wrap: ViewStyle;
  /** Absolutely positioned, rendered *before* the face. */
  lip: ViewStyle;
  /** The visible surface. */
  face: ViewStyle;
  /** How far the face travels down when pressed. */
  press: number;
}

export interface ChunkyOptions {
  /** How far the lip peeks out. Defaults to the button depth. */
  depth?: number;
  /** Corner radius. Defaults to the card radius. */
  radius?: number;
  /** Lip colour. Ink for most things; a track's dark tone for coloured ones. */
  shadow?: string;
  /** Face fill. */
  background?: string;
  /** Border colour, if it should not be ink. */
  border?: string;
}

/**
 * Build the three styles for one chunky surface.
 *
 * ```tsx
 * const c = chunky({ depth: depth.button, radius: chunkyRadius.button });
 * <View style={c.wrap}>
 *   <View style={c.lip} />
 *   <Animated.View style={[c.face, { transform: [{ translateY }] }]}>…</Animated.View>
 * </View>
 * ```
 */
export function chunky(options: ChunkyOptions = {}, tokens: ThemeColors = colors, glass?: GlassTokens): ChunkyStyles {
  const d = options.depth ?? depth.button;
  const r = options.radius ?? chunkyRadius.card;

  return {
    wrap: { position: 'relative', marginBottom: d, borderRadius: r },
    lip: { display: 'none' },
    face: {
      borderRadius: r,
      borderCurve: 'continuous',
      backgroundColor: options.background ?? glass?.card ?? tokens.surface,
      borderWidth: 1,
      ...(options.border || !glass
        ? { borderColor: options.border ?? tokens.border }
        : { borderTopColor: glass.rim.top, borderLeftColor: glass.rim.side,
            borderRightColor: glass.rim.side, borderBottomColor: glass.rim.bottom }),
      boxShadow: glass?.cardShadow ?? 'none',
    },
    press: 0,
  };
}
