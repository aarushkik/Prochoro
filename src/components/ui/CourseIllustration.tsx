import React from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

const courseSheet = require('@/assets/characters/prochoro/courses.png');
const courseOrder = [
  'ap-biology', 'ap-calc-ab', 'ap-chem', 'ap-csa',
  'ap-eng-lang', 'ap-psych', 'ap-us-history', 'ap-world',
];

/** Eight custom, generated subject emblems share one theme-aware outline atlas. */
export function CourseIllustration({ courseId, size = 52 }: { courseId: string; size?: number }) {
  const theme = useAppTheme();
  const index = courseOrder.indexOf(courseId);
  if (index < 0) return null;
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image source={courseSheet} resizeMode="stretch" tintColor={theme.colors.ink} fadeDuration={0} accessible={false} style={{ position: 'absolute', width: size * 4, height: size * 2, left: -column * size, top: -row * size }} />
    </View>
  );
}
