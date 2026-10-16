import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  type Theme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { AuthProviderComponent } from "@/state/AuthContext";
import { OnboardingProvider } from "@/state/OnboardingContext";
import { ProfileSync } from "@/state/ProfileSync";
import { QuestProvider } from "@/state/QuestContext";
import { RootNavigator } from "@/navigation/RootNavigator";
import { ErrorBoundary, WebFocusStyle } from "@/components/ui";
import { colors } from "@/theme";
import { ThemeProvider, useAppTheme } from '@/theme/ThemeProvider';

/**
 * App entry point. Loads the brand fonts, then wires up providers, the
 * navigation theme, and the stack.
 *
 * Provider order matters: auth is outermost because everything below it is
 * scoped to a signed-in user. Setup choices live in <OnboardingProvider> and
 * map progress in <QuestProvider>, which reads from it.
 */

export default function App() {
  return <ThemeProvider><ThemedApp /></ThemeProvider>;
}

function ThemedApp() {
  const { colors, isDark } = useAppTheme();
  const navTheme: Theme = { ...DefaultTheme, dark: isDark, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, primary: colors.primary, text: colors.textPrimary, border: colors.border } };
  const [fontsLoaded, fontError] = useFonts({
    Figtree_500Medium: require('@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf'),
    Figtree_600SemiBold: require('@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf'),
    Figtree_700Bold: require('@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf'),
  });

  /**
   * Hold on the brand ground until the fonts are ready — but never forever.
   *
   * The font files are bundled locally; a failed native font load is recoverable. If that fails, or is
   * simply slow on a bad connection, blocking on `fontsLoaded` alone leaves
   * the app as a blank coloured rectangle with nothing on it and no way out.
   * An error, or two seconds, is enough: the app renders in the system font,
   * which is far better than not rendering at all.
   */
  const [waitedForFonts, setWaitedForFonts] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaitedForFonts(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError && !waitedForFonts) {
    return <View style={{ flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', gap: 18 }}><Text style={{ color: colors.ink, fontSize: 28, fontWeight: '700' }}>Prochoro</Text><ActivityIndicator color={colors.primaryLight} /></View>;
  }

  return (
    <SafeAreaProvider>
      <WebFocusStyle />
      {/* Outermost, so a crash anywhere below shows a readable error rather
          than an unexplained blank screen. */}
      <ErrorBoundary>
        {/* Auth wraps everything: the navigator decides which stack exists at
          all from the session, so there is no route a signed-out user could
          reach even by deep link. */}
        <AuthProviderComponent>
          <OnboardingProvider>
            <QuestProvider>
              {/* Inside both state providers, because it hydrates them. */}
              <ProfileSync>
                <NavigationContainer theme={navTheme}>
                  <RootNavigator />
                </NavigationContainer>
              </ProfileSync>
            </QuestProvider>
          </OnboardingProvider>
        </AuthProviderComponent>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
