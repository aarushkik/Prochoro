import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Mascot } from '@/components/Mascot';

/** Feedback stays beside the answered question; the action dock remains compact. */
export function QuizFeedbackPanel({ correct, explanation, answer }: { correct: boolean; explanation: string; answer?: string }) {
  const styles = useThemedStyles(createStyles);
  return <GlassSurface variant="thick" style={styles.card}>
    <View style={styles.heading}><Mascot pose={correct ? 'thumbsup' : 'thinking'} size={43} /><Text accessibilityLiveRegion="polite" style={styles.title}>{correct ? 'That’s right.' : 'Here’s the idea.'}</Text></View>
    {!correct && answer ? <Text style={styles.answer}>Answer: {answer}</Text> : null}
    <Text style={styles.explanation}>{explanation}</Text>
  </GlassSurface>;
}
const createStyles = ({ typography, colors }: AppTheme) => StyleSheet.create({
  card: { borderRadius: 26, padding: 18, marginTop: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { ...typography.subtitle, fontSize: 18 },
  answer: { ...typography.bodyStrong, fontSize: 14, lineHeight: 21, marginBottom: 8 },
  explanation: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
