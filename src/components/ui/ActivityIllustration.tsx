import React from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

const sheet = require('@/assets/characters/prochoro/activities.png');
const order = [
  'lesson', 'drill', 'study', 'bonus',
  'beginner', 'builder', 'ap_ready', 'advanced_review',
] as const;

/** Generated ink illustrations shared by map stops and placement results. */
export function ActivityIllustration({ id, size = 44, ink, color, dim = false }: {
  id: string;
  size?: number;
  ink?: 'light' | 'dark';
  color?: string;
  dim?: boolean;
}) {
  const theme = useAppTheme();
  const index = order.indexOf(id as typeof order[number]);
  if (index < 0) return null;
  const column = index % 4;
  const row = Math.floor(index / 4);
  const tint = ink === 'light' ? '#FFFFFF' : ink === 'dark' ? '#000000' : theme.isDark ? '#FFFFFF' : '#000000';
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, overflow: 'hidden', opacity: dim ? 0.55 : 1 }}>
      <Image source={sheet} resizeMode="stretch" tintColor={color ?? tint} fadeDuration={0} accessible={false} style={{ position: 'absolute', width: size * 4, height: size * 2, left: -column * size, top: -row * size }} />
    </View>
  );
}
