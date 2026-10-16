import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Glyph } from '@/components/icons';
import { chunky, chunkyRadius, colors, depth, fonts, selectedCard, spacing, spring } from '@/theme';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface SelectRowProps {
  /** Leading art — an illustration, glyph, or level bars. */
  leading: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Selection colour. Tints the lip and the tick when chosen. */
  accent?: string;
  /** Soft background used behind the leading art. */
  tint?: string;
  /** Drop the tinted tile behind `leading` (for art that carries its own). */
  bareLeading?: boolean;
}

/**
 * The one selectable row every setup screen is built from — course, experience
 * level, score goal, exam timing. Sharing it keeps the selected state, the
 * press physics and the tick identical across the whole flow; callers only
 * vary the leading art and the accent.
 *
 * Selection is carried by the *lip*, not by a border colour swap. Every other
 * surface in the app sits on a coloured drop, and a row that instead grew a
 * 2px outline read as a form control from a different app. Choosing one now
 * lifts it and turns its shadow the accent colour — the same move the answer
 * choices in the quiz make.
 *
 * Nothing scales. These rows are full-bleed, and a spring overshoots its
 * target by design, so scaling up pushes them past both screen edges.
 */
export function SelectRow({
  leading,
  title,
  subtitle,
  selected,
  onPress,
  accent: accentProp,
  tint: tintProp,
  bareLeading = false,
}: SelectRowProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky, stroke } = appTheme;
  // Defaults resolved here, not in the signature. A default parameter is
  // evaluated before the theme is read, so `tint = colors.primaryTint` there
  // meant the *static* light palette: every leading tile stayed pale cream in
  // dark mode, and the experience-level bars — drawn in the theme's near-white
  // ink — disappeared into it.
  const accent = colors.primary;
  const styles = useThemedStyles(createStyles);

  const press = useRef(new Animated.Value(0)).current;
  const { reduceMotion } = useMotionPreference();
  const c = chunky({
    depth: selected ? depth.button : depth.card,
    radius: chunkyRadius.card,
    shadow: selected ? accent : colors.lip,
  });

  const to = (v: number) => {
    if (reduceMotion) { press.setValue(v); return; }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      style={[c.wrap, styles.wrap]}
    >
      <Animated.View
        style={[
          c.face,
          styles.card,
          selected && selectedCard(appTheme.glass, accent),
          { transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98], extrapolate: 'clamp' }) }] },
        ]}
      >
        <View
          style={[
            styles.tile,
          ]}
        >
          {leading}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.check, selected && { backgroundColor: accent }]}>
          {selected ? <Glyph name="check" size={14} color={colors.textOnPrimary} strokeWidth={2.3} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const createStyles = ({ colors, palette, typography, stroke }: AppTheme) => StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  body: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 17, lineHeight: 20, color: colors.ink },
  subtitle: { fontFamily: fonts.bodySemibold, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  // Always ringed, filled only when chosen. An empty circle that changes
  // only its border colour is easy to miss at a glance down a list of eight.
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: stroke.control,
    borderColor: colors.overlayStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
