import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '@/theme/ThemeProvider';
import { UtilityIllustration, type UtilityIllustrationId } from '@/components/ui/UtilityIllustration';
import { ActivityIllustration } from '@/components/ui/ActivityIllustration';

export type GlyphName = 'check' | 'close' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'arrow-right' | 'plus' | 'lock' | 'info' | 'refresh' | 'play' | 'flame' | 'gem' | 'heart' | 'star' | 'crown' | 'trophy' | 'medal' | 'sparkle' | 'target' | 'book' | 'bolt' | 'page' | 'chest' | 'flag' | 'swords' | 'shield' | 'map' | 'compass' | 'chart' | 'avatar' | 'layers' | 'rocket' | 'quill' | 'brain' | 'clock' | 'calendar' | 'bulb';
interface GlyphProps { name: GlyphName; size?: number; color?: string; strokeWidth?: number }
const utility: Partial<Record<GlyphName, UtilityIllustrationId>> = {
  flame: 'streak', gem: 'gems', star: 'xp', sparkle: 'xp', crown: 'score5', trophy: 'score5', medal: 'score4',
  map: 'map', compass: 'map', clock: 'class', calendar: 'exam', bulb: 'undecided',
};
const activity: Partial<Record<GlyphName, string>> = {
  book: 'lesson', page: 'study', bolt: 'drill', chest: 'bonus', layers: 'builder', rocket: 'advanced_review', quill: 'study', brain: 'ap_ready',
};

/** Small interface controls stay precise; study/reward artwork uses authored ink assets. */
export function Glyph({ name, size = 24, color: explicitColor, strokeWidth = 1.7 }: GlyphProps) {
  const { colors } = useAppTheme();
  const color = explicitColor ?? colors.ink;
  const utilityId = utility[name];
  if (utilityId) return <UtilityIllustration id={utilityId} size={size} color={color} />;
  const activityId = activity[name];
  if (activityId) return <ActivityIllustration id={activityId} size={size} color={color} />;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G stroke={color} strokeWidth={Math.min(strokeWidth, 2)} strokeLinecap="round" strokeLinejoin="round">{control(name)}</G></Svg>;
}
function control(name: GlyphName): React.ReactNode {
  switch (name) {
    case 'check': return <Path d="M5 12.5 9.5 17 19 7" />;
    case 'close': return <Path d="m6 6 12 12M18 6 6 18" />;
    case 'chevron-left': return <Path d="m15 5-7 7 7 7" />;
    case 'chevron-right': return <Path d="m9 5 7 7-7 7" />;
    case 'chevron-down': return <Path d="m5 9 7 7 7-7" />;
    case 'arrow-right': return <Path d="M4 12h15m-6-6 6 6-6 6" />;
    case 'plus': return <Path d="M12 5v14M5 12h14" />;
    case 'lock': return <><Path d="M8 10V7a4 4 0 0 1 8 0v3" /><Rect x={5} y={10} width={14} height={11} rx={3} /><Path d="M12 14v3" /></>;
    case 'info': return <><Circle cx={12} cy={12} r={9} /><Path d="M12 11v6M12 7v.2" /></>;
    case 'refresh': return <><Path d="M19 11a7.5 7.5 0 1 0 .3 4M19 4v6h-6" /></>;
    case 'play': return <Path d="m8 5 11 7-11 7Z" />;
    case 'heart': return <Path d="M12 21C5 16 3 12 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 3-2 7-9 12Z" />;
    case 'target': return <><Circle cx={12} cy={12} r={9} /><Circle cx={12} cy={12} r={4} /><Path d="M12 12h.1" /></>;
    case 'flag': return <><Path d="M6 21V3m0 1h13l-3 5 3 5H6" /></>;
    case 'swords': return <><Path d="m5 3 14 15m-1-2 3 3m-5 0 4-4M19 3 5 18m1-2-3 3m5 0-4-4M5 3v4m14-4v4" /></>;
    case 'shield': return <Path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z" />;
    case 'chart': return <><Path d="M4 20h17M7 16v-5m5 5V5m5 11V8" /></>;
    case 'avatar': return <><Circle cx={12} cy={8} r={4} /><Path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>;
    default: return null;
  }
}
