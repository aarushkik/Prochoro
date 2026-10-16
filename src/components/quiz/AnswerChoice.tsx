import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHaptics } from '@/hooks/useHaptics';
import { Glyph, type GlyphName } from '@/components/icons';
import { colors, radius, rimOf, spacing, spring, typography, withAlpha } from '@/theme';

/** Visual state driven by the quiz flow. */
export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed' | 'struck';

interface AnswerChoiceProps {
  /** Position in the list, rendered as the A/B/C/D key. */
  index: number;
  label: string;
  state: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
}

const KEYS = ['A', 'B', 'C', 'D', 'E'];

/**
 * A tappable answer choice.
 *
 * Each option carries a lettered key so a student can talk about "C" out loud,
 * and the card sits on a lip that sinks when pressed — the same physics as the
 * buttons elsewhere. Feedback is deliberately gentle: correct changes color, wrong gives
 * a small shake rather than a jolt, and the answer that *was* right lights up
 * quietly beside it instead of shouting.
 */
export function AnswerChoice({ index, label, state, onPress, disabled }: AnswerChoiceProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);
  const STATE = makeSTATE(appTheme);

  const { motionEnabled } = useMotionPreference();
  const haptic = useHaptics();
  const inactive = disabled || state === 'struck';
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!motionEnabled) { shake.setValue(0); pop.setValue(0); return; }
    if (state === 'wrong') {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.5, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
    return () => { shake.stopAnimation(); pop.stopAnimation(); };
  }, [state, shake, pop, motionEnabled]);

  const s = STATE[state];
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  // Gives a little under the finger; clamped so the release never grows it.
  const squeeze = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98], extrapolate: 'clamp' });
  const lift = pop.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });

  const to = (v: number) => {
    if (!motionEnabled) { press.setValue(v); return; }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };

  return (
    <Animated.View style={[styles.holder, { transform: [{ translateX }, { translateY: lift }] }]}>
      <Animated.View style={{ transform: [{ scale: squeeze }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${KEYS[index] ?? index + 1}. ${label}${state === 'struck' ? '. Ruled out' : state === 'correct' || state === 'missed' ? '. Correct answer' : state === 'wrong' ? '. Your answer, incorrect' : ''}`}
          accessibilityState={{ selected: state === 'selected', disabled: inactive }}
          disabled={inactive}
          onPressIn={() => to(1)}
          onPressOut={() => to(0)}
          onPress={() => { if (state !== 'selected') haptic(); onPress?.(); }}
          style={[styles.choice, s.face]}
        >
          <View style={[styles.key, { backgroundColor: s.keyBg, borderColor: s.keyBorder }]}>
            <Text style={[styles.keyText, { color: s.keyText }]}>{KEYS[index] ?? '?'}</Text>
          </View>
          <Text style={[styles.label, { color: s.text }, state === 'struck' && styles.struckLabel]}>
            {label}
          </Text>
          {s.icon ? <Glyph name={s.icon} size={20} color={s.edge} strokeWidth={2.8} /> : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

type Style = {
  face: ViewStyle;
  edge: string;
  text: string;
  keyBg: string;
  keyBorder: string;
  keyText: string;
  icon?: GlyphName;
};

/**
 * Idle answers are clear glass, like every card. Once something happens to an
 * answer it becomes tinted glass — its state's soft colour, ringed in the
 * strong one — so the state is in the material itself.
 */
const makeSTATE = ({ colors, card, solid }: AppTheme): Record<ChoiceState, Style> => {
  const tinted = (soft: string, ring: string): ViewStyle => ({
    backgroundColor: solid ? soft : withAlpha(soft, 0.8),
    ...rimOf(ring),
  });
  return {
    idle: {
      face: card,
      edge: colors.border,
      text: colors.textPrimary,
      keyBg: colors.overlayFaint,
      keyBorder: colors.overlaySoft,
      keyText: colors.textSecondary,
    },
    selected: {
      face: tinted(colors.primaryTint, colors.primary),
      edge: colors.primary,
      text: colors.primaryDeep,
      keyBg: colors.primary,
      keyBorder: colors.primary,
      keyText: colors.textOnPrimary,
    },
    correct: {
      face: tinted(colors.successSoft, colors.success),
      edge: colors.success,
      text: colors.successDark,
      keyBg: '#111111',
      keyBorder: colors.success,
      keyText: colors.white,
      icon: 'check',
    },
    wrong: {
      face: tinted(colors.dangerSoft, colors.danger),
      edge: colors.danger,
      text: colors.dangerDark,
      keyBg: '#555555',
      keyBorder: colors.danger,
      keyText: colors.white,
      icon: 'close',
    },
    // Ruled out by a companion before answering. Deliberately the locked
    // palette rather than the danger one: it is not a mistake the student made,
    // it is an option that has been taken off the table for them.
    struck: {
      face: { backgroundColor: solid ? colors.locked : withAlpha(colors.locked, 0.55), ...rimOf(colors.overlayStrong) },
      edge: colors.overlayStrong,
      text: colors.lockedText,
      keyBg: 'transparent',
      keyBorder: colors.overlayStrong,
      keyText: colors.lockedText,
      icon: 'close',
    },
    // The right answer, shown after a miss — present but not celebratory.
    missed: {
      face: { ...card, ...rimOf(colors.success) },
      edge: colors.success,
      text: colors.successDark,
      keyBg: solid ? colors.successSoft : withAlpha(colors.successSoft, 0.8),
      keyBorder: colors.success,
      keyText: colors.successDark,
      icon: 'check',
    },
  };
};

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  holder: { marginBottom: spacing.md },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  key: {
    width: 34,
    height: 34,
    // A squircle, not a disc: the round shapes in this app are map stops.
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { ...typography.label, fontSize: 14 },
  label: { ...typography.bodyStrong, flex: 1 },
  struckLabel: { textDecorationLine: 'line-through' },
});
