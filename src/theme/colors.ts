/** Prochoro's monochrome ink, paper, and glass palette. Character art stays hollow. */
export const palette = {
  ink: '#111111', inkSoft: '#303030', inkDeep: '#090909',
  turquoise: '#626262', turquoiseLight: '#D7D7D7', turquoiseDeep: '#262626',
  turquoiseTint: '#ECECE9', turquoiseSky: '#F1F1EF',
  orange: '#D6D6D1', orangeDeep: '#666666', orangeDark: '#262626',
  cream: '#FFFFFF', parchment: '#FFFFFF', sand: '#E7E7E4', sandDeep: '#B8B8B4',
  locked: '#ECECEA', lockedInk: '#737373',
  night: '#000000', nightRaised: '#191919',
  muted: '#727272', mutedDeep: '#626262', mutedDark: '#585858', mutedLight: '#909090',
  violet: '#383838', violetLight: '#D7D7D7', violetMid: '#999999',
  ember: '#606060', green: '#414141', greenDeep: '#242424',
  white: '#FFFFFF',
  hero: {
    from: '#252525', to: '#111111', edge: '#626262', lip: '#080808',
    title: '#FFFFFF', body: '#D3D3D3', kicker: '#ECECEC', faint: '#AAAAAA',
    glow: 'rgba(0,0,0,0.10)',
  },
} as const;

export const colors = {
  ink: palette.ink,
  border: '#D2D2CF',
  background: palette.parchment,
  surface: palette.cream,
  surfaceSelected: palette.turquoiseTint,
  night: palette.night,
  nightRaised: palette.nightRaised,
  primary: palette.ink,
  primaryLight: '#6F6F6F',
  primaryDeep: palette.inkDeep,
  primaryTint: palette.turquoiseTint,
  current: palette.orange,
  currentDeep: palette.orangeDeep,
  locked: palette.locked,
  lockedText: palette.lockedInk,
  textPrimary: palette.ink,
  textSecondary: '#4E4E4E',
  textMuted: '#626262',
  textFaint: '#858585',
  textOnInk: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  success: '#242424', successDeep: '#111111', successDark: '#111111', successSoft: '#E6E6E3',
  danger: '#5C5C5C', dangerDark: '#353535', dangerSoft: '#EDEDEB',
  violet: '#454545',
  gold: '#303030', goldDeep: '#1B1B1B', goldDark: '#1B1B1B',
  surfaceSunken: '#EFEFEC',
  track: 'rgba(0,0,0,0.10)',
  lip: '#9A9A9A',
  overlayFaint: 'rgba(0,0,0,0.04)',
  overlaySoft: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.14)',
  overlayStrong: 'rgba(0,0,0,0.22)',
  disabledBg: palette.locked,
  disabledEdge: palette.sandDeep,
  disabledText: palette.lockedInk,
  splash: '#171717', splashDeep: '#090909', splashMid: '#666666', splashSoft: '#EAEAE7',
  primaryDark: '#111111', primarySoft: '#EFEFEC',
  black: '#111111', white: '#FFFFFF',
} as const;

export type ThemeColors = { [K in keyof typeof colors]: string };

export const darkColors: ThemeColors = {
  ...colors,
  ink: '#FAFAFA', border: '#3D3D3D', background: '#000000',
  surface: '#191919', surfaceSelected: '#272727', surfaceSunken: '#111111',
  track: 'rgba(255,255,255,0.14)', lip: '#050505',
  overlayFaint: 'rgba(255,255,255,0.05)', overlaySoft: 'rgba(255,255,255,0.09)',
  overlay: 'rgba(255,255,255,0.15)', overlayStrong: 'rgba(255,255,255,0.23)',
  primary: '#F4F4F4', primaryDeep: '#FFFFFF', primaryTint: '#272727',
  primaryLight: '#D4D4D4', primarySoft: '#292929', primaryDark: '#FFFFFF',
  textPrimary: '#FAFAFA', textSecondary: '#D1D1D1', textMuted: '#B8B8B8',
  textFaint: '#929292', textOnPrimary: '#111111', textOnInk: '#111111',
  success: '#F3F3F3', successDeep: '#FFFFFF', successDark: '#FFFFFF', successSoft: '#303030',
  danger: '#CECECE', dangerDark: '#F1F1F1', dangerSoft: '#303030',
  violet: '#D9D9D9', gold: '#EEEEEE', goldDeep: '#FFFFFF', goldDark: '#FFFFFF',
  current: '#D6D6D1', currentDeep: '#F4F4F4',
  locked: '#262626', lockedText: '#A4A4A4',
  disabledBg: '#262626', disabledEdge: '#3B3B3B', disabledText: '#A4A4A4',
};

/** Subject accents now differ in value only; course art carries identity. */
export const accents = {
  green: { base: '#313131', soft: '#EAEAE8', deep: '#171717' },
  violet: { base: '#484848', soft: '#E8E8E6', deep: '#242424' },
  coral: { base: '#5A5A5A', soft: '#E8E8E6', deep: '#303030' },
  amber: { base: '#373737', soft: '#ECECE9', deep: '#171717' },
  sky: { base: '#505050', soft: '#E7E7E5', deep: '#272727' },
  lime: { base: '#414141', soft: '#EAEAE8', deep: '#202020' },
  pink: { base: '#595959', soft: '#E5E5E3', deep: '#303030' },
  gold: { base: '#343434', soft: '#EBEBE8', deep: '#171717' },
} as const;
export type AccentName = keyof typeof accents;
export type Accent = (typeof accents)[AccentName];

export const stopColors = {
  available: { face: '#FFFFFF', edge: '#111111' },
  current: { face: '#D6D6D1', edge: '#666666' },
  locked: { face: '#ECECEA', edge: '#B8B8B4' },
} as const;
export const questNode = {
  lesson: { face: '#373737', edge: '#111111', ring: '#EAEAE8' },
  drill: { face: '#484848', edge: '#222222', ring: '#E7E7E5' },
  study: { face: '#4D4D4D', edge: '#292929', ring: '#EBEBE8' },
  bonus: { face: '#626262', edge: '#373737', ring: '#ECECE9' },
  boss: { face: '#111111', edge: '#090909', ring: '#D6D6D1' },
  locked: { face: '#ECECEA', edge: '#B8B8B4', ring: '#E7E7E4' },
} as const;
export type QuestNodeKind = keyof typeof questNode;

export const nightScreens = [
  'Splash', 'Summary', 'LevelUp', 'UnlockMoment', 'BossIntro', 'BossFight',
  'Victory', 'Defeat', 'PlacementResult', 'WorldDone', 'Review', 'ReviewDone',
] as const;
export type NightScreen = (typeof nightScreens)[number];
export const confettiColors = ['#FFFFFF', '#D8D8D8', '#ABABAB', '#777777', '#333333'] as const;
