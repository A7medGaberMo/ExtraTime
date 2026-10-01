'use client';

import React from 'react';
import type { GameId } from '@/config/games';

export interface GameThemeScopeProps {
  /** Game id that drives the [data-game] scope. When undefined, no game
   *  colors are applied (used by routes that learn the game from data). */
  game: GameId | null | undefined;
  children: React.ReactNode;
  className?: string;
}

/**
 * Applies the per-game theme scope. The data-game attribute is the ONLY
 * signal theme.css listens to — switching it re-themes every descendant.
 */
export function GameThemeScope({ game, children, className }: GameThemeScopeProps) {
  return (
    <div data-game={game ?? undefined} className={className}>
      {children}
    </div>
  );
}
