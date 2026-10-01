'use client';

import React from 'react';
import type { GameId } from '@/config/games';
import { GAMES } from '@/config/games';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface GameBadgeProps {
  game: GameId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

/** Small pill identifying a game: icon + localized title from the registry. */
export function GameBadge({ game, size = 'md', className, iconOnly = false }: GameBadgeProps) {
  const def = GAMES[game];
  const { t } = useI18n();

  const sizeStyles = {
    sm: 'gap-1 rounded-full px-2 py-0.5 text-[10px]',
    md: 'gap-1.5 rounded-full px-2.5 py-1 text-[11px]',
    lg: 'gap-2 rounded-2xl px-3.5 py-1.5 text-xs',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center border border-game-accent/30 bg-game-accent/10 font-bold tracking-wide text-game-accent backdrop-blur-xl shadow-[0_0_12px_var(--game-glow)]',
        sizeStyles,
        className,
      )}
    >
      <AppIcon icon={def.icon} size={size === 'sm' ? 12 : 14} weight="fill" className="shrink-0" />
      {!iconOnly && <span className="truncate">{t(def.titleKey)}</span>}
    </span>
  );
}
