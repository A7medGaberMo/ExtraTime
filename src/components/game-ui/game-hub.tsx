'use client';

import React from 'react';
import type { GameId } from '@/config/games';
import { GAMES } from '@/config/games';
import { GameBadge } from './game-badge';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface GameHubProps {
  game: GameId;
  children: React.ReactNode;
  className?: string;
  /** Extra hub header content (stats, queue pill) rendered under the title. */
  headerExtra?: React.ReactNode;
  /**
   * Optional copy overrides. Omitted → the registry i18n keys are used
   * (titleKey/taglineKey). Supplied → the caller's existing copy is preserved
   * verbatim, so adopting GameHub never rewrites user-facing strings.
   */
  title?: string;
  subtitle?: string;
  /** Badge rendered above the title; defaults to the registry GameBadge. */
  badge?: React.ReactNode;
}

/** Shared hub-page wrapper: data-game scope + registry-driven heading. */
export function GameHub({
  game,
  children,
  className,
  headerExtra,
  title,
  subtitle,
  badge,
}: GameHubProps) {
  const def = GAMES[game];
  const { t } = useI18n();

  return (
    <div data-game={game} className={cn('relative flex w-full flex-col items-center gap-3', className)}>
      <div className="relative z-10 flex w-full flex-col items-center text-center gap-1">
        {badge ?? <GameBadge game={game} size="md" />}
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
          {title ?? t(def.titleKey)}
        </h1>
        <p className="max-w-lg text-xs sm:text-sm text-muted leading-relaxed">
          {subtitle ?? t(def.taglineKey)}
        </p>
        {headerExtra}
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
