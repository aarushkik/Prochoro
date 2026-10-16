import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { chunky, chunkyRadius, colors, depth, selectedCard, spacing, spring, typography } from '@/theme';

/**
 * The surfaces every screen is assembled from.
 *
 * All of them are the same idea — a 3px ink border over a lip — so they are
 * built here once. Screens that hand-roll the treatment drift within a few
 * files: a 2px border here, a soft shadow there, and the sticker look falls
 * apart.
 */

interface ChunkyCardProps {
  children: React.ReactNode;
  /** Selected cards lift onto a coloured lip and tint their fill. */
  selected?: boolean;
  /** Lip colour when selected. Defaults to the brand turquoise. */
  accent?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * A tappable card. Selection changes the fill and the lip colour rather than
 * the size — these run the full width of the screen padding, and scaling one
 * up pushes it past both edges.
 */
export function ChunkyCard({
  children,
  selected = false,
  accent: accentProp,
  onPress,
  style,
  contentStyle,
  accessibilityLabel,
}: ChunkyCardProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  // Resolved from the theme rather than as a default parameter, which would
  // read the static light palette. See SelectRow.
  const accent = accentProp ?? colors.primary;
  const styles = useThemedStyles(createStyles);

  const { motionEnabled } = useMotionPreference();
  const press = useRef(new Animated.Value(0)).current;
  const c = chunky({
    depth: selected ? depth.button : depth.card,
    radius: chunkyRadius.card,
    shadow: selected ? accent : colors.lip,
  });

  const to = (v: number) => {
    if (!motionEnabled) { press.setValue(v); return; }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };
  // Glass gives a little under the finger rather than sinking onto a lip.
  // Clamped, so the release spring's overshoot never grows the card past
  // its own width.
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98], extrapolate: 'clamp' });

  const face = (
    <Animated.View
      style={[
        c.face,
        // Fill the wrapper. In a grid row the wrapper stretches to the tallest
        // card, but the face kept its own content height, so every shorter
        // card showed its lip as a slab beneath it — up to 15pt on the
        // Practice grid, where a card with a one-line description sat beside
        // one with two.
        styles.faceFill,
        selected ? selectedCard(appTheme.glass, accent) : null,
        onPress ? { transform: [{ scale }] } : null,
        contentStyle,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) {
    return (
      <View style={[c.wrap, style]}>
          {face}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      style={[c.wrap, style]}
    >
      {face}
    </Pressable>
  );
}

interface StatChipProps {
  value: string;
  label: string;
  /** Tints the value, so a row of chips still reads at a glance. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** A small boxed number with a caption. Used in rows of three or four. */
export function StatChip({ value, label, color, style }: StatChipProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const c = chunky({ depth: depth.chip, radius: chunkyRadius.chip });
  return (
    <View style={[c.wrap, styles.flex, style]}>
      <View style={[c.face, styles.chipFace]}>
        <Text style={[typography.stat, styles.chipValue, { color: color ?? colors.ink }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.chipLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

interface PrizeChipProps {
  title: string;
  subtitle?: string;
  /** Rewards on the night ground invert: ink fill, warm lip. */
  onNight?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** What a session paid out. Sits on both grounds, so it flips its own fill. */
export function PrizeChip({ title, subtitle, onNight = false, style }: PrizeChipProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const c = chunky({
    depth: depth.prize,
    radius: chunkyRadius.prize,
    shadow: onNight ? colors.goldDeep : colors.lip,
  });
  return (
    <View style={[c.wrap, styles.flex, style]}>
      <View style={[c.face, styles.prizeFace, onNight && { backgroundColor: colors.nightRaised }]}>
        <Text style={[styles.prizeTitle, onNight && { color: colors.gold }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.prizeSub, onNight && { color: colors.textFaint }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface SegmentedProgressProps {
  /** 0–1. */
  value: number;
  /** Fill colour; the track is always sand. */
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** A bordered progress track. Ink outline so it matches everything else. */
export function SegmentedProgress({ value, color = colors.primary, height = 14, style }: SegmentedProgressProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View style={[styles.track, { height, borderRadius: height }, style]}>
      <View style={[styles.fill, { width: pct, backgroundColor: color, borderRadius: height }]} />
    </View>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  faceFill: { flexGrow: 1 },

  chipFace: { paddingVertical: 10, paddingHorizontal: spacing.sm, alignItems: 'center' },
  chipValue: { fontSize: 22, lineHeight: 26 },
  chipLabel: { ...typography.overline, fontSize: 9.5, letterSpacing: 1, color: colors.textMuted, marginTop: 2 },

  prizeFace: { paddingVertical: 11, paddingHorizontal: spacing.md },
  prizeTitle: { ...typography.subtitle, fontSize: 15 },
  prizeSub: { ...typography.caption, fontSize: 11, marginTop: 1 },

  track: {
    width: '100%',
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
