/** Moments in the study journey, each with its own authored platypus drawing. */
export type MascotPose =
  | 'neutral' | 'thinking' | 'excited' | 'surprised' | 'worried' | 'celebrate' | 'proud' | 'sleepy' | 'sad'
  | 'reading' | 'meditate' | 'wave' | 'point' | 'map' | 'idea'
  | 'thumbsup' | 'wince' | 'trophy'
  | 'streakOn' | 'streakLost' | 'streakFreeze'
  | 'bossReady' | 'bossWin' | 'bossLose'
  | 'levelUp' | 'progress' | 'chest';

export type MascotSize = 'tiny' | 'small' | 'medium' | 'large' | 'xl';

export interface MascotProps {
  pose?: MascotPose;
  size?: MascotSize | number;
  /** Kept for caller compatibility; the drawings do not idle or float. */
  animated?: boolean;
  /** Kept for caller compatibility; no artificial contact shadow is drawn. */
  shadow?: boolean;
  /** Override for a surface whose contrast differs from the app theme. */
  ink?: 'light' | 'dark';
}

export const MASCOT_SIZES: Record<MascotSize, number> = {
  tiny: 44, small: 80, medium: 120, large: 176, xl: 232,
};
export const MASCOT_ASPECT = 1;

/** 27 purpose-drawn poses across three transparent, monochrome atlases. */
export const MASCOT_SHEETS = {
  expressions: require('../../assets/mascot/prochoro/expressions.png'),
  activities: require('../../assets/mascot/prochoro/activities.png'),
  moments: require('../../assets/mascot/prochoro/moments.png'),
} as const;

export const MASCOT_FRAMES: Record<MascotPose, { sheet: keyof typeof MASCOT_SHEETS; index: number }> = {
  neutral: { sheet: 'expressions', index: 0 },
  excited: { sheet: 'expressions', index: 1 },
  sad: { sheet: 'expressions', index: 2 },
  thinking: { sheet: 'expressions', index: 3 },
  surprised: { sheet: 'expressions', index: 4 },
  worried: { sheet: 'expressions', index: 6 },
  proud: { sheet: 'expressions', index: 5 },
  sleepy: { sheet: 'expressions', index: 7 },
  celebrate: { sheet: 'expressions', index: 8 },
  reading: { sheet: 'activities', index: 0 },
  wave: { sheet: 'activities', index: 1 },
  point: { sheet: 'activities', index: 2 },
  meditate: { sheet: 'activities', index: 3 },
  map: { sheet: 'activities', index: 4 },
  idea: { sheet: 'activities', index: 5 },
  thumbsup: { sheet: 'activities', index: 6 },
  wince: { sheet: 'activities', index: 7 },
  trophy: { sheet: 'activities', index: 8 },
  bossReady: { sheet: 'moments', index: 0 },
  bossWin: { sheet: 'moments', index: 1 },
  bossLose: { sheet: 'moments', index: 2 },
  streakOn: { sheet: 'moments', index: 3 },
  streakLost: { sheet: 'moments', index: 4 },
  streakFreeze: { sheet: 'moments', index: 5 },
  levelUp: { sheet: 'moments', index: 6 },
  progress: { sheet: 'moments', index: 7 },
  chest: { sheet: 'moments', index: 8 },
};

/** A static source for places that need a brand mark. */
export const MASCOT_MARK = require('../../assets/mascot/prochoro/mark.png');
