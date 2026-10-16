import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeProvider';

/** Quiet light on paper or dark glass; illustrations stay in content, not wallpaper. */
export function Backdrop({ base }: { base?: string }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: base ?? colors.background }]}>
      <LinearGradient
        colors={isDark || base ? ['rgba(255,255,255,0.045)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
