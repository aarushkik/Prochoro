import React, { memo } from 'react';
import { Image, View, type ImageStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';
import { HAT_BASE, HAT_SPAN, LOOK_ART } from '@/data/lookArt';
import { MASCOT_ASPECT, MASCOT_FRAMES, MASCOT_SHEETS, MASCOT_SIZES, type MascotPose, type MascotProps } from './Mascot.types';
import { useWornLook } from './WornLook';
import atlasFrames from '@/data/mascotFrames.json';
import headAnchors from '@/data/lookAnchors.json';

type HeadAnchor = { x: number; y: number; w: number; tilt: number };
const heads = headAnchors as Record<MascotPose, HeadAnchor>;

/**
 * Author-drawn moments cropped from transparent atlases; ink follows the surface.
 *
 * The student's hat, if any, sits on the head measured for this pose by
 * `scripts/measure-heads.py`. It is two layers: a solid one in the colour of
 * the surface behind, which hides the head's outline under the hat, and the
 * ink lines over it. `look` overrides the worn hat (null for none), and
 * `surface` is the colour behind the mascot when it is not the page.
 */
export const Mascot = memo(function Mascot({ pose = 'neutral', size = 'medium', ink, look, surface }: MascotProps) {
  const theme = useAppTheme();
  const worn = useWornLook();
  const width = typeof size === 'number' ? size : MASCOT_SIZES[size];
  const height = width * MASCOT_ASPECT;
  const frame = MASCOT_FRAMES[pose];
  const atlas = atlasFrames[frame.sheet];
  const [x, y, frameWidth, frameHeight] = atlas.frames[frame.index];
  const scale = width * 0.94 / Math.max(frameWidth, frameHeight);
  const boxWidth = frameWidth * scale;
  const boxHeight = frameHeight * scale;
  const tintColor = ink === 'light' || (!ink && theme.isDark) ? '#FFFFFF' : '#000000';

  const hatId = look === undefined ? worn : look;
  const art = hatId ? LOOK_ART[hatId] : undefined;
  const head = art ? heads[pose] : undefined;
  let hat: ImageStyle | null = null;
  if (art && head) {
    const side = head.w * boxWidth / HAT_SPAN;
    hat = {
      position: 'absolute',
      width: side,
      height: side,
      left: (width - boxWidth) / 2 + head.x * boxWidth - HAT_BASE.x * side,
      top: (height - boxHeight) / 2 + head.y * boxHeight - HAT_BASE.y * side,
      transform: [{ rotate: `${head.tilt}deg` }],
      transformOrigin: `${HAT_BASE.x * 100}% ${HAT_BASE.y * 100}%`,
    };
  }

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: boxWidth, height: boxHeight, overflow: 'hidden' }}><Image
        testID={`mascot-art-${pose}`}
        source={MASCOT_SHEETS[frame.sheet]}
        resizeMode="stretch"
        tintColor={tintColor}
        fadeDuration={0}
        accessible={false}
        style={{ position: 'absolute', width: atlas.width * scale, height: atlas.height * scale, left: -x * scale, top: -y * scale }}
      /></View>
      {art && hat ? <>
        <Image source={art.fill} resizeMode="stretch" tintColor={surface ?? theme.colors.background} fadeDuration={0} accessible={false} style={hat} />
        <Image testID={`mascot-hat-${hatId}`} source={art.ink} resizeMode="stretch" tintColor={tintColor} fadeDuration={0} accessible={false} style={hat} />
      </> : null}
    </View>
  );
});
