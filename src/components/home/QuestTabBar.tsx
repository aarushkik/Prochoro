import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spring } from '@/theme';
import { Glyph, type GlyphName } from '@/components/icons';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHaptics } from '@/hooks/useHaptics';
import { GlassSurface } from '@/components/ui/GlassSurface';

export type QuestTab = 'map' | 'practice' | 'progress' | 'you';

const TABS: { id: QuestTab; label: string; glyph: GlyphName }[] = [
  { id: 'map', label: 'Path', glyph: 'map' },
  { id: 'practice', label: 'Practice', glyph: 'bolt' },
  { id: 'progress', label: 'Progress', glyph: 'chart' },
  { id: 'you', label: 'Profile', glyph: 'avatar' },
];

/** Bar geometry. The radii are concentric: lens radius + inset = bar radius. */
const INSET = 7;
const TILE_HEIGHT = 58;
const LENS_RADIUS = TILE_HEIGHT / 2;
const BAR_RADIUS = LENS_RADIUS + INSET;

/**
 * Bottom navigation: a floating glass capsule with a lens on the active tab.
 *
 * The lens is a translucent wash with a bright rim, not a solid tile — the
 * bar is glass, and a solid slab inside it read as a sticker stuck on top.
 * Which tab you are on is carried by the lens's shape and by icon and label
 * both taking the accent colour, so it never depends on colour alone.
 *
 * Moving between tabs, the lens travels on a spring and stretches as it goes,
 * then settles back to its width — the liquid part of Liquid Glass. Both are
 * skipped when Reduce Motion is on.
 */
export function QuestTabBar({ active, onChange }: { active: QuestTab; onChange: (t: QuestTab) => void }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const haptic = useHaptics();
  const { motionEnabled } = useMotionPreference();
  const [barWidth, setBarWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const stretch = useRef(new Animated.Value(1)).current;
  const step = Math.max(0, (barWidth - 10) / TABS.length);
  const target = TABS.findIndex(tab => tab.id === active) * step;
  const lastStep = useRef(step);
  useEffect(() => {
    // A re-measure (rotation, first layout) moves the lens without travel.
    const resized = lastStep.current !== step;
    lastStep.current = step;
    if (!motionEnabled || resized) { slide.setValue(target); stretch.setValue(1); return; }
    const movement = Animated.parallel([
      Animated.spring(slide, { toValue: target, useNativeDriver: true, damping: 22, stiffness: 240, mass: 0.85 }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1.06, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(stretch, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260, mass: 0.7 }),
      ]),
    ]);
    movement.start();
    return () => movement.stop();
  }, [target, step, slide, stretch, motionEnabled]);

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
    <GlassSurface style={styles.bar} onLayout={event => setBarWidth(event.nativeEvent.layout.width)}>
      {barWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.lens, { width: step - 6, transform: [{ translateX: slide }, { scaleX: stretch }] }]}
        />
      ) : null}
      {TABS.map((tab) => {
        const on = tab.id === active;
        const tone = on ? colors.primaryDeep : colors.textSecondary;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            accessibilityLabel={tab.label}
            onPress={() => { if (!on) { haptic(); onChange(tab.id); } }}
            style={({ pressed }) => [styles.tab, pressed && !on && styles.tabPressed]}
          >
            <Tile on={on}>
              <Glyph name={tab.glyph} size={22} color={tone} strokeWidth={on ? 2.4 : 2.1} />
              <Text style={[styles.label, { color: tone }]}>{tab.label}</Text>
            </Tile>
          </Pressable>
        );
      })}
    </GlassSurface>
    </View>
  );
}

/**
 * The active tab's icon and label land rather than appear — a small lift that
 * overshoots once, in step with the lens arriving under them.
 */
function Tile({ on, children }: { on: boolean; children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const { motionEnabled } = useMotionPreference();
  const pop = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    if (!motionEnabled) { pop.setValue(on ? 1 : 0); return; }
    const animation = Animated.spring(pop, { toValue: on ? 1 : 0, useNativeDriver: true, ...spring.pop });
    animation.start();
    return () => animation.stop();
  }, [on, pop, motionEnabled]);

  return (
    <Animated.View
      style={[
        styles.tile,
        // Only the *inactive* state is scaled down, so the active tile rests at
        // exactly 1 and the spring's overshoot never pushes it wider than the
        // slot it sits in.
        { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const createStyles = ({ glass }: AppTheme) => StyleSheet.create({
  dock: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: INSET,
    paddingHorizontal: 5,
    borderRadius: BAR_RADIUS,
  },
  lens: {
    position: 'absolute',
    left: 8,
    top: INSET,
    bottom: INSET,
    borderRadius: LENS_RADIUS,
    borderCurve: 'continuous',
    backgroundColor: glass.lens,
    borderWidth: 1,
    borderColor: glass.lensRim,
  },
  // Rounded to the lens so a keyboard focus ring matches the shape the tab
  // takes when it is selected, rather than a square around it.
  tab: { position: 'relative', flex: 1, minWidth: 0, marginHorizontal: 3, borderRadius: LENS_RADIUS },
  tabPressed: { opacity: 0.6 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 3,
    minHeight: TILE_HEIGHT,
    borderRadius: LENS_RADIUS,
  },
  label: { fontFamily: fonts.bodyBlack, fontSize: 11, letterSpacing: 0 },
});
