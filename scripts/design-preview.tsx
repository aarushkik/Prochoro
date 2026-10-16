/** Isolated visual QA. All progress is in memory; no Auth or ProfileSync is mounted. */
import React, { useEffect, useRef, useState } from 'react';
import { registerRootComponent } from 'expo';
import { Image, ScrollView, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ThemeProvider, useAppTheme, useAppearancePreference } from '../src/theme/ThemeProvider';
import { OnboardingProvider, useOnboarding } from '../src/state/OnboardingContext';
import { QuestProvider, useQuest } from '../src/state/QuestContext';
import { todayKey } from '../src/utils/studyDates';
import { Backdrop } from '../src/components/ui/Backdrop';
import { AreaBackdrop } from '../src/components/ui/AreaBackdrop';
import { AREA_ART } from '../src/data/areaArt';
import { AppButton } from '../src/components/ui/AppButton';
import { AppearanceControls } from '../src/components/account/AppearanceControls';
import { ProfileContent } from '../src/components/home/ProfileContent';
import { Mascot } from '../src/components/Mascot';
import { MASCOT_SHEETS } from '../src/components/Mascot/Mascot.types';
import { BOSS_ART } from '../src/data/characterArt';
import { getCourse } from '../src/data';
import { questionCountFor } from '../src/data/questMap';
import { HomeContent } from '../src/screens/HomeScreen';
import { IntroScreen } from '../src/screens/IntroScreen';
import { CourseSelectionScreen } from '../src/screens/CourseSelectionScreen';
import { SubjectExperienceScreen } from '../src/screens/SubjectExperienceScreen';
import { GoalScoreScreen } from '../src/screens/GoalScoreScreen';
import { ExamTimelineScreen } from '../src/screens/ExamTimelineScreen';
import { AchievementPreviewScreen } from '../src/screens/AchievementPreviewScreen';
import { PlacementResultScreen } from '../src/screens/PlacementResultScreen';
import { LessonCompleteScreen } from '../src/screens/LessonCompleteScreen';
import { QuizScreen } from '../src/screens/QuizScreen';
import { CharactersScreen } from '../src/screens/CharactersScreen';
import type { QuestNode } from '../src/types/quest';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

function Seed() {
  const setup = useOnboarding(); const quest = useQuest();
  useEffect(() => {
    setup.hydrate({ courseId: 'ap-biology', goalScoreId: 'score5', placementLevelId: 'beginner', onboarded: true });
    quest.hydrate({ xp: 240, gems: 5, streakDays: 3, bestStreak: 3, lastSessionOn: todayKey(), todayCount: 1, sessions: 4, completedStops: quest.map.order.slice(0, 2) });
  }, []);
  return null;
}
function Menu() {
  const theme = useAppTheme(); const nav = useNavigation<any>(); const quest = useQuest();
  const setup = useOnboarding();
  const [sample, setSample] = useState<{ course: string; title: string; focus: string } | null>(null);
  useEffect(() => {
    if (!sample || setup.courseId !== sample.course) return;
    nav.navigate('Quiz', { title: sample.title, focus: [sample.focus], count: 3, xp: 10 }); setSample(null);
  }, [sample, setup.courseId]);
  const openSample = (course: string, title: string, focus: string) => { setup.hydrate({ courseId: course }); setSample({ course, title, focus }); };
  const boss = quest.map.units[0].nodes.find(n => n.kind === 'boss')!;
  const lesson = quest.map.units[0].nodes.find(n => n.kind === 'lesson')!;
  const start = (node: QuestNode) => nav.navigate('Quiz', { nodeId: node.id, unit: 0, title: node.title, count: questionCountFor(node), xp: node.xp, boss: node.kind === 'boss' });
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
    <Mascot pose="wave" size={100} /><Text style={theme.typography.title}>Prochoro design review</Text>
    <Text style={theme.typography.body}>Real screens with disposable sample progress. Account and saved study data are never loaded here.</Text>
    <AppearanceControls />
    <AppButton label="Study home" onPress={() => nav.navigate('Home')} />
    <AppButton label="Onboarding flow" tone="secondary" onPress={() => nav.navigate('Intro')} />
    <AppButton label="Boss duel" tone="secondary" onPress={() => start(boss)} />
    <AppButton label="Retry duel · Benny" tone="secondary" onPress={() => { quest.equip('quill'); start(boss); }} />
    <AppButton label="Review duel · Remy" tone="secondary" onPress={() => { quest.hydrate({ completedStops: quest.map.units.slice(0, 4).flatMap(u => u.nodes.map(n => n.id)), equippedId: 'slate' }); start(boss); }} />
    <AppButton label="Lesson and questions" tone="secondary" onPress={() => start(lesson)} />
    <AppButton label="Data question preview" tone="secondary" onPress={() => openSample('ap-biology', 'Data practice', 'Osmosis')} />
    <AppButton label="Code question preview" tone="secondary" onPress={() => openSample('ap-csa', 'Code practice', 'String methods')} />
    <AppButton label="Reading question preview" tone="secondary" onPress={() => openSample('ap-eng-lang', 'Reading practice', 'Rhetorical situation')} />
    <AppButton label="Subjects" tone="secondary" onPress={() => nav.navigate('CourseSelection')} />
    <AppButton label="Pets and bosses" tone="secondary" onPress={() => nav.navigate('Characters')} />
    <AppButton label="Session results" tone="secondary" onPress={() => nav.navigate('LessonComplete', { title: boss.title, correct: 6, total: 8, xp: 45, cleared: true, bossNodeId: boss.id })} />
    <AppButton label="Artwork sheets" tone="secondary" onPress={() => nav.navigate('Artwork')} />
  </ScrollView>;
}
function Artwork() {
  const sheets = { ...BOSS_ART, ...MASCOT_SHEETS, ...Object.fromEntries(Object.entries(AREA_ART).map(([id, source]) => [`area-${id}`, source])), utilities: require('../src/assets/characters/prochoro/utilities.png'), courses: require('../src/assets/characters/prochoro/courses.png'), activities: require('../src/assets/characters/prochoro/activities.png'), companions: require('../src/assets/characters/prochoro/companions.png') };
  const [selected, setSelected] = useState<keyof typeof sheets>('waves');
  return <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: '#FFFFFF' }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{Object.keys(sheets).map(id => <Pressable key={id} accessibilityRole="button" onPress={() => setSelected(id as keyof typeof sheets)} style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}><Text>{id}</Text></Pressable>)}</View>
    <Text>{selected}</Text><Image source={sheets[selected]} resizeMode="contain" style={{ width:'100%',height:500,tintColor:'#000000'}} />
  </ScrollView>;
}
function PreviewHome() {
  return <HomeContent renderOptions={topInset => <ProfileContent topInset={topInset} account={{ user: { user_metadata: { name: 'Your study space' } }, signOut: async () => {}, deleteAccount: async () => false, deleting: false, error: null }} connection={{ offline: false, error: null, notice: null, retry: () => {} }} />} />;
}
function PreviewRoot() {
  const theme = useAppTheme(); const appearance = useAppearancePreference();
  const [loaded] = useFonts({ Figtree_500Medium: require('@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf'), Figtree_600SemiBold: require('@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf'), Figtree_700Bold: require('@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf') });
  if (!loaded) return null;
  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <Seed />
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 36, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
      <Pressable accessibilityRole="button" onPress={() => navigationRef.navigate('PreviewMenu')}><Text style={[theme.typography.caption, { fontSize: 10 }]}>DESIGN PREVIEW · MENU</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Toggle preview appearance" onPress={() => appearance.setPreference(theme.isDark ? 'light' : 'dark')}><Text style={[theme.typography.caption, { fontSize: 10 }]}>{theme.isDark ? 'Switch to light' : 'Switch to dark'}</Text></Pressable>
    </View>
    <NavigationContainer ref={navigationRef} theme={{ ...DefaultTheme, dark: theme.isDark, colors: { ...DefaultTheme.colors, background: theme.colors.background, card: theme.colors.surface, primary: theme.colors.primary, text: theme.colors.ink, border: theme.colors.border } }}>
      <Stack.Navigator initialRouteName="PreviewMenu" screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="PreviewMenu" component={Menu} /><Stack.Screen name="Home" component={PreviewHome} />
        <Stack.Screen name="Artwork" component={Artwork} />
        <Stack.Screen name="Intro" component={IntroScreen} /><Stack.Screen name="CourseSelection" component={CourseSelectionScreen} />
        <Stack.Screen name="SubjectExperience" component={SubjectExperienceScreen} /><Stack.Screen name="GoalScore" component={GoalScoreScreen} />
        <Stack.Screen name="ExamTimeline" component={ExamTimelineScreen} /><Stack.Screen name="AchievementPreview" component={AchievementPreviewScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} /><Stack.Screen name="PlacementResult" component={PlacementResultScreen} />
        <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} /><Stack.Screen name="Characters" component={CharactersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </View>;
}
function DesignPreview() { return <ThemeProvider><SafeAreaProvider><OnboardingProvider><QuestProvider><PreviewRoot /></QuestProvider></OnboardingProvider></SafeAreaProvider></ThemeProvider>; }
registerRootComponent(DesignPreview);
