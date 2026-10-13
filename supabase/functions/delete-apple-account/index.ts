import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'npm:jose@6.1.3';
import { deleteAppleAccount } from '../_shared/deleteAppleAccount.ts';

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const reply = (status: number, error?: string) => Response.json(error ? { error } : { deleted: true }, { status });
const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error('CONFIGURATION_MISSING');
  return value;
};

// Native iOS only. The gateway also verifies the JWT; getUser checks the live
// account and derives the deletion target. No client-supplied user ID is used.
Deno.serve(async (request) => {
  if (request.method !== 'POST') return reply(405, 'METHOD_NOT_ALLOWED');
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return reply(401, 'NOT_SIGNED_IN');
  try {
    const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await admin.auth.getUser(bearer);
    if (error || !user) return reply(401, 'NOT_SIGNED_IN');
    const appleSubject = user.identities?.find(identity => identity.provider === 'apple')?.identity_data?.sub;
    if (typeof appleSubject !== 'string') return reply(400, 'APPLE_IDENTITY_REQUIRED');
    const body = await request.text();
    if (body.length > 10000) return reply(413, 'REQUEST_TOO_LARGE');
    let input: { authorizationCode?: unknown; nonce?: unknown };
    try { input = JSON.parse(body); } catch { return reply(400, 'INVALID_REQUEST'); }
    if (!input || typeof input.authorizationCode !== 'string' || input.authorizationCode.length < 1 || input.authorizationCode.length > 4096 || typeof input.nonce !== 'string' || input.nonce.length < 16 || input.nonce.length > 128) return reply(400, 'INVALID_REQUEST');
    const clientId = required('APPLE_CLIENT_ID');
    const privateKey = await importPKCS8(required('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'), 'ES256');
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: required('APPLE_KEY_ID') })
      .setIssuer(required('APPLE_TEAM_ID')).setSubject(clientId)
      .setAudience('https://appleid.apple.com').setIssuedAt().setExpirationTime('5m').sign(privateKey);
    const nonceBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.nonce));
    const nonceHash = Array.from(new Uint8Array(nonceBytes), byte => byte.toString(16).padStart(2, '0')).join('');
    await deleteAppleAccount({ userId: user.id, appleSubject, code: input.authorizationCode, nonceHash }, {
      exchangeAndVerify: async (code) => {
        const response = await fetch('https://appleid.apple.com/auth/token', {
          method: 'POST', signal: AbortSignal.timeout(15000),
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
        });
        if (!response.ok) throw new Error('APPLE_EXCHANGE_FAILED');
        const token = await response.json();
        if (typeof token.id_token !== 'string' || typeof token.refresh_token !== 'string') throw new Error('APPLE_EXCHANGE_FAILED');
        const { payload } = await jwtVerify(token.id_token, appleKeys, { algorithms: ['RS256'], issuer: 'https://appleid.apple.com', audience: clientId, requiredClaims: ['sub', 'iat', 'exp', 'nonce'], maxTokenAge: '5m', clockTolerance: 10 });
        return { subject: payload.sub ?? '', nonce: typeof payload.nonce === 'string' ? payload.nonce : '', refreshToken: token.refresh_token };
      },
      revoke: async (token) => {
        const response = await fetch('https://appleid.apple.com/auth/revoke', {
          method: 'POST', signal: AbortSignal.timeout(15000),
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token, token_type_hint: 'refresh_token' }),
        });
        if (!response.ok) throw new Error('APPLE_REVOCATION_FAILED');
      },
      deleteUser: async (id) => {
        const { error: deletionError } = await admin.auth.admin.deleteUser(id);
        if (deletionError) throw new Error('ACCOUNT_DELETE_FAILED');
      },
    });
    return reply(200);
  } catch (reason) {
    // Never log or echo authorization codes, tokens, Apple claims, or keys.
    if (reason instanceof Error && reason.message === 'APPLE_IDENTITY_MISMATCH') return reply(403, 'APPLE_IDENTITY_MISMATCH');
    return reply(503, 'ACCOUNT_DELETION_UNAVAILABLE');
  }
});
