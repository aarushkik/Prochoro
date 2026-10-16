import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mascot } from '@/components/Mascot';
import { useAppTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme';

interface WordmarkProps {
  size?: number;
  variant?: 'brand' | 'light';
}

/** Quiet typography and a drawn platypus mark keep the brand recognizable. */
export function Wordmark({ size = 34, variant = 'brand' }: WordmarkProps) {
  const theme = useAppTheme();
  const onDarkSurface = variant === 'light' || theme.isDark;
  return (
    <View style={styles.row}>
      <Mascot pose="neutral" size={size * 0.94} ink={onDarkSurface ? 'light' : 'dark'} />
      <Text style={[styles.word, { fontSize: size, color: onDarkSurface ? '#FFFFFF' : '#111111' }]}>Prochoro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontFamily: fonts.displayHeavy, letterSpacing: -1.1 },
});
