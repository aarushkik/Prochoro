import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from '@/components/creatures/BossSprite';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';
import { bossForNode } from '@/data/bosses';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Glyph, type GlyphName } from '@/components/icons';
import { duration, easing, questNode, radius, spacing } from '@/theme';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { BOSS_TIERS } from '@/data/questMap';
import type { QuestNode, QuestNodeKindId, QuestNodeState } from '@/types/quest';

interface LessonSheetProps {
  node: QuestNode | null;
  state: QuestNodeState;
  /** Which region the stop belongs to, shown as the sheet's kicker. */
  unitTitle: string;
  onStart: () => void;
  onClose: () => void;
}

/** Per-kind framing: what to call it, and what the button should promise. */
const KIND: Record<QuestNodeKindId, { label: string; glyph: GlyphName; cta: string; again: string }> = {
  lesson: { label: 'Lesson', glyph: 'book', cta: 'Start lesson', again: 'Practice again' },
  drill: { label: 'Drill', glyph: 'page', cta: 'Start drill', again: 'Run it again' },
  study: { label: 'Knowledge check', glyph: 'page', cta: 'Start review', again: 'Review again' },
  bonus: { label: 'Bonus', glyph: 'chest', cta: 'Open the cache', again: 'Open again' },
  boss: { label: 'Study club check', glyph: 'swords', cta: 'Start the check', again: 'Try it again' },
};

/**
 * The sheet that opens when a stop is tapped: what you're about to do, what
 * it's worth, and one obvious button to begin. This is the last thing between
 * a student and a lesson, so it stays short — title, stakes, go.
 *
 * A floating glass card, inset from the screen edges with its corners
 * following the phone's, as iOS 26 sheets are — rather than a slab bolted to
 * the bottom edge. It rises on a spring and sinks away when dismissed; it used
 * to vanish on the spot, because the moment the stop was cleared there was
 * nothing left to draw. It now keeps the last stop it showed until it has
 * finished leaving.
 */
export function LessonSheet({ node, state, unitTitle, onStart, onClose }: LessonSheetProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const { motionEnabled } = useMotionPreference();
  const rise = useRef(new Animated.Value(0)).current;
  const visible = node !== null;
  // What is on screen. Follows the props while a stop is selected and holds
  // the last one while the sheet animates away.
  const [leaving, setLeaving] = useState<{ node: QuestNode; state: QuestNodeState; unitTitle: string } | null>(null);
  useEffect(() => {
    if (node) setLeaving({ node, state, unitTitle });
  }, [node, state, unitTitle]);

  useEffect(() => {
    if (!motionEnabled) {
      rise.setValue(visible ? 1 : 0);
      if (!visible) setLeaving(null);
      return;
    }
    const animation = visible
      ? Animated.spring(rise, { toValue: 1, useNativeDriver: true, damping: 21, stiffness: 200, mass: 1 })
      : Animated.timing(rise, { toValue: 0, duration: duration.fast, easing: easing.in, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished && !visible) setLeaving(null); });
    return () => animation.stop();
  }, [visible, rise, motionEnabled]);

  const shown = node ? { node, state, unitTitle } : leaving;
  if (!shown) return null;
  return (
    <SheetBody
      node={shown.node}
      state={shown.state}
      unitTitle={shown.unitTitle}
      visible={visible}
      rise={rise}
      bottomInset={insets.bottom}
      onStart={onStart}
      onClose={onClose}
    />
  );
}

function SheetBody({
  node,
  state,
  unitTitle,
  visible,
  rise,
  bottomInset,
  onStart,
  onClose,
}: {
  node: QuestNode;
  state: QuestNodeState;
  unitTitle: string;
  visible: boolean;
  rise: Animated.Value;
  bottomInset: number;
  onStart: () => void;
  onClose: () => void;
}) {
  const { colors, palette, typography } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const kind = KIND[node.kind];
  const scheme = questNode[node.kind];
  const cleared = state === 'complete';
  const sealed = state === 'locked';
  const isBoss = node.kind === 'boss';
  const isAreaBoss = isBoss && node.tier === 6;
  // Bosses are named by rank, so the sheet's kicker says which fight this is.
  const label = isBoss ? BOSS_TIERS[Math.min(5, Math.max(0, (node.tier ?? 1) - 1))] : kind.label;

  // The spring may carry the sheet a few points past its resting place;
  // that is the bounce. The scrim is clamped so it never goes darker than set.
  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [460, 0] });
  const scrimOpacity = rise.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Dismiss quest details" onPress={onClose} />
      </Animated.View>

      <View style={[styles.dock, { paddingBottom: Math.max(bottomInset, 10) }]} pointerEvents={visible ? 'box-none' : 'none'}>
        <Animated.View accessibilityViewIsModal style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <GlassSurface variant="thick" style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.grabber} />

          {isBoss ? <View style={{ alignItems: 'center', paddingBottom: 8 }}><BossSprite nodeId={node.id} size={156} /><Text style={{ color: colors.textSecondary, textAlign: 'center', ...typography.caption }}>{bossForNode(node.id)?.species}</Text></View> : null}
          <View style={styles.head}>
            <View style={[styles.crest, { backgroundColor: scheme.face, borderColor: scheme.edge }]}>
              {node.kind === 'boss'
                ? <Glyph name={kind.glyph} size={30} color={colors.white} strokeWidth={2.4} />
                : <ActivityIllustration id={node.kind} size={45} ink={state === 'locked' ? 'dark' : 'light'} />}
            </View>
            <View style={styles.headText}>
              <Text style={styles.kicker} numberOfLines={1}>
                {unitTitle} · {label}
              </Text>
              <Text style={typography.heading} numberOfLines={2}>
                {node.title}
              </Text>
            </View>
            {cleared ? (
              <View style={styles.clearedBadge}>
                <Glyph name="check" size={14} color={colors.white} strokeWidth={3.2} />
              </View>
            ) : null}
          </View>

          <Text style={[typography.body, styles.summary]}>
            {sealed ? `${node.summary} Clear the stops before it on the trail to open this one.` : node.summary}
          </Text>

          {!sealed && !cleared && !node.summary.includes('60%') ? <Text style={styles.passNote}>Answer at least 60% correctly to clear this stop.</Text> : null}

          {isBoss ? (
            <View style={[styles.bossNote, isAreaBoss && styles.bossNoteFinal]}>
              <Glyph name="shield" size={22} color={palette.violetLight} strokeWidth={2.2} />
              <Text style={styles.bossText}>
                {isAreaBoss
                  ? 'The final check in this area. Passing it opens the next one.'
                  : `Check ${node.tier} of 6 in this area. Passing it opens the next stretch of trail.`}
              </Text>
            </View>
          ) : null}

          <View style={styles.chips}>
            {node.skills
              .filter((s) => s.toLowerCase() !== node.title.toLowerCase())
              .slice(0, 3)
              .map((skill) => (
              <View key={skill} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {skill}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.rewards}>
            <Reward glyph="star" color={colors.gold} value={`Up to ${node.xp} base XP`} />
            <View style={styles.rewardDivider} />
            <Reward glyph="clock" color={colors.textSecondary} value={`${node.minutes} min`} />
          </View>

          <AppButton
            label={sealed ? 'Sealed for now' : cleared ? kind.again : kind.cta}
            tone={isBoss ? 'gold' : cleared ? 'secondary' : 'primary'}
            icon={cleared ? 'refresh' : 'play'}
            emphasis={!cleared && !sealed}
            disabled={sealed}
            onPress={onStart}
          />
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.dismiss}>
            <Text style={styles.dismissText}>{sealed ? 'Back to the map' : 'Not right now'}</Text>
          </Pressable>
          </ScrollView>
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Reward({ glyph, color, value }: { glyph: GlyphName; color: string; value: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.reward}>
      <Glyph name={glyph} size={19} color={color} strokeWidth={2.2} />
      <Text style={styles.rewardText}>{value}</Text>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, stroke, glass }: AppTheme) => StyleSheet.create({
  scrim: { backgroundColor: glass.scrim },
  dock: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 10 },
  sheetWrap: { maxHeight: '90%', maxWidth: 600, width: '100%' },
  // 40 sits just inside a modern iPhone's display corner at a 10pt inset, so
  // the card's corners run parallel to the screen's.
  sheet: {
    flexShrink: 1,
    borderRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.textMuted,
    opacity: 0.4,
    marginBottom: spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  crest: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  kicker: { ...typography.overline, color: colors.textMuted, marginBottom: 2 },
  clearedBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passNote: { ...typography.caption, color: colors.ink, marginTop: 10 },
  summary: { marginTop: spacing.lg },

  bossNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: '#111111',
    borderWidth: stroke.surface,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bossNoteFinal: { backgroundColor: '#292929' },
  bossText: { ...typography.caption, color: '#F4F4F4', flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  // A translucent well, not a solid one: on glass, an opaque chip reads as a
  // hole punched through it.
  chip: {
    backgroundColor: colors.overlaySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipText: { ...typography.caption, color: colors.textSecondary },

  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  reward: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rewardText: { ...typography.bodyStrong },
  rewardDivider: { width: 1, height: 18, backgroundColor: colors.border },

  dismiss: { alignSelf: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  dismissText: { ...typography.bodyStrong, color: colors.textSecondary },
});
