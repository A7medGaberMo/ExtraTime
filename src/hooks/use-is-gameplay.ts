'use client';

import { usePathname } from 'next/navigation';

/**
 * Returns true if the user is currently inside an active gameplay screen
 * (auction, room lobby, or rank game match).
 */
export function useIsGameplay(): boolean {
  const pathname = usePathname();
  return (
    pathname.startsWith('/auction/') ||
    pathname.startsWith('/room/') ||
    (pathname.startsWith('/rank/') && pathname !== '/rank')
  );
}
