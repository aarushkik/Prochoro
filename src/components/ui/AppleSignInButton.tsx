import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleSignInAvailable } from '@/state/AuthContext';
import { useAppTheme } from '@/theme/ThemeProvider';

interface AppleSignInButtonProps {
  disabled?: boolean;
  onPress: () => void;
}

/** Matches ProviderButton — a capsule — so the three options read as one stack. */
const HEIGHT = 56;
const RADIUS = HEIGHT / 2;

/**
 * Apple's own Sign in with Apple button, drawn by the system.
 *
 * Not a custom button with an Apple glyph. The Human Interface Guidelines
 * allow only Apple's button styles and wording for this control, and App
 * Review rejects home-made versions — the previous one drew the logo from a
 * private-use character that only renders on Apple platforms and showed an
 * empty box everywhere else.
 *
 * White on the night ground the sign-in screen always uses; "Continue", to
 * match the Google and Microsoft labels beside it. Renders nothing until the
 * device confirms it can show the system sheet, so it never offers a button
 * that would fail.
 */
export function AppleSignInButton({ disabled = false, onPress }: AppleSignInButtonProps) {
  const theme = useAppTheme();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let alive = true;
    void appleSignInAvailable().then((value) => { if (alive) setAvailable(value); });
    return () => { alive = false; };
  }, []);

  if (!available) return null;

  return (
    <View style={[styles.wrap, { borderColor: theme.colors.border }, disabled && styles.disabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={theme.isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
        cornerRadius={RADIUS}
        style={styles.button}
        accessibilityState={{ disabled }}
        onPress={() => { if (!disabled) onPress(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10, borderWidth: 1, borderRadius: RADIUS, overflow: 'hidden' },
  button: { width: '100%', height: HEIGHT },
  disabled: { opacity: 0.5 },
});
