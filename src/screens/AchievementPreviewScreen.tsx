import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, QuestStep, ScreenContainer, SetupQuestionHeader } from '@/components';
import { accents, spacing } from '@/theme';
import { achievementsByCategory, getCourse } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AchievementPreview'>;

/** Setup screen 3: preview the quest ahead as a milestone timeline. */
export function AchievementPreviewScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { courseId } = useOnboarding();

  const course = getCourse(courseId);
  const accent = course ? accents[course.accent] : accents.pink;
  const steps = achievementsByCategory[course?.category ?? 'stem'];

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={() => navigation.goBack()}
        step={5}
        total={5}
        question="Your study path."
        subtitle="From the foundations to exam day."
        mascotPose="excited"
      />

      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {steps.map((step, i) => (
          <QuestStep
            key={step.title}
            index={i}
            total={steps.length}
            icon={step.icon}
            title={step.title}
            description={step.description}
            color={accent.base}
            tint={accent.soft}
          />
        ))}
        <View style={styles.pad} />
      </ScrollView>

      <AppButton label="Continue" onPress={() => navigation.navigate('Quiz')} />
    </ScreenContainer>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  timeline: { flex: 1 },
  pad: { height: spacing.giant },
});
