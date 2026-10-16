import React from 'react';
import { Image, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import atlas from '@/data/utilityFrames.json';

const sheet = require('@/assets/characters/prochoro/utilities.png');
const order = ['score3', 'score4', 'score5', 'undecided', 'calendar', 'exam', 'hourglass', 'class', 'streak', 'gems', 'xp', 'map'] as const;
export type UtilityIllustrationId = typeof order[number];

/** Authored hollow ink illustrations, tinted with the current theme's foreground. */
export function UtilityIllustration({ id, size = 40, color }: { id: UtilityIllustrationId; size?: number; color?: string }) {
  const { colors } = useAppTheme();
  const index = order.indexOf(id);
  if (index < 0) return null;
  const [x, y, width, height] = atlas.frames[index];
  const scale = size * 0.92 / Math.max(width, height);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
      <Image source={sheet} tintColor={color ?? colors.ink} resizeMode="stretch" fadeDuration={0} accessible={false} style={{ position: 'absolute', width: atlas.width * scale, height: atlas.height * scale, left: -x * scale, top: -y * scale }} />
    </View>
  </View>;
}
