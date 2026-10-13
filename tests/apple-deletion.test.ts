import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAppleAccount, type AppleDeletionProof } from '../supabase/functions/_shared/deleteAppleAccount';

const input = { userId: 'account-a', appleSubject: 'apple-a', code: 'one-use-code', nonceHash: 'request-hash' };
const proof: AppleDeletionProof = { subject: 'apple-a', nonce: 'request-hash', refreshToken: 'apple-refresh' };

test('Apple deletion verifies identity, revokes the grant, then deletes only the authenticated user', async () => {
  const calls: string[] = [];
  await deleteAppleAccount(input, {
    exchangeAndVerify: async code => { assert.equal(code, input.code); calls.push('verify'); return proof; },
    revoke: async token => { assert.equal(token, proof.refreshToken); calls.push('revoke'); },
    deleteUser: async id => { assert.equal(id, input.userId); calls.push('delete'); },
  });
  assert.deepEqual(calls, ['verify', 'revoke', 'delete']);
});

test('another Apple identity, wrong nonce, or missing refresh token cannot revoke or delete', async () => {
  for (const invalid of [{ ...proof, subject: 'apple-b' }, { ...proof, nonce: 'old-request' }, { ...proof, refreshToken: '' }]) {
    await assert.rejects(deleteAppleAccount(input, {
      exchangeAndVerify: async () => invalid,
      revoke: async () => { assert.fail('must not revoke'); },
      deleteUser: async () => { assert.fail('must not delete'); },
    }), /APPLE_IDENTITY_MISMATCH/);
  }
});

test('failed Apple verification or revocation preserves the StudyPlat account', async () => {
  for (const stage of ['verify', 'revoke']) {
    await assert.rejects(deleteAppleAccount(input, {
      exchangeAndVerify: async () => { if (stage === 'verify') throw new Error('verification unavailable'); return proof; },
      revoke: async () => { throw new Error('revocation unavailable'); },
      deleteUser: async () => { assert.fail('must preserve account'); },
    }), /unavailable/);
  }
});
