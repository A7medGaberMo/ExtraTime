'use client';

import React, { useState, useSyncExternalStore, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  PlusCircle,
  SpeakerHigh,
  SpeakerSimpleSlash,
  Translate,
  X,
  CaretDown,
  User,
  SignIn,
  Cards,
  Ranking,
  Lightning,
  Crosshair,
  Vault,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { useOverlayActive } from '@/lib/overlay-state';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { cn } from '@/lib/utils';

function subscribeSound(cb: () => void) {
  if (typeof window === 'undefined') return () => { };
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
  if (typeof window === 'undefined') return () => { };
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
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const notchRef = useRef<HTMLDivElement>(null);
  const isGameplay = useIsGameplay();
  const isOverlayActive = useOverlayActive();

  // Close island automatically on route changes during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

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

  const { guestId } = useGuestSession(false);
  const activeMatch = useQuery(
    api.rooms.queries.getUserActiveMatch,
    guestId ? { guestId } : 'skip',
  );

  const isInCurrentActiveMatch = activeMatch ? pathname.includes(activeMatch.id) : false;
  const showActivePill = activeMatch && !isInCurrentActiveMatch;

  const handleToggleSound = useCallback(() => {
    sfx.toggleMute();
    window.dispatchEvent(new Event('extratime_sfx_change'));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notchRef.current && !notchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const navLinks = [
    { href: '/', label: t('nav.arena'), icon: House },
    { href: '/packs', label: t('nav.packs'), icon: Cards },
    { href: '/create-room', label: t('nav.create'), icon: PlusCircle },
    { href: '/join-room', label: t('nav.join'), icon: SignIn },
  ];

  const gameChannels = [
    {
      id: 'snipe',
      label: lang === 'ar' ? 'سنايب' : 'Snipe',
      href: '/create-room?mode=snipe',
      icon: Crosshair,
      color: 'gold',
      isActive: pathname === '/' || pathname.includes('mode=snipe') || pathname.startsWith('/auction'),
    },
    {
      id: 'rank',
      label: lang === 'ar' ? 'رتّب' : 'Rank',
      href: '/rank',
      icon: Ranking,
      color: 'gold',
      isActive: pathname.startsWith('/rank') || pathname.includes('mode=rank'),
    },
    {
      id: 'draft',
      label: lang === 'ar' ? 'اكسترا درافت' : 'Extra Draft',
      href: '/draft',
      icon: Lightning,
      color: 'gold',
      isActive: pathname.startsWith('/draft'),
    },
    {
      id: 'bank',
      label: lang === 'ar' ? 'بَنِّك' : 'Bank It',
      href: '/bank',
      icon: Vault,
      color: 'gold',
      isActive: pathname.startsWith('/bank'),
    },
  ];

  if (isOverlayActive || isGameplay) {
    return null;
  }

  return (
    <header className="fixed top-[max(0.375rem,env(safe-area-inset-top,0.375rem))] inset-x-0 z-50 flex justify-center pointer-events-none select-none px-2 sm:px-3 w-full" dir="ltr">
      <div ref={notchRef} className="pointer-events-auto max-w-[calc(100vw-1rem)] flex flex-col items-center">
        <AnimatePresence initial={false} mode="wait">
          {!isOpen ? (
            /* ── Collapsed Dynamic Island Capsule ── */
            <motion.div
              key="collapsed-notch"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/10 bg-slate-950/92 px-1.5 sm:px-2.5 py-0.5 shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all max-w-[calc(100vw-1rem)]',
                isGameplay ? 'hover:border-gold/40 cursor-pointer' : '',
              )}
            >
              {/* Brand Logo & Name */}
              <Link
                href="/"
                className="flex items-center gap-1.5 group transition-opacity hover:opacity-90 shrink-0"
              >
                <div className="relative flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-gold/40 bg-slate-900/90 shadow-[0_0_8px_rgba(229,184,66,0.3)] group-hover:scale-105 transition-transform p-0.5">
                  <Image
                    src="/ETIcon.png"
                    alt="ExtraTime"
                    width={18}
                    height={18}
                    className="rounded-full object-cover shrink-0"
                  />
                </div>
                <span className="font-stats font-bold text-[11.5px] sm:text-xs text-white tracking-wider">
                  Extra<span className="text-gold">Time</span>
                </span>
              </Link>

              {/* Desktop Center Nav Tabs */}
              {!isGameplay && (
                <nav className="hidden md:flex items-center gap-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] p-0.5 ml-0.5 mr-0.5">
                  {navLinks.map((item) => {
                    const isActive = pathname === item.href;
                    const IconComp = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold transition-colors',
                          isActive
                            ? 'bg-gold text-slate-950 font-bold shadow-sm'
                            : 'text-steel hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <AppIcon icon={IconComp} size={11} weight={isActive ? 'fill' : 'bold'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Live Match Notch Dot / Pill */}
              {showActivePill && (
                <Link
                  href={
                    activeMatch.type === 'snipe'
                      ? `/auction/${activeMatch.id}`
                      : activeMatch.type === 'rank'
                        ? `/rank/${activeMatch.id}`
                        : activeMatch.type === 'draft'
                          ? `/draft/${activeMatch.id}`
                          : `/bank/${activeMatch.id}`
                  }
                  className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-gold shadow-[0_0_8px_rgba(229,184,66,0.35)] transition-all animate-pulse shrink-0 cursor-pointer sm:px-2 hover:bg-gold/25"
                  title="Resume live match"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                  </span>
                  <span className="font-stats text-[10px] font-bold">
                    {lang === 'ar' ? 'الماتش لايف' : 'LIVE'}
                  </span>
                </Link>
              )}

              {/* Right Fast Action Pills */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-0.5">
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="btn-haptic flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-steel hover:border-gold/40 hover:text-white transition-all cursor-pointer"
                  title={muted ? t('common.soundMuted') : t('common.soundOn')}
                  aria-label={muted ? t('common.soundMuted') : t('common.soundOn')}
                >
                  <AppIcon
                    icon={muted ? SpeakerSimpleSlash : SpeakerHigh}
                    size={12}
                    weight="bold"
                    className={muted ? 'text-rose-400' : 'text-gold'}
                  />
                </button>

                {/* Language Switcher */}
                <button
                  type="button"
                  onClick={toggleLang}
                  className="btn-haptic flex h-6 sm:h-6.5 items-center gap-0.5 rounded-full px-1.5 border border-white/10 bg-white/5 text-[9.5px] font-bold text-steel hover:border-gold/40 hover:text-white transition-all cursor-pointer font-stats"
                  title={t('common.language')}
                >
                  <AppIcon icon={Translate} size={11} weight="bold" />
                  <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
                </button>

                {/* Menu Expander / Arrow */}
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="btn-haptic md:hidden flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-steel hover:text-white hover:border-gold/40 transition-all cursor-pointer"
                  title="Expand Navigation Island"
                >
                  <AppIcon icon={CaretDown} size={11} weight="bold" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Expanded Island Control Center ── */
            <motion.div
              key="expanded-island"
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="w-[calc(100vw-1.5rem)] max-w-[390px] rounded-3xl border border-white/12 bg-slate-950/98 p-3.5 sm:p-4 shadow-[0_24px_56px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
            >
              {/* Header inside Island */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-2.5">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 group"
                >
                  <div className="relative flex h-6.5 w-6.5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-gold/40 bg-slate-900/90 shadow-[0_0_10px_rgba(229,184,66,0.35)] p-0.5 group-hover:scale-105 transition-transform">
                    <Image
                      src="/ETIcon.png"
                      alt="ExtraTime"
                      width={24}
                      height={24}
                      className="rounded-full object-cover shrink-0"
                    />
                  </div>
                  <span className="font-stats font-bold text-[13px] text-white tracking-wider">
                    Extra<span className="text-gold">Time</span>
                  </span>
                </Link>

                <div className="flex items-center gap-1.5">
                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="btn-haptic flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-steel hover:text-white transition-colors cursor-pointer"
                    title={muted ? t('common.soundMuted') : t('common.soundOn')}
                  >
                    <AppIcon
                      icon={muted ? SpeakerSimpleSlash : SpeakerHigh}
                      size={14}
                      weight="bold"
                      className={muted ? 'text-rose-400' : 'text-gold'}
                    />
                  </button>

                  {/* Language Toggle */}
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="btn-haptic flex h-8 items-center gap-1 rounded-lg px-2.5 border border-white/10 bg-white/5 text-[11px] font-bold text-steel hover:text-white transition-colors cursor-pointer font-stats"
                    title={t('common.language')}
                  >
                    <AppIcon icon={Translate} size={13} weight="bold" />
                    <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-haptic flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-steel hover:text-white transition-colors cursor-pointer ml-0.5"
                    title="Close"
                  >
                    <AppIcon icon={X} size={14} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Guest Manager Handle Tag */}
              {guestName && (
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5 text-steel text-xs font-semibold font-stats">
                    <AppIcon icon={User} size={13} weight="bold" className="text-gold" />
                    <span className="text-white truncate max-w-[160px]">{guestName}</span>
                  </div>
                  <span className="font-stats text-[11px] font-semibold text-gold">
                    Manager
                  </span>
                </div>
              )}

              {/* Active Match Card inside Expanded Island */}
              {showActivePill && (
                <Link
                  href={
                    activeMatch.type === 'snipe'
                      ? `/auction/${activeMatch.id}`
                      : activeMatch.type === 'rank'
                        ? `/rank/${activeMatch.id}`
                        : activeMatch.type === 'draft'
                          ? `/draft/${activeMatch.id}`
                          : `/bank/${activeMatch.id}`
                  }
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-gold/40 p-3 mb-2.5 group hover:border-gold transition-all cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">
                        {activeMatch.type === 'snipe'
                          ? 'Snipe Match'
                          : activeMatch.type === 'rank'
                            ? 'Rank Duel'
                            : activeMatch.type === 'draft'
                              ? 'Draft Duel'
                              : 'Bank It Duel'}{' '}
                        ({activeMatch.code})
                      </div>
                      <div className="truncate text-[11px] font-semibold text-gold-light">
                        {activeMatch.status === 'waiting'
                          ? (lang === 'ar' ? 'في انتظار المنافس...' : 'Waiting for rival...')
                          : (lang === 'ar' ? 'الماتش جاري الآن — اضغط للمتابعة' : 'Match in progress — Tap to resume')}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-gold px-2.5 py-1 text-[11px] font-bold text-slate-950">
                    {lang === 'ar' ? 'دخول' : 'Resume'}
                  </span>
                </Link>
              )}

              {/* 4 Main Games Grid in Expanded Island */}
              <div className="space-y-1 mb-2.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-steel px-1">
                  {lang === 'ar' ? 'ألعاب إكسترا تايم الرئيسية' : 'Main Match Arenas'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {gameChannels.map((game) => {
                    const IconComp = game.icon;
                    return (
                      <Link
                        key={game.id}
                        href={game.href}
                        onClick={() => setIsOpen(false)}
                        className="btn-haptic flex flex-col items-center justify-center gap-1 rounded-2xl border border-gold/30 bg-gold/10 hover:border-gold hover:bg-gold/20 p-2 text-center transition-all cursor-pointer group"
                      >
                        <AppIcon
                          icon={IconComp}
                          size={18}
                          weight="bold"
                          className="text-gold"
                        />
                        <span className="text-xs font-bold text-white tracking-tight">{game.label}</span>
                        <span className="text-[9px] text-steel">{lang === 'ar' ? 'دخول ولعب' : 'Create & Play'}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation 3-Box Grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {navLinks.slice(1).map((item) => {
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="btn-haptic flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.06] bg-slate-900/80 py-2 sm:py-2.5 px-0.5 text-center text-steel hover:border-gold/40 hover:text-white transition-all cursor-pointer group"
                    >
                      <AppIcon icon={IconComp} size={17} weight="bold" className="text-steel group-hover:text-gold transition-colors" />
                      <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-full">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Join with code quick link */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
                <Link
                  href="/join-room"
                  onClick={() => setIsOpen(false)}
                  className="btn-haptic flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-steel hover:text-gold hover:border-gold/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <AppIcon icon={SignIn} size={14} weight="bold" />
                  <span>{t('nav.join')} (Room Code)</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
