'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crosshair, Ranking, Cards, PlusCircle, SignIn } from '@phosphor-icons/react';
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

  // Exactly 5 Navigation Tabs Covering Both Games & Key Actions
  const navItems = [
    { label: t('nav.arena'), href: '/', icon: Crosshair },
    { label: t('nav.rank'), href: '/rank', icon: Ranking },
    { label: t('nav.packs'), href: '/packs', icon: Cards },
    { label: t('nav.create'), href: '/create-room', icon: PlusCircle },
    { label: t('nav.join'), href: '/join-room', icon: SignIn },
  ];

  return (
    <aside
      aria-label="Mobile Navigation"
      className="fixed bottom-[max(0.625rem,env(safe-area-inset-bottom,0.625rem))] inset-x-2.5 max-w-lg mx-auto z-40 md:hidden select-none"
    >
      <nav className="flex items-center justify-around gap-1 rounded-full border border-white/[0.12] bg-slate-950/92 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const IconComp = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'btn-haptic flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 px-1 text-[10px] font-semibold transition-all duration-150 active:scale-95',
                isActive
                  ? 'bg-lime text-slate-950 shadow-[0_2px_12px_rgba(142,224,0,0.35)] font-bold'
                  : 'text-steel hover:text-white hover:bg-white/5',
              )}
            >
              <AppIcon
                icon={IconComp}
                size={16}
                weight={isActive ? 'fill' : 'bold'}
                className={isActive ? 'text-slate-950' : 'text-steel'}
              />
              <span className="truncate max-w-[58px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

