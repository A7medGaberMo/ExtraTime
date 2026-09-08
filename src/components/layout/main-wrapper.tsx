'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { cn } from '@/lib/utils';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const isGameplay = useIsGameplay();
  const pathname = usePathname();
  const isZeroScrollArena =
    (pathname.startsWith('/draft/') && pathname !== '/draft') ||
    pathname.startsWith('/auction/') ||
    (pathname.startsWith('/rank/') && pathname !== '/rank') ||
    pathname.startsWith('/result/');

  return (
    <main
      className={cn(
        'animate-fade-in mx-auto w-full max-w-full overflow-x-clip flex flex-col items-center',
        isZeroScrollArena
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden justify-between p-0'
          : isGameplay
            ? 'h-[100dvh] max-h-[100dvh] overflow-y-auto overflow-x-hidden justify-start sm:justify-center px-1.5 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-4'
            : 'flex-1 max-w-5xl px-3 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8 md:pb-12 justify-start',
      )}
    >
      {children}
    </main>
  );
}
