import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '@/theme';
import type { AuthProvider } from '@/state/AuthContext';

/**
 * Google and Microsoft. Apple has its own system button: see AppleSignInButton.
 *
 * Frosted white glass capsules. The sign-in screen is always on the night
 * ground, so these are always light — the same in both themes, and the same
 * white as Apple's system button that sits above them on iPhone.
 */
export function ProviderButton({ provider, busy, disabled, onPress }: { provider: Exclude<AuthProvider, 'apple'>; busy: boolean; disabled: boolean; onPress: () => void }) {
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const label = `Continue with ${provider === 'azure' ? 'Microsoft' : 'Google'}`;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && !busy && styles.disabled]}>
    {busy ? <ActivityIndicator color={palette.ink} /> : <View style={styles.row}>
      {provider === 'google' ? <GoogleMark /> : <MicrosoftMark />}
      <Text style={styles.label}>{label}</Text>
    </View>}
  </Pressable>;
}
/** Google's four-colour G, drawn to their brand geometry. */
function GoogleMark() {
  return (
    <Svg width={21} height={21} viewBox="0 0 48 48">
      <Path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <Path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <Path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <Path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </Svg>
  );
}

/** Microsoft's four squares. */
function MicrosoftMark() {
  return (
    <Svg width={19} height={19} viewBox="0 0 23 23">
      <Path fill="#F25022" d="M1 1h10v10H1z" />
      <Path fill="#7FBA00" d="M12 1h10v10H12z" />
      <Path fill="#00A4EF" d="M1 12h10v10H1z" />
      <Path fill="#FFB900" d="M12 12h10v10H12z" />
    </Svg>
  );
}

const createStyles = ({ palette, colors, solid }: AppTheme) => StyleSheet.create({
  button: {
    backgroundColor: solid ? palette.white : 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderTopColor: colors.border,
    borderLeftColor: colors.border,
    borderRightColor: colors.border,
    borderBottomColor: colors.border,
    borderRadius: 28,
    borderCurve: 'continuous',
    boxShadow: solid ? 'none' : '0 5px 18px rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: palette.ink, textAlign: 'center', flexShrink: 1 },
});
