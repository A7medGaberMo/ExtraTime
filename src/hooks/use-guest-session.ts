'use client';

import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Id } from '../../convex/_generated/dataModel';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('extratime_guestId');
  } catch {
    return null;
  }
}

function getTokenSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('extratime_sessionToken');
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

export function useGuestSession(redirectToHomeIfMissing = false) {
  const router = useRouter();
  const rawId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const sessionToken = useSyncExternalStore(subscribe, getTokenSnapshot, getServerSnapshot);
  const guestId = (rawId as Id<'guestUsers'> | null) ?? null;

  useEffect(() => {
    if (redirectToHomeIfMissing && typeof window !== 'undefined') {
      const stored = localStorage.getItem('extratime_guestId');
      if (!stored) {
        router.push('/');
      }
    }
  }, [redirectToHomeIfMissing, router]);

  const saveGuestSession = useCallback((id: Id<'guestUsers'>, token?: string) => {
    try {
      localStorage.setItem('extratime_guestId', id);
      if (token) {
        localStorage.setItem('extratime_sessionToken', token);
      }
      window.dispatchEvent(new Event('storage'));
    } catch {
      // storage unavailable
    }
  }, []);

  return { guestId, sessionToken, saveGuestSession, saveGuestId: (id: Id<'guestUsers'>) => saveGuestSession(id) };
}

