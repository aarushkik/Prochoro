import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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

/** Monochrome capsule button with a restrained press response. */
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

type Scheme = { face: ViewStyle; text: string };

const makeSchemes = ({ colors, glass }: AppTheme): Record<ButtonTone | 'disabled', Scheme> => {
  const primary = { face: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary }, text: colors.textOnPrimary };
  return {
    primary,
    gold: primary,
    success: primary,
    danger: primary,
    secondary: { face: glassCard(glass), text: colors.ink },
    ghost: { face: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' }, text: colors.textSecondary },
    disabled: {
      face: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.disabledEdge },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { textAlign: 'center', flexShrink: 1, textTransform: 'none', letterSpacing: 0.2 },
});
