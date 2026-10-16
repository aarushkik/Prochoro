import React from 'react';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';
import { UtilityIllustration, type UtilityIllustrationId } from '@/components/ui/UtilityIllustration';

interface IconProps { color?: string; size?: number }
export function ScoreGoalIcon({ id, size = 40 }: IconProps & { id: string }) {
  const icon: UtilityIllustrationId = id === 'score3' ? 'score3' : id === 'score4' ? 'score4' : id === 'score5' ? 'score5' : 'undecided';
  return <UtilityIllustration id={icon} size={size} />;
}
export function ExamIcon({ id, size = 40 }: IconProps & { id: string }) {
  const icon: UtilityIllustrationId = id === 'next_year' ? 'calendar' : id === 'this_spring' ? 'exam' : id === 'for_class' ? 'class' : 'hourglass';
  return <UtilityIllustration id={icon} size={size} />;
}
export function PlacementIcon({ id, size = 44 }: IconProps & { id: string }) {
  return <ActivityIllustration id={id} size={size} />;
}
