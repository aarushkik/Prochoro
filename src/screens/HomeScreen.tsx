import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Glyph } from '@/components/icons';
import { SaveStatusNotice } from '@/components/account/SaveStatusNotice';
import { NextQuestCard } from '@/components/home/NextQuestCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Presence } from '@/components/ui/Presence';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useOnboarding } from '@/state/OnboardingContext';
import { getCourse } from '@/data';
import {
  BattlesPanel,
  LessonSheet,
  ProfilePanel,
  QuestHud,
  QuestTabBar,
  TrailSegment,
  TrainPanel,
  UnitBanner,
  trackHeight,
  type TrackMode,
  type QuestTab,
} from '@/components/home';
import { colors, duration, easing, fonts, radius, spacing, typography } from '@/theme';
import { questionCountFor } from '@/data/questMap';
import { useQuest } from '@/state/QuestContext';
import type { QuestNode, QuestUnit } from '@/types/quest';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

/**
 * Home — the quest map.
 *
 * The trail is the product: a scrolling illustrated route through ten areas of
 * the course where every stop is a thing you can actually start, the next one
 * is unmistakable, and each area's six bosses look like something you have to
 * earn. The other three tabs hang off the same progress state.
 *
 * Ten areas of eighteen stops is ~180 nodes of SVG, so the map is a FlatList of
 * whole areas rather than a ScrollView. Every area is exactly the same height,
 * which lets `getItemLayout` hand the list all ten offsets up front — without
 * it the list can only measure as far as you have already scrolled and the map
 * dead-ends a few areas in. The area banner is a pinned overlay that re-labels
 * itself as you cross into the next landscape.
 */
export function HomeScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, 620);
  const quest = useQuest();
  const { courseId } = useOnboarding();

  const [tab, setTab] = useState<QuestTab>('map');
  const [selected, setSelected] = useState<QuestNode | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  /** A track to scroll to once the map tab is visible. See the effect below. */
  const [pendingJump, setPendingJump] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  /**
   * The HUD floats over every tab, so content is inset by its height and
   * scrolls up underneath it. The map does this with a spacer at the top of
   * its header, which means `headerHeight` includes the HUD — every offset
   * below that turns a content position into "what is just under the HUD"
   * subtracts it back out.
   */
  const [hudHeight, setHudHeight] = useState(0);
  const [awayFromStart, setAwayFromStart] = useState(false);

  const units = quest.map.units;
  const completedSet = useMemo(() => new Set(quest.completed), [quest.completed]);
  const currentNode = useMemo(
    () => units.flatMap((unit) => unit.nodes).find((node) => node.id === quest.currentNodeId) ?? null,
    [units, quest.currentNodeId],
  );

  /**
   * Track heights are not uniform — the one holding the current stop is taller,
   * because that stop is bigger and carries a flag above it. So offsets are
   * accumulated exactly rather than multiplied out from a single height.
   */
  /**
   * How each track draws. Everything behind you collapses to a pip strip,
   * everything ahead to a locked stub; only the track you are on and the one
   * after it lay out their stops. Ten fully-expanded tracks is ~23,000 points
   * of scrolling that buries the one stop you can actually play.
   */
  const modes = useMemo<TrackMode[]>(() => {
    const openIndex = units.findIndex((u) => u.nodes.some((n) => quest.stateOf(n.id) === 'current'));
    return units.map((u, i) => {
      if (openIndex === -1) return u.nodes.every((n) => quest.stateOf(n.id) === 'complete') ? 'cleared' : 'locked';
      if (i < openIndex) return 'cleared';
      if (i === openIndex) return 'open';
      if (i === openIndex + 1) return 'next';
      return 'locked';
    });
  }, [units, quest.stateOf]);

  const metrics = useMemo(() => {
    const heights = units.map((u, i) => trackHeight(u, modes[i], quest.stateOf, width));
    const offsets: number[] = [];
    let run = 0;
    for (const h of heights) {
      offsets.push(run);
      run += h;
    }
    return { heights, offsets, total: run };
  }, [units, modes, quest.stateOf, width]);

  const unitOf = useCallback(
    (node: QuestNode | null) => units.find((u) => u.nodes.some((n) => n.id === node?.id)),
    [units],
  );

  const startSelected = () => {
    if (!selected || quest.stateOf(selected.id) === 'locked') return;
    const node = selected;
    setSelected(null);
    navigation.navigate('Quiz', {
      nodeId: node.id,
      title: node.title,
      xp: node.xp,
      count: questionCountFor(node),
      unit: unitOf(node)?.index,
      boss: node.kind === 'boss',
    });
  };

  // Which area the viewport is sitting in. Only commits when it actually
  // changes, so scrolling doesn't re-render the map on every frame.
  const areaRef = useRef(0);
  const listRef = useRef<FlatList<QuestUnit>>(null);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      // Which track the viewport is in: the last one whose top has passed
      // under the pinned banner. Collapsed tracks are only ~124pt tall, so a
      // fold line further down the screen would name a track you cannot see.
      // Header and top inset belong to the list, not to segment metrics.
      const line = Math.max(0, y + hudHeight - headerHeight + 8);
      setAwayFromStart((away) => {
        const nextAway = y + hudHeight > headerHeight + 180;
        return away === nextAway ? away : nextAway;
      });
      let next = 0;
      for (let i = 0; i < metrics.offsets.length; i += 1) {
        if (metrics.offsets[i] <= line) next = i;
      }
      if (next !== areaRef.current) {
        areaRef.current = next;
        setActiveIndex(next);
      }
    },
    [metrics, headerHeight, hudHeight],
  );

  /**
   * Endless review of a track that has been cleared.
   *
   * No `nodeId`, so it clears nothing and can be replayed forever; `unit`, so
   * every question comes from that track's own topic rather than the course at
   * large — which is the entire point of reviewing a *place*.
   */
  const startReview = useCallback(
    (unit: QuestUnit) => {
      navigation.navigate('Quiz', {
        title: `${unit.track.place} review`,
        unit: unit.index,
        count: 5,
        xp: 0,
        endless: true,
      });
    },
    [navigation],
  );

  const renderSegment = useCallback(
    ({ item, index }: { item: QuestUnit; index: number }) => (
      <TrailSegment
        unit={item}
        width={width}
        mode={modes[index]}
        animated={tab === 'map'}
        nextPlace={units[index + 1]?.track.place}
        stateOf={quest.stateOf}
        onSelect={setSelected}
        onReview={startReview}
      />
    ),
    [width, quest.stateOf, modes, units, startReview, tab],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<QuestUnit> | null | undefined, index: number) => ({
      length: metrics.heights[index] ?? 0,
      offset: headerHeight + (metrics.offsets[index] ?? 0),
      index,
    }),
    [metrics, headerHeight],
  );

  /**
   * Take the map to a track.
   *
   * Works because the map stays mounted behind the other tabs (see below), so
   * the list is already laid out and measured when this runs.
   *
   * `scrollToOffset` with our own accumulated offset rather than
   * `scrollToIndex`: index-based scrolling refuses to jump beyond the render
   * window, and `initialScrollIndex` is worse on web — it renders from that
   * index and never lays out the tracks above it, losing half the map.
   */
  const jumpToTrack = useCallback((index: number) => {
    areaRef.current = index;
    setActiveIndex(index);
    setPendingJump(index);
    setTab('map');
  }, []);

  /**
   * The scroll itself, once the map is actually on screen.
   *
   * It cannot go in `jumpToTrack`: the hidden tab is `display: none`, which
   * gives the list no scroll box at all, so a scroll issued in the same tick
   * as the tab switch lands on a zero-height element and is dropped. An effect
   * runs after the DOM has been updated, by which point the map has a box.
   */
  useEffect(() => {
    if (tab !== 'map' || pendingJump == null) return;
    listRef.current?.scrollToOffset({
      offset: Math.max(0, headerHeight - hudHeight + (metrics.offsets[pendingJump] ?? 0)),
      animated: false,
    });
    setPendingJump(null);
  }, [tab, pendingJump, metrics, headerHeight, hudHeight]);

  const activeUnit = units[activeIndex] ?? units[0];

  return (
    <View style={styles.root}>
      <AreaBackdrop kind={activeUnit?.track.kind} opacity={0.35} />
      <StatusBar style={appTheme.isDark ? "light" : "dark"} />
      {/* The map stays mounted and is hidden rather than unmounted. Rebuilding
          2,400 points of SVG on every tab switch is wasteful, it threw away
          your scroll position each time, and a list that does not exist cannot
          be scrolled — which is what made "go to this track" a no-op. */}
      <View style={[styles.mapArea, tab !== 'map' && styles.hidden]} pointerEvents={tab === 'map' ? 'auto' : 'none'}>
          <FlatList
            ref={listRef}
            data={units}
            keyExtractor={(unit) => unit.id}
            renderItem={renderSegment}
            getItemLayout={getItemLayout}
            onScroll={onScroll}
            scrollEventThrottle={32}
            scrollIndicatorInsets={{ top: hudHeight }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
            ListHeaderComponent={
              <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
                <View style={{ height: hudHeight }} />
                <NextQuestCard
                  node={currentNode}
                  course={getCourse(courseId)?.name ?? 'Your course'}
                  courseId={courseId}
                  todayCount={quest.todayCount}
                  dailyGoal={quest.dailyGoal}
                  onContinue={() => currentNode ? setSelected(currentNode) : setTab('practice')}
                  active={tab === 'map'}
                />
                <SaveStatusNotice />
              </View>
            }
            ListFooterComponent={
              <TrailEnd
                cleared={quest.completed.length}
                total={quest.map.order.length}
                tracks={units.length}
              />
            }
            // Areas are tall and SVG-heavy, so keep few mounted.
            // removeClippedSubviews stays off: the stops are absolutely
            // positioned inside their segment and Android clips them otherwise.
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews={false}
          />

          <Presence visible={awayFromStart && !!activeUnit} style={[styles.bannerDock, { top: hudHeight }]}>
            {activeUnit ? (
              <UnitBanner
                unit={activeUnit}
                cleared={activeUnit.nodes.filter((n) => completedSet.has(n.id)).length}
              />
            ) : null}
          </Presence>
          <Presence visible={awayFromStart && !!currentNode} from="bottom" style={styles.continueDock}>
            {currentNode ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open your next quest, ${currentNode.title}`}
                onPress={() => setSelected(currentNode)}
                style={({ pressed }) => [styles.continuePress, pressed && styles.continuePressed]}
              >
                <GlassSurface tint={colors.current} interactive style={styles.continueGlass}>
                  <Glyph name="play" size={17} color={colors.textOnPrimary} />
                  <Text style={styles.continueText}>Next quest</Text>
                </GlassSurface>
              </Pressable>
            ) : null}
          </Presence>
      </View>

      {tab === 'practice' ? (
        <TabFade key="practice" style={styles.mapArea}>
          <TrainPanel topInset={hudHeight} />
        </TabFade>
      ) : null}
      {tab === 'progress' ? (
        <TabFade key="progress" style={styles.mapArea}>
          <BattlesPanel onSelect={setSelected} onJumpToTrack={jumpToTrack} topInset={hudHeight} />
        </TabFade>
      ) : null}
      {tab === 'you' ? (
        <TabFade key="you" style={styles.mapArea}>
          <ProfilePanel topInset={hudHeight} />
        </TabFade>
      ) : null}

      <QuestHud
        streakDays={quest.streakDays}
        gems={quest.gems}
        xp={quest.xp}
        equippedId={quest.equippedId}
        onOpenCharacters={() => navigation.navigate('Characters')}
        onLayout={(event) => setHudHeight(Math.round(event.nativeEvent.layout.height))}
      />

      <QuestTabBar active={tab} onChange={setTab} />

      <LessonSheet
        node={selected}
        state={selected ? quest.stateOf(selected.id) : 'locked'}
        unitTitle={unitOf(selected)?.title ?? ''}
        onStart={startSelected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

/**
 * Fades and lifts a tab's panel in.
 *
 * Only the incoming panel animates — the outgoing one is unmounted the instant
 * the tab changes, so there is nothing to cross-fade *with*. Fading the
 * arrival alone still removes the hard cut, and it avoids keeping two full
 * panels mounted just for a transition.
 *
 * Content starts at full opacity and is faded *up* from 0.4 rather than 0: a
 * panel that begins invisible reads as a load, not a move.
 */
function TabFade({ children, style }: { children: React.ReactNode; style?: object }) {
  const { motionEnabled } = useMotionPreference();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!motionEnabled) { enter.setValue(1); return; }
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: duration.base,
      easing: easing.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [enter, motionEnabled]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Closes the trail so the last area doesn't just stop mid-scroll.
 *
 * It used to congratulate everyone unconditionally — "You've crossed the whole
 * map. Ten areas, sixty bosses." — including someone who had cleared nothing.
 * It is the last thing you see on the map, so a student who scrolled to the
 * bottom on their first day was told they had finished the app.
 *
 * Three states, because the honest thing to say changes: what is ahead before
 * you start, how far you have come while you are going, and the crown only
 * when it has actually been earned.
 */
function TrailEnd({ cleared, total, tracks }: { cleared: number; total: number; tracks: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const done = total > 0 && cleared >= total;

  if (done) {
    return (
      <View style={styles.end}>
        <View style={styles.endIcon}>
          <Glyph name="crown" size={28} color={colors.gold} strokeWidth={2.2} />
        </View>
        <Text style={[typography.subtitle, styles.endTitle]}>You've crossed the whole map</Text>
        <Text style={[typography.body, styles.endBody]}>
          Every stop cleared. The endless review at the foot of each track keeps going as long as
          you want it to.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.end}>
      <View style={styles.endIconQuiet}>
        <Glyph name="map" size={26} color={colors.textMuted} strokeWidth={2.2} />
      </View>
      <Text style={[typography.subtitle, styles.endTitle]}>
        {cleared === 0 ? 'The map ends here for now' : `${cleared} of ${total} stops cleared`}
      </Text>
      <Text style={[typography.body, styles.endBody]}>
        {cleared === 0
          ? `${tracks} areas and sixty boss duels ahead. Clear a track and the next one opens.`
          : 'Keep going — each final check you pass opens the area after it.'}
      </Text>
    </View>
  );
}

const createStyles = ({ colors, palette, typography, stroke }: AppTheme) => StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', backgroundColor: colors.background },
  mapArea: { flex: 1 },
  hidden: { display: 'none' },
  // Pinned just under the floating HUD; `top` is set inline from its height.
  bannerDock: { position: 'absolute', left: 0, right: 0 },
  continueDock: { position: 'absolute', bottom: 116, right: 18 },
  continuePress: { borderRadius: 25 },
  continuePressed: { transform: [{ scale: 0.95 }] },
  continueGlass: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 50, borderRadius: 25, paddingHorizontal: 18 },
  continueText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textOnPrimary },

  end: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  // The unearned state is deliberately quieter: no gold, no fill. A crown you
  // have not won should not look like one you have.
  endIconQuiet: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: stroke.surface,
    borderColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  endIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  endTitle: { textAlign: 'center' },
  endBody: { textAlign: 'center', marginTop: spacing.xs },
});
