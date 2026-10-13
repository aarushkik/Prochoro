import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Glyph } from '@/components/icons';
import { BossSprite } from '@/components/creatures/BossSprite';
import { ACTIVITY_ART } from '@/data/illustrations';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, glossRound, spring, typography } from '@/theme';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { TrackTheme } from '@/data/tracks';
import type { QuestNode, QuestNodeState } from '@/types/quest';

/**
 * One stop on the path.
 *
 * State is carried by the *fill*, kind by the *emblem inside it*. That split
 * is what lets a student scan a whole track at once: cleared stops are the
 * track's own colour, the one to play next is orange and half again as big,
 * sealed ones are sand. What each stop actually is comes second, read from the
 * shape in the middle.
 *
 * There is exactly one current stop on the map, and it is the only thing that
 * animates — a pulsing ring and a fixed flag. Everything else is still, so
 * the eye goes straight to it.
 */

export const STOP_SIZE = 70;
export const CURRENT_SIZE = 96;
/** A touch wider than the biggest node, so two words fit per line. */
const LABEL_WIDTH = 150;

const LIP = 7;
const CURRENT_LIP = 8;

/** Diameter a stop occupies, so the path can place it before rendering. */
export function nodeSizeFor(state: QuestNodeState): number {
  return state === 'current' ? CURRENT_SIZE : STOP_SIZE;
}

interface QuestNodeButtonProps {
  node: QuestNode;
  state: QuestNodeState;
  track: TrackTheme;
  onPress: () => void;
  animated?: boolean;
}

export function QuestNodeButton({ node, state, track, onPress, animated = true }: QuestNodeButtonProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { motionEnabled } = useMotionPreference();
  const current = state === 'current';
  const done = state === 'complete';
  const locked = state === 'locked';

  const size = current ? CURRENT_SIZE : STOP_SIZE;
  const lip = current ? CURRENT_LIP : LIP;

  const fill = done ? track.deep : current ? colors.current : locked ? colors.locked : colors.surface;
  const shadow = done ? track.dark : current ? colors.currentDeep : colors.border;

  const press = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const flag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current || !animated || !motionEnabled) { pulse.setValue(0); flag.setValue(0); return; }
    const ring = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    ring.start();
    return () => {
      ring.stop();
    };
  }, [current, pulse, flag, animated, motionEnabled]);

  const to = (v: number) => {
    if (!motionEnabled) { press.setValue(v); return; }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, lip - 2] });

  return (
    <View style={styles.slot} pointerEvents="box-none">
      {current ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: size + 32,
                height: size + 32,
                borderRadius: (size + 32) / 2,
                marginLeft: -(size + 32) / 2,
                opacity: pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.85, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.5] }) }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flag,
              {
                transform: [
                  { rotate: flag.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
                ],
              },
            ]}
          >
            <Text style={styles.flagText}>START</Text>
          </Animated.View>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${node.title}, ${STATE_LABEL[state]}`}
        // Sealed stops are still tappable. Most of the map is locked, and a
        // stop that does nothing at all when tapped reads as broken; the sheet
        // can at least say what it is and what opens it.
        accessibilityHint={locked ? "Opens details and the unlock requirement" : "Opens quest details"}
        accessibilityState={{ disabled: false }}
        onPressIn={() => to(1)}
        onPressOut={() => to(0)}
        onPress={onPress}
        style={{ width: size, height: size + lip }}
      >
        <View style={[styles.lip, { top: lip, borderRadius: size, backgroundColor: shadow }]} />
        <Animated.View
          style={[
            styles.face,
            {
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: fill,
              transform: [{ translateY }],
            },
          ]}
        >
          <View pointerEvents="none" style={glossRound(size, locked ? 0.16 : current ? 0.2 : 0.28)} />
          <Emblem node={node} state={state} track={track} size={size} />
          {node.kind === 'boss' && done ? <View style={{position:'absolute',bottom:3,right:6,backgroundColor:colors.surface,borderRadius:12,padding:3}}><Glyph name="check" size={13} color={colors.successDeep} strokeWidth={3}/></View> : null}
        </Animated.View>
      </Pressable>

      <Text
        style={[styles.label, current && styles.labelCurrent, locked && styles.labelLocked]}
        numberOfLines={2}
      >
        {node.title.toUpperCase()}
      </Text>
    </View>
  );
}

const STATE_LABEL: Record<QuestNodeState, string> = {
  locked: 'locked',
  current: 'ready to start',
  complete: 'completed',
};

/** Kind remains visible on locked stops so the path reads as a varied itinerary. */
function Emblem({ node, state, size }: {node:QuestNode;state:QuestNodeState;track:TrackTheme;size:number}) {
  const appTheme = useAppTheme();
  const { colors } = appTheme;

  if (node.kind === 'boss') return <BossSprite nodeId={node.id} size={size * 0.96} dim={state === 'locked'} />;
  if (state === 'complete') return <Glyph name="check" size={size * 0.4} color={colors.white} strokeWidth={2.6} />;
  return <Image source={ACTIVITY_ART[node.kind]} style={{ width: size * 0.65, height: size * 0.65, opacity: state === 'locked' ? 0.62 : 1 }} resizeMode="contain" accessibilityIgnoresInvertColors />;
}

const createStyles = ({ colors, palette, typography, stroke }: AppTheme) => StyleSheet.create({
  slot: { alignItems: 'center' },
  lip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  face: {
    borderWidth: stroke.control,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // Clips the highlight into a crescent. See `glossRound`.
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    top: -16,
    left: '50%',
    borderWidth: stroke.focus,
    borderColor: colors.current,
  },
  flag: {
    position: 'absolute',
    top: -34,
    backgroundColor: colors.nightRaised,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  flagText: { ...typography.overline, fontSize: 11, letterSpacing: 1.4, color: colors.textOnInk },

  /**
   * Stop labels are centred on a 70–96pt node but the titles are real unit
   * topics — "Water and hydrogen bonding" is 26 characters. Unbounded and on
   * one line they ran the full width of the screen, straight through the
   * mascot on one side and the scenery props on the other. Bounded to a little
   * wider than the widest node and allowed a second line, they stay inside the
   * lane the path already occupies.
   */
  label: {
    ...typography.overline,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginTop: 8,
    width: LABEL_WIDTH,
    textAlign: 'center',
  },
  labelCurrent: { fontSize: 12, lineHeight: 15, color: colors.ink },
  labelLocked: { color: colors.textSecondary },

});
