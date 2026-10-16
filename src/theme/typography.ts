import { TextStyle } from 'react-native';
import { colors, type ThemeColors } from './colors';

/**
 * Type scale.
 *
 * One clear family leaves the hand-drawn characters room to carry personality.
 * Figtree stays legible in both light and dark glass surfaces.
 *
 * Three bundled weights keep the interface light and predictable.
 */

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/** Family names must match the keys passed to `useFonts`. */
export const fonts = {
  displaySemibold: 'Figtree_600SemiBold',
  displayBold: 'Figtree_700Bold',
  displayHeavy: 'Figtree_700Bold',
  body: 'Figtree_500Medium',
  bodySemibold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  bodyHeavy: 'Figtree_600SemiBold',
  bodyBlack: 'Figtree_700Bold',
  bold: 'Figtree_700Bold',
  semibold: 'Figtree_600SemiBold',
  medium: 'Figtree_500Medium',
} as const;

type Variant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'tagline'
  | 'caption'
  | 'label'
  | 'overline'
  | 'numeral'
  | 'stat'
  | 'button'
  | 'place';

export const makeTypography = (colors: ThemeColors): Record<Variant, TextStyle> => ({
  hero: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 46, letterSpacing: -1.3, color: colors.textPrimary },
  display: { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 38, letterSpacing: -0.9, color: colors.textPrimary },
  title: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6, color: colors.textPrimary },
  heading: { fontFamily: fonts.displayBold, fontSize: 21, lineHeight: 27, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.displaySemibold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },

  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.textSecondary },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 23, color: colors.textPrimary },
  tagline: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
  caption: { fontFamily: fonts.bodySemibold, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },

  /** Nav items and small controls. */
  label: { fontFamily: fonts.bodyHeavy, fontSize: 12, lineHeight: 16, letterSpacing: 0.2, color: colors.textSecondary },
  /** The design's all-caps kicker — heavy and widely tracked. */
  overline: {
    fontFamily: fonts.bodyBlack,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  /** Stat readouts in the HUD. */
  numeral: { fontFamily: fonts.displayHeavy, fontSize: 17, lineHeight: 21, color: colors.textPrimary },
  /** The big numbers on summary and progress screens. */
  stat: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -0.3, color: colors.textPrimary },
  button: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, letterSpacing: 0.1 },
  /** A track's place name on the path header. */
  place: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 27, letterSpacing: -0.2, color: colors.textPrimary },
});
export const typography = makeTypography(colors);
