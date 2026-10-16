import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import { AREA_ART } from '@/data/areaArt';
import type { SkylineKind } from '@/data/tracks';
import { useMotionPreference } from '@/hooks/useMotionPreference';

/** The full generated landscape is anchored at its illustrated lower edge. */
export function AreaIllustration({ kind = 'waves', opacity = 0.35 }: { kind?: SkylineKind; opacity?: number }) {
  const { colors } = useAppTheme();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(window.width, 620));
  const { motionEnabled } = useMotionPreference();
  const fade = useRef(new Animated.Value(opacity)).current;
  useEffect(() => {
    fade.setValue(motionEnabled ? 0 : opacity);
    const transition = Animated.timing(fade, { toValue: opacity, duration: motionEnabled ? 200 : 0, useNativeDriver: true });
    transition.start();
    return () => transition.stop();
  }, [kind, opacity, motionEnabled, fade]);
  return <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={e => setWidth(Math.min(e.nativeEvent.layout.width, 620))} style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: fade }]}>
    <Image source={AREA_ART[kind]} resizeMode="contain" tintColor={colors.ink} fadeDuration={0} accessible={false} style={{ position: 'absolute', bottom: 0, alignSelf: 'center', width, height: width * 1.5 }} />
  </Animated.View>;
}

export function AreaBackdrop({ kind = 'waves', opacity = 0.35 }: { kind?: SkylineKind; opacity?: number }) {
  const { colors } = useAppTheme();
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}><AreaIllustration kind={kind} opacity={opacity} /></View>;
}
