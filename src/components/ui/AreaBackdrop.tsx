import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/glass';
import { AREA_ART } from '@/data/areaArt';
import type { SkylineKind } from '@/data/tracks';
import { useMotionPreference } from '@/hooks/useMotionPreference';

/** Up to this width the landscape is a single drawing. */
const ART_WIDTH = 620;
const ART_ASPECT = 1.5;

/**
 * The generated landscape, anchored at its illustrated lower edge.
 *
 * On a phone it is one drawing, edge to edge. A wider window gets two copies
 * that meet in the middle, the left one mirrored. A mirrored seam is a
 * reflection, so every line meets its twin instead of stopping, and the scene
 * opens outwards to both edges of the screen. The seam sits behind the
 * content column, where the least of it shows.
 */
export function AreaIllustration({ kind = 'waves', opacity = 0.35 }: { kind?: SkylineKind; opacity?: number }) {
  const { colors } = useAppTheme();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const { motionEnabled } = useMotionPreference();
  const fade = useRef(new Animated.Value(opacity)).current;
  useEffect(() => {
    fade.setValue(motionEnabled ? 0 : opacity);
    const transition = Animated.timing(fade, { toValue: opacity, duration: motionEnabled ? 200 : 0, useNativeDriver: true });
    transition.start();
    return () => transition.stop();
  }, [kind, opacity, motionEnabled, fade]);
  const wide = width > ART_WIDTH;
  const tile = wide ? Math.ceil(width / 2) : width;
  const copies = wide ? [{ left: 0, flip: -1 }, { left: width - tile, flip: 1 }] : [{ left: 0, flip: 1 }];
  return <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={e => setWidth(e.nativeEvent.layout.width)} style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: fade }]}>
    {copies.map(copy => <Image key={copy.flip + ':' + copy.left} source={AREA_ART[kind]} resizeMode="contain" tintColor={colors.ink} fadeDuration={0} accessible={false}
      style={{ position: 'absolute', bottom: 0, left: copy.left, width: tile, height: tile * ART_ASPECT, transform: [{ scaleX: copy.flip }] }} />)}
  </Animated.View>;
}

/** How far past the content column the calm centre reaches, each side. */
const MIST_EDGE = 150;

/**
 * A page's ground: the landscape, and on a wide window a soft clearing down
 * the middle. The scene frames the content from both sides; behind the column
 * where the reading happens it drops back to a trace, so no line of the
 * drawing ever runs through a word.
 */
export function AreaBackdrop({ kind = 'waves', opacity = 0.35 }: { kind?: SkylineKind; opacity?: number }) {
  const { colors } = useAppTheme();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const wide = width > ART_WIDTH;
  const start = Math.max(0, (width - ART_WIDTH) / 2 - MIST_EDGE) / width;
  const soft = Math.min(MIST_EDGE / width, 0.5 - start);
  const mist = withAlpha(colors.background, 0.66);
  const clear = withAlpha(colors.background, 0);
  return <View pointerEvents="none" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
    <AreaIllustration kind={kind} opacity={opacity} />
    {wide ? <LinearGradient pointerEvents="none" colors={[clear, mist, mist, clear]} locations={[start, start + soft, 1 - start - soft, 1 - start]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
  </View>;
}
