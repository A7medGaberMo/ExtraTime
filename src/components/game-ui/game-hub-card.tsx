'use client';

import React from 'react';
import type { GameId } from '@/config/games';
import { GAMES } from '@/config/games';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface GameHubCardProps extends React.HTMLAttributes<HTMLDivElement> {
  game: GameId;
  title: string;
  description?: string;
  /** Rendered under the description (selectors, previews). */
  selectorSlot?: React.ReactNode;
  /** Action buttons area. */
  actionsSlot?: React.ReactNode;
  /** Secondary links row. */
  secondaryLinksSlot?: React.ReactNode;
}

/** Hub section card (Public Match / Private / Join) with registry icon. */
export function GameHubCard({
  game,
  title,
  description,
  selectorSlot,
  actionsSlot,
  secondaryLinksSlot,
  className,
  children,
  ...props
}: GameHubCardProps) {
  const def = GAMES[game];

  return (
    <div
      className={cn(
        'card-sheen rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4 backdrop-blur-2xl shadow-elev-2',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-game-accent/40 bg-game-accent/10 text-game-accent shadow-[0_0_16px_var(--game-glow)]">
          <AppIcon icon={def.icon} size={18} weight="fill" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
            {title}
          </h2>
          {description && (
            <p className="text-[11px] sm:text-xs text-muted leading-snug mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {selectorSlot && <div className="w-full">{selectorSlot}</div>}

      {actionsSlot && <div className="w-full space-y-2">{actionsSlot}</div>}

      {secondaryLinksSlot && (
        <div className="flex w-full items-center justify-between gap-2 pt-0.5">{secondaryLinksSlot}</div>
      )}

      {children}
    </div>
  );
}

/** Convenience: localized game tagline for hub cards. */
export function useGameTagline(game: GameId): string {
  const { t } = useI18n();
  return t(GAMES[game].taglineKey);
}
