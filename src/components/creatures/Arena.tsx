import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Mascot } from '@/components/Mascot';
import type { MascotPose } from '@/components/Mascot/Mascot.types';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ProgressBar } from '@/components/ui';
import { AreaIllustration } from '@/components/ui/AreaBackdrop';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { Countdown } from '@/hooks/useCountdown';
import type { SkylineKind } from '@/data/tracks';

/** One exchange of blows, played once: who strikes, and the number that flies up. */
export interface ArenaMove { id: number; kind: 'hit' | 'crit' | 'hurt' | 'timeout' | 'blocked' | 'finisher'; amount: string }

/**
 * The battle card shared by boss levels and the endless climb: both health
 * bars, the platypus and the rival, a clock that drains toward the rival's
 * next strike, and the blow itself — a lunge, a recoil, a shake when you are
 * the one hit, and the damage rising off whoever took it.
 */
export function Arena({ backdrop, rival, rivalName, rivalHealth, rivalLabel, playerHealth, playerLabel, playerExtra, phase, headline, detail, message, move, onMoveComplete, clock, clockLive = false, defeated = false }: {
  backdrop: SkylineKind;
  rival: (size: number) => React.ReactNode;
  rivalName: string; rivalHealth: number; rivalLabel: string;
  playerHealth: number; playerLabel: string; playerExtra?: React.ReactNode;
  phase: string; headline: string; detail: string; message: string;
  move: ArenaMove | null; onMoveComplete?: () => void;
  clock?: Countdown | null; clockLive?: boolean; defeated?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 740 || fontScale > 1.2;
  const { motionEnabled } = useMotionPreference();
  const impact = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const complete = useRef(onMoveComplete);
  complete.current = onMoveComplete;

  useEffect(() => {
    impact.setValue(0);
    if (!move) return;
    if (!motionEnabled) { complete.current?.(); return; }
    const animation = Animated.timing(impact, { toValue: 1, duration: move.kind === 'finisher' ? 700 : move.kind === 'crit' ? 560 : 460, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) complete.current?.(); });
    return () => animation.stop();
  }, [move?.id, motionEnabled, impact]);

  // The last stretch of the clock: the rival winds up for its strike.
  const danger = Boolean(clock && clockLive && clock.left <= Math.max(5, Math.ceil(clock.total * 0.3)));
  useEffect(() => {
    if (!danger || !motionEnabled) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [danger, motionEnabled, pulse]);

  const ours = move ? ['hit', 'crit', 'finisher'].includes(move.kind) : false;
  const far = move?.kind === 'finisher' ? 56 : move?.kind === 'crit' ? 40 : 28;
  const heroX = impact.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ours ? [0, far, 0, 0] : [0, 0, -12, 0] });
  const rivalX = impact.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ours ? [0, 0, 16, 0] : [0, -30, 0, 0] });
  const recoil = impact.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ours ? [1, 1, 0.88, 1] : [1, 1.05, 1, 1] });
  const flash = impact.interpolate({ inputRange: [0, 0.3, 0.45, 0.62, 1], outputRange: ours ? [1, 1, 0.2, 1, 1] : [1, 1, 1, 1, 1] });
  const hurt = move?.kind === 'hurt' || move?.kind === 'timeout';
  const shake = impact.interpolate({ inputRange: [0, 0.35, 0.45, 0.55, 0.65, 0.75, 1], outputRange: hurt ? [0, 0, -7, 6, -4, 2, 0] : [0, 0, 0, 0, 0, 0, 0] });
  const rise = impact.interpolate({ inputRange: [0, 0.3, 1], outputRange: [6, 0, -30] });
  const fade = impact.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const wind = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const heroSize = compact ? 60 : 94;
  const rivalSize = compact ? 74 : 120;
  const pose: MascotPose = move ? ours ? 'bossWin' : 'wince' : defeated ? 'bossWin' : 'bossReady';
  const popup = (text: string, side: 'hero' | 'rival') => (
    <Animated.Text pointerEvents="none" style={[styles.popup, side === 'hero' ? styles.popupHero : styles.popupRival, move?.kind === 'crit' && styles.popupCrit, { opacity: fade, transform: [{ translateY: rise }] }]}>{text}</Animated.Text>
  );

  return <Animated.View style={{ transform: [{ translateX: shake }] }}>
    <GlassSurface style={[styles.card, compact && styles.compact]}>
      <AreaIllustration kind={backdrop} opacity={0.14} />
      <View style={styles.healthRow}>
        <View style={styles.player}><Text style={styles.smallName} numberOfLines={1}>{playerLabel}</Text>{playerExtra ?? <ProgressBar progress={playerHealth} height={4} />}</View>
        <View style={styles.enemy} accessible accessibilityLabel={`${rivalName}, ${rivalLabel}`}>
          <View style={styles.enemyTitle}><Text style={styles.rivalName} numberOfLines={1}>{rivalName}</Text><Text style={styles.hp}>{rivalLabel}</Text></View>
          <ProgressBar progress={rivalHealth} height={7} />
        </View>
      </View>
      <View style={[styles.arena, compact && styles.arenaCompact]}>
        <Animated.View style={{ transform: [{ translateX: heroX }] }}>
          <Mascot size={heroSize} pose={pose} />
          {move && !ours ? popup(move.amount, 'hero') : null}
        </Animated.View>
        <View style={styles.centre}><Text style={styles.phase}>{phase}</Text><Text style={styles.headline}>{headline}</Text><Text style={styles.detail}>{detail}</Text></View>
        <Animated.View style={{ opacity: defeated && !move ? 0.35 : flash, transform: [{ translateX: rivalX }, { scale: Animated.multiply(recoil, wind) }] }}>
          {rival(rivalSize)}
          {move && ours ? popup(move.amount, 'rival') : null}
        </Animated.View>
      </View>
      {clock ? (
        <View style={styles.clock} accessible accessibilityLabel={`${clock.left} seconds left`}>
          <View style={[styles.clockTrack, danger && { borderColor: colors.danger }]}>
            <Animated.View style={[styles.clockFill, danger && { backgroundColor: colors.danger }, { transform: [{ scaleX: clock.progress }] }]} />
          </View>
          <Text style={[styles.clockText, danger && { color: colors.danger }]}>{clock.left}s</Text>
        </View>
      ) : null}
      <Text accessibilityLiveRegion="polite" style={styles.note} numberOfLines={2}>{message}</Text>
    </GlassSurface>
  </Animated.View>;
}

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 28, padding: 16, marginHorizontal: 16, marginTop: 10, overflow: 'hidden' },
  compact: { paddingVertical: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  player: { flex: 0.8, gap: 6 }, enemy: { flex: 1.2, gap: 7 },
  smallName: { ...typography.caption, fontSize: 10, color: colors.ink },
  enemyTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rivalName: { ...typography.subtitle, fontSize: 14, lineHeight: 17, flexShrink: 1 }, hp: { ...typography.caption, fontSize: 10, fontVariant: ['tabular-nums'] },
  arena: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 4 },
  arenaCompact: { paddingVertical: 0 },
  centre: { alignItems: 'center', minWidth: 64 },
  phase: { ...typography.overline, fontSize: 8, letterSpacing: 0.8 },
  headline: { ...typography.numeral, fontSize: 18, lineHeight: 22, marginTop: 4 },
  detail: { ...typography.caption, fontSize: 9, lineHeight: 13 },
  popup: { position: 'absolute', top: -6, alignSelf: 'center', ...typography.numeral, fontSize: 18, lineHeight: 22, color: colors.ink, textShadowColor: colors.background, textShadowRadius: 6 },
  popupHero: { left: 0, right: 0, textAlign: 'center' },
  popupRival: { left: 0, right: 0, textAlign: 'center' },
  popupCrit: { fontSize: 22, lineHeight: 26 },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 },
  clockTrack: { flex: 1, height: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  clockFill: { flex: 1, backgroundColor: colors.ink, transformOrigin: 'left' },
  clockText: { ...typography.numeral, fontSize: 12, lineHeight: 15, minWidth: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
  note: { ...typography.caption, fontSize: 10.5, lineHeight: 15, textAlign: 'center', color: colors.ink },
});
