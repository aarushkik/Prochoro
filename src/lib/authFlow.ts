/** Only fixed messages reach the UI; provider payloads can contain personal data. */
export class AuthFlowError extends Error {}

export function authErrorMessage(reason: unknown): string {
  if (reason instanceof AuthFlowError) return reason.message;
  const input = reason as { message?: unknown; code?: unknown } | null;
  const raw = `${typeof input?.code === 'string' ? input.code : ''} ${typeof input?.message === 'string' ? input.message : ''}`.slice(0, 8000);
  if (/invalid.login.credentials/i.test(raw)) return 'That email and password don’t match an account.';
  if (/already registered|already exists/i.test(raw)) return 'There is already an account with that email. Try signing in.';
  if (/email.not.confirmed/i.test(raw)) return 'This account still requires email confirmation. Open the original confirmation email, or contact support if it never arrived.';
  if (/AADSTS7000222|AADSTS7000215/i.test(raw)) return 'Microsoft sign-in needs an updated client secret in Supabase. Please contact support or use email.';
  if (/AADSTS50020|AADSTS50194|AADSTS50105|AADSTS700016/i.test(raw)) return 'Microsoft is not allowing this account type. Try another account or email, and contact support.';
  if (/redirect_uri_mismatch|AADSTS50011|redirect.*(mismatch|not allowed|invalid)/i.test(raw)) return 'The sign-in return address is misconfigured. Please contact support or use email.';
  if (/currently being tested|developer.*approved testers|testing.*test users/i.test(raw)) return 'Google is still in Testing and is restricting access. Please use email or contact support.';
  if (/access_denied|not authorized|authorization.*denied/i.test(raw)) return 'Sign-in was cancelled or access was denied. Try again or use email.';
  if (/provider.*(disabled|not enabled|unsupported)|unsupported.provider/i.test(raw)) return 'This sign-in provider is not enabled. Please use email and contact support.';
  if (/rate.limit|too.many.requests|over_email_send_rate_limit/i.test(raw)) return 'Too many attempts. Wait a moment, then try again.';
  if (/expired|code.verifier|flow.state|pkce|bad.code|otp_expired/i.test(raw)) return 'This sign-in link has expired. Start again in the same browser and device.';
  if (/ERR_WEB_BROWSER_BLOCKED/i.test(raw)) return 'Your browser blocked sign-in. Open Prochoro in your regular browser and try again.';
  if (/network|fetch|timeout/i.test(raw)) return 'We couldn’t reach the server. Check your connection and try again.';
  if (/storage|quota|securityerror/i.test(raw)) return 'Your browser could not save the sign-in session. Allow site storage and try again.';
  if (/function|delete_account/i.test(raw)) return 'Account deletion is temporarily unavailable. Please try again or contact support.';
  if (/provider|oauth/i.test(raw)) return 'The sign-in provider could not finish. Try email or contact support.';
  return 'We couldn’t complete that request. Please try again.';
}

const normalizedPath = (path: string) => path.replace(/\/+$/, '') || '/';
export function authReturnMatches(url: string, targets: readonly string[]): boolean {
  try {
    const received = new URL(url);
    const hash = new URLSearchParams(received.hash.slice(1));
    return targets.some(target => {
      const expected = new URL(target);
      if (received.protocol !== expected.protocol || received.host !== expected.host) return false;
      if (normalizedPath(received.pathname) === normalizedPath(expected.pathname)) return true;
      // Supabase falls back to the Site URL when a return URL is missing from
      // its allowlist. Accept that same-origin app root, never an arbitrary URL.
      return normalizedPath(received.pathname) === normalizedPath(new URL('../../', expected).pathname)
        && ['code', 'error', 'error_code', 'access_token'].some(key => received.searchParams.has(key) || hash.has(key));
    });
  } catch { return false; }
}

export function readAuthReturn(url: string, targets: readonly string[]) {
  if (!authReturnMatches(url, targets)) throw new AuthFlowError('This sign-in link is not for Prochoro.');
  const parsed = new URL(url);
  const fragment = new URLSearchParams(parsed.hash.slice(1));
  const get = (key: string) => parsed.searchParams.get(key) ?? fragment.get(key);
  if (get('error') || get('error_code')) {
    throw new AuthFlowError(authErrorMessage(new Error([get('error'), get('error_code'), get('error_description')].filter(Boolean).join(' '))));
  }
  const recovery = /\/auth\/recovery\/?$/.test(parsed.pathname) || get('type') === 'recovery';
  const code = parsed.searchParams.get('code');
  if (code) return { kind: 'code' as const, code, recovery };
  const access_token = fragment.get('access_token');
  const refresh_token = fragment.get('refresh_token');
  if (access_token && refresh_token) return { kind: 'tokens' as const, access_token, refresh_token, recovery };
  throw new AuthFlowError('This sign-in link has expired. Start sign-in again on this device.');
}

/** Both the native browser sheet and deep-link listener may deliver a code. */
export function oncePerAuthReturn<T>(complete: (url: string) => Promise<T>) {
  let last: { url: string; result: Promise<T> } | undefined;
  return (url: string) => {
    if (last?.url === url) return last.result;
    const result = Promise.resolve().then(() => complete(url));
    last = { url, result };
    return result;
  };
}
