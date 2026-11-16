import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BossSprite } from '@/components/creatures/BossSprite';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';
import { PATH_ART, PATH_PROPS, PATH_SIGN, PATH_TRAILS } from '@/data/pathArt';
import { useHaptics } from '@/hooks/useHaptics';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { spring } from '@/theme';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import type { QuestNode, QuestNodeState } from '@/types/quest';
import {
  AMPLITUDE, BOSS_STOP, STEP, STOP, TRAIL_PAD, TRAIL_WIDTH,
  labelSide, offsetAt, pathHeight, stopY, trailTile,
} from './pathGeometry';

const hidden = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

interface LearningPathProps {
  nodes: readonly QuestNode[];
  /** The column the path is drawn in. */
  width: number;
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
export const LearningPath = memo(function LearningPath({ nodes, width, stateOf, numberOf, selectedId, onSelect }: LearningPathProps) {
  const { colors } = useAppTheme();
  const centre = width / 2;
  return (
    <View style={{ width, height: pathHeight(nodes.length) }}>
      <Image {...hidden} source={PATH_SIGN.source} tintColor={colors.ink} fadeDuration={0}
        style={{ position: 'absolute', left: centre - 118, top: 8, width: PATH_SIGN.width, height: PATH_SIGN.height, opacity: 0.55 }} />
      {nodes.slice(0, -1).map((node, index) => {
        const { tile, mirrored } = trailTile(index);
        const walked = stateOf(nodes[index + 1].id) !== 'locked';
        return <Image key={`trail-${node.id}`} {...hidden} source={PATH_TRAILS[tile]} tintColor={colors.ink} fadeDuration={0}
          style={{
            position: 'absolute', top: stopY(index), width: TRAIL_WIDTH, height: STEP,
            left: mirrored ? centre - AMPLITUDE - TRAIL_PAD : centre - TRAIL_PAD,
            opacity: walked ? 1 : 0.26,
            transform: [{ scaleX: mirrored ? -1 : 1 }],
          }} />;
      })}
      {nodes.slice(0, -1).map((node, index) => {
        if (index % 2 === 0) return null;
        const middle = (offsetAt(index) + offsetAt(index + 1)) / 2;
        const prop = PATH_PROPS[(index * 5 + nodes.length) % PATH_PROPS.length];
        const x = centre + (middle >= 0 ? -1 : 1) * 104;
        return <Image key={`prop-${node.id}`} {...hidden} source={prop.source} tintColor={colors.ink} fadeDuration={0}
          style={{ position: 'absolute', left: x - prop.width / 2, top: stopY(index) + STEP / 2 - prop.height / 2, width: prop.width, height: prop.height, opacity: 0.4 }} />;
      })}
      {nodes.map((node, index) => (
        <PathStop key={node.id} node={node} index={index} centre={centre} width={width}
          state={stateOf(node.id)} number={numberOf(node.id)} selected={node.id === selectedId} onSelect={onSelect} />
      ))}
    </View>
  );
});

const STATE_LABEL: Record<QuestNodeState, string> = { locked: 'Locked', current: 'Ready to play', complete: 'Completed' };

const PathStop = memo(function PathStop({ node, index, centre, width, state, number, selected, onSelect }: {
  node: QuestNode; index: number; centre: number; width: number; state: QuestNodeState; number: number; selected: boolean;
  onSelect: (node: QuestNode) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const haptic = useHaptics();
  const { motionEnabled } = useMotionPreference();
  const boss = node.kind === 'boss';
  const size = boss ? BOSS_STOP : STOP;
  const current = state === 'current';
  const locked = state === 'locked';
  const x = centre + offsetAt(index);
  const y = stopY(index);

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
  const gap = size.width / 2 + 10;
  const label = side === 'right'
    ? { left: x + gap, width: Math.max(0, width - (x + gap) - 6), alignItems: 'flex-start' as const }
    : { left: 6, width: Math.max(0, x - gap - 6), alignItems: 'flex-end' as const };
  const kind = boss ? (node.unitBoss ? 'Unit boss' : 'Boss') : null;
  const badge = locked ? PATH_ART.badgeLock : state === 'complete' ? PATH_ART.badgeCheck : null;

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute', left: x - size.width / 2, top: y - size.height / 2, width: size.width, height: size.height,
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
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
          <View pointerEvents="none" style={styles.badge}>
            <Image {...hidden} source={PATH_ART.badgeFill} tintColor={colors.background} fadeDuration={0} style={styles.layer} />
            <Image {...hidden} source={badge} tintColor={colors.ink} fadeDuration={0} style={[styles.layer, locked && styles.dim]} />
          </View>
        ) : null}
        {node.unitBoss && !locked ? (
          <View pointerEvents="none" style={styles.crown}>
            <Image {...hidden} source={PATH_ART.badgeFill} tintColor={colors.background} fadeDuration={0} style={styles.layer} />
            <Image {...hidden} source={PATH_ART.badgeCrown} tintColor={colors.ink} fadeDuration={0} style={styles.layer} />
          </View>
        ) : null}
      </Animated.View>
      <View {...hidden} pointerEvents="none" style={[styles.label, label, { top: y - 26 }, locked && styles.dim]}>
        <Text style={[styles.number, { textAlign: side === 'right' ? 'left' : 'right' }]} numberOfLines={1}>
          {kind ? `${number} · ${kind}` : number}
        </Text>
        <Text style={[styles.title, (current || selected) && styles.titleOn, { textAlign: side === 'right' ? 'left' : 'right' }]} numberOfLines={2}>
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
  badge: { position: 'absolute', right: -5, top: -3, width: 28, height: 28 },
  crown: { position: 'absolute', left: -5, top: -3, width: 28, height: 28 },
  label: { position: 'absolute', height: 52, justifyContent: 'center' },
  // A halo of the page colour, so the landscape behind never runs through a word.
  number: { ...typography.overline, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, color: colors.textMuted, textShadowColor: colors.background, textShadowRadius: 5 },
  title: { ...typography.caption, fontSize: 13, lineHeight: 17, color: colors.textSecondary, textShadowColor: colors.background, textShadowRadius: 5 },
  titleOn: { color: colors.ink },
});
