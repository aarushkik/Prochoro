import React, { memo } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

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
  const column = index % 4;
  const row = Math.floor(index / 4);
  // Keep the illustrated gutter out of each portrait. A few long whiskers and
  // antler tips sit close to the atlas boundaries, especially between rows.
  const leftInset = id === 'ember' || id === 'marrow' ? 0.14 : 0.06;
  const rightInset = 0.06;
  const top = row === 1 ? 0.07 : row === 0 ? 0.015 : 0;
  const bottom = row === 1 ? 0.08 : row === 0 ? 0.05 : 0.025;
  const horizontalSpan = 1 - leftInset - rightInset;
  const verticalSpan = 1 - top - bottom;
  return (
    <View
      testID={`companion-art-${id}`}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, flexShrink: 0, overflow: 'hidden', borderRadius: radius ?? size * 0.2, opacity: dim ? 0.55 : 1 }, style]}
    >
      <Image
        source={companionSheet}
        resizeMode="stretch"
        tintColor={theme.isDark ? '#FFFFFF' : '#111111'}
        fadeDuration={0}
        accessible={false}
        style={{
          position: 'absolute',
          width: size * 4 / horizontalSpan,
          height: size * 3 / verticalSpan,
          left: -(column + leftInset) * size / horizontalSpan,
          top: -(row + top) * size / verticalSpan,
        }}
      />
    </View>
  );
});
