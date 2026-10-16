import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Backdrop } from '@/components/ui/Backdrop';
import { BossSprite } from "@/components/creatures/BossSprite";
import { bossForNode } from "@/data/bosses";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui";
import { Glyph, type GlyphName } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { colors, radius, spacing, typography } from "@/theme";
import { SaveStatusNotice } from "@/components/account/SaveStatusNotice";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { findNode, questionCountFor } from '@/data/questMap';
import { levelNumber } from '@/utils/learningLevels';
import { useQuest } from "@/state/QuestContext";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "LessonComplete">;
type Route = RouteProp<RootStackParamList, "LessonComplete">;

/**
 * The payoff at the end of a stop. Three numbers, one line of encouragement
 * pitched to how it actually went, and a single way back to the map — the
 * screen should feel like a reward, not a report card.
 */
export function LessonCompleteScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { streakDays, map, currentNodeId } = useQuest();

  const { reduceMotion } = useMotionPreference();
  const { title, correct, total, xp, cleared, bossNodeId, nodeId, level } = params;
  const next = currentNodeId ? findNode(map, currentNodeId) : undefined;
  const replay = nodeId ? findNode(map, nodeId) : undefined;
  const destination = cleared === false ? replay : next;
  const playNext = () => {
    if (!destination || cleared === undefined) { navigation.reset({ index: 0, routes: [{ name: "Home" }] }); return; }
    const item = destination.node;
    navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Quiz", params: { nodeId: item.id, unit: destination.unit.index, title: item.title, xp: item.xp, count: questionCountFor(item), boss: item.kind === "boss" } }] });
  };
  const boss = bossNodeId ? bossForNode(bossNodeId) : null;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const verdict = VERDICTS.find((v) => accuracy >= v.min)!;

  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(pop, {
      toValue: 1,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [pop, reduceMotion]);

  return (
    <View style={styles.root}>
      <Backdrop />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <StatusBar style={appTheme.isDark ? "light" : "dark"} />

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: pop }}>
            {boss ? (
              <View style={styles.bossArt}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                  <Mascot size={118} pose={cleared ? 'bossWin' : 'bossLose'} />
                  <BossSprite nodeId={bossNodeId} size={130} />
                </View>
                {cleared ? (
                  <View
                    style={[
                      styles.clearedStamp,
                      { backgroundColor: appTheme.isDark ? colors.primaryTint : boss.light },
                    ]}
                  >
                    <Glyph name="check" size={17} color={colors.successDeep} />
                    <Text style={typography.label}>FIELD GUIDE · CLEARED</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Mascot
                size={190}
                pose={cleared === false ? "reading" : "celebrate"}
              />
            )}
          </Animated.View>

          <Animated.View style={[styles.copy, { opacity: pop }]}>
            <Text style={[typography.display, styles.headline]}>
              {cleared === false
                ? "Try again."
                : boss
                  ? "Boss beaten!"
                  : verdict.headline}
            </Text>
            <Text style={[typography.body, styles.sub]} numberOfLines={2}>
              {level ? "Level " + level + (cleared ? " cleared" : " · " + title) : title}
            </Text>

            <View style={styles.statsWrap}>
              <View style={styles.stats}>
                <Stat
                  glyph="star"
                  color={colors.gold}
                  value={`+${xp}`}
                  label="XP"
                />
                <View style={styles.divider} />
                <Stat
                  glyph="target"
                  color={colors.success}
                  value={`${accuracy}%`}
                  label="Accuracy"
                />
                <View style={styles.divider} />
                <Stat
                  glyph="flame"
                  color={colors.primary}
                  value={String(streakDays)}
                  label="Day streak"
                />
              </View>
            </View>

            <Text style={[typography.body, styles.note]}>
              {cleared === false
                ? "You kept your practice XP. Read the explanations and try this level again."
                : boss
                  ? "You beat the boss. Your next level is ready."
                  : verdict.note}
            </Text>
            <SaveStatusNotice />
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={cleared === false && replay ? "Try Level " + levelNumber(map, nodeId) + " again" : cleared && next ? "Play Level " + levelNumber(map, currentNodeId) : "Done"}
            icon="map"
            emphasis
            onPress={playNext}
          />
          {destination && cleared !== undefined ? <AppButton label="Home" tone="secondary" style={{ marginTop: 8 }} onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })} /> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Matched to accuracy, highest threshold first. */
const VERDICTS = [
  {
    min: 100,
    headline: "Flawless",
    note: "Every answer correct. Revisit these ideas later to help them stick.",
  },
  {
    min: 80,
    headline: "Strong run",
    note: "You’re getting the hang of these ideas. Keep exploring and review what you missed.",
  },
  {
    min: 50,
    headline: "Good progress",
    note: "Solid footing. The next pass through will tighten the gaps.",
  },
  {
    min: 0,
    headline: "Round one done",
    note: "Rough first attempt is how it starts. Come back and take it again.",
  },
];

function Stat({
  glyph,
  color,
  value,
  label,
}: {
  glyph: GlyphName;
  color: string;
  value: string;
  label: string;
}) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.stat}>
      <Glyph name={glyph} size={22} color={color} strokeWidth={2.2} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, stroke, card }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  body: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  bossArt: { alignItems: "center" },
  clearedStamp: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  copy: { alignItems: "center", alignSelf: "stretch" },
  headline: { textAlign: "center", marginTop: spacing.md },
  sub: { textAlign: "center", marginTop: spacing.xs },

  // The scoreboard was the last surface on a 1px hairline, which next to the
  // ink-drawn map and the chunky button below it read as a different app.
  statsWrap: {
    alignSelf: "stretch",
    position: "relative",
    marginTop: spacing.xxl,
    marginBottom: 6,
  },
  stats: {
    ...card,
    flexDirection: "row",
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    marginTop: spacing.xs,
  },
  // Ink at low alpha rather than the old border grey: a pale hairline between
  // three heavy numbers just looks like a rendering seam.
  divider: {
    width: 2,
    backgroundColor: colors.overlay,
    marginVertical: spacing.sm,
    borderRadius: 1,
  },

  note: {
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footer: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
