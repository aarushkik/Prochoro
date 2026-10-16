import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Glyph, type GlyphName } from '@/components/icons';
import { colors, radius, spacing, typography } from '@/theme';

interface QuestStepProps {
  index: number;
  total: number;
  icon: GlyphName;
  title: string;
  description: string;
  /** Node color + connector tint. */
  color: string;
  tint: string;
}

/**
 * A single milestone in the "quest ahead" timeline: a numbered node on a
 * connecting rail beside a content card. Reads as a journey rather than a
 * bulleted feature list — the same visual language as the quest map itself.
 */
export function QuestStep({ index, total, icon, title, description, color, tint }: QuestStepProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const isLast = index === total - 1;
  return (
    <View style={[styles.row, !isLast && styles.rowGap]}>
      <View style={styles.rail}>
        {!isLast ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
        <View style={[styles.node, { backgroundColor: colors.background }]}>
          <Glyph name={icon} size={21} color={colors.ink} strokeWidth={1.6} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.step, { color: colors.textSecondary }]}>Step {index + 1}</Text>
        <Text style={typography.subtitle}>{title}</Text>
        <Text style={[typography.body, styles.desc]}>{description}</Text>
      </View>
    </View>
  );
}

const NODE = 46;

const createStyles = ({ colors, palette, typography, stroke, card }: AppTheme) => StyleSheet.create({
  row: { flexDirection: 'row' },
  rowGap: { paddingBottom: spacing.lg },
  rail: { width: NODE, alignItems: 'center' },
  line: { position: 'absolute', top: NODE / 2, bottom: -spacing.lg, width: 1 },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: radius.pill,
    borderWidth: stroke.surface,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    ...card,
    flex: 1,
    marginLeft: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  step: { ...typography.overline, marginBottom: 2 },
  desc: { marginTop: 2 },
});
