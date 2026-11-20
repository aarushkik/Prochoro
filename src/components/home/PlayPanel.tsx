import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuest } from '@/state/QuestContext';
import { useOnboarding } from '@/state/OnboardingContext';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { fonts, rimOf, withAlpha } from '@/theme';
import { frameworkFor, officialUnitForArea } from '@/data/courseFrameworks';
import { findNode, questionCountFor } from '@/data/questMap';
import { useHaptics } from '@/hooks/useHaptics';
import { getCourse } from '@/data';
import { learningLevels, levelNumber } from '@/utils/learningLevels';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ProgressBar } from '@/components/ui';
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
const DOCK = 76;
/** Widest the path itself is drawn on a phone or a portrait iPad. */
const PATH_WIDTH = 720;

/**
 * Learn: the current unit as a winding path, and one big button that starts
 * your next level. Opening the app and pressing it is all it takes to study;
 * tapping the level you are up to on the path starts it too.
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
  // A short note when a locked circle is tapped; it fades on its own.
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { if (!note) return; const timer = setTimeout(() => setNote(null), 2400); return () => clearTimeout(timer); }, [note]);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const nodes = useMemo(() => nodesOf(chapter), [chapter, nodesOf]);
  const cleared = nodes.filter(node => quest.stateOf(node.id) === 'complete').length;

  // Finishing a level moves both the path and the button on to the next one.
  const lastNext = useRef(progress.nextId);
  useEffect(() => {
    if (lastNext.current === progress.nextId) return;
    lastNext.current = progress.nextId;
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
  // The button always continues where you are up to; any open circle starts its own level.
  const selected = upNext;
  const state = selected ? quest.stateOf(selected.id) : null;
  const { stateOf, map } = quest;
  const play = useCallback((node: QuestNode) => {
    if (stateOf(node.id) === 'locked') return;
    const unit = map.units.find(value => value.nodes.some(item => item.id === node.id));
    nav.navigate('Quiz', { nodeId: node.id, unit: unit?.index, title: node.title, count: questionCountFor(node), xp: node.xp, boss: node.kind === 'boss' });
  }, [stateOf, map, nav]);
  const numberOf = useCallback((id: string) => levelNumber(quest.map, id) ?? 0, [quest.map]);
  // Like any path game: tap a circle to play it. A locked one says what opens it.
  const select = useCallback((node: QuestNode) => {
    if (stateOf(node.id) !== 'locked') { setNote(null); play(node); return; }
    const number = numberOf(node.id);
    setNote(number > 1 ? `Finish level ${number - 1} to open level ${number}.` : 'Finish the level before it first.');
  }, [stateOf, play, numberOf]);
  const turnTo = (index: number) => { setChapterIndex(index); setNote(null); };

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
          <LevelPanel node={selected} state={state} number={selected ? numberOf(selected.id) : 0} onPlay={() => selected ? play(selected) : onPractice()} />
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
        {note ? <GlassSurface variant="thick" style={[styles.note, barWidth ? { width: barWidth } : styles.stretch]}><Glyph name="lock" size={15} /><Text style={styles.noteText} numberOfLines={2}>{note}</Text></GlassSurface> : null}
        <StartButton width={barWidth} node={selected} state={state} number={selected ? numberOf(selected.id) : 0} onPlay={() => selected ? play(selected) : onPractice()} />
      </View>
    </View>
  );
}

/**
 * The one thing to do on this screen. Big, inked, and it says what it starts,
 * so nobody has to work out which level is next or where to press.
 */
function StartButton({ width, node, state, number, onPlay }: {
  width?: number; node: QuestNode | null; state: QuestNodeState | null; number: number; onPlay: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const haptic = useHaptics();
  const locked = state === 'locked';
  const label = !node ? 'Practice' : state === 'complete' ? 'Play again' : locked ? 'Locked' : node.kind === 'boss' ? 'Start boss battle' : 'Start';
  const detail = !node ? 'Every level cleared' : locked ? `Finish level ${number - 1} first` : `Level ${number} · ${node.title}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}. ${detail}`} accessibilityState={{ disabled: locked }} disabled={locked}
      onPress={() => { haptic(); onPlay(); }}
      style={({ pressed }) => [styles.start, width ? { width } : styles.stretch, locked && styles.startLocked, pressed && styles.startPressed]}>
      <View style={styles.startIcon}><Glyph name={locked ? 'lock' : 'play'} size={22} color={colors.primary} strokeWidth={2.4} /></View>
      <View style={styles.startCopy}>
        <Text style={styles.startLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.startDetail} numberOfLines={1}>{detail}</Text>
      </View>
    </Pressable>
  );
}

/** The wide version: the level's art large, its name, and the same button. */
function LevelPanel({ node, state, number, onPlay }: {
  node: QuestNode | null; state: QuestNodeState | null; number: number; onPlay: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <GlassSurface variant="thick" style={styles.panel}>
      <View style={styles.levelBody}>
        <View style={styles.levelArt}><LevelArt node={node} state={state} size={176} /></View>
        <Text style={styles.panelKicker}>{!node ? 'Course complete' : 'Level ' + number + (node.kind === 'boss' ? ' · Boss' : '')}</Text>
        <Text style={styles.levelTitle}>{node?.title ?? 'Every level cleared'}</Text>
      </View>
      <View style={styles.levelButton}><StartButton node={node} state={state} number={number} onPlay={onPlay} /></View>
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
  start: { minHeight: DOCK - 4, borderRadius: (DOCK - 4) / 2, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 10, paddingRight: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  startLocked: { opacity: 0.55 },
  note: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteText: { ...typography.label, fontSize: 13, lineHeight: 18, flex: 1 },
  startPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  startIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.textOnPrimary, alignItems: 'center', justifyContent: 'center' },
  startCopy: { flex: 1, minWidth: 0 },
  startLabel: { fontFamily: fonts.displayBold, fontSize: 21, lineHeight: 26, color: colors.textOnPrimary },
  startDetail: { ...typography.caption, fontSize: 12.5, lineHeight: 17, color: withAlpha(colors.textOnPrimary, 0.74) },

  zone: { position: 'absolute' },
  panel: { flex: 1, borderRadius: 30, overflow: 'hidden' },
  panelKicker: { ...typography.overline, fontSize: 10.5, lineHeight: 14 },
  unitsHead: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  unitsList: { padding: 10, gap: 6 },
  unitRow: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 11, gap: 5, borderWidth: 1, borderColor: 'transparent' },
  unitRowOn: { backgroundColor: glass.cardSelected, ...rimOf(colors.ink) },
  unitRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unitRowTitle: { ...typography.subtitle, fontSize: 14.5, lineHeight: 19 },
  levelBody: { flex: 1, padding: 24, paddingBottom: 12, gap: 8, justifyContent: 'center' },
  levelArt: { alignItems: 'center', paddingVertical: 8 },
  levelTitle: { ...typography.title, fontSize: 25, lineHeight: 30 },
  levelButton: { marginHorizontal: 16, marginBottom: 16, marginTop: 4 },
});
