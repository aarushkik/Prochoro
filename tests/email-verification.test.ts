import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { handleEmailVerification, type EmailVerificationDependencies } from '../supabase/functions/_shared/emailVerification';

const account = { id: 'account-a', email: 'a@example.test', emailIdentity: true };
const request = (body: object, origin = 'https://prochoro.net', token = 'session') => new Request('https://example.test/verify-email', { method: 'POST', headers: { origin, authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
const dependencies = (changes: Partial<EmailVerificationDependencies> = {}): EmailVerificationDependencies => ({
  getUser: async token => token === 'session' ? account : null,
  readProof: async () => null,
  sendCode: async () => { assert.fail('must not send unsolicited email'); },
  verifyCode: async () => { assert.fail('must not verify without a code'); },
  saveProof: async () => { assert.fail('must not save without email proof'); }, ...changes,
});
test('checking verification sends no email and ignores implicit confirmation or client-supplied verified flags', async () => {
  const response = await handleEmailVerification(request({ action: 'status', verified: true, userId: 'someone-else' }), dependencies());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { verified: false });
  const changedEmail = await handleEmailVerification(request({ action: 'status' }), dependencies({ readProof: async () => ({ email: 'old@example.test' }) }));
  assert.deepEqual(await changedEmail.json(), { verified: false });
});
test('verification uses only the authenticated identity and server-validated single-use OTP proof', async () => {
  const calls: string[] = [];
  const response = await handleEmailVerification(request({ action: 'verify', code: '123456', email: 'attacker@test', userId: 'attacker' }), dependencies({
    verifyCode: async (email, code) => { assert.equal(email, account.email); assert.equal(code, '123456'); calls.push('verified'); return account; },
    saveProof: async (id, email) => { assert.equal(id, account.id); assert.equal(email, account.email); calls.push('saved'); },
  }));
  assert.deepEqual(calls, ['verified', 'saved']); assert.deepEqual(await response.json(), { verified: true });
});
test('wrong account, wrong email, expired/reused OTP and malformed codes cannot mark an email verified', async () => {
  for (const proof of [null, { ...account, id: 'other' }, { ...account, email: 'other@example.test' }]) {
    const response = await handleEmailVerification(request({ action: 'verify', code: '123456' }), dependencies({ verifyCode: async () => proof }));
    assert.equal(response.status, 400);
  }
  const expired = await handleEmailVerification(request({ action: 'verify', code: '123456' }), dependencies({ verifyCode: async () => { throw { code: 'otp_expired' }; } }));
  assert.equal(expired.status, 400);
  assert.equal((await handleEmailVerification(request({ action: 'verify', code: '<script>' }), dependencies())).status, 400);
});
test('only a requested send reaches the current mailbox; missing deployment never sends mail', async () => {
  let sent = 0;
  const deps = dependencies({ sendCode: async email => { assert.equal(email, account.email); sent++; } });
  assert.equal((await handleEmailVerification(request({ action: 'send', email: 'other@test' }), deps)).status, 200);
  assert.equal(sent, 1);
  assert.equal((await handleEmailVerification(request({ action: 'send' }), { ...deps, readProof: async () => { throw new Error('missing table'); } })).status, 503);
  assert.equal(sent, 1);
});
test('endpoint rejects unauthenticated users and lookalike origins, with safe CORS preflight', async () => {
  assert.equal((await handleEmailVerification(request({ action: 'status' }, 'https://prochoro.net', 'invalid'), dependencies())).status, 401);
  assert.equal((await handleEmailVerification(request({ action: 'status' }, 'https://prochoro.net.attacker.test'), dependencies())).status, 403);
  const preflight = await handleEmailVerification(new Request('https://example.test', { method: 'OPTIONS', headers: { origin: 'https://prochoro.net' } }), dependencies());
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://prochoro.net');
});
test('PostgreSQL: verification migration is repeatable, clients cannot forge or read proof, deletion cascades', async () => {
  const db = await PGlite.create();
  try {
    await db.exec('create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create role service_role bypassrls;');
    const sql = readFileSync(new NodeURL('../supabase/migrations/202610160001_optional_email_verification.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql);
    const id = '10000000-0000-4000-8000-000000000001';
    await db.exec(`insert into auth.users values ('${id}'); set role service_role; insert into public.email_verifications(user_id,email) values ('${id}','a@example.test'); reset role;`);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role};`);
      await assert.rejects(db.query('select * from public.email_verifications'), /permission denied/);
      await assert.rejects(db.query(`update public.email_verifications set email='forged@test'`), /permission denied/);
      await db.exec('reset role;');
    }
    await db.exec(`delete from auth.users where id='${id}';`);
    assert.equal((await db.query('select * from public.email_verifications')).rows.length, 0);
  } finally { await db.close(); }
});
