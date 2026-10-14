import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MASCOT_ART } from '@/components/Mascot';
import { AppearanceControls } from '@/components/account/AppearanceControls';
import { links, openLink } from '@/lib/links';
import { ChunkyCard } from '@/components/ui';
import { colors, fonts, palette, litRim, withAlpha } from '@/theme';
import { Sheen } from '@/components/ui/Sheen';
import { useQuest } from '@/state/QuestContext';
import { getCourse } from '@/data';
import { useOnboarding } from '@/state/OnboardingContext';
import { useAuth } from '@/state/AuthContext';
import { useProfileSync } from '@/state/ProfileSync';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { unlockLabel } from '@/data/companions';
import { achievementsFor, isEarned } from '@/data/achievements';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

/**
 * Profile — who you are on the map.
 *
 * The header is a turquoise band rather than a card, so the tab reads as a
 * different place the moment it opens. Streak sits directly under it in the
 * loudest colour the palette has, because the streak is the thing a student
 * comes here to check.
 */

/**
 * `topInset` is the height of the floating HUD. The tinted banner runs up
 * underneath it, so the glass has the banner's colour behind it rather than a
 * strip of bare page.
 */
export function ProfilePanel({ topInset = 0 }: { topInset?: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const quest = useQuest();
  const { xp, streakDays, completed, map } = quest;
  // Levels are 500 XP apart; the quest state stores raw XP only.
  const level = Math.floor(xp / 500) + 1;
  const { courseId } = useOnboarding();
  const course = getCourse(courseId);
  const navigation = useNavigation<Nav>();
  // Owned first, closest unlock next — the same order the roster uses, so the
  // three shown here are the three that matter, and the equipped one leads.
  const { companions, equippedId } = quest;
  const preview = [
    ...companions.filter((c) => c.id === equippedId),
    ...companions.filter((c) => c.id !== equippedId),
  ].slice(0, 3);
  // Real progress, not three fixed rows. Closest-to-done leads the list.
  const achievements = achievementsFor({
    completed: quest.earned,
    map,
    skills: quest.skills,
    sessions: quest.sessions,
    perfectSessions: quest.perfectSessions,
    bestStreak: quest.bestStreak,
    xp,
  }).slice(0, 4);
  const { user, signOut, deleteAccount, deleting, error: authError } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { offline, error: syncError, notice, retry } = useProfileSync();

  const toNext = Math.max(0, level * 500 - xp);
  const levelPct = Math.min(100, Math.round(((xp % 500) / 500) * 100));

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} scrollIndicatorInsets={{ top: topInset }} showsVerticalScrollIndicator={false}>
      <View style={[styles.banner, { paddingTop: topInset + 14 }]}>
        <View style={styles.bannerGlow} pointerEvents="none" />
        <View style={styles.bannerRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Image source={MASCOT_ART.proud} style={styles.avatarArt} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.bannerBody}>
            <Text style={styles.name} numberOfLines={2}>
              {displayName(user?.user_metadata, user?.email)}
            </Text>
            <Text style={styles.meta}>
              {course?.name ?? 'Your course'} · Level {level} · {completed.length}/{map.order.length} stops
            </Text>
            <View style={styles.levelTrack}>
              <View style={[styles.levelFill, { width: `${levelPct}%` }]} />
            </View>
            <Text style={styles.levelNote}>{toNext} XP to Level {level + 1}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <AppearanceControls />
        {(offline || syncError) && <View style={styles.offline}><Text style={styles.offlineText}>{syncError ?? 'Your latest progress hasn’t reached your account yet. We’ll retry when you reconnect.'}</Text><Pressable accessibilityRole="button" onPress={retry} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.offlineText}>Try again</Text></Pressable></View>}
        {notice && <View style={styles.offline}><Text style={styles.offlineText}>{notice}</Text></View>}
        {authError && <View accessibilityRole="alert" style={styles.dangerBox}><Text style={styles.dangerBody}>{authError}</Text></View>}

        {/* Not a button. There is nothing behind a streak but the streak, so
            instead of a chevron that goes nowhere the card shows the last
            seven days directly. */}
        <View style={styles.streakWrap}>
          <View style={styles.streak}>
            <Sheen strength={0.35} />
            <Image source={MASCOT_ART.streakOn} style={styles.streakArt} resizeMode="contain" />
            <View style={styles.streakBody}>
              <Text style={styles.streakTitle}>{streakDays}-day streak</Text>
              <Text style={styles.streakNote}>One practice session a day keeps it going</Text>
              <Text style={styles.streakNote}>Best streak: {quest.bestStreak} days</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>COMPANIONS</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all companions"
            hitSlop={10}
            onPress={() => navigation.navigate('Characters')}
          >
            {/* Counted from the roster, so the link can never promise more
                companions than the screen behind it has. */}
            <Text style={styles.sectionLink}>See all {companions.length} ›</Text>
          </Pressable>
        </View>
        <View style={styles.companionRow}>
          {preview.map((c) => (
            <ChunkyCard
              key={c.id}
              onPress={() => navigation.navigate('Characters')}
              accessibilityLabel={`${c.name}, ${
                c.id === equippedId ? 'equipped' : unlockLabel(c)
              }`}
              style={styles.companion}
              contentStyle={styles.companionCard}
            >
              <CompanionSprite id={c.id} tint={c.tint} size={42} dim={!c.owned} />
              <Text style={[styles.companionName, !c.owned && styles.companionDim]}>{c.name}</Text>
              <Text style={[styles.companionMeta, !c.owned && styles.companionDim]} numberOfLines={1}>
                {c.id === equippedId ? 'Equipped' : unlockLabel(c)}
              </Text>
            </ChunkyCard>
          ))}
        </View>

        <Text style={styles.section}>ACHIEVEMENTS</Text>
        <View style={styles.stack}>
          {achievements.map((a) => {
            const earned = isEarned(a);
            const pct = Math.min(100, Math.round((a.have / a.need) * 100));
            return (
              <ChunkyCard key={a.id} contentStyle={styles.achieve}>
                <Image
                  source={MASCOT_ART[a.art]}
                  style={[styles.achieveArt, !earned && styles.achieveArtLocked]}
                  resizeMode="contain"
                />
                <View style={styles.achieveBody}>
                  <Text style={styles.achieveName}>{a.name}</Text>
                  <Text style={styles.achieveNote} numberOfLines={1}>
                    {a.note}
                  </Text>
                  {/* A bar as well as a tally: "2 of 25" is a number, the bar
                      is how close that actually is. */}
                  <View style={styles.achieveTrack}>
                    <View
                      style={[
                        styles.achieveFill,
                        { width: `${pct}%` },
                        earned && { backgroundColor: colors.success },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.achieveTally, earned && styles.achieveTallyDone]}>
                  {earned ? 'DONE' : `${Math.min(a.have, a.need)}/${a.need}`}
                </Text>
              </ChunkyCard>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={signOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <View style={styles.legalRow}>
          {(['privacy', 'terms', 'support'] as const).map((key) => <Pressable key={key} accessibilityRole="link" onPress={() => openLink(links[key])} style={styles.legalLink}><Text style={styles.legalText}>{key === 'privacy' ? 'Privacy' : key === 'terms' ? 'Terms' : 'Support'}</Text></Pressable>)}
        </View>
        {/* Account deletion, required by App Store guideline 5.1.1(ii) for any
            app that creates accounts — a support email is not accepted.

            Two steps, and the second one spells out what goes. This is the
            only irreversible control in the app, and the difference between a
            student idly tapping it and a student meaning it is being told,
            before the second tap, exactly how much they are about to lose. */}
        {confirmingDelete ? (
          <View style={styles.dangerBox}>
            <Text style={styles.dangerTitle}>Delete your account?</Text>
            <Text style={styles.dangerBody}>
              This removes your account and its saved progress — {xp} XP, your{' '}
              {streakDays}-day streak, and all {quest.earned.length} stops you have cleared. It cannot
              be undone, and starting again means starting from zero.
            </Text>
            <View style={styles.dangerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Keep my account"
                disabled={deleting}
                onPress={() => setConfirmingDelete(false)}
                style={({ pressed }) => [styles.keepBtn, pressed && styles.pressedShift]}
              >
                <Text style={styles.keepText}>Keep it</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Permanently delete my account"
                disabled={deleting}
                onPress={() => void deleteAccount()}
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressedShift]}
              >
                <Text style={styles.deleteText}>{deleting ? 'DELETING…' : 'DELETE FOREVER'}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete my account"
            onPress={() => setConfirmingDelete(true)}
            hitSlop={8}
            style={styles.deleteLink}
          >
            <Text style={styles.deleteLinkText}>Delete account</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * What to call the student.
 *
 * OAuth providers disagree about which field holds a name — Google sends
 * `full_name`, Microsoft often only `name` — and some accounts have neither,
 * so the email's local part is the last resort before a generic greeting.
 */
function displayName(meta: Record<string, unknown> | undefined, email: string | undefined): string {
  const named = meta?.full_name ?? meta?.name;
  if (typeof named === 'string' && named.trim()) return named.trim();
  if (email) return email.split('@')[0];
  return 'Your quest';
}

const createStyles = ({ colors, palette, typography, stroke, card, solid, glass }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 130 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legalLink: { minHeight: 44, justifyContent: 'center' },
  legalText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.primaryDeep, textDecorationLine: 'underline' },

  // A translucent wash of the brand tint, so the aurora runs on under it and
  // the floating HUD has colour to sit on.
  banner: {
    backgroundColor: solid ? colors.primaryTint : withAlpha(colors.primaryTint, 0.6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.overlay,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    right: -96,
    top: -96,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative', width: 82, marginBottom: 4 },
  avatar: {
    ...card,
    width: 82,
    height: 82,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarArt: { width: 86, height: 86, marginBottom: -6 },
  bannerBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.displayHeavy, fontSize: 25, lineHeight: 27, color: colors.ink },
  meta: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink, marginTop: 2 },
  levelTrack: {
    marginTop: 8,
    height: 11,
    borderRadius: 7,
    backgroundColor: colors.overlaySoft,
    overflow: 'hidden',
  },
  levelFill: { height: '100%', backgroundColor: palette.orange },
  levelNote: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink, marginTop: 4 },

  body: { paddingHorizontal: 18, paddingTop: 14 },

  streakWrap: { position: 'relative', marginBottom: 6 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.orange,
    ...litRim(0.6),
    boxShadow: solid ? 'none' : glass.cardShadow,
    borderRadius: 24,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  streakArt: { width: 96, height: 96, marginVertical: -6 },
  streakBody: { flex: 1, minWidth: 0 },
  streakTitle: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 24, color: colors.textOnPrimary },
  streakNote: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: palette.orangeDark, marginTop: 2 },
  weekRow: { flexDirection: 'row', gap: 5, marginTop: 8 },
  day: {
    width: 14,
    height: 14,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.overlay,
  },
  dayOn: { backgroundColor: colors.surface },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.6, color: colors.textMuted, marginTop: 20 },
  sectionLink: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.primary, marginTop: 20 },

  companionRow: { marginTop: 9, flexDirection: 'row', gap: 9 },
  companion: { flex: 1 },
  companionCard: { padding: 11, alignItems: 'center' },
  companionName: { fontFamily: fonts.bodyHeavy, fontSize: 13.5, color: colors.ink, marginTop: 8 },
  companionMeta: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.textMuted },
  companionDim: { opacity: 0.6 },

  stack: { marginTop: 9, gap: 9 },
  achieve: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 14, paddingVertical: 11 },
  achieveBodyPad: { paddingRight: 4 },
  achieveArt: { width: 64, height: 64 },
  achieveBody: { flex: 1, minWidth: 0 },
  achieveName: { fontFamily: fonts.bodyHeavy, fontSize: 14.5, color: colors.ink },
  achieveNote: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.textMuted },
  offline: {
    marginBottom: 14,
    backgroundColor: 'rgba(245,160,43,0.16)',
    borderWidth: stroke.surface,
    borderColor: palette.orange,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  offlineText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, lineHeight: 17, color: palette.orangeDark },
  offlineCode: { fontFamily: fonts.bodyHeavy },

  // Deliberately quiet: bordered rather than filled, and not full width.
  // Signing out is a thing you should be able to find, not a thing the screen
  // should encourage. But underlined text was the one affordance in the app
  // that did not look like it belonged to it.
  signOut: {
    marginTop: 26,
    alignSelf: 'center',
    borderWidth: stroke.control,
    borderColor: colors.overlayStrong,
    borderRadius: 22,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  signOutPressed: { backgroundColor: colors.overlayFaint },
  signOutText: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    color: colors.textMuted,
  },
  // Quieter than Sign out, which is already quiet. Deleting an account should
  // be findable without being offered.
  deleteLink: { marginTop: 14, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  deleteLinkText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: palette.mutedLight },

  dangerBox: {
    marginTop: 18,
    backgroundColor: colors.dangerSoft,
    borderWidth: stroke.surface,
    borderColor: colors.danger,
    borderRadius: 20,
    padding: 15,
  },
  dangerTitle: { fontFamily: fonts.displayHeavy, fontSize: 18, color: colors.dangerDark },
  dangerBody: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.dangerDark,
    marginTop: 4,
  },
  dangerRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  pressedShift: { transform: [{ translateY: 2 }], opacity: 0.92 },
  keepBtn: {
    ...card,
    flex: 1,
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  keepText: { fontFamily: fonts.bodyBlack, fontSize: 13, color: colors.ink },
  deleteBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderWidth: stroke.control,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteText: { fontFamily: fonts.bodyBlack, fontSize: 12, letterSpacing: 0.6, color: colors.white },

  achieveArtLocked: { opacity: 0.45 },
  achieveTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  achieveFill: { height: '100%', backgroundColor: palette.violet },
  achieveTallyDone: { color: colors.success },
  achieveTally: { fontFamily: fonts.displayHeavy, fontSize: 14, color: colors.violet },
});
