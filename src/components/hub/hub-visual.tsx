'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HubVisualProps {
  children?: React.ReactNode;
  showTimerArc?: boolean;
  centerBadge?: React.ReactNode;
  className?: string;
}

export function HubVisual({
  children,
  showTimerArc = false,
  centerBadge,
  className,
}: HubVisualProps) {
  return (
    <div data-hub-visual-area className="hub-visual-area">
      <div
        data-hub-visual-frame
        className={cn('hub-visual-frame', className)}
      >
      {/* ── Scope Corner Brackets (Framing inside frame boundary) ── */}
      <span className="hub-scope-bracket hub-scope-bracket-tl" aria-hidden="true" />
      <span className="hub-scope-bracket hub-scope-bracket-tr" aria-hidden="true" />
      <span className="hub-scope-bracket hub-scope-bracket-bl" aria-hidden="true" />
      <span className="hub-scope-bracket hub-scope-bracket-br" aria-hidden="true" />

      {/* ── Visual Circle: Centered exactly with equal padding on all 4 sides ── */}
      <div data-hub-visual-circle className="hub-visual-circle">
        {/* Outer Degree Tick Bezel — Fine tick marks visible on all four games */}
        <div className="hub-radar-ticks pointer-events-none" aria-hidden="true" />

        {/* Slow Counter-Rotating Dashed Bezel */}
        <div
          className="hub-radar-bezel pointer-events-none absolute inset-[7%] rounded-full motion-reduce:animation-none"
          aria-hidden="true"
        />

        {/* Outer Ring — 1px stroke at ~35% opacity */}
        <div className="hub-ring-outer pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

        {/* 2px Timer Arc (Rank and Draft only — brighter ring element) */}
        {showTimerArc && (
          <svg
            viewBox="0 0 240 240"
            className="pointer-events-none absolute inset-0 size-full -rotate-90 overflow-visible"
            aria-hidden="true"
          >
            <circle
              cx="120"
              cy="120"
              r="119"
              fill="none"
              stroke="var(--hub-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              className="draft-board-arc"
              style={{
                filter: 'drop-shadow(0 0 2.5px color-mix(in srgb, var(--hub-accent) 65%, transparent))',
              }}
            />
          </svg>
        )}

        {/* Middle Ring (inset 18%) */}
        <div
          className="hub-ring-middle draft-ring-breathe pointer-events-none absolute inset-[18%] rounded-full"
          aria-hidden="true"
        />

        {/* Inner Ring (inset 36%) */}
        <div
          className="hub-ring-inner draft-ring-breathe draft-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full"
          aria-hidden="true"
        />

        {/* Precision Crosshair Axis Lines */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="h-full w-px"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
            }}
          />
          <div
            className="absolute h-px w-full"
            style={{
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
            }}
          />
        </div>

        {/* ── Inner Content Slot (radar sweep, blips, formation dots, bars, vault dots) ── */}
        {children}

        {/* ── Center Badge Slot (58px, faint glow, same style everywhere) ── */}
        {centerBadge && (
          <div className="hub-center-badge relative z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
            {centerBadge}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
