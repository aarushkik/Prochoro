import React from 'react';
import { useAuth } from '@/state/AuthContext';
import { useProfileSync } from '@/state/ProfileSync';
import { ProfileContent } from './ProfileContent';

/**
 * Connects the profile view to account actions and persisted synchronization.
 * Email verification returns once the project can send email (custom SMTP).
 */
export function ProfilePanel({ topInset = 0 }: { topInset?: number }) {
  const account = useAuth();
  const connection = useProfileSync();
  return <ProfileContent topInset={topInset} account={account} connection={connection} />;
}
