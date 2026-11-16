import React from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import { Wordmark } from '@/components/ui/Wordmark';
import { UtilityIllustration } from '@/components/ui/UtilityIllustration';
import { companionById } from '@/data/companions';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';

/** The app name, today's streak and your pet. Other totals live in Progress. */
export function QuestHud({ equippedId, streak = 0, onOpenCharacters, onLayout }: {
  equippedId?: string; streak?: number; onOpenCharacters?: () => void; onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const styles = useThemedStyles(createStyles); const insets = useSafeAreaInsets();
  const pet = companionById(equippedId ?? null);
  return <View pointerEvents="box-none" onLayout={onLayout} style={[styles.dock, { paddingTop: insets.top + 8 }]}>
    <GlassSurface style={styles.bar}><Wordmark size={23} /><View style={styles.spacer} /><View style={[styles.streak, streak === 0 && styles.idle]} accessible accessibilityLabel={streak + '-day streak'}><UtilityIllustration id="streak" size={24} /><Text style={styles.count}>{streak}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={(pet?.name ?? 'Your pet') + '. Change pet in Options'} onPress={onOpenCharacters} style={({ pressed }) => [styles.pet, pressed && { opacity: 0.6 }]}><CompanionSprite id={equippedId ?? 'mira'} size={36} /></Pressable></GlassSurface>
  </View>;
}
const createStyles = ({ typography }: AppTheme) => StyleSheet.create({
  dock: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 8 },
  bar: { borderRadius: 30, minHeight: 58, paddingLeft: 19, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  spacer: { flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 44, paddingHorizontal: 6 }, idle: { opacity: 0.45 }, count: { ...typography.numeral, fontSize: 16 },
  pet: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
});
