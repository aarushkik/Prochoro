import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Glyph, type GlyphName } from '@/components/icons';
import { glassCard, spacing, spring } from '@/theme';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHaptics } from '@/hooks/useHaptics';

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'gold' | 'success' | 'danger';
type Size = 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  /** Optional glyph shown before the label. */
  icon?: GlyphName;
  /**
   * Accepted for call-site compatibility. Every filled tone already carries
   * the same weight, so there is no separate emphasis state.
   */
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The StudyPlat button: a capsule of glass.
 *
 * Filled tones are coloured glass — the colour itself, a sheen pooling along
 * the top and a rim lit from above. No coloured glow underneath: a halo in a
 * button's own colour is decoration, and it made every screen look like a
 * template. Secondary is clear glass, the same material as the cards it
 * sits among; ghost has no surface at all.
 *
 * Pressing gives a little under the finger and springs back. The old chunky
 * button sank onto a lip; glass has no lip to sink onto, so it scales instead,
 * clamped so the release spring's overshoot never grows it past its own size.
 */
export function AppButton({
  label,
  onPress,
  tone = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  hapticFeedback = true,
  icon,
  style,
}: AppButtonProps) {
  const appTheme = useAppTheme();
  const { typography } = appTheme;
  const styles = useThemedStyles(createStyles);
  const schemes = useThemedStyles(makeSchemes);

  const press = useRef(new Animated.Value(0)).current;
  const haptic = useHaptics();
  const { reduceMotion } = useMotionPreference();
  const inactive = disabled || loading;
  const scheme = inactive ? schemes.disabled : schemes[tone];
  useEffect(() => () => press.stopAnimation(), [press]);

  const to = (v: number) => {
    if (reduceMotion) { press.setValue(v); return; }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97], extrapolate: 'clamp' });
  const pad = size === 'lg' ? 16 : 11;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      onPress={() => { if (hapticFeedback) haptic(); onPress?.(); }}
      style={[styles.wrap, style]}
    >
      <Animated.View style={[styles.face, scheme.face, { paddingVertical: pad, transform: [{ scale }] }]}>
        {scheme.sheen ? (
          <LinearGradient
            pointerEvents="none"
            colors={[scheme.sheen, appTheme.glass.sheenClear]}
            locations={[0, 0.6]}
            style={[StyleSheet.absoluteFill, styles.under]}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color={scheme.text} />
        ) : (
          <View style={styles.row}>
            {icon ? <Glyph name={icon} size={18} color={scheme.text} strokeWidth={2.6} /> : null}
            <Text style={[typography.button, styles.label, { color: scheme.text }]}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

type Scheme = { face: ViewStyle; text: string; sheen?: string };

/** Coloured glass: the fill, a white rim lit from above, a quiet drop. */
function tinted(fill: string, solid: boolean): ViewStyle {
  return {
    backgroundColor: fill,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.55)',
    borderLeftColor: 'rgba(255,255,255,0.22)',
    borderRightColor: 'rgba(255,255,255,0.22)',
    borderBottomColor: 'rgba(0,0,0,0.10)',
    boxShadow: solid ? 'none' : '0 4px 12px rgba(18,48,60,0.16), 0 1px 2px rgba(18,48,60,0.10)',
  };
}

const makeSchemes = ({ colors, glass, solid }: AppTheme): Record<ButtonTone | 'disabled', Scheme> => {
  const sheen = solid ? undefined : 'rgba(255,255,255,0.32)';
  return {
    primary: { face: tinted(colors.primary, solid), text: colors.textOnPrimary, sheen },
    gold: { face: tinted(colors.gold, solid), text: colors.textOnPrimary, sheen },
    success: { face: tinted('#111111', solid), text: colors.white, sheen },
    danger: { face: tinted('#555555', solid), text: colors.white, sheen },
    secondary: { face: glassCard(glass), text: colors.ink, sheen: solid ? undefined : glass.sheen },
    ghost: { face: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' }, text: colors.textSecondary },
    disabled: {
      face: { backgroundColor: colors.overlaySoft, borderWidth: 1, borderColor: colors.overlaySoft },
      text: colors.textFaint,
    },
  };
};

const createStyles = () => StyleSheet.create({
  // Keeps the room the old lip reserved, so no screen's spacing moved. The
  // radius is for the web's focus ring, which follows the focused element.
  wrap: { marginBottom: 3, borderRadius: 999 },
  face: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderCurve: 'continuous',
    overflow: 'hidden',
    // Its own stacking context, so the sheen at zIndex -1 sits between the
    // fill and the label. See GlassSurface.
    zIndex: 0,
  },
  under: { zIndex: -1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { textAlign: 'center', flexShrink: 1, textTransform: 'none', letterSpacing: 0.2 },
});
