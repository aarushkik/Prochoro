import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BossSprite } from "./BossSprite";
import { bossForNode } from "@/data/bosses";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { colors, fonts } from "@/theme";

/** Seals are the real correct-answer target, not a second combat scoring system. */
export function BossEncounter({
  nodeId,
  correct,
  total,
}: {
  nodeId: string;
  correct: number;
  total: number;
}) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const boss = bossForNode(nodeId)!;
  const target = Math.ceil(total * 0.6);
  const opened = Math.min(correct, target);
  const { motionEnabled } = useMotionPreference();
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!correct || !motionEnabled) {
      flash.setValue(0);
      return;
    }
    flash.setValue(1);
    const animation = Animated.timing(flash, {
      toValue: 0,
      duration: 420,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [correct, motionEnabled, flash]);
  return (
    <View style={[styles.card, { backgroundColor: appTheme.isDark ? colors.primaryTint : boss.light }]}>
      <View style={styles.art}>
        <BossSprite nodeId={nodeId} size={84} />
        <Animated.View
          pointerEvents="none"
          style={[styles.flash, { opacity: flash }]}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.kicker}>{boss.species.toUpperCase()}</Text>
        <Text style={styles.name}>{boss.name}</Text>
        <View
          style={styles.seals}
          accessible
          accessibilityLabel={`${opened} of ${target} seals opened`}
        >
          {Array.from({ length: target }, (_, i) => (
            <View
              key={i}
              style={[styles.seal, i < opened && styles.sealOpen]}
            >
              <Text style={[styles.mark, i < opened && styles.markOpen]}>{i < opened ? "✓" : "·"}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          {opened >= target
            ? "Target reached. Finish the set to clear the encounter."
            : `${target - opened} more correct to open every seal.`}
        </Text>
      </View>
    </View>
  );
}
const createStyles = ({ colors, palette, typography, stroke }: AppTheme) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 21,
    padding: 10,
    gap: 8,
    marginBottom: 20,
  },
  art: { width: 84, height: 84 },
  flash: {
    position: "absolute",
    left: 5,
    top: 5,
    width: 74,
    height: 74,
    borderWidth: stroke.surface,
    borderRadius: 37,
    borderColor: colors.surface,
  },
  body: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  name: {
    fontFamily: fonts.displayHeavy,
    fontSize: 19,
    lineHeight: 23,
    color: colors.ink,
  },
  seals: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginVertical: 6 },
  seal: {
    width: 19,
    height: 19,
    borderWidth: 1.5,
    borderRadius: 6,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: "center",
    justifyContent: "center",
  },
  sealOpen: { borderColor: colors.ink, borderWidth: 2 },
  mark: { fontSize: 12, color: colors.textMuted, fontWeight: "800" },
  markOpen: { color: colors.ink },
  note: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
