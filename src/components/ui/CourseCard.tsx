import React from 'react';
import { accents } from '@/theme';
import type { APCourse } from '@/types';
import { SelectRow } from './SelectRow';
import { CourseIllustration } from './CourseIllustration';

/** Subject artwork and a readable course name share one generous tap target. */
export function CourseCard({ course, selected, onPress }: {
  course: APCourse;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = accents[course.accent];
  return (
    <SelectRow
      leading={<CourseIllustration courseId={course.id} />}
      bareLeading
      title={course.name}
      subtitle={course.blurb}
      selected={selected}
      onPress={onPress}
      accent={accent.deep}
      tint={accent.soft}
    />
  );
}
