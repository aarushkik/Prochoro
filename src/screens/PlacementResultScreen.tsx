import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, ScreenContainer } from '@/components/ui';
import { CourseIllustration } from '@/components/ui/CourseIllustration';
import { Glyph, PlacementIcon } from '@/components/icons';
import { Mascot } from '@/components/Mascot';
import { colors, radius, shadows, spacing, typography, fonts } from '@/theme';
import { getCourse, getScoreGoal, PLACEMENT_LEVELS } from '@/data';
import { getQuestMap, headStartFor } from '@/data/questMap';
import { useOnboarding } from '@/state/OnboardingContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlacementResult'>;

/**
 * The reveal at the end of placement: which level the student landed on, and —
 * the part that actually matters — how much of the quest map that opens. Saying
 * "your map opens at stop 10" makes the result concrete before they ever see it.
 */
export function PlacementResultScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { courseId, goalScoreId, placementLevelId, markOnboarded } = useOnboarding();

  const course = getCourse(courseId);
  const goal = getScoreGoal(goalScoreId);
  const level = PLACEMENT_LEVELS[placementLevelId ?? 'beginner'];
  const map = getQuestMap(courseId);
  const headStart = headStartFor(placementLevelId);

  const scale = useRef(new Animated.Value(0.5)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    scale.setValue(1); fade.setValue(1); shift.setValue(0);
  }, [scale, fade, shift]);

  // Setup is finished here and nowhere else. Marking it saves through
  // `ProfileSync`, so the next sign-in on any device opens straight on the map.
  const startQuest = () => {
    markOnboarded();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
          <Mascot size={182} pose="celebrate" />
        </Animated.View>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: shift }] }}>
          <Text style={[typography.title, styles.title]}>You’re ready to play</Text>

          <View style={styles.levelWrap}>
            <View style={styles.levelCard}>
              <View style={styles.levelTile}>
                <PlacementIcon id={level.id} size={52} />
              </View>
              <Text style={styles.levelLabel}>Your starting point</Text>
              <Text style={typography.heading}>{"Level " + (headStart + 1)}</Text>
              <Text style={[typography.bodyStrong, styles.headline]}>Clear one level to open the next.</Text>
              <Text style={[typography.body, styles.desc]}>Your starting point is based on your setup choices and any placement answers.</Text>
            </View>
          </View>

          <View style={styles.summaryWrap}>
            <View style={styles.summary}>
            <Row
              leading={
                course ? <CourseIllustration courseId={course.id} size={32} /> : null
              }
              text={course?.name ?? 'Your course'}
            />
            <View style={styles.divider} />
            <Row leading={<Glyph name="target" size={20} color={colors.textSecondary} strokeWidth={2.1} />} text={goal?.label ?? 'Your goal'} />
            <View style={styles.divider} />
            <Row
              leading={<Glyph name="map" size={20} color={colors.textSecondary} strokeWidth={2.1} />}
              text={
                headStart > 0
                  ? `${headStart} levels opened by your starting check`
                  : "Start at Level 1"
              }
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Start playing" icon="play" emphasis onPress={startQuest} />
      </View>
    </ScreenContainer>
  );
}

function Row({ leading, text }: { leading: React.ReactNode; text: string }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.summaryRow}>
      <View style={styles.rowIcon}>{leading}</View>
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, stroke, card }: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  title: { textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },

  // Wrapper, lip, face — in that order. The lip used to be a sibling *inside*
  // the card, which meant it painted over the card's own cream fill and left
  // every line of text sitting on turquoise.
  levelWrap: { position: 'relative', marginBottom: 5 },
  levelCard: {
    ...card,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
  },
  levelTile: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    borderWidth: stroke.surface,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryAbbr: { fontFamily: fonts.displayHeavy, fontSize: 13, color: colors.primaryDeep },
  levelLabel: { ...typography.overline, color: colors.primary, marginBottom: spacing.xs },
  headline: { color: colors.primaryDeep, textAlign: 'center', marginTop: spacing.xs },
  desc: { textAlign: 'center', marginTop: spacing.sm },

  summaryWrap: { alignSelf: 'stretch', position: 'relative', marginTop: spacing.xl, marginBottom: 4 },
  summary: {
    ...card,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowIcon: { width: 24, alignItems: 'center' },
  summaryText: { ...typography.bodyStrong, flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.overlayStrong },

  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
});
