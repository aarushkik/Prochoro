import React, { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuest } from '@/state/QuestContext';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import { Glyph } from '@/components/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { unlockLabel } from '@/data/companions';
import { useScreenLayout } from '@/hooks/useScreenLayout';

/** Pet selection is a single tap, with the choice visible and saved immediately. */
/** `perRow` defaults to two on a phone and four on a wider screen. */
export function PetOptions({ perRow }: { perRow?: number } = {}) {
  const { companions, equippedId, equip } = useQuest();
  const styles = useThemedStyles(createStyles);
  const haptic = useHaptics();
  const layout = useScreenLayout();
  const across = perRow ?? (layout.wide ? 4 : 2);
  const cell = { flexBasis: across === 2 ? '45%' : across === 3 ? '30%' : '22%' } as const;
  const [showLocked, setShowLocked] = useState(false);
  const [note, setNote] = useState('');
  const available = companions.filter(p => p.owned);
  const locked = companions.filter(p => !p.owned);
  return <View style={styles.section}>
    <Text style={styles.title}>Your pet</Text>
    {note ? <Text style={styles.note} accessibilityLiveRegion="polite">{note}</Text> : null}
    <View accessibilityRole="radiogroup" accessibilityLabel="Choose your pet" style={styles.grid}>
      {available.map(pet => {
        const selected = pet.id === equippedId;
        return <Pressable key={pet.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} accessibilityLabel={pet.name + '. ' + pet.ability + (selected ? '. Selected' : '. Tap to use')} onPress={() => {
          if (selected) return;
          equip(pet.id); haptic();
          const message = pet.name + ' selected. ' + pet.ability + '.';
          setNote(message); AccessibilityInfo.announceForAccessibility(message);
        }} style={({ pressed }) => [styles.pet, cell, selected && styles.selected, pressed && styles.pressed]}>
          <View style={styles.petTop}><CompanionSprite id={pet.id} size={56 * layout.scale} /><View style={styles.state}><Glyph name={selected ? 'check' : 'plus'} size={16} /></View></View>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.ability}>{pet.ability}</Text>
        </Pressable>;
      })}
    </View>
    {locked.length ? <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showLocked }} onPress={() => setShowLocked(value => !value)} style={styles.more}><Text style={styles.moreText}>{showLocked ? 'Hide locked pets' : 'More pets to unlock'}</Text><Glyph name={showLocked ? 'chevron-up' : 'chevron-down'} size={18} /></Pressable>
      {showLocked ? <View style={[styles.lockedList, layout.wide && styles.lockedGrid]}>{locked.map(pet => <View key={pet.id} style={[styles.locked, layout.wide && styles.lockedCell]} accessible accessibilityLabel={pet.name + '. Locked. ' + unlockLabel(pet)}><CompanionSprite id={pet.id} size={44} dim /><View style={styles.lockedCopy}><Text style={styles.name}>{pet.name}</Text><Text style={styles.ability}>{unlockLabel(pet)}</Text></View><Glyph name="lock" size={16} /></View>)}</View> : null}
    </> : null}
  </View>;
}
const createStyles = ({ colors, typography, glass }: AppTheme) => StyleSheet.create({
  section: { gap: 12 }, title: { ...typography.heading, fontSize: 22 },
  note: { ...typography.body, fontSize: 14, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pet: { flexGrow: 1, minWidth: 120, borderRadius: 24, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: glass.card, gap: 5 },
  selected: { borderColor: colors.ink, borderWidth: 2, padding: 13 }, pressed: { opacity: 0.7 },
  petTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  state: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.subtitle, fontSize: 16 }, ability: { ...typography.caption, fontSize: 12, lineHeight: 17 },
  tag: { ...typography.label, fontSize: 12, marginTop: 3 }, tip: { ...typography.caption, fontSize: 12 },
  more: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreText: { ...typography.label, fontSize: 14 }, lockedList: { gap: 8 },
  locked: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 }, lockedCopy: { flex: 1 },
  lockedGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 }, lockedCell: { flexBasis: '45%', flexGrow: 1 },
});
