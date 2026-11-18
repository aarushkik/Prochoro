import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Backdrop } from './Backdrop';
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { useScreenLayout } from '@/hooks/useScreenLayout';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Scroll the content (default) or lay it out in a plain flex View. */
  scroll?: boolean;
  /** Horizontal screen padding. */
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  edges?: Edge[];
}

/**
 * Standard screen shell: safe-area aware, themed background, optional scroll.
 * Every screen renders inside one so padding and safe areas stay consistent.
 */
export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  background,
  contentStyle,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const pad = padded ? styles.padded : undefined;
  const layout = useScreenLayout();
  // Setup and summary screens read best a little narrower than the home
  // column: a form spread across a whole desktop window is hard to scan.
  const width = layout.wide ? { maxWidth: Math.min(layout.column, 980) } : null;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <Backdrop base={background} />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, width, pad, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, width, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: spacing.lg, width: '100%', maxWidth: 680, alignSelf: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  padded: { paddingHorizontal: spacing.xl },
});
