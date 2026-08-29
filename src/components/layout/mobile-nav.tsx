'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Trophy, ShieldCheck, Cards } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const isGameplay = useIsGameplay();
  const { t } = useI18n();

  // Hide mobile nav during active gameplay to eliminate any overlap or vertical scrolling
  if (isGameplay) {
    return null;
  }

  // 4 Core Pillars Matching Desktop Header
  const navItems = [
    { label: t('nav.arena') || 'Arena', href: '/', icon: House },
    { label: t('nav.rank') || 'Rank', href: '/rank', icon: Trophy },
    { label: t('leagues.title') || 'Leagues', href: '/leagues', icon: ShieldCheck },
    { label: t('nav.packs') || 'Packs', href: '/packs', icon: Cards },
  ];

  return (
    <div
      className="fixed bottom-3 inset-x-3 max-w-md mx-auto z-50 md:hidden select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="flex items-center justify-around rounded-full border border-white/12 bg-slate-950/90 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const IconComp = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-2 text-xs font-semibold font-stats transition-all duration-150 active:scale-95',
                isActive
                  ? 'bg-lime text-slate-950 shadow-sm'
                  : 'text-steel hover:text-white hover:bg-white/5',
              )}
            >
              <AppIcon
                icon={IconComp}
                size={16}
                weight={isActive ? 'fill' : 'bold'}
                className={isActive ? 'text-slate-950' : 'text-steel'}
              />
              <span className="truncate max-w-[65px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
