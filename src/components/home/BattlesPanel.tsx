import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from '@/components/creatures/BossSprite';
import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MASCOT_ART } from '@/components/Mascot';
import { ChunkyCard, PropBadge } from '@/components/ui';
import { colors, fonts, palette, litRim, tintedCard } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { drillSize } from '@/data';
import { SIGNATURE_PROP } from '@/data/props';
import { weakSpots, weakSpotMeta } from '@/data/weakSpots';
import type { RootStackParamList } from '@/navigation/types';

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
    const rows = map.units.map((unit) => {
      const done = unit.nodes.filter((n) => cleared.has(n.id)).length;
      return {
        unit,
        done,
        pct: Math.round((done / unit.nodes.length) * 100),
      };
    });
    const bosses = map.units.flatMap((u) => u.nodes.filter((n) => n.kind === 'boss'));
    return {
      tracks: rows,
      mastery: Math.round((cleared.size / map.order.length) * 100),
      bossesBeaten: bosses.filter((b) => earned.includes(b.id)).length,
      bossTotal: bosses.length,
      nextBoss: bosses.find((b) => stateOf(b.id) !== 'complete'),
    };
  }, [map, completed, earned, stateOf]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: topInset + 4 }]} scrollIndicatorInsets={{ top: topInset }} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Every track, measured.</Text>
        </View>
        <Image source={MASCOT_ART.progress} style={styles.headArt} resizeMode="contain" />
      </View>

      <ChunkyCard style={styles.masteryWrap} contentStyle={styles.mastery}>
        <View style={styles.masteryTop}>
          <View>
            <Text style={styles.overline}>PATH EXPLORED</Text>
            <Text style={styles.big}>
              {mastery}
              <Text style={styles.bigUnit}>%</Text>
            </Text>
          </View>
          <View style={styles.delta}>
            <Text style={styles.deltaText}>{bossesBeaten} of {bossTotal} checks</Text>
          </View>
        </View>

        <View style={styles.bars}>
          {[{ value: sessions, label: 'Sessions' }, { value: perfectSessions, label: 'Perfect sets' }, { value: bestStreak, label: 'Best streak' }].map((stat) => <View key={stat.label} style={styles.barCol}><Text style={styles.bigUnit}>{stat.value}</Text><Text style={styles.barLabel}>{stat.label}</Text></View>)}
        </View>
        <Text style={styles.weekNote}>{streakDays > 0 ? `${streakDays}-day streak. Keep a little practice in your day.` : 'Finish a practice session to start your streak.'} Path progress includes your placement head start.</Text>
      </ChunkyCard>

      <Text style={styles.section}>TRACK BY TRACK</Text>
      <View style={styles.tight}>
        {tracks.map(({ unit, pct }, i) => (
          <ChunkyCard
            key={unit.id}
            onPress={() => onJumpToTrack(i)}
            accessibilityLabel={`Go to ${unit.track.place} on the map`}
            contentStyle={styles.trackRow}
          >
            {/* The track's own landmark. A row for Tidepool Flats shows
                the lighthouse that actually stands there, which makes the
                list a set of places rather than ten coloured dots. */}
            <PropBadge name={SIGNATURE_PROP[unit.track.kind]} tint={unit.track.sky} size={36} radius={13} />
            <Text style={styles.trackName} numberOfLines={1}>
              {unit.track.place}
            </Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: unit.track.deep }]} />
            </View>
            <Text style={styles.trackPct}>{pct}%</Text>
          </ChunkyCard>
        ))}
      </View>

      {nextBoss ? (
        <>
          <Text style={styles.section}>NEXT CHECK</Text>
          <ChunkyCard onPress={() => onSelect(nextBoss)} style={styles.stackTop} contentStyle={styles.bossRow}>
            <BossSprite nodeId={nextBoss.id} size={76} />
            <View style={styles.bossBody}>
              <Text style={styles.bossName} numberOfLines={2}>
                {nextBoss.title}
              </Text>
              <Text style={styles.bossMeta}>
                {nextBoss.minutes} min · {nextBoss.xp} XP
              </Text>
            </View>
          </ChunkyCard>
        </>
      ) : null}

      <Text style={[styles.section, styles.sectionWarn]}>NEEDS WORK</Text>
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
              <Text style={styles.drillText}>DRILL THIS · {drillSize(courseId, w.count)} QUESTIONS</Text>
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
    ...tintedCard(glass, colors.primaryTint, colors.primary, solid),
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
    ...litRim(0.55),
    boxShadow: solid ? 'none' : '0 4px 12px rgba(18,48,60,0.14)',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  drillPressed: { transform: [{ translateY: 2 }], opacity: 0.92 },
  drillText: { fontFamily: fonts.bodyBlack, fontSize: 12.5, letterSpacing: 1, color: colors.white },
});
