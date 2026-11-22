import React from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { CourseIllustration } from '@/components/ui/CourseIllustration';
import { UtilityIllustration } from '@/components/ui/UtilityIllustration';
import { Glyph } from '@/components/icons';
import { Mascot } from '@/components/Mascot';
import { getCourse } from '@/data';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';

/** What you are studying (tap to change it), today's streak, and your platypus in its hat. */
export function QuestHud({ courseId, streak = 0, onSwitchCourse, onOpenMe, onLayout }: {
  courseId: string | null; streak?: number; onSwitchCourse?: () => void; onOpenMe?: () => void; onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const styles = useThemedStyles(createStyles); const insets = useSafeAreaInsets();
  const course = getCourse(courseId);
  return <View pointerEvents="box-none" onLayout={onLayout} style={[styles.dock, { paddingTop: insets.top + 8 }]}>
    <GlassSurface style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${course?.name.replace('®', '') ?? 'Your course'}. Switch subject`} onPress={onSwitchCourse}
        style={({ pressed }) => [styles.course, pressed && styles.pressed]}>
        {course ? <CourseIllustration courseId={course.id} size={30} /> : null}
        <Text style={styles.courseName} numberOfLines={1}>{course?.shortName ?? 'Choose a course'}</Text>
        <Glyph name="chevron-down" size={16} />
      </Pressable>
      <View style={styles.spacer} />
      <View style={[styles.streak, streak === 0 && styles.idle]} accessible accessibilityLabel={streak + '-day streak'}>
        <UtilityIllustration id="streak" size={24} /><Text style={styles.count}>{streak}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Your platypus and hats" onPress={onOpenMe} style={({ pressed }) => [styles.me, pressed && styles.pressed]}>
        <Mascot pose="neutral" size={40} />
      </Pressable>
    </GlassSurface>
  </View>;
}
const createStyles = ({ typography }: AppTheme) => StyleSheet.create({
  dock: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 8 },
  bar: { borderRadius: 30, minHeight: 58, paddingLeft: 8, paddingRight: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  course: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 8, borderRadius: 23, flexShrink: 1 },
  courseName: { ...typography.subtitle, fontSize: 16, lineHeight: 20, flexShrink: 1 },
  pressed: { opacity: 0.6 },
  spacer: { flex: 1 },
  me: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 44, paddingHorizontal: 4 }, idle: { opacity: 0.45 }, count: { ...typography.numeral, fontSize: 16 },
});
