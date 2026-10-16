import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Mascot, Wordmark } from '@/components';
import { palette, typography } from '@/theme';

/** A short, still brand transition. Never an artificial multi-second wait. */
export function SplashScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation();
  useEffect(() => {
    const timer = setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] }), 450);
    return () => clearTimeout(timer);
  }, [navigation]);
  return <View style={styles.root}>
    <StatusBar style="light" />
    <View style={styles.emblem}><Mascot size={170} pose="excited" shadow={false} ink="dark" /></View>
    <Wordmark size={40} variant="light" />
    <Text style={styles.tagline}>Your AP quest starts here.</Text>
  </View>;
}
const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.night, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emblem: { width: 204, height: 204, backgroundColor: colors.surface, borderRadius: 102, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 7, borderColor: '#111111' },
  tagline: { ...typography.tagline, color: palette.turquoiseLight },
});
