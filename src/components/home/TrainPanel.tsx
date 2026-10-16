import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BossSprite } from "@/components/creatures/BossSprite";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { Mascot } from "@/components/Mascot";
import { Glyph } from "@/components/icons";
import { ChunkyCard } from "@/components/ui";
import { ActivityIllustration } from "@/components/ui/ActivityIllustration";
import { chunky, colors, fonts, palette, spring } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuest } from "@/state/QuestContext";
import { useOnboarding } from "@/state/OnboardingContext";
import { drillSize, countForSkills } from "@/data";
import { questionCountFor } from "@/data/questMap";
import { weakSpots, weakSpotMeta } from "@/data/weakSpots";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

/**
 * Practice — everything off the trail.
 *
 * The point of this tab is that nothing on it can hurt you: no stop is spent,
 * no streak is at risk. So it leads with one dark recommendation card that
 * already knows what you are worst at, and only then offers the menu. A grid
 * of four equal options with no recommendation is a decision, and a decision
 * is what stops people practising.
 */

const MODES: {
  name: string;
  illustration: 'lesson' | 'drill' | 'study' | 'bonus';
  count: number;
  xp: number;
}[] = [
  {
    name: "Quick practice",
    illustration: "drill",
    count: 8,
    xp: 40,
  },
  { name: "Mistakes", illustration: "study", count: 6, xp: 30 },
  { name: "Boss rematch", illustration: "bonus", count: 8, xp: 45 },
  {
    name: "Mixed review",
    illustration: "lesson",
    count: 5,
    xp: 35,
  },
];

/**
 * `topInset` is the height of the floating HUD, so the panel starts below it
 * and scrolls up underneath it.
 */
export function TrainPanel({ topInset = 0 }: { topInset?: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { xp, skills, map, earned } = useQuest();
  const { courseId } = useOnboarding();
  const navigation = useNavigation<Nav>();

  // Clamped to what the course's bank can actually serve, so a card never
  // offers more questions than the quiz behind it will run.
  const sized = (wanted: number) => drillSize(courseId, wanted);
  // Real accuracy, from what this student has actually answered.
  const weak = weakSpots(skills, courseId);

  /** Every topic with at least one wrong answer against it. */
  const missed = useMemo(
    () =>
      Object.entries(skills)
        .filter(([, s]) => s.correct < s.seen)
        .map(([tag]) => tag),
    [skills],
  );

  /** Bosses already beaten — the only ones there is anything to rematch. */
  const rematches = useMemo(() => {
    const cleared = new Set(earned);
    return map.units
      .flatMap((u) => u.nodes.filter((n) => n.kind === "boss"))
      .filter((b) => cleared.has(b.id));
  }, [map, earned]);

  /**
   * The line under each mode name.
   *
   * Two of these used to be invented counts — "38 saved", "2 available" — on a
   * screen that had never seen the student answer anything. Both are now read
   * from the run; the two that are descriptions rather than numbers stay as
   * they were, because they were never claims.
   */
  const modeMeta = (name: string): string => {
    if (name === "Mistakes") {
      if (missed.length === 0) return "Nothing missed yet";
      return `${missed.length} topic${missed.length === 1 ? "" : "s"} missed`;
    }
    if (name === "Boss rematch") {
      if (rematches.length === 0) return "Win a duel first";
      return `${rematches.length} passed`;
    }
    return name === "Quick practice"
      ? "A short practice set"
      : "A mix of course topics";
  };

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
      contentContainerStyle={[styles.scroll, { paddingTop: topInset + 4 }]}
      scrollIndicatorInsets={{ top: topInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.subtitle}>
            Choose a quick round or practise a topic.
          </Text>
        </View>
        <Mascot pose="point" size={104} />
      </View>

      <Recommended
        xp={xp}
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

      <Text style={styles.section}>TOPICS TO PRACTISE</Text>
      <View style={styles.stack}>
        {weak.map((w) => (
          <ChunkyCard
            key={w.name}
            onPress={() => drill(w.name, w.count, w.count * 5, [w.name])}
            accessibilityLabel={`Drill ${w.name}, ${w.count} questions`}
            contentStyle={styles.weakCard}
          >
            <View style={styles.weakBody}>
              <Text style={styles.weakName}>{w.name}</Text>
              <Text style={styles.weakMeta}>{weakSpotMeta(w)}</Text>
              {w.pct >= 0 ? (
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${w.pct}%` }]} />
                </View>
              ) : null}
            </View>
            <Text style={styles.weakPct}>{w.pct >= 0 ? `${w.pct}%` : "—"}</Text>
          </ChunkyCard>
        ))}
      </View>

      <Text style={styles.section}>MORE PRACTICE</Text>
      <View style={styles.grid}>
        {MODES.map((m) => {
          // A rematch needs something to rematch. Rather than run a generic
          // set under a name that promises otherwise, the card goes quiet
          // until the first boss is down.
          const off =
            (m.name === "Boss rematch" && rematches.length === 0) ||
            (m.name === "Mistakes" && missed.length === 0);
          const lastBoss = rematches[rematches.length - 1];
          const focus =
            m.name === "Mistakes" && missed.length > 0 ? missed : undefined;
          return (
            <ChunkyCard
              key={m.name}
              onPress={
                off
                  ? undefined
                  : () => {
                      if (m.name === "Boss rematch" && lastBoss) {
                        const unit = map.units.find((item) =>
                          item.nodes.some((node) => node.id === lastBoss.id),
                        );
                        navigation.navigate("Quiz", {
                          nodeId: lastBoss.id,
                          title: lastBoss.title,
                          unit: unit?.index,
                          boss: true,
                          count: questionCountFor(lastBoss),
                          xp: lastBoss.xp,
                        });
                      } else drill(m.name, m.count, m.xp, focus);
                    }
              }
              accessibilityLabel={off ? undefined : `Start ${m.name}`}
              style={styles.gridItem}
              contentStyle={[styles.modeCard, off && styles.modeCardOff]}
            >
              {m.name === "Boss rematch" ? (
                <BossSprite
                  nodeId={
                    lastBoss?.id ??
                    map.units[0]?.nodes.find((node) => node.kind === "boss")?.id
                  }
                  size={54}
                  dim={off}
                />
              ) : (
                <ActivityIllustration id={m.illustration} size={44} dim={off} />
              )}
              <Text style={[styles.modeName, off && styles.modeDim]}>
                {m.name}
              </Text>
              <Text style={[styles.modeMeta, off && styles.modeDim]}>
                {modeMeta(m.name)}
                {off
                  ? ""
                  : ` · ${m.name === "Boss rematch" && lastBoss ? questionCountFor(lastBoss) : focus?.length ? Math.min(m.count, countForSkills(courseId, focus)) : sized(m.count)}Q`}
              </Text>
            </ChunkyCard>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * The one card that decides for you. Ink ground with a turquoise lip — the
 * only place in the light half of the app that inverts, so it cannot be
 * mistaken for one more option in the list.
 */
function Recommended({
  xp,
  count,
  focus,
  onStart,
}: {
  xp: number;
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
      accessibilityLabel="Start recommended practice"
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
        <Text style={styles.heroKicker}>RECOMMENDED TODAY</Text>
        <Text style={styles.heroTitle}>Recommended practice</Text>
        <Text style={styles.heroBody}>
          {count} questions
          {focus ? ` on ${focus}` : " across a few topics to find your focus"}.
        </Text>
        <View style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Start · 4 min</Text>
          <View style={styles.heroArrow}>
            <Glyph name="arrow-right" size={16} color={colors.textOnPrimary} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.heroXp}>{xp} XP earned so far</Text>
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
    gap: 12,
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 23,
    minHeight: 46,
    paddingLeft: 18,
    paddingRight: 9,
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
  weakMeta: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
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

  grid: { marginTop: 9, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // Two per row: half the 375-wide gutter box, less half the 10pt gap.
  gridItem: { width: "48%" },
  modeCard: { padding: 14 },
  modeCardOff: { backgroundColor: colors.surfaceSunken },
  modeDim: { opacity: 0.55 },
  modeName: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14.5,
    color: colors.ink,
    marginTop: 10,
  },
  modeMeta: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.textMuted,
  },
});
