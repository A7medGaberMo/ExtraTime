'use client';

import { useEffect, useState } from 'react';

/**
 * Shared countdown — single source of truth for every timer in the app.
 * Returns whole seconds remaining (never negative); 0 when no deadline.
 */
export function useCountdown(
  deadline: number | null | undefined,
  { onExpire, intervalMs = 250 }: { onExpire?: () => void; intervalMs?: number } = {},
): number {
  const [remainingMs, setRemainingMs] = useState(() =>
    deadline ? Math.max(0, deadline - Date.now()) : 0,
  );

  useEffect(() => {
    if (!deadline) {
      return;
    }

    let expired = false;
    const tick = () => {
      const next = Math.max(0, deadline - Date.now());
      setRemainingMs(next);
      if (next === 0 && !expired) {
        expired = true;
        onExpire?.();
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
    // onExpire is intentionally excluded — callers pass stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, intervalMs]);

  return deadline ? Math.ceil(remainingMs / 1000) : 0;
}
