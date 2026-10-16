import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Glyph } from '@/components/icons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors, fonts, palette, radius, spacing, typography } from '@/theme';
import type { PlacementQuestion, Stimulus } from '@/types';
import { openLink } from '@/lib/links';

interface QuestionCardProps {
  question: PlacementQuestion;
  /** The answer UI (choices or text input), rendered by the parent. */
  children: React.ReactNode;
}

/** Renders a question's skill kicker, prompt, optional stimulus, and answers. */
export function QuestionCard({ question, children }: QuestionCardProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <GlassSurface variant="thick" style={styles.card}>
      {/* One kicker line rather than two pills. Two coloured chips above every
          question compete with the answers for the same attention, and the
          difficulty is not something a student can act on mid-question. */}
      <Text style={styles.kicker}>
        {question.skillTag.toUpperCase()}
      </Text>

      {question.stimulus ? <StimulusBlock stimulus={question.stimulus} /> : null}
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.answers}>{children}</View>
      {question.examSource ? <Pressable accessibilityRole="link" accessibilityLabel="View the College Board study reference for this original practice question" onPress={() => openLink(question.examSource!.url)} style={{ minHeight: 44, justifyContent: 'center', marginTop: 8 }}><Text style={[typography.caption, { fontSize: 11, textDecorationLine: 'underline' }]}>Original practice · Study reference</Text></Pressable> : null}
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

  if (stimulus.kind === 'chart') return <View style={styles.dataBox}>
    <Text style={styles.codeLabel}>DATA</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Data table. Scroll horizontally if needed." style={{ marginTop: 12 }}><Text style={[styles.codeText, { fontSize: 13, flexShrink: 0 }]}>{stimulus.content}</Text></ScrollView>
    {stimulus.caption ? <Text style={styles.sourceLine}>{stimulus.caption}</Text> : null}
  </View>;

  // Legacy image captions remain readable when no image source is supplied.
  return (
    <View style={styles.mediaBox}>
      <Glyph name="page" size={30} color={colors.textMuted} strokeWidth={2} />
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

  dataBox: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, marginVertical: spacing.md },

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
