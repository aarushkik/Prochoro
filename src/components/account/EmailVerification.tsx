import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { AppButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useThemedStyles, type AppTheme } from '@/theme/ThemeProvider';

/** Verification is optional and is never used to unlock study or cloud sync. */
export function EmailVerification({ user }: { user: User | null }) {
  const styles = useThemedStyles(createStyles);
  const [status, setStatus] = useState<'loading' | 'unverified' | 'verified' | 'unavailable'>('loading');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const alive = useRef(true);
  const latch = useRef(false);
  const revision = useRef(0);
  const emailAccount = Boolean(user?.identities?.some(identity => identity.provider === 'email'));

  const request = async (action: 'status' | 'send' | 'verify', signal?: AbortSignal) => {
    if (latch.current && action !== 'status') return;
    const current = ++revision.current;
    latch.current = true; setBusy(true); setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email', { body: { action, ...(action === 'verify' ? { code: code.trim() } : {}) }, timeout: 15000, signal });
      if (signal?.aborted || !alive.current || current !== revision.current) return;
      if (error || typeof data?.verified !== 'boolean') {
        let reason: string | undefined;
        if (error?.context instanceof Response) {
          const payload = await error.context.json().catch(() => null);
          reason = payload?.error;
        }
        if (!alive.current || current !== revision.current) return;
        if (action === 'status') setStatus('unavailable');
        setMessage(reason === 'INVALID_CODE' ? 'That code is incorrect or expired. Try again or send a new one.'
          : reason === 'RATE_LIMITED' ? 'Please wait before requesting another code.'
            : 'Email verification is temporarily unavailable. You can keep studying.');
        return;
      }
      setStatus(data.verified ? 'verified' : 'unverified');
      if (data.verified) { setSent(false); setCode(''); }
      else if (data.sent) { setSent(true); setMessage('Check your email for a verification code.'); }
    } catch {
      if (alive.current && !signal?.aborted && current === revision.current) {
        if (action === 'status') setStatus('unavailable');
        setMessage('We couldn’t reach email verification. You can keep studying.');
      }
    } finally {
      if (current === revision.current) {
        latch.current = false;
        if (alive.current) setBusy(false);
      }
    }
  };
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    if (emailAccount) void request('status', controller.signal);
    return () => { alive.current = false; controller.abort(); };
  }, [user?.id, user?.email, emailAccount]);

  if (!emailAccount) return null;
  return <View style={styles.section}>
    <Text style={styles.title}>{status === 'verified' ? 'Email verified' : status === 'loading' ? 'Checking email status…' : status === 'unavailable' ? 'Email verification unavailable' : 'Email unverified'}</Text>
    <Text style={styles.note}>{status === 'verified' ? 'You’ve confirmed that this email belongs to you.' : 'Verification is optional. You can study and sync your progress without it.'}</Text>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{message}</Text> : null}
    {status === 'unavailable' ? <AppButton label="Check again" tone="secondary" disabled={busy} onPress={() => void request('status')} /> : null}
    {status === 'unverified' ? <>
      {sent ? <>
        <TextInput accessibilityLabel="Email verification code" placeholder="Verification code" placeholderTextColor={styles.input.color} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 10))} maxLength={10} editable={!busy} style={styles.input} onSubmitEditing={() => { if (code.length >= 6) void request('verify'); }} />
        <AppButton label="Verify email" disabled={busy || code.length < 6} onPress={() => void request('verify')} />
      </> : null}
      <AppButton label={sent ? 'Send a new code' : 'Send verification code'} tone="secondary" disabled={busy} onPress={() => void request('send')} />
    </> : null}
  </View>;
}
const createStyles = ({ colors, typography }: AppTheme) => StyleSheet.create({
  section: { gap: 12 }, title: { ...typography.subtitle, fontSize: 14 }, note: { ...typography.caption, fontSize: 12, lineHeight: 18 },
  input: { ...typography.body, color: colors.ink, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 15, minHeight: 52, backgroundColor: colors.surface },
});
