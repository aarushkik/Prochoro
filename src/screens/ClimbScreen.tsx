import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AppButton, ProgressBar } from '@/components/ui';
import { Glyph, type GlyphName } from '@/components/icons';
import { Mascot } from '@/components/Mascot';
import { BossSprite } from '@/components/creatures/BossSprite';
import { GameCard, STAT_ICON } from '@/components/climb/GameCard';
import { AnswerChoice, QuestionCard, QuizFeedbackPanel, type ChoiceState } from '@/components/quiz';
import { climbQuestions } from '@/data';
import { useHaptics } from '@/hooks/useHaptics';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { readBestFloor, saveBestFloor } from '@/lib/climbRecord';
import { useOnboarding } from '@/state/OnboardingContext';
import { useQuest } from '@/state/QuestContext';
import {
  CHARMS, DRAFT_SIZE, FLOORS, REMOVE_COST, REST_MISS_HEAL, STAT_NAME, STATS,
  buy, chooseRoom, climbXp, deal, dealtCard, fight, floorsClimbed, heightLabel, leaveShop, mysteryHealth, newRun,
  removeCard, restAnswer, restHeal, restTrain, shuffleWith, skipReward, statOf, takeCard, takeCharm,
  type Phase, type RoomKind, type Run, type Stat,
} from '@/utils/climb';
import { shuffleQuizChoices } from '@/utils/shuffleQuizChoices';
import type { AnswerOutcome } from '@/utils/questProgress';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Climb'>;

const ROOM: Record<RoomKind, { icon: GlyphName; title: string; detail: string }> = {
  battle: { icon: 'swords', title: 'Battle', detail: 'A rival crew. Win coins and a card.' },
  elite: { icon: 'flag', title: 'Elite', detail: 'Tougher rivals, rarer cards.' },
  rest: { icon: 'heart', title: 'Rest', detail: 'One question, then heal or train.' },
  shop: { icon: 'gem', title: 'Shop', detail: 'Spend coins on cards and charms.' },
  mystery: { icon: 'sparkle', title: 'Mystery', detail: 'A prize, or a trap.' },
  boss: { icon: 'trophy', title: 'Boss', detail: 'The crew that guards the top.' },
};

/** How long a round's result stays up before the next cards are dealt. */
const ROUND_PAUSE = 1500;

export function ClimbScreen() { return <ClimbGame />; }

/**
 * Endless climb: a deck-building card battle. Every new card costs one AP
 * question (right: choose from three; wrong: one is dealt to you). Battles
 * have no questions: pick a stat while the rival's card is face down, and
 * the higher number wins. Visual QA can open it on a prepared run.
 */
export function ClimbGame({ initial, startOpen = false }: { initial?: Run; startOpen?: boolean }) {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const layout = useScreenLayout();
  const columnWidth = Math.min(layout.width, layout.expanded ? 900 : layout.wide ? 760 : 620);
  const column = { maxWidth: columnWidth };
  const haptic = useHaptics();
  const { motionEnabled } = useMotionPreference();
  const { courseId } = useOnboarding();
  const { map, currentNodeId, recordSession } = useQuest();

  // Card sizes come from the screen, so three always fit side by side.
  const offerWidth = Math.floor(Math.min(160, (columnWidth - 32 - 20) / 3));
  // The shop shows four cards a row, or two on a narrow phone.
  const shopPerRow = columnWidth < 380 ? 2 : 4;
  const shopWidth = Math.floor(Math.min(140, (columnWidth - 32 - 10 * (shopPerRow - 1)) / shopPerRow));
  const duelWidth = Math.floor(Math.min(200, (columnWidth - 32 - 20 - 40) / 2));

  const [runId] = useState(() => 'climb-' + Date.now().toString(36));
  const [run, setRun] = useState<Run>(() => initial ?? newRun(runId));
  const [started, setStarted] = useState(startOpen);

  // One stream of questions for the whole climb, reshuffled each time round.
  const reachedArea = map.units.find((unit) => unit.nodes.some((node) => node.id === currentNodeId))?.index ?? map.units.length - 1;
  const pool = useMemo(() => climbQuestions(courseId, reachedArea), [courseId, reachedArea]);
  const [pass, setPass] = useState(0);
  const [cursor, setCursor] = useState(0);
  const deck = useMemo(() => shuffleWith(pool, `${runId}#${pass}`), [pool, runId, pass]);
  const question = useMemo(() => deck.length ? shuffleQuizChoices([deck[cursor % deck.length]], `${runId}:${pass}:${cursor}`)[0] : null, [deck, cursor, pass, runId]);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<AnswerOutcome[]>([]);
  const rightNow = checked && question !== null && picked === question.correctAnswerId;

  /** After an unlock question: choose freely, or take the card you were dealt. */
  const [unlock, setUnlock] = useState<null | 'pick' | 'dealt'>(null);
  const [dealt, setDealt] = useState<string | null>(null);
  const [step, setStep] = useState<'choose' | 'result'>('choose');
  const [holding, setHolding] = useState(false);
  const [training, setTraining] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);
  const banked = useRef(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const view: Phase = holding ? 'battle' : run.phase;

  useEffect(() => { void readBestFloor(courseId).then(setBest); }, [courseId]);

  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const nextQuestion = () => {
    if (cursor + 1 >= deck.length) { setPass((value) => value + 1); setCursor(0); } else setCursor((value) => value + 1);
    setPicked(null);
    setChecked(false);
    setUnlock(null);
    setDealt(null);
    toTop();
  };

  /** Bank the run once: answers count as practice, and the height may be a new best. */
  const bank = (state: Run) => {
    if (banked.current) return;
    banked.current = true;
    const correct = answers.filter((item) => item.correct).length;
    if (answers.length) recordSession(climbXp(state, correct), undefined, answers, runId);
    const climbed = floorsClimbed(state);
    if (climbed === 0) return;
    void saveBestFloor(courseId, climbed).then((value) => { setNewBest(climbed > best && value === climbed); setBest(value); });
  };

  /** The one question behind a card or a rest. */
  const answer = (choiceId: string) => {
    if (!question || checked) return;
    const correct = choiceId === question.correctAnswerId;
    haptic(correct ? 'success' : 'retry');
    setPicked(choiceId);
    setChecked(true);
    setAnswers((previous) => [...previous, { skillTag: question.skillTag, correct }]);
    if (view === 'rest') { if (correct) { setRun((state) => restAnswer(state, true)); nextQuestion(); } }
    else if (correct) { setUnlock('pick'); toTop(); }
    else { setUnlock('dealt'); setDealt(dealtCard(run)); }
    if (!correct) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
  };

  const take = (uid: string) => { haptic(); setRun((state) => takeCard(state, uid)); nextQuestion(); };
  const leave = () => { haptic(); setRun(skipReward); nextQuestion(); };

  /* ---------- battle ---------- */

  // The rival's card turns over once you have picked the stat.
  const flip = useRef(new Animated.Value(1)).current;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (step !== 'result') { setRevealed(false); flip.setValue(1); return; }
    if (!motionEnabled) { setRevealed(true); return; }
    const half = Animated.timing(flip, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true });
    half.start(() => { setRevealed(true); Animated.timing(flip, { toValue: 1, duration: 190, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); });
    return () => half.stop();
  }, [step, motionEnabled, flip]);

  const choose = (stat: Stat) => {
    if (step !== 'choose') return;
    haptic();
    setRun((state) => { const next = fight(state, stat, 'me'); if (next.phase !== 'battle') setHolding(true); return next; });
    setStep('result');
  };
  // Rounds flow on their own: the result stays up briefly, then new cards are dealt.
  useEffect(() => {
    if (step !== 'result' || holding || run.phase !== 'battle') return;
    const timer = setTimeout(() => { setRun((state) => deal(state)); setStep('choose'); }, motionEnabled ? ROUND_PAUSE : ROUND_PAUSE + 600);
    return () => clearTimeout(timer);
  }, [step, holding, run.phase, motionEnabled]);
  const finishBattle = () => {
    setHolding(false);
    setStep('choose');
    if (run.phase === 'over') bank(run);
    toTop();
  };

  const enter = (room: RoomKind) => { haptic(); setRun((state) => chooseRoom(state, room)); setStep('choose'); toTop(); };
  const update = (change: (state: Run) => Run) => { haptic(); setRun(change); setTraining(false); setRemoving(false); toTop(); };

  const restart = () => navigation.replace('Climb');
  usePreventRemove(answers.length > 0 && run.phase !== 'over', ({ data }) => {
    setConfirm(() => () => { bank(run); navigation.dispatch(data.action); });
  });
  const close = () => {
    if (answers.length === 0 || run.phase === 'over') { navigation.goBack(); return; }
    setConfirm(() => () => { bank(run); setHolding(false); setRun((state) => ({ ...state, phase: 'over' })); });
  };

  const choiceState = (id: string): ChoiceState => {
    if (!checked || !question) return 'idle';
    if (id === question.correctAnswerId) return picked === id ? 'correct' : 'missed';
    return id === picked ? 'wrong' : 'idle';
  };

  /* ---------- shared pieces ---------- */

  const status = (
    <View style={styles.status}>
      <View style={styles.statusHp} accessible accessibilityLabel={`${run.hp} of ${run.maxHp} health`}>
        <Glyph name="heart" size={16} filled />
        <View style={styles.flex}><ProgressBar progress={run.hp / run.maxHp} height={7} /></View>
        <Text style={styles.statusText}>{`${run.hp}/${run.maxHp}`}</Text>
      </View>
      <View style={styles.coins} accessible accessibilityLabel={`${run.coins} coins`}><Glyph name="gem" size={18} /><Text style={styles.statusText}>{run.coins}</Text></View>
    </View>
  );

  const questionArea = question ? (
    <>
      <QuestionCard question={question} split={layout.expanded && Boolean(question.stimulus)}>
        <View>{question.choices!.map((choice, i) => (
          <AnswerChoice key={choice.id} index={i} label={choice.text} state={choiceState(choice.id)} disabled={checked} onPress={() => answer(choice.id)} />
        ))}</View>
      </QuestionCard>
      {checked && !rightNow ? <QuizFeedbackPanel correct={false} explanation={question.explanation} answer={question.choices?.find((choice) => choice.id === question.correctAnswerId)?.text} /> : null}
    </>
  ) : null;

  /** The unlock behind every new card: one question, then the cards. */
  const unlockArea = (prompt: string) => {
    if (unlock === 'pick') return <>
      <View style={styles.banner}><Glyph name="check" size={18} /><Text style={styles.bannerText}>Right! Choose one.</Text></View>
      <View style={styles.offer}>{run.offer.map((item) => <GameCard key={item.uid} card={item} width={offerWidth} charms={run.charms} onPress={() => take(item.uid)} />)}</View>
    </>;
    const given = run.offer.find((item) => item.uid === dealt);
    return <>
      <Text style={styles.prompt}>{prompt}</Text>
      {questionArea}
      {unlock === 'dealt' && given ? <>
        <Text style={styles.section}>NOT QUITE. THIS RIVAL JOINS YOU INSTEAD</Text>
        <View style={styles.offer}><GameCard card={given} width={offerWidth + 20} charms={run.charms} /></View>
      </> : null}
    </>;
  };
  const unlockDock = (canLeave: boolean) => unlock === 'pick' ? (canLeave ? <AppButton label="Skip the card" tone="secondary" onPress={leave} /> : null)
    : unlock === 'dealt' && dealt ? <View style={styles.dockRow}>
      {canLeave ? <AppButton label="Leave it" tone="secondary" style={styles.flex} onPress={leave} /> : null}
      <AppButton label="Add to deck" icon="plus" style={styles.flex} onPress={() => take(dealt)} />
    </View>
      : <Text style={styles.hint}>Answer to unlock a card</Text>;

  const page = (body: React.ReactNode, dock: React.ReactNode, title: string, backdrop = run.battle?.enemy.kind ?? 'towers', scrolls = true) => (
    <View style={styles.root}>
      <AreaBackdrop kind={backdrop} opacity={0.12} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={[styles.topBar, column]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={12} style={styles.close}><Glyph name="close" size={24} strokeWidth={2.4} /></Pressable>
          <View style={styles.flex}><Text style={styles.kicker}>ENDLESS CLIMB</Text><Text style={styles.title} numberOfLines={1}>{title}</Text></View>
        </View>
        {scrolls
          ? <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={[styles.scroll, column]} showsVerticalScrollIndicator={false}>{body}</ScrollView>
          : <View style={[styles.flex, styles.scroll, column]}>{body}</View>}
        {dock ? <View style={[styles.dock, column, { paddingBottom: Math.max(insets.bottom, 10) }]}><GlassSurface variant="thick" style={styles.dockGlass}>{dock}</GlassSurface></View> : <View style={{ height: Math.max(insets.bottom, 10) }} />}
      </SafeAreaView>
      <Modal transparent visible={confirm !== null} animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.scrim}><GlassSurface variant="thick" accessibilityViewIsModal style={styles.dialog}>
          <Text style={styles.dialogTitle}>End this climb?</Text>
          <Text style={styles.dialogBody}>Your answers so far still count as practice.</Text>
          <AppButton label="Keep climbing" onPress={() => setConfirm(null)} />
          <AppButton label="End climb" tone="secondary" style={styles.second} onPress={() => { const action = confirm; setConfirm(null); action?.(); }} />
        </GlassSurface></View>
      </Modal>
    </View>
  );

  /* ---------- intro ---------- */

  if (!started) {
    return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <AreaBackdrop kind="towers" opacity={0.14} />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={[styles.topBar, column]}><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => navigation.goBack()} hitSlop={12} style={styles.close}><Glyph name="close" size={24} strokeWidth={2.4} /></Pressable></View>
      <ScrollView contentContainerStyle={[styles.centre, column]}>
        <Mascot pose="levelUp" size={150 * Math.min(layout.scale, 1.2)} />
        <Text style={styles.hero}>Endless climb</Text>
        <Text style={styles.lead}>Build a deck of rivals and battle up the tower. How high can you go?</Text>
        <View style={styles.rules}>
          {([
            ['plus', 'Every new card costs one question. Right: choose from three. Wrong: one is dealt to you.'],
            ['swords', 'Battle card against card. Pick Recall, Logic or Insight before their card flips.'],
            ['bolt', 'The higher number wins. The gap is the damage, and a streak multiplies it.'],
            ['trophy', 'Choose your rooms, rest, shop, and beat the boss on floor 8.'],
          ] as [GlyphName, string][]).map(([icon, text]) => <View key={text} style={styles.rule}><Glyph name={icon} size={20} /><Text style={styles.ruleText}>{text}</Text></View>)}
        </View>
        {best ? <Text style={styles.bestBig}>{'Your best: ' + heightLabel(best)}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, column]}><AppButton label="Start climbing" icon="play" emphasis disabled={!question} onPress={() => setStarted(true)} /></View>
    </SafeAreaView>;
  }

  /* ---------- draft ---------- */

  if (view === 'draft') {
    return page(<>
      <View style={styles.progressHead}>
        <Text style={styles.section}>{`BUILD YOUR DECK · ${run.deck.length} OF ${DRAFT_SIZE}`}</Text>
        <View style={styles.dots}>{Array.from({ length: DRAFT_SIZE }, (_, i) => <View key={i} style={[styles.dot, i < run.deck.length && styles.dotOn]} />)}</View>
      </View>
      {unlockArea('Answer to recruit a rival.')}
      {run.deck.length && unlock !== 'pick' ? <><Text style={styles.section}>YOUR DECK</Text><DeckStrip run={run} /></> : null}
    </>, unlockDock(false), 'Recruit your team');
  }

  /* ---------- map ---------- */

  if (view === 'map') {
    const atTop = run.rooms.includes('boss');
    return page(<>
      {status}
      <View style={styles.tower} accessible accessibilityLabel={`Tower ${run.tower}, floor ${run.floor} of ${FLOORS}`}>
        {Array.from({ length: FLOORS }, (_, i) => {
          const floor = i + 1;
          const done = run.path[i];
          const here = floor === run.floor;
          return <View key={floor} style={[styles.step, done && styles.stepDone, here && styles.stepHere]}>
            {done ? <Glyph name={ROOM[done].icon} size={14} color={colors.background} /> : floor === FLOORS ? <Glyph name="trophy" size={14} /> : <Text style={[styles.stepText, here && styles.stepTextHere]}>{floor}</Text>}
          </View>;
        })}
      </View>
      {best ? <Text style={styles.caption}>{'Your best: ' + heightLabel(best)}</Text> : null}
      <Text style={styles.prompt}>{atTop ? 'The boss is waiting.' : 'Where next?'}</Text>
      <View style={[styles.rooms, layout.wide && styles.roomsWide]}>
        {run.rooms.map((room) => (
          <Pressable key={room} accessibilityRole="button" accessibilityLabel={`${ROOM[room].title}. ${ROOM[room].detail}`} onPress={() => enter(room)} style={({ pressed }) => [styles.room, layout.wide && styles.roomWide, room === 'boss' && styles.roomBoss, pressed && styles.pressed]}>
            <View style={[styles.roomIcon, room === 'boss' && styles.roomIconBoss]}><Glyph name={ROOM[room].icon} size={24} color={room === 'boss' ? colors.background : colors.ink} /></View>
            <View style={styles.flex}><Text style={styles.roomTitle} numberOfLines={1}>{ROOM[room].title}</Text><Text style={styles.roomDetail} numberOfLines={2}>{ROOM[room].detail}</Text></View>
            <Glyph name="chevron-right" size={18} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.section}>{`YOUR DECK · ${run.deck.length}`}</Text>
      <DeckStrip run={run} />
      {run.charms.length ? <><Text style={styles.section}>CHARMS</Text><View style={styles.charms}>{run.charms.map((id) => <View key={id} style={styles.charm}><Text style={styles.charmName}>{CHARMS[id].name}</Text><Text style={styles.charmDetail}>{CHARMS[id].detail}</Text></View>)}</View></> : null}
    </>, null, `Tower ${run.tower} · Floor ${run.floor}`);
  }

  /* ---------- battle ---------- */

  if (view === 'battle' && run.battle) {
    const battle = run.battle;
    const enemy = battle.enemy;
    const outcome = step === 'result' ? battle.outcome : null;
    const shown = outcome && revealed ? outcome.stat : null;
    const result = !outcome || !revealed ? 'Pick a stat. Their card flips after you choose.'
      : outcome.winner === 'tie' ? `${STAT_NAME[outcome.stat]}: ${outcome.mine} ties ${outcome.theirs}. No damage.`
        : outcome.winner === 'me' ? `${STAT_NAME[outcome.stat]}: ${outcome.mine} beats ${outcome.theirs}.${outcome.streak > 1 ? ` ×${outcome.streak} streak!` : ''}`
          : outcome.erased ? `${STAT_NAME[outcome.stat]}: ${outcome.theirs} beats ${outcome.mine}. Your eraser blocks it.`
            : `${STAT_NAME[outcome.stat]}: ${outcome.theirs} beats ${outcome.mine}.${outcome.streak > 1 ? ` Their ×${outcome.streak} streak.` : ''}`;
    const ended = run.phase !== 'battle';
    const label = enemy.room === 'boss' ? 'Boss' : enemy.room === 'elite' ? 'Elite' : 'Battle';
    return page(<>
      <View style={styles.bars}>
        <View style={styles.bar}>
          <View style={styles.barTop}><Text style={styles.barName} numberOfLines={1}>You</Text><Text style={styles.barHp}>{`${run.hp}/${run.maxHp}`}</Text></View>
          <ProgressBar progress={run.hp / run.maxHp} height={8} />
          <Text style={styles.streak} numberOfLines={1}>{battle.myStreak > 1 ? `${battle.myStreak} wins in a row` : ' '}</Text>
        </View>
        <View style={styles.bar}>
          <View style={styles.barTop}><Text style={styles.barName} numberOfLines={1}>{enemy.name}</Text><Text style={styles.barHp}>{`${enemy.hp}/${enemy.maxHp}`}</Text></View>
          <ProgressBar progress={enemy.hp / enemy.maxHp} height={8} />
          <Text style={[styles.streak, styles.right]} numberOfLines={1}>{battle.theirStreak > 1 ? `${battle.theirStreak} wins in a row` : ' '}</Text>
        </View>
      </View>
      <View style={styles.arena}>
      <View style={styles.table}>
        <GameCard card={battle.mine} width={duelWidth} charms={run.charms} highlight={shown} />
        <View style={styles.vs}>
          {enemy.room === 'boss' ? <BossSprite kind={enemy.kind} tier={enemy.tier} size={40} /> : null}
          <Text style={styles.vsText}>VS</Text>
        </View>
        <Animated.View style={{ transform: [{ scaleX: flip }] }}>
          <GameCard card={battle.theirs} width={duelWidth} faceDown={!revealed} highlight={shown} />
        </Animated.View>
      </View>
      <View style={styles.resultBox} accessible accessibilityLiveRegion="polite">
        <Text style={styles.result} numberOfLines={2}>{result}</Text>
        {outcome && revealed && outcome.damage > 0 ? <Text style={styles.damage}>{outcome.winner === 'me' ? `${enemy.name} takes ${outcome.damage}` : `You take ${outcome.damage}`}</Text> : null}
      </View>
      </View>
    </>, ended && step === 'result'
      ? <AppButton label={run.phase === 'over' ? 'See your climb' : 'Collect your reward'} icon={run.phase === 'over' ? undefined : 'chest'} onPress={finishBattle} />
      : <View style={styles.statRow}>{STATS.map((stat) => (
        <Pressable key={stat} accessibilityRole="button" disabled={step !== 'choose'} accessibilityLabel={`Battle with ${STAT_NAME[stat]}, ${statOf(battle.mine, stat, run.charms)}`} onPress={() => choose(stat)}
          style={({ pressed }) => [styles.statButton, step !== 'choose' && styles.off, pressed && styles.pressed]}>
          <Glyph name={STAT_ICON[stat]} size={20} />
          <Text style={styles.statName} numberOfLines={1}>{STAT_NAME[stat]}</Text>
          <Text style={styles.statValue}>{statOf(battle.mine, stat, run.charms)}</Text>
        </Pressable>
      ))}</View>,
    `${label} · Floor ${run.floor}`, enemy.kind, false);
  }

  /* ---------- reward ---------- */

  if (view === 'reward' && run.battle) {
    const enemy = run.battle.enemy;
    return page(<>
      <View style={styles.centreBlock}>
        <View style={styles.winArt}><Mascot pose="bossWin" size={96} /><View style={styles.downed}><BossSprite kind={enemy.kind} tier={enemy.tier} size={76} dim /></View></View>
        <Text style={styles.heroSmall} numberOfLines={2}>{`${enemy.name}’s crew is beaten`}</Text>
        <Text style={styles.lead}>{`+${run.earned} coins${run.charms.includes('flashcards') ? ' · flashcards healed you' : ''}`}</Text>
      </View>
      {run.charmOffer.length ? <>
        <Text style={styles.section}>CHOOSE A CHARM</Text>
        <View style={styles.charms}>{run.charmOffer.map((id) => (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${CHARMS[id].name}. ${CHARMS[id].detail}`} onPress={() => update((state) => takeCharm(state, id))} style={({ pressed }) => [styles.charm, styles.charmPick, pressed && styles.pressed]}>
            <Text style={styles.charmName}>{CHARMS[id].name}</Text><Text style={styles.charmDetail}>{CHARMS[id].detail}</Text>
          </Pressable>
        ))}</View>
      </> : unlockArea('Answer to unlock a new card.')}
    </>, run.charmOffer.length ? <AppButton label="Skip the charm" tone="secondary" onPress={() => update(skipReward)} /> : unlockDock(true), 'Victory');
  }

  /* ---------- rest ---------- */

  if (view === 'rest') {
    const asking = run.restLeft > 0;
    return page(asking ? <>
      <Text style={styles.prompt}>Answer one question to rest.</Text>
      {questionArea}
    </> : <>
      <View style={styles.centreBlock}><Mascot pose="meditate" size={120} /><Text style={styles.heroSmall}>Rested</Text><Text style={styles.lead}>Heal up, or make one card stronger.</Text></View>
      {status}
      {training ? <>
        <Text style={styles.section}>TRAIN A CARD · +2 TO EVERY STAT</Text>
        <View style={styles.offer}>{run.deck.map((item) => <GameCard key={item.uid} card={item} width={offerWidth} charms={run.charms} onPress={() => update((state) => restTrain(state, item.uid))} />)}</View>
      </> : <View style={styles.rooms}>
        <Pressable accessibilityRole="button" onPress={() => update(restHeal)} style={({ pressed }) => [styles.room, pressed && styles.pressed]}><View style={styles.roomIcon}><Glyph name="heart" size={24} /></View><View style={styles.flex}><Text style={styles.roomTitle}>Heal</Text><Text style={styles.roomDetail}>Get 25 health back</Text></View></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setTraining(true)} style={({ pressed }) => [styles.room, pressed && styles.pressed]}><View style={styles.roomIcon}><Glyph name="bolt" size={24} /></View><View style={styles.flex}><Text style={styles.roomTitle}>Train</Text><Text style={styles.roomDetail}>+2 to every stat on one card</Text></View></Pressable>
      </View>}
    </>, asking ? (checked ? <AppButton label={`Rest anyway (+${REST_MISS_HEAL} health)`} icon="heart" onPress={() => { setRun((state) => restAnswer(state, false)); nextQuestion(); }} /> : <Text style={styles.hint}>Right: heal or train. Wrong: a short rest.</Text>) : null, 'Rest stop');
  }

  /* ---------- shop ---------- */

  if (view === 'shop') {
    return page(<>
      {status}
      <Text style={styles.section}>CARDS</Text>
      <View style={styles.offer}>{run.shop.map((item, index) => item.kind === 'card' && item.card ? (
        <View key={index} style={styles.ware}>
          <GameCard card={item.card} width={shopWidth} dim={item.sold || run.coins < item.price} onPress={item.sold || run.coins < item.price ? undefined : () => update((state) => buy(state, index))} />
          <Text style={styles.price}>{item.sold ? 'Sold' : `${item.price}`}</Text>
        </View>
      ) : null)}</View>
      <Text style={styles.section}>SUPPLIES</Text>
      <View style={styles.rooms}>
        {run.shop.map((item, index) => item.kind === 'card' ? null : (
          <Pressable key={index} accessibilityRole="button" disabled={item.sold || run.coins < item.price} onPress={() => update((state) => buy(state, index))} style={({ pressed }) => [styles.room, (item.sold || run.coins < item.price) && styles.off, pressed && styles.pressed]}>
            <View style={styles.roomIcon}><Glyph name={item.kind === 'heal' ? 'heart' : 'sparkle'} size={22} /></View>
            <View style={styles.flex}><Text style={styles.roomTitle} numberOfLines={1}>{item.kind === 'heal' ? 'First aid' : CHARMS[item.charm!].name}</Text><Text style={styles.roomDetail} numberOfLines={2}>{item.kind === 'heal' ? 'Get 25 health back' : CHARMS[item.charm!].detail}</Text></View>
            <Text style={styles.price}>{item.sold ? 'Sold' : `${item.price}`}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" disabled={run.coins < REMOVE_COST || run.deck.length <= 1} onPress={() => setRemoving((value) => !value)} style={({ pressed }) => [styles.room, (run.coins < REMOVE_COST || run.deck.length <= 1) && styles.off, pressed && styles.pressed]}>
          <View style={styles.roomIcon}><Glyph name="close" size={20} /></View>
          <View style={styles.flex}><Text style={styles.roomTitle}>Remove a card</Text><Text style={styles.roomDetail} numberOfLines={2}>So your best cards come up more</Text></View>
          <Text style={styles.price}>{REMOVE_COST}</Text>
        </Pressable>
      </View>
      {removing ? <><Text style={styles.section}>TAP A CARD TO REMOVE IT</Text><DeckStrip run={run} onPick={(uid) => update((state) => removeCard(state, uid))} /></> : null}
    </>, <AppButton label="Leave the shop" onPress={() => update(leaveShop)} />, 'Shop');
  }

  /* ---------- mystery ---------- */

  if (view === 'mystery') {
    const good = run.mystery === 'good';
    const found = run.offer[0];
    return page(<>
      <View style={styles.centreBlock}><Mascot pose={good ? 'excited' : 'surprised'} size={120} /><Text style={styles.heroSmall}>{good ? 'A lucky find!' : 'A trap!'}</Text><Text style={styles.lead}>{good ? 'Take this strong card, or heal 15.' : 'Lose 10 health, or take this weak card.'}</Text></View>
      {status}
      <View style={styles.offer}>{found ? <GameCard card={found} width={offerWidth + 20} /> : null}</View>
    </>, <View style={styles.dockRow}>
      <AppButton label={good ? 'Heal 15' : 'Lose 10 HP'} tone="secondary" style={styles.flex} onPress={() => update(mysteryHealth)} />
      {found ? <AppButton label="Take card" style={styles.flex} onPress={() => update((state) => takeCard(state, found.uid))} /> : null}
    </View>, 'Mystery');
  }

  /* ---------- over ---------- */

  const correct = answers.filter((item) => item.correct).length;
  const climbed = floorsClimbed(run);
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <AreaBackdrop kind={run.battle?.enemy.kind ?? 'towers'} opacity={0.14} />
    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={[styles.centre, column]}>
      <Mascot pose={newBest ? 'trophy' : climbed > 0 ? 'proud' : 'reading'} size={150} />
      <Text style={styles.kicker}>{newBest ? 'NEW BEST' : 'CLIMB OVER'}</Text>
      <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>{heightLabel(climbed)}</Text>
      <Text style={styles.lead}>{newBest ? 'Your highest climb yet.' : best ? `Your best is ${heightLabel(best)}.` : 'Every climb makes the next one easier.'}</Text>
      <View style={styles.summary}>
        <Stat value={climbed} label={climbed === 1 ? 'floor climbed' : 'floors climbed'} />
        <Stat value={run.record.battles} label={run.record.battles === 1 ? 'battle won' : 'battles won'} />
        <Stat value={correct} label="right answers" />
        <Stat value={answers.length ? climbXp(run, correct) : 0} label="XP" />
      </View>
    </ScrollView>
    <View style={[styles.footer, column]}>
      <AppButton label="Climb again" icon="play" emphasis onPress={restart} />
      <AppButton label="Done" tone="secondary" style={styles.second} onPress={() => navigation.goBack()} />
    </View>
  </SafeAreaView>;
}

/** Your deck, small and side by side; tappable when `onPick` is given. */
function DeckStrip({ run, onPick }: { run: Run; onPick?: (uid: string) => void }) {
  const styles = useThemedStyles(createStyles);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
    {run.deck.map((item) => <GameCard key={item.uid} card={item} width={92} charms={run.charms} onPress={onPick ? () => onPick(item.uid) : undefined} />)}
  </ScrollView>;
}

function Stat({ value, label }: { value: number; label: string }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.stat}><Text style={styles.statBig}>{value}</Text><Text style={styles.statLabel} numberOfLines={1}>{label}</Text></View>;
}

const createStyles = ({ colors, typography, card, glass }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  right: { textAlign: 'right' },
  pressed: { opacity: 0.7 },
  off: { opacity: 0.45 },
  topBar: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 4, minHeight: 50 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  kicker: { ...typography.overline, fontSize: 10, lineHeight: 13 },
  title: { ...typography.subtitle, fontSize: 18, lineHeight: 23 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, width: '100%', alignSelf: 'center', gap: 14 },
  dock: { paddingHorizontal: 16, paddingTop: 8, width: '100%', alignSelf: 'center' },
  dockGlass: { padding: 10, borderRadius: 30 },
  dockRow: { flexDirection: 'row', gap: 10 },
  hint: { ...typography.label, fontSize: 13, lineHeight: 18, textAlign: 'center', paddingVertical: 14, color: colors.textSecondary },
  centre: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, width: '100%', alignSelf: 'center', gap: 8 },
  centreBlock: { alignItems: 'center', gap: 6 },
  hero: { ...typography.title, fontSize: 28, lineHeight: 34, textAlign: 'center', marginTop: 6 },
  heroSmall: { ...typography.title, fontSize: 23, lineHeight: 29, textAlign: 'center' },
  lead: { ...typography.body, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 400 },
  big: { ...typography.display, fontSize: 34, lineHeight: 41, textAlign: 'center', alignSelf: 'stretch' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 16, marginTop: -6 },
  rules: { alignSelf: 'stretch', gap: 14, marginTop: 14, ...card, borderRadius: 24, padding: 18 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleText: { ...typography.bodyStrong, fontSize: 14, lineHeight: 20, flex: 1 },
  bestBig: { ...typography.label, fontSize: 14, lineHeight: 19, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, width: '100%', alignSelf: 'center' },
  second: { marginTop: 10 },
  section: { ...typography.overline, fontSize: 10.5, lineHeight: 14 },
  prompt: { ...typography.subtitle, fontSize: 18, lineHeight: 24 },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink },
  dotOn: { backgroundColor: colors.ink },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', borderRadius: 18, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8 },
  bannerText: { ...typography.subtitle, fontSize: 16, lineHeight: 21 },
  offer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  strip: { gap: 8, paddingVertical: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusHp: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { ...typography.numeral, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tower: { flexDirection: 'row', gap: 5 },
  step: { flex: 1, height: 34, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  stepHere: { borderColor: colors.ink, borderWidth: 2.5 },
  stepText: { ...typography.label, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  stepTextHere: { color: colors.ink },
  rooms: { gap: 10 },
  roomsWide: { flexDirection: 'row', flexWrap: 'wrap' },
  room: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12 },
  roomWide: { flexBasis: '31%', flexGrow: 1 },
  roomBoss: { backgroundColor: colors.surfaceSelected },
  roomIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  roomIconBoss: { backgroundColor: colors.ink, borderColor: colors.ink },
  roomTitle: { ...typography.subtitle, fontSize: 16, lineHeight: 21 },
  roomDetail: { ...typography.caption, fontSize: 12.5, lineHeight: 17 },
  charms: { gap: 8 },
  charm: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  charmPick: { borderWidth: 2, borderColor: colors.ink },
  charmName: { ...typography.subtitle, fontSize: 15, lineHeight: 20 },
  charmDetail: { ...typography.caption, fontSize: 12, lineHeight: 16 },
  bars: { flexDirection: 'row', gap: 18 },
  bar: { flex: 1, gap: 5 },
  barTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 },
  barName: { ...typography.label, fontSize: 13, lineHeight: 17, flexShrink: 1 },
  barHp: { ...typography.numeral, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  streak: { ...typography.caption, fontSize: 11, lineHeight: 14 },
  arena: { flex: 1, justifyContent: 'center', gap: 14, paddingBottom: 12 },
  table: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  vs: { alignItems: 'center', width: 40, gap: 4 },
  vsText: { ...typography.overline, fontSize: 13, lineHeight: 16, letterSpacing: 1.5 },
  resultBox: { minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  result: { ...typography.label, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  damage: { ...typography.numeral, fontSize: 18, lineHeight: 23, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 8 },
  statButton: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2, borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingVertical: 10 },
  statName: { ...typography.label, fontSize: 12.5, lineHeight: 16 },
  statValue: { ...typography.numeral, fontSize: 24, lineHeight: 29 },
  ware: { alignItems: 'center', gap: 4 },
  price: { ...typography.label, fontSize: 12.5, lineHeight: 17 },
  winArt: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  downed: { transform: [{ rotate: '-12deg' }], opacity: 0.6 },
  summary: { ...card, alignSelf: 'stretch', borderRadius: 24, flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8, marginTop: 12 },
  stat: { width: '50%', alignItems: 'center', paddingVertical: 8, gap: 2 },
  statBig: { ...typography.numeral, fontSize: 22, lineHeight: 27 },
  statLabel: { ...typography.caption, fontSize: 12, lineHeight: 16 },
  scrim: { flex: 1, backgroundColor: glass.scrim, padding: 24, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 400, borderRadius: 34, padding: 24, gap: 6 },
  dialogTitle: { ...typography.title },
  dialogBody: { ...typography.body, marginTop: 6, marginBottom: 14 },
});
