import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from './BossSprite';
import { Mascot } from '@/components/Mascot';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ProgressBar } from '@/components/ui';
import { AreaIllustration } from '@/components/ui/AreaBackdrop';
import { bossForNode } from '@/data/bosses';
import { bossBattle } from '@/utils/bossBattle';
import { useMotionPreference } from '@/hooks/useMotionPreference';

export interface DuelMove { id: number; correct: boolean; damage: number; finisher?: boolean }

/** A question-driven battle: real HP loss, hit reactions and a passing-score finisher. */
export function BossEncounter({ nodeId, correct, attempted, total, damageTotal = total, reviewPending = false, move = null, finalStrike = false, onMoveComplete }: {
  nodeId: string; correct: number; attempted: number; total: number;
  damageTotal?: number; reviewPending?: boolean;
  move?: DuelMove | null; finalStrike?: boolean; onMoveComplete?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 740 || fontScale > 1.2;
  const { motionEnabled } = useMotionPreference();
  const impact = useRef(new Animated.Value(0)).current;
  const complete = useRef(onMoveComplete); complete.current = onMoveComplete;
  const boss = bossForNode(nodeId)!;
  const battle = bossBattle(correct, attempted, total, finalStrike, damageTotal);
  useEffect(() => {
    impact.setValue(0);
    if (!move) return;
    if (!motionEnabled) { complete.current?.(); return; }
    const animation = Animated.timing(impact, { toValue: 1, duration: move.finisher ? 650 : 420, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) complete.current?.(); });
    return () => animation.stop();
  }, [move?.id, motionEnabled, impact]);
  const attack = move?.correct;
  const heroX = impact.interpolate({ inputRange: [0, 0.32, 0.6, 1], outputRange: attack ? [0, move?.finisher ? 52 : 28, 0, 0] : [0, 0, -12, 0] });
  const bossX = impact.interpolate({ inputRange: [0, 0.32, 0.6, 1], outputRange: attack ? [0, 0, 14, 0] : [0, -28, 0, 0] });
  const recoil = impact.interpolate({ inputRange: [0, 0.32, 0.6, 1], outputRange: attack ? [1, 1, 0.9, 1] : [1, 1.04, 1, 1] });
  const hitFlash = impact.interpolate({ inputRange: [0, 0.32, 0.48, 0.65, 1], outputRange: attack ? [1, 1, 0.25, 1, 1] : [1, 1, 1, 1, 1] });
  const message = move?.finisher ? 'Final strike!' : battle.defeated ? `${boss.name} defeated.` : move ? move.correct ? `Hit! −${move.damage} HP` : `Counterattack! −${move.damage} HP. Learn their weak spot below.` : reviewPending ? 'Review round ahead. Keep your charge.' : battle.canFinish ? 'Final strike ready. Finish this boss.' : correct >= battle.target ? 'Strike charged. Complete the question set.' : `${battle.target - correct} more correct to charge your final strike.`;
  return <GlassSurface style={[styles.card, compact && styles.compact]}>
    <AreaIllustration kind={boss.kind} opacity={0.14} />
    <View style={styles.healthRow}>
      <View style={styles.playerHealth}><Text style={styles.smallName}>You · {battle.playerHealth} HP</Text><ProgressBar progress={battle.playerHealth / 100} height={4} /></View>
      <View style={styles.enemyHealth} accessible accessibilityLabel={`${boss.name}, ${battle.bossHealth} health remaining`}>
        <View style={styles.enemyTitle}><Text style={styles.bossName}>{boss.name}</Text><Text style={styles.hp}>{battle.bossHealth} HP</Text></View>
        <ProgressBar progress={battle.bossHealth / 100} height={7} />
      </View>
    </View>
    <View style={[styles.arena, compact && styles.arenaCompact]}>
      <Animated.View style={{ transform: [{ translateX: heroX }] }}><Mascot size={compact ? 58 : 94} pose={move ? move.correct ? 'bossWin' : 'wince' : battle.defeated ? 'bossWin' : 'bossReady'} /></Animated.View>
      <View style={styles.encounterCopy}><Text style={styles.phase}>{move?.finisher ? 'FINISHER' : battle.defeated ? 'VICTORY' : 'BOSS DUEL'}</Text><Text style={styles.combo}>{battle.defeated && !move?.finisher ? 'Cleared' : correct >= battle.target ? 'Ready' : `${correct} / ${battle.target}`}</Text><Text style={styles.charge}>{battle.defeated && !move?.finisher ? 'well played' : 'final strike'}</Text></View>
      <Animated.View style={{ opacity: battle.defeated && !move ? 0.35 : hitFlash, transform: [{ translateX: bossX }, { scale: recoil }] }}><BossSprite nodeId={nodeId} size={compact ? 72 : 120} /></Animated.View>
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.note}>{compact ? message.replace('more correct to charge your final strike.', 'more to charge final strike.').replace(' Learn their weak spot below.', '') : message}</Text>
  </GlassSurface>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 28, padding: 16, marginHorizontal: 16, marginTop: 10, overflow: 'hidden' },
  compact: { paddingVertical: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 26 },
  playerHealth: { flex: 0.8, gap: 6 }, enemyHealth: { flex: 1.2, gap: 7 },
  smallName: { ...typography.caption, fontSize: 10, color: colors.ink },
  enemyTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bossName: { ...typography.subtitle, fontSize: 14, lineHeight: 17, flexShrink: 1 }, hp: { ...typography.caption, fontSize: 10, fontVariant: ['tabular-nums'] },
  arena: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 4 },
  arenaCompact: { paddingVertical: 0 },
  encounterCopy: { alignItems: 'center', minWidth: 55 },
  phase: { ...typography.overline, fontSize: 8, letterSpacing: 0.8 },
  combo: { ...typography.numeral, fontSize: 17, lineHeight: 21, marginTop: 4 },
  charge: { ...typography.caption, fontSize: 8, lineHeight: 13 },
  note: { ...typography.caption, fontSize: 10, lineHeight: 15, textAlign: 'center', color: colors.ink },
});
