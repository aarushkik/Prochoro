type Account = { id: string; email: string; emailIdentity: boolean };
export interface EmailVerificationDependencies {
  getUser: (bearer: string) => Promise<Account | null>;
  readProof: (id: string) => Promise<{ email: string } | null>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<{ id: string; email: string } | null>;
  saveProof: (id: string, email: string) => Promise<void>;
}
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
function allowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.origin === 'https://prochoro.net' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  } catch { return false; }
}

/** No identities, tokens, addresses or provider error payloads leave this endpoint. */
export async function handleEmailVerification(request: Request, deps: EmailVerificationDependencies): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', Vary: 'Origin' };
  const reply = (status: number, data: object) => Response.json(data, { status, headers });
  if (origin && !allowedOrigin(origin)) return reply(403, { error: 'ORIGIN_NOT_ALLOWED' });
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return reply(401, { error: 'NOT_SIGNED_IN' });
  try {
    const user = await deps.getUser(bearer);
    if (!user) return reply(401, { error: 'NOT_SIGNED_IN' });
    if (!user.email || !user.emailIdentity) return reply(400, { error: 'EMAIL_ACCOUNT_REQUIRED' });
    const raw = await request.text();
    if (raw.length > 1024) return reply(413, { error: 'REQUEST_TOO_LARGE' });
    let input: { action?: unknown; code?: unknown };
    try { input = JSON.parse(raw); } catch { return reply(400, { error: 'INVALID_REQUEST' }); }
    if (!input || !['status', 'send', 'verify'].includes(String(input.action))) return reply(400, { error: 'INVALID_REQUEST' });
    // Read first: a missing migration must not cause an undeliverable workflow.
    const proof = await deps.readProof(user.id);
    const verified = Boolean(proof && sameEmail(proof.email, user.email));
    if (input.action === 'status' || verified) return reply(200, { verified });
    if (input.action === 'send') {
      await deps.sendCode(user.email);
      return reply(200, { verified: false, sent: true });
    }
    if (typeof input.code !== 'string' || !/^\d{6,10}$/.test(input.code)) return reply(400, { error: 'INVALID_CODE' });
    const verifiedUser = await deps.verifyCode(user.email, input.code);
    if (!verifiedUser || verifiedUser.id !== user.id || !sameEmail(verifiedUser.email, user.email)) return reply(400, { error: 'INVALID_CODE' });
    await deps.saveProof(user.id, user.email);
    return reply(200, { verified: true });
  } catch (reason) {
    const code = (reason as { code?: string })?.code;
    if (code === 'otp_expired' || code === 'otp_disabled' || code === 'bad_code_verifier') return reply(400, { error: 'INVALID_CODE' });
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return reply(429, { error: 'RATE_LIMITED' });
    return reply(503, { error: 'VERIFICATION_UNAVAILABLE' });
  }
}
