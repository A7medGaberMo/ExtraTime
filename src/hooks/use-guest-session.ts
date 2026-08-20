'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Id } from '../../convex/_generated/dataModel';

export function useGuestSession(redirectToHomeIfMissing = false) {
  const router = useRouter();
  const [guestId, setGuestId] = useState<Id<'guestUsers'> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read the persisted id client-only. The server always renders with
  // guestId null, so reading in an effect keeps SSR and the first client
  // render identical (prevents hydration mismatches).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('extratime_guestId');
      if (stored) setGuestId(stored as Id<'guestUsers'>);
    } catch {
      // storage unavailable — stay anonymous
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (redirectToHomeIfMissing && hydrated && !guestId) {
      router.push('/');
    }
  }, [redirectToHomeIfMissing, hydrated, guestId, router]);

  const saveGuestId = (id: Id<'guestUsers'>) => {
    localStorage.setItem('extratime_guestId', id);
    setGuestId(id);
  };

  return { guestId, saveGuestId };
}
