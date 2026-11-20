import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, CourseCard, ScreenContainer, SetupQuestionHeader } from '@/components';
import { spacing } from '@/theme';
import { apCourses } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import type { RootStackParamList } from '@/navigation/types';
import { OptionGrid } from '@/components/ui/OptionGrid';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CourseSelection'>;

/**
 * Pick the AP course to study. On first run it leads to the choice of where
 * to start; from Home it switches course and goes straight back.
 */
export function CourseSelectionScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const switching = Boolean(useRoute<RouteProp<RootStackParamList, 'CourseSelection'>>().params?.switching);
  const { courseId, setCourseId } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(courseId);

  const onContinue = () => {
    if (!selected) return;
    setCourseId(selected);
    if (switching) navigation.goBack();
    else navigation.navigate('Quiz');
  };

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <SetupQuestionHeader
        onBack={switching ? () => navigation.goBack() : undefined}
        question={switching ? 'Switch subject.' : 'What are you studying?'}
        mascotPose="neutral"
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <OptionGrid>
        {apCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            selected={selected === course.id}
            onPress={() => setSelected(course.id)}
          />
        ))}
        </OptionGrid>
        <View style={styles.pad} />
      </ScrollView>

      <AppButton label={switching ? 'Switch' : 'Continue'} disabled={!selected} onPress={onContinue} />
    </ScreenContainer>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  // A gap under the list so the footer button never sits flush against a
  // card cut off by the scroll edge.
  list: { flex: 1, marginBottom: spacing.md },
  pad: { height: spacing.lg },
});
