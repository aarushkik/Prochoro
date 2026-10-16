import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { Session, User } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEY, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { deviceStorage } from '@/lib/storage';
import { authConnectionError, authRedirectURL } from '@/lib/authRedirect';
import { GUEST_MODE_KEY, GUEST_PROFILE_ID, clearProfileCache, flushProfile, prepareProfileExit } from '@/lib/profileCache';

import { AuthFlowError, authErrorMessage as messageFor, authReturnMatches, oncePerAuthReturn, readAuthReturn } from '@/lib/authFlow';
export type AuthProvider = 'google' | 'azure' | 'apple';

/**
 * Sign in with Apple is offered on iOS only, and only through the system
 * sheet.
 *
 * App Store guideline 4.8 requires it on iOS wherever Google or Microsoft
 * sign-in is offered, and the system sheet is what that guideline — and the
 * Human Interface Guidelines' rules for the button — have in mind: Face ID,
 * the student's own Apple ID, no browser. It is also far simpler to run. The
 * native flow hands Supabase an identity token that it verifies against the
 * app's bundle ID. Account deletion additionally needs a server-side signing
 * key to revoke Apple's authorization. The browser flow needs a Services ID and a client
 * secret that Apple expires every six months, after which sign-in silently
 * stops working.
 *
 * The web and Android builds do not offer it: the requirement is the App
 * Store's, and Google, Microsoft and email cover both.
 *
 * The flag keeps it off until the provider is switched on in Supabase, so a
 * build made before that never shows a button that cannot work.
 */
export const appleSignInEnabled =
  Platform.OS === 'ios' && process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === 'true';

/** Whether this device can show the system Apple sheet at all (iOS 13+). */
export async function appleSignInAvailable(): Promise<boolean> {
  if (!appleSignInEnabled) return false;
  try { return await AppleAuthentication.isAvailableAsync(); } catch { return false; }
}

/**
 * The native Apple flow.
 *
 * A random nonce is generated here; Apple receives its SHA-256 hash and signs
 * it into the identity token, and Supabase receives the raw value and checks
 * that it hashes to what Apple signed. That ties the token to this one
 * request, so a token lifted from somewhere else cannot be replayed.
 *
 * Apple shares the student's name only on the very first sign-in, ever — not
 * on later ones, and not after a reinstall — so it is saved to the account
 * the moment it arrives or it is gone for good.
 */
async function signInWithAppleNative(): Promise<'cancelled' | 'done'> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (reason) {
    // Closing the sheet is a normal choice, not an error to show.
    if ((reason as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return 'cancelled';
    throw reason;
  }
  if (!credential.identityToken) throw new Error('Apple did not return a sign-in token. Please try again.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (name) await supabase.auth.updateUser({ data: { full_name: name } }).catch(() => undefined);
  return 'done';
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /**
   * True when this sign-in should take in progress made on this device before
   * an account was required — a guest quest from an earlier version.
   */
  guestUpgrade: boolean;
  restoring: boolean;
  pending: AuthProvider | null;
  emailPending: boolean;
  deleting: boolean;
  recovering: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (provider: AuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  cancelRecovery: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
const unavailable = 'Account services are unavailable in this build.';

export function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  /**
   * Sign-in is required: there is no guest mode. A device that studied as a
   * guest before that keeps its progress, though, and the first sign-in on it
   * brings that progress into the account (ProfileSync does the import and
   * clears the marker). This remembers that the marker was there.
   */
  const deviceQuest = useRef(false);
  const [guestUpgrade, setGuestUpgrade] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [pending, setPending] = useState<AuthProvider | null>(null);
  const [emailPending, setEmailPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    let revision = 0;
    const accept = (next: Session | null) => {
      if (!alive) return;
      if (next) {
        const upgrading = deviceQuest.current;
        setGuestUpgrade((previous) => previous || upgrading);
        deviceQuest.current = false;
        // ProfileSync consumes the persisted guest marker after safely importing.
      }
      setSession(next);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'INITIAL_SESSION') return;
      revision += 1;
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (next || event === 'SIGNED_OUT') accept(next);
    });
    const initialRevision = revision;
    const failsafe = setTimeout(() => {
      if (alive) { setRestoring(false); setError('Restoring your account is taking longer than expected. Try signing in again.'); }
    }, 6000);
    void (async () => {
      try {
        const guestMode = await deviceStorage.getItem(GUEST_MODE_KEY) === 'true';
        const { data, error: restoreError } = await supabase.auth.getSession();
        if (!alive || revision !== initialRevision) return;
        if (restoreError) throw restoreError;
        deviceQuest.current = guestMode && !data.session;
        setGuestUpgrade(guestMode && Boolean(data.session));
        setSession(data.session);
      } catch {
        if (alive) setError('We could not restore your account. Your saved progress has been kept. Try signing in again.');
      } finally {
        clearTimeout(failsafe);
        if (alive) setRestoring(false);
      }
    })();
    const receiveURL = (url: string) => {
      if (!isAuthCallback(url)) return;
      busy.current = true;
      if (alive) setEmailPending(true);
      void completeSignIn(url).then(() => {
        if (alive && isRecoveryURL(url)) setRecovering(true);
      }).catch((reason) => { if (alive) setError(messageFor(reason)); }).finally(() => {
        busy.current = false;
        if (alive) setEmailPending(false);
        if (Platform.OS === 'web') {
          try { window.history.replaceState(null, '', new URL('../../', authRedirectURL('auth/callback')).pathname); } catch { /* A restricted browser must still show the result. */ }
        }
      });
    };
    void Linking.getInitialURL().then((url) => { if (alive && url) receiveURL(url); }).catch(() => {
      if (alive) setError('We could not read the sign-in return link. Please try again.');
    });
    const urlListener = Linking.addEventListener('url', ({ url }) => receiveURL(url));
    const refresh = () => {
      if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    if (Platform.OS !== 'web') refresh();
    const appListener = AppState.addEventListener('change', () => { if (Platform.OS !== 'web') refresh(); });
    return () => {
      alive = false; clearTimeout(failsafe); sub.subscription.unsubscribe();
      urlListener.remove(); appListener.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signIn = useCallback(async (provider: AuthProvider) => {
    if (busy.current) return;
    const connectionProblem = authConnectionError();
    if (connectionProblem) { setError(connectionProblem); return; }
    if (!isSupabaseConfigured) { setError(unavailable); return; }
    busy.current = true; setError(null); setPending(provider);
    try {
      await flushProfile();
      if (provider === 'apple') {
        if (!appleSignInEnabled) throw new Error('Sign in with Apple is not available here.');
        await signInWithAppleNative();
        return;
      }
      const redirectTo = authRedirectURL('auth/callback');
      const { data, error: startError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true, ...(provider === 'azure' ? { scopes: 'email' } : {}) },
      });
      if (startError) throw startError;
      if (!data.url) throw new AuthFlowError('Sign-in could not start. Please try again.');
      if (Platform.OS === 'web') {
        // Same-tab navigation works after PKCE generation and profile flushing;
        // it needs neither popup permission nor an opener/storage handshake.
        window.location.assign(data.url);
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type !== 'success' || !result.url) throw new Error('Sign-in did not complete.');
      await completeSignIn(result.url);
    } catch (reason) { setError(messageFor(reason)); }
    finally { busy.current = false; setPending(null); }
  }, []);

  const emailAction = useCallback(async (kind: 'signIn' | 'signUp' | 'reset' | 'update', email: string, password = ''): Promise<string | null> => {
    if (busy.current) return null;
    const connectionProblem = authConnectionError();
    if (connectionProblem) { setError(connectionProblem); return null; }
    if (!isSupabaseConfigured) { setError(unavailable); return null; }
    const problem = kind === 'update' ? validateNewPassword(password) : validateEmail(email) ??
      (kind === 'signUp' ? validateNewPassword(password) : kind === 'signIn' && !password ? 'Enter your password.' : null);
    if (problem) { setError(problem); return null; }
    busy.current = true; setEmailPending(true); setError(null);
    try {
      await flushProfile();
      if (kind === 'signIn') {
        const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (failure) throw failure;
      } else if (kind === 'signUp') {
        const { data, error: failure } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: authRedirectURL('auth/callback') } });
        if (failure) throw failure;
        if (!data.session) return 'Check your email to confirm your account, then sign in here.';
      } else if (kind === 'reset') {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectURL('auth/recovery') });
        if (failure) throw failure;
        return 'If an account uses that email, a password reset link is on its way. Open it on this device.';
      } else {
        const { error: failure } = await supabase.auth.updateUser({ password });
        if (failure) throw failure;
        setRecovering(false);
      }
      return null;
    } catch (reason) { setError(messageFor(reason)); return null; }
    finally { busy.current = false; setEmailPending(false); }
  }, []);

  const signOut = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setError(null);
    try {
      // A local persistence failure must not silently throw away this session.
      await prepareProfileExit(false);
      const { error: failure } = await supabase.auth.signOut({ scope: 'local' });
      if (failure) {
        await deviceStorage.removeItem(AUTH_STORAGE_KEY);
        await deviceStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);
      }
      await deviceStorage.removeItem(GUEST_MODE_KEY);
      deviceQuest.current = false; setGuestUpgrade(false); setSession(null); setRecovering(false);
    } catch { setError('We could not safely finish signing out. Check your device storage and try again.'); }
    finally { busy.current = false; }
  }, []);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true; setDeleting(true); setError(null);
    try {
      if (!isSupabaseConfigured) throw new Error(unavailable);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error('Not signed in');
      if (user.identities?.some(identity => identity.provider === 'apple')) {
        if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
          setError('To delete this Apple-linked account, open Prochoro on your iPhone or iPad and confirm with Apple.');
          return false;
        }
        const nonce = Crypto.randomUUID();
        let credential: AppleAuthentication.AppleAuthenticationCredential;
        try {
          credential = await AppleAuthentication.signInAsync({
            requestedScopes: [],
            nonce: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce),
          });
        } catch (reason) {
          if ((reason as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return false;
          throw reason;
        }
        if (!credential.authorizationCode) throw new Error('delete_account: Apple confirmation missing');
        const { data, error: failure } = await supabase.functions.invoke('delete-apple-account', {
          body: { authorizationCode: credential.authorizationCode, nonce },
        });
        if (failure || data?.deleted !== true) {
          setError('We couldn’t finish account deletion. Confirm with the Apple account linked to Prochoro and try again. If it continues, contact support. Your study data has not been cleared from this device.');
          return false;
        }
      } else {
        const { error: failure } = await supabase.rpc('delete_account');
        if (failure) throw failure;
      }
      await prepareProfileExit(true);
      // Guest progress from before sign-in was required has no screen of its
      // own any more, so deleting the account is how it gets erased too.
      await clearProfileCache(GUEST_PROFILE_ID);
      await supabase.auth.signOut({ scope: 'local' });
      await deviceStorage.removeItem(AUTH_STORAGE_KEY);
      await deviceStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);
      await deviceStorage.removeItem(GUEST_MODE_KEY);
      deviceQuest.current = false; setSession(null); setGuestUpgrade(false); setRecovering(false);
      return true;
    } catch (reason) { setError(messageFor(reason)); return false; }
    finally { busy.current = false; setDeleting(false); }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, user: session?.user ?? null, guestUpgrade, restoring, pending, emailPending, deleting, recovering, error,
    clearError: () => setError(null), signIn, signOut, deleteAccount,
    signInWithEmail: (email, password) => emailAction('signIn', email, password),
    signUpWithEmail: (email, password) => emailAction('signUp', email, password),
    resetPassword: (email) => emailAction('reset', email),
    updatePassword: (password) => emailAction('update', '', password),
    cancelRecovery: () => setRecovering(false),
  }), [session, guestUpgrade, restoring, pending, emailPending, deleting, recovering, error, signIn, signOut, deleteAccount, emailAction]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const returnTargets = () => [authRedirectURL('auth/callback'), authRedirectURL('auth/recovery')];
function isAuthCallback(url: string): boolean { return authReturnMatches(url, returnTargets()); }
function isRecoveryURL(url: string): boolean { return readAuthReturn(url, returnTargets()).recovery; }
const completeSignIn = oncePerAuthReturn(async (url: string) => {
  const result = readAuthReturn(url, returnTargets());
  const { error } = result.kind === 'code'
    ? await supabase.auth.exchangeCodeForSession(result.code)
    : await supabase.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
  if (error) throw error;
});
function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Enter your email address.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Enter a valid email address.';
}
function validateNewPassword(password: string): string | null { return password.length < 8 ? 'Use a password with at least 8 characters.' : null; }
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProviderComponent');
  return context;
}
