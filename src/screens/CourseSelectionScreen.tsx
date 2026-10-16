import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, CourseCard, ScreenContainer, SetupQuestionHeader } from '@/components';
import { spacing } from '@/theme';
import { apCourses } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CourseSelection'>;

/** Setup step 1: pick the AP course to study. */
export function CourseSelectionScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { courseId, setCourseId } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(courseId);

  const onContinue = () => {
    if (!selected) return;
    setCourseId(selected);
    navigation.navigate('SubjectExperience');
  };

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={() => navigation.goBack()}
        step={1}
        total={5}
        question="Choose your AP subject."
        subtitle="Choose one course for this quest."
        mascotPose="neutral"
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {apCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            selected={selected === course.id}
            onPress={() => setSelected(course.id)}
          />
        ))}
        <View style={styles.pad} />
      </ScrollView>

      <AppButton label="Continue" disabled={!selected} onPress={onContinue} />
    </ScreenContainer>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  // A gap under the list so the footer button never sits flush against a
  // card cut off by the scroll edge.
  list: { flex: 1, marginBottom: spacing.md },
  pad: { height: spacing.lg },
});
