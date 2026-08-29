'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function getSnapshot() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('extratime_guestName') || '';
  } catch {
    return '';
  }
}

function getServerSnapshot() {
  return '';
}

/**
 * Identity Hook: Returns authenticated user displayName when signed in.
 * Only falls back to guest storage and custom guest nickname when signed out.
 */
export function useGuestNickname(defaultFallback = 'Guest') {
  const { isSignedIn, user } = useUser();
  const viewer = useQuery(api.users.queries.viewer);

  const storedName = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localName, setLocalName] = useState<string | null>(null);

  const authenticatedName =
    viewer?.displayName || user?.fullName || user?.firstName || user?.username;

  // When signed in, prioritize authenticated display name over guest random names
  const nickname = isSignedIn && authenticatedName
    ? authenticatedName
    : localName !== null
      ? localName
      : (storedName || defaultFallback);

  const setNickname = useCallback((name: string) => {
    setLocalName(name);
  }, []);

  return [nickname, setNickname] as const;
}
