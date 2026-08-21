'use client';

import React, { useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  GameController,
  Cards,
  PlusCircle,
  SignIn,
  SpeakerHigh,
  SpeakerSlash,
  Translate,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { UserIdentity } from '@/components/ui/user-identity';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { cn } from '@/lib/utils';

function subscribeSound(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  window.addEventListener('extratime_sfx_change', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('extratime_sfx_change', cb);
  };
}

function getSoundMutedSnapshot() {
  return sfx.isMuted();
}

function getServerSoundMutedSnapshot() {
  return false;
}

function subscribeGuest(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function getGuestNameSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('extratime_guestName');
  } catch {
    return null;
  }
}

function getServerGuestNameSnapshot() {
  return null;
}

export function Header() {
  const pathname = usePathname();
  const { lang, toggleLang, t } = useI18n();

  const muted = useSyncExternalStore(
    subscribeSound,
    getSoundMutedSnapshot,
    getServerSoundMutedSnapshot,
  );
  const guestName = useSyncExternalStore(
    subscribeGuest,
    getGuestNameSnapshot,
    getServerGuestNameSnapshot,
  );

  const handleToggleSound = useCallback(() => {
    sfx.toggleMute();
    window.dispatchEvent(new Event('extratime_sfx_change'));
  }, []);

  // 4 Primary Navigation Items
  const navLinks = [
    { href: '/', label: t('nav.arena'), icon: GameController },
    { href: '/packs', label: t('nav.packs'), icon: Cards },
    { href: '/create-room', label: t('nav.create'), icon: PlusCircle },
    { href: '/join-room', label: t('nav.join'), icon: SignIn },
  ];

  return (
    <header className="border-border/60 bg-slate-950/80 sticky top-0 z-50 w-full border-b backdrop-blur-2xl select-none">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        {/* Brand Logo - Fixed & Symmetric */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0"
        >
          <div className="shadow-lime/10 ring-lime/20 relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 transition-transform group-hover:scale-105">
            <Image
              src="/ETIcon.png"
              alt="ExtraTime Logo"
              fill
              className="object-contain p-0.5"
              sizes="40px"
              priority
            />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-wider text-white font-stats">
            Extra<span className="text-lime">Time</span>
          </span>
        </Link>

        {/* Center: Apple-style Minimal Desktop Floating Nav (4 clean items) */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/70 p-1 backdrop-blur-md">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all',
                  isActive
                    ? 'bg-lime text-slate-950 shadow-sm'
                    : 'text-steel hover:bg-white/5 hover:text-white',
                )}
              >
                <AppIcon icon={IconComp} size={15} weight={isActive ? 'fill' : 'bold'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Sound + Language + Manager Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-steel hover:border-lime/40 hover:text-white transition-all cursor-pointer"
            title={muted ? t('common.soundMuted') : t('common.soundOn')}
            aria-label={muted ? t('common.soundMuted') : t('common.soundOn')}
          >
            <AppIcon
              icon={muted ? SpeakerSlash : SpeakerHigh}
              size={17}
              weight="bold"
              className={muted ? 'text-rose-400' : 'text-lime'}
            />
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLang}
            className="flex h-9 sm:h-10 items-center gap-1 px-2.5 sm:px-3 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-black uppercase text-steel hover:border-lime/40 hover:text-white transition-all cursor-pointer font-stats"
            title={t('common.language')}
          >
            <AppIcon icon={Translate} size={15} weight="bold" />
            <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          {/* Manager Identity Badge */}
          {guestName && (
            <div className="hidden lg:block">
              <UserIdentity
                nickname={guestName}
                size="sm"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-2.5 py-1"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
