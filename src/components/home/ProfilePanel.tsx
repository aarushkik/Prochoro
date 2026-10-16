import React from 'react';
import { useAuth } from '@/state/AuthContext';
import { useProfileSync } from '@/state/ProfileSync';
import { ProfileContent } from './ProfileContent';
import { EmailVerification } from '@/components/account/EmailVerification';

/** Connects the profile view to account actions and persisted synchronization. */
export function ProfilePanel({ topInset = 0 }: { topInset?: number }) {
  const account = useAuth();
  const connection = useProfileSync();
  return <ProfileContent topInset={topInset} account={account} connection={connection} verification={<EmailVerification key={account.user?.id + ':' + account.user?.email} user={account.user} />} />;
}
