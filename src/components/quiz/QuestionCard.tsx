import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Glyph } from '@/components/icons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors, fonts, palette, radius, spacing, typography } from '@/theme';
import type { PlacementQuestion, QuestionDifficulty, Stimulus } from '@/types';

interface QuestionCardProps {
  question: PlacementQuestion;
  /** The answer UI (choices or text input), rendered by the parent. */
  children: React.ReactNode;
}

/**
 * Human-readable difficulty for the kicker line.
 *
 * Labels only. Each level used to carry a colour and a tint for the pill it
 * once rendered as; the pill became a plain kicker (see below) and the colours
 * went unused — light-only values that would have been wrong in dark mode had
 * anything picked them back up.
 */
const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = {
  foundation: 'Foundation',
  developing: 'Developing',
  ap_ready: 'AP level',
  advanced: 'Challenge',
};

/** Renders a question's skill kicker, prompt, optional stimulus, and answers. */
export function QuestionCard({ question, children }: QuestionCardProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const difficulty = DIFFICULTY_LABEL[question.difficulty];

  return (
    <GlassSurface variant="thick" style={styles.card}>
      {/* One kicker line rather than two pills. Two coloured chips above every
          question compete with the answers for the same attention, and the
          difficulty is not something a student can act on mid-question. */}
      <Text style={styles.kicker}>
        {question.skillTag.toUpperCase()} · {difficulty.toUpperCase()}
      </Text>

      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.stimulus ? <StimulusBlock stimulus={question.stimulus} /> : null}
      <View style={styles.answers}>{children}</View>
    </GlassSurface>
  );
}

/**
 * Supporting material above the prompt. Each kind gets a container that looks
 * like the thing it is — a dark editor for code, a chalk panel for a formula,
 * a ruled parchment for a passage — so students orient before they read.
 */
function StimulusBlock({ stimulus }: { stimulus: Stimulus }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  if (stimulus.kind === 'code') {
    return (
      <View style={styles.codeBox}>
        <View style={styles.codeBar}>
          <Text style={styles.codeLabel}>CODE</Text>
        </View>
        <Text style={styles.codeText}>{stimulus.content}</Text>
      </View>
    );
  }
  if (stimulus.kind === 'formula') {
    return (
      <View style={styles.formulaBox}>
        <Text style={styles.formulaText}>{stimulus.content}</Text>
      </View>
    );
  }
  if (stimulus.kind === 'paragraph') {
    return (
      <View style={styles.paragraphBox}>
        <Text style={styles.paragraphText}>{stimulus.content}</Text>
        {stimulus.caption ? <Text style={styles.sourceLine}>{stimulus.caption}</Text> : null}
      </View>
    );
  }

  // chart / image → a labeled frame; real media plugs in here later.
  return (
    <View style={styles.mediaBox}>
      <Glyph name={stimulus.kind === 'chart' ? 'chart' : 'page'} size={30} color={colors.textMuted} strokeWidth={2} />
      <Text style={styles.caption}>{stimulus.caption ?? stimulus.content}</Text>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, stroke }: AppTheme) => StyleSheet.create({
  card: { padding: 20, borderRadius: 28 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  skillTag: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    flexShrink: 1,
  },
  skillText: { ...typography.overline, color: colors.primary },
  difficultyTag: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  difficultyText: { ...typography.overline },
  kicker: {
    fontFamily: fonts.bodyBlack,
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.7,
    color: colors.primaryDeep,
  },

  prompt: {
    fontFamily: fonts.displaySemibold,
    fontSize: 21,
    lineHeight: 28,
    color: colors.ink,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  answers: { marginTop: spacing.sm },

  codeBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  codeBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  codeDot: { width: 9, height: 9, borderRadius: 5 },
  codeLabel: { ...typography.overline, fontSize: 10, color: colors.textSecondary },
  codeText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    padding: spacing.lg,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  formulaBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formulaText: { fontSize: 22, fontWeight: '500', color: colors.ink },

  paragraphBox: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  paragraphText: { ...typography.body, color: colors.textPrimary },
  sourceLine: { ...typography.caption, marginTop: spacing.sm },

  mediaBox: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.lg,
    borderWidth: stroke.surface,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  caption: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
