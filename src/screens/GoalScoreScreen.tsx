import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, ChoiceCard, ScoreGoalIcon, ScreenContainer, SetupQuestionHeader } from '@/components';
import { colors, spacing } from '@/theme';
import { scoreGoals } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { ScoreGoalId } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GoalScore'>;

/** Setup step: what AP score is the student chasing? */
export function GoalScoreScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { goalScoreId, setGoalScoreId } = useOnboarding();
  const [selected, setSelected] = useState<ScoreGoalId | null>(goalScoreId);

  const onContinue = () => {
    if (!selected) return;
    setGoalScoreId(selected);
    navigation.navigate('ExamTimeline');
  };

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={() => navigation.goBack()}
        step={3}
        total={5}
        question="Your target score?"
        subtitle="We’ll aim your quest at this target."
        mascotPose="excited"
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {scoreGoals.map((goal) => (
          <ChoiceCard
            key={goal.id}
            icon={<ScoreGoalIcon id={goal.id} size={44} />}
            label={goal.label}
            description={goal.description}
            selected={selected === goal.id}
            onPress={() => setSelected(goal.id)}
          />
        ))}
        <View style={styles.pad} />
      </ScrollView>

      <AppButton label="Continue" disabled={!selected} onPress={onContinue} />
    </ScreenContainer>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  list: { flex: 1 },
  pad: { height: spacing.giant },
});
