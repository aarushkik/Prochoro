import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { CourseIllustration } from '@/components/ui/CourseIllustration';
import { ProgressBar } from '@/components/ui';
import { Glyph } from '@/components/icons';

interface Props {
  progress: number;
  counter: string;
  currentCorrectStreak: number;
  title: string;
  subtitle: string;
  courseId?: string | null;
  onClose: () => void;
}

/** A single glass toolbar keeps the course, position and exit within reach. */
export function QuizProgressHeader({ progress, counter, currentCorrectStreak, title, subtitle, courseId, onClose }: Props) {
  const styles = useThemedStyles(createStyles);
  return <GlassSurface style={styles.bar}>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Leave quiz" onPress={onClose} style={styles.close}><Glyph name="close" size={19} /></Pressable>
      {courseId ? <CourseIllustration courseId={courseId} size={32} /> : null}
      <View style={styles.copy}><Text style={styles.title} numberOfLines={1}>{title}</Text><Text style={styles.subtitle} numberOfLines={1}>{currentCorrectStreak > 1 ? `${currentCorrectStreak} correct in a row` : subtitle}</Text></View>
      <Text style={styles.counter}>{counter}</Text>
    </View>
    <ProgressBar progress={progress} height={3} style={styles.progress} />
  </GlassSurface>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  bar: { borderRadius: 25, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  close: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.subtitle, fontSize: 14, lineHeight: 19 },
  subtitle: { ...typography.caption, fontSize: 10, lineHeight: 15 },
  counter: { ...typography.caption, color: colors.ink, fontVariant: ['tabular-nums'], paddingRight: 9 },
  progress: { marginTop: 7, marginHorizontal: 12 },
});
