'use client';

import React from 'react';

export function SnipeRadarVisual() {
  return (
    <>
      {/* Sonar Pings Radiating From Core */}
      <span className="snipe-sonar-ping" aria-hidden="true" />
      <span className="snipe-sonar-ping snipe-sonar-ping-delay" aria-hidden="true" />

      {/* Rotating Conic Sweep Line */}
      <div
        className="snipe-radar-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-full motion-reduce:hidden"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, color-mix(in srgb, var(--hub-accent) 3%, transparent) 310deg, color-mix(in srgb, var(--hub-accent) 24%, transparent) 360deg)',
        }}
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 h-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-t from-transparent via-[color-mix(in_srgb,var(--hub-accent)_60%,transparent)] to-[var(--hub-accent)]" />
      </div>

      {/* Pulsing Tactical Blip Dots (3 blips unchanged) */}
      <div
        className="snipe-blip-1 pointer-events-none absolute top-[24%] right-[22%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span
          className="absolute size-3 rounded-full blur-[2px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--hub-accent) 40%, transparent)' }}
        />
        <span
          className="relative size-1.5 rounded-full"
          style={{
            backgroundColor: 'var(--hub-accent-light)',
            boxShadow: '0 0 6px var(--hub-accent)',
          }}
        />
      </div>
      <div
        className="snipe-blip-2 pointer-events-none absolute bottom-[26%] left-[24%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span
          className="absolute size-2.5 rounded-full blur-[2px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--hub-accent) 35%, transparent)' }}
        />
        <span
          className="relative size-1 rounded-full"
          style={{
            backgroundColor: 'var(--hub-accent-light)',
            boxShadow: '0 0 5px var(--hub-accent)',
          }}
        />
      </div>
      <div
        className="snipe-blip-3 pointer-events-none absolute top-[68%] right-[28%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span
          className="absolute size-2 rounded-full blur-[2px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--hub-accent) 30%, transparent)' }}
        />
        <span
          className="relative size-1 rounded-full"
          style={{
            backgroundColor: 'var(--hub-accent-light)',
            boxShadow: '0 0 4px var(--hub-accent)',
          }}
        />
      </div>

      {/* Center Core App Mark */}
      <div className="hub-center-badge relative z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
        <svg
          className="size-7"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 1px 8px color-mix(in srgb, var(--hub-accent) 65%, transparent))' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="snipeGoldScopeGrad"
              x1="4"
              y1="4"
              x2="28"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--hub-accent-light)" />
              <stop offset="40%" stopColor="var(--hub-accent)" />
              <stop offset="100%" stopColor="var(--hub-accent-deep)" />
            </linearGradient>
          </defs>
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.75"
            opacity="0.85"
          />
          <circle
            cx="16"
            cy="16"
            r="5.5"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.25"
            opacity="0.9"
          />
          <line
            x1="16"
            y1="2"
            x2="16"
            y2="6.5"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="25.5"
            x2="16"
            y2="30"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="16"
            x2="6.5"
            y2="16"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            x1="25.5"
            y1="16"
            x2="30"
            y2="16"
            stroke="url(#snipeGoldScopeGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="2.2" fill="url(#snipeGoldScopeGrad)" />
        </svg>
      </div>
    </>
  );
}
