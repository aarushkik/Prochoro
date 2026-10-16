import React, { memo } from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import { MASCOT_ASPECT, MASCOT_FRAMES, MASCOT_SHEETS, MASCOT_SIZES, type MascotProps } from './Mascot.types';

/** Author-drawn moments cropped from transparent atlases; ink follows the surface. */
export const Mascot = memo(function Mascot({ pose = 'neutral', size = 'medium', ink }: MascotProps) {
  const theme = useAppTheme();
  const width = typeof size === 'number' ? size : MASCOT_SIZES[size];
  const frame = MASCOT_FRAMES[pose];
  const column = frame.index % 3;
  const row = Math.floor(frame.index / 3);
  const tintColor = ink === 'light' || (!ink && theme.isDark) ? '#FFFFFF' : '#111111';
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: width * MASCOT_ASPECT, overflow: 'hidden', flexShrink: 0 }}
    >
      <Image
        testID={`mascot-art-${pose}`}
        source={MASCOT_SHEETS[frame.sheet]}
        resizeMode="stretch"
        tintColor={tintColor}
        fadeDuration={0}
        accessible={false}
        style={{ position: 'absolute', width: width * 3, height: width * 3, left: -column * width, top: -row * width }}
      />
    </View>
  );
});
