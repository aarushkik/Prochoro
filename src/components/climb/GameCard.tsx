import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BossSprite } from '@/components/creatures/BossSprite';
import { Glyph, type GlyphName } from '@/components/icons';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { STATS, STAT_NAME, statOf, type Card, type CharmId, type Stat } from '@/utils/climb';

export const STAT_ICON: Record<Stat, GlyphName> = { recall: 'book', logic: 'brain', insight: 'bulb' };
const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic' } as const;

/**
 * A rival as a playing card: name and rank on top, its art, then one row per
 * stat. Rows keep every number on its own line, so nothing crowds at any
 * width; under 120 points wide the labels drop and only icons stay. Face
 * down it shows only its back. `highlight` inverts the stat being compared.
 */
export function GameCard({ card, width = 150, faceDown = false, highlight, selected = false, dim = false, charms = [], onPress }: {
  card: Card; width?: number; faceDown?: boolean; highlight?: Stat | null;
  selected?: boolean; dim?: boolean; charms?: readonly CharmId[]; onPress?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const compact = width < 120;
  const height = Math.round(width * 1.42);
  const label = faceDown ? 'Face-down card' : `${card.name}, ${RARITY_LABEL[card.rarity]}. ${STATS.map((stat) => `${STAT_NAME[stat]} ${statOf(card, stat, charms)}`).join(', ')}`;
  const body = faceDown ? (
    <View style={[styles.card, styles.back, { width, height }]}>
      <View style={styles.backInner}><Text style={[styles.backMark, { fontSize: width * 0.3, lineHeight: width * 0.36 }]}>?</Text></View>
    </View>
  ) : (
    <View style={[styles.card, { width, minHeight: height }, selected && styles.selected, dim && styles.dim]}>
      <Text style={[styles.name, { fontSize: compact ? 12 : 14, lineHeight: compact ? 15 : 18 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{card.name}</Text>
      <Text style={styles.rarity} numberOfLines={1}>{RARITY_LABEL[card.rarity].toUpperCase()}</Text>
      <View style={styles.art}><BossSprite kind={card.kind} tier={card.tier} size={width * (compact ? 0.62 : 0.55)} /></View>
      <View style={styles.stats}>
        {STATS.map((stat) => {
          const on = highlight === stat;
          const tint = on ? colors.background : colors.ink;
          return (
            <View key={stat} style={[styles.row, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
              <Glyph name={STAT_ICON[stat]} size={compact ? 12 : 14} color={tint} />
              {compact ? null : <Text style={[styles.statName, { color: tint }]} numberOfLines={1}>{STAT_NAME[stat]}</Text>}
              <Text style={[styles.value, compact && styles.valueCompact, { color: tint }]}>{statOf(card, stat, charms)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={label}>{body}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{body}</Pressable>;
}

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingHorizontal: 7, paddingTop: 8, paddingBottom: 8, alignItems: 'center', overflow: 'hidden' },
  selected: { borderWidth: 3 },
  dim: { opacity: 0.45 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  back: { backgroundColor: colors.ink, padding: 7 },
  backInner: { flex: 1, alignSelf: 'stretch', borderRadius: 12, borderWidth: 1.5, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  backMark: { ...typography.display, color: colors.background },
  name: { ...typography.subtitle, textAlign: 'center', alignSelf: 'stretch' },
  rarity: { ...typography.overline, fontSize: 8, lineHeight: 11, letterSpacing: 1.1, color: colors.textMuted },
  art: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  stats: { alignSelf: 'stretch', gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, height: 22 },
  statName: { ...typography.caption, fontSize: 11, lineHeight: 14, flex: 1, minWidth: 0 },
  value: { ...typography.numeral, fontSize: 13, lineHeight: 16, marginLeft: 'auto', fontVariant: ['tabular-nums'] },
  valueCompact: { fontSize: 12, lineHeight: 15 },
});
