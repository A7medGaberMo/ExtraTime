'use client';

import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const GUEST_ID_KEY = 'extratime_guestId';
const GUEST_NAME_KEY = 'extratime_guestName';
const SESSION_TOKEN_KEY = 'extratime_sessionToken';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useGuestSession(redirectToHomeIfMissing = false) {
  const router = useRouter();
  const ensureGuest = useMutation(api.guests.mutations.ensure);

  const rawId = useSyncExternalStore(subscribe, () => readStorage(GUEST_ID_KEY), () => null);
  const rawToken = useSyncExternalStore(subscribe, () => readStorage(SESSION_TOKEN_KEY), () => null);
  const guestId = (rawId as Id<'guestUsers'> | null) ?? null;

  useEffect(() => {
    if (redirectToHomeIfMissing && typeof window !== 'undefined' && !readStorage(GUEST_ID_KEY)) {
      router.push('/');
    }
  }, [redirectToHomeIfMissing, router]);

  const saveGuestSession = useCallback((id: Id<'guestUsers'>, token?: string) => {
    try {
      localStorage.setItem(GUEST_ID_KEY, id);
      if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
      window.dispatchEvent(new Event('storage'));
    } catch {
      // storage unavailable
    }
  }, []);

  /**
   * Canonical identity bootstrap: reuses the stored guest when valid,
   * provisions a new one otherwise, and persists id/token/name atomically.
   */
  const ensureGuestId = useCallback(
    async (nickname?: string): Promise<Id<'guestUsers'>> => {
      const res = await ensureGuest({
        existingId: guestId ?? undefined,
        sessionToken: rawToken ?? undefined,
        nickname: nickname?.trim() || 'Guest Manager',
        avatarSeed: nickname?.trim() || 'Guest Manager',
      });
      saveGuestSession(res.guestId, res.sessionToken);
      try {
        localStorage.setItem(GUEST_NAME_KEY, nickname?.trim() || 'Guest Manager');
      } catch {
        // storage unavailable
      }
      return res.guestId;
    },
    [ensureGuest, guestId, rawToken, saveGuestSession],
  );

  return { guestId, sessionToken: rawToken, ensureGuestId, saveGuestSession };
}
