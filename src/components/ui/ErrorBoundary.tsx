import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, palette, stroke } from '@/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render crash and shows it.
 *
 * Without this, any exception thrown while rendering unmounts the whole tree
 * and leaves a blank screen — no message, nothing to tap, and on a device no
 * console to read either. "The app is blank" is then the only bug report you
 * get, which is close to useless.
 *
 * It deliberately shows the real error text rather than a friendly apology.
 * This is a small app shipped by one person; the fastest path from a user
 * saying "it broke" to a fix is them being able to read what broke.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Kept as a console error so it still lands in `npx expo start` output and
    // in any crash reporter added later.
    console.error('[Prochoro] render crash:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Something broke</Text>
          <Text style={styles.body}>
            Prochoro hit an error it could not recover from. The details below are what to send if
            you report it.
          </Text>

          <View style={styles.box}>
            <Text style={styles.mono} selectable>
              {error.message || String(error)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ error: null })}
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.night },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, gap: 14 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 30, color: colors.white },
  body: { fontFamily: fonts.bodySemibold, fontSize: 14, lineHeight: 20, color: '#D1D1D1' },
  box: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: stroke.surface,
    borderColor: palette.ember,
    borderRadius: 18,
    padding: 14,
  },
  mono: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: '#E6E6E6' },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.primary,
    borderWidth: stroke.control,
    borderColor: colors.ink,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  retryPressed: { transform: [{ translateY: 2 }] },
  retryText: { fontFamily: fonts.bodyBlack, fontSize: 15, color: colors.ink },
});
