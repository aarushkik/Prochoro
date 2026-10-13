/**
 * Liquid Glass tokens.
 *
 * Glass is for the layer that floats *over* content — the HUD, the tab bar,
 * the track banner, the floating button, sheets and dialogs — never for the
 * content itself. Cards on the map stay chunky and opaque; glass is how the
 * controls above them get out of the way.
 *
 * On iOS 26 the system draws the real material and none of this is used
 * except `thickNative`. Everywhere else (the web, older iOS) the material is
 * built from four layers, each with a token here:
 *
 * 1. A backdrop blur with boosted saturation, so colour from the map bleeds
 *    through instead of going grey.
 * 2. A translucent `tint` in the page's own hue — cream in light, deep teal in
 *    dark — strong enough to keep text legible over a busy map.
 * 3. A `sheen`: light pooling along the top, fading out by the middle.
 * 4. A `rim`: a one-point edge that is brightest on top and nearly gone at the
 *    bottom, the specular highlight that makes the surface read as a solid
 *    object rather than a blurred rectangle.
 *
 * `regular` is for bars and controls; `thick` for sheets and dialogs that
 * carry sentences, where legibility beats see-through.
 */
export interface GlassTokens {
  tint: string;
  thick: string;
  /** Laid over the native material on sheets, which carry reading text. */
  thickNative: string;
  blur: number;
  blurThick: number;
  sheen: string;
  rim: { top: string; side: string; bottom: string };
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
  /**
   * Content cards. Translucent over the aurora backdrop rather than blurred:
   * the backdrop is already soft, so a blur under a card would change nothing
   * you could see and cost a backdrop pass per card.
   */
  card: string;
  cardSelected: string;
  cardShadow: string;
  /**
   * The contour lines on the page behind every screen (see `CONTOURS`).
   * Glass needs something behind it to read as glass; on a map app, that
   * something is the map's own paper.
   */
  contour: string;
}

export const lightGlass: GlassTokens = {
  tint: 'rgba(255,253,247,0.58)',
  thick: 'rgba(255,253,247,0.86)',
  thickNative: 'rgba(255,253,247,0.45)',
  blur: 24,
  blurThick: 32,
  sheen: 'rgba(255,255,255,0.55)',
  rim: { top: 'rgba(255,255,255,0.95)', side: 'rgba(255,255,255,0.5)', bottom: 'rgba(18,48,60,0.10)' },
  lens: 'rgba(5,177,201,0.14)',
  lensRim: 'rgba(255,255,255,0.75)',
  edgeFade: ['rgba(245,246,240,0.94)', 'rgba(245,246,240,0.6)', 'rgba(245,246,240,0)'],
  sheenClear: 'rgba(255,255,255,0)',
  scrim: 'rgba(10,28,36,0.30)',
  shadow: '0 10px 30px rgba(18,48,60,0.12), 0 1px 3px rgba(18,48,60,0.08)',
  card: 'rgba(255,255,255,0.82)',
  cardSelected: 'rgba(222,249,246,0.96)',
  // Tight, so a stack of cards does not merge its shadows into a grey band
  // down each side of the list.
  cardShadow: '0 1px 2px rgba(18,48,60,0.06), 0 4px 12px rgba(18,48,60,0.05)',
  contour: 'rgba(18,48,60,0.075)',
};

export const darkGlass: GlassTokens = {
  tint: 'rgba(17,38,48,0.55)',
  thick: 'rgba(17,38,48,0.86)',
  thickNative: 'rgba(17,38,48,0.4)',
  blur: 20,
  blurThick: 30,
  sheen: 'rgba(255,255,255,0.09)',
  rim: { top: 'rgba(255,255,255,0.30)', side: 'rgba(255,255,255,0.10)', bottom: 'rgba(255,255,255,0.04)' },
  lens: 'rgba(124,224,235,0.2)',
  lensRim: 'rgba(255,255,255,0.16)',
  edgeFade: ['rgba(10,25,34,0.94)', 'rgba(10,25,34,0.6)', 'rgba(10,25,34,0)'],
  sheenClear: 'rgba(255,255,255,0)',
  scrim: 'rgba(0,0,0,0.48)',
  shadow: '0 12px 34px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.25)',
  card: 'rgba(30,58,70,0.52)',
  cardSelected: 'rgba(20,78,92,0.66)',
  cardShadow: '0 1px 2px rgba(0,0,0,0.25), 0 4px 14px rgba(0,0,0,0.18)',
  contour: 'rgba(237,245,243,0.055)',
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

/** A selected glass card: tinted and ringed in its accent. */
export function selectedCard(glass: GlassTokens, accent: string) {
  return {
    backgroundColor: glass.cardSelected,
    ...rimOf(accent),
    boxShadow: glass.cardShadow,
  };
}

/**
 * The rim for a *coloured* surface — a hero card, a tinted button, the
 * streak card. White light along the top, fading down the sides, a faint dark
 * line underneath: the same lighting as glass, laid over a colour instead of
 * a translucent tint.
 */
export function litRim(top = 0.45) {
  return {
    borderWidth: 1,
    borderTopColor: `rgba(255,255,255,${top})`,
    borderLeftColor: `rgba(255,255,255,${top * 0.4})`,
    borderRightColor: `rgba(255,255,255,${top * 0.4})`,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderCurve: 'continuous' as const,
  };
}

/**
 * A card in a colour wash rather than clear glass — for the one card on a
 * screen that is about something (the equipped companion, a score). The wash
 * is translucent so the map's contour lines still run under it.
 */
export function tintedCard(glass: GlassTokens, tint: string, ring: string, solid: boolean) {
  return {
    backgroundColor: solid ? tint : withAlpha(tint, 0.72),
    borderWidth: 1,
    ...rimOf(withAlpha(ring, 0.35)),
    borderCurve: 'continuous' as const,
    boxShadow: glass.cardShadow,
  };
}
