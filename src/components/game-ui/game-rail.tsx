'use client';

import React, { useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, SpeakerHigh, SpeakerSimpleSlash, Translate } from '@phosphor-icons/react';
import type { GameId } from '@/config/games';
import { GameBadge } from './game-badge';
import { AppIcon } from '@/components/ui/app-icon';
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

export interface GameRailProps {
  game: GameId;
  backUrl?: string;
  className?: string;
  /** Extra content rendered in the center (e.g. live score) when needed. */
  center?: React.ReactNode;
  /**
   * Optional slots so game arenas can keep their own controls (room code,
   * player count, sign-out, custom timers) inside the shared rail instead of
   * duplicating the whole bar. Omitted → the standard rail is rendered.
   */
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  /** Hide the default brand badge in the center (custom center in use). */
  hideBrandMark?: boolean;
}

/**
 * Standard game top rail: back, brand logo, centered game badge, and the
 * sound + language controls. Reads icon/title from the game registry and
 * colors from the [data-game] scope.
 */
export function GameRail({
  game,
  backUrl = '/',
  className,
  center,
  leftSlot,
  rightSlot,
  hideBrandMark,
}: GameRailProps) {
  const { lang, toggleLang } = useI18n();

  const muted = useSyncExternalStore(
    subscribeSound,
    () => sfx.isMuted(),
    () => false,
  );

  const handleToggleSound = useCallback(() => {
    sfx.toggleMute();
    window.dispatchEvent(new Event('extratime_sfx_change'));
  }, []);

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-1.5 sm:gap-2 border-b border-line bg-canvas/90 px-2.5 sm:px-4 h-12 sm:h-14 backdrop-blur-xl select-none',
        className,
      )}
      dir="ltr"
    >
      {/* Left: back, plus any game-specific controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {backUrl ? (
          <Link
            href={backUrl}
            className="btn-haptic flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:border-game-accent/40 hover:text-foreground transition-all cursor-pointer shrink-0"
            aria-label="Back"
          >
            <AppIcon icon={ArrowLeft} size={14} weight="bold" className="rtl:rotate-180" />
          </Link>
        ) : (
          <span className="h-8 w-8 shrink-0" />
        )}
        {leftSlot}
      </div>

      {/* Center: logo + game badge (or custom center content) */}
      <div className="flex items-center gap-2 min-w-0">
        {!hideBrandMark && (
          <Link href="/" className="shrink-0" aria-label="ExtraTime">
            <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-1 ring-brand/40 bg-surface shadow-[0_0_8px_var(--game-glow)]">
              <Image src="/ETIcon.png" alt="ExtraTime" width={18} height={18} className="rounded-full object-cover" />
            </span>
          </Link>
        )}
        {center ?? <GameBadge game={game} size="sm" className="hidden xs:inline-flex" />}
      </div>

      {/* Right: sound + language, plus any game-specific controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {rightSlot}
        <button
          type="button"
          onClick={handleToggleSound}
          className="btn-haptic flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:border-game-accent/40 hover:text-foreground transition-all cursor-pointer"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <AppIcon
            icon={muted ? SpeakerSimpleSlash : SpeakerHigh}
            size={14}
            weight="bold"
            className={muted ? 'text-danger' : 'text-game-accent'}
          />
        </button>
        <button
          type="button"
          onClick={toggleLang}
          className="btn-haptic flex h-8 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 text-[10px] font-bold text-muted hover:border-game-accent/40 hover:text-foreground transition-all cursor-pointer font-stats"
        >
          <AppIcon icon={Translate} size={12} weight="bold" />
          <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
        </button>
      </div>
    </div>
  );
}
