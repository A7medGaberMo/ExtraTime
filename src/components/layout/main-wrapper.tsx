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
        'animate-fade-in mx-auto w-full',
        isGameplay
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-center items-center px-2 py-1 sm:px-4 sm:py-2'
          : 'flex-1 max-w-7xl px-3.5 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16',
      )}
    >
      {children}
    </main>
  );
}
