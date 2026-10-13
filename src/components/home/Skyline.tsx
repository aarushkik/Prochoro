import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LANDSCAPE_ART } from '@/data/illustrations';
import type { SkylineKind } from '@/data/tracks';
import { useAppTheme } from '@/theme/ThemeProvider';

export function skylineHeight(_kind: SkylineKind, width: number): number {
  return Math.ceil(width * 2 / 3);
}

/** One illustrated destination per area, instead of procedural blocks and hills. */
export function Skyline({ kind, width }: { kind: SkylineKind; color?: string; width: number }) {
  const { isDark } = useAppTheme();
  const height = skylineHeight(kind, width);
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.band, { width, height, opacity: isDark ? 0.42 : 0.58 }]}>
      <Image source={LANDSCAPE_ART[kind]} resizeMode="contain" fadeDuration={0} style={{ width, height }} accessible={false} />
    </View>
  );
}
const styles = StyleSheet.create({ band: { position: 'absolute', left: 0, bottom: 0 } });
