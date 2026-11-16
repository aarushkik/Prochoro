/** Neutral glass for floating controls and sheets. Native iOS draws the system
 * material; other platforms use monochrome blur, a fine rim and a soft shadow.
 * Content backgrounds remain pure white or pure black. */
export interface GlassTokens {
  tint: string;
  thick: string;
  /** Laid over the native material on sheets, which carry reading text. */
  thickNative: string;
  blur: number;
  blurThick: number;
  sheen: string;
  rim: { top: string; side: string; bottom: string };
  /** Light caught along the inside of the top edge, drawn over the rim. */
  highlight: string;
  /** The selected item's lens inside a glass bar. */
  lens: string;
  lensRim: string;
  /**
   * The page fading out under the status bar, top to bottom. Three stops of
   * one colour rather than a colour and `transparent`: native gradients do
   * not premultiply, so fading to `transparent` (transparent *black*) puts a
   * grey band through the middle.
   */
  edgeFade: [string, string, string];
  /** Where the sheen fades to: the same white at zero, for the same reason. */
  sheenClear: string;
  scrim: string;
  shadow: string;
  /** Content cards use a quiet translucent version of the page background. */
  card: string;
  cardSelected: string;
  cardShadow: string;
  contour: string;
}

export const lightGlass: GlassTokens = {
  tint: 'rgba(255,255,255,0.62)',
  thick: 'rgba(255,255,255,0.88)',
  thickNative: 'rgba(255,255,255,0.45)',
  blur: 18,
  blurThick: 28,
  sheen: 'rgba(255,255,255,0.70)',
  rim: { top: 'rgba(0,0,0,0.07)', side: 'rgba(0,0,0,0.08)', bottom: 'rgba(0,0,0,0.16)' },
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -8px 14px rgba(0,0,0,0.025)',
  lens: 'transparent',
  lensRim: '#000000',
  edgeFade: ['rgba(255,255,255,1)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'],
  sheenClear: 'rgba(255,255,255,0)',
  scrim: 'rgba(0,0,0,0.34)',
  // Glass on a white page is mostly its shadow: one wide and soft for the
  // float, one tight so the edge stays crisp.
  shadow: '0 12px 32px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)',
  card: 'rgba(255,255,255,0.86)',
  cardSelected: 'rgba(255,255,255,0.96)',
  // Tight, so a stack of cards does not merge its shadows into a grey band
  // down each side of the list.
  cardShadow: '0 3px 12px rgba(0,0,0,0.04)',
  contour: 'rgba(0,0,0,0.055)',
};

export const darkGlass: GlassTokens = {
  // Smoked rather than black: on a black page a black pane is invisible, so
  // dark glass sits a step lighter than what is behind it.
  tint: 'rgba(34,34,37,0.56)',
  thick: 'rgba(24,24,26,0.88)',
  thickNative: 'rgba(0,0,0,0.45)',
  blur: 20,
  blurThick: 30,
  sheen: 'rgba(255,255,255,0.07)',
  rim: { top: 'rgba(255,255,255,0.30)', side: 'rgba(255,255,255,0.14)', bottom: 'rgba(255,255,255,0.08)' },
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 14px rgba(255,255,255,0.03)',
  lens: 'transparent',
  lensRim: '#FFFFFF',
  edgeFade: ['rgba(0,0,0,1)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0)'],
  sheenClear: 'rgba(255,255,255,0)',
  scrim: 'rgba(0,0,0,0.56)',
  shadow: '0 14px 34px rgba(0,0,0,0.60)',
  card: 'rgba(20,20,22,0.84)',
  cardSelected: 'rgba(30,30,33,0.94)',
  cardShadow: 'none',
  contour: 'rgba(255,255,255,0.045)',
};

/**
 * Reduce Transparency: the same shapes, nothing to see through.
 *
 * Every glass token collapses to an opaque equivalent — cards to the surface
 * colour, rims to the plain border — so screens never
 * have to ask which mode they are in. They read `glass.card` and get the
 * right answer either way.
 */
export function solidGlass(base: GlassTokens, colors: { surface: string; surfaceSelected: string; border: string; background: string }): GlassTokens {
  return {
    ...base,
    tint: colors.surface,
    thick: colors.surface,
    thickNative: colors.surface,
    sheen: 'rgba(255,255,255,0)',
    rim: { top: colors.border, side: colors.border, bottom: colors.border },
    highlight: 'none',
    edgeFade: [colors.background, colors.background, colors.background],
    card: colors.surface,
    cardSelected: colors.surfaceSelected,
  };
}

/**
 * The face of a glass card: translucent fill, a one-point rim lit from above,
 * and a soft drop. Spread it into a style in place of a fill and a border.
 */
export function glassCard(glass: GlassTokens) {
  return {
    backgroundColor: glass.card,
    borderWidth: 1,
    borderTopColor: glass.rim.top,
    borderLeftColor: glass.rim.side,
    borderRightColor: glass.rim.side,
    borderBottomColor: glass.rim.bottom,
    borderCurve: 'continuous' as const,
    boxShadow: glass.cardShadow,
  };
}

/** `#RRGGBB` → `rgba(r,g,b,a)`. Glass tints need a colour with an alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * One colour on all four sides of a rim. Needed to override a glass rim: the
 * rim is set per side, and per-side colours win over a plain `borderColor`
 * whatever order they are written in.
 */
export function rimOf(color: string) {
  return { borderTopColor: color, borderLeftColor: color, borderRightColor: color, borderBottomColor: color };
}

/** Selection is an ink outline, with no colored fill. */
export function selectedCard(glass: GlassTokens, _accent?: string) {
  return {
    backgroundColor: glass.cardSelected,
    ...rimOf(glass.lensRim),
    boxShadow: glass.cardShadow,
  };
}

/** A neutral bordered card, used for companion and progress summaries. */
export function outlinedCard(glass: GlassTokens) {
  return { backgroundColor: glass.card, borderWidth: 1,
    ...rimOf(withAlpha(glass.lensRim, 0.18)),
    borderCurve: 'continuous' as const, boxShadow: glass.cardShadow };
}
