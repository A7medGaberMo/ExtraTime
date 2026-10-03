'use client';

import React, { useSyncExternalStore, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SpeakerHigh,
  SpeakerSimpleSlash,
  Translate,
  ArrowLeft,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useOverlayActive } from '@/lib/overlay-state';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { cn } from '@/lib/utils';
import { type GameId } from '@/config/games';

/** Per-game accent colors matching theme.css single source of truth */
export const GAME_ACCENT_COLORS: Record<GameId, string> = {
  snipe: '#fbbf24', // Snipe amber
  rank: '#22d3ee',  // Rank cyan
  draft: '#34d399', // Draft emerald
  bank: '#fb7185',  // Bank rose
};

export const DEFAULT_BRAND_COLOR = '#e5b842'; // ExtraTime gold

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

export interface HeaderProps {
  className?: string;
  gameId?: GameId;
  centerContent?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  forceVisible?: boolean;
}

export function Header({
  className,
  gameId: explicitGameId,
  centerContent,
  showBack,
  onBack,
  backHref,
  forceVisible = false,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLang, t } = useI18n();
  const isOverlayActive = useOverlayActive();
  const isGameplay = useIsGameplay();

  const muted = useSyncExternalStore(
    subscribeSound,
    getSoundMutedSnapshot,
    getServerSoundMutedSnapshot,
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

  // 1. Detect game from explicit prop or URL pathname
  const urlGameId: GameId | null =
    explicitGameId ??
    (pathname.startsWith('/bank')
      ? 'bank'
      : pathname.startsWith('/rank')
        ? 'rank'
        : pathname.startsWith('/draft')
          ? 'draft'
          : pathname.startsWith('/auction') || pathname.startsWith('/room') || pathname.startsWith('/snipe')
            ? 'snipe'
            : null);

  // 2. Detect active game mode dynamically selected on Home page or elsewhere in DOM
  const [domGameId, setDomGameId] = useState<GameId | null>(null);

  useEffect(() => {
    if (urlGameId) return;

    const checkDomGame = () => {
      const el = document.querySelector('main [data-game]') || document.querySelector('[data-game]:not(header)');
      if (el) {
        const g = el.getAttribute('data-game') as GameId | null;
        if (g && (g === 'snipe' || g === 'rank' || g === 'draft' || g === 'bank')) {
          setDomGameId((prev) => (prev !== g ? g : prev));
          return;
        }
      }
      setDomGameId((prev) => (prev !== null ? null : prev));
    };

    const rafId = requestAnimationFrame(checkDomGame);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-game' &&
          mutation.target !== document.querySelector('header')
        ) {
          const targetEl = mutation.target as Element;
          const g = targetEl.getAttribute('data-game') as GameId | null;
          if (g && (g === 'snipe' || g === 'rank' || g === 'draft' || g === 'bank')) {
            setDomGameId((prev) => (prev !== g ? g : prev));
            return;
          }
        }
      }
      checkDomGame();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-game'],
      subtree: true,
      childList: true,
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [pathname, urlGameId]);

  // Unified active game id
  const activeGameId: GameId | null = urlGameId ?? domGameId;
  const currentAccent = (activeGameId && GAME_ACCENT_COLORS[activeGameId]) || DEFAULT_BRAND_COLOR;

  // Determine if back button should be shown
  const isNotHome = pathname !== '/';
  const shouldShowBack = showBack ?? (isNotHome && (pathname.includes('/[') || pathname.split('/').length > 2));

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else if (activeGameId && pathname !== `/${activeGameId}`) {
      router.push(`/${activeGameId}`);
    } else {
      router.push('/');
    }
  };

  // If overlay modal is open or inside active gameplay (unless explicitly forced), hide
  if ((isOverlayActive || isGameplay) && !forceVisible) {
    return null;
  }

  return (
    <header
      dir="ltr"
      className={cn(
        'fixed top-[max(0.5rem,env(safe-area-inset-top,0.5rem))] inset-x-0 z-50 flex w-full justify-center pointer-events-none select-none px-2 sm:px-4 transition-all bg-transparent',
        className,
      )}
      data-game={activeGameId ?? undefined}
    >
      {/* ── Glass Capsule with Dynamic Game Border (NO Background fill) ── */}
      <div
        dir="ltr"
        className="et-header-capsule pointer-events-auto relative w-full max-w-[480px] sm:max-w-lg md:max-w-xl h-13 sm:h-14 rounded-full px-3.5 sm:px-4 flex items-center justify-between gap-2 backdrop-blur-md"
        style={{
          ['--hdr-accent' as string]: `var(--game-accent, ${currentAccent})`,
          backgroundColor: 'transparent',
          borderColor: `color-mix(in srgb, var(--game-accent, ${currentAccent}) 50%, rgba(255, 255, 255, 0.12))`,
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: `0 4px 20px -2px color-mix(in srgb, var(--game-accent, ${currentAccent}) 15%, transparent), inset 0 1px 0 0 rgba(255, 255, 255, 0.14)`,
        }}
      >
        {/* Specular Traveling Border Light — animated slow gold light along the border */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1.5px] overflow-hidden rounded-full">
          <div
            className="et-header-light h-full w-28 rounded-full blur-[0.5px] motion-reduce:hidden"
            style={{
              background: `linear-gradient(90deg, transparent 0%, var(--game-accent, ${currentAccent}) 50%, transparent 100%)`,
            }}
          />
        </div>

        {/* ── LEFT: Fixed Logo & Brand Name on LEFT in BOTH languages ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          {shouldShowBack && (
            <button
              type="button"
              onClick={handleBackClick}
              aria-label={t('common.back')}
              title={t('common.back')}
              className="et-header-btn flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full cursor-pointer shrink-0"
            >
              <AppIcon icon={ArrowLeft} size={15} weight="bold" className="et-hdr-icon et-hdr-icon-back" />
            </button>
          )}

          <Link
            href="/"
            aria-label={`${t('common.appName')} — ${t('nav.home')}`}
            className="et-header-brand flex items-center gap-2 rounded-full shrink-0 select-none focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div
              className="et-header-logo relative flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 p-0.5 shadow-sm"
              style={{
                borderColor: `color-mix(in srgb, var(--game-accent, ${currentAccent}) 60%, transparent)`,
                boxShadow: `0 0 10px color-mix(in srgb, var(--game-accent, ${currentAccent}) 30%, transparent)`,
                backgroundColor: 'rgba(11, 15, 23, 0.6)',
              }}
            >
              <Image
                src="/ETIcon.png"
                alt=""
                width={26}
                height={26}
                className="rounded-full object-cover shrink-0"
              />
            </div>
            <span
              className="et-header-wordmark text-xs sm:text-[13px] text-foreground flex items-center"
              lang="en"
              dir="ltr"
            >
              <span>Extra</span>
              <span className="et-header-wordmark-accent ml-0.5">Time</span>
            </span>
          </Link>
        </div>

        {/* ── CENTER: Spacious Notification & Live Match Slot ── */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2 overflow-hidden">
          {centerContent ? (
            centerContent
          ) : showActivePill ? (
            /* Live Match Notification Banner / Pill */
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
              className="et-header-live btn-haptic inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1 text-xs font-bold truncate max-w-full shadow-sm"
              style={{
                borderColor: `color-mix(in srgb, var(--game-accent, ${currentAccent}) 60%, transparent)`,
                backgroundColor: `color-mix(in srgb, var(--game-accent, ${currentAccent}) 16%, transparent)`,
                color: `var(--game-accent, ${currentAccent})`,
                boxShadow: `0 0 12px color-mix(in srgb, var(--game-accent, ${currentAccent}) 25%, transparent)`,
              }}
              title={t('common.resumeMatch')}
              aria-label={`${t('common.liveMatch')} — ${t('common.resumeMatch')}`}
            >
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span
                  className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: `var(--game-accent, ${currentAccent})` }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: `var(--game-accent, ${currentAccent})` }}
                />
              </span>
              <span
                className="font-stats uppercase text-[10px] sm:text-[11px] font-black tracking-wider truncate"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                {t('common.liveMatch')}
              </span>
              <span className="hidden xs:inline-block text-[10px] opacity-75 font-mono" dir="ltr">
                ({activeMatch.code})
              </span>
            </Link>
          ) : null}
        </div>

        {/* ── RIGHT: Sound Toggle & Language Switcher on RIGHT in BOTH languages ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="et-header-btn flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full cursor-pointer"
            title={muted ? t('common.soundMuted') : t('common.soundOn')}
            aria-label={muted ? t('common.soundMuted') : t('common.soundOn')}
            aria-pressed={!muted}
          >
            <AppIcon
              key={muted ? 'muted' : 'on'}
              icon={muted ? SpeakerSimpleSlash : SpeakerHigh}
              size={14}
              weight="bold"
              className={cn('et-hdr-pop', muted ? 'text-danger' : 'transition-colors duration-500')}
              style={!muted ? { color: `var(--game-accent, ${currentAccent})` } : undefined}
            />
          </button>

          {/* Language Switcher Button — label shows the TARGET language in its own script */}
          <button
            type="button"
            onClick={toggleLang}
            className="et-header-btn flex h-7.5 sm:h-8 items-center gap-1.5 rounded-full px-2.5 sm:px-3 text-[10px] sm:text-[11px] cursor-pointer"
            title={t('common.switchLanguage')}
            aria-label={t('common.switchLanguage')}
          >
            <AppIcon icon={Translate} size={13} weight="bold" className="et-hdr-icon et-hdr-icon-tilt" />
            <span
              key={lang}
              className="et-hdr-lang-label"
              lang={lang === 'en' ? 'ar' : 'en'}
              dir={lang === 'en' ? 'rtl' : 'ltr'}
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
