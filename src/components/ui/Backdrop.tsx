import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeProvider';
import { LANDSCAPE_ART } from '@/data/illustrations';

/** Quiet illustrated paper behind the floating glass; never animated. */
export function Backdrop({ base }: { base?: string }) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const artWidth = Math.min(width, 760);
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: base ?? colors.background, overflow: 'hidden' }]}>
      <LinearGradient colors={isDark || base ? ['rgba(15,62,72,0.18)', 'rgba(15,62,72,0)'] : ['rgba(215,244,242,0.7)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
      <Image source={LANDSCAPE_ART.waves} resizeMode="contain" fadeDuration={0} accessible={false} style={{ position: 'absolute', bottom: 0, right: 0, width: artWidth, height: artWidth * 2 / 3, opacity: base ? 0.06 : isDark ? 0.075 : 0.09 }} />
    </View>
  );
}
