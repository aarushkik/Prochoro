import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { BossSprite } from '@/components/creatures/BossSprite';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LANDSCAPE_ART } from '@/data/illustrations';
import { Mascot } from '@/components/Mascot';
import { Glyph } from '@/components/icons';
import { colors, fonts, palette } from '@/theme';
import type { QuestNode, QuestNodeState, QuestUnit } from '@/types/quest';
import { QuestNodeButton, nodeSizeFor } from './QuestNodeButton';
import { Skyline } from './Skyline';
import { TrackProps, type PropAnchor } from './TrackProps';
import { TrackScenery } from './TrackScenery';

/**
 * One track on the path.
 *
 * A track is not always the full walk. Ten tracks of eighteen stops laid out
 * end to end is ~23,000 points of scrolling, almost all of it behind you or
 * not yet open, and it buries the one stop you can actually play. So a track
 * renders at one of four densities:
 *
 * - **cleared** — the plaque and a strip of filled pips. A glance says "done,
 *   eighteen of them", which is all it needs to say.
 * - **locked** — the plaque, four dashed pips, and when it opens.
 * - **open** — the plaque, the full serpentine path, and the gate boss.
 * - **next** — the plaque and a four-stop preview of what is coming.
 *
 * The track is its own landscape: its sky is the ground, its silhouette stands
 * on the boundary line at the bottom, and a 3px rule separates it from the
 * place before.
 */

/** How a track is drawn, from where the student has reached. */
export type TrackMode = 'cleared' | 'open' | 'next' | 'locked';

/** The design's offset cycle, in points from centre. */
const OFF = [0, -62, -92, -46, 26, 66, 34, -34, -70, -22, 34, 4, -40];

const STEP = 118;
const CURRENT_STEP = 156;
/** Extra room above the current stop for its ring and flag. */
const CURRENT_PAD = 58;

// The head of every track: 14pt of sky, then the plaque, then 12pt of air.
const PAD_TOP = 14;
const PLAQUE_FACE = 58;
const PLAQUE_LIP = 5;
const HEAD = PAD_TOP + PLAQUE_FACE + PLAQUE_LIP + 12;
const STOPS_TOP = HEAD + 4;
const STOPS_BOTTOM = 10;

const PIP = 20;
const PIP_GAP = 6;
const PIP_PAD_X = 20;
/** A locked track's stub: four dashed pips and the line saying when it opens. */
const LOCK_BLOCK = 18 + 18;
/** The review dock at the foot of a cleared track. */
const REVIEW_BLOCK = 78 + 6 + 16;
/** The gate boss card at the foot of the open track. */
const BOSS_BLOCK = 94 + 7 + 18;

/** A "next" track shows only a short preview of what is coming. */
const PREVIEW_STOPS = 4;

interface TrailSegmentProps {
  unit: QuestUnit;
  width: number;
  mode: TrackMode;
  /** The place this track's gate boss opens, if there is one after it. */
  nextPlace?: string;
  stateOf: (nodeId: string) => QuestNodeState;
  onSelect: (node: QuestNode) => void;
  animated?: boolean;
  /** Start the endless review for a track that has been cleared. */
  onReview?: (unit: QuestUnit) => void;
}

function stopsFor(unit: QuestUnit, mode: TrackMode): QuestNode[] {
  if (mode === 'open') return unit.nodes;
  if (mode === 'next') return unit.nodes.slice(0, PREVIEW_STOPS);
  return [];
}

/** The boss that opens the next track — the last one on the track. */
function gateBoss(unit: QuestUnit): QuestNode | undefined {
  for (let i = unit.nodes.length - 1; i >= 0; i -= 1) {
    if (unit.nodes[i].kind === 'boss') return unit.nodes[i];
  }
  return undefined;
}

/** How many rows the pip strip wraps onto at this width. */
function pipRows(count: number, width: number): number {
  const perRow = Math.max(1, Math.floor((width - PIP_PAD_X * 2 + PIP_GAP) / (PIP + PIP_GAP)));
  return Math.ceil(count / perRow);
}

/** Where each stop sits, and how tall the track is in total. */
function layout(
  unit: QuestUnit,
  mode: TrackMode,
  stateOf: (id: string) => QuestNodeState,
  width: number,
) {
  const nodes = stopsFor(unit, mode);

  if (nodes.length === 0) {
    const tail =
      mode === 'cleared'
        ? pipRows(unit.nodes.length, width) * PIP +
          (pipRows(unit.nodes.length, width) - 1) * PIP_GAP +
          16 +
          REVIEW_BLOCK
        : LOCK_BLOCK;
    return { stops: [], height: HEAD + tail };
  }

  let y = STOPS_TOP;
  const stops = nodes.map((node, i) => {
    const state = stateOf(node.id);
    const current = state === 'current';
    const off = OFF[i % OFF.length] * Math.min(1, Math.max(0.4, (width - 170) / 200));
    const nextOff = i + 1 < nodes.length ? OFF[(i + 1) % OFF.length] * Math.min(1, Math.max(0.4, (width - 170) / 200)) : off + 20;
    const pad = current ? CURRENT_PAD : 0;
    const at = y + pad;
    y += (current ? CURRENT_STEP : STEP) + pad;
    return { node, state, off, nextOff, top: at, current, last: i === nodes.length - 1 };
  });

  const bossTop = y + STOPS_BOTTOM;
  const boss = mode === 'open' ? gateBoss(unit) : undefined;
  return {
    stops,
    boss,
    bossTop,
    height: bossTop + (boss ? BOSS_BLOCK : 0),
  };
}

/** How tall a track renders. The list needs this exactly to place offsets. */
export function trackHeight(
  unit: QuestUnit,
  mode: TrackMode,
  stateOf: (id: string) => QuestNodeState,
  width: number,
): number {
  return layout(unit, mode, stateOf, width).height;
}

export const TrailSegment = React.memo(TrailSegmentImpl);

function TrailSegmentImpl({ unit, width, mode, nextPlace, stateOf, onSelect, onReview, animated = true }: TrailSegmentProps) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { track } = unit;
  const { stops, boss, bossTop, height } = useMemo(
    () => layout(unit, mode, stateOf, width),
    [unit, mode, stateOf, width],
  );
  const half = width / 2;
  const cleared = unit.nodes.filter((n) => stateOf(n.id) === 'complete').length;

  // Props follow the trail rather than the track box, so they need to know
  // where the stops are and which way the path is leaning at each one.
  const anchors = useMemo<PropAnchor[]>(
    () => stops.map((s) => ({ top: s.top, off: s.off, size: nodeSizeFor(s.state), current: s.current })),
    [stops],
  );

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: appTheme.isDark ? colors.surfaceSunken : track.sky,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Landscape layers only where there is a landscape to draw.
          A locked track is a 125pt stub: the skyline's silhouettes get clipped
          to their top few points and read as stray bars floating over a pastel
          band, and the scenery's arcs have nowhere to sit. Both were added to
          give a *place* texture, and a stub is not a place — it is a label
          saying one is coming. The flat band alone is cleaner and stops the
          eye trying to resolve shapes that mean nothing. */}
      {mode === 'locked' ? null : (
        <>
          <TrackScenery kind={track.kind} color={track.dark} width={width} height={height} seed={track.n} />
          <Skyline kind={track.kind} color={track.dark} width={width} />
        </>
      )}
      {/* After the silhouette, before the stops: props stand in front of the
          horizon and behind anything you can tap. */}
      <TrackProps kind={track.kind} width={width} height={height} anchors={anchors} seed={track.n} />

      <View style={styles.head}>
        <Plaque unit={unit} mode={mode} cleared={cleared} />
        {mode === 'cleared' ? <Pips track={track} count={unit.nodes.length} /> : null}
        {mode === 'cleared' && onReview ? (
          <ReviewDock unit={unit} onPress={() => onReview(unit)} />
        ) : null}
        {mode === 'locked' ? <LockedStub unit={unit} /> : null}
      </View>

      {stops.map(({ node, state, off, nextOff, top, current, last }) => {
        const size = nodeSizeFor(state);
        const done = state === 'complete';

        return (
          // A Fragment, not a View. Every React Native view is `position:
          // relative`, so a wrapper here would become the offset parent and
          // every stop would be placed against its own slot in the flow
          // instead of against the track.
          <React.Fragment key={node.id}>
            {last
              ? null
              : [0, 1, 2].map((k) => {
                  const f = (k + 1) / 4;
                  const x = off + (nextOff - off) * f;
                  return (
                    <View
                      key={k}
                      style={[
                        styles.dot,
                        {
                          left: half + x - 4.5,
                          top: top + size + 30 + k * 15,
                          backgroundColor: done || current ? track.dark : palette.sandDeep,
                        },
                      ]}
                    />
                  );
                })}

            {current ? (
              // The design parks the mascot a fixed 148pt left of the stop. It
              // never puts the current stop far enough left for that to run
              // off the screen; this map can, so the left edge is held on.
              // Drawn before the stop so the stop and its label sit over it.
              <View
                pointerEvents="none"
                style={[styles.mascot, { left: Math.max(6, half + off - 148), top: top - 6 }]}
              >
                <Mascot pose="point" size={112} animated={animated} shadow={false} />
              </View>
            ) : null}

            <View style={[styles.slot, { left: half + off - size / 2, top, width: size }]}>
              <QuestNodeButton node={node} state={state} track={track} animated={animated} onPress={() => onSelect(node)} />
            </View>
          </React.Fragment>
        );
      })}

      {boss ? (
        <View style={[styles.bossDock, { top: bossTop }]}>
          <GateBossCard unit={unit} node={boss} nextPlace={nextPlace} onPress={() => onSelect(boss)} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The track's nameplate: number badge, place, topic, and a stamp saying where
 * you stand with it. The cleared stamp is rotated four degrees — the one place
 * in the design where something is deliberately off-square, so "CLEARED" reads
 * as a stamp pressed onto the card rather than another label.
 */
function Plaque({ unit, mode, cleared }: { unit: QuestUnit; mode: TrackMode; cleared: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const { track } = unit;
  const n = track.n < 10 ? `0${track.n}` : `${track.n}`;

  const stamp =
    mode === 'cleared'
      ? { text: 'CLEARED', bg: track.deep, fg: colors.white, tilt: true }
      : mode === 'open'
        ? { text: `${cleared}/${unit.nodes.length}`, bg: colors.current, fg: palette.orangeDark, tilt: false }
        : mode === 'next'
          ? { text: 'NEXT UP', bg: colors.surface, fg: colors.textSecondary, tilt: false }
          : { text: 'LOCKED', bg: colors.overlayFaint, fg: colors.textSecondary, tilt: false };

  return (
    <View style={styles.plaqueWrap}>
      <View style={styles.plaque}>
        <Image source={LANDSCAPE_ART[track.kind]} resizeMode="contain" style={styles.regionArt} accessible={false} />
        <View style={styles.plaqueBody}>
          <Text style={styles.place} numberOfLines={2}>
            {track.place}
          </Text>
          <Text style={styles.topic} numberOfLines={1}>
            {`Track ${n} · ${unit.title}`}
          </Text>
        </View>
        <View
          style={[
            styles.stamp,
            { backgroundColor: stamp.bg },
            stamp.tilt ? { transform: [{ rotate: '-4deg' }] } : null,
          ]}
        >
          <Text style={[styles.stampText, { color: stamp.fg }]}>{stamp.text}</Text>
        </View>
      </View>
    </View>
  );
}

/** A cleared track's stops, compressed to one filled pip each. */
function Pips({ track, count }: { track: QuestUnit['track']; count: number }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.pipRow}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.pip, { backgroundColor: track.deep }]} />
      ))}
    </View>
  );
}

/** A locked track: four dashed pips and when it opens. */
function LockedStub({ unit }: { unit: QuestUnit }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.lockWrap}>
      <View style={styles.pipRowTight}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={styles.pipEmpty} />
        ))}
      </View>
      <Text style={styles.lockNote}>Opens after Track {unit.track.n - 1}</Text>
    </View>
  );
}

/**
 * The gate boss — the fight at the foot of the track that opens the next
 * place. It is on the path too, but it gets a card of its own because it is
 * the only stop whose outcome changes the map.
 */

/**
 * The endless review at the foot of a cleared track.
 *
 * A cleared track had nothing left on it — a row of grey pips and a scroll
 * past. That is ten of the twelve screens of a finished course reading as
 * dead ground, and it also meant the only way to revisit a unit was the
 * Practice tab, which does not know that units exist.
 *
 * The review draws from that track's own unit and never runs out: it tops up
 * a fresh batch each time you near the end and banks what you answered when
 * you stop. So it is genuinely endless rather than a long fixed set, and
 * stopping is a choice rather than a boundary.
 *
 * It is drawn in the track's own deep tone rather than the ink-on-cream of a
 * stop, because it is not a stop — nothing about it advances the map, and a
 * card that looks tappable-and-progressing would promise otherwise.
 */
function ReviewDock({ unit, onPress }: { unit: QuestUnit; onPress: () => void }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.reviewWrap}>
      <View style={[styles.reviewLip, { backgroundColor: unit.track.dark }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Endless review of ${unit.track.place}`}
        onPress={onPress}
        style={[styles.reviewFace, { backgroundColor: unit.track.deep }]}
      >
        <View style={styles.reviewIcon}>
          <Glyph name="refresh" size={22} color={unit.track.deep} strokeWidth={2.8} />
        </View>
        <View style={styles.reviewBody}>
          <Text style={styles.reviewKicker}>ENDLESS REVIEW</Text>
          <Text style={styles.reviewTitle} numberOfLines={1}>
            {unit.track.place}
          </Text>
          <Text style={styles.reviewNote} numberOfLines={1}>
            Keeps going until you stop
          </Text>
        </View>
        <Glyph name="chevron-right" size={20} color={colors.white} strokeWidth={2.8} />
      </Pressable>
    </View>
  );
}

function GateBossCard({
  unit,
  node,
  nextPlace,
  onPress,
}: {
  unit: QuestUnit;
  node: QuestNode;
  nextPlace?: string;
  onPress: () => void;
}) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${node.title}, track boss`}
      onPress={onPress}
      style={styles.bossWrap}
    >
      <View style={styles.bossLip} />
      <View style={styles.bossFace}>
        <BossSprite nodeId={node.id} size={82} />
        <View style={styles.bossBody}>
          <Text style={styles.bossKicker}>TRACK {unit.track.n} BOSS</Text>
          <Text style={styles.bossTitle} numberOfLines={2}>
            {node.title}
          </Text>
          <Text style={styles.bossNote} numberOfLines={1}>
            {nextPlace ? `Clear it to open ${nextPlace}` : 'The last check on the map'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = ({ colors, palette, typography, stroke, card }: AppTheme) => StyleSheet.create({
  head: { paddingTop: PAD_TOP },

  reviewWrap: { position: 'relative', marginHorizontal: 16, marginTop: 16, marginBottom: 6 },
  reviewLip: { position: 'absolute', left: 0, right: 0, top: 6, bottom: -6, borderRadius: 22 },
  reviewFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 78,
    borderWidth: stroke.control,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  reviewIcon: {
    ...card,
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBody: { flex: 1, minWidth: 0 },
  reviewKicker: { fontFamily: fonts.bodyBlack, fontSize: 9, letterSpacing: 1.4, color: 'rgba(255,255,255,0.75)' },
  reviewTitle: { fontFamily: fonts.displayHeavy, fontSize: 17, lineHeight: 19, color: colors.white, marginTop: 1 },
  reviewNote: { fontFamily: fonts.bodySemibold, fontSize: 11.5, color: 'rgba(255,255,255,0.8)' },

  slot: { position: 'absolute', alignItems: 'center' },
  dot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, opacity: 0.65 },
  mascot: { position: 'absolute' },
  mascotArt: { width: 132, height: 132 },

  plaqueWrap: { position: 'relative', paddingHorizontal: 16, paddingBottom: 12 },
  plaque: {
    ...card,
    height: PLAQUE_FACE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  regionArt: { width: 60, height: 48 },
  plaqueBody: { flex: 1, minWidth: 0 },
  place: { fontFamily: fonts.displayHeavy, fontSize: 17, lineHeight: 18, color: colors.ink },
  topic: { fontFamily: fonts.bodyBold, fontSize: 11.5, lineHeight: 15, color: colors.textSecondary, marginTop: 1 },
  stamp: {
    borderWidth: stroke.surface,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stampText: { fontFamily: fonts.bodyBlack, fontSize: 10, lineHeight: 12, letterSpacing: 1.2 },

  pipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PIP_GAP,
    paddingHorizontal: PIP_PAD_X,
    paddingBottom: 16,
  },
  pipRowTight: { flexDirection: 'row', gap: PIP_GAP },
  pip: { width: PIP, height: PIP, borderRadius: PIP / 2, borderWidth: stroke.surface, borderColor: colors.border },
  pipEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.overlaySoft,
    borderWidth: stroke.surface,
    borderColor: colors.overlayStrong,
    borderStyle: 'dashed',
  },

  lockWrap: {
    paddingHorizontal: PIP_PAD_X,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockNote: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.textMuted, marginLeft: 'auto' },

  bossDock: { position: 'absolute', left: 18, right: 18 },
  bossWrap: { position: 'relative' },
  bossLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 7,
    height: 94,
    borderRadius: 30,
    backgroundColor: colors.nightRaised,
  },
  bossFace: {
    height: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#3B2A57',
    borderWidth: stroke.control,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  bossCrest: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: palette.violet,
    borderWidth: stroke.surface,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossBody: { flex: 1, minWidth: 0 },
  bossKicker: { fontFamily: fonts.bodyBlack, fontSize: 10, letterSpacing: 1.6, color: palette.violetLight },
  bossTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: 19,
    lineHeight: 21,
    color: colors.white,
    marginTop: 1,
  },
  bossNote: { fontFamily: fonts.bodySemibold, fontSize: 12, color: '#B8A6D4', marginTop: 2 },
});
