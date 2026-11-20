import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import { QuestHud } from '@/components/home/QuestHud';
import { QuestTabBar, type QuestTab } from '@/components/home/QuestTabBar';
import { PlayPanel } from '@/components/home/PlayPanel';
import { TrainPanel } from '@/components/home/TrainPanel';
import { ProfilePanel } from '@/components/home/ProfilePanel';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import type { RootStackParamList } from '@/navigation/types';
import { useScreenLayout } from '@/hooks/useScreenLayout';

export function HomeScreen() { return <HomeContent renderMe={topInset => <ProfilePanel topInset={topInset} />} />; }

/**
 * Home opens on Learn, where one button starts the next lesson. Practice and
 * Me are a tap away and never in the way. Shared with visual QA, which
 * supplies its own Me tab so no real account is loaded.
 */
export function HomeContent({ renderMe, initialTab = 'learn' }: { renderMe: (topInset: number) => React.ReactNode; initialTab?: QuestTab }) {
  const theme = useAppTheme(); const styles = useThemedStyles(createStyles); const quest = useQuest();
  const { courseId } = useOnboarding();
  const layout = useScreenLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<QuestTab>(initialTab); const [hudHeight, setHudHeight] = useState(74);
  const currentArea = quest.map.units.find(unit => unit.nodes.some(node => node.id === quest.currentNodeId))?.index ?? 0;
  const [area, setArea] = useState(currentArea);
  // The landscape runs the full width of the window; everything you read or
  // press stays in one centred column on top of it.
  return <View style={styles.page}>
    <AreaBackdrop kind={quest.map.units[area]?.track.kind} opacity={tab === 'learn' ? 0.17 : 0.11} />
    <View style={[styles.root, { maxWidth: layout.wide ? layout.column : undefined }]}>
    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    <View style={[styles.fill, tab !== 'learn' && styles.hidden]} pointerEvents={tab === 'learn' ? 'auto' : 'none'}><PlayPanel topInset={hudHeight} onPractice={() => setTab('practice')} onAreaChange={setArea} /></View>
    {tab === 'practice' ? <TrainPanel topInset={hudHeight} /> : null}
    {tab === 'me' ? renderMe(hudHeight) : null}
    <QuestHud courseId={courseId} streak={quest.streakDays} onSwitchCourse={() => navigation.navigate('CourseSelection', { switching: true })} onOpenMe={() => setTab('me')} onLayout={event => setHudHeight(Math.round(event.nativeEvent.layout.height))} />
    <QuestTabBar active={tab} onChange={setTab} />
    </View>
  </View>;
}
const createStyles = ({ colors }: AppTheme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  root: { flex: 1, width: '100%', alignSelf: 'center' },
  fill: { flex: 1 }, hidden: { display: 'none' },
});
