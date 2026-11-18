import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { rimOf, withAlpha } from '@/theme';
import { frameworkFor, officialUnitForArea } from '@/data/courseFrameworks';
import { findNode, questionCountFor } from '@/data/questMap';
import { getCourse } from '@/data';
import { learningLevels, levelNumber } from '@/utils/learningLevels';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton, ProgressBar } from '@/components/ui';
import { BossSprite } from '@/components/creatures/BossSprite';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { SaveStatusNotice } from '@/components/account/SaveStatusNotice';
import type { QuestNode, QuestNodeState } from '@/types/quest';
import type { RootStackParamList } from '@/navigation/types';
import { LearningPath } from './LearningPath';
import { pathGeometry } from './pathGeometry';
import { TAB_BAR_HEIGHT } from './QuestTabBar';

export interface AreaRequest { index: number; id: number }

/** A stretch of the course shown as one path: an AP unit, or the review after them. */
interface Chapter { label: string; title: string; areas: number[] }

const HEADER = 62;
const DOCK = 84;
/** Widest the path itself is drawn on a phone or a portrait iPad. */
const PATH_WIDTH = 720;

/**
 * Play: the current unit as a winding path, with one button that always plays
 * the stone you have picked. The path opens on your next level.
 *
 * A phone or portrait iPad shows the path with the unit above it and the
 * picked level docked below. A landscape iPad or a desktop window has room
 * for all three side by side: every unit on the left, the path in the middle,
 * and the picked level, larger, on the right.
 */
export function PlayPanel({ topInset = 0, areaRequest, onPractice, onAreaChange }: {
  topInset?: number; areaRequest?: AreaRequest | null; onPractice: () => void; onAreaChange?: (index: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const layout = useScreenLayout();
  const s = layout.scale;
  // The page colour at three strengths. Never `transparent`: gradients do not
  // premultiply, so fading to transparent black greys the middle of the fade.
  const fade = useMemo(() => [withAlpha(colors.background, 1), withAlpha(colors.background, 0.8), withAlpha(colors.background, 0)] as const, [colors.background]);
  const quest = useQuest();
  const { courseId } = useOnboarding();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ width: layout.column, height: layout.height });
  const scroll = useRef<ScrollViewInstance>(null);

  const chapters = useMemo<Chapter[]>(() => {
    const framework = frameworkFor(courseId);
    const list = framework.units.map((unit, index) => ({
      label: 'Unit ' + (index + 1),
      title: unit.title.startsWith('Unit ') ? quest.map.units[unit.areas[0]]?.title ?? unit.title : unit.title,
      areas: unit.areas,
    }));
    const extra = quest.map.units.filter(unit => officialUnitForArea(quest.map.courseId, unit.index) === null).map(unit => unit.index);
    return extra.length ? [...list, { label: 'Review', title: 'Mixed practice', areas: extra }] : list;
  }, [courseId, quest.map]);
  const chapterOf = useCallback((area: number) => Math.max(0, chapters.findIndex(chapter => chapter.areas.includes(area))), [chapters]);
  const nodesOf = useCallback((chapter: Chapter) => chapter.areas.flatMap(index => quest.map.units[index]?.nodes ?? []), [quest.map]);

  const progress = learningLevels(quest.map, quest.completed);
  const nextArea = quest.map.units.find(unit => unit.nodes.some(node => node.id === progress.nextId))?.index ?? 0;
  const [chapterIndex, setChapterIndex] = useState(() => chapterOf(areaRequest?.index ?? nextArea));
  const [selectedId, setSelectedId] = useState<string | null>(progress.nextId);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const nodes = useMemo(() => nodesOf(chapter), [chapter, nodesOf]);
  const cleared = nodes.filter(node => quest.stateOf(node.id) === 'complete').length;

  // Finishing a level moves both the path and the button on to the next one.
  const lastNext = useRef(progress.nextId);
  useEffect(() => {
    if (lastNext.current === progress.nextId) return;
    lastNext.current = progress.nextId;
    setSelectedId(progress.nextId);
    setChapterIndex(chapterOf(nextArea));
  }, [progress.nextId, nextArea, chapterOf]);
  useEffect(() => {
    if (areaRequest) setChapterIndex(chapterOf(areaRequest.index));
  }, [areaRequest?.id]);
  useEffect(() => { onAreaChange?.(chapter.areas[0]); }, [chapter, onAreaChange]);

  // Three panels need a window this wide; anything narrower keeps the path
  // with the unit bar above and the level docked below.
  const panels = layout.expanded && box.width >= 1000;
  const sideWidth = panels ? (box.width >= 1200 ? 296 : 262) : 0;
  const levelWidth = panels ? (box.width >= 1200 ? 336 : 300) : 0;
  const gap = 20;
  const pathZone = panels ? box.width - sideWidth - levelWidth - gap * 2 : box.width;
  const pathWidth = Math.min(pathZone, panels ? pathZone : PATH_WIDTH * s);
  const g = useMemo(() => pathGeometry(s), [s]);

  const bottom = Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT;
  const top = topInset + (panels ? 12 : HEADER * Math.min(s, 1.1) + 10);

  // Open on the stone you are up to, a little above the middle of the screen.
  const focus = nodes.findIndex(node => node.id === progress.nextId);
  useEffect(() => {
    const y = focus < 0 ? 0 : Math.max(0, top + g.stopY(focus) - box.height * 0.42);
    const timer = setTimeout(() => scroll.current?.scrollTo({ y, animated: false }), 0);
    return () => clearTimeout(timer);
  }, [chapterIndex, focus, box.height, top, g]);

  // The button plays the stone you picked on this path. Browsing another unit
  // never strands it: with nothing picked here it offers your next level.
  const upNext = progress.nextId ? findNode(quest.map, progress.nextId)?.node ?? null : null;
  const selected = nodes.find(node => node.id === selectedId) ?? upNext;
  const state = selected ? quest.stateOf(selected.id) : null;
  const play = (node: QuestNode) => {
    if (quest.stateOf(node.id) === 'locked') return;
    const unit = quest.map.units.find(value => value.nodes.some(item => item.id === node.id));
    nav.navigate('Quiz', { nodeId: node.id, unit: unit?.index, title: node.title, count: questionCountFor(node), xp: node.xp, boss: node.kind === 'boss' });
  };
  const numberOf = useCallback((id: string) => levelNumber(quest.map, id) ?? 0, [quest.map]);
  const select = useCallback((node: QuestNode) => setSelectedId(node.id), []);
  const turnTo = (index: number) => { setChapterIndex(index); setSelectedId(progress.nextId); };

  // The path dissolves as it passes under the bars, so a label is never
  // half-read in the gap between two of them. On the web the path itself is
  // masked, which leaves the landscape behind it untouched from edge to edge.
  const fadeTop = top + 14;
  const fadeBottom = bottom + (panels ? 0 : DOCK) + 22;
  const mask = useMemo(() => {
    if (Platform.OS !== 'web') return null;
    const image = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0.2) ${Math.round(fadeTop * 0.62)}px, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), rgba(0,0,0,0.2) calc(100% - ${Math.round(fadeBottom * 0.62)}px), rgba(0,0,0,0) 100%)`;
    return { maskImage: image, WebkitMaskImage: image } as ViewStyle;
  }, [fadeTop, fadeBottom]);
  const hasPrevious = chapterIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1;
  const barWidth = layout.wide ? Math.min(box.width - 28, 720) : undefined;

  const path = (
    <ScrollView ref={scroll} style={[styles.flex, mask]} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + (panels ? 24 : DOCK + 28), alignItems: 'center' }}>
      <View style={{ width: Math.min(pathZone, 720) }}><SaveStatusNotice /></View>
      <LearningPath nodes={nodes} width={pathWidth} scale={s} stateOf={quest.stateOf} numberOf={numberOf} selectedId={selected?.id ?? null} onSelect={select} />
      {hasNext ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Go to ${chapters[chapterIndex + 1].label}, ${chapters[chapterIndex + 1].title}`}
          onPress={() => turnTo(chapterIndex + 1)} style={({ pressed }) => [styles.onward, pressed && styles.pressed]}>
          <GlassSurface style={styles.onwardFace}>
            <Text style={styles.onwardText} numberOfLines={1}>{chapters[chapterIndex + 1].label + ' · ' + chapters[chapterIndex + 1].title}</Text>
            <Glyph name="arrow-right" size={16} />
          </GlassSurface>
        </Pressable>
      ) : <Mascot pose="trophy" size={96 * s} />}
    </ScrollView>
  );

  if (panels) {
    return (
      <View style={styles.flex} onLayout={event => setBox({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
        <View style={[styles.zone, { left: sideWidth + gap, width: pathZone, top: 0, bottom: 0 }]}>{path}</View>
        <View style={[styles.zone, { left: 0, width: sideWidth, top: topInset + 4, bottom: bottom + 8 }]}>
          <UnitsPanel chapters={chapters} current={chapterIndex} nodesOf={nodesOf} stateOf={quest.stateOf} courseName={getCourse(courseId)?.name ?? 'Your course'} onPick={turnTo} />
        </View>
        <View style={[styles.zone, { right: 0, width: levelWidth, top: topInset + 4, bottom: bottom + 8 }]}>
          <LevelPanel width={levelWidth} node={selected} state={state} number={selected ? numberOf(selected.id) : 0} onPlay={() => selected ? play(selected) : onPractice()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex} onLayout={event => setBox({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      {path}

      {/* Native has no mask without another dependency, so on a phone, where
          the column is the whole screen, the page colour is laid over the two
          ends. On an iPad the column is narrower than the landscape behind it,
          and a band of page colour would show as a box; the glass bars carry it. */}
      {Platform.OS === 'web' || layout.wide ? null : <>
        <LinearGradient pointerEvents="none" colors={fade} locations={[0, 0.62, 1]} style={[styles.fade, { top: 0, height: fadeTop }]} />
        <LinearGradient pointerEvents="none" colors={[fade[2], fade[1], fade[0]]} locations={[0, 0.38, 1]} style={[styles.fade, { bottom: 0, height: fadeBottom }]} />
      </>}

      <View pointerEvents="box-none" style={[styles.barDock, { top: topInset }]}>
        <GlassSurface style={[styles.header, barWidth ? { width: barWidth } : styles.stretch]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous unit" disabled={!hasPrevious} accessibilityState={{ disabled: !hasPrevious }}
            onPress={() => turnTo(chapterIndex - 1)} style={({ pressed }) => [styles.turn, !hasPrevious && styles.off, pressed && styles.pressed]}>
            <Glyph name="chevron-left" size={20} />
          </Pressable>
          <View style={styles.headerCopy} accessible accessibilityRole="header" accessibilityLabel={`${chapter.label}, ${chapter.title}. ${cleared} of ${nodes.length} levels cleared`}>
            <View style={styles.headerRow}>
              <Text style={styles.unit} numberOfLines={1}>{chapter.label}</Text>
              <Text style={styles.tally}>{cleared + ' / ' + nodes.length}</Text>
            </View>
            <Text style={styles.unitTitle} numberOfLines={1}>{chapter.title}</Text>
            <View importantForAccessibility="no-hide-descendants" aria-hidden><ProgressBar progress={nodes.length ? cleared / nodes.length : 0} height={4} /></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next unit" disabled={!hasNext} accessibilityState={{ disabled: !hasNext }}
            onPress={() => turnTo(chapterIndex + 1)} style={({ pressed }) => [styles.turn, !hasNext && styles.off, pressed && styles.pressed]}>
            <Glyph name="chevron-right" size={20} />
          </Pressable>
        </GlassSurface>
      </View>

      <View pointerEvents="box-none" style={[styles.barDock, { bottom }]}>
        <LevelDock width={barWidth} compact={box.width < 350} node={selected} state={state} number={selected ? numberOf(selected.id) : 0} onPlay={() => selected ? play(selected) : onPractice()} />
      </View>
    </View>
  );
}

/** What the picked level is, in one line, and the one button that plays it. */
function LevelDock({ width, compact, node, state, number, onPlay }: {
  width?: number; compact: boolean; node: QuestNode | null; state: QuestNodeState | null; number: number; onPlay: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const count = node ? questionCountFor(node) : 0;
  return (
    <GlassSurface variant="thick" style={[styles.dock, width ? { width } : styles.stretch]}>
      {compact ? null : <LevelArt node={node} state={state} size={56} />}
      <View style={styles.dockCopy}>
        <Text style={styles.dockKicker} numberOfLines={1}>{kickerFor(node, number)}</Text>
        <Text style={styles.dockTitle} numberOfLines={1}>{node?.title ?? 'Every level cleared'}</Text>
        {node ? <Text style={styles.dockMeta} numberOfLines={1}>{metaFor(state, number, count)}</Text> : null}
      </View>
      <AppButton size="md" icon={state === 'locked' ? 'lock' : 'play'} label={buttonFor(node, state)} disabled={state === 'locked'} onPress={onPlay} style={styles.dockButton} />
    </GlassSurface>
  );
}

/** The wide version of the dock: the level's art large, and the topics it covers. */
function LevelPanel({ width, node, state, number, onPlay }: {
  width: number; node: QuestNode | null; state: QuestNodeState | null; number: number; onPlay: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const count = node ? questionCountFor(node) : 0;
  return (
    <GlassSurface variant="thick" style={styles.panel}>
      <ScrollView contentContainerStyle={styles.levelBody} showsVerticalScrollIndicator={false}>
        <View style={styles.levelArt}><LevelArt node={node} state={state} size={Math.min(176, width - 96)} /></View>
        <Text style={styles.panelKicker}>{kickerFor(node, number)}</Text>
        <Text style={styles.levelTitle}>{node?.title ?? 'Every level cleared'}</Text>
        {node ? <Text style={styles.levelMeta}>{metaFor(state, number, count)}</Text> : null}
        {node?.skills.length ? (
          <View style={styles.topics}>
            <Text style={styles.panelKicker}>Topics</Text>
            <View style={styles.chips}>{node.skills.slice(0, 4).map(skill => <View key={skill} style={styles.chip}><Text style={styles.chipText} numberOfLines={1}>{skill}</Text></View>)}</View>
          </View>
        ) : null}
      </ScrollView>
      <AppButton icon={state === 'locked' ? 'lock' : 'play'} label={buttonFor(node, state)} disabled={state === 'locked'} onPress={onPlay} style={styles.levelButton} />
    </GlassSurface>
  );
}

/** Every unit at once, so a wide screen never needs the arrows. */
function UnitsPanel({ chapters, current, nodesOf, stateOf, courseName, onPick }: {
  chapters: Chapter[]; current: number; nodesOf: (chapter: Chapter) => QuestNode[];
  stateOf: (id: string) => QuestNodeState; courseName: string; onPick: (index: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <GlassSurface style={styles.panel}>
      <Text style={[styles.panelKicker, styles.unitsHead]} numberOfLines={1}>{courseName}</Text>
      <ScrollView contentContainerStyle={styles.unitsList} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter, index) => {
          const nodes = nodesOf(chapter);
          const done = nodes.filter(node => stateOf(node.id) === 'complete').length;
          const open = nodes.some(node => stateOf(node.id) !== 'locked');
          const on = index === current;
          return (
            <Pressable key={chapter.label} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${chapter.label}, ${chapter.title}. ${done} of ${nodes.length} levels cleared${open ? '' : '. Locked'}`}
              onPress={() => onPick(index)} style={({ pressed }) => [styles.unitRow, on && styles.unitRowOn, pressed && styles.pressed]}>
              <View style={styles.unitRowTop}>
                <Text style={styles.unit} numberOfLines={1}>{chapter.label}</Text>
                {done === nodes.length ? <Glyph name="check" size={14} /> : open ? <Text style={styles.tally}>{done + '/' + nodes.length}</Text> : <Glyph name="lock" size={13} />}
              </View>
              <Text style={[styles.unitRowTitle, !open && styles.off]} numberOfLines={2}>{chapter.title}</Text>
              {open ? <View importantForAccessibility="no-hide-descendants" aria-hidden><ProgressBar progress={nodes.length ? done / nodes.length : 0} height={3} /></View> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </GlassSurface>
  );
}

function LevelArt({ node, state, size }: { node: QuestNode | null; state: QuestNodeState | null; size: number }) {
  return node?.kind === 'boss'
    ? <BossSprite nodeId={node.id} size={size} dim={state === 'locked'} />
    : <Mascot pose={!node ? 'trophy' : state === 'complete' ? 'thumbsup' : state === 'locked' ? 'thinking' : 'point'} size={size} />;
}
const kickerFor = (node: QuestNode | null, number: number) =>
  !node ? 'Course complete' : 'Level ' + number + (node.kind === 'boss' ? (node.unitBoss ? ' · Unit boss' : ' · Boss') : '');
const metaFor = (state: QuestNodeState | null, number: number, count: number) =>
  state === 'locked' ? 'Clear level ' + (number - 1) + ' first' : count + ' questions · ' + Math.ceil(count * 0.6) + ' to pass';
const buttonFor = (node: QuestNode | null, state: QuestNodeState | null) =>
  !node ? 'Practise' : state === 'complete' ? 'Replay' : state === 'locked' ? 'Locked' : 'Play';

const createStyles = ({ colors, typography, glass }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  stretch: { alignSelf: 'stretch' },
  pressed: { opacity: 0.6 },
  fade: { position: 'absolute', left: 0, right: 0 },
  barDock: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 14, alignItems: 'center' },
  header: { height: HEADER, borderRadius: HEADER / 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  turn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.35 },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  unit: { ...typography.overline, fontSize: 10, lineHeight: 13, flexShrink: 1 },
  tally: { ...typography.overline, fontSize: 10, lineHeight: 13, color: colors.ink },
  unitTitle: { ...typography.subtitle, fontSize: 15, lineHeight: 19, marginBottom: 2 },
  onward: { marginTop: 4, borderRadius: 24, maxWidth: '86%' },
  onwardFace: { minHeight: 48, borderRadius: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  onwardText: { ...typography.label, fontSize: 13, lineHeight: 18, color: colors.ink, flexShrink: 1 },
  dock: { minHeight: DOCK, borderRadius: 30, paddingLeft: 14, paddingRight: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dockCopy: { flex: 1, minWidth: 0 },
  dockKicker: { ...typography.overline, fontSize: 10, lineHeight: 14 },
  dockTitle: { ...typography.subtitle, fontSize: 16, lineHeight: 21 },
  dockMeta: { ...typography.caption, fontSize: 11.5, lineHeight: 16 },
  dockButton: { marginBottom: 0 },

  zone: { position: 'absolute' },
  panel: { flex: 1, borderRadius: 30, overflow: 'hidden' },
  panelKicker: { ...typography.overline, fontSize: 10.5, lineHeight: 14 },
  unitsHead: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  unitsList: { padding: 10, gap: 6 },
  unitRow: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 11, gap: 5, borderWidth: 1, borderColor: 'transparent' },
  unitRowOn: { backgroundColor: glass.cardSelected, ...rimOf(colors.ink) },
  unitRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unitRowTitle: { ...typography.subtitle, fontSize: 14.5, lineHeight: 19 },
  levelBody: { padding: 24, paddingBottom: 12, gap: 8 },
  levelArt: { alignItems: 'center', paddingVertical: 8 },
  levelTitle: { ...typography.title, fontSize: 25, lineHeight: 30 },
  levelMeta: { ...typography.body, fontSize: 14 },
  topics: { marginTop: 14, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { maxWidth: '100%', borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { ...typography.caption, fontSize: 12, lineHeight: 16, color: colors.ink },
  levelButton: { marginHorizontal: 20, marginBottom: 20, marginTop: 4 },
});
