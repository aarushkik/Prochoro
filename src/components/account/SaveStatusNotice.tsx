import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Glyph } from '@/components/icons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { useProfileSync } from '@/state/ProfileSync';

/** Persistence failures belong beside progress, not hidden inside settings. */
export function SaveStatusNotice() {
  const styles = useThemedStyles(createStyles);
  const { offline, error, retry } = useProfileSync();
  if (!offline && !error) return null;
  return (
    <GlassSurface style={styles.notice}>
      <Glyph name="refresh" size={18} />
      <View style={styles.copy} accessibilityLiveRegion="polite">
        <Text style={styles.title}>{error ? 'Progress not saved yet' : 'Saved on this device'}</Text>
        <Text style={styles.detail}>{error ?? 'It will sync to your account when you are back online.'}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Retry saving progress" onPress={retry} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.6 }]}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </GlassSurface>
  );
}

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  notice: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginBottom: 12, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderRadius: 24 },
  copy: { flex: 1, minWidth: 0, paddingVertical: 4 },
  title: { ...typography.label, fontSize: 12.5, lineHeight: 17, color: colors.ink },
  detail: { ...typography.caption, fontSize: 11.5, lineHeight: 16 },
  retry: { minWidth: 60, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  retryText: { ...typography.label, fontSize: 12.5, color: colors.ink },
});
