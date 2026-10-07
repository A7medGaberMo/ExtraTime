'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { cn } from '@/lib/utils';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const isGameplay = useIsGameplay();
  const pathname = usePathname();
  const isZeroScrollArena =
    pathname === '/' ||
    pathname === '/snipe' ||
    pathname === '/draft' ||
    (pathname.startsWith('/draft/') && pathname !== '/draft') ||
    pathname.startsWith('/auction/') ||
    (pathname.startsWith('/rank/') && pathname !== '/rank') ||
    (pathname.startsWith('/bank/') && pathname !== '/bank') ||
    pathname.startsWith('/result/');

  const isHubPage =
    pathname === '/rank' ||
    pathname === '/bank' ||
    pathname === '/create-room' ||
    pathname === '/join-room';

  return (
    <main
      className={cn(
        'animate-fade-in mx-auto w-full max-w-full overflow-x-clip flex flex-col items-center',
        isZeroScrollArena
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden justify-between p-0'
          : isGameplay
            ? 'h-[100dvh] max-h-[100dvh] overflow-y-auto overflow-x-hidden justify-start sm:justify-center px-1.5 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-2 sm:pb-4'
            : isHubPage
              ? 'flex-1 w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl px-2 sm:px-4 lg:px-8 xl:px-12 pt-11 sm:pt-13 pb-2 sm:pb-3 justify-start'
              : 'flex-1 w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl px-2 sm:px-4 lg:px-8 xl:px-12 pt-11 sm:pt-13 pb-2 sm:pb-3 justify-start',
      )}
    >
      {children}
    </main>
  );
}
