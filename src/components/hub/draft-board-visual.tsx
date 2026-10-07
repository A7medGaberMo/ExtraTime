'use client';

import React from 'react';

const FORMATION_DOTS = [
  { x: '50%', y: '85%', delay: 0.0, label: 'GK' },
  { x: '18%', y: '68%', delay: 0.55, label: 'LB' },
  { x: '37%', y: '72%', delay: 1.1, label: 'LCB' },
  { x: '63%', y: '72%', delay: 1.65, label: 'RCB' },
  { x: '82%', y: '68%', delay: 2.2, label: 'RB' },
  { x: '26%', y: '50%', delay: 2.75, label: 'LCM' },
  { x: '50%', y: '35%', delay: 3.3, label: 'CM' },
  { x: '74%', y: '50%', delay: 3.85, label: 'RCM' },
  { x: '22%', y: '24%', delay: 4.4, label: 'LW' },
  { x: '50%', y: '15%', delay: 4.95, label: 'ST' },
  { x: '78%', y: '24%', delay: 5.5, label: 'RW' },
];

export function DraftBoardVisual() {
  return (
    <>
      {/* Outer Degree Tick Bezel — Fine tick marks clearly visible around the outer ring */}
      <div className="hub-radar-ticks pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      {/* Slow Counter-Rotating Dashed Bezel (matching Snipe's 13% opacity) */}
      <div
        className="pointer-events-none absolute inset-[7%] rounded-full border border-dashed motion-reduce:animation-none"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 13%, transparent)',
          animation: 'draftBoardTickSweep 60s linear infinite reverse',
        }}
        aria-hidden="true"
      />

      {/* Outer Ring — 1px stroke at low opacity, no outer glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 14%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Inner Rings — Thin 1px strokes and low opacity matching Snipe */}
      <div
        className="draft-ring-breathe pointer-events-none absolute inset-[18%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 18%, transparent)',
        }}
        aria-hidden="true"
      />
      <div
        className="draft-ring-breathe draft-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 24%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Precision Crosshair Axis Lines — Thin 1px strokes at low opacity */}
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

      {/* Pick Timer Arc — 2px accent arc on outer ring, same glow strength as Snipe radar hand */}
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

      {/* 11 Formation Tactical Dots (4-3-3 shape, progressively illuminated) */}
      {FORMATION_DOTS.map((dot, idx) => (
        <div
          key={idx}
          className="draft-formation-dot pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            left: dot.x,
            top: dot.y,
            animationDelay: `${dot.delay}s`,
          }}
          aria-hidden="true"
        >
          <span
            className="absolute size-2 rounded-full blur-[1.5px]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--hub-accent) 25%, transparent)',
            }}
          />
          <span
            className="relative size-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--hub-accent-light)',
              boxShadow: '0 0 4px var(--hub-accent)',
            }}
          />
        </div>
      ))}

      {/* Center Core Badge — Faint glow only, same as Snipe */}
      <div
        className="relative z-10 flex size-12 items-center justify-center rounded-2xl border transition-transform hover:scale-105 active:scale-95 sm:size-14"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 40%, transparent)',
          background:
            'linear-gradient(165deg, color-mix(in srgb, var(--hub-accent) 18%, #14121a), #111016 58%, #09090f)',
          boxShadow:
            '0 0 20px color-mix(in srgb, var(--hub-accent) 25%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        }}
      >
        <svg
          className="size-6 sm:size-7"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 1px 8px color-mix(in srgb, var(--hub-accent) 70%, transparent))' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="draftJerseyGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--hub-accent-light)" />
              <stop offset="50%" stopColor="var(--hub-accent)" />
              <stop offset="100%" stopColor="var(--hub-accent-deep)" />
            </linearGradient>
          </defs>

          {/* Football Shirt/Jersey Outline */}
          <path
            d="M11 6L7 9.5L9.5 13.5L12 12V25.5C12 26.3 12.7 27 13.5 27H18.5C19.3 27 20 26.3 20 25.5V12L22.5 13.5L25 9.5L21 6C20 7.5 18 8.5 16 8.5C14 8.5 12 7.5 11 6Z"
            stroke="url(#draftJerseyGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="color-mix(in srgb, var(--hub-accent) 12%, transparent)"
          />

          {/* Collar V-Neck line */}
          <path
            d="M13.5 6C14 7.2 15 8 16 8C17 8 18 7.2 18.5 6"
            stroke="url(#draftJerseyGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Jersey Chest Number 10 / Tactical Star */}
          <circle cx="16" cy="17" r="1.75" fill="url(#draftJerseyGrad)" />
        </svg>
      </div>
    </>
  );
}
