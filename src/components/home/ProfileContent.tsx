import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppearanceControls } from '@/components/account/AppearanceControls';
import { PetOptions } from './PetOptions';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton } from '@/components/ui';
import { Glyph } from '@/components/icons';
import { links, openLink } from '@/lib/links';
import { useQuest } from '@/state/QuestContext';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { achievementsFor, isEarned } from '@/data/achievements';
import { learningLevels } from '@/utils/learningLevels';

export interface ProfileAccount {
  user: { user_metadata?: Record<string, unknown>; email?: string } | null;
  signOut: () => void | Promise<void>; deleteAccount: () => Promise<boolean>;
  deleting: boolean; error: string | null;
}
export interface ProfileConnection { offline: boolean; error: string | null; notice: string | null; retry: () => void }

/** Everyday options first; account and reward detail are clearly named drawers. */
export function ProfileContent({ topInset = 0, account, connection, verification }: { topInset?: number; account: ProfileAccount; connection: ProfileConnection; verification?: React.ReactNode }) {
  const styles = useThemedStyles(createStyles); const quest = useQuest(); const nav = useNavigation();
  const [accountOpen, setAccountOpen] = useState(false); const [rewardsOpen, setRewardsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const progress = learningLevels(quest.map, quest.completed);
  const achievements = achievementsFor({ completed: quest.earned, map: quest.map, skills: quest.skills, sessions: quest.sessions, perfectSessions: quest.perfectSessions, bestStreak: quest.bestStreak, xp: quest.xp });
  const displayName = account.user?.user_metadata?.full_name ?? account.user?.user_metadata?.name;
  return <ScrollView style={styles.fill} contentContainerStyle={[styles.scroll, { paddingTop: topInset + 20 }]} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Options</Text>
    {(connection.offline || connection.error) ? <GlassSurface variant="thick" style={styles.notice}><Text style={styles.body}>{connection.error ?? 'Your progress is saved on this device. We’ll sync it when you reconnect.'}</Text><AppButton label="Try syncing again" tone="secondary" onPress={connection.retry} /></GlassSurface> : null}
    {connection.notice ? <Text style={styles.body}>{connection.notice}</Text> : null}
    {account.error ? <Text accessibilityRole="alert" style={styles.body}>{account.error}</Text> : null}
    <PetOptions />
    <View style={styles.divider} />
    <AppearanceControls />
    <View style={styles.divider} />
    <Pressable accessibilityRole="button" accessibilityLabel="Meet the bosses" onPress={() => nav.navigate('Characters', { page: 'bosses' })} style={styles.row}><Text style={styles.rowTitle}>Meet the bosses</Text><Glyph name="chevron-right" size={19} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: rewardsOpen }} onPress={() => setRewardsOpen(value => !value)} style={styles.row}><Text style={styles.rowTitle}>Rewards and achievements</Text><Glyph name={rewardsOpen ? 'chevron-up' : 'chevron-down'} size={19} /></Pressable>
    {rewardsOpen ? <GlassSurface variant="thick" style={styles.detail}>
      <Text style={styles.body}>{quest.xp + ' XP · ' + quest.gems + ' gems · ' + quest.streakDays + '-day streak'}</Text>
      <Text style={styles.note}>XP and gems are rewards for practising. Clear a level to open the next one.</Text>
      {achievements.map(item => <View key={item.id} style={styles.achievement}><View style={styles.achievementCopy}><Text style={styles.name}>{item.name}</Text><Text style={styles.note}>{item.note}</Text></View><Text style={styles.note}>{isEarned(item) ? 'Done' : Math.min(item.have, item.need) + '/' + item.need}</Text></View>)}
    </GlassSurface> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: accountOpen }} onPress={() => setAccountOpen(value => !value)} style={styles.row}><Text style={styles.rowTitle}>Account</Text><Glyph name={accountOpen ? 'chevron-up' : 'chevron-down'} size={19} /></Pressable>
    {accountOpen ? <GlassSurface variant="thick" style={styles.detail}>
      <Text style={styles.name}>{typeof displayName === 'string' ? displayName : 'Your account'}</Text>
      {account.user?.email ? <Text style={styles.note}>{account.user.email}</Text> : null}
      {verification}
      <Text style={styles.body}>{progress.cleared + ' levels cleared. Your progress follows this account.'}</Text>
      <AppButton label="Sign out" tone="secondary" onPress={account.signOut} />
      {confirmingDelete ? <View style={styles.deleteBox}><Text style={styles.name}>Delete your account?</Text><Text style={styles.body}>This permanently deletes your account and all saved progress. It cannot be undone.</Text><AppButton label="Keep my account" disabled={account.deleting} onPress={() => setConfirmingDelete(false)} /><AppButton label={account.deleting ? 'Deleting…' : 'Delete my account forever'} tone="secondary" disabled={account.deleting} onPress={() => void account.deleteAccount()} /></View> : <Pressable accessibilityRole="button" onPress={() => setConfirmingDelete(true)} style={styles.link}><Text style={styles.linkText}>Delete account</Text></Pressable>}
    </GlassSurface> : null}
    <View style={styles.legal}>{(['support', 'privacy', 'terms'] as const).map(key => <Pressable key={key} accessibilityRole="link" onPress={() => openLink(links[key])} style={styles.link}><Text style={styles.linkText}>{key === 'support' ? 'Help' : key === 'privacy' ? 'Privacy' : 'Terms'}</Text></Pressable>)}</View>
  </ScrollView>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  fill: { flex: 1 }, scroll: { paddingHorizontal: 18, paddingBottom: 130, gap: 18 }, title: { ...typography.title, fontSize: 29 },
  body: { ...typography.body, fontSize: 14, lineHeight: 22 }, note: { ...typography.caption, fontSize: 12, lineHeight: 18 },
  notice: { padding: 18, borderRadius: 24, gap: 12 }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, rowTitle: { ...typography.subtitle, fontSize: 16 },
  detail: { borderRadius: 25, padding: 18, gap: 16 }, name: { ...typography.subtitle, fontSize: 14 }, achievement: { flexDirection: 'row', gap: 12, alignItems: 'center' }, achievementCopy: { flex: 1, gap: 4 },
  deleteBox: { gap: 14, borderWidth: 1, borderColor: colors.ink, borderRadius: 20, padding: 14 }, link: { minHeight: 44, justifyContent: 'center' }, linkText: { ...typography.label, fontSize: 13, textDecorationLine: 'underline' },
  legal: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 24 },
});
