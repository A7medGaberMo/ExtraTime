'use client';

import React from 'react';
import type { GameId } from '@/config/games';
import { cn } from '@/lib/utils';

export interface GameShellProps {
  game: GameId;
  /** Top bar slot — rendered above the main area, shrink-0. */
  header?: React.ReactNode;
  /** Main slot — flex-1, min-h-0 so inner regions scroll, never the page. */
  children: React.ReactNode;
  /** Optional bottom slot (tabs, controls) — shrink-0. */
  footer?: React.ReactNode;
  /** Extra classes for the outer stage. */
  className?: string;
  /** Extra classes for the main slot. */
  bodyClassName?: string;
  /** Forced direction; game HUDs default to ltr, text stays RTL-aware. */
  dir?: 'ltr' | 'rtl';
}

/**
 * Shared zero-scroll arena stage.
 *
 * Zero-scroll ownership in this app is layered:
 *  - `MainWrapper` (src/components/layout/main-wrapper.tsx) owns the ROUTE-level
 *    zero-scroll viewport via its path-based `isZeroScrollArena` rule, covering
 *    `/`, `/auction/*`, `/rank/*`, `/bank/*`, `/draft/*` and `/result/*`.
 *  - `GameShell` is the shared STAGE for routes that render their own
 *    full-viewport stage inside that region (currently the Bank arena), so the
 *    stage markup/enforcement exists once instead of per game.
 *
 * Colors come exclusively from theme.css via the data-game scope
 * (--page-bg page tint included).
 */
export function GameShell({
  game,
  header,
  children,
  footer,
  className,
  bodyClassName,
  dir,
}: GameShellProps) {
  return (
    <div
      data-game={game}
      dir={dir}
      style={{ background: 'var(--page-bg)' }}
      className={cn(
        'h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-canvas text-foreground flex flex-col justify-between select-none animate-fade-in pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]',
        className,
      )}
    >
      {header && <div className="shrink-0 relative z-40">{header}</div>}
      <div className={cn('flex-1 min-h-0 w-full relative', bodyClassName)}>{children}</div>
      {footer && <div className="shrink-0 relative z-40">{footer}</div>}
    </div>
  );
}
