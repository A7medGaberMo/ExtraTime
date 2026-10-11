'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  window.addEventListener('extratime_guestName_change', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('extratime_guestName_change', cb);
  };
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
 * Hydration-safe guest nickname state that syncs with localStorage on client
 * while allowing full user editing and randomization without cascading renders.
 */
export function useGuestNickname(defaultFallback = 'Guest') {
  const storedName = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localName, setLocalName] = useState<string | null>(null);

  const nickname = localName !== null ? localName : (storedName || defaultFallback);

  const setNickname = useCallback((name: string) => {
    const trimmed = name.trimStart();
    setLocalName(trimmed);
    try {
      localStorage.setItem('extratime_guestName', trimmed);
      window.dispatchEvent(new Event('extratime_guestName_change'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }, []);

  return [nickname, setNickname] as const;
}
