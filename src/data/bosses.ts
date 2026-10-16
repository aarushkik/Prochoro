import type { SkylineKind } from "./tracks";
import { tracksFor } from "./tracks";

export interface BossFamily {
  kind: SkylineKind;
  species: string;
  color: string;
  light: string;
  names: readonly string[];
  lore: string;
}
/** Prochoro study rivals. IDs are visual metadata; saved stop IDs stay stable. */
export const BOSS_FAMILIES: Record<SkylineKind, BossFamily> = {
  waves: {
    kind: "waves",
    species: "Shore rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Scout", "Shelly", "Sandy", "Finn", "Pearl", "Coach Coral"],
    lore: "The shore rivals test your recall. Break their guard with clear answers before you head up the trail.",
  },
  towers: {
    kind: "towers",
    species: "Library rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Ollie", "Penny", "Robin", "Winnie", "Hazel", "Professor Page"],
    lore: "These library owls collect facts, spot connections, and help every explorer leave with a clearer idea.",
  },
  chimneys: {
    kind: "chimneys",
    species: "Lab rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Sunny", "Pip", "Rusty", "Ginger", "Ruby", "Professor Spark"],
    lore: "The lab team likes asking why. Bring your best explanations to their next experiment.",
  },
  mesa: {
    kind: "mesa",
    species: "Field rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Dusty", "Daisy", "Cliff", "Olive", "Jasper", "Ranger Rose"],
    lore: "The canyon field team turns careful observations into useful clues. Check your notes before you move on.",
  },
  gears: {
    kind: "gears",
    species: "Workshop rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Chip", "Dot", "Teddy", "Archie", "Eddie", "Coach Build"],
    lore: "The workshop team breaks big problems into small steps, then checks whether each solution works.",
  },
  islands: {
    kind: "islands",
    species: "Ocean rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Bubbles", "Coco", "Skippy", "Marina", "Nori", "Captain Notes"],
    lore: "The island team has plenty of questions and enough helping hands to work through every answer.",
  },
  ridge: {
    kind: "ridge",
    species: "Discovery rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Rocky", "Poppy", "Miles", "Amber", "Mason", "Professor Stone"],
    lore: "The discovery team pieces together evidence. Every clue helps make the next answer stronger.",
  },
  reeds: {
    kind: "reeds",
    species: "Garden rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Hoppy", "Lily", "Basil", "Fern", "Clover", "Coach Green"],
    lore: "The garden team grows understanding a little each day. Their checkpoints reward steady practice.",
  },
  pylons: {
    kind: "pylons",
    species: "Ideas rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Buzz", "Bea", "Ziggy", "June", "Stella", "Professor Bright"],
    lore: "The ideas team loves a clear explanation. Show how the pieces connect to light the way forward.",
  },
  peak: {
    kind: "peak",
    species: "Summit rivals",
    color: "#111111",
    light: "#FFFFFF",
    names: ["Snowy", "Alfie", "Aspen", "Hugo", "Everest", "Coach Summit"],
    lore: "The summit team brings everything together. Take your time, trust your practice, and finish the climb.",
  },
};
export function bossForNode(nodeId: string) {
  const match = nodeId.match(/^(.*)-u(\d+)-s([1-6])-boss$/);
  if (!match) return null;
  const track = tracksFor(match[1])[Number(match[2]) - 1];
  if (!track) return null;
  const tier = Number(match[3]);
  const family = BOSS_FAMILIES[track.kind];
  return {
    ...family,
    tier,
    name: family.names[tier - 1],
    place: track.place,
    key: `${track.kind}-${tier}`,
  };
}
