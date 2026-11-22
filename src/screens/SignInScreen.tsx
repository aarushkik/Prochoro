import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, type ScrollViewInstance,
  StyleSheet, Text, TextInput, type TextInputInstance, useWindowDimensions, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '@/components/Mascot';
import { AppButton, TopBackButton, Wordmark } from '@/components/ui';
import { AP_DISCLAIMER, links, openLink } from '@/lib/links';
import { fonts } from '@/theme';
import { useAuth } from '@/state/AuthContext';
import { ProviderButton } from '@/components/ui/ProviderButton';
import { AppleSignInButton } from '@/components/ui/AppleSignInButton';
import { apCourses } from '@/data/apCourses';
import { AreaBackdrop } from '@/components/ui/AreaBackdrop';

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const SUBJECTS = (COUNT_WORDS[apCourses.length] ?? String(apCourses.length)) + ' subjects';

type Mode = 'welcome' | 'signIn' | 'signUp' | 'reset';

/** Account entry with native Apple authentication on supported iOS builds. */
export function SignInScreen() {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const {
    signIn, signInWithEmail, signUpWithEmail, emailPending, pending, error, clearError,
    resetPassword, updatePassword, recovering, cancelRecovery, startGuest,
  } = useAuth();
  const { width, height } = useWindowDimensions();
  // iPad and desktop: the welcome splits into a large illustration and the
  // sign-in choices side by side, instead of one narrow phone-sized strip.
  const wide = width >= 820;
  const [mode, setMode] = useState<Mode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const latch = useRef(false);
  const passwordInput = useRef<TextInputInstance>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const busy = pending !== null || emailPending || working;
  const welcome = mode === 'welcome' && !recovering;
  const signingUp = mode === 'signUp';
  const resetting = mode === 'reset';

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [mode, recovering]);

  const changeMode = (next: Mode) => {
    if (busy) return;
    setMode(next); setPassword(''); setConfirmation('');
    clearError(); setNote(null); setLocalError(null);
  };

  const submit = async () => {
    if (latch.current || busy) return;
    clearError(); setNote(null); setLocalError(null);
    if (recovering && password !== confirmation) {
      setLocalError('Your passwords don’t match. Enter the same password in both fields.');
      return;
    }
    latch.current = true; setWorking(true);
    try {
      const message = recovering ? await updatePassword(password)
        : resetting ? await resetPassword(email)
          : signingUp ? await signUpWithEmail(email, password)
            : await signInWithEmail(email, password);
      if (message) setNote(message);
    } finally { latch.current = false; setWorking(false); }
  };

  return (
    <View style={styles.root}>
      <AreaBackdrop kind="waves" opacity={0.1} />
      <StatusBar style={appTheme.isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scroll} contentContainerStyle={[styles.scroll, welcome && styles.welcomeScroll, wide && welcome && styles.wideScroll]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            {welcome ? (
              <>
                <View style={styles.brand}><Wordmark size={28} /></View>
                <View style={wide ? styles.welcomeRow : undefined}>
                <View style={[styles.welcomeBody, wide && styles.welcomeBodyWide]}>
                  <Mascot pose="reading" size={wide ? Math.min(260, height * 0.32) : Math.min(width - 96, height < 700 ? 112 : 156)} shadow={false} />
                  <Text accessibilityRole="header" style={[styles.headline, wide && styles.headlineWide]} accessibilityLabel="AP practice, at your pace.">AP® practice,{'\n'}at your pace.</Text>
                  <Text style={[styles.tagline, wide && styles.taglineWide]}>{SUBJECTS}. Short lessons, thoughtful{'\n'}questions, and a few cute rivals.</Text>
                </View>
                <View style={[styles.actions, wide && styles.actionsWide]}>
                  {/* Apple first: guideline 4.8 wants it at least as prominent as the others. */}
                  <AppleSignInButton disabled={busy} onPress={() => signIn('apple')} />
                  <ProviderButton provider="google" busy={pending === 'google'} disabled={busy} onPress={() => signIn('google')} />
                  <ProviderButton provider="azure" busy={pending === 'azure'} disabled={busy} onPress={() => signIn('azure')} />
                  {error ? <Message text={error} error /> : null}
                  <AppButton label="Continue with email" icon="arrow-right" disabled={busy} onPress={() => changeMode('signIn')} />
                  <Text style={styles.deviceNote}>With an account, your progress syncs across your devices.</Text>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => changeMode('signUp')} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                    <Text style={styles.textButtonLabel}>New here? Create an account</Text>
                  </Pressable>
                  {/* Studying is not an account-based feature, so it never needs
                      one (guideline 5.1.1(v)). Progress stays on this device
                      until the student signs in, then moves into the account. */}
                  <Pressable accessibilityRole="button" accessibilityHint="Your progress is saved on this device" disabled={busy} onPress={() => void startGuest()} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                    <Text style={styles.guestLabel}>Try it without an account</Text>
                  </Pressable>
                </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formTop}>
                  <TopBackButton color={colors.textSecondary} onPress={() => recovering ? cancelRecovery() : changeMode('welcome')} />
                  <Wordmark size={25} />
                  <View style={{ width: 44 }} />
                </View>
                <View style={styles.formHero}>
                  <Mascot size={80} pose={recovering || resetting ? 'thinking' : signingUp ? 'wave' : 'reading'} shadow={false} />
                  <Text accessibilityRole="header" style={styles.formTitle}>{recovering ? 'Set a new password.' : resetting ? 'Forgot your password?' : signingUp ? 'Create your account.' : 'Welcome back.'}</Text>
                  <Text style={styles.tagline}>{recovering ? 'Choose a new password for your account.' : resetting ? 'We’ll email you a link to reset it.' : signingUp ? 'Save your progress and study across devices.' : 'Sign in to pick up where you left off.'}</Text>
                </View>
                <View style={styles.form}>
                  {error || localError ? <Message text={localError ?? error!} error /> : null}
                  {note ? <Message text={note} /> : null}
                  {!recovering && <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" editable={!busy} returnKeyType={resetting ? 'go' : 'next'} onSubmitEditing={resetting ? submit : () => passwordInput.current?.focus()} />}
                  {!resetting || recovering ? <Field inputRef={passwordInput} label={recovering ? 'New password' : 'Password'} value={password} onChangeText={setPassword} placeholder={signingUp || recovering ? 'At least 8 characters' : 'Your password'} secureTextEntry textContentType={signingUp || recovering ? 'newPassword' : 'password'} autoComplete={signingUp || recovering ? 'new-password' : 'current-password'} editable={!busy} onSubmitEditing={recovering ? undefined : submit} returnKeyType={recovering ? 'next' : 'go'} /> : null}
                  {recovering && <Field label="Confirm password" value={confirmation} onChangeText={setConfirmation} placeholder="Enter it again" secureTextEntry textContentType="newPassword" autoComplete="new-password" editable={!busy} onSubmitEditing={submit} returnKeyType="go" />}
                  {/* No password-reset link until the project can send email (custom SMTP). */}
                  <AppButton label={recovering ? 'Save new password' : resetting ? 'Send reset link' : signingUp ? 'Create account' : 'Sign in'} loading={busy} onPress={submit} />
                  {!recovering && <Pressable accessibilityRole="button" disabled={busy} onPress={() => changeMode(signingUp || resetting ? 'signIn' : 'signUp')} style={styles.textButton}>
                    <Text style={styles.textButtonLabel}>{signingUp || resetting ? 'Back to sign in' : 'New here? Create an account'}</Text>
                  </Pressable>}
                </View>
              </>
            )}
            <View style={styles.legal}>
              <Pressable accessibilityRole="link" accessibilityLabel="Read the Terms of Use" onPress={() => openLink(links.terms)} style={styles.legalTarget}><Text style={styles.legalText}>Terms of Use</Text></Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable accessibilityRole="link" accessibilityLabel="Read the Privacy Policy" onPress={() => openLink(links.privacy)} style={styles.legalTarget}><Text style={styles.legalText}>Privacy Policy</Text></Pressable>
            </View>
            <Text style={styles.disclaimer}>{AP_DISCLAIMER}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Message({ text, error = false }: { text: string; error?: boolean }) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  return <View accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.message, error && styles.error]}><Text style={[styles.messageText, error && styles.errorText]}>{text}</Text></View>;
}
function Field({ label, inputRef, ...input }: { label: string; inputRef?: React.RefObject<TextInputInstance | null> } & React.ComponentProps<typeof TextInput>) {
  const appTheme = useAppTheme();
  const { colors, palette, typography, chunky } = appTheme;
  const styles = useThemedStyles(createStyles);

  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput {...input} ref={inputRef} accessibilityLabel={label} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.textFaint} selectionColor={colors.ink} style={[styles.input, focused && styles.inputFocused]} />
  </View>;
}

const createStyles = ({ colors, palette, typography }: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  welcomeScroll: { justifyContent: 'space-between' },
  wideScroll: { maxWidth: 1040, paddingHorizontal: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 56 },
  welcomeBodyWide: { flex: 1.1, paddingVertical: 32 },
  headlineWide: { fontSize: 48, lineHeight: 54, letterSpacing: -1.4 },
  taglineWide: { fontSize: 18, lineHeight: 27, maxWidth: 420 },
  actionsWide: { flex: 1, maxWidth: 420 },
  brand: { alignItems: 'center', gap: 8 },
  edition: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  editionText: { fontFamily: fonts.bodyBlack, fontSize: 9, letterSpacing: 2.1, color: colors.textMuted },
  welcomeBody: { alignItems: 'center', paddingTop: 20, paddingBottom: 26 },
  headline: { fontFamily: fonts.displayBold, color: colors.textPrimary, fontSize: 30, lineHeight: 35, letterSpacing: -0.7, textAlign: 'center', marginTop: 12 },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', maxWidth: 340, marginTop: 12 },
  features: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 13, marginTop: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontFamily: fonts.bodyBold, color: colors.textSecondary, fontSize: 12 },
  featureDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textFaint },
  actions: { gap: 4 },
  deviceNote: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, textAlign: 'center', color: colors.textMuted, marginTop: 8 },
  textButton: { minHeight: 44, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 20, color: colors.textPrimary, textAlign: 'center' },
  guestLabel: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', textDecorationLine: 'underline' },
  pressed: { opacity: 0.65 },
  formTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -8 },
  formHero: { alignItems: 'center', paddingTop: 18, paddingBottom: 26 },
  formTitle: { fontFamily: fonts.displayBold, color: colors.textPrimary, fontSize: 27, lineHeight: 33, textAlign: 'center', marginTop: 12 },
  form: { paddingBottom: 16 },
  or: { fontFamily: fonts.bodyBlack, color: colors.textMuted, fontSize: 10, letterSpacing: 1.6, textAlign: 'center', marginVertical: 14 },
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textPrimary, marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.textPrimary, minHeight: 56 },
  inputFocused: { borderColor: colors.ink, backgroundColor: colors.surfaceSelected },
  message: { padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceSelected, marginBottom: 18 },
  messageText: { fontFamily: fonts.bodySemibold, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  error: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  errorText: { color: colors.dangerDark },
  legal: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  legalTarget: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  legalText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, textDecorationLine: 'underline' },
  legalDot: { color: colors.textFaint },
  disclaimer: { fontFamily: fonts.body, fontSize: 10, lineHeight: 14, color: colors.textMuted, textAlign: 'center', maxWidth: 340, alignSelf: 'center', marginTop: 2 },
});
