'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameController, Cards, PlusCircle, SignIn } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  // Hide mobile nav during active gameplay to eliminate any overlap or vertical scrolling
  const isGameplay =
    pathname.startsWith('/auction/') ||
    pathname.startsWith('/room/') ||
    (pathname.startsWith('/rank/') && pathname !== '/rank');

  if (isGameplay) {
    return null;
  }

  // Exactly 4 Navigation Tabs Matching Desktop Floating Nav
  const navItems = [
    { label: t('nav.arena'), href: '/', icon: GameController },
    { label: t('nav.packs'), href: '/packs', icon: Cards },
    { label: t('nav.create'), href: '/create-room', icon: PlusCircle },
    { label: t('nav.join'), href: '/join-room', icon: SignIn },
  ];

  return (
    <div
      className="fixed bottom-3 inset-x-3 max-w-md mx-auto z-50 md:hidden select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="flex items-center justify-around rounded-full border border-white/15 bg-slate-950/85 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(149,232,16,0.08)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComp = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-2 text-[11px] font-black transition-all duration-200 active:scale-95',
                isActive
                  ? 'bg-lime text-slate-950 shadow-md shadow-lime/25'
                  : 'text-steel hover:text-white hover:bg-white/5',
              )}
            >
              <AppIcon
                icon={IconComp}
                size={17}
                weight={isActive ? 'fill' : 'bold'}
                className={isActive ? 'text-slate-950' : 'text-steel'}
              />
              <span className="truncate max-w-[70px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
