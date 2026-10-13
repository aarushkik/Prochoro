import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { SkylineKind } from '@/data/tracks';

/** A quiet wash leaves room for the illustrated destination and playable path. */
export const TrackScenery = React.memo(function TrackScenery(_props: {
  kind: SkylineKind; color: string; width: number; height: number; seed: number;
}) {
  const { isDark } = useAppTheme();
  return <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(10,25,34,0)', 'rgba(10,25,34,0.25)'] : ['rgba(255,255,255,0.48)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />;
});
