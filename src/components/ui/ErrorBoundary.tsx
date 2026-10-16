import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import { Mascot } from '@/components/Mascot';
import { AppButton } from './AppButton';

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Prochoro] render crash:', error, info.componentStack);
  }
  render() {
    return this.state.error
      ? <ErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />
      : this.props.children;
  }
}
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const styles = useThemedStyles(createStyles);
  const [details, setDetails] = useState(false);
  return <View style={styles.root}><ScrollView contentContainerStyle={styles.scroll}>
    <Mascot pose="worried" size={120} />
    <Text style={styles.title}>Let’s try that again.</Text>
    <Text style={styles.body}>This screen couldn’t open. Your previously saved progress is safe.</Text>
    <View style={styles.actions}><AppButton label="Try again" onPress={onRetry} /></View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} style={styles.details}><Text style={styles.detailLabel}>{details ? 'Hide details' : 'Show details for support'}</Text></Pressable>
    {details ? <Text selectable style={styles.message}>{error.message || String(error)}</Text> : null}
  </ScrollView></View>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 16, width: '100%', maxWidth: 500, alignSelf: 'center' },
  title: { ...typography.title, textAlign: 'center' },
  body: { ...typography.body, textAlign: 'center' },
  actions: { alignSelf: 'stretch', marginTop: 8 },
  details: { minHeight: 44, justifyContent: 'center' },
  detailLabel: { ...typography.caption, textDecorationLine: 'underline' },
  message: { ...typography.caption, color: colors.ink, alignSelf: 'stretch', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
});
