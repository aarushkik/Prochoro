import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme';
import { frameworkFor, officialUnitForArea } from '@/data/courseFrameworks';
import { findNode, questionCountFor } from '@/data/questMap';
import { learningLevels, levelNumber } from '@/utils/learningLevels';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton, ProgressBar } from '@/components/ui';
import { BossSprite } from '@/components/creatures/BossSprite';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { SaveStatusNotice } from '@/components/account/SaveStatusNotice';
import type { QuestNode } from '@/types/quest';
import type { RootStackParamList } from '@/navigation/types';
import { LearningPath } from './LearningPath';
import { stopY } from './pathGeometry';

export interface AreaRequest { index: number; id: number }

/** A stretch of the course shown as one path: an AP unit, or the review after them. */
interface Chapter { label: string; title: string; areas: number[] }

const HEADER = 62;
/** The tab bar's capsule plus the gap above it; the dock floats on top of that. */
const TAB_BAR = 80;
const DOCK = 84;
const COLUMN = 620;

/**
 * Play: the current unit as a winding path, with one button that always plays
 * the stone you have picked. The path opens on your next level.
 */
export function PlayPanel({ topInset = 0, areaRequest, onPractice, onAreaChange }: {
  topInset?: number; areaRequest?: AreaRequest | null; onPractice: () => void; onAreaChange?: (index: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  // The page colour at three strengths. Never `transparent`: gradients do not
  // premultiply, so fading to transparent black greys the middle of the fade.
  const fade = useMemo(() => [withAlpha(colors.background, 1), withAlpha(colors.background, 0.8), withAlpha(colors.background, 0)] as const, [colors.background]);
  const quest = useQuest();
  const { courseId } = useOnboarding();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(window.width, COLUMN));
  const [viewport, setViewport] = useState(window.height);
  const scroll = useRef<ScrollView>(null);

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

  const progress = learningLevels(quest.map, quest.completed);
  const nextArea = quest.map.units.find(unit => unit.nodes.some(node => node.id === progress.nextId))?.index ?? 0;
  const [chapterIndex, setChapterIndex] = useState(() => chapterOf(areaRequest?.index ?? nextArea));
  const [selectedId, setSelectedId] = useState<string | null>(progress.nextId);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const nodes = useMemo(() => chapter.areas.flatMap(index => quest.map.units[index]?.nodes ?? []), [chapter, quest.map]);
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

  // Open on the stone you are up to, a little above the middle of the screen.
  const top = topInset + HEADER + 10;
  const focus = nodes.findIndex(node => node.id === progress.nextId);
  useEffect(() => {
    const y = focus < 0 ? 0 : Math.max(0, top + stopY(focus) - viewport * 0.42);
    const timer = setTimeout(() => scroll.current?.scrollTo({ y, animated: false }), 0);
    return () => clearTimeout(timer);
  }, [chapterIndex, focus, viewport, top]);

  // The button plays the stone you picked on this path. Browsing another unit
  // never strands it: with nothing picked here it offers your next level.
  const upNext = progress.nextId ? findNode(quest.map, progress.nextId)?.node ?? null : null;
  const selected = nodes.find(node => node.id === selectedId) ?? upNext;
  const state = selected ? quest.stateOf(selected.id) : null;
  const number = selected ? levelNumber(quest.map, selected.id) ?? 0 : 0;
  const count = selected ? questionCountFor(selected) : 0;
  const play = (node: QuestNode) => {
    if (quest.stateOf(node.id) === 'locked') return;
    const unit = quest.map.units.find(value => value.nodes.some(item => item.id === node.id));
    nav.navigate('Quiz', { nodeId: node.id, unit: unit?.index, title: node.title, count: questionCountFor(node), xp: node.xp, boss: node.kind === 'boss' });
  };
  const numberOf = useCallback((id: string) => levelNumber(quest.map, id) ?? 0, [quest.map]);
  const select = useCallback((node: QuestNode) => setSelectedId(node.id), []);
  const bottom = Math.max(insets.bottom, 12) + TAB_BAR;
  const turnTo = (index: number) => { setChapterIndex(index); setSelectedId(progress.nextId); };
  // The path dissolves as it passes under the bars, so a label is never
  // half-read in the gap between two of them. On the web the path itself is
  // masked, which leaves the landscape behind it untouched from edge to edge.
  const fadeTop = top + 14;
  const fadeBottom = bottom + DOCK + 22;
  const mask = useMemo(() => {
    if (Platform.OS !== 'web') return null;
    const image = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0.2) ${Math.round(fadeTop * 0.62)}px, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), rgba(0,0,0,0.2) calc(100% - ${Math.round(fadeBottom * 0.62)}px), rgba(0,0,0,0) 100%)`;
    return { maskImage: image, WebkitMaskImage: image } as ViewStyle;
  }, [fadeTop, fadeBottom]);
  const hasPrevious = chapterIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1;

  return (
    <View style={styles.flex} onLayout={event => { setWidth(Math.min(event.nativeEvent.layout.width, COLUMN)); setViewport(event.nativeEvent.layout.height); }}>
      <ScrollView ref={scroll} style={[styles.flex, mask]} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + DOCK + 28, alignItems: 'center' }}>
        <SaveStatusNotice />
        <LearningPath nodes={nodes} width={width} stateOf={quest.stateOf} numberOf={numberOf} selectedId={selected?.id ?? null} onSelect={select} />
        {hasNext ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Go to ${chapters[chapterIndex + 1].label}, ${chapters[chapterIndex + 1].title}`}
            onPress={() => turnTo(chapterIndex + 1)} style={({ pressed }) => [styles.onward, pressed && styles.pressed]}>
            <GlassSurface style={styles.onwardFace}>
              <Text style={styles.onwardText} numberOfLines={1}>{chapters[chapterIndex + 1].label + ' · ' + chapters[chapterIndex + 1].title}</Text>
              <Glyph name="arrow-right" size={16} />
            </GlassSurface>
          </Pressable>
        ) : <Mascot pose="trophy" size={96} />}
      </ScrollView>

      {/* Native has no mask without another dependency, and its column is the
          whole screen, so there the page colour is laid over the two ends. */}
      {Platform.OS === 'web' ? null : <>
        <LinearGradient pointerEvents="none" colors={fade} locations={[0, 0.62, 1]} style={[styles.fade, { top: 0, height: fadeTop }]} />
        <LinearGradient pointerEvents="none" colors={[fade[2], fade[1], fade[0]]} locations={[0, 0.38, 1]} style={[styles.fade, { bottom: 0, height: fadeBottom }]} />
      </>}

      <View pointerEvents="box-none" style={[styles.headerDock, { top: topInset }]}>
        <GlassSurface style={styles.header}>
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

      <View pointerEvents="box-none" style={[styles.dockWrap, { bottom }]}>
        <GlassSurface variant="thick" style={styles.dock}>
          {width < 350 ? null : selected?.kind === 'boss'
            ? <BossSprite nodeId={selected.id} size={56} dim={state === 'locked'} />
            : <Mascot pose={!selected ? 'trophy' : state === 'complete' ? 'thumbsup' : state === 'locked' ? 'thinking' : 'point'} size={56} />}
          <View style={styles.dockCopy}>
            <Text style={styles.dockKicker} numberOfLines={1}>
              {!selected ? 'Course complete' : 'Level ' + number + (selected.kind === 'boss' ? (selected.unitBoss ? ' · Unit boss' : ' · Boss') : '')}
            </Text>
            <Text style={styles.dockTitle} numberOfLines={1}>{selected?.title ?? 'Every level cleared'}</Text>
            {selected ? (
              <Text style={styles.dockMeta} numberOfLines={1}>
                {state === 'locked' ? 'Clear level ' + (number - 1) + ' first' : count + ' questions · ' + Math.ceil(count * 0.6) + ' to pass'}
              </Text>
            ) : null}
          </View>
          <AppButton
            size="md"
            icon={state === 'locked' ? 'lock' : 'play'}
            label={!selected ? 'Practise' : state === 'complete' ? 'Replay' : state === 'locked' ? 'Locked' : 'Play'}
            disabled={state === 'locked'}
            onPress={() => selected ? play(selected) : onPractice()}
            style={styles.dockButton}
          />
        </GlassSurface>
      </View>
    </View>
  );
}

const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  fade: { position: 'absolute', left: 0, right: 0 },
  headerDock: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 14 },
  header: { height: HEADER, borderRadius: HEADER / 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  turn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.25 },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  unit: { ...typography.overline, fontSize: 10, lineHeight: 13, flexShrink: 1 },
  tally: { ...typography.overline, fontSize: 10, lineHeight: 13, color: colors.ink },
  unitTitle: { ...typography.subtitle, fontSize: 15, lineHeight: 19, marginBottom: 2 },
  onward: { marginTop: 4, borderRadius: 24, maxWidth: '86%' },
  onwardFace: { minHeight: 48, borderRadius: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  onwardText: { ...typography.label, fontSize: 13, lineHeight: 18, color: colors.ink, flexShrink: 1 },
  dockWrap: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 14 },
  dock: { minHeight: DOCK, borderRadius: 30, paddingLeft: 14, paddingRight: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dockCopy: { flex: 1, minWidth: 0 },
  dockKicker: { ...typography.overline, fontSize: 10, lineHeight: 14 },
  dockTitle: { ...typography.subtitle, fontSize: 16, lineHeight: 21 },
  dockMeta: { ...typography.caption, fontSize: 11.5, lineHeight: 16 },
  dockButton: { marginBottom: 0 },
});
