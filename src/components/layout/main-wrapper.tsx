'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isGameplay =
    pathname.startsWith('/auction/') ||
    pathname.startsWith('/room/') ||
    (pathname.startsWith('/rank/') && pathname !== '/rank');

  return (
    <main
      className={cn(
        'animate-fade-in mx-auto w-full max-w-full overflow-x-clip flex flex-col items-center',
        isGameplay
          ? 'h-[100dvh] max-h-[100dvh] overflow-y-auto overflow-x-hidden justify-start sm:justify-center px-2 pt-14 pb-3 sm:px-4 sm:pt-16 sm:pb-4'
          : 'flex-1 max-w-5xl px-3 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 justify-start',
      )}
    >
      {children}
    </main>
  );
}
