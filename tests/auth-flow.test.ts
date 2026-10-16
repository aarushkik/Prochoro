import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, authReturnMatches, oncePerAuthReturn, readAuthReturn } from '../src/lib/authFlow';

const targets = ['https://prochoro.net/app/auth/callback/', 'https://prochoro.net/app/auth/recovery/'];
test('PKCE returns accept the app callback and Site URL fallback, but reject other hosts and paths', () => {
  assert.deepEqual(readAuthReturn(targets[0] + '?code=one-use', targets), { kind: 'code', code: 'one-use', recovery: false });
  assert.equal(authReturnMatches('https://prochoro.net/app/auth/callback?code=a', targets), true);
  assert.equal(authReturnMatches('https://prochoro.net/app/?code=a', targets), true);
  for (const url of ['https://prochoro.net.attacker.test/app/auth/callback/?code=a', 'http://prochoro.net/app/auth/callback/?code=a', 'https://prochoro.net/elsewhere/?code=a', 'https://prochoro.net/app/', 'invalid']) {
    assert.equal(authReturnMatches(url, targets), false);
    assert.throws(() => readAuthReturn(url, targets), /not for Prochoro/);
  }
});
test('recovery and existing implicit email links retain their purpose without exposing tokens', () => {
  assert.equal(readAuthReturn(targets[1] + '?code=reset', targets).recovery, true);
  const result = readAuthReturn(targets[0] + '#access_token=access&refresh_token=refresh&type=recovery', targets);
  assert.equal(result.kind, 'tokens'); assert.equal(result.recovery, true);
  assert.throws(() => readAuthReturn(targets[0] + '#access_token=partial', targets), /expired/);
});
test('provider callback errors are visible, actionable and never echo arbitrary descriptions', () => {
  assert.throws(() => readAuthReturn(targets[0] + '?error=server_error&error_description=AADSTS7000222%20private-detail', targets), /updated client secret/);
  assert.throws(() => readAuthReturn(targets[0] + '#error=access_denied&error_description=private-user-email', targets), /access was denied/);
  const message = authErrorMessage(new Error('unknown private-token-and-email'));
  assert.equal(message.includes('private'), false);
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /requires email confirmation/);
  assert.match(authErrorMessage(new Error('AADSTS50011')), /return address/);
  assert.match(authErrorMessage(new Error('AADSTS50020')), /account type/);
});
test('native sheet and deep link share one exchange, including failures; a new code can retry', async () => {
  let exchanges = 0;
  const complete = oncePerAuthReturn(async (url: string) => { exchanges++; if (url === 'bad') throw new Error('expired'); return url; });
  assert.deepEqual(await Promise.all([complete('a'), complete('a')]), ['a', 'a']);
  assert.equal(exchanges, 1);
  const failed = await Promise.allSettled([complete('bad'), complete('bad')]);
  assert.ok(failed.every(result => result.status === 'rejected')); assert.equal(exchanges, 2);
  assert.equal(await complete('b'), 'b'); assert.equal(exchanges, 3);
});
