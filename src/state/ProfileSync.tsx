import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { EMPTY_PROFILE, fetchProfile, saveProfile, type Profile } from '@/lib/profile';
import { GUEST_MODE_KEY, GUEST_PROFILE_ID, clearProfileCache, readProfileCache, registerProfileWriter, writeProfileCache, type CachedProfile } from '@/lib/profileCache';
import { mergeGuestProfile, mergeProfile } from '@/lib/profileMerge';
import { deviceStorage } from '@/lib/storage';
import { createSaveQueue } from '@/lib/saveQueue';
import * as Crypto from 'expo-crypto';
import { useAuth } from './AuthContext';
import { useOnboarding } from './OnboardingContext';
import { useQuest } from './QuestContext';

interface ProfileSyncValue {
  loading: boolean;
  offline: boolean;
  /** No trusted local or remote profile exists. Never allow an empty overwrite. */
  blocked: boolean;
  error: string | null;
  notice: string | null;
  retry: () => void;
}
const ProfileSyncContext = createContext<ProfileSyncValue>({ loading: true, offline: false, blocked: false, error: null, notice: null, retry: () => undefined });

export function ProfileSync({ children }: { children: React.ReactNode }) {
  const { user, guestUpgrade } = useAuth();
  const onboarding = useOnboarding();
  const quest = useQuest();
  const id = user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const controls = useRef({ onboarding, quest });
  controls.current = { onboarding, quest };
  const writer = useRef<{ id: string; update: (profile: Profile) => void; flush: () => Promise<void> } | null>(null);
  const retry = useCallback(() => {
    // Never replace a live, unsaved snapshot with an older copy from disk.
    if (writer.current) void writer.current.flush().catch(() => undefined);
    else setAttempt((n) => n + 1);
  }, []);

  const snapshot = useMemo<Profile>(() => ({
    courseId: onboarding.courseId,
    experienceLevelId: onboarding.experienceLevelId,
    goalScoreId: onboarding.goalScoreId,
    examTimeframeId: onboarding.examTimeframeId,
    placementLevelId: onboarding.placementLevelId,
    onboarded: onboarding.onboarded,
    xp: quest.xp,
    gems: quest.gems,
    streakDays: quest.storedStreakDays,
    lastSessionOn: quest.lastSessionOn,
    completedStops: quest.earned,
    skills: quest.skills,
    todayCount: quest.storedTodayCount,
    sessions: quest.sessions,
    perfectSessions: quest.perfectSessions,
    bestStreak: quest.bestStreak,
    equippedId: quest.equippedId,
    streakShieldUsed: quest.streakShieldUsed,
  }), [onboarding.courseId, onboarding.experienceLevelId, onboarding.goalScoreId, onboarding.examTimeframeId, onboarding.placementLevelId, onboarding.onboarded, quest.xp, quest.gems, quest.storedStreakDays, quest.lastSessionOn, quest.earned, quest.skills, quest.storedTodayCount, quest.sessions, quest.perfectSessions, quest.bestStreak, quest.equippedId, quest.streakShieldUsed]);

  useEffect(() => {
    let alive = true;
    let cache: CachedProfile | null = null;
    let remoteKnown = false;
    let networkOffline = false;
    let localFailure = false;
    const markNetwork = (ok: boolean) => { networkOffline = !ok; if (alive) setOffline(networkOffline || localFailure); };
    const localWrites = createSaveQueue<CachedProfile>(async (value) => {
      try {
        await writeProfileCache(id!, value);
        localFailure = false;
        if (alive) { setError(null); setOffline(networkOffline); }
      } catch (reason) {
        localFailure = true;
        if (alive) { setOffline(true); setError('Your device could not save your latest progress. Keep the app open, free some storage, and retry.'); }
        throw reason;
      }
    });
    let remoteWrite: Promise<void> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let unregister: (() => void) | undefined;
    writer.current = null;
    setOffline(false);
    setBlocked(false);
    setError(null);
    setNotice(null);
    setLoading(Boolean(id));
    controls.current.onboarding.reset();
    controls.current.quest.reset();
    if (!id) return;

    const hydrate = (p: Profile) => {
      controls.current.onboarding.hydrate({
        courseId: p.courseId,
        experienceLevelId: p.experienceLevelId as never,
        goalScoreId: p.goalScoreId as never,
        examTimeframeId: p.examTimeframeId as never,
        placementLevelId: p.placementLevelId as never,
        onboarded: p.onboarded,
      });
      controls.current.quest.hydrate({ ...p, todayCount: p.todayCount ?? 0 });
    };
    const persist = () => {
      if (!alive || !cache) return;
      void localWrites.save({ ...cache }).catch(() => undefined);
    };
    const stop = () => {
      alive = false;
      if (timer) clearTimeout(timer);
      if (writer.current?.id === id) writer.current = null;
    };
    const flush = async () => {
      if (!alive) return;
      if (timer) clearTimeout(timer);
      await localWrites.flush();
      if (remoteWrite) { await remoteWrite; return flush(); }
      if (!cache?.dirty) return;
      remoteWrite = (async () => {
        // After a failed first read, re-read before any write. No cache means
        // the navigator stays on a recoverable error instead of onboarding.
        if (!remoteKnown && !cache?.pendingMutation) {
          const result = await fetchProfile(id);
          if (!alive) return;
          if (!result.ok) { markNetwork(false); return; }
          const remote = result.profile ?? EMPTY_PROFILE;
          cache = { ...cache!, version: 1, profile: mergeProfile(cache!.profile, cache!.baseline, remote), baseline: remote, dirty: true };
          remoteKnown = true;
          hydrate(cache.profile);
          persist();
        }
        if (!alive || !cache) return;
        if (!cache.pendingMutation) {
          cache = { ...cache, pendingMutation: { id: Crypto.randomUUID(), profile: cache.profile, baseline: cache.baseline ?? EMPTY_PROFILE } };
          persist();
          // Never send a new mutation until its retry ID is durable locally.
          await localWrites.flush();
        }
        const pending = cache.pendingMutation!;
        const result = await saveProfile(id, pending.profile, pending.baseline, pending.id);
        if (!alive) return;
        markNetwork(result.ok);
        if (result.ok && result.profile && cache) {
          const merged = mergeProfile(cache.profile, pending.profile, result.profile);
          cache = { ...cache, profile: merged, baseline: result.profile, pendingMutation: undefined, dirty: JSON.stringify(merged) !== JSON.stringify(result.profile) };
          hydrate(merged);
          persist();
          if (cache.dirty) timer = setTimeout(() => { void flush().catch(() => undefined); }, 900);
        }

      })().finally(() => { remoteWrite = null; });
      await remoteWrite;
    };

    void (async () => {
      try {
        cache = await readProfileCache(id);
        if (!alive) return;
        const result = await fetchProfile(id);
        if (!alive) return;
        remoteKnown = result.ok;
        markNetwork(result.ok);
        if (result.ok) {
          const remote = result.profile ?? EMPTY_PROFILE;
          cache = { ...cache, version: 1, profile: cache?.pendingMutation ? cache.profile : cache?.dirty ? mergeProfile(cache.profile, cache.baseline, remote) : remote, baseline: cache?.pendingMutation ? cache.baseline : remote, dirty: cache?.dirty ?? !result.profile };
        } else if (!cache) {
          setBlocked(true);
          setLoadedId(id);
          setError('We could not load your saved progress. Reconnect and try again.');
          setLoading(false);
          return;
        }
        if (guestUpgrade && result.ok) {
          const guest = await readProfileCache(GUEST_PROFILE_ID);
          if (!alive) return;
          if (guest?.guestId && !cache!.importedGuestIds?.includes(guest.guestId)) {
            const imported = mergeGuestProfile(guest.profile, cache!.profile, EMPTY_PROFILE);
            if (imported) {
              cache = { ...cache!, profile: imported, dirty: true, importedGuestIds: [...(cache!.importedGuestIds ?? []), guest.guestId] };
              // Commit the imported ID with the data before clearing its
              // source. Reopening after interruption cannot double rewards.
              await writeProfileCache(id, cache);
              await clearProfileCache(GUEST_PROFILE_ID);
              setNotice('Your device quest is now connected to your account.');
            } else {
              setNotice('Your account already follows a different course, so we opened that one. Progress from before you signed in on this device was not merged into it.');
            }
          }
          await deviceStorage.removeItem(GUEST_MODE_KEY);
        }
        hydrate(cache!.profile);
        persist();
        writer.current = {
          id,
          update(profile) {
            if (!alive || !cache || JSON.stringify(profile) === JSON.stringify(cache.profile)) return;
            cache = { ...cache, profile, dirty: true };
            // Save locally on every committed change; only network traffic is
            // debounced. Closing the app during the debounce preserves work.
            persist();
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => { void flush().catch(() => undefined); }, 900);
          },
          flush,
        };
        unregister = registerProfileWriter({ id, flush, stop, drain: localWrites.flush });
        setLoading(false);
        setLoadedId(id);
        if (cache?.dirty) void flush().catch(() => undefined);
      } catch {
        if (alive) {
          setBlocked(true);
          setLoadedId(id);
          setError('Your saved progress could not be opened safely. Try again to keep your existing progress.');
          setLoading(false);
        }
      }
    })();
    const foreground = AppState.addEventListener('change', (state) => {
      if (!cache) return;
      void (async () => {
        await flush();
        if (state !== 'active' || !alive || cache?.dirty) return;
        const baselineAtFetch = cache.baseline;
        const result = await fetchProfile(id);
        if (!alive || !cache) return;
        markNetwork(result.ok);
        if (result.ok && result.profile && !cache.pendingMutation && cache.baseline === baselineAtFetch) {
          const merged = mergeProfile(cache.profile, cache.baseline, result.profile);
          cache = { ...cache, profile: merged, baseline: result.profile };
          hydrate(merged);
          persist();
        }
      })().catch(() => undefined);
    });
    const retryTimer = setInterval(() => { if (alive && cache && AppState.currentState === 'active') void flush().catch(() => undefined); }, 20000);
    return () => {
      stop();
      unregister?.();
      foreground.remove();
      clearInterval(retryTimer);
    };
  }, [id, attempt]);

  useEffect(() => {
    if (!loading && !blocked && writer.current?.id === id) writer.current.update(snapshot);
  }, [snapshot, id, loading, blocked]);

  return <ProfileSyncContext.Provider value={{ loading: loading || (id !== null && loadedId !== id), offline, blocked, error, notice, retry }}>{children}</ProfileSyncContext.Provider>;
}

export function useProfileSync(): ProfileSyncValue { return useContext(ProfileSyncContext); }
