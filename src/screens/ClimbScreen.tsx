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
import { useCountdown, useScreenReader } from '@/hooks/useCountdown';
import { useHaptics } from '@/hooks/useHaptics';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { readBestFloor, saveBestFloor } from '@/lib/climbRecord';
import { useOnboarding } from '@/state/OnboardingContext';
import { useQuest } from '@/state/QuestContext';
import { secondsFor } from '@/utils/battleClock';
import {
  CHARMS, DRAFT_SIZE, FLOORS, REMOVE_COST, STAT_NAME, STATS,
  bestStat, buy, chooseRoom, climbXp, deal, fight, floorsClimbed, heightLabel, leaveShop, mysteryHealth, newRun,
  removeCard, restAnswer, restHeal, restTrain, shuffleWith, skipReward, statOf, takeCard, takeCharm,
  type Phase, type RoomKind, type Run, type Stat,
} from '@/utils/climb';
import { shuffleQuizChoices } from '@/utils/shuffleQuizChoices';
import type { AnswerOutcome } from '@/utils/questProgress';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Climb'>;

const ROOM: Record<RoomKind, { icon: GlyphName; title: string; detail: string }> = {
  battle: { icon: 'swords', title: 'Battle', detail: 'A rival crew. Coins and a new card.' },
  elite: { icon: 'flag', title: 'Elite', detail: 'Tougher rivals, rarer cards.' },
  rest: { icon: 'heart', title: 'Rest', detail: 'Answer 3, then heal or train a card.' },
  shop: { icon: 'gem', title: 'Shop', detail: 'Spend coins on cards and charms.' },
  mystery: { icon: 'sparkle', title: 'Mystery', detail: 'Could be a prize, could be a trap.' },
  boss: { icon: 'trophy', title: 'Boss', detail: 'The crew that guards the top.' },
};

/**
 * Endless climb: a deck-building card battle you play by answering AP
 * questions. Recruit rivals, climb towers room by room, and battle card
 * against card: a right answer lets you choose the stat, a wrong one lets the
 * rival choose. Every answer counts as practice.
 */
export function ClimbScreen() { return <ClimbGame />; }

/** The game itself. Visual QA can open it on a prepared run, already started. */
export function ClimbGame({ initial, startOpen = false }: { initial?: Run; startOpen?: boolean }) {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const layout = useScreenLayout();
  const column = { maxWidth: layout.expanded ? 900 : layout.wide ? 760 : 620 };
  const haptic = useHaptics();
  const relaxed = useScreenReader();
  const { motionEnabled } = useMotionPreference();
  const { courseId } = useOnboarding();
  const { map, currentNodeId, recordSession } = useQuest();

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

  // Screen-level steps the run itself does not need to know about.
  const [unlocked, setUnlocked] = useState(false);
  const [step, setStep] = useState<'question' | 'choose' | 'result'>('question');
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

  const seconds = question ? secondsFor(question, relaxed) : 30;
  const live = started && view === 'battle' && step === 'question' && !checked && confirm === null;
  const clock = useCountdown(seconds, live, `${run.battle?.round ?? 0}:${pass}:${cursor}`, () => answer(null));

  // The rival's card turns over after a right answer (so you can pick the stat
  // that beats it) or once a wrong answer lets the rival choose.
  const flip = useRef(new Animated.Value(1)).current;
  const [revealed, setRevealed] = useState(false);
  const faceUp = step !== 'question';
  useEffect(() => {
    if (!faceUp) { setRevealed(false); flip.setValue(1); return; }
    if (revealed) return;
    if (!motionEnabled) { setRevealed(true); return; }
    flip.setValue(1);
    const half = Animated.timing(flip, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true });
    half.start(() => { setRevealed(true); Animated.timing(flip, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); });
    return () => half.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceUp, motionEnabled, flip]);

  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const nextQuestion = () => {
    if (cursor + 1 >= deck.length) { setPass((value) => value + 1); setCursor(0); } else setCursor((value) => value + 1);
    setPicked(null);
    setChecked(false);
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

  /** Hold the battle on screen when a round ends it, so the last blow is seen. */
  const settle = (state: Run): Run => { if (state.phase !== 'battle') setHolding(true); return state; };

  /** Answer the current question; in a battle the answer decides who picks the stat. */
  const answer = (choiceId: string | null) => {
    if (!question || checked) return;
    const correct = choiceId !== null && choiceId === question.correctAnswerId;
    haptic(correct ? 'success' : 'retry');
    setPicked(choiceId);
    setChecked(true);
    setAnswers((previous) => [...previous, { skillTag: question.skillTag, correct }]);
    if (view === 'rest') setRun((state) => restAnswer(state, correct));
    if (view === 'battle' && run.battle) {
      if (correct) setStep('choose');
      else { setRun((state) => settle(fight(state, bestStat(state.battle!.theirs), 'them'))); setStep('result'); }
    }
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
  };

  const choose = (stat: Stat) => {
    haptic();
    setRun((state) => settle(fight(state, stat, 'me')));
    setStep('result');
  };

  const nextRound = () => {
    setStep('question');
    nextQuestion();
    if (holding) {
      setHolding(false);
      if (run.phase === 'over') bank(run);
      return;
    }
    setRun((state) => deal(state));
  };

  const enter = (room: RoomKind) => { haptic(); setRun((state) => chooseRoom(state, room)); setStep('question'); toTop(); };
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

  /* ---------- pieces ---------- */

  const status = (
    <View style={styles.status}>
      <View style={styles.statusHp} accessible accessibilityLabel={`${run.hp} of ${run.maxHp} health`}>
        <Glyph name="heart" size={15} filled />
        <View style={styles.flex}><ProgressBar progress={run.hp / run.maxHp} height={6} /></View>
        <Text style={styles.statusText}>{run.hp}</Text>
      </View>
      <View style={styles.coins} accessible accessibilityLabel={`${run.coins} coins`}><Glyph name="gem" size={18} /><Text style={styles.statusText}>{run.coins}</Text></View>
    </View>
  );

  const topBar = (title: string) => (
    <View style={[styles.topBar, column]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={12} style={styles.close}><Glyph name="close" size={24} strokeWidth={2.4} /></Pressable>
      <View style={styles.flex}><Text style={styles.kickerLeft}>ENDLESS CLIMB</Text><Text style={styles.title} numberOfLines={1}>{title}</Text></View>
      {best ? <Text style={styles.best} numberOfLines={1}>{'Best: ' + heightLabel(best)}</Text> : null}
    </View>
  );

  const questionArea = question ? (
    <>
      <QuestionCard question={question} split={layout.expanded && Boolean(question.stimulus)}>
        <View>{question.choices!.map((choice, i) => (
          <AnswerChoice key={choice.id} index={i} label={choice.text} state={choiceState(choice.id)} disabled={checked} onPress={() => answer(choice.id)} />
        ))}</View>
      </QuestionCard>
      {checked ? <QuizFeedbackPanel correct={rightNow} explanation={question.explanation} answer={question.choices?.find((choice) => choice.id === question.correctAnswerId)?.text} /> : null}
    </>
  ) : null;

  const page = (body: React.ReactNode, dock: React.ReactNode, title: string, backdrop = run.battle?.enemy.kind ?? 'towers', fixed: React.ReactNode = null) => (
    <View style={styles.root}>
      <AreaBackdrop kind={backdrop} opacity={0.13} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        {topBar(title)}
        {fixed ? <View style={[styles.fixed, column]}>{fixed}</View> : null}
        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={[styles.scroll, column]} showsVerticalScrollIndicator={false}>{body}</ScrollView>
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
        <Mascot pose="levelUp" size={160 * Math.min(layout.scale, 1.2)} />
        <Text style={styles.hero}>Endless climb</Text>
        <Text style={styles.lead}>A card battle you win by knowing your AP material. How high can you climb?</Text>
        <View style={styles.rules}>
          {([
            ['plus', 'Recruit rivals. Each right answer adds a card to your deck.'],
            ['swords', 'Battle card against card. Answer right and their card flips, so you pick the stat that beats it. Miss, and the rival picks.'],
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
      <View style={styles.draftHead}>
        <Text style={styles.section}>{`BUILD YOUR DECK · ${run.deck.length} / ${DRAFT_SIZE}`}</Text>
        <View style={styles.deckDots}>{Array.from({ length: DRAFT_SIZE }, (_, i) => <View key={i} style={[styles.dot, i < run.deck.length && styles.dotOn]} />)}</View>
      </View>
      {unlocked ? <>
        <Text style={styles.prompt}>Choose a rival to recruit.</Text>
        <View style={styles.offer}>{run.offer.map((card) => <GameCard key={card.uid} card={card} onPress={() => { haptic(); setRun((state) => takeCard(state, card.uid)); setUnlocked(false); nextQuestion(); }} />)}</View>
        {run.deck.length ? <><Text style={styles.section}>YOUR DECK</Text><DeckStrip run={run} /></> : null}
      </> : <>
        <Text style={styles.prompt}>Answer right to recruit a rival.</Text>
        {questionArea}
      </>}
    </>, unlocked ? null : checked
      ? <AppButton label={rightNow ? 'Choose your recruit' : 'Next question'} icon={rightNow ? 'plus' : undefined} onPress={() => { if (rightNow) { setUnlocked(true); setPicked(null); setChecked(false); toTop(); } else nextQuestion(); }} />
      : <Text style={styles.hint}>Tap an answer</Text>, 'Recruit your team');
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
      <Text style={styles.prompt}>{atTop ? 'The boss is waiting.' : 'Where next?'}</Text>
      <View style={[styles.rooms, layout.wide && styles.roomsWide]}>
        {run.rooms.map((room) => (
          <Pressable key={room} accessibilityRole="button" accessibilityLabel={`${ROOM[room].title}. ${ROOM[room].detail}`} onPress={() => enter(room)} style={({ pressed }) => [styles.room, layout.wide && styles.roomWide, room === 'boss' && styles.roomBoss, pressed && styles.pressed]}>
            <View style={[styles.roomIcon, room === 'boss' && styles.roomIconBoss]}><Glyph name={ROOM[room].icon} size={26} color={room === 'boss' ? colors.background : colors.ink} /></View>
            <View style={styles.flex}><Text style={styles.roomTitle}>{ROOM[room].title}</Text><Text style={styles.roomDetail}>{ROOM[room].detail}</Text></View>
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
    const shown = outcome?.stat ?? null;
    const result = outcome
      ? outcome.winner === 'tie' ? `${STAT_NAME[outcome.stat]} ${outcome.mine} ties ${outcome.theirs}. No damage.`
        : outcome.winner === 'me' ? `Your ${STAT_NAME[outcome.stat]} ${outcome.mine} beats ${outcome.theirs}: ${outcome.mine - outcome.theirs}${outcome.streak > 1 ? ` × ${outcome.streak} streak` : ''} = ${outcome.damage} damage.`
          : outcome.erased ? `Their ${STAT_NAME[outcome.stat]} ${outcome.theirs} beats ${outcome.mine}, but your eraser takes it.`
            : `${outcome.chosenBy === 'them' ? `${enemy.name} picks ${STAT_NAME[outcome.stat]}. ` : ''}Their ${outcome.theirs} beats your ${outcome.mine}: ${outcome.mine === outcome.theirs ? 0 : outcome.theirs - outcome.mine}${outcome.streak > 1 ? ` × ${outcome.streak} streak` : ''} = ${outcome.damage} damage to you.`
      : step === 'choose' ? 'Right! Their card is face up. Pick the stat that beats it.' : 'Answer right to see their card and pick the stat. Miss, and the rival picks.';
    const ended = run.phase !== 'battle';
    const cardSize = layout.wide ? 'md' : 'sm';
    // The duel stays pinned above the question, so the cards, the stat and the
    // damage are always in view while the question scrolls underneath.
    const duel = (
      <GlassSurface style={styles.duel}>
        <View style={styles.bars}>
          <View style={styles.bar}><Text style={styles.barName} numberOfLines={1}>{'You' + (battle.myStreak > 1 ? ` · ${battle.myStreak} in a row` : '')}</Text><ProgressBar progress={run.hp / run.maxHp} height={6} /><Text style={styles.barHp}>{`${run.hp} / ${run.maxHp}`}</Text></View>
          <View style={styles.bar}><Text style={[styles.barName, styles.right]} numberOfLines={1}>{`${enemy.name}’s crew` + (battle.theirStreak > 1 ? ` · ${battle.theirStreak} in a row` : '')}</Text><ProgressBar progress={enemy.hp / enemy.maxHp} height={6} /><Text style={[styles.barHp, styles.right]}>{`${enemy.hp} / ${enemy.maxHp}`}</Text></View>
        </View>
        <View style={styles.table}>
          <GameCard card={battle.mine} size={cardSize} charms={run.charms} highlight={shown} />
          <View style={styles.vs}>
            {enemy.room === 'boss' ? <BossSprite kind={enemy.kind} tier={enemy.tier} size={44} /> : null}
            <Text style={styles.vsText}>VS</Text>
            {outcome && outcome.damage > 0 ? <Text style={styles.damage}>{(outcome.winner === 'me' ? '→ −' : '← −') + outcome.damage}</Text> : null}
          </View>
          <Animated.View style={{ transform: [{ scaleX: flip }] }}>
            <GameCard card={battle.theirs} size={cardSize} faceDown={!revealed} highlight={revealed ? shown : null} />
          </Animated.View>
        </View>
        <Text style={styles.result} accessibilityLiveRegion="polite">{result}</Text>
        {step === 'question' && !checked ? <View style={styles.clock}><View style={styles.clockTrack}><Animated.View style={[styles.clockFill, { transform: [{ scaleX: clock.progress }] }]} /></View><Text style={styles.clockText}>{clock.left}s</Text></View> : null}
      </GlassSurface>
    );
    const stats = (
      <View style={styles.statRow}>{STATS.map((stat) => (
        <Pressable key={stat} accessibilityRole="button" accessibilityLabel={`Battle with ${STAT_NAME[stat]}: your ${statOf(battle.mine, stat, run.charms)} against their ${battle.theirs[stat]}`} onPress={() => choose(stat)} style={({ pressed }) => [styles.statButton, statOf(battle.mine, stat, run.charms) > battle.theirs[stat] && styles.statAhead, pressed && styles.pressed]}>
          <Glyph name={STAT_ICON[stat]} size={20} />
          <Text style={styles.statName}>{STAT_NAME[stat]}</Text>
          <Text style={styles.statValue}>{statOf(battle.mine, stat, run.charms)}</Text>
          <Text style={styles.statVs}>{'vs ' + battle.theirs[stat]}</Text>
        </Pressable>
      ))}</View>
    );
    return page(questionArea, step === 'question' ? <Text style={styles.hint}>Tap an answer to battle</Text>
      : step === 'choose' ? stats
        : <AppButton label={ended ? run.phase === 'over' ? 'See your climb' : 'Collect your reward' : 'Next round'} icon={ended ? undefined : 'swords'} onPress={nextRound} />,
    `${enemy.room === 'boss' ? 'Boss' : enemy.room === 'elite' ? 'Elite' : 'Battle'} · Floor ${run.floor}`, enemy.kind, duel);
  }

  /* ---------- reward ---------- */

  if (view === 'reward' && run.battle) {
    const enemy = run.battle.enemy;
    return page(<>
      <View style={styles.centreBlock}>
        <View style={styles.winArt}><Mascot pose="bossWin" size={112} /><View style={styles.downed}><BossSprite kind={enemy.kind} tier={enemy.tier} size={88} dim /></View></View>
        <Text style={styles.hero}>{`${enemy.name}’s crew is beaten`}</Text>
        <Text style={styles.lead}>{`+${run.earned} coins${run.charms.includes('flashcards') ? ' · your flashcards healed you' : ''}`}</Text>
      </View>
      {status}
      {run.charmOffer.length ? <>
        <Text style={styles.section}>CHOOSE A CHARM</Text>
        <View style={styles.charms}>{run.charmOffer.map((id) => (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${CHARMS[id].name}. ${CHARMS[id].detail}`} onPress={() => update((state) => takeCharm(state, id))} style={({ pressed }) => [styles.charm, styles.charmPick, pressed && styles.pressed]}>
            <Text style={styles.charmName}>{CHARMS[id].name}</Text><Text style={styles.charmDetail}>{CHARMS[id].detail}</Text>
          </Pressable>
        ))}</View>
      </> : <>
        <Text style={styles.section}>ADD A CARD TO YOUR DECK</Text>
        <View style={styles.offer}>{run.offer.map((card) => <GameCard key={card.uid} card={card} onPress={() => update((state) => takeCard(state, card.uid))} />)}</View>
      </>}
    </>, <AppButton label={run.charmOffer.length ? 'Skip the charm' : 'Skip the card'} tone="secondary" onPress={() => update(skipReward)} />, 'Victory');
  }

  /* ---------- rest ---------- */

  if (view === 'rest') {
    const done = 3 - run.restLeft;
    // The last answer's explanation stays up until you move on.
    const resting = run.restLeft > 0 || checked;
    return page(resting ? <>
      <View style={styles.draftHead}><Text style={styles.section}>{`REST STOP · ${done} / 3 RIGHT`}</Text><View style={styles.deckDots}>{[0, 1, 2].map((i) => <View key={i} style={[styles.dot, i < done && styles.dotOn]} />)}</View></View>
      <Text style={styles.prompt}>Answer three right to recover.</Text>
      {questionArea}
    </> : <>
      <View style={styles.centreBlock}><Mascot pose="meditate" size={130} /><Text style={styles.hero}>Rested</Text><Text style={styles.lead}>Heal up, or make one card stronger.</Text></View>
      {status}
      {training ? <>
        <Text style={styles.section}>TRAIN A CARD · +2 TO EVERY STAT</Text>
        <View style={styles.offer}>{run.deck.map((card) => <GameCard key={card.uid} card={card} size="sm" charms={run.charms} onPress={() => update((state) => restTrain(state, card.uid))} />)}</View>
      </> : <View style={styles.rooms}>
        <Pressable accessibilityRole="button" onPress={() => update(restHeal)} style={({ pressed }) => [styles.room, pressed && styles.pressed]}><View style={styles.roomIcon}><Glyph name="heart" size={26} /></View><View style={styles.flex}><Text style={styles.roomTitle}>Heal</Text><Text style={styles.roomDetail}>Get 25 health back</Text></View></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setTraining(true)} style={({ pressed }) => [styles.room, pressed && styles.pressed]}><View style={styles.roomIcon}><Glyph name="bolt" size={26} /></View><View style={styles.flex}><Text style={styles.roomTitle}>Train</Text><Text style={styles.roomDetail}>+2 Recall, Logic and Insight on one card</Text></View></Pressable>
      </View>}
    </>, resting ? (checked ? <AppButton label={run.restLeft > 0 ? 'Next question' : 'Rest'} icon={run.restLeft > 0 ? undefined : 'heart'} onPress={nextQuestion} /> : <Text style={styles.hint}>Tap an answer</Text>) : null, 'Rest stop');
  }

  /* ---------- shop ---------- */

  if (view === 'shop') {
    return page(<>
      {status}
      <Text style={styles.section}>CARDS</Text>
      <View style={styles.offer}>{run.shop.map((item, index) => item.kind === 'card' && item.card ? (
        <View key={index} style={styles.ware}>
          <GameCard card={item.card} size="sm" dim={item.sold || run.coins < item.price} onPress={item.sold || run.coins < item.price ? undefined : () => update((state) => buy(state, index))} />
          <Text style={styles.price}>{item.sold ? 'Sold' : `${item.price} coins`}</Text>
        </View>
      ) : null)}</View>
      <Text style={styles.section}>SUPPLIES</Text>
      <View style={styles.rooms}>
        {run.shop.map((item, index) => item.kind === 'card' ? null : (
          <Pressable key={index} accessibilityRole="button" disabled={item.sold || run.coins < item.price} onPress={() => update((state) => buy(state, index))} style={({ pressed }) => [styles.room, (item.sold || run.coins < item.price) && styles.off, pressed && styles.pressed]}>
            <View style={styles.roomIcon}><Glyph name={item.kind === 'heal' ? 'heart' : 'sparkle'} size={24} /></View>
            <View style={styles.flex}><Text style={styles.roomTitle}>{item.kind === 'heal' ? 'First aid' : CHARMS[item.charm!].name}</Text><Text style={styles.roomDetail}>{item.kind === 'heal' ? 'Get 25 health back' : CHARMS[item.charm!].detail}</Text></View>
            <Text style={styles.price}>{item.sold ? 'Sold' : `${item.price}`}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" disabled={run.coins < REMOVE_COST || run.deck.length <= 1} onPress={() => setRemoving((value) => !value)} style={({ pressed }) => [styles.room, (run.coins < REMOVE_COST || run.deck.length <= 1) && styles.off, pressed && styles.pressed]}>
          <View style={styles.roomIcon}><Glyph name="close" size={22} /></View>
          <View style={styles.flex}><Text style={styles.roomTitle}>Remove a card</Text><Text style={styles.roomDetail}>Fewer weak cards, so your best come up more</Text></View>
          <Text style={styles.price}>{REMOVE_COST}</Text>
        </Pressable>
      </View>
      {removing ? <><Text style={styles.section}>TAP A CARD TO REMOVE IT</Text><View style={styles.offer}>{run.deck.map((card) => <GameCard key={card.uid} card={card} size="sm" charms={run.charms} onPress={() => update((state) => removeCard(state, card.uid))} />)}</View></> : null}
    </>, <AppButton label="Leave the shop" onPress={() => update(leaveShop)} />, 'Shop');
  }

  /* ---------- mystery ---------- */

  if (view === 'mystery') {
    const good = run.mystery === 'good';
    const card = run.offer[0];
    return page(<>
      <View style={styles.centreBlock}><Mascot pose={good ? 'excited' : 'surprised'} size={130} /><Text style={styles.hero}>{good ? 'A lucky find!' : 'A trap!'}</Text><Text style={styles.lead}>{good ? 'Take a strong card, or patch yourself up.' : 'Pay with health, or take a weak card that clogs your deck.'}</Text></View>
      {status}
      <View style={styles.offer}>{card ? <GameCard card={card} onPress={() => update((state) => takeCard(state, card.uid))} note={good ? 'Tap to take it' : 'Tap to take it instead'} /> : null}</View>
    </>, <AppButton label={good ? 'Heal 15 instead' : 'Lose 10 health'} tone="secondary" onPress={() => update(mysteryHealth)} />, 'Mystery');
  }

  /* ---------- over ---------- */

  const correct = answers.filter((item) => item.correct).length;
  const climbed = floorsClimbed(run);
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <AreaBackdrop kind={run.battle?.enemy.kind ?? 'towers'} opacity={0.14} />
    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={[styles.centre, column]}>
      <Mascot pose={newBest ? 'trophy' : climbed > 0 ? 'proud' : 'reading'} size={160} />
      <Text style={styles.kicker}>{newBest ? 'NEW BEST' : 'CLIMB OVER'}</Text>
      <Text style={styles.big}>{heightLabel(climbed)}</Text>
      <Text style={styles.lead}>{newBest ? 'Your highest climb yet.' : best ? `Your best is ${heightLabel(best)}.` : 'Every climb makes the next one easier.'}</Text>
      <View style={styles.summary}>
        <Stat value={climbed} label={climbed === 1 ? 'floor climbed' : 'floors climbed'} />
        <View style={styles.divider} />
        <Stat value={run.record.battles} label={run.record.battles === 1 ? 'battle won' : 'battles won'} />
        <View style={styles.divider} />
        <Stat value={correct} label="right answers" />
        <View style={styles.divider} />
        <Stat value={answers.length ? climbXp(run, correct) : 0} label="XP" />
      </View>
    </ScrollView>
    <View style={[styles.footer, column]}>
      <AppButton label="Climb again" icon="play" emphasis onPress={restart} />
      <AppButton label="Done" tone="secondary" style={styles.second} onPress={() => navigation.goBack()} />
    </View>
  </SafeAreaView>;
}

/** Your deck, small and side by side. */
function DeckStrip({ run }: { run: Run }) {
  const styles = useThemedStyles(createStyles);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
    {run.deck.map((card) => <GameCard key={card.uid} card={card} size="sm" charms={run.charms} />)}
  </ScrollView>;
}

function Stat({ value, label }: { value: number; label: string }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.stat}><Text style={styles.statBig}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const createStyles = ({ colors, typography, card, glass }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  right: { textAlign: 'right' },
  pressed: { opacity: 0.7 },
  off: { opacity: 0.45 },
  topBar: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 6, minHeight: 48 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  kicker: { ...typography.overline, fontSize: 10, textAlign: 'center', marginTop: 8 },
  kickerLeft: { ...typography.overline, fontSize: 10 },
  title: { ...typography.subtitle, fontSize: 18, lineHeight: 22 },
  best: { ...typography.label, fontSize: 11.5, color: colors.textSecondary, maxWidth: 150 },
  scroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, width: '100%', alignSelf: 'center', gap: 12 },
  dock: { paddingHorizontal: 16, paddingTop: 8, width: '100%', alignSelf: 'center' },
  dockGlass: { padding: 10, borderRadius: 30 },
  hint: { ...typography.label, fontSize: 13, textAlign: 'center', paddingVertical: 14, color: colors.textSecondary },
  centre: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, width: '100%', alignSelf: 'center', gap: 6 },
  centreBlock: { alignItems: 'center', gap: 4 },
  hero: { ...typography.title, fontSize: 28, lineHeight: 33, textAlign: 'center', marginTop: 6 },
  lead: { ...typography.body, textAlign: 'center', maxWidth: 400 },
  big: { ...typography.display, fontSize: 36, lineHeight: 42, textAlign: 'center' },
  rules: { alignSelf: 'stretch', gap: 14, marginTop: 16, ...card, borderRadius: 24, padding: 18 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleText: { ...typography.bodyStrong, fontSize: 14, lineHeight: 20, flex: 1 },
  bestBig: { ...typography.label, fontSize: 14, marginTop: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, width: '100%', alignSelf: 'center' },
  second: { marginTop: 10 },
  section: { ...typography.overline, fontSize: 10.5, marginTop: 4 },
  prompt: { ...typography.subtitle, fontSize: 18, lineHeight: 23 },
  draftHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  deckDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink },
  dotOn: { backgroundColor: colors.ink },
  offer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  strip: { gap: 8, paddingVertical: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusHp: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { ...typography.numeral, fontSize: 15, lineHeight: 19, minWidth: 28, fontVariant: ['tabular-nums'] },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tower: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginTop: 2 },
  step: { flex: 1, height: 34, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  stepHere: { borderColor: colors.ink, borderWidth: 2.5 },
  stepText: { ...typography.label, fontSize: 12, color: colors.textMuted },
  stepTextHere: { color: colors.ink },
  rooms: { gap: 10 },
  roomsWide: { flexDirection: 'row', flexWrap: 'wrap' },
  room: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, padding: 14 },
  roomWide: { flexBasis: '31%', flexGrow: 1 },
  roomBoss: { backgroundColor: colors.surfaceSelected },
  roomIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  roomIconBoss: { backgroundColor: colors.ink, borderColor: colors.ink },
  roomTitle: { ...typography.subtitle, fontSize: 17, lineHeight: 21 },
  roomDetail: { ...typography.caption, fontSize: 12.5, lineHeight: 17 },
  charms: { gap: 8 },
  charm: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10 },
  charmPick: { borderWidth: 2, borderColor: colors.ink },
  charmName: { ...typography.subtitle, fontSize: 15 },
  charmDetail: { ...typography.caption, fontSize: 12 },
  fixed: { width: '100%', alignSelf: 'center', paddingHorizontal: 16, paddingTop: 6 },
  duel: { borderRadius: 28, padding: 12, gap: 8 },
  bars: { flexDirection: 'row', gap: 16 },
  bar: { flex: 1, gap: 4 },
  barName: { ...typography.label, fontSize: 12 },
  barHp: { ...typography.caption, fontSize: 11, fontVariant: ['tabular-nums'] },
  table: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  vs: { alignItems: 'center', minWidth: 44, gap: 2 },
  vsText: { ...typography.overline, fontSize: 12, letterSpacing: 1 },
  damage: { ...typography.numeral, fontSize: 15, lineHeight: 19 },
  result: { ...typography.label, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clockTrack: { flex: 1, height: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  clockFill: { flex: 1, backgroundColor: colors.ink, transformOrigin: 'left' },
  clockText: { ...typography.numeral, fontSize: 12, lineHeight: 15, minWidth: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
  statRow: { flexDirection: 'row', gap: 10 },
  statButton: { flex: 1, alignItems: 'center', gap: 2, borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, paddingVertical: 10 },
  statName: { ...typography.label, fontSize: 13 },
  statAhead: { borderWidth: 3 },
  statVs: { ...typography.caption, fontSize: 11, lineHeight: 14 },
  statValue: { ...typography.numeral, fontSize: 26, lineHeight: 30 },
  ware: { alignItems: 'center', gap: 4 },
  price: { ...typography.label, fontSize: 12.5 },
  winArt: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  downed: { transform: [{ rotate: '-12deg' }], opacity: 0.6 },
  summary: { ...card, alignSelf: 'stretch', borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statBig: { ...typography.numeral, fontSize: 22, lineHeight: 26 },
  statLabel: { ...typography.caption, fontSize: 11, textAlign: 'center' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: 4 },
  scrim: { flex: 1, backgroundColor: glass.scrim, padding: 24, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 400, borderRadius: 34, padding: 24, gap: 6 },
  dialogTitle: { ...typography.title },
  dialogBody: { ...typography.body, marginTop: 6, marginBottom: 14 },
});
