import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Backdrop } from '@/components/ui/Backdrop';
import { BossFieldGuide } from "@/components/creatures/BossFieldGuide";
import { CompanionSprite } from "@/components/creatures/CompanionSprite";
import React, { useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Glyph } from "@/components/icons";
import { ChunkyCard, TopBackButton } from "@/components/ui";
import { unlockLabel, type CompanionStatus } from "@/data/companions";
import { useQuest } from "@/state/QuestContext";
import { colors, fonts, palette, outlinedCard, withAlpha } from "@/theme";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Characters">;

/** The illustrated field guide for companions and guardians. */
export function CharactersScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { companions, equippedId, equip, map, earned } = useQuest();
  const { width, fontScale } = useWindowDimensions();
  const [page, setPage] = useState<"companions" | "bosses">("companions");
  const [note, setNote] = useState<string | null>(null);
  const owned = useMemo(() => companions.filter((c) => c.owned), [companions]);
  const locked = useMemo(
    () => companions.filter((c) => !c.owned),
    [companions],
  );
  const bossCount = map.units.flatMap((u) =>
    u.nodes.filter((n) => n.kind === "boss"),
  );
  const defeated = bossCount.filter((n) => earned.includes(n.id)).length;
  const equipped = companions.find((c) => c.id === equippedId);
  const columns = Math.min(width, 620) >= 360 && fontScale < 1.3 ? 2 : 1;
  const cardWidth = (Math.min(width, 620) - 36 - (columns - 1) * 12) / columns;

  const tap = (c: CompanionStatus) => {
    const message = !c.owned
      ? `${c.name}: ${unlockLabel(c)}. Progress: ${Math.min(c.have, c.need)} of ${c.need}.`
      : `${c.name} is coming along. ${c.ability}.`;
    if (c.owned) equip(c.id);
    setNote(message);
    AccessibilityInfo.announceForAccessibility(message);
  };

  const renderCard = (c: CompanionStatus) => {
    const isOn = c.owned && c.id === equippedId;
    const progress = c.need > 0 ? Math.min(1, c.have / c.need) : 1;
    return (
      <ChunkyCard
        key={c.id}
        onPress={() => tap(c)}
        selected={isOn}
        accent={c.tint}
        style={{ width: cardWidth }}
        contentStyle={[styles.card, !c.owned && styles.cardLocked]}
        accessibilityLabel={`${c.name}. ${c.ability}. ${c.owned ? (isOn ? "Equipped" : "Tap to equip") : `${unlockLabel(c)}, ${Math.min(c.have, c.need)} of ${c.need}`}`}
      >
        <View style={styles.cardTop}>
          <CompanionSprite id={c.id} tint={c.tint} size={112} dim={!c.owned} />
          {isOn ? (
            <View style={styles.equippedCheck}>
              <Glyph
                name="check"
                size={15}
                color={colors.ink}
                strokeWidth={3}
              />
            </View>
          ) : null}
          {!c.owned ? (
            <Glyph name="lock" size={17} color={colors.textSecondary} />
          ) : null}
        </View>
        <Text style={styles.name}>{c.name}</Text>
        <Text style={styles.ability}>{c.ability}</Text>
        {!c.owned ? (
          <View style={styles.unlock}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.unlockLabel}>{unlockLabel(c)}</Text>
            <Text style={styles.unlockCount}>
              {Math.min(c.have, c.need)} / {c.need}
            </Text>
          </View>
        ) : (
          <View style={[styles.tag, isOn && styles.tagOn]}>
            <Text style={styles.tagText}>
              {isOn ? "Coming along" : "Choose companion"}
            </Text>
          </View>
        )}
      </ChunkyCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Backdrop />
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <View style={styles.head}>
        <TopBackButton onPress={() => navigation.goBack()} color={colors.ink} />
        <View style={styles.headText}>
          <Text style={styles.title}>The field guide</Text>
          <Text style={styles.subtitle}>
            {page === "bosses"
              ? `${defeated} of ${bossCount.length} bosses defeated`
              : `${owned.length} of ${companions.length} ready to explore`}
          </Text>
        </View>
      </View>
      <View style={styles.segment}>
        <SegmentedControl
          items={[
            { id: "companions", label: "Companions" },
            { id: "bosses", label: "Bosses" },
          ] as const}
          value={page}
          onChange={setPage}
        />
      </View>
      <ScrollView
        key={page}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {page === "bosses" ? (
          <BossFieldGuide />
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>BETTER TOGETHER</Text>
                <Text style={styles.heroTitle}>
                  {equipped?.name ?? "Your companion"} is coming along.
                </Text>
                <Text style={styles.heroBody}>
                  {equipped
                    ? `${equipped.ability}.`
                    : "Choose a companion below."}{" "}
                  Pick a different partner whenever you like.
                </Text>
              </View>
              <CompanionSprite id={equippedId ?? "mira"} size={112} />
            </View>
            {note ? (
              <View style={styles.note} accessibilityLiveRegion="polite">
                <Text style={styles.noteText}>{note}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss message"
                  onPress={() => setNote(null)}
                  style={styles.noteClose}
                >
                  <Glyph name="close" size={17} color={colors.ink} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.sectionRow}>
              <Text style={styles.section}>READY FOR ADVENTURE</Text>
              <Text style={styles.sectionCount}>{owned.length}</Text>
            </View>
            <View style={styles.grid}>{owned.map(renderCard)}</View>
            {locked.length > 0 ? (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.section}>MEET ALONG THE WAY</Text>
                  <Glyph
                    name="compass"
                    size={19}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.sectionNote}>
                  Every session brings someone new a little closer.
                </Text>
                <View style={styles.grid}>{locked.map(renderCard)}</View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, palette, typography, card, glass, solid }: AppTheme) => StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    backgroundColor: colors.background,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  segment: { paddingHorizontal: 18, paddingBottom: 12 },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingVertical: 16,
    paddingRight: 2,
    ...outlinedCard(glass),
    borderRadius: 24,
  },
  heroText: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: fonts.bodyBlack,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.textSecondary,
  },
  heroTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: 23,
    lineHeight: 26,
    color: colors.ink,
    marginTop: 5,
  },
  heroBody: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5,
  },
  note: {
    ...card,
    marginTop: 14,
    borderRadius: 16,
    paddingLeft: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink,
    paddingVertical: 11,
  },
  noteClose: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 12,
  },
  section: {
    fontFamily: fonts.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textSecondary,
  },
  sectionCount: {
    fontFamily: fonts.displayHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  sectionNote: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: -5,
    marginBottom: 13,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { padding: 15, minHeight: 204, flex: 1 },
  cardLocked: { backgroundColor: solid ? colors.surfaceSunken : withAlpha(colors.surfaceSunken, 0.45) },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  equippedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: fonts.displayHeavy,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    marginTop: 10,
  },
  ability: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: "auto",
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  tagOn: { borderColor: colors.ink },
  tagText: { fontFamily: fonts.bodyHeavy, fontSize: 10.5, color: colors.ink },
  unlock: { marginTop: "auto" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    overflow: "hidden",
    marginBottom: 7,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: palette.violet,
  },
  unlockLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  unlockCount: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 10,
    color: colors.violet,
    marginTop: 3,
  },
});
