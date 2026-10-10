'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type GameId } from '@/config/games';

export interface GameHubShellProps {
  gameId: GameId;
  children: React.ReactNode;
  ariaTitle?: string;
  className?: string;
}

export function GameHubShell({
  gameId,
  children,
  ariaTitle,
  className,
}: GameHubShellProps) {
  return (
    <div
      data-game={gameId}
      className={cn(
        'hub-page relative flex h-full max-h-[100dvh] w-full flex-col items-center overflow-x-clip bg-[#07090F] select-none',
        className,
      )}
    >
      {/* ── Background: Subtle Tactical Grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      {/* ── Atmospheric Vignette ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,9,15,0.75)_100%)]"
        aria-hidden="true"
      />

      {/* ── Atmospheric Core Glow (Token Driven) ── */}
      <div
        className="hub-core-glow pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-[52%] rounded-full blur-3xl sm:h-[440px] sm:w-[440px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--hub-accent) 20%, transparent) 0%, color-mix(in srgb, var(--hub-accent) 6%, transparent) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {ariaTitle && <h1 className="sr-only">{ariaTitle}</h1>}

      {/* ── Main Layout: Perfectly Balanced Zero-Scroll Vertical Stack (Step 1) ── */}
      <div
        className="hub-container-inner relative z-10 mx-auto flex h-full max-h-[100dvh] w-full max-w-[460px] sm:max-w-[480px] flex-col items-center px-4"
        style={{
          paddingTop: 'calc(var(--hub-header-bottom) + var(--hub-gap-header-eyebrow))',
        }}
      >
        <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
}
