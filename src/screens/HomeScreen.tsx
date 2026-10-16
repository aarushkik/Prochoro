import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton } from '@/components/ui';
import { QuestHud } from '@/components/home/QuestHud';
import { QuestTabBar, type QuestTab } from '@/components/home/QuestTabBar';
import { PlayPanel, type AreaRequest } from '@/components/home/PlayPanel';
import { TrainPanel } from '@/components/home/TrainPanel';
import { BattlesPanel } from '@/components/home/BattlesPanel';
import { ProfilePanel } from '@/components/home/ProfilePanel';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { useQuest } from '@/state/QuestContext';
import { questionCountFor } from '@/data/questMap';
import { levelNumber } from '@/utils/learningLevels';
import type { QuestNode } from '@/types/quest';
import type { RootStackParamList } from '@/navigation/types';

export function HomeScreen() { return <HomeContent renderOptions={topInset => <ProfilePanel topInset={topInset} />} />; }

/** Shared with visual QA: identical navigation, without loading a real account. */
export function HomeContent({ renderOptions }: { renderOptions: (topInset: number) => React.ReactNode }) {
  const theme = useAppTheme(); const styles = useThemedStyles(createStyles); const quest = useQuest();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<QuestTab>('map'); const [hudHeight, setHudHeight] = useState(74);
  const currentArea = quest.map.units.find(unit => unit.nodes.some(node => node.id === quest.currentNodeId))?.index ?? 0;
  const [area, setArea] = useState(currentArea); const [areaRequest, setAreaRequest] = useState<AreaRequest | null>(null);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const play = (node: QuestNode) => {
    if (quest.stateOf(node.id) === 'locked') { setLockedMessage('Play Level ' + levelNumber(quest.map, quest.currentNodeId) + ' next. Each win opens the level after it.'); return; }
    const unit = quest.map.units.find(unit => unit.nodes.some(item => item.id === node.id));
    navigation.navigate('Quiz', { nodeId: node.id, unit: unit?.index, title: node.title, xp: node.xp, count: questionCountFor(node), boss: node.kind === 'boss' });
  };
  return <View style={styles.root}>
    <AreaBackdrop kind={quest.map.units[area]?.track.kind} opacity={0.24} />
    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    <View style={[styles.fill, tab !== 'map' && styles.hidden]} pointerEvents={tab === 'map' ? 'auto' : 'none'}><PlayPanel topInset={hudHeight} areaRequest={areaRequest} onPractice={() => setTab('practice')} onAreaChange={setArea} /></View>
    {tab === 'practice' ? <TrainPanel topInset={hudHeight} /> : null}
    {tab === 'progress' ? <BattlesPanel topInset={hudHeight} onSelect={play} onJumpToTrack={index => { setAreaRequest({ index, id: Date.now() }); setTab('map'); }} /> : null}
    {tab === 'you' ? renderOptions(hudHeight) : null}
    <QuestHud equippedId={quest.equippedId} onOpenCharacters={() => setTab('you')} onLayout={event => setHudHeight(Math.round(event.nativeEvent.layout.height))} />
    <QuestTabBar active={tab} onChange={setTab} />
    <Modal transparent visible={lockedMessage !== null} animationType="fade" onRequestClose={() => setLockedMessage(null)}><View style={styles.scrim}><GlassSurface variant="thick" style={styles.dialog}><Text style={styles.title}>One level at a time</Text><Text style={styles.body}>{lockedMessage}</Text><AppButton label="Got it" onPress={() => setLockedMessage(null)} /></GlassSurface></View></Modal>
  </View>;
}
const createStyles = ({ colors, typography, glass }: AppTheme) => StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', backgroundColor: colors.background },
  fill: { flex: 1 }, hidden: { display: 'none' }, scrim: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: glass.scrim },
  dialog: { padding: 24, borderRadius: 28, maxWidth: 380, gap: 20 }, title: { ...typography.heading }, body: { ...typography.body },
});
