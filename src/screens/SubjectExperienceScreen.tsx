import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, LevelOptionCard, ScreenContainer, SetupQuestionHeader } from '@/components';
import { spacing } from '@/theme';
import { experienceLevels, getCourse } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { ExperienceLevelId } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SubjectExperience'>;

/** Setup screen 1: how much of the chosen subject the student already knows. */
export function SubjectExperienceScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { courseId, experienceLevelId, setExperienceLevelId } = useOnboarding();
  const [selected, setSelected] = useState<ExperienceLevelId | null>(experienceLevelId);

  const course = getCourse(courseId);
  const question = `How familiar is ${course?.name ?? 'this course'}?`;

  const onContinue = () => {
    if (!selected) return;
    setExperienceLevelId(selected);
    navigation.navigate('GoalScore');
  };

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={() => navigation.goBack()}
        step={2}
        total={5}
        question={question}
        subtitle="This helps us find your starting point."
        mascotPose="thinking"
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {experienceLevels.map((level) => (
          <LevelOptionCard
            key={level.id}
            label={level.label}
            hint={level.hint}
            bars={level.bars}
            selected={selected === level.id}
            onPress={() => setSelected(level.id)}
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
