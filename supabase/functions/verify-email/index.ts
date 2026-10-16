import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { handleEmailVerification } from '../_shared/emailVerification.ts';

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error('CONFIGURATION_MISSING');
  return value;
};
const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

Deno.serve(async request => {
  // Construct lazily so CORS preflight and unauthenticated requests work even
  // when configuration is incomplete. Service credentials stay on the server.
  const admin = () => createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth });
  return handleEmailVerification(request, {
    getUser: async bearer => {
      const { data: { user }, error } = await admin().auth.getUser(bearer);
      if (error || !user?.email) return null;
      return { id: user.id, email: user.email, emailIdentity: Boolean(user.identities?.some(identity => identity.provider === 'email')) };
    },
    readProof: async id => {
      const { data, error } = await admin().from('email_verifications').select('email').eq('user_id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    sendCode: async email => {
      const client = createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), { auth });
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
    },
    verifyCode: async (email, token) => {
      const client = createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), { auth });
      const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      try {
        if (error) throw error;
        return data.user?.email ? { id: data.user.id, email: data.user.email } : null;
      } finally {
        // Revoke only this temporary proof session, never the caller's session.
        if (data.session) await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
    },
    saveProof: async (user_id, email) => {
      const { error } = await admin().from('email_verifications').upsert({ user_id, email, verified_at: new Date().toISOString() });
      if (error) throw error;
    },
  });
});
