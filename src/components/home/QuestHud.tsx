import React from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import { Wordmark } from '@/components/ui/Wordmark';
import { companionById } from '@/data/companions';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';

/** A named pet and the app name. Reward totals live in Progress. */
export function QuestHud({ equippedId, onOpenCharacters, onLayout }: {
  equippedId?: string; onOpenCharacters?: () => void; onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const styles = useThemedStyles(createStyles); const insets = useSafeAreaInsets();
  const pet = companionById(equippedId ?? null);
  return <View pointerEvents="box-none" onLayout={onLayout} style={[styles.dock, { paddingTop: insets.top + 8 }]}>
    <GlassSurface style={styles.bar}><Wordmark size={23} /><Pressable accessibilityRole="button" accessibilityLabel={(pet?.name ?? 'Your pet') + '. Change pet in Options'} onPress={onOpenCharacters} style={({ pressed }) => [styles.pet, pressed && { opacity: 0.6 }]}><CompanionSprite id={equippedId ?? 'mira'} size={36} /><View><Text style={styles.small}>Your pet</Text><Text style={styles.name}>{pet?.name ?? 'Choose'}</Text></View></Pressable></GlassSurface>
  </View>;
}
const createStyles = ({ typography }: AppTheme) => StyleSheet.create({
  dock: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 8 },
  bar: { borderRadius: 30, minHeight: 58, paddingLeft: 19, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pet: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 7, borderRadius: 24 },
  small: { ...typography.caption, fontSize: 9, lineHeight: 13 }, name: { ...typography.label, fontSize: 12, lineHeight: 17 },
});
