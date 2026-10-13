import React from 'react';
import { Image } from 'react-native';
import { COURSE_ART } from '@/data/illustrations';

/** Decorative: the adjacent course name supplies the accessible label. */
export function CourseIllustration({ courseId, size = 52 }: { courseId: string; size?: number }) {
  const source = COURSE_ART[courseId];
  if (!source) return null;
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" fadeDuration={0} accessible={false} accessibilityElementsHidden importantForAccessibility="no" />;
}
