import React, { memo } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import atlas from '@/data/companionFrames.json';

interface Props {
  id: string;
  size?: number;
  dim?: boolean;
  /** Legacy prop: companion art now uses theme ink, never a character fill. */
  tint?: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const companionSheet = require('@/assets/characters/prochoro/companions.png');
const companionOrder = [
  'mira', 'ember', 'pilot', 'quill',
  'cobalt', 'marrow', 'tessel', 'nix',
  'fen', 'slate', 'vesper', 'orrin',
];

/** Twelve unique generated line drawings, cropped from one transparent sheet. */
export const CompanionSprite = memo(function CompanionSprite({ id, size = 64, dim = false, radius, style }: Props) {
  const theme = useAppTheme();
  const index = Math.max(0, companionOrder.indexOf(id));
  const [x, y, width, height] = atlas.frames[index];
  const scale = size * 0.92 / Math.max(width, height);
  return (
    <View
      testID={`companion-art-${id}`}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.55 : 1 }, style]}
    >
      <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image
        source={companionSheet}
        resizeMode="stretch"
        tintColor={theme.isDark ? '#FFFFFF' : '#000000'}
        fadeDuration={0}
        accessible={false}
        style={{
          position: 'absolute',
          width: atlas.width * scale,
          height: atlas.height * scale,
          left: -x * scale,
          top: -y * scale,
        }}
      /></View>
    </View>
  );
});
