import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useState, useRef, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useQuest } from "@/state/QuestContext";
import { bossForNode } from "@/data/bosses";
import { BOSS_TIERS } from "@/data/questMap";
import { BossSprite } from "./BossSprite";
import { AreaIllustration } from '@/components/ui/AreaBackdrop';
import { colors, fonts, selectedCard } from "@/theme";

export function BossFieldGuide() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { fontScale, width } = useWindowDimensions();
  const { map, earned, stateOf } = useQuest();
  const [area, setArea] = useState(0);
  const areaStrip = useRef<ScrollView>(null);
  useEffect(() => {
    areaStrip.current?.scrollTo({
      x: Math.max(0, area * 52 - (Math.min(width, 620) - 36) / 2 + 22),
      animated: false,
    });
  }, [area, width]);
  const unit = map.units[area] ?? map.units[0];
  const bosses = unit.nodes.filter((n) => n.kind === "boss");
  const family = bossForNode(bosses[0].id)!;
  return (
    <View style={styles.root}>
      <Text style={styles.intro}>
        Every area has six boss rivals. Beat them to open the next area.
      </Text>
      <ScrollView
        ref={areaStrip}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.areas}
      >
        {map.units.map((u, index) => (
          <Pressable
            key={u.id}
            accessibilityRole="button"
            accessibilityLabel={`Show bosses in ${u.areaName}`}
            accessibilityState={{ selected: area === index }}
            onPress={() => setArea(index)}
            style={[styles.area, area === index && styles.activeArea]}
          >
            <Text
              style={[styles.areaText, area === index && styles.activeText]}
            >
              {index + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={[styles.chapter, { backgroundColor: appTheme.isDark ? colors.primaryTint : unit.track.sky }]}>
        <AreaIllustration kind={family.kind} opacity={0.22} />
        <View style={styles.chapterCopy}>
          <Text style={styles.eyebrow}>FIELD GUIDE · AREA {area + 1}</Text>
          <Text style={styles.title}>{unit.areaName}</Text>
          <Text style={styles.lore}>{family.lore}</Text>
        </View>
        <BossSprite nodeId={bosses[5].id} size={120} />
      </View>
      <View style={styles.grid}>
        {bosses.map((node) => {
          const defeated = earned.includes(node.id);
          const ready = stateOf(node.id) === "current";
          return (
            <View
              key={node.id}
              style={[
                styles.card,
                fontScale > 1.3 && { flexBasis: "100%" },
                defeated && { borderColor: colors.success },
              ]}
              accessible
              accessibilityLabel={`${node.title}. ${BOSS_TIERS[Math.min(5, Math.max(0, (node.tier ?? 1) - 1))]}. ${defeated ? "Defeated" : ready ? "Ready on your path" : "Ahead on your path"}`}
            >
              <View style={styles.rank}>
                <Text style={styles.rankText}>
                  {BOSS_TIERS[Math.min(5, Math.max(0, (node.tier ?? 1) - 1))].toUpperCase()}
                </Text>
              </View>
              <BossSprite nodeId={node.id} size={112} />
              <Text style={styles.name}>{node.title}</Text>
              <Text style={styles.status}>
                {defeated
                  ? "✓ Defeated"
                  : ready
                    ? "Ready on your path"
                    : "Ahead on your path"}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.foot}>
        Meet each guardian on the Path tab. Finish its question set with at
        least 60% correct to move forward.
      </Text>
    </View>
  );
}
const createStyles = ({ colors, palette, typography, card, glass }: AppTheme) => StyleSheet.create({
  root: { gap: 16 },
  intro: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  areas: { gap: 8, paddingVertical: 3 },
  area: {
    ...card,
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  // The chosen area is lit the way a selected card is: tinted and ringed.
  activeArea: selectedCard(glass, colors.primary),
  areaText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  activeText: { color: colors.primaryDeep },
  chapter: {
    ...card,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  chapterCopy: { flex: 1, minWidth: 165 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: 25,
    lineHeight: 29,
    color: colors.ink,
    marginVertical: 5,
  },
  lore: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    ...card,
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 128,
    alignItems: "center",
    padding: 12,
    borderRadius: 23,
  },
  rank: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSunken,
  },
  rankText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.7,
    color: colors.ink,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    lineHeight: 21,
    textAlign: "center",
    color: colors.ink,
  },
  status: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 5,
  },
  foot: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    padding: 8,
  },
});
