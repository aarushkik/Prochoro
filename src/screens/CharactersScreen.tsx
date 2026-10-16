import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Backdrop } from '@/components/ui/Backdrop';
import { TopBackButton } from '@/components/ui';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BossFieldGuide } from '@/components/creatures/BossFieldGuide';
import { PetOptions } from '@/components/home/PetOptions';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

export function CharactersScreen() {
  const theme = useAppTheme(); const styles = useThemedStyles(createStyles);
  const nav = useNavigation(); const route = useRoute<RouteProp<RootStackParamList, 'Characters'>>();
  const [page, setPage] = useState<'companions' | 'bosses'>(route.params?.page ?? 'companions');
  return <SafeAreaView style={styles.root}><Backdrop /><StatusBar style={theme.isDark ? 'light' : 'dark'} />
    <View style={styles.header}><TopBackButton onPress={() => nav.goBack()} /><Text style={styles.title}>{page === 'bosses' ? 'Meet the bosses' : 'Your pets'}</Text></View>
    <View style={styles.tabs}><SegmentedControl items={[{ id: 'companions', label: 'Pets' }, { id: 'bosses', label: 'Bosses' }]} value={page} onChange={setPage} /></View>
    <ScrollView key={page} contentContainerStyle={styles.scroll}>{page === 'bosses' ? <BossFieldGuide /> : <PetOptions />}</ScrollView>
  </SafeAreaView>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 }, title: { ...typography.heading, fontSize: 25, flex: 1 },
  tabs: { paddingHorizontal: 18, paddingBottom: 12 }, scroll: { paddingHorizontal: 18, paddingBottom: 40 },
});
