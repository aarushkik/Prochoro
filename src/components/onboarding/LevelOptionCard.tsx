import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { SelectRow } from '@/components/ui/SelectRow';
import { colors } from '@/theme';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';

interface LevelOptionCardProps {
  label: string;
  /** 1–5 filled bars for this level. */
  bars: number;
  /** Short read on what this level means, shown under the label. */
  hint?: string;
  selected: boolean;
  onPress: () => void;
}

/** Experience-level option: rising signal bars beside the label. */
export function LevelOptionCard({ label, bars, hint, selected, onPress }: LevelOptionCardProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;

  return (
    <SelectRow
      leading={<ActivityIllustration id={bars <= 1 ? 'beginner' : bars === 2 ? 'builder' : bars === 3 ? 'ap_ready' : 'advanced_review'} size={44} />}
      bareLeading
      title={label}
      subtitle={hint}
      selected={selected}
      onPress={onPress}
    />
  );
}
