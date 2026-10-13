export interface AppleDeletionProof {
  subject: string;
  nonce: string;
  refreshToken: string;
}

/** Validation must finish before either the Apple grant or the account changes. */
export async function deleteAppleAccount(
  input: { userId: string; appleSubject: string; code: string; nonceHash: string },
  services: {
    exchangeAndVerify: (code: string) => Promise<AppleDeletionProof>;
    revoke: (token: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
  },
): Promise<void> {
  const proof = await services.exchangeAndVerify(input.code);
  if (!input.appleSubject || proof.subject !== input.appleSubject || !input.nonceHash || proof.nonce !== input.nonceHash || !proof.refreshToken) {
    throw new Error('APPLE_IDENTITY_MISMATCH');
  }
  await services.revoke(proof.refreshToken);
  await services.deleteUser(input.userId);
}
