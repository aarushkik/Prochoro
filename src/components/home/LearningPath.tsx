import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BossSprite } from '@/components/creatures/BossSprite';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';
import { PATH_ART, PATH_PROPS, PATH_SIGN, PATH_TRAILS } from '@/data/pathArt';
import { useHaptics } from '@/hooks/useHaptics';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { spring } from '@/theme';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import type { QuestNode, QuestNodeState } from '@/types/quest';
import { labelSide, pathGeometry, trailTile, type PathGeometry } from './pathGeometry';

const hidden = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

interface LearningPathProps {
  nodes: readonly QuestNode[];
  /** The column the path is drawn in. */
  width: number;
  /** 1 on a phone; larger screens draw everything bigger. */
  scale?: number;
  stateOf: (nodeId: string) => QuestNodeState;
  numberOf: (nodeId: string) => number;
  selectedId: string | null;
  onSelect: (node: QuestNode) => void;
}

/**
 * One unit as a trail of stepping stones.
 *
 * Every mark on it is a drawing: the stones, the dashed trail between them,
 * the badges and the scenery are images tinted with the theme's ink. The
 * stones are opaque, so the trail runs underneath them from centre to centre
 * and only shows in the gaps.
 */
export const LearningPath = memo(function LearningPath({ nodes, width, scale = 1, stateOf, numberOf, selectedId, onSelect }: LearningPathProps) {
  const { colors } = useAppTheme();
  const g = useMemo(() => pathGeometry(scale), [scale]);
  const centre = width / 2;
  return (
    <View style={{ width, height: g.height(nodes.length) }}>
      <Image {...hidden} source={PATH_SIGN.source} tintColor={colors.ink} fadeDuration={0}
        style={{ position: 'absolute', left: centre - 118 * scale, top: 8 * scale, width: PATH_SIGN.width * scale, height: PATH_SIGN.height * scale, opacity: 0.55 }} />
      {nodes.slice(0, -1).map((node, index) => {
        const { tile, mirrored } = trailTile(index);
        const walked = stateOf(nodes[index + 1].id) !== 'locked';
        return <Image key={`trail-${node.id}`} {...hidden} source={PATH_TRAILS[tile]} tintColor={colors.ink} fadeDuration={0}
          style={{
            position: 'absolute', top: g.stopY(index), width: g.trailWidth, height: g.step,
            left: mirrored ? centre - g.amplitude - g.trailPad : centre - g.trailPad,
            opacity: walked ? 1 : 0.26,
            transform: [{ scaleX: mirrored ? -1 : 1 }],
          }} />;
      })}
      {nodes.slice(0, -1).map((node, index) => {
        if (index % 2 === 0) return null;
        const middle = (g.offsetAt(index) + g.offsetAt(index + 1)) / 2;
        const prop = PATH_PROPS[(index * 5 + nodes.length) % PATH_PROPS.length];
        const x = centre + (middle >= 0 ? -1 : 1) * 104 * scale;
        return <Image key={`prop-${node.id}`} {...hidden} source={prop.source} tintColor={colors.ink} fadeDuration={0}
          style={{ position: 'absolute', left: x - prop.width * scale / 2, top: g.stopY(index) + g.step / 2 - prop.height * scale / 2, width: prop.width * scale, height: prop.height * scale, opacity: 0.4 }} />;
      })}
      {nodes.map((node, index) => (
        <PathStop key={node.id} node={node} index={index} centre={centre} width={width} g={g}
          state={stateOf(node.id)} number={numberOf(node.id)} selected={node.id === selectedId} onSelect={onSelect} />
      ))}
    </View>
  );
});

const STATE_LABEL: Record<QuestNodeState, string> = { locked: 'Locked', current: 'Tap to start', complete: 'Done. Tap to play again' };

const PathStop = memo(function PathStop({ node, index, centre, width, g, state, number, selected, onSelect }: {
  node: QuestNode; index: number; centre: number; width: number; g: PathGeometry; state: QuestNodeState; number: number; selected: boolean;
  onSelect: (node: QuestNode) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const haptic = useHaptics();
  const { motionEnabled } = useMotionPreference();
  const boss = node.kind === 'boss';
  const size = boss ? g.boss : g.stop;
  const current = state === 'current';
  const locked = state === 'locked';
  const x = centre + g.offsetAt(index);
  const y = g.stopY(index);
  const s = g.scale;

  const press = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const pick = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const to = (value: number) => {
    if (!motionEnabled) { press.setValue(value); return; }
    Animated.spring(press, { toValue: value, useNativeDriver: true, ...(value ? spring.press : spring.release) }).start();
  };
  // The stone you can play next bobs, slowly, so the eye finds it first.
  useEffect(() => {
    if (!current || !motionEnabled) { lift.setValue(0); return; }
    const bob = Animated.loop(Animated.sequence([
      Animated.timing(lift, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    bob.start();
    return () => bob.stop();
  }, [current, motionEnabled, lift]);
  useEffect(() => {
    if (!motionEnabled) { pick.setValue(selected ? 1 : 0); return; }
    const animation = Animated.spring(pick, { toValue: selected ? 1 : 0, useNativeDriver: true, ...spring.pop });
    animation.start();
    return () => animation.stop();
  }, [selected, motionEnabled, pick]);

  // The stone you are on is inked in; the rest are paper with an ink outline.
  const face = current ? colors.ink : colors.background;
  const mark = current ? colors.background : colors.ink;
  const ink = current ? (colors.background === '#000000' ? 'dark' : 'light') : undefined;
  const side = labelSide(index);
  const gap = size.width / 2 + 10 * s;
  const label = side === 'right'
    ? { left: x + gap, width: Math.max(0, width - (x + gap) - 6), alignItems: 'flex-start' as const }
    : { left: 6, width: Math.max(0, x - gap - 6), alignItems: 'flex-end' as const };
  const kind = boss ? (node.unitBoss ? 'Unit boss' : 'Boss') : null;
  const badge = locked ? PATH_ART.badgeLock : state === 'complete' ? PATH_ART.badgeCheck : null;
  const badgeSize = Math.round(28 * s);
  const labelHeight = Math.round(52 * s);

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute', left: x - size.width / 2, top: y - size.height / 2, width: size.width, height: size.height,
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * s] }) },
            { scale: Animated.multiply(
              press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93], extrapolate: 'clamp' }),
              pick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }),
            ) },
          ],
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`Level ${number}. ${kind ? kind + '. ' : ''}${node.title}. ${STATE_LABEL[state]}`}
          onPressIn={() => to(1)}
          onPressOut={() => to(0)}
          onPress={() => { haptic(); onSelect(node); }}
          style={{ width: size.width, height: size.height, borderRadius: size.width / 2 }}
        >
          <Image {...hidden} source={boss ? PATH_ART.bossFill : PATH_ART.stopFill} tintColor={face} fadeDuration={0} style={styles.layer} />
          <Image {...hidden} source={boss ? PATH_ART.bossLine : PATH_ART.stopLine} tintColor={mark} fadeDuration={0} style={[styles.layer, locked && styles.faint]} />
          <View pointerEvents="none" style={[styles.icon, { height: size.face * 2 }, locked && styles.faint]}>
            {boss
              ? <BossSprite nodeId={node.id} size={size.icon} ink={ink} />
              : <ActivityIllustration id={node.kind} size={size.icon} color={mark} />}
          </View>
        </Pressable>
        {badge ? (
          <View pointerEvents="none" style={[styles.badge, { width: badgeSize, height: badgeSize, right: -5 * s, top: -3 * s }]}>
            <Image {...hidden} source={PATH_ART.badgeFill} tintColor={colors.background} fadeDuration={0} style={styles.layer} />
            <Image {...hidden} source={badge} tintColor={colors.ink} fadeDuration={0} style={[styles.layer, locked && styles.dim]} />
          </View>
        ) : null}
        {current ? (
          // A flag over the stone you are up to: this is where to press.
          <View pointerEvents="none" style={[styles.flag, { width: 74 * s, left: size.width / 2 - 37 * s, top: -34 * s }]}>
            <View style={[styles.flagFace, { minHeight: 26 * s, borderRadius: 13 * s }]}><Text style={[styles.flagText, { fontSize: 11 * s, lineHeight: 14 * s }]}>START</Text></View>
            <View style={[styles.flagTip, { width: 9 * s, height: 9 * s, marginTop: -5.5 * s }]} />
          </View>
        ) : null}
        {node.unitBoss && !locked ? (
          <View pointerEvents="none" style={[styles.badge, { width: badgeSize, height: badgeSize, left: -5 * s, top: -3 * s }]}>
            <Image {...hidden} source={PATH_ART.badgeFill} tintColor={colors.background} fadeDuration={0} style={styles.layer} />
            <Image {...hidden} source={PATH_ART.badgeCrown} tintColor={colors.ink} fadeDuration={0} style={styles.layer} />
          </View>
        ) : null}
      </Animated.View>
      <View {...hidden} pointerEvents="none" style={[styles.label, label, { top: y - labelHeight / 2, height: labelHeight }, locked && styles.dim]}>
        <Text style={[styles.number, { fontSize: 10 * s, lineHeight: 14 * s, textAlign: side === 'right' ? 'left' : 'right' }]} numberOfLines={1}>
          {kind ? `${number} · ${kind}` : number}
        </Text>
        <Text style={[styles.title, { fontSize: 13 * s, lineHeight: 17 * s }, (current || selected) && styles.titleOn, { textAlign: side === 'right' ? 'left' : 'right' }]} numberOfLines={2}>
          {node.title}
        </Text>
      </View>
    </>
  );
});

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  icon: { position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  faint: { opacity: 0.3 },
  dim: { opacity: 0.5 },
  badge: { position: 'absolute' },
  label: { position: 'absolute', justifyContent: 'center' },
  flag: { position: 'absolute', alignItems: 'center' },
  flagFace: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 2, borderColor: colors.ink, paddingHorizontal: 8 },
  flagText: { ...typography.overline, letterSpacing: 1.4, color: colors.ink },
  flagTip: { backgroundColor: colors.background, borderColor: colors.ink, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }] },
  // A halo of the page colour, so the landscape behind never runs through a word.
  number: { ...typography.overline, letterSpacing: 0.8, color: colors.textMuted, textShadowColor: colors.background, textShadowRadius: 5 },
  title: { ...typography.caption, color: colors.textSecondary, textShadowColor: colors.background, textShadowRadius: 5 },
  titleOn: { color: colors.ink },
});
