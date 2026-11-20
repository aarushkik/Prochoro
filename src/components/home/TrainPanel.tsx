import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { Mascot } from "@/components/Mascot";
import { Glyph } from "@/components/icons";
import { ChunkyCard } from "@/components/ui";
import { ActivityIllustration } from "@/components/ui/ActivityIllustration";
import { chunky, colors, fonts, palette, spring } from "@/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuest } from "@/state/QuestContext";
import { useOnboarding } from "@/state/OnboardingContext";
import { drillSize, countForSkills } from "@/data";
import { weakSpots } from "@/data/weakSpots";
import type { RootStackParamList } from "@/navigation/types";
import { readBestFloor } from "@/lib/climbRecord";
import { heightLabel } from "@/utils/climb";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

/**
 * Practice — anything off the path. Nothing here can cost you a level or a
 * streak. One card picks the questions for you; below it, any topic on its own.
 */

/**
 * `topInset` is the height of the floating HUD, so the panel starts below it
 * and scrolls up underneath it.
 */
export function TrainPanel({ topInset = 0 }: { topInset?: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { skills } = useQuest();
  const layout = useScreenLayout();
  // Wider screens lay the same cards out in rows instead of one long column.
  const topicCell = layout.wide ? styles.topicCell : undefined;
  const { courseId } = useOnboarding();
  const navigation = useNavigation<Nav>();
  // The climb's personal best, read again whenever Home comes back into view.
  const [best, setBest] = useState(0);
  useFocusEffect(useCallback(() => {
    let alive = true;
    void readBestFloor(courseId).then((value) => { if (alive) setBest(value); });
    return () => { alive = false; };
  }, [courseId]));

  // Clamped to what the course's bank can actually serve, so a card never
  // offers more questions than the quiz behind it will run.
  const sized = (wanted: number) => drillSize(courseId, wanted);
  // Real accuracy, from what this student has actually answered.
  const weak = weakSpots(skills, courseId);

  /**
   * Start a drill.
   *
   * No `nodeId`, which is what makes it practice: the quiz engine treats a
   * session without one as off-map, so it pays XP and holds the streak but
   * clears nothing and costs nothing if it goes badly.
   */
  const drill = (
    title: string,
    count: number,
    drillXp: number,
    focus?: string[],
  ) =>
    navigation.navigate("Quiz", {
      title,
      count: focus?.length
        ? Math.min(count, countForSkills(courseId, focus))
        : sized(count),
      xp: drillXp,
      focus,
    });

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scroll, layout.wide && styles.scrollWide, { paddingTop: topInset + 4 }]}
      scrollIndicatorInsets={{ top: topInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Practice</Text>
        </View>
        <Mascot pose="point" size={104 * layout.scale} />
      </View>

      <Recommended
        wide={layout.wide}
        count={Math.min(
          12,
          countForSkills(
            courseId,
            weak.map((w) => w.name),
          ),
        )}
        focus={weak
          .filter((w) => w.pct >= 0)
          .slice(0, 2)
          .map((w) => w.name)
          .join(" and ")}
        onStart={() =>
          drill(
            "Recommended practice",
            12,
            60,
            weak.map((w) => w.name),
          )
        }
      />

      <ClimbCard best={best} wide={layout.wide} onStart={() => navigation.navigate("Climb")} />

      <Text style={styles.section}>BY TOPIC</Text>
      <View style={[styles.stack, layout.wide && styles.row]}>
        {weak.map((w) => (
          <ChunkyCard
            key={w.name}
            style={topicCell}
            contentStyle={[styles.weakCard, layout.wide && styles.weakCardWide]}
            onPress={() => drill(w.name, w.count, w.count * 5, [w.name])}
            accessibilityLabel={`Drill ${w.name}, ${w.count} questions`}
          >
            <View style={styles.weakBody}>
              <Text style={styles.weakName}>{w.name}</Text>
              {w.pct >= 0 ? (
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${w.pct}%` }]} />
                </View>
              ) : null}
            </View>
            {w.pct >= 0 ? <Text style={styles.weakPct}>{`${w.pct}%`}</Text> : <Glyph name="play" size={18} />}
          </ChunkyCard>
        ))}
      </View>

    </ScrollView>
  );
}

/** Endless practice: a tower of timed rivals, with your best floor to beat. */
function ClimbCard({ best, wide, onStart }: { best: number; wide: boolean; onStart: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Endless climb.${best ? ` Your best is ${heightLabel(best)}.` : ""} Start climbing`}
      onPress={onStart}
      style={({ pressed }) => [styles.climb, pressed && styles.climbPressed]}
    >
      <View style={styles.climbCopy}>
        <Text style={styles.climbKicker}>ENDLESS CLIMB</Text>
        <Text style={[styles.climbTitle, wide && styles.heroTitleWide]}>How high can you go?</Text>
        <Text style={styles.climbBody}>{best ? `Your best: ${heightLabel(best)}` : "A card battle game"}</Text>
        <View style={styles.climbCta}>
          <Glyph name="play" size={15} color={colors.textOnPrimary} strokeWidth={2} />
          <Text style={styles.heroCtaText}>Climb</Text>
        </View>
      </View>
      <Mascot pose="levelUp" size={wide ? 132 : 92} />
    </Pressable>
  );
}

/**
 * The one card that decides for you. Ink ground with a turquoise lip — the
 * only place in the light half of the app that inverts, so it cannot be
 * mistaken for one more option in the list.
 */
function Recommended({
  wide,
  count,
  focus,
  onStart,
}: {
  wide: boolean;
  count: number;
  /** The topics the drill will actually pull from, if any are known yet. */
  focus: string;
  onStart: () => void;
}) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const press = useRef(new Animated.Value(0)).current;
  const { reduceMotion } = useMotionPreference();
  const c = chunky({ radius: 28 });
  const to = (v: number) => {
    if (reduceMotion) {
      press.setValue(v);
      return;
    }
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      ...(v === 1 ? spring.press : spring.release),
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start quick practice"
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      onPress={onStart}
      style={[c.wrap, styles.heroWrap]}
    >
      <Animated.View
        style={[
          c.face,
          styles.hero,
          {
            transform: [
              {
                scale: press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.98],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>QUICK PRACTICE</Text>
            <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>{focus || "A mix of everything"}</Text>
            <Text style={[styles.heroBody, wide && styles.heroBodyWide]}>{count} questions picked for you</Text>
          </View>
          <ActivityIllustration id="drill" size={wide ? 132 : 76} />
        </View>
        <View style={styles.heroCta}>
          <Glyph name="play" size={16} color={colors.textOnPrimary} strokeWidth={2} />
          <Text style={styles.heroCtaText}>Start</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 130 },

  head: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 6 },
  headText: { flex: 1 },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
  headArt: { width: 104, height: 104, marginBottom: -8 },

  heroWrap: { marginTop: 12 },
  scrollWide: { paddingHorizontal: 24 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  topicCell: { flexBasis: "30%", flexGrow: 1 },
  weakCardWide: { paddingVertical: 20, paddingHorizontal: 18 },
  heroTitleWide: { fontSize: 36, lineHeight: 42 },
  heroBodyWide: { fontSize: 16, lineHeight: 22 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroCopy: { flex: 1, minWidth: 0 },
  hero: { padding: 20, overflow: "hidden" },
  heroGlow: {
    position: "absolute",
    right: -78,
    top: -74,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: palette.hero.glow,
  },
  heroKicker: {
    fontFamily: fonts.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.8,
    color: palette.hero.kicker,
  },
  heroTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: 26,
    lineHeight: 29,
    color: palette.hero.title,
    marginTop: 4,
  },
  heroBody: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13.5,
    lineHeight: 19,
    color: palette.hero.body,
    marginTop: 5,
    maxWidth: 250,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 23,
    minHeight: 46,
    paddingLeft: 18,
    paddingRight: 22,
    overflow: "hidden",
  },
  heroArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCtaText: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14.5,
    color: colors.textOnPrimary,
  },
  heroXp: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11.5,
    color: palette.hero.faint,
    marginTop: 12,
  },

  climb: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 28, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, padding: 18 },
  climbPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  climbCopy: { flex: 1, minWidth: 0 },
  climbKicker: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.8, color: colors.textMuted },
  climbTitle: { fontFamily: fonts.displayHeavy, fontSize: 24, lineHeight: 28, color: colors.ink, marginTop: 4 },
  climbBody: { fontFamily: fonts.bodySemibold, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 5 },
  climbCta: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, marginTop: 14, backgroundColor: colors.primary, borderRadius: 23, minHeight: 44, paddingLeft: 18, paddingRight: 22 },

  section: {
    fontFamily: fonts.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textMuted,
    marginTop: 20,
  },
  stack: { marginTop: 9, gap: 9 },

  weakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  weakBody: { flex: 1 },
  weakName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  barTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 7,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: palette.ember },
  weakPct: {
    fontFamily: fonts.displayHeavy,
    fontSize: 20,
    color: palette.ember,
  },

});
