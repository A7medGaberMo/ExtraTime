'use client';

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Headless background WebSocket heartbeat ping.
 * Automatically pings the server every 5 seconds decoupled completely from user interaction.
 */
export function useBankHeartbeat(
  gameId: Id<'bankGames'> | undefined,
  guestId: Id<'guestUsers'> | null,
  sessionToken: string | null,
  isActive: boolean
) {
  const ping = useMutation(api.bank.mutations.heartbeatPing);

  useEffect(() => {
    if (!gameId || !guestId || !isActive) return;

    const doPing = () => {
      void ping({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
    };

    // Fire immediately on mount / activation
    doPing();

    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      // 30 seconds when active/visible, 60 seconds when hidden/background
      const delay = (typeof document !== 'undefined' && document.visibilityState === 'hidden') 
        ? 60000 
        : 30000;
        
      timer = setTimeout(() => {
        doPing();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        doPing();
        scheduleNext();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [gameId, guestId, sessionToken, isActive, ping]);
}
