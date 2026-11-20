import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Mascot } from '@/components/Mascot';

/**
 * Feedback stays beside the answered question; the action dock remains
 * compact. A miss shows the answer and why; a right answer stays short, with
 * the reason one tap away.
 */
export function QuizFeedbackPanel({ correct, explanation, answer }: { correct: boolean; explanation: string; answer?: string }) {
  const styles = useThemedStyles(createStyles);
  const [why, setWhy] = useState(false);
  return <GlassSurface variant="thick" style={styles.card}>
    <View style={styles.heading}>
      <Mascot pose={correct ? 'thumbsup' : 'thinking'} size={43} />
      <Text accessibilityLiveRegion="polite" style={[styles.title, styles.grow]}>{correct ? 'Correct!' : 'Not quite.'}</Text>
      {correct && !why ? <Pressable accessibilityRole="button" accessibilityLabel="Show why" onPress={() => setWhy(true)} hitSlop={10} style={({ pressed }) => [styles.why, pressed && styles.pressed]}><Text style={styles.whyText}>Why?</Text></Pressable> : null}
    </View>
    {!correct && answer ? <Text style={styles.answer}>Answer: {answer}</Text> : null}
    {!correct || why ? <Text style={styles.explanation}>{explanation}</Text> : null}
  </GlassSurface>;
}
const createStyles = ({ typography, colors }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 26, padding: 16, marginTop: 14, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1 },
  title: { ...typography.subtitle, fontSize: 18 },
  why: { borderRadius: 16, borderWidth: 1.5, borderColor: colors.ink, paddingHorizontal: 12, paddingVertical: 5 },
  whyText: { ...typography.label, fontSize: 13, lineHeight: 17 },
  pressed: { opacity: 0.7 },
  answer: { ...typography.bodyStrong, fontSize: 14, lineHeight: 21 },
  explanation: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
