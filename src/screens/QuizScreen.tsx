import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';
import { BossEncounter, type DuelMove } from '@/components/creatures/BossEncounter';
import { CompanionSprite } from '@/components/creatures/CompanionSprite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { companionById } from '@/data/companions';
import { scorePlacement, type AnsweredQuestion } from '@/utils/placementScoring';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHaptics } from '@/hooks/useHaptics';
import { sessionClearsStop } from '@/utils/questProgress';
import { findNode, getQuestMap, questionCountFor } from '@/data/questMap';
import { isStreakMilestone } from '@/utils/streaks';
import { choiceCanBeSubmitted, eliminatedChoiceFor } from '@/utils/quizChoices';
import { bossBattle } from '@/utils/bossBattle';
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
  const questionScroll = useRef<ScrollView>(null);
  const { courseId, setPlacementLevelId, setStartChoice } = useOnboarding();
  const { recordSession, ability, equippedId, map } = useQuest();
  const areaKind = map.units[params?.unit ?? 0]?.track.kind ?? 'waves';
  const companion = companionById(equippedId);

  const quiz = useMemo(() => getPlacementQuiz(courseId), [courseId]);
  /**
   * The equipped companion's one-shot abilities.
   *
   * One use per session rather than per question: a hint on every question is
   * not a hint, it is the answer key, and the ability lines say "one" for a
   * reason. Each is a separate flag so a student can spend them on different
   * questions.
   */
  const [hintShown, setHintShown] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [struckId, setStruckId] = useState<string | null>(null);
  const [strikeUsed, setStrikeUsed] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  /** Questions missed this session, queued to be asked again at the end. */
  const [requeued, setRequeued] = useState<PlacementQuestion[]>([]);
  const [hasRequeued, setHasRequeued] = useState(false);
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

  // Remy appends what was missed rather than replacing the run, so the
  // counter stays honest: "5 / 7" after a re-ask really is seven questions.
  const run = useMemo(() => [...questions, ...extra, ...requeued], [questions, extra, requeued]);
  const total = run.length;

  const [phase, setPhase] = useState<'intro' | 'study' | 'quiz'>(stop?.kind === 'lesson' ? 'study' : session ? 'quiz' : 'intro');
  const [index, setIndex] = useState(0);
  useEffect(() => { questionScroll.current?.scrollTo({ y: 0, animated: false }); }, [index]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [duelMove, setDuelMove] = useState<DuelMove | null>(null);
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
  const question = run[Math.min(index, total - 1)];
  const isChoiceBased = !!question?.choices;
  const isLast = !endless && index + 1 >= total;
  const progress = total ? (index + (checked ? 1 : 0)) / total : 0;
  const correctCount = answered.filter(a => a.correct).length;
  const battle = bossBattle(correctCount, answered.length, total, finalStrike, questions.length);
  const pendingReview = isLast && Boolean(session) && ability === 'requeue' && !hasRequeued && answered.some(a => !a.correct);
  const canFinishBoss = isBoss && isLast && battle.canFinish && !pendingReview;
  const canCheck = isChoiceBased ? choiceCanBeSubmitted(question, selectedChoiceId, struckId) : textAnswer.trim().length > 0;

  const evaluate = (): boolean => {
    if (isChoiceBased) return selectedChoiceId === question.correctAnswerId;
    return (question.acceptedAnswers ?? []).map(normalize).includes(normalize(textAnswer));
  };

  /** Ellie: show the explanation before answering, once. */
  const takeHint = () => {
    if (hintUsed) return;
    setHintUsed(true);
    setHintShown(true);
  };

  /**
   * Daisy: rule out one wrong option, once.
   *
   * Picked deterministically from the question's own id rather than at random,
   * so leaving and re-entering a stop cannot be used to strike a different
   * option each time and narrow it down for free.
   */
  const strikeOne = () => {
    if (strikeUsed || checked || !question) return;
    const eliminated = eliminatedChoiceFor(question);
    if (!eliminated) return;
    setStruckId(eliminated);
    if (selectedChoiceId === eliminated) setSelectedChoiceId(null);
    setStrikeUsed(true);
  };

  /**
   * Benny: take a wrong answer back, once.
   *
   * The answer has already been recorded by `onCheck`, so the retry drops it —
   * otherwise the session would count the attempt the companion just undid,
   * and a student who fixed it would still see the miss in their weak spots.
   */
  const takeRetry = () => {
    if (retryUsed || isCorrect || !checked || duelResolving.current) return;
    setRetryUsed(true);
    setAnswered((prev) => prev.slice(0, -1));
    checking.current = false;
    setChecked(false);
    setIsCorrect(false);
    setSelectedChoiceId(null);
    setTextAnswer('');
  };

  const onCheck = () => {
    if (!question || !canCheck || checked || checking.current || finished.current) return;
    checking.current = true;
    Keyboard.dismiss();
    const correct = evaluate();
    haptic(correct ? 'success' : 'retry');
    setIsCorrect(correct);
    setChecked(true);
    revealFeedback.current = true;
    if (isBoss) {
      duelResolving.current = true;
      const after = bossBattle(correctCount + (correct ? 1 : 0), answered.length + 1, total, false, questions.length);
      setDuelMove({ id: index * 2, correct, damage: correct ? battle.bossHealth - after.bossHealth : battle.playerHealth - after.playerHealth });
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
      const earned = Math.round(base * xpMultiplier(all));
      const accepted = recordSession(
        earned,
        session.nodeId,
        // What this session actually got right, by skill. Without it the
        // weakest-category list and every accuracy achievement stay empty.
        all.map((a) => ({ skillTag: a.question.skillTag, correct: a.correct })),
        routeKey,
      );
      const cleared = stop ? sessionClearsStop(all.map((a) => ({ skillTag: a.question.skillTag, correct: a.correct })), questionCountFor(stop)) : undefined;
      setExitAction(() => () => navigation.replace('LessonComplete', { title: session.title, correct, total: all.length, xp: accepted ? earned : 0, cleared, bossNodeId: stop?.kind === 'boss' ? stop.id : undefined }));
      return;
    }

    setPlacementLevelId(scorePlacement(all).level);
    setExitAction(() => () => navigation.replace('PlacementResult'));
  };

  /**
   * What the equipped companion multiplies this session's XP by.
   *
   * Applied after the accuracy split rather than instead of it, so a companion
   * rewards a good session rather than replacing the need for one.
   */
  const xpMultiplier = (all: AnsweredQuestion[]): number => {
    if (ability === 'xpDrill' && !session?.nodeId) return 1.2;
    if (ability === 'xpBoss' && params?.boss) return 1.5;
    if (ability === 'xpPerfect' && all.length > 0 && all.every((a) => a.correct)) return 2;
    return 1;
  };

  /**
   * What the equipped companion offers on this question, if anything.
   *
   * Only the two abilities that act *before* an answer appear here — the retry
   * belongs on the feedback panel, where the miss it is undoing is, and the
   * rest change what the session pays rather than how it is asked.
   *
   * Off during the placement quiz: that run decides where the map opens, and a
   * companion nudging it would place the student somewhere they have not
   * actually earned.
   */
  const companionAction = (() => {
    if (!session || !companion) return null;
    if (ability === 'hint') return { label: 'Hint', spent: hintUsed, onPress: takeHint };
    if (ability === 'eliminate' && question?.choices) {
      return { label: 'Rule one out', spent: strikeUsed, onPress: strikeOne };
    }
    return null;
  })();

  const canRetry = Boolean(session) && ability === 'retry' && !retryUsed && checked && !isCorrect;

  const advanceQuestion = () => {
    if (advancing.current || !checked || finished.current) return;

    // Top up a batch before running out, so the next question is already
    // there when the transition lands rather than one render later.
    if (endless && index + 2 >= total) setRefills((r) => r + 1);

    if (isLast) {
      /**
       * Remy: ask everything missed one more time before finishing.
       *
       * Appended once per session, not repeatedly — a student who misses the
       * re-ask too would otherwise never reach the end. Both attempts are
       * recorded, because both happened.
       */
      if (session && ability === 'requeue' && !hasRequeued) {
        const missed = answered.filter((a) => !a.correct).map((a) => a.question);
        if (missed.length > 0) {
          setHasRequeued(true);
          setRequeued(missed);
          setIndex((i) => i + 1);
          setSelectedChoiceId(null);
          setTextAnswer('');
          setChecked(false);
          setIsCorrect(false);
          setStruckId(null);
          setHintShown(false);
          checking.current = false;
          setDuelMove(null);
          duelResolving.current = false;
          return;
        }
      }
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
      setStruckId(null);
      setHintShown(false);
      checking.current = false;
      setDuelMove(null);
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
    if (!checked) {
      if (choiceId === struckId) return 'struck';
      return selectedChoiceId === choiceId ? 'selected' : 'idle';
    }
    if (choiceId === question.correctAnswerId) return isCorrect ? 'correct' : 'missed';
    if (choiceId === selectedChoiceId) return 'wrong';
    return 'idle';
  };

  const correctAnswerText = isChoiceBased
    ? question.choices?.find((c) => c.id === question.correctAnswerId)?.text
    : question?.acceptedAnswers?.[0];

  if (!question) return <SafeAreaView style={styles.root}><AreaBackdrop kind={areaKind} opacity={0.3} /><View style={styles.introBody}><Mascot pose="reading" size={130} /><Text style={typography.title}>You’re all caught up.</Text><Text style={[typography.body, styles.introText]}>There are no questions in this practice set. Pick another topic to keep exploring.</Text><AppButton label="Back to practice" onPress={() => navigation.goBack()} /></View></SafeAreaView>;

  if (phase === 'study') {
    const notes = questions.filter((item, i, all) => all.findIndex((other) => other.skillTag === item.skillTag) === i).slice(0, 4);
    return <SafeAreaView style={styles.root} edges={['top', 'bottom']}><AreaBackdrop kind={areaKind} opacity={0.3} /><StatusBar style={appTheme.isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.studyContent}>
        <View style={styles.studyHeading}><Mascot size={82} pose="reading" /><View style={{ flex: 1 }}><Text style={typography.overline}>FIELD NOTES</Text><Text style={typography.title}>{session?.title}</Text></View></View>
        <Text style={[typography.body, { marginBottom: 18 }]}>A few ideas to take with you. Read them, then try the practice questions.</Text>
        {notes.map((item) => <View key={item.id} style={styles.studyCard}><Text style={typography.heading}>{item.skillTag}</Text><Text style={[typography.body, { color: colors.ink, marginTop: 8 }]}>{item.explanation}</Text></View>)}
        <AppButton label={`Try ${questions.length} questions`} icon="arrow-right" onPress={() => setPhase('quiz')} />
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.skip}><Text style={styles.skipText}>Back to the map</Text></Pressable>
      </ScrollView>
    </SafeAreaView>;
  }

  // --- Intro (placement only): take the quest, or skip to the first unit ---
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <AreaBackdrop kind={areaKind} opacity={0.3} />
        <StatusBar style={appTheme.isDark ? "light" : "dark"} />
        <View style={styles.introTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Close">
            <Glyph name="close" size={24} color={colors.textMuted} strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.introBody}>
          <Mascot size={200} pose="excited" />
          <Text style={[typography.title, styles.introTitle]}>Find your starting point</Text>
          <Text style={[typography.body, styles.introText]}>{quiz.intro}</Text>
          <Text style={styles.introMeta}>{total} questions · about 4 minutes</Text>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Start the questions" icon="play" emphasis onPress={() => { setStartChoice('find_level'); setPhase('quiz'); }} />
          <Pressable
            onPress={() => {
              setStartChoice('scratch');
              setPlacementLevelId('beginner');
              navigation.replace('PlacementResult');
            }}
            hitSlop={8}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip — start me at the beginning</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Questions ---
  return (
    <View style={styles.root}>
      <AreaBackdrop kind={areaKind} opacity={0.3} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar style={appTheme.isDark ? "light" : "dark"} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.headerWrap}>
            <QuizProgressHeader
              title={getCourse(courseId)?.name ?? 'AP practice'}
              subtitle={isBoss ? 'Boss duel' : session?.title ?? 'Find your starting point'}
              courseId={courseId}
              progress={endless ? ((index % REVIEW_BATCH) + 1) / REVIEW_BATCH : progress}
              counter={endless ? `${answered.length} done` : `${index + 1} / ${total}`}
              currentCorrectStreak={currentCorrectStreak}
              onClose={() => (endless ? finish(answered) : navigation.goBack())}
            />
          </View>
          {isBoss ? <View style={styles.encounterWrap}><BossEncounter nodeId={stop.id} correct={correctCount} attempted={answered.length} total={total} damageTotal={questions.length} reviewPending={pendingReview} move={duelMove} finalStrike={finalStrike} onMoveComplete={onDuelMoveComplete} /></View> : null}

          <ScrollView
            ref={questionScroll}
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => { if (checked && revealFeedback.current) { revealFeedback.current = false; questionScroll.current?.scrollToEnd({ animated: !reduceMotion }); } }}
          >
            <Animated.View
              style={{
                opacity: qAnim,
              }}
            >
              <QuestionCard question={question}>
                {isChoiceBased ? (
                  question.choices!.map((choice, i) => (
                    <AnswerChoice
                      key={choice.id}
                      index={i}
                      label={choice.text}
                      state={choiceState(choice.id)}
                      disabled={checked || choice.id === struckId}
                      onPress={() => { if (choice.id !== struckId) setSelectedChoiceId(choice.id); }}
                    />
                  ))
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
                    onSubmitEditing={onCheck}
                  />
                )}
              </QuestionCard>
            </Animated.View>
            {hintShown && !checked ? <GlassSurface variant="thick" style={styles.hint}><Text style={typography.overline}>{companion?.name ?? 'Your companion'}’s hint</Text><Text style={styles.hintText}>{question.explanation}</Text></GlassSurface> : null}
            {checked ? <QuizFeedbackPanel correct={isCorrect} explanation={question.explanation} answer={correctAnswerText} /> : null}
          </ScrollView>
          <View style={[styles.actionDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <GlassSurface variant="thick" style={styles.actionGlass}>
              {!checked && companionAction ? <View style={styles.assistRow}>
                <CompanionSprite id={companion!.id} size={26} />
                <Text style={styles.assistText}>{companionAction.spent ? `${companion!.name} has helped this round` : `${companion!.name} can help`}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={companionAction.label} disabled={companionAction.spent} onPress={companionAction.onPress} style={styles.assistButton}><Text style={[styles.assistLabel, companionAction.spent && { opacity: 0.45 }]}>{companionAction.spent ? 'Used' : companionAction.label}</Text></Pressable>
              </View> : null}
              {checked ? <View style={styles.actionRow}>
                {canRetry && !duelMove ? <AppButton label="Try again" tone="secondary" size="md" style={styles.retryButton} onPress={takeRetry} /> : null}
                <AppButton label={duelMove ? duelMove.finisher ? 'Final strike…' : 'Resolving…' : pendingReview ? 'One more round' : canFinishBoss && battle.bossHealth > 0 ? 'Final strike' : isLast ? isBoss ? battle.canFinish ? 'Claim victory' : 'Finish battle' : 'Finish' : 'Next question'} disabled={duelMove !== null} style={styles.mainAction} onPress={onContinue} />
              </View> : <AppButton label={isBoss ? 'Attack' : 'Check answer'} icon={isBoss ? 'swords' : undefined} disabled={!canCheck} hapticFeedback={false} onPress={onCheck} />}
            </GlassSurface>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal transparent visible={confirmExit !== null} animationType="fade" onRequestClose={() => setConfirmExit(null)}>
        <View style={styles.exitBackdrop}><GlassSurface variant="thick" accessibilityViewIsModal style={styles.exitCard}>
          <Text style={typography.title}>Leave this practice?</Text><Text style={[typography.body, { marginVertical: 16 }]}>This unfinished session won’t be saved. Your earlier progress is safe.</Text>
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

const createStyles = ({ colors, palette, typography, stroke, glass, card }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  studyContent: { padding: 24, width: '100%', maxWidth: 620, alignSelf: 'center' },
  studyHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  studyCard: { ...card, padding: 18, borderRadius: 22, marginBottom: 16 },
  exitBackdrop: { flex: 1, backgroundColor: glass.scrim, padding: 24, alignItems: 'center', justifyContent: 'center' },
  exitCard: { width: '100%', maxWidth: 400, borderRadius: 34, padding: 24 },

  companionBar: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  companionText: { flex: 1, minWidth: 0 },
  companionName: { ...typography.bodyStrong, fontSize: 14, color: colors.textPrimary },
  companionNote: { ...typography.caption, color: colors.textMuted },
  companionBtn: {
    backgroundColor: colors.primary,
    borderWidth: stroke.control,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  companionBtnPressed: { transform: [{ translateY: 2 }] },
  companionBtnSpent: { backgroundColor: 'transparent', borderColor: colors.overlayStrong },
  companionBtnText: { ...typography.label, fontSize: 11, color: colors.textOnPrimary },
  companionBtnTextSpent: { color: colors.textMuted },

  hint: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryTint,
    borderWidth: stroke.surface,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  hintText: { ...typography.body, fontSize: 13.5, color: colors.primaryDeep },

  flex: { flex: 1 },

  introTop: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  introBody: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, width: '100%', maxWidth: 620, alignSelf: 'center' },
  introTitle: { marginTop: spacing.md, textAlign: 'center' },
  introText: { textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  introMeta: { ...typography.caption, marginTop: spacing.lg },
  skip: { alignSelf: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  skipText: { ...typography.bodyStrong, color: colors.textSecondary },

  headerWrap: { paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  encounterWrap: { width: '100%', maxWidth: 620, alignSelf: 'center' },
  actionDock: { paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  actionGlass: { padding: 10, borderRadius: 30 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainAction: { flex: 1, minWidth: 0 },
  retryButton: { flex: 0.7 },
  assistRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 5, marginBottom: 6 },
  assistText: { ...typography.caption, fontSize: 11, flex: 1 },
  assistButton: { minHeight: 36, paddingHorizontal: 9, justifyContent: 'center', borderRadius: 18 },
  assistLabel: { ...typography.bodyStrong, fontSize: 12 },
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
