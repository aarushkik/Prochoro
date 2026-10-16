import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from '@/components/creatures/BossSprite';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { ProgressBar } from '@/components/ui';
import { useHaptics } from '@/hooks/useHaptics';
import { fonts, rimOf } from '@/theme';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { UtilityIllustration } from '@/components/ui/UtilityIllustration';
import type { QuestNode } from '@/types/quest';
import { CourseIllustration } from '@/components/ui/CourseIllustration';

/** A student's next step stays within one tap, even after a placement head start. */
export function NextQuestCard({
  node,
  course,
  courseId,
  todayCount,
  dailyGoal,
  onContinue,
  active,
}: {
  node: QuestNode | null;
  course: string;
  courseId: string | null;
  todayCount: number;
  dailyGoal: number;
  onContinue: () => void;
  active: boolean;
}) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const goalMet = todayCount >= dailyGoal;
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.25;
  const haptic = useHaptics();
  const left = Math.max(0, dailyGoal - todayCount);

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <View style={styles.headingBody}>
          <Text style={styles.eyebrow}>{course}</Text>
          <Text style={styles.heading}>{todayCount > 0 ? 'Look at you go.' : 'Make a little progress.'}</Text>
        </View>
        <View style={styles.compass} aria-hidden>
          <CourseIllustration courseId={courseId ?? ''} size={54} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={node ? `Continue quest: ${node.title}, about ${node.minutes} minutes` : 'Explore practice after completing your path'}
        onPress={() => { haptic(); onContinue(); }}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <GlassSurface style={styles.card}>
        <View style={styles.cardTop}>
        <View style={styles.cardBody}>
          <Text style={styles.kicker}>{node?.kind === 'boss' ? 'NEXT BOSS' : node ? 'PICK UP HERE' : 'YOUR NEXT CHAPTER'}</Text>
          <Text style={styles.title}>{node?.title ?? 'Keep your knowledge growing'}</Text>
          <Text style={styles.meta}>
            {node ? `About ${node.minutes} min · up to ${node.xp} base XP` : 'Revisit a topic or try a practice set.'}
          </Text>
        </View>
        {!compact ? <View style={styles.mascot} pointerEvents="none" aria-hidden>
          {node?.kind === 'boss' ? <BossSprite nodeId={node.id} size={106}/> : <Mascot pose={node?.kind === 'drill' ? 'reading' : node ? 'map' : 'trophy'} size={106} animated={active} shadow={false} />}
        </View> : null}
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{node ? 'Continue' : 'Open practice'}</Text>
          <View style={styles.arrow}><Glyph name="arrow-right" size={18} color={colors.textOnPrimary} strokeWidth={2} /></View>
        </View>
        </GlassSurface>
      </Pressable>

      <View style={[styles.goal, goalMet && rimOf(colors.successDeep)]} accessible accessibilityLabel={`${todayCount} of ${dailyGoal} daily sessions completed. ${goalMet ? 'Daily goal reached.' : `${left} more to reach your daily goal.`}`}>
        <View style={styles.goalHeading}>
          <View style={[styles.goalIcon, goalMet && { backgroundColor: colors.successSoft }]}>
            {goalMet ? <Glyph name="check" size={18} color={colors.ink} strokeWidth={2} /> : <UtilityIllustration id="streak" size={26} />}
          </View>
          <View style={styles.headingBody}>
            <Text style={styles.goalText}>{goalMet ? 'Goal reached' : 'Today’s goal'}</Text>
            <Text style={styles.goalDetail}>{goalMet ? 'Anything more today is a bonus.' : `${left} more ${left === 1 ? 'session' : 'sessions'} to go.`}</Text>
          </View>
          <Text style={styles.goalCount}>{todayCount}<Text style={styles.goalTotal}>/{dailyGoal}</Text></Text>
        </View>
        <View importantForAccessibility="no-hide-descendants" aria-hidden style={{ height: 8 }}>
          <ProgressBar progress={dailyGoal > 0 ? Math.min(todayCount / dailyGoal, 1) : 0} height={8} color={goalMet ? colors.successDeep : colors.primary} />
        </View>
      </View>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, card }: AppTheme) => StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headingBody: { flex: 1 },
  eyebrow: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.4, color: colors.textSecondary, textTransform: 'uppercase' },
  heading: { fontFamily: fonts.displayHeavy, fontSize: 25, lineHeight: 29, color: colors.ink, marginTop: 3, maxWidth: 280 },
  compass: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  pressable: { borderRadius: 30 },
  card: { borderRadius: 30, padding: 20, overflow: 'hidden' },
  pressed: { opacity: 0.96, transform: [{ scale: 0.98 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardBody: { flex: 1, minWidth: 0, paddingVertical: 4 },
  kicker: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.2, color: colors.textSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 25, lineHeight: 30, color: colors.ink, marginTop: 7 },
  meta: { fontFamily: fonts.bodySemibold, fontSize: 12, lineHeight: 18, color: palette.hero.body, marginTop: 10 },
  cta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 10, paddingLeft: 18, paddingRight: 10, marginTop: 20, minHeight: 48 },
  ctaText: { flexShrink: 1, fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.textOnPrimary },
  arrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  mascot: { width: 102, alignItems: 'center' },
  goal: { ...card, marginTop: 14, padding: 13, borderRadius: 18, gap: 12 },
  goalHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  goalIcon: { width: 32, height: 36, borderRadius: 11, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  goalText: { fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: colors.ink },
  goalDetail: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: colors.textSecondary, marginTop: 2 },
  goalCount: { fontFamily: fonts.displayHeavy, fontSize: 24, color: colors.ink },
  goalTotal: { fontSize: 15, color: colors.textSecondary },
});
