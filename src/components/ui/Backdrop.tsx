import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

/** Quiet light on paper or dark glass; illustrations stay in content, not wallpaper. */
export function Backdrop({ base }: { base?: string }) {
  const { colors } = useAppTheme();
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: base ?? colors.background }]} />
  );
}
