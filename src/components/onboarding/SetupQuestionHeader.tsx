import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ProgressBar, TopBackButton } from '@/components/ui';
import { Mascot } from '@/components/Mascot';
import type { MascotPose } from '@/components/Mascot';
import { colors, radius, spacing, typography } from '@/theme';

interface SetupQuestionHeaderProps {
  onBack: () => void;
  /** 1-based position in the setup flow, shown as a "Step n of total" chip. */
  step: number;
  total: number;
  /** The screen's headline question. */
  question: string;
  /** Optional supporting line under the headline. */
  subtitle?: string;
  mascotPose?: MascotPose;
}

/**
 * Shared top block for the setup screens: back control and progress bar, a
 * step chip so the flow always feels finite, then the headline with Stu as a
 * small reacting accent. Deliberately a clean headline rather than a speech
 * bubble — the bubble is saved for moments where Stu is actually talking.
 */
export function SetupQuestionHeader({
  onBack,
  step,
  total,
  question,
  subtitle,
  mascotPose = 'neutral',
}: SetupQuestionHeaderProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;

  return (
    <View>
      <View style={styles.topRow}>
        <TopBackButton onPress={onBack} style={styles.back} />
        <ProgressBar progress={step / total} style={{ flex: 1 }} />
      </View>

      <View style={styles.headlineRow}>
        <View style={styles.textCol}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              Step {step} of {total}
            </Text>
          </View>
          <Text style={[typography.title, compact && { fontSize: 24, lineHeight: 29 }]}>{question}</Text>
          {subtitle ? <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text> : null}
        </View>
        {!compact ? <Mascot size={64} pose={mascotPose} /> : null}
      </View>
    </View>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  back: { marginLeft: -spacing.md, marginRight: spacing.xs },
  headlineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  textCol: { flex: 1, paddingRight: spacing.md },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: 0,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  chipText: { ...typography.overline, color: colors.primaryDeep },
  subtitle: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21 },
});
