import React from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/glass';
import { useReducedTransparency } from '@/hooks/useReducedTransparency';

export interface GlassSurfaceProps extends ViewProps {
  /**
   * `regular` for bars and floating controls. `thick` for sheets and dialogs
   * that carry sentences: less see-through, so a busy map underneath never
   * competes with the text.
   */
  variant?: 'regular' | 'thick';
  /** Optional monochrome material tint. */
  tint?: string;
  /** iOS 26: the material reacts under the finger. Only for things you press. */
  interactive?: boolean;
}

/** Native Liquid Glass is decided once; it cannot change while the app runs. */
const NATIVE_GLASS = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
const DEFAULT_RADIUS = 28;

/**
 * The material for everything that floats over content.
 *
 * Three ways to draw it, chosen per device:
 *
 * - **iOS 26** gets the system's own Liquid Glass. Content is placed *inside*
 *   the glass view, not beside it, so `interactive` glass can respond to the
 *   touches its children receive. Nothing is drawn on top of it — the system
 *   material lights its own edges, and a second rim would look painted on.
 * - **The web and older iOS** get a built material: a desaturated blur, a translucent tint, a sheen and a specular rim (see
 *   `theme/glass.ts`). On the web the blur is a CSS backdrop filter set
 *   directly; `BlurView` on the web lays a fixed grey under everything, which
 *   turned every bar into an opaque slab.
 * - **Reduce Transparency, and Android**, get a solid surface with a hairline.
 *   Same shape and place, nothing to see through.
 *
 * Corners are continuous (the squircle iOS uses) and the rim takes the
 * surface's own radius, so callers set `borderRadius` once in `style`.
 */
export function GlassSurface({ children, style, variant = 'regular', tint, interactive = false, ...props }: GlassSurfaceProps) {
  const theme = useAppTheme();
  const { glass, colors } = theme;
  const reduce = useReducedTransparency();
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const radius = typeof flat.borderRadius === 'number' ? flat.borderRadius : DEFAULT_RADIUS;
  const thick = variant === 'thick';

  if (NATIVE_GLASS && !reduce) {
    return (
      <GlassView
        {...props}
        glassEffectStyle="regular"
        tintColor={tint}
        isInteractive={interactive}
        colorScheme={theme.mode}
        style={[{ borderRadius: radius, borderCurve: 'continuous' }, style]}
      >
        {thick ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: tint ? withAlpha(tint, 0.35) : glass.thickNative }]}
          />
        ) : null}
        {children}
      </GlassView>
    );
  }

  if (reduce || Platform.OS === 'android') {
    return (
      <View
        {...props}
        style={[
          {
            borderRadius: radius,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: tint ?? colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            boxShadow: glass.shadow,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Tinted glass runs denser than neutral: a colour thinned out over a dark
  // map turns muddy before it turns see-through.
  const fill = tint ? withAlpha(tint, thick ? 0.94 : 0.9) : thick ? glass.thick : glass.tint;
  const blur = thick ? glass.blurThick : glass.blur;

  return (
    <View
      {...props}
      // The surface is its own stacking context and the material sits at
      // zIndex -1 inside it. On the web, CSS paints positioned elements over
      // unpositioned ones whatever their order, and an icon is a bare <svg> —
      // so without this the blur and tint covered any icon placed directly in
      // the glass, while text (which react-native-web positions) survived.
      style={[{ borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden', boxShadow: glass.shadow, zIndex: 0 }, style]}
    >
      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.under,
            // Not in React Native's style types, but react-native-web passes
            // both straight through to CSS.
            { backdropFilter: `blur(${blur}px) saturate(0%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(0%)` } as ViewStyle,
          ]}
        />
      ) : (
        <BlurView tint={theme.isDark ? 'dark' : 'light'} intensity={thick ? 80 : 60} style={[StyleSheet.absoluteFill, styles.under]} />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.under, { backgroundColor: fill }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[glass.sheen, glass.sheenClear]}
        locations={[0, 0.6]}
        style={[StyleSheet.absoluteFill, styles.under]}
      />
      {children}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderTopColor: glass.rim.top,
            borderLeftColor: glass.rim.side,
            borderRightColor: glass.rim.side,
            borderBottomColor: glass.rim.bottom,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  under: { zIndex: -1 },
});
