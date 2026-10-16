import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { frameworkFor, officialUnitForArea, bossUnitIndex } from '@/data/courseFrameworks';
import { getCourse } from '@/data';
import { questionCountFor } from '@/data/questMap';
import { learningLevels, levelNumber } from '@/utils/learningLevels';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton, ProgressBar } from '@/components/ui';
import { BossSprite } from '@/components/creatures/BossSprite';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { SaveStatusNotice } from '@/components/account/SaveStatusNotice';
import type { QuestNode } from '@/types/quest';
import type { RootStackParamList } from '@/navigation/types';

export interface AreaRequest { index: number; id: number }

/** One obvious next action; the complete numbered list is an optional drawer. */
export function PlayPanel({ topInset = 0, areaRequest, onPractice, onAreaChange }: {
  topInset?: number; areaRequest?: AreaRequest | null; onPractice: () => void; onAreaChange?: (index: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const quest = useQuest(); const { courseId } = useOnboarding();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const progress = learningLevels(quest.map, quest.completed);
  const currentUnit = quest.map.units.find(unit => unit.nodes.some(node => node.id === progress.nextId));
  const node = currentUnit?.nodes.find(item => item.id === progress.nextId);
  const [showLevels, setShowLevels] = useState(Boolean(areaRequest));
  const [area, setArea] = useState(areaRequest?.index ?? currentUnit?.index ?? 0);
  const scroll = useRef<ScrollView>(null); const levelsTop = useRef(0); const jumpPending = useRef(Boolean(areaRequest));
  const framework = frameworkFor(courseId);
  const selectedUnit = officialUnitForArea(quest.map.courseId, area);
  const unitAreas = selectedUnit === null ? quest.map.units.filter(unit => officialUnitForArea(quest.map.courseId, unit.index) === null).map(unit => unit.index) : framework.units[selectedUnit].areas;
  const shownNodes = unitAreas.flatMap(index => quest.map.units[index]?.nodes ?? []);
  const currentAPUnit = currentUnit ? officialUnitForArea(quest.map.courseId, currentUnit.index) : null;
  useEffect(() => { onAreaChange?.(showLevels ? area : currentUnit?.index ?? 0); }, [showLevels, area, currentUnit?.index, onAreaChange]);
  useEffect(() => {
    if (!areaRequest) return;
    setArea(areaRequest.index); setShowLevels(true); jumpPending.current = true;
    const frame = requestAnimationFrame(() => {
      if (levelsTop.current) { jumpPending.current = false; scroll.current?.scrollTo({ y: Math.max(0, levelsTop.current - topInset), animated: false }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [areaRequest?.id, topInset]);
  const play = (item: QuestNode) => {
    if (quest.stateOf(item.id) === 'locked') return;
    const unit = quest.map.units.find(value => value.nodes.some(value => value.id === item.id));
    nav.navigate('Quiz', { nodeId: item.id, unit: unit?.index, title: item.title, count: questionCountFor(item), xp: item.xp, boss: item.kind === 'boss' });
  };
  const count = node ? questionCountFor(node) : 0;
  return <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: topInset + 20 }]} showsVerticalScrollIndicator={false} onContentSizeChange={() => { if (jumpPending.current && levelsTop.current) { jumpPending.current = false; scroll.current?.scrollTo({ y: Math.max(0, levelsTop.current - topInset), animated: false }); } }}>
    <Text style={styles.course}>{getCourse(courseId)?.name ?? 'Your course'}</Text>
    <Text style={styles.heading}>{progress.finished ? 'You did it.' : 'Ready to play?'}</Text>
    <GlassSurface variant="thick" style={styles.hero}>
      <View style={styles.heroTop}><View style={styles.heroCopy}>
        <Text style={styles.overline}>{currentUnit ? currentAPUnit === null ? 'Extra review' : 'Unit ' + (currentAPUnit + 1) + (framework.units[currentAPUnit].title.startsWith('Unit ') ? '' : ' · ' + framework.units[currentAPUnit].title) : 'Course complete'}</Text>
        <Text style={styles.level}>{node ? 'Level ' + progress.next : 'All levels cleared'}</Text>
        <Text style={styles.topic}>{node?.kind === 'boss' ? (node.unitBoss ? 'Unit boss · ' : 'Boss battle · ') + node.title : node?.title ?? 'Keep learning with a practice round.'}</Text>
      </View>{node?.kind === 'boss' ? <BossSprite nodeId={node.id} size={90} /> : <Mascot pose={progress.finished ? 'trophy' : 'wave'} size={90} />}</View>
      {node ? <Text style={styles.instructions}>{node.kind === 'lesson' ? 'Read a short note. Then answer ' : 'Answer '}{count + ' questions. Get ' + Math.ceil(count * 0.6) + ' right to unlock the next level.'}</Text> : null}
      <AppButton label={node ? 'Play Level ' + progress.next : 'Keep practising'} icon="play" onPress={() => node ? play(node) : onPractice()} />
    </GlassSurface>
    <SaveStatusNotice />
    <View style={styles.simpleSteps}><Text style={styles.step}>1. Answer</Text><Glyph name="chevron-right" size={14} /><Text style={styles.step}>2. Learn</Text><Glyph name="chevron-right" size={14} /><Text style={styles.step}>3. Level up</Text></View>
    <GlassSurface style={styles.progressCard}><View style={styles.progressRow}><Text style={styles.body}>{progress.cleared + ' of ' + progress.total + ' levels cleared'}</Text><Glyph name="check" size={17} /></View><ProgressBar progress={progress.total ? progress.cleared / progress.total : 0} /></GlassSurface>
    <View onLayout={event => { levelsTop.current = event.nativeEvent.layout.y; }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showLevels }} onPress={() => setShowLevels(value => !value)} style={styles.listButton}><Text style={styles.section}>{showLevels ? 'Hide levels' : 'See all levels'}</Text><Glyph name={showLevels ? 'chevron-up' : 'chevron-down'} size={20} /></Pressable>
      {showLevels ? <>
        <Text style={styles.help}>Play in order. A check means you finished it. A lock means it comes later.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areas}>{framework.units.map((unit, index) => <Pressable key={index} accessibilityRole="button" accessibilityState={{ selected: selectedUnit === index }} accessibilityLabel={'AP Unit ' + (index + 1) + ', ' + unit.title} onPress={() => setArea(unit.areas[0])} style={[styles.areaButton, selectedUnit === index && styles.areaSelected]}><Text style={styles.areaText}>{'Unit ' + (index + 1)}</Text></Pressable>)}{quest.map.units.some(unit => officialUnitForArea(quest.map.courseId, unit.index) === null) ? <Pressable accessibilityRole="button" onPress={() => setArea(quest.map.units.find(unit => officialUnitForArea(quest.map.courseId, unit.index) === null)!.index)} style={[styles.areaButton, selectedUnit === null && styles.areaSelected]}><Text style={styles.areaText}>Review</Text></Pressable> : null}</ScrollView>
        <Text style={styles.areaTitle}>{selectedUnit === null ? 'Extra review' : 'Unit ' + (selectedUnit + 1) + (framework.units[selectedUnit].title.startsWith('Unit ') ? '' : ' · ' + framework.units[selectedUnit].title)}</Text>
        <Text style={styles.help}>{selectedUnit === null ? 'Mixed practice after the main units.' : 'Finish this unit’s levels, then beat its unit boss.'}</Text>
        <View style={styles.levelList}>{shownNodes.map(item => {
          const state = quest.stateOf(item.id); const locked = state === 'locked'; const number = levelNumber(quest.map, item.id)!;
          const title = item.kind === 'boss' ? (item.unitBoss ? 'Unit boss · ' : 'Boss · ') + item.title : item.title;
          return <Pressable key={item.id} accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }} accessibilityLabel={'Level ' + number + '. ' + title + '. ' + (locked ? 'Locked. Finish Level ' + (number - 1) + ' first' : state === 'complete' ? 'Completed. Tap to play again' : 'Ready to play')} onPress={() => play(item)} style={({ pressed }) => [styles.levelRow, state === 'current' && styles.current, pressed && { opacity: 0.6 }]}>
            <Text style={styles.number}>{number}</Text>{item.kind === 'boss' ? <BossSprite nodeId={item.id} size={38} /> : null}<View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowStatus}>{locked ? 'Locked' : state === 'complete' ? 'Completed · Play again' : 'Play now'}</Text></View><Glyph name={locked ? 'lock' : state === 'complete' ? 'check' : 'play'} size={18} />
          </Pressable>;
        })}</View>
      </> : null}
    </View>
  </ScrollView>;
}
const createStyles = ({ colors, typography, glass }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 }, scroll: { paddingHorizontal: 18, paddingBottom: 130, gap: 16 },
  course: { ...typography.overline, fontSize: 11 }, heading: { ...typography.title, fontSize: 29, lineHeight: 35, marginTop: -8 },
  hero: { borderRadius: 30, padding: 20, gap: 20 }, heroTop: { flexDirection: 'row', gap: 8, alignItems: 'center' }, heroCopy: { flex: 1, minWidth: 0 },
  overline: { ...typography.caption, fontSize: 11, lineHeight: 16 }, level: { ...typography.title, fontSize: 34, lineHeight: 40, marginTop: 6 },
  topic: { ...typography.subtitle, fontSize: 16, lineHeight: 22, marginTop: 5 }, instructions: { ...typography.body, fontSize: 14, lineHeight: 22 },
  simpleSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, paddingHorizontal: 6 }, step: { ...typography.caption, color: colors.ink, fontSize: 12 },
  progressCard: { borderRadius: 22, padding: 16, gap: 12 }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, body: { ...typography.body, fontSize: 14 },
  listButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, section: { ...typography.subtitle, fontSize: 18 },
  help: { ...typography.caption, fontSize: 13, lineHeight: 20 }, areas: { gap: 8, paddingVertical: 16 }, areaButton: { borderWidth: 1, borderColor: colors.border, minWidth: 74, paddingHorizontal: 12, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: glass.card },
  areaSelected: { borderColor: colors.ink, borderWidth: 2 }, areaText: { ...typography.label, fontSize: 14 }, areaTitle: { ...typography.heading, fontSize: 21, marginBottom: 12 },
  levelList: { borderRadius: 24, gap: 8, marginTop: 12 }, levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: glass.card, minHeight: 74 },
  current: { borderColor: colors.ink }, number: { ...typography.numeral, fontSize: 18, minWidth: 29, textAlign: 'center' }, rowCopy: { flex: 1 }, rowTitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 }, rowStatus: { ...typography.caption, fontSize: 11, lineHeight: 17, marginTop: 3 },
});
