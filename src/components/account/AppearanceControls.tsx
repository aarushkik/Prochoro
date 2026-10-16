import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme, useAppearancePreference } from '@/theme/ThemeProvider';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

const options = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const;

export function AppearanceControls() {
  const { typography, colors } = useAppTheme();
  const { preference, setPreference, error } = useAppearancePreference();
  return <View style={{ marginBottom: 24 }}>
    <Text style={[typography.overline, { marginBottom: 12 }]}>Appearance</Text>
    <SegmentedControl items={options} value={preference} onChange={setPreference} />
    <Text style={[typography.caption, { marginTop: 10 }]}>Light, dark, or matched to your device.</Text>
    {error ? <Text accessibilityRole="alert" style={[typography.caption, { color: colors.ink, marginTop: 10 }]}>{error}</Text> : null}
  </View>;
}
