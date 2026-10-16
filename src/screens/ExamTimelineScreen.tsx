import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, ChoiceCard, ExamIcon, ScreenContainer, SetupQuestionHeader } from '@/components';
import { colors, spacing } from '@/theme';
import { examTimeframes } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { ExamTimeframeId } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExamTimeline'>;

/** Setup step: when is the AP exam? Drives pacing/urgency. */
export function ExamTimelineScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { examTimeframeId, setExamTimeframeId } = useOnboarding();
  const [selected, setSelected] = useState<ExamTimeframeId | null>(examTimeframeId);

  const onContinue = () => {
    if (!selected) return;
    setExamTimeframeId(selected);
    navigation.navigate('AchievementPreview');
  };

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={() => navigation.goBack()}
        step={4}
        total={5}
        question="When is your exam?"
        subtitle="Keep your goal and timeline in view."
        mascotPose="thinking"
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {examTimeframes.map((t) => (
          <ChoiceCard
            key={t.id}
            icon={<ExamIcon id={t.id} size={44} />}
            label={t.label}
            description={t.description}
            selected={selected === t.id}
            onPress={() => setSelected(t.id)}
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
