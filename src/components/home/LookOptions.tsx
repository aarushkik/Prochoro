import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { LOOK_ART } from '@/data/lookArt';
import { NO_LOOK } from '@/data/looks';
import { useQuest } from '@/state/QuestContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';

/** One hat on its own: the solid layer in the colour behind it, then the ink. */
export function HatArt({ id, size, surface, dim = false }: { id: string; size: number; surface: string; dim?: boolean }) {
  const { colors } = useAppTheme();
  const art = LOOK_ART[id];
  if (!art) return null;
  const box = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size }, dim && styles.dim]}>
      <Image source={art.fill} tintColor={surface} fadeDuration={0} accessible={false} style={box} />
      <Image source={art.ink} tintColor={colors.ink} fadeDuration={0} accessible={false} style={box} />
    </View>
  );
}

/**
 * Every hat, earned or not. An earned hat goes on with one tap; an unearned
 * one says exactly what earns it and how close you are.
 */
export function LookOptions() {
  const { looks, lookId, wear } = useQuest();
  const { colors } = useAppTheme();
  const themed = useThemedStyles(createStyles);
  const haptic = useHaptics();
  const layout = useScreenLayout();
  const art = 76 * Math.min(layout.scale, 1.15);
  return (
    <View style={themed.grid}>
      {looks.map(look => {
        const worn = look.id === lookId;
        const status = !look.owned ? `${look.unlock?.label}, ${look.have} of ${look.need}` : worn ? 'Wearing' : 'Tap to wear';
        const progress = look.need > 0 ? Math.min(100, Math.round((look.have / look.need) * 100)) : 0;
        return (
          <Pressable key={look.id} accessibilityRole="button" accessibilityState={{ selected: worn, disabled: !look.owned }}
            accessibilityLabel={`${look.name}. ${status}`} disabled={!look.owned}
            onPress={() => { if (!worn) { haptic(); wear(look.id); } }}
            style={({ pressed }) => [themed.tile, layout.wide && themed.tileWide, worn && themed.tileOn, pressed && themed.pressed]}>
            <View style={[themed.art, { height: art }]}>
              {look.id === NO_LOOK
                ? <Mascot pose="neutral" size={art * 0.82} look={null} surface={colors.surface} />
                : <HatArt id={look.id} size={art} surface={colors.surface} dim={!look.owned} />}
              {!look.owned ? <View style={themed.lock}><Glyph name="lock" size={13} /></View> : null}
            </View>
            <Text style={[themed.name, !look.owned && themed.off]} numberOfLines={1}>{look.name}</Text>
            {look.owned
              ? <Text style={[themed.status, worn && themed.statusOn]} numberOfLines={2}>{status}</Text>
              // The requirement, then how close you are: a short bar and count
              // instead of one run-on line that wrapped mid-number on phones.
              : <>
                <Text style={themed.status} numberOfLines={2}>{look.unlock?.label}</Text>
                <View style={themed.progress}>
                  <View style={themed.meter}><View style={[themed.meterFill, { width: `${progress}%` }]} /></View>
                  <Text style={themed.count}>{`${look.have}/${look.need}`}</Text>
                </View>
              </>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ dim: { opacity: 0.32 } });

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '30%', flexGrow: 1, maxWidth: '32%', borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 10, paddingBottom: 12, alignItems: 'center', gap: 2 },
  tileWide: { flexBasis: '22%', maxWidth: '24%' },
  tileOn: { borderWidth: 2, borderColor: colors.ink, padding: 9, paddingBottom: 11 },
  pressed: { opacity: 0.7 },
  art: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  lock: { position: 'absolute', right: 2, top: 2, width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.subtitle, fontSize: 13, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  off: { color: colors.textMuted },
  status: { ...typography.caption, fontSize: 11, lineHeight: 14, textAlign: 'center', color: colors.textMuted },
  statusOn: { color: colors.ink },
  progress: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 6, marginTop: 4, paddingHorizontal: 4 },
  meter: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.overlay, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 2, backgroundColor: colors.textMuted },
  count: { ...typography.caption, fontSize: 11, lineHeight: 14, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});
