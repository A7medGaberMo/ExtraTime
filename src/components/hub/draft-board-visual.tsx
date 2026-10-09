'use client';

import React from 'react';

const FORMATION_DOTS = [
  { x: '50%', y: '84%', delay: 0.0, label: 'GK' },
  { x: '18%', y: '68%', delay: 0.55, label: 'LB' },
  { x: '37%', y: '72%', delay: 1.1, label: 'LCB' },
  { x: '63%', y: '72%', delay: 1.65, label: 'RCB' },
  { x: '82%', y: '68%', delay: 2.2, label: 'RB' },
  { x: '26%', y: '50%', delay: 2.75, label: 'LCM' },
  { x: '50%', y: '36%', delay: 3.3, label: 'CM' },
  { x: '74%', y: '50%', delay: 3.85, label: 'RCM' },
  { x: '22%', y: '24%', delay: 4.4, label: 'LW' },
  { x: '50%', y: '16%', delay: 4.95, label: 'ST' },
  { x: '78%', y: '24%', delay: 5.5, label: 'RW' },
];

export function DraftBoardVisual() {
  return (
    <>
      {/* 11 Formation Tactical Dots (5.5px in 4-3-3 formation) */}
      {FORMATION_DOTS.map((dot, idx) => (
        <div
          key={idx}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            left: dot.x,
            top: dot.y,
          }}
          aria-hidden="true"
        >
          <span
            className="draft-formation-dot relative size-[5.5px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--hub-accent)',
              boxShadow: '0 0 6px var(--hub-accent)',
              animation: 'draftDotIlluminate 8s ease-in-out infinite',
              animationDelay: `${dot.delay}s`,
            }}
          />
        </div>
      ))}

      {/* Center Core Badge — Jersey Mark */}
      <div className="hub-center-badge relative z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
        <svg
          className="size-7"
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

          {/* Jersey Chest Star */}
          <circle cx="16" cy="17" r="1.75" fill="url(#draftJerseyGrad)" />
        </svg>
      </div>
    </>
  );
}
