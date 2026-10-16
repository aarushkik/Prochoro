import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Glyph } from '@/components/icons';
import { BossSprite } from '@/components/creatures/BossSprite';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { spring } from '@/theme';
import type { TrackTheme } from '@/data/tracks';
import type { QuestNode, QuestNodeState } from '@/types/quest';

export const STOP_SIZE = 68;
export const CURRENT_SIZE = 84;
export function nodeSizeFor(state: QuestNodeState): number {
  return state === 'current' ? CURRENT_SIZE : STOP_SIZE;
}

/** A clear, outlined stop. Only a deliberate press moves it. */
export function QuestNodeButton({ node, state, onPress }: {
  node: QuestNode;
  state: QuestNodeState;
  track: TrackTheme;
  onPress: () => void;
  animated?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { motionEnabled } = useMotionPreference();
  const press = useRef(new Animated.Value(0)).current;
  const size = nodeSizeFor(state);
  const current = state === 'current';
  const locked = state === 'locked';
  const done = state === 'complete';
  const to = (value: number) => {
    if (!motionEnabled) { press.setValue(value); return; }
    Animated.spring(press, { toValue: value, useNativeDriver: true, ...(value ? spring.press : spring.release) }).start();
  };
  return (
    <View style={styles.slot} pointerEvents="box-none">
      {current ? <View style={styles.next}><Text style={styles.nextText}>Next</Text></View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${node.title}, ${STATE_LABEL[state]}`}
        accessibilityHint={locked ? 'Opens details and the unlock requirement' : 'Opens quest details'}
        onPress={onPress}
        onPressIn={() => to(1)}
        onPressOut={() => to(0)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      >
        <Animated.View style={[styles.face, {
          width: size, height: size, borderRadius: size / 2,
          borderColor: current ? colors.ink : colors.border,
          borderWidth: current ? 1.5 : 1,
          transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95], extrapolate: 'clamp' }) }],
        }]}>
          {node.kind === 'boss' ? <BossSprite nodeId={node.id} size={size * 0.88} dim={locked} /> : <ActivityIllustration id={node.kind} size={size * 0.65} dim={locked} />}
          {done ? <View style={styles.completed}><Glyph name="check" size={11} color={colors.ink} strokeWidth={2.5} /></View> : null}
        </Animated.View>
      </Pressable>
      <Text style={[styles.label, current && styles.labelCurrent, locked && styles.labelLocked]} numberOfLines={2}>{node.title}</Text>
    </View>
  );
}
const STATE_LABEL: Record<QuestNodeState, string> = { locked: 'locked', current: 'ready to start', complete: 'completed' };
const createStyles = ({ colors, card, typography }: AppTheme) => StyleSheet.create({
  slot: { alignItems: 'center' },
  face: { ...card, alignItems: 'center', justifyContent: 'center' },
  next: { position: 'absolute', top: -25, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.ink },
  nextText: { ...typography.caption, fontSize: 10, lineHeight: 14, color: colors.ink },
  completed: { position: 'absolute', right: -2, top: -1, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.caption, fontSize: 11, lineHeight: 15, marginTop: 10, width: 138, textAlign: 'center', color: colors.textSecondary },
  labelCurrent: { color: colors.ink },
  labelLocked: { opacity: 0.7 },
});
