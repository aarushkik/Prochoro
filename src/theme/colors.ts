/** Black ink on white, or its exact inverse. No painted gray content surfaces. */
function monochromePalette(dark = false) {
  const ink = dark ? '#FFFFFF' : '#000000';
  const paper = dark ? '#000000' : '#FFFFFF';
  const secondary = dark ? '#A6A6A6' : '#595959';
  return {
    ink, inkSoft: ink, inkDeep: ink,
    // Legacy names remain aliases so saved course/companion identities stay compatible.
    turquoise: ink, turquoiseLight: ink, turquoiseDeep: ink,
    turquoiseTint: paper, turquoiseSky: paper,
    orange: ink, orangeDeep: ink, orangeDark: ink,
    cream: paper, parchment: paper, sand: paper, sandDeep: secondary,
    locked: paper, lockedInk: secondary,
    night: paper, nightRaised: paper,
    muted: secondary, mutedDeep: secondary, mutedDark: secondary, mutedLight: secondary,
    violet: ink, violetLight: ink, violetMid: secondary,
    ember: ink, green: ink, greenDeep: ink,
    white: '#FFFFFF',
    hero: { from: paper, to: paper, edge: ink, lip: paper, title: ink,
      body: secondary, kicker: ink, faint: secondary, glow: 'transparent' },
  };
}
export const palette = monochromePalette();
export const darkPalette = monochromePalette(true);

export const colors = {
  ink: '#000000', border: 'rgba(0,0,0,0.16)',
  background: '#FFFFFF', surface: '#FFFFFF', surfaceSelected: '#FFFFFF',
  night: '#FFFFFF', nightRaised: '#FFFFFF',
  primary: '#000000', primaryLight: '#000000', primaryDeep: '#000000', primaryTint: '#FFFFFF',
  current: '#FFFFFF', currentDeep: '#000000', locked: '#FFFFFF', lockedText: '#737373',
  textPrimary: '#000000', textSecondary: '#595959', textMuted: '#666666', textFaint: '#737373',
  textOnInk: '#FFFFFF', textOnPrimary: '#FFFFFF',
  success: '#000000', successDeep: '#000000', successDark: '#000000', successSoft: '#FFFFFF',
  danger: '#000000', dangerDark: '#000000', dangerSoft: '#FFFFFF',
  violet: '#000000', gold: '#000000', goldDeep: '#000000', goldDark: '#000000',
  surfaceSunken: '#FFFFFF', track: 'rgba(0,0,0,0.10)', lip: 'transparent',
  overlayFaint: 'rgba(0,0,0,0.025)', overlaySoft: 'rgba(0,0,0,0.05)',
  overlay: 'rgba(0,0,0,0.12)', overlayStrong: 'rgba(0,0,0,0.24)',
  disabledBg: '#FFFFFF', disabledEdge: 'rgba(0,0,0,0.12)', disabledText: '#737373',
  splash: '#FFFFFF', splashDeep: '#FFFFFF', splashMid: '#000000', splashSoft: '#FFFFFF',
  primaryDark: '#000000', primarySoft: '#FFFFFF', black: '#000000', white: '#FFFFFF',
} as const;
export type ThemeColors = { [K in keyof typeof colors]: string };
export const darkColors: ThemeColors = {
  ...colors,
  ink: '#FFFFFF', border: 'rgba(255,255,255,0.20)',
  background: '#000000', surface: '#000000', surfaceSelected: '#000000',
  night: '#000000', nightRaised: '#000000',
  primary: '#FFFFFF', primaryLight: '#FFFFFF', primaryDeep: '#FFFFFF', primaryTint: '#000000',
  current: '#000000', currentDeep: '#FFFFFF', locked: '#000000', lockedText: '#8C8C8C',
  textPrimary: '#FFFFFF', textSecondary: '#A6A6A6', textMuted: '#999999', textFaint: '#8C8C8C',
  textOnInk: '#000000', textOnPrimary: '#000000',
  success: '#FFFFFF', successDeep: '#FFFFFF', successDark: '#FFFFFF', successSoft: '#000000',
  danger: '#FFFFFF', dangerDark: '#FFFFFF', dangerSoft: '#000000',
  violet: '#FFFFFF', gold: '#FFFFFF', goldDeep: '#FFFFFF', goldDark: '#FFFFFF',
  surfaceSunken: '#000000', track: 'rgba(255,255,255,0.14)',
  overlayFaint: 'rgba(255,255,255,0.025)', overlaySoft: 'rgba(255,255,255,0.05)',
  overlay: 'rgba(255,255,255,0.12)', overlayStrong: 'rgba(255,255,255,0.24)',
  disabledBg: '#000000', disabledEdge: 'rgba(255,255,255,0.16)', disabledText: '#8C8C8C',
  splash: '#000000', splashDeep: '#000000', splashMid: '#FFFFFF', splashSoft: '#000000',
  primaryDark: '#FFFFFF', primarySoft: '#000000',
};

const accent = { base: '#000000', soft: '#FFFFFF', deep: '#000000' };
export const accents = { green: accent, violet: accent, coral: accent, amber: accent,
  sky: accent, lime: accent, pink: accent, gold: accent } as const;
export type AccentName = keyof typeof accents;
export type Accent = (typeof accents)[AccentName];
export const stopColors = {
  available: { face: '#FFFFFF', edge: '#000000' },
  current: { face: '#FFFFFF', edge: '#000000' },
  locked: { face: '#FFFFFF', edge: '#000000' },
} as const;
const node = { face: '#FFFFFF', edge: '#000000', ring: '#000000' };
export const questNode = { lesson: node, drill: node, study: node, bonus: node, boss: node, locked: node } as const;
export type QuestNodeKind = keyof typeof questNode;
export const nightScreens = ['Splash', 'Summary', 'LevelUp', 'UnlockMoment', 'BossIntro', 'BossFight',
  'Victory', 'Defeat', 'PlacementResult', 'WorldDone', 'Review', 'ReviewDone'] as const;
export type NightScreen = (typeof nightScreens)[number];
export const confettiColors = ['#000000', '#FFFFFF'] as const;
