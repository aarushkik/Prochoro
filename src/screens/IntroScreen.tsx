import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, Mascot, ScreenContainer, SpeechBubble, TopBackButton } from '@/components';
import { spacing } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

/**
 * Friendly hand-off before setup: Stu introduces what's about to happen via a
 * speech bubble, then a single CONTINUE moves into the questions.
 */
export function IntroScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer>
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      {/* Intro is the first screen after sign-in, so usually there is
          nowhere to go back to — and an arrow that does nothing is worse
          than no arrow. */}
      {navigation.canGoBack() ? <TopBackButton onPress={() => navigation.goBack()} /> : null}

      <View style={styles.center}>
        <SpeechBubble
          text="Hi! Let’s build a study path that fits you."
          tail="bottom"
          style={styles.bubble}
        />
        <View style={styles.gap} />
        <Mascot size={170} pose="excited" animated />
      </View>

      <AppButton label="Continue" onPress={() => navigation.navigate('CourseSelection')} />
    </ScreenContainer>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: { marginHorizontal: spacing.sm },
  gap: { height: spacing.xxl },
});
