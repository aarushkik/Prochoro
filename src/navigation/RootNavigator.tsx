import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { Mascot } from '@/components/Mascot';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/screens/SplashScreen';
import { IntroScreen } from '@/screens/IntroScreen';
import { CourseSelectionScreen } from '@/screens/CourseSelectionScreen';
import { SubjectExperienceScreen } from '@/screens/SubjectExperienceScreen';
import { GoalScoreScreen } from '@/screens/GoalScoreScreen';
import { ExamTimelineScreen } from '@/screens/ExamTimelineScreen';
import { AchievementPreviewScreen } from '@/screens/AchievementPreviewScreen';
import { PlacementResultScreen } from '@/screens/PlacementResultScreen';
import { LessonCompleteScreen } from '@/screens/LessonCompleteScreen';
import { QuizScreen } from '@/screens/QuizScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { CharactersScreen } from '@/screens/CharactersScreen';
import { SignInScreen } from '@/screens/SignInScreen';
import { useAuth } from '@/state/AuthContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { useProfileSync } from '@/state/ProfileSync';
import { fonts, palette } from '@/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * One stack for the whole app.
 *
 * Signed out you get Splash → SignIn and nothing else. Signed in, setup runs
 * linearly — Intro → CourseSelection →
 * SubjectExperience → GoalScore → ExamTimeline → AchievementPreview → Quiz →
 * PlacementResult — and lands on Home, the quest map. From there the map opens
 * Quiz again as a session and comes back through LessonComplete. Headers are
 * hidden; every screen supplies its own back or close control.
 */
export function RootNavigator() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { session, restoring, recovering, signOut } = useAuth();
  const { reduceMotion } = useMotionPreference();
  const { loading, blocked, error, retry } = useProfileSync();
  const { onboarded } = useOnboarding();

  // Hold on the brand ground while the keychain is read and the profile is
  // fetched. Rendering a stack first and swapping it a frame later shows a
  // returning student either a login form or a setup flow they already
  // finished — and a navigator swap mid-flight loses their place.
  if (restoring || (session && loading)) {
    return <View style={styles.holding}><Mascot size={112} pose="reading" shadow={false} /><Text style={styles.title}>Opening your field guide…</Text><ActivityIndicator color={palette.turquoiseLight} /></View>;
  }
  if (blocked && session && !recovering) {
    return <View style={styles.holding}><Mascot size={112} pose="worried" shadow={false} /><Text style={styles.title}>Let’s reconnect.</Text><Text style={styles.message}>{error}</Text><View style={styles.actions}><AppButton label="Try again" onPress={retry} /><AppButton label="Back to sign in" tone="secondary" onPress={signOut} /></View></View>;
  }

  /**
   * Two separate stacks rather than one with a guard.
   *
   * A signed-out user has no Home route in their navigator at all, so there is
   * nothing to deep-link into, nothing to `navigate` to by mistake, and no
   * frame where a protected screen mounts before a redirect fires. Signing out
   * swaps the stack, which unmounts everything behind it.
   *
   * Everything past sign-in needs an account; there is no guest way in.
   */
  if (!session || recovering) {
    return (
      <Stack.Navigator key={recovering ? 'recovery' : 'signed-out'} initialRouteName={recovering ? 'SignIn' : 'Splash'} screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
      </Stack.Navigator>
    );
  }

  /**
   * How screens arrive. Steps forward — the setup questions, the field guide —
   * push in the platform's own way, so on iPhone they slide and can be swiped
   * back. A lesson rises from the bottom, because it is something you step
   * into and close, not somewhere you go. Results and Home cross-fade: they
   * replace what was there rather than stacking on it.
   */
  const motion = (kind: 'push' | 'rise' | 'swap') =>
    reduceMotion ? 'none' as const : kind === 'push' ? 'default' as const : kind === 'rise' ? 'slide_from_bottom' as const : 'fade' as const;

  return (
    <Stack.Navigator
      key={session.user.id}
      initialRouteName={onboarded ? 'Home' : 'Intro'}
      screenOptions={{
        headerShown: false,
        animation: motion('push'),
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="CourseSelection" component={CourseSelectionScreen} />
      <Stack.Screen name="SubjectExperience" component={SubjectExperienceScreen} />
      <Stack.Screen name="GoalScore" component={GoalScoreScreen} />
      <Stack.Screen name="ExamTimeline" component={ExamTimelineScreen} />
      <Stack.Screen name="AchievementPreview" component={AchievementPreviewScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: motion('rise') }} />
      <Stack.Screen name="PlacementResult" component={PlacementResultScreen} options={{ animation: motion('swap') }} />
      <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} options={{ animation: motion('swap') }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ animation: motion('swap') }} />
      <Stack.Screen name="Characters" component={CharactersScreen} />
    </Stack.Navigator>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  holding: { flex: 1, backgroundColor: palette.night, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 24, color: palette.cream, textAlign: 'center' },
  message: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: '#BDD2D6', maxWidth: 380, textAlign: 'center' },
  actions: { width: '100%', maxWidth: 380, gap: 16, marginTop: 12 },
});
