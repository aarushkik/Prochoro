import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import { BossEncounter, type DuelMove } from '@/components/creatures/BossEncounter';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, usePreventRemove, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Glyph } from '@/components/icons';
import { Mascot } from '@/components/Mascot';
import {
  AnswerChoice,
  QuestionCard,
  QuizFeedbackPanel,
  QuizProgressHeader,
  StreakMilestoneOverlay,
  type ChoiceState,
} from '@/components/quiz';
import { colors, duration, easing, radius, spacing, typography } from '@/theme';
import { getPlacementQuiz, getCourse, questionsForStop, questionsForSkills, placementQuestions } from '@/data';
import { scorePlacement, type AnsweredQuestion } from '@/utils/placementScoring';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHaptics } from '@/hooks/useHaptics';
import { sessionClearsStop } from '@/utils/questProgress';
import { findNode, getQuestMap, questionCountFor } from '@/data/questMap';
import { isStreakMilestone } from '@/utils/streaks';
import { choiceCanBeSubmitted } from '@/utils/quizChoices';
import { bossBattle } from '@/utils/bossBattle';
import { isQuick, secondsFor } from '@/utils/battleClock';
import { useCountdown, useScreenReader } from '@/hooks/useCountdown';
import { shuffleQuizChoices } from '@/utils/shuffleQuizChoices';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { levelNumber } from '@/utils/learningLevels';
import { useOnboarding } from '@/state/OnboardingContext';
import { useQuest } from '@/state/QuestContext';
import type { PlacementQuestion } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
type Route = RouteProp<RootStackParamList, 'Quiz'>;

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * The question engine, used for two jobs.
 *
 * With no params it runs the "Find Your Level" placement quest: an intro,
 * the subject's full question set, then a weighted score that decides where the
 * quest map opens. With params it runs a *session* — one stop on the map or a
 * drill from the training ground — using a slice of the same bank and reporting
 * back to the map instead of to placement.
 */
export function QuizScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation<Nav>();
  const { params, key: routeKey } = useRoute<Route>();
  const { reduceMotion } = useMotionPreference();
  const haptic = useHaptics();
  const insets = useSafeAreaInsets();
  const layout = useScreenLayout();
  // The quiz column grows with the screen; past a phone it stops at a width
  // where a line of question text is still comfortable to read.
  const column = { maxWidth: layout.expanded ? 1100 : layout.wide ? 820 : 620 };
  const questionScroll = useRef<ScrollViewInstance>(null);
  const { courseId, setPlacementLevelId, setStartChoice, markOnboarded } = useOnboarding();
  const { recordSession, map, looks } = useQuest();
  const areaKind = map.units[params?.unit ?? 0]?.track.kind ?? 'waves';

  const quiz = useMemo(() => getPlacementQuiz(courseId), [courseId]);
  const stop = params?.nodeId ? findNode(getQuestMap(courseId), params.nodeId)?.node : undefined;
  const isBoss = stop?.kind === 'boss';
  const session = params ? { title: params.title ?? stop?.title ?? 'Practice', xp: stop?.xp ?? params.xp ?? 20, nodeId: params.nodeId } : null;

  const questions = useMemo(() => {
    // No params at all is the placement quest, which samples across the whole
    // course rather than running every question in it.
    if (!session) return placementQuestions(courseId);
    const key = session.nodeId ?? session.title;
    const count = stop ? questionCountFor(stop) : Math.max(1, Math.min(40, Math.floor(params?.count ?? 5)));
    // A stop knows its unit, so it draws from that unit first and only falls
    // back to the rest of the course if it needs more than the unit holds.
    if (params?.unit != null) return questionsForStop(courseId, params.unit, count, key);
    // A drill that named a topic asks about that topic, and only tops up from
    // the rest of the course if the bank cannot fill the session.
    if (params?.focus?.length) return questionsForSkills(courseId, params.focus, count, key);
    // Anything else ranges over the whole course.
    return pickQuestions(quiz.questions, count, key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, courseId, session?.title, session?.nodeId, params?.count, params?.unit, params?.focus]);

  /**
   * Endless review draws fresh batches rather than ending.
   *
   * A cleared track has nothing left to clear, so the only useful thing to do
   * with it is keep answering — and a review that stops after five questions
   * is not a review, it is one more stop. Each refill is shuffled against a
   * new key, so the second pass is not the first pass in the same order.
   */
  const [refills, setRefills] = useState(0);
  const endless = Boolean(params?.endless);

  const extra = useMemo(() => {
    if (!endless || refills === 0) return [];
    const out: PlacementQuestion[] = [];
    for (let r = 1; r <= refills; r += 1) {
      const key = `${session?.title ?? 'review'}#${r}`;
      out.push(
        ...(params?.unit != null
          ? questionsForStop(courseId, params.unit, params?.count ?? 5, key)
          : pickQuestions(quiz.questions, params?.count ?? 5, key)),
      );
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endless, refills, courseId, params?.unit, params?.count, quiz, session?.title]);

  const run = useMemo(() => [...questions, ...extra], [questions, extra]);
  const displayedRun = useMemo(() => shuffleQuizChoices(run, routeKey), [run, routeKey]);
  const total = run.length;

  // Lessons and practice open straight on the first question; only placement has an intro.
  const [phase, setPhase] = useState<'intro' | 'quiz'>(session ? 'quiz' : 'intro');
  const [index, setIndex] = useState(0);
  useEffect(() => { questionScroll.current?.scrollTo({ y: 0, animated: false }); }, [index]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [duelMove, setDuelMove] = useState<DuelMove | null>(null);
  /** This question's blow, kept after its animation so the message stays readable. */
  const [lastMove, setLastMove] = useState<DuelMove | null>(null);
  /** Right answers given with at least half the clock left: they hit harder. */
  const [crits, setCrits] = useState(0);
  const duelResolving = useRef(false);
  const [finalStrike, setFinalStrike] = useState(false);
  const revealFeedback = useRef(false);


  const [currentCorrectStreak, setCurrentCorrectStreak] = useState(0);
  const [milestoneStreak, setMilestoneStreak] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const qAnim = useRef(new Animated.Value(1)).current;

  /**
   * True from the moment Continue is pressed until the next question is on
   * screen.
   *
   * Advancing happens in the fade-out's completion callback, so for the length
   * of that animation the button is still mounted, still says Continue, and
   * still has `checked` set. A second press inside that window ran the
   * advance twice: on an early question it silently skipped one, and on the
   * last-but-one it stepped past the end of the array and took the whole quiz
   * down with `Cannot read properties of undefined`. Easy to hit — the button
   * sits under your thumb and nothing about it looks busy.
   */
  const advancing = useRef(false);

  /**
   * True from the moment Check is pressed until the answer is recorded.
   *
   * `onCheck` guards on the `checked` state, but state does not apply within
   * the batch that set it — so two presses inside one batch both see it false
   * and both push an answer. The session then counts one attempt twice, which
   * inflates the skill tally and, in an endless review where XP is paid per
   * correct answer, the payout with it. Same shape as the Continue latch
   * below, and the same fix: a ref, which updates immediately.
   */
  const checking = useRef(false);

  const finished = useRef(false);
  const [exitAction, setExitAction] = useState<(() => void) | null>(null);
  const [confirmExit, setConfirmExit] = useState<(() => void) | null>(null);
  useEffect(() => { exitAction?.(); }, [exitAction]);
  useEffect(() => () => { qAnim.stopAnimation(); }, [qAnim]);
  usePreventRemove(answered.length > 0 && !exitAction, ({ data }) => {
    if (endless) finish(answered);
    else setConfirmExit(() => () => navigation.dispatch(data.action));
  });
  const question = displayedRun[Math.min(index, total - 1)];
  const isChoiceBased = !!question?.choices;
  const isLast = !endless && index + 1 >= total;
  const progress = total ? (index + (checked ? 1 : 0)) / total : 0;
  const correctCount = answered.filter(a => a.correct).length;
  const battle = bossBattle(correctCount, answered.length, total, finalStrike, questions.length, crits);
  const canFinishBoss = isBoss && isLast && battle.canFinish;
  const canCheck = isChoiceBased ? choiceCanBeSubmitted(question, selectedChoiceId) : textAnswer.trim().length > 0;

  // Boss questions are timed: answer before the clock runs out or the boss
  // strikes first. It only runs while a question is waiting for an answer.
  const relaxed = useScreenReader();
  const clockSeconds = question ? secondsFor(question, relaxed) : 30;
  const clockLive = isBoss && phase === 'quiz' && !checked && !duelMove && confirmExit === null;
  const clock = useCountdown(clockSeconds, clockLive, index, () => onTimeout());

  const evaluate = (): boolean => {
    if (isChoiceBased) return selectedChoiceId === question.correctAnswerId;
    return (question.acceptedAnswers ?? []).map(normalize).includes(normalize(textAnswer));
  };

  /** `picked` lets a boss answer land on the tap itself, before the selection renders. */
  const onCheck = (picked: string | null = selectedChoiceId) => {
    const ready = isChoiceBased ? choiceCanBeSubmitted(question, picked) : textAnswer.trim().length > 0;
    if (!question || !ready || checked || checking.current || finished.current) return;
    checking.current = true;
    Keyboard.dismiss();
    const correct = isChoiceBased ? picked === question.correctAnswerId : evaluate();
    const crit = isBoss && correct && isQuick(clock.remaining(), clockSeconds);
    haptic(correct ? 'success' : 'retry');
    setIsCorrect(correct);
    setChecked(true);
    revealFeedback.current = true;
    if (isBoss) {
      duelResolving.current = true;
      const after = bossBattle(correctCount + (correct ? 1 : 0), answered.length + 1, total, false, questions.length, crits + (crit ? 1 : 0));
      if (crit) setCrits((value) => value + 1);
      const blow = { id: index * 2, correct, crit, damage: correct ? battle.bossHealth - after.bossHealth : battle.playerHealth - after.playerHealth };
      setDuelMove(blow);
      setLastMove(blow);
    }

    if (correct) {
      const next = currentCorrectStreak + 1;
      setCurrentCorrectStreak(next);
      if (isStreakMilestone(next) && !isBoss) {
        setMilestoneStreak(next);
        setOverlayVisible(true);
      }
    } else {
      setCurrentCorrectStreak(0);
    }

    setAnswered((prev) => [...prev, { question, correct }]);
  };

  /** The clock ran out first: the boss strikes, and the question counts as missed. */
  const onTimeout = () => {
    if (!isBoss || !question || checked || checking.current || finished.current) return;
    checking.current = true;
    Keyboard.dismiss();
    haptic('retry');
    setSelectedChoiceId(null);
    setIsCorrect(false);
    setChecked(true);
    revealFeedback.current = true;
    duelResolving.current = true;
    const after = bossBattle(correctCount, answered.length + 1, total, false, questions.length, crits);
    const blow = { id: index * 2, correct: false, timeout: true, damage: battle.playerHealth - after.playerHealth };
    setDuelMove(blow);
    setLastMove(blow);
    setCurrentCorrectStreak(0);
    setAnswered((prev) => [...prev, { question, correct: false }]);
  };

  const finish = (all: AnsweredQuestion[]) => {
    if (finished.current) return;
    finished.current = true;
    if (!all.length) { setExitAction(() => () => navigation.goBack()); return; }
    const correct = all.filter((a) => a.correct).length;

    if (session) {
      // Award XP in proportion to accuracy, but never nothing for finishing.
      //
      // An endless review has no fixed length, so a flat payout would be worth
      // the same for five questions as for fifty. It pays per correct answer
      // instead, which is the only version that stays fair in both directions.
      const base = endless
        ? Math.max(5, correct * REVIEW_XP_EACH)
        : Math.max(5, Math.round((session.xp * correct) / Math.max(1, all.length)));
      // A small bonus for each fast right answer in a boss battle.
      const earned = base + (isBoss ? crits * 2 : 0);
      // Which hats were already earned, so the results can announce a new one.
      const looksBefore = looks.filter((look) => look.owned).map((look) => look.id);
      const accepted = recordSession(
        earned,
        session.nodeId,
        // What this session actually got right, by skill. Without it the
        // weakest-category list and every accuracy achievement stay empty.
        all.map((a) => ({ skillTag: a.question.skillTag, correct: a.correct })),
        routeKey,
      );
      const cleared = stop ? sessionClearsStop(all.map((a) => ({ skillTag: a.question.skillTag, correct: a.correct })), questionCountFor(stop)) : undefined;
      setExitAction(() => () => navigation.replace('LessonComplete', { title: session.title, correct, total: all.length, xp: accepted ? earned : 0, cleared, nodeId: stop?.id, level: levelNumber(map, stop?.id) ?? undefined, bossNodeId: stop?.kind === 'boss' ? stop.id : undefined, looksBefore }));
      return;
    }

    setPlacementLevelId(scorePlacement(all).level);
    setExitAction(() => () => navigation.replace('PlacementResult'));
  };

  const advanceQuestion = () => {
    if (advancing.current || !checked || finished.current) return;

    // Top up a batch before running out, so the next question is already
    // there when the transition lands rather than one render later.
    if (endless && index + 2 >= total) setRefills((r) => r + 1);

    if (isLast) {
      // Finishing navigates away, so the latch is never released — which is
      // what stops a second press replacing the results screen twice.
      advancing.current = true;
      finish(answered);
      return;
    }
    advancing.current = true;
    Animated.timing(qAnim, { toValue: 0, duration: reduceMotion ? 0 : duration.fast, easing: easing.in, useNativeDriver: true }).start(({ finished: completedAnimation }) => {
      if (!completedAnimation) { advancing.current = false; return; }
      // Clamped as well as latched: the latch is the fix, the clamp means a
      // future path into this callback cannot crash the screen either.
      setIndex((i) => Math.min(i + 1, total - 1));
      setSelectedChoiceId(null);
      setTextAnswer('');
      setChecked(false);
      setIsCorrect(false);
      checking.current = false;
      setDuelMove(null);
      setLastMove(null);
      duelResolving.current = false;
      advancing.current = false;
      Animated.timing(qAnim, { toValue: 1, duration: reduceMotion ? 0 : duration.base, easing: easing.out, useNativeDriver: true }).start();
    });
  };

  const onContinue = () => {
    if (advancing.current || !checked || finished.current || duelResolving.current) return;
    if (canFinishBoss && battle.bossHealth > 0) {
      duelResolving.current = true;
      setFinalStrike(true);
      setDuelMove({ id: index * 2 + 1, correct: true, damage: battle.bossHealth, finisher: true });
    } else advanceQuestion();
  };
  const onDuelMoveComplete = () => {
    if (duelMove?.finisher) advanceQuestion();
    else { setDuelMove(null); duelResolving.current = false; }
  };

  const choiceState = (choiceId: string): ChoiceState => {
    if (!checked) return selectedChoiceId === choiceId ? 'selected' : 'idle';
    if (choiceId === question.correctAnswerId) return isCorrect ? 'correct' : 'missed';
    if (choiceId === selectedChoiceId) return 'wrong';
    return 'idle';
  };

  const correctAnswerText = isChoiceBased
    ? question.choices?.find((c) => c.id === question.correctAnswerId)?.text
    : question?.acceptedAnswers?.[0];

  if (!question) return <SafeAreaView style={styles.root}><AreaBackdrop kind={areaKind} opacity={0.14} /><View style={styles.introBody}><Mascot pose="reading" size={130} /><Text style={typography.title}>All caught up</Text><AppButton label="Back to practice" onPress={() => navigation.goBack()} /></View></SafeAreaView>;

  // --- Intro (placement only): take the quest, or skip to the first unit ---
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <AreaBackdrop kind={areaKind} opacity={0.14} />
        <StatusBar style={appTheme.isDark ? "light" : "dark"} />
        <View style={styles.introTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Close">
            <Glyph name="close" size={24} color={colors.textMuted} strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.introBody, column]}>
          <Mascot size={200} pose="wave" />
          <Text style={[typography.title, styles.introTitle]}>Where should you start?</Text>
        </ScrollView>

        <View style={[styles.footer, column]}>
          <AppButton
            label="Start from Unit 1"
            icon="play"
            emphasis
            onPress={() => {
              setStartChoice('scratch');
              setPlacementLevelId('beginner');
              markOnboarded();
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }}
          />
          <AppButton label={`Find my level · ${total} questions`} tone="secondary" style={styles.secondChoice} onPress={() => { setStartChoice('find_level'); setPhase('quiz'); }} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Questions ---
  // Short answers sit two across on a wide screen, so four of them fill one
  // block instead of a long ladder. Long answers keep a full row each.
  const answerGrid = layout.wide && !question.stimulus && isChoiceBased && question.choices!.every(choice => choice.text.length <= 44);
  return (
    <View style={styles.root}>
      <AreaBackdrop kind={areaKind} opacity={0.14} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar style={appTheme.isDark ? "light" : "dark"} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.headerWrap, column]}>
            <QuizProgressHeader
              title={stop ? 'Level ' + levelNumber(map, stop.id) : getCourse(courseId)?.name ?? 'AP practice'}
              subtitle={isBoss ? 'Boss battle · ' + stop.title : session?.title ?? 'Find your starting point'}
              courseId={courseId}
              progress={endless ? ((index % REVIEW_BATCH) + 1) / REVIEW_BATCH : progress}
              counter={endless ? `${answered.length} done` : `${index + 1} / ${total}`}
              currentCorrectStreak={currentCorrectStreak}
              onClose={() => (endless ? finish(answered) : navigation.goBack())}
            />
          </View>
          {isBoss ? <View style={[styles.encounterWrap, column]}><BossEncounter nodeId={stop.id} correct={correctCount} attempted={answered.length} total={total} damageTotal={questions.length} crits={crits} combo={currentCorrectStreak} move={duelMove} last={lastMove} finalStrike={finalStrike} clock={checked ? null : clock} clockLive={clockLive} onMoveComplete={onDuelMoveComplete} /></View> : null}

          <ScrollView
            ref={questionScroll}
            style={styles.flex}
            contentContainerStyle={[styles.scroll, column]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => { if (checked && revealFeedback.current) { revealFeedback.current = false; questionScroll.current?.scrollToEnd({ animated: !reduceMotion }); } }}
          >
            <Animated.View
              style={{
                opacity: qAnim,
              }}
            >
              <QuestionCard question={question} split={layout.expanded && Boolean(question.stimulus)}>
                {isChoiceBased ? (
                  <View style={answerGrid ? styles.answerGrid : undefined}>{question.choices!.map((choice, i) => (
                    <View key={choice.id} style={answerGrid ? styles.answerCell : undefined}>
                    <AnswerChoice
                      key={choice.id}
                      index={i}
                      label={choice.text}
                      state={choiceState(choice.id)}
                      disabled={checked}
                      onPress={() => { setSelectedChoiceId(choice.id); if (isBoss) onCheck(choice.id); }}
                    />
                    </View>
                  ))}</View>
                ) : (
                  <TextInput
                    style={[
                      styles.input,
                      checked && { borderColor: isCorrect ? colors.success : colors.danger },
                    ]}
                    accessibilityLabel="Your answer"
                    keyboardAppearance={appTheme.mode}
                    placeholder="Type your answer"
                    placeholderTextColor={colors.textMuted}
                    value={textAnswer}
                    onChangeText={setTextAnswer}
                    editable={!checked}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => onCheck()}
                  />
                )}
              </QuestionCard>
            </Animated.View>
            {checked ? <QuizFeedbackPanel correct={isCorrect} explanation={question.explanation} answer={correctAnswerText} /> : null}
          </ScrollView>
          <View style={[styles.actionDock, column, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <GlassSurface variant="thick" style={styles.actionGlass}>
              {checked ? <View style={styles.actionRow}>
                <AppButton label={duelMove ? duelMove.finisher ? 'Final strike…' : 'Resolving…' : canFinishBoss && battle.bossHealth > 0 ? 'Final strike' : isLast ? isBoss ? battle.canFinish ? 'Claim victory' : 'Finish battle' : 'Finish' : 'Next question'} disabled={duelMove !== null} style={styles.mainAction} onPress={onContinue} />
              </View> : isBoss && isChoiceBased ? <Text style={styles.strikeHint}>Tap an answer to strike</Text>
                : <AppButton label={isBoss ? 'Attack' : 'Check answer'} icon={isBoss ? 'swords' : undefined} disabled={!canCheck} hapticFeedback={false} onPress={() => onCheck()} />}
            </GlassSurface>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal transparent visible={confirmExit !== null} animationType="fade" onRequestClose={() => setConfirmExit(null)}>
        <View style={styles.exitBackdrop}><GlassSurface variant="thick" accessibilityViewIsModal style={styles.exitCard}>
          <Text style={typography.title}>Leave this practice?</Text><Text style={[typography.body, { marginVertical: 16 }]}>This session won’t be saved.</Text>
          <AppButton label="Keep studying" onPress={() => setConfirmExit(null)} />
          <AppButton label="Leave session" tone="secondary" style={{ marginTop: 16 }} onPress={() => { const action = confirmExit; setConfirmExit(null); setExitAction(() => action); }} />
        </GlassSurface></View>
      </Modal>
      <StreakMilestoneOverlay
        visible={overlayVisible}
        streakCount={milestoneStreak}
        onAnimationComplete={() => setOverlayVisible(false)}
      />
    </View>
  );
}

/**
 * Take `count` questions from the bank, starting at an offset derived from the
 * stop's id. Two different stops therefore open on different questions, and the
 * same stop always opens on the same ones.
 */
function pickQuestions(bank: PlacementQuestion[], count: number, key: string): PlacementQuestion[] {
  if (bank.length === 0) return bank;
  const seed = [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const start = seed % bank.length;
  const size = Math.min(count, bank.length);
  return Array.from({ length: size }, (_, i) => bank[(start + i) % bank.length]);
}

/** Questions per bar-fill in an endless review, so the bar still means something. */
const REVIEW_BATCH = 5;
/** What one right answer is worth in an endless review. */
const REVIEW_XP_EACH = 4;

const createStyles = ({ colors, palette, typography, stroke, glass }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  exitBackdrop: { flex: 1, backgroundColor: glass.scrim, padding: 24, alignItems: 'center', justifyContent: 'center' },
  exitCard: { width: '100%', maxWidth: 400, borderRadius: 34, padding: 24 },

  flex: { flex: 1 },
  answerGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  answerCell: { flexBasis: '45%', flexGrow: 1 },

  introTop: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  introBody: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, width: '100%', maxWidth: 620, alignSelf: 'center' },
  introTitle: { marginTop: spacing.md, textAlign: 'center' },
  secondChoice: { marginTop: spacing.md },

  headerWrap: { paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  encounterWrap: { width: '100%', maxWidth: 620, alignSelf: 'center' },
  actionDock: { paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  actionGlass: { padding: 10, borderRadius: 30 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainAction: { flex: 1, minWidth: 0 },
  strikeHint: { ...typography.label, fontSize: 13, textAlign: 'center', paddingVertical: 14, color: colors.textSecondary },
  sessionTitle: { ...typography.overline, color: colors.textMuted, marginBottom: spacing.xs, paddingLeft: spacing.xxxl },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, width: '100%', maxWidth: 620, alignSelf: 'center' },

  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xxl, width: '100%', maxWidth: 620, alignSelf: 'center' },
});
