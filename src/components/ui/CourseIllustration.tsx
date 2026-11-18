import React from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

const courseSheet = require('@/assets/characters/prochoro/courses.png');
const courseOrder = [
  'ap-biology', 'ap-calc-ab', 'ap-chem', 'ap-csa',
  'ap-eng-lang', 'ap-psych', 'ap-us-history', 'ap-world',
];
/** Emblems for courses added after the original sheet, drawn by `scripts/draw-course-icons.py`. */
const courseIcons: Record<string, number> = {
  'ap-csp': require('@/assets/characters/prochoro/course-ap-csp.png'),
  'ap-stats': require('@/assets/characters/prochoro/course-ap-stats.png'),
};

/** Custom subject emblems, tinted with the theme's ink. */
export function CourseIllustration({ courseId, size = 52 }: { courseId: string; size?: number }) {
  const theme = useAppTheme();
  const box = { width: size, height: size, overflow: 'hidden' as const };
  const single = courseIcons[courseId];
  if (single) {
    return (
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={box}>
        <Image source={single} resizeMode="contain" tintColor={theme.colors.ink} fadeDuration={0} accessible={false} style={{ width: size, height: size }} />
      </View>
    );
  }
  const index = courseOrder.indexOf(courseId);
  if (index < 0) return null;
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={box}>
      <Image source={courseSheet} resizeMode="stretch" tintColor={theme.colors.ink} fadeDuration={0} accessible={false} style={{ position: 'absolute', width: size * 4, height: size * 2, left: -column * size, top: -row * size }} />
    </View>
  );
}
