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
        'animate-fade-in mx-auto w-full flex-1',
        isGameplay
          ? 'max-w-4xl px-2 py-1 pb-1 sm:px-4 sm:py-2 flex flex-col'
          : 'max-w-7xl px-3.5 py-4 pb-24 sm:px-6 md:py-6 md:pb-8',
      )}
    >
      {children}
    </main>
  );
}
