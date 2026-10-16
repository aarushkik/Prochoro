import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { bossForNode } from "@/data/bosses";
import { BOSS_ART } from "@/data/characterArt";
import type { SkylineKind } from "@/data/tracks";
import { useAppTheme } from "@/theme/ThemeProvider";

interface Props {
  nodeId?: string;
  kind?: SkylineKind;
  tier?: number;
  size?: number;
  dim?: boolean;
  ink?: "light" | "dark";
}

/** Six separate hand-drawn rivals per family, cropped from a 3-by-2 atlas. */
export const BossSprite = memo(function BossSprite({
  nodeId,
  kind = "waves",
  tier = 1,
  size = 140,
  dim = false,
  ink,
}: Props) {
  const theme = useAppTheme();
  const boss = nodeId ? bossForNode(nodeId) : null;
  const family = boss?.kind ?? kind;
  const rank = Math.max(1, Math.min(6, Math.trunc(boss?.tier ?? tier) || 1));
  const column = (rank - 1) % 3;
  const row = Math.floor((rank - 1) / 3);
  return (
    <View
      testID={`boss-art-${family}-${rank}`}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.window,
        {
          width: size,
          height: size,
          opacity: dim ? 0.68 : 1,
        },
      ]}
    >
      <Image
        source={BOSS_ART[family]}
        resizeMode="stretch"
        tintColor={ink === "light" ? "#FFFFFF" : ink === "dark" ? "#111111" : theme.isDark ? "#FFFFFF" : "#111111"}
        fadeDuration={0}
        accessible={false}
        style={{
          position: "absolute",
          width: size * 3,
          height: size * 2,
          left: -column * size,
          top: -row * size,
        }}
      />
    </View>
  );
});
const styles = StyleSheet.create({
  window: { overflow: "hidden", flexShrink: 0 },
});
