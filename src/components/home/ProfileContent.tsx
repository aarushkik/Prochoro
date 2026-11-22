import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppearanceControls } from '@/components/account/AppearanceControls';
import { LookOptions } from './LookOptions';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton } from '@/components/ui';
import { UtilityIllustration } from '@/components/ui/UtilityIllustration';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { AP_DISCLAIMER, links, openLink } from '@/lib/links';
import { lookById } from '@/data/looks';
import { useQuest } from '@/state/QuestContext';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { useScreenLayout } from '@/hooks/useScreenLayout';

export interface ProfileAccount {
  user: { user_metadata?: Record<string, unknown>; email?: string } | null;
  signOut: () => void | Promise<void>; deleteAccount: () => Promise<boolean>;
  deleting: boolean; error: string | null;
  /** Studying without an account: progress is on this device only. */
  guestMode?: boolean;
  leaveGuest?: () => void | Promise<void>;
  eraseGuest?: () => void | Promise<void>;
}
export interface ProfileConnection { offline: boolean; error: string | null; notice: string | null; retry: () => void }

/**
 * Me: your platypus in the hat you chose, three numbers, and every hat you
 * can earn. Settings sit below, out of the way.
 */
export function ProfileContent({ topInset = 0, account, connection, verification }: { topInset?: number; account: ProfileAccount; connection: ProfileConnection; verification?: React.ReactNode }) {
  const styles = useThemedStyles(createStyles); const quest = useQuest();
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const layout = useScreenLayout();
  // A landscape iPad or desktop puts you and your hats on one side, settings on the other.
  const split = layout.expanded;
  const displayName = account.user?.user_metadata?.full_name ?? account.user?.user_metadata?.name;
  const wearing = lookById(quest.lookId);
  return <ScrollView style={styles.fill} contentContainerStyle={[styles.scroll, layout.wide && styles.scrollWide, { paddingTop: topInset + 20 }]} showsVerticalScrollIndicator={false}>
    {(connection.offline || connection.error) ? <GlassSurface variant="thick" style={styles.notice}><Text style={styles.body}>{connection.error ?? 'Your progress is saved on this device. We’ll sync it when you reconnect.'}</Text><AppButton label="Try syncing again" tone="secondary" onPress={connection.retry} /></GlassSurface> : null}
    {connection.notice ? <Text style={styles.body}>{connection.notice}</Text> : null}
    {account.error ? <Text accessibilityRole="alert" style={styles.body}>{account.error}</Text> : null}
    <View style={split ? styles.split : styles.stack}>
      <View style={[styles.stack, split && styles.splitMain]}>
        <View style={styles.hero}>
          <Mascot pose="wave" size={170 * Math.min(layout.scale, 1.2)} />
          <Text style={styles.title}>{typeof displayName === 'string' && displayName.trim() ? displayName.trim().split(/\s+/)[0] : 'You'}</Text>
          <Text style={styles.note}>{wearing && wearing.unlock ? 'Wearing the ' + wearing.name.toLowerCase() : 'Earn hats by studying'}</Text>
        </View>
        <View style={styles.stats}>
          <Stat art={<UtilityIllustration id="streak" size={26} />} value={quest.streakDays} label="day streak" />
          <View style={styles.divider} />
          <Stat art={<Glyph name="book" size={24} />} value={quest.sessions} label={quest.sessions === 1 ? 'lesson' : 'lessons'} />
          <View style={styles.divider} />
          <Stat art={<UtilityIllustration id="xp" size={26} />} value={quest.xp} label="XP" />
        </View>
        <Text style={styles.section}>HATS</Text>
        <LookOptions />
      </View>
      <View style={[styles.stack, split && styles.splitSide]}>
        <AppearanceControls />
        {account.guestMode ? <GlassSurface variant="thick" style={styles.detail}>
          <Text style={styles.name}>Keep your progress</Text>
          <Text style={styles.body}>Your progress is saved on this device only. Sign in or create an account to keep it on all your devices.</Text>
          <AppButton label="Sign in or create an account" onPress={() => void account.leaveGuest?.()} />
          {confirmingErase ? <View style={styles.deleteBox}><Text style={styles.name}>Erase your progress?</Text><Text style={styles.body}>This removes everything Prochoro saved on this device. It cannot be undone.</Text><AppButton label="Keep my progress" onPress={() => setConfirmingErase(false)} /><AppButton label="Erase my progress" tone="secondary" onPress={() => void account.eraseGuest?.()} /></View> : <Pressable accessibilityRole="button" onPress={() => setConfirmingErase(true)} style={styles.link}><Text style={styles.linkText}>Erase progress on this device</Text></Pressable>}
        </GlassSurface> : <View style={styles.rows}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: accountOpen }} onPress={() => setAccountOpen(value => !value)} style={styles.row}><Text style={styles.rowTitle}>Account</Text><Glyph name={accountOpen ? 'chevron-up' : 'chevron-down'} size={19} /></Pressable>
          {accountOpen ? <GlassSurface variant="thick" style={styles.detail}>
            <Text style={styles.name}>{typeof displayName === 'string' ? displayName : 'Your account'}</Text>
            {account.user?.email ? <Text style={styles.note}>{account.user.email}</Text> : null}
            {verification}
            <AppButton label="Sign out" tone="secondary" onPress={account.signOut} />
            {confirmingDelete ? <View style={styles.deleteBox}><Text style={styles.name}>Delete your account?</Text><Text style={styles.body}>This permanently deletes your account and all saved progress. It cannot be undone.</Text><AppButton label="Keep my account" disabled={account.deleting} onPress={() => setConfirmingDelete(false)} /><AppButton label={account.deleting ? 'Deleting…' : 'Delete my account forever'} tone="secondary" disabled={account.deleting} onPress={() => void account.deleteAccount()} /></View> : <Pressable accessibilityRole="button" onPress={() => setConfirmingDelete(true)} style={styles.link}><Text style={styles.linkText}>Delete account</Text></Pressable>}
          </GlassSurface> : null}
        </View>}
        <View style={styles.legal}>{(['support', 'privacy', 'terms'] as const).map(key => <Pressable key={key} accessibilityRole="link" onPress={() => openLink(links[key])} style={styles.link}><Text style={styles.linkText}>{key === 'support' ? 'Help' : key === 'privacy' ? 'Privacy' : 'Terms'}</Text></Pressable>)}</View>
        <Text style={styles.disclaimer}>{AP_DISCLAIMER}</Text>
      </View>
    </View>
  </ScrollView>;
}

function Stat({ art, value, label }: { art: React.ReactNode; value: number; label: string }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>{art}<Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const createStyles = ({ colors, typography, card }: AppTheme) => StyleSheet.create({
  fill: { flex: 1 }, scroll: { paddingHorizontal: 18, paddingBottom: 130, gap: 22 }, scrollWide: { paddingHorizontal: 24 },
  hero: { alignItems: 'center', gap: 2, paddingTop: 4 },
  title: { ...typography.title, fontSize: 28, lineHeight: 33, marginTop: 6 },
  body: { ...typography.body, fontSize: 14, lineHeight: 22 }, note: { ...typography.caption, fontSize: 12.5, lineHeight: 18 },
  stats: { ...card, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...typography.numeral, fontSize: 22, lineHeight: 26 },
  statLabel: { ...typography.caption, fontSize: 11.5, lineHeight: 15 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: 4 },
  section: { ...typography.overline, fontSize: 10.5, marginBottom: -10 },
  notice: { padding: 18, borderRadius: 24, gap: 12 },
  row: { ...card, minHeight: 58, borderRadius: 22, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rows: { gap: 10 }, rowTitle: { ...typography.subtitle, fontSize: 16 },
  detail: { borderRadius: 25, padding: 18, gap: 16 }, name: { ...typography.subtitle, fontSize: 14 },
  deleteBox: { gap: 14, borderWidth: 1, borderColor: colors.ink, borderRadius: 20, padding: 14 }, link: { minHeight: 44, justifyContent: 'center' }, linkText: { ...typography.label, fontSize: 13, textDecorationLine: 'underline' },
  legal: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 24 },
  disclaimer: { ...typography.caption, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: -12 },
  stack: { gap: 22 }, split: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' }, splitMain: { flex: 1.25 }, splitSide: { flex: 1, paddingTop: 12 },
});
