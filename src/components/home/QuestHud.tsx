import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glyph, type GlyphName } from '@/components/icons';
import { Mascot } from '@/components/Mascot';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { companionById } from '@/data/companions';
import { fonts } from '@/theme';

interface QuestHudProps {
  streakDays: number;
  gems: number;
  xp: number;
  /** Who is equipped, so the way in to the roster shows what is in it. */
  equippedId?: string;
  onOpenCharacters?: () => void;
  /** The HUD floats over the screen; the screen insets its content by this. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * The status row above the map: streak, gems, XP, and the way in to your
 * characters.
 *
 * **Every chip says what it is.** It used to be three numbers behind three
 * abstract shapes — a cropped face, a rotated square and an open ring — and on
 * a new account all three read `0`. Three zeroes next to three shapes is not a
 * status bar, it is decoration, and there was nothing on the screen that
 * explained any of it. Each now carries its own unit in small caps, which is
 * the whole difference between "0" and "0 DAY".
 *
 * The units are singular or plural against the actual number, because "1 DAYS"
 * on the day a streak starts is exactly the moment the app should look like it
 * is paying attention.
 *
 * The last chip is the equipped companion rather than Stu. Equipping one had
 * no visible consequence anywhere you actually play — you chose Buddy, went
 * back to the map, and nothing on screen had changed — so the companion now
 * rides in the HUD, which is both the reminder of what is active and the way
 * back to swap it.
 *
 * **It floats.** The HUD is glass over the map rather than a band above it:
 * the trail scrolls up underneath and shows through, and the page fades out
 * under the status bar so the clock never sits on top of a trail stop. The
 * three numbers share one capsule — they are one readout, and three separate
 * bordered boxes made the top of the screen busier than the map — and the
 * companion has its own round glass button beside it, because it is the one
 * thing up here you can press.
 */
export function QuestHud({ streakDays, gems, xp, equippedId, onOpenCharacters, onLayout }: QuestHudProps) {
  const { colors, palette, glass } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const companion = companionById(equippedId ?? null);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]} onLayout={onLayout} pointerEvents="box-none">
      <LinearGradient
        pointerEvents="none"
        colors={glass.edgeFade}
        locations={[0, 0.5, 1]}
        style={styles.edge}
      />
      <GlassSurface style={styles.stats}>
        <Stat
          icon="flame"
          tint={palette.ember}
          value={streakDays}
          unit="day streak"
          label={`${streakDays} day streak`}
        />
        <View style={styles.divider} />
        <Stat
          icon="gem"
          tint={colors.primary}
          value={gems}
          unit={gems === 1 ? 'gem' : 'gems'}
          label={`${gems} gems`}
        />
        <View style={styles.divider} />
        <Stat
          icon="star"
          tint={palette.violet}
          value={xp}
          unit="total XP"
          label={`${xp} experience points`}
        />
      </GlassSurface>

      {/* The press scales the whole glass button, not just what is inside
          it — it is the glass you are pressing. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          companion ? `${companion.name} equipped. Open your characters.` : 'Your characters'
        }
        onPress={onOpenCharacters}
        style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
      >
        <GlassSurface style={styles.avatarGlass} interactive>
          {companion ? (
            <CompanionSprite id={companion.id} tint={companion.tint} size={40} radius={20} />
          ) : (
            <Mascot pose="neutral" size={40} />
          )}
        </GlassSurface>
      </Pressable>
    </View>
  );
}

function Stat({
  icon,
  tint,
  value,
  unit,
  label,
}: {
  icon: GlyphName;
  tint: string;
  value: number;
  unit: string;
  label: string;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.stat} accessible accessibilityLabel={label}>
      <View style={styles.statTop}>
        <Glyph name={icon} size={16} color={tint} strokeWidth={2.6} />
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {value >= 10000 ? `${Math.round(value / 1000)}k` : value.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const HEIGHT = 54;

const createStyles = ({ colors }: AppTheme) => StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  // Runs a little past the HUD so the fade finishes below the glass, not at
  // its edge.
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -16 },

  stats: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    paddingHorizontal: 6,
  },
  stat: { flex: 1, minWidth: 0, alignItems: 'center' },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  value: { fontFamily: fonts.displayHeavy, fontSize: 18, lineHeight: 22, flexShrink: 1, color: colors.ink },
  // Small, muted and set apart from the number, so it names the number without
  // competing with it.
  unit: { fontFamily: fonts.bodyBlack, fontSize: 9, lineHeight: 13, color: colors.textSecondary },
  divider: { width: 1, height: 26, borderRadius: 1, backgroundColor: colors.overlay },

  // Rounded so the web focus ring is a circle around the button.
  avatar: { borderRadius: HEIGHT / 2 },
  avatarGlass: {
    width: HEIGHT,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: { transform: [{ scale: 0.92 }] },
  avatarArt: { width: 40, height: 40, borderRadius: 20 },
});
