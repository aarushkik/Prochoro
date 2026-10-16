import type { ImageSourcePropType } from "react-native";
import type { SkylineKind } from "./tracks";

/** Original monochrome atlas art stays available offline. */
export const BOSS_ART: Record<SkylineKind, ImageSourcePropType> = {
  waves: require("../assets/characters/prochoro/bosses/waves.png"),
  towers: require("../assets/characters/prochoro/bosses/towers.png"),
  chimneys: require("../assets/characters/prochoro/bosses/chimneys.png"),
  mesa: require("../assets/characters/prochoro/bosses/mesa.png"),
  gears: require("../assets/characters/prochoro/bosses/gears.png"),
  islands: require("../assets/characters/prochoro/bosses/islands.png"),
  ridge: require("../assets/characters/prochoro/bosses/ridge.png"),
  reeds: require("../assets/characters/prochoro/bosses/reeds.png"),
  pylons: require("../assets/characters/prochoro/bosses/pylons.png"),
  peak: require("../assets/characters/prochoro/bosses/peak.png"),
};
