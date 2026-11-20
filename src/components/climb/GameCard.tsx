import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BossSprite } from '@/components/creatures/BossSprite';
import { Glyph, type GlyphName } from '@/components/icons';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { STATS, STAT_NAME, statOf, type Card, type CharmId, type Stat } from '@/utils/climb';

export const STAT_ICON: Record<Stat, GlyphName> = { recall: 'book', logic: 'brain', insight: 'bulb' };
const WIDTH = { sm: 104, md: 140, lg: 164 } as const;

/**
 * A rival as a playing card: its art, name and rank, and the three stats it
 * battles with. Face down it shows only its back, the way a rival's card
 * waits until the stat is chosen. `highlight` marks the stat being compared.
 */
export function GameCard({ card, size = 'md', faceDown = false, highlight, selected = false, dim = false, charms = [], onPress, note }: {
  card: Card; size?: keyof typeof WIDTH; faceDown?: boolean; highlight?: Stat | null;
  selected?: boolean; dim?: boolean; charms?: readonly CharmId[]; onPress?: () => void; note?: string;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const width = WIDTH[size];
  const label = faceDown ? 'Face-down card' : `${card.name}, ${card.rarity}. ${STATS.map((stat) => `${STAT_NAME[stat]} ${statOf(card, stat, charms)}`).join(', ')}${note ? '. ' + note : ''}`;
  const body = faceDown ? (
    <View style={[styles.card, styles.back, { width, height: width * 1.36 }]}>
      <View style={styles.backInner}><Text style={styles.backMark}>?</Text></View>
    </View>
  ) : (
    <View style={[styles.card, { width }, selected && styles.selected, dim && styles.dim]}>
      <Text style={styles.rarity} numberOfLines={1}>{card.rarity.toUpperCase()}</Text>
      <BossSprite kind={card.kind} tier={card.tier} size={width * 0.58} />
      <Text style={[styles.name, size === 'sm' && styles.nameSmall]} numberOfLines={1}>{card.name}</Text>
      <View style={styles.stats}>
        {STATS.map((stat) => {
          const on = highlight === stat;
          return (
            <View key={stat} style={[styles.stat, on && { backgroundColor: colors.ink }]}>
              <Glyph name={STAT_ICON[stat]} size={size === 'sm' ? 13 : 15} color={on ? colors.background : colors.ink} />
              <Text style={[styles.value, size === 'sm' && styles.valueSmall, on && { color: colors.background }]}>{statOf(card, stat, charms)}</Text>
            </View>
          );
        })}
      </View>
      {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={label}>{body}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{body}</Pressable>;
}

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 8, alignItems: 'center' },
  selected: { borderWidth: 3, transform: [{ translateY: -4 }] },
  dim: { opacity: 0.45 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  back: { backgroundColor: colors.ink, padding: 6, justifyContent: 'center' },
  backInner: { flex: 1, alignSelf: 'stretch', borderRadius: 12, borderWidth: 1.5, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  backMark: { ...typography.display, fontSize: 40, lineHeight: 46, color: colors.background },
  rarity: { ...typography.overline, fontSize: 8, letterSpacing: 1.2, alignSelf: 'flex-start', marginLeft: 4 },
  name: { ...typography.subtitle, fontSize: 13, lineHeight: 17, marginTop: 2 },
  nameSmall: { fontSize: 12, lineHeight: 15 },
  stats: { flexDirection: 'row', gap: 3, marginTop: 6, alignSelf: 'stretch', justifyContent: 'space-between' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingVertical: 3 },
  value: { ...typography.numeral, fontSize: 13, lineHeight: 16, fontVariant: ['tabular-nums'] },
  valueSmall: { fontSize: 12, lineHeight: 15 },
  note: { ...typography.caption, fontSize: 10, marginTop: 4 },
});
