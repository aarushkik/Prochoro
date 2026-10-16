import React, { memo } from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import { MASCOT_ASPECT, MASCOT_FRAMES, MASCOT_SHEETS, MASCOT_SIZES, type MascotProps } from './Mascot.types';
import atlasFrames from '@/data/mascotFrames.json';

/** Author-drawn moments cropped from transparent atlases; ink follows the surface. */
export const Mascot = memo(function Mascot({ pose = 'neutral', size = 'medium', ink }: MascotProps) {
  const theme = useAppTheme();
  const width = typeof size === 'number' ? size : MASCOT_SIZES[size];
  const frame = MASCOT_FRAMES[pose];
  const atlas = atlasFrames[frame.sheet];
  const [x, y, frameWidth, frameHeight] = atlas.frames[frame.index];
  const scale = width * 0.94 / Math.max(frameWidth, frameHeight);
  const tintColor = ink === 'light' || (!ink && theme.isDark) ? '#FFFFFF' : '#000000';
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: width * MASCOT_ASPECT, overflow: 'hidden', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: frameWidth * scale, height: frameHeight * scale, overflow: 'hidden' }}><Image
        testID={`mascot-art-${pose}`}
        source={MASCOT_SHEETS[frame.sheet]}
        resizeMode="stretch"
        tintColor={tintColor}
        fadeDuration={0}
        accessible={false}
        style={{ position: 'absolute', width: atlas.width * scale, height: atlas.height * scale, left: -x * scale, top: -y * scale }}
      /></View>
    </View>
  );
});
