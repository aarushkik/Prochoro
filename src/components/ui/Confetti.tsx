import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, confettiColors } from '@/theme';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface ConfettiProps {
  /** How many chips. The design uses 18; more reads as noise. */
  count?: number;
  /** How far the single celebratory burst travels. */
  distance?: number;
  active?: boolean;
}

/**
 * Falling chips for the celebration screens — the design's `spFall` keyframe.
 *
 * Each chip is a plain bordered View rather than SVG, tumbling on its own
 * one-shot value with a staggered start so the field never falls in unison.
 * Everything runs on the native driver, so a celebration screen costs nothing
 * on the JS thread while its numbers are counting up.
 */
export function Confetti({ count = 18, distance = 560, active = true }: ConfettiProps) {
  const { motionEnabled } = useMotionPreference();
  if (!active || !motionEnabled) return null;
  const chips = Array.from({ length: count }, (_, i) => i);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {chips.map((i) => (
        <Chip key={i} index={i} distance={distance} active={active} />
      ))}
    </View>
  );
}

function Chip({ index, distance, active }: { index: number; distance: number; active: boolean }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const duration = 2600 + (index % 5) * 450;
    const burst = Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true });
    const start = setTimeout(() => burst.start(), index * 190);
    return () => {
      clearTimeout(start);
      burst.stop();
    };
  }, [t, index, active]);

  // Deterministic spread, so the field is the same every time it plays.
  const left = `${4 + ((index * 5.4) % 92)}%` as const;
  const width = 7 + (index % 3) * 4;
  const height = 11 + (index % 4) * 3;

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          left,
          width,
          height,
          backgroundColor: confettiColors[index % confettiColors.length],
          opacity: t.interpolate({ inputRange: [0, 0.12, 0.9, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-40, distance] }) },
            {
              rotate: t.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', index % 2 === 0 ? '620deg' : '-540deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
});
