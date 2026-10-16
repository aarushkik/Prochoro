import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from '@/components/creatures/BossSprite';
import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mascot } from '@/components/Mascot';
import { ChunkyCard } from '@/components/ui';
import { colors, fonts, palette, outlinedCard } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { drillSize } from '@/data';
import { weakSpots, weakSpotMeta } from '@/data/weakSpots';
import type { RootStackParamList } from '@/navigation/types';
import { frameworkFor, officialUnitForArea, unitBossId } from '@/data/courseFrameworks';
import { learningLevels, levelNumber } from '@/utils/learningLevels';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;
import type { QuestNode } from '@/types/quest';

interface ProgressPanelProps {
  onSelect: (node: QuestNode) => void;
  /** Switch to the map and scroll to this track. */
  onJumpToTrack: (index: number) => void;
  /** Height of the floating HUD: the panel starts below it and scrolls under it. */
  topInset?: number;
}

/**
 * Progress — the whole run, measured.
 *
 * One number at the top, because a student who opens this tab wants to know if
 * they are winning before they want a breakdown. Then the shape of the week,
 * then every track as a bar, then the three things worth drilling — each with
 * the drill attached, so noticing a weakness and acting on it is one tap.
 *
 * The boss roster lives here too. Sixty fights is progress data as much as it
 * is a menu, and it has nowhere better to be.
 */
export function BattlesPanel({ onSelect, onJumpToTrack, topInset = 0 }: ProgressPanelProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { map, stateOf, completed, earned, sessions, perfectSessions, bestStreak } = useQuest();
  const navigation = useNavigation<Nav>();
  const { courseId } = useOnboarding();
  const { streakDays, skills } = useQuest();
  const weak = useMemo(() => weakSpots(skills, courseId), [skills, courseId]);

  const { tracks, mastery, bossesBeaten, bossTotal, nextBoss } = useMemo(() => {
    const cleared = new Set(completed);
    const framework = frameworkFor(courseId);
    const rows = framework.units.map((unit, index) => {
      const nodes = unit.areas.flatMap(area => map.units[area].nodes);
      const done = nodes.filter(node => cleared.has(node.id)).length;
      return { id: 'unit-' + index, title: 'Unit ' + (index + 1), name: unit.title.startsWith('Unit ') ? 'Reading and writing' : unit.title, area: unit.areas[0], done, total: nodes.length, bossId: unitBossId(map.courseId, index)!, pct: Math.round(done / nodes.length * 100) };
    });
    const review = map.units.filter(unit => officialUnitForArea(map.courseId, unit.index) === null);
    if (review.length) {
      const nodes = review.flatMap(unit => unit.nodes); const done = nodes.filter(node => cleared.has(node.id)).length;
      rows.push({ id: 'review', title: 'Extra review', name: 'Mixed practice after the main units', area: review[0].index, done, total: nodes.length, bossId: nodes.find(node => node.kind === 'boss')!.id, pct: Math.round(done / nodes.length * 100) });
    }
    const nodes = map.units.flatMap(unit => unit.nodes);
    const bosses = framework.units.map((_, index) => nodes.find(node => node.id === unitBossId(map.courseId, index))!);
    const orderedBosses = map.order.map(id => nodes.find(node => node.id === id)!).filter(node => node.kind === 'boss');
    return {
      tracks: rows,
      mastery: learningLevels(map, completed).cleared,
      bossesBeaten: bosses.filter((b) => earned.includes(b.id)).length,
      bossTotal: bosses.length,
      nextBoss: orderedBosses.find((b) => stateOf(b.id) !== 'complete'),
    };
  }, [map, completed, earned, stateOf, courseId]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: topInset + 4 }]} scrollIndicatorInsets={{ top: topInset }} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>See what you’ve finished.</Text>
        </View>
        <Mascot pose="progress" size={132} />
      </View>

      <ChunkyCard style={styles.masteryWrap} contentStyle={styles.mastery}>
        <View style={styles.masteryTop}>
          <View>
            <Text style={styles.overline}>LEVELS CLEARED</Text>
            <Text style={styles.big}>
              {mastery}
              <Text style={styles.bigUnit}>{' / ' + map.order.length}</Text>
            </Text>
          </View>
          <View style={styles.delta}>
            <Text style={styles.deltaText}>{bossesBeaten} of {bossTotal} unit bosses</Text>
          </View>
        </View>

        <View style={styles.bars}>
          {[{ value: sessions, label: 'Sessions' }, { value: perfectSessions, label: 'Perfect sets' }, { value: bestStreak, label: 'Best streak' }].map((stat) => <View key={stat.label} style={styles.barCol}><Text style={styles.bigUnit}>{stat.value}</Text><Text style={styles.barLabel}>{stat.label}</Text></View>)}
        </View>
        <Text style={styles.weekNote}>{streakDays > 0 ? `${streakDays}-day streak. Keep a little practice in your day.` : 'Finish a practice session to start your streak.'} Levels opened by your starting check are included.</Text>
      </ChunkyCard>

      <Text style={styles.section}>YOUR AP UNITS</Text>
      <View style={styles.tight}>
        {tracks.map(row => (
          <ChunkyCard
            key={row.id}
            onPress={() => onJumpToTrack(row.area)}
            accessibilityLabel={'See ' + row.title + ', ' + row.name + '. ' + row.done + ' of ' + row.total + ' levels cleared'}
            contentStyle={styles.trackRow}
          >
            <BossSprite nodeId={row.bossId} size={36} />
            <View style={{ flex: 1, gap: 4 }}><Text style={styles.trackName}>{row.title}</Text><Text style={styles.weakMeta}>{row.name}</Text><View style={[styles.miniTrack, { width: '100%' }]}><View style={[styles.miniFill, { width: `${row.pct}%`, backgroundColor: colors.ink }]} /></View></View>
            <Text style={[styles.trackPct, { width: 48 }]}>{row.done + '/' + row.total}</Text>
          </ChunkyCard>
        ))}
      </View>

      {nextBoss ? (
        <>
          <Text style={styles.section}>NEXT BOSS</Text>
          <ChunkyCard onPress={() => onSelect(nextBoss)} style={styles.stackTop} contentStyle={styles.bossRow}>
            <BossSprite nodeId={nextBoss.id} size={76} />
            <View style={styles.bossBody}>
              <Text style={styles.bossName} numberOfLines={2}>
                {nextBoss.title}
              </Text>
              <Text style={styles.bossMeta}>
                {stateOf(nextBoss.id) === 'locked' ? 'Level ' + levelNumber(map, nextBoss.id) + ' · Finish earlier levels first' : 'Level ' + levelNumber(map, nextBoss.id) + ' · Ready to play'}
              </Text>
            </View>
          </ChunkyCard>
        </>
      ) : null}

      <Text style={[styles.section, styles.sectionWarn]}>PRACTISE THESE NEXT</Text>
      <View style={styles.stack}>
        {weak.map((w) => (
          <ChunkyCard key={w.name} contentStyle={styles.weakCard}>
            <View style={styles.weakTop}>
              <Text style={styles.weakName}>{w.name}</Text>
              <Text style={styles.weakPct}>{w.pct >= 0 ? `${w.pct}%` : '—'}</Text>
            </View>
            <Text style={styles.weakMeta}>{weakSpotMeta(w)}</Text>
            {w.pct >= 0 ? (
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${w.pct}%` }]} />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Drill ${w.name}, ${w.count} questions`}
              onPress={() =>
                navigation.navigate('Quiz', {
                  title: w.name,
                  count: drillSize(courseId, w.count),
                  xp: w.count * 5,
                  focus: [w.name],
                })
              }
              style={({ pressed }) => [styles.drill, pressed && styles.drillPressed]}
            >
              <Text style={styles.drillText}>PRACTISE · {drillSize(courseId, w.count)} QUESTIONS</Text>
            </Pressable>
          </ChunkyCard>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = ({ colors, palette, typography, stroke, glass, solid }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 130 },

  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 6 },
  headText: { flex: 1 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 32, letterSpacing: -0.6, color: colors.ink },
  subtitle: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.textSecondary, marginTop: 3 },
  headArt: { width: 132, height: 132, marginBottom: -10, marginRight: -10 },

  masteryWrap: { marginTop: 10 },
  mastery: { padding: 16 },
  masteryTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  overline: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.6, color: colors.textMuted },
  big: { fontFamily: fonts.displayHeavy, fontSize: 46, lineHeight: 48, color: colors.ink, marginTop: 2 },
  bigUnit: { fontSize: 22, color: colors.textMuted },
  delta: {
    marginBottom: 6,
    ...outlinedCard(glass),
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  deltaText: { fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: colors.primaryDeep },

  bars: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  barCol: { flex: 1, alignItems: 'center', gap: 7 },
  // A day is hit or it is not. A bar height would imply a volume the app does
  // not measure.
  day: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 34,
    borderRadius: 12,
    borderWidth: stroke.surface,
    borderColor: colors.overlay,
    backgroundColor: colors.overlayFaint,
  },
  dayHit: { backgroundColor: colors.primary, borderColor: colors.border },
  dayToday: { borderColor: colors.border },
  barLabel: { fontFamily: fonts.bodyHeavy, fontSize: 10, color: colors.textFaint },
  barLabelToday: { color: colors.ink },
  weekNote: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.textMuted, marginTop: 12 },

  section: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.6, color: colors.textMuted, marginTop: 20 },
  sectionWarn: { color: palette.ember },
  tight: { marginTop: 9, gap: 7 },
  stack: { marginTop: 9, gap: 9 },
  stackTop: { marginTop: 9 },

  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 11 },
  trackName: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 13.5, color: colors.ink },
  miniTrack: {
    width: 88,
    height: 9,
    borderRadius: 6,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  miniFill: { height: '100%' },
  trackPct: { fontFamily: fonts.displayHeavy, fontSize: 13, color: colors.textSecondary, width: 34, textAlign: 'right' },

  bossRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13 },
  bossBody: { flex: 1, minWidth: 0 },
  bossName: { fontFamily: fonts.displayHeavy, fontSize: 17, lineHeight: 19, color: colors.ink },
  bossMeta: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.textMuted, marginTop: 1 },

  weakCard: { paddingHorizontal: 15, paddingVertical: 13 },
  weakTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weakName: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 14.5, color: colors.ink },
  weakPct: { fontFamily: fonts.displayHeavy, fontSize: 18, color: palette.ember },
  weakMeta: { fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  barTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 7,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: palette.ember },
  drill: {
    marginTop: 11,
    backgroundColor: palette.ember,
    borderWidth: 1,
    borderColor: colors.primary,
    boxShadow: 'none',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  drillPressed: { transform: [{ translateY: 2 }], opacity: 0.92 },
  drillText: { fontFamily: fonts.bodyBlack, fontSize: 12.5, letterSpacing: 0.2, color: colors.textOnPrimary },
});
