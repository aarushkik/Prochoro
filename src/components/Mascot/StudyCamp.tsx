import React from 'react';
import { Image, View } from 'react-native';
import { STUDY_CAMP_ART } from '@/data/illustrations';

/** A single authored scene keeps Stu and the campsite in the same visual world. */
export function StudyCamp({ size = 320 }: { size?: number }) {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size * 2 / 3 }}>
      <Image source={STUDY_CAMP_ART} resizeMode="contain" fadeDuration={0} style={{ width: '100%', height: '100%' }} accessible={false} />
    </View>
  );
}
