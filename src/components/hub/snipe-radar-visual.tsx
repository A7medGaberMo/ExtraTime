'use client';

import React from 'react';

export function SnipeRadarVisual() {
  return (
    <>
      {/* Outer Degree Tick Bezel */}
      <div
        className="snipe-radar-ticks pointer-events-none absolute inset-0 rounded-full"
        aria-hidden="true"
      />

      {/* Slow Counter-Rotating Dashed Bezel */}
      <div
        className="snipe-radar-bezel pointer-events-none absolute inset-[7%] rounded-full"
        aria-hidden="true"
      />

      {/* Concentric Thin Gold Rings */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full border border-amber-400/[0.14] shadow-[0_0_24px_rgba(251,191,36,0.06)]"
        aria-hidden="true"
      />
      <div
        className="snipe-ring-breathe pointer-events-none absolute inset-[18%] rounded-full border border-amber-400/[0.2]"
        aria-hidden="true"
      />
      <div
        className="snipe-ring-breathe snipe-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full border border-amber-400/[0.28]"
        aria-hidden="true"
      />

      {/* Sonar Pings Radiating From Core */}
      <span className="snipe-sonar-ping" aria-hidden="true" />
      <span className="snipe-sonar-ping snipe-sonar-ping-delay" aria-hidden="true" />

      {/* Precision Crosshair Axis Lines */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-full w-px bg-gradient-to-b from-amber-400/25 via-transparent to-amber-400/25" />
        <div className="absolute h-px w-full bg-gradient-to-r from-amber-400/25 via-transparent to-amber-400/25" />
      </div>

      {/* Rotating Conic Sweep Line */}
      <div
        className="snipe-radar-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-full motion-reduce:hidden"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(251, 191, 36, 0.03) 310deg, rgba(251, 191, 36, 0.24) 360deg)',
        }}
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 h-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-t from-transparent via-amber-400/60 to-amber-400" />
      </div>

      {/* Pulsing Tactical Blip Dots */}
      <div
        className="snipe-blip-1 pointer-events-none absolute top-[24%] right-[22%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute size-3 rounded-full bg-amber-400/40 blur-[2px]" />
        <span className="relative size-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
      </div>
      <div
        className="snipe-blip-2 pointer-events-none absolute bottom-[26%] left-[24%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute size-2.5 rounded-full bg-amber-400/35 blur-[2px]" />
        <span className="relative size-1 rounded-full bg-amber-300 shadow-[0_0_5px_#fbbf24]" />
      </div>
      <div
        className="snipe-blip-3 pointer-events-none absolute top-[68%] right-[28%] flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute size-2 rounded-full bg-amber-400/30 blur-[2px]" />
        <span className="relative size-1 rounded-full bg-amber-300 shadow-[0_0_4px_#fbbf24]" />
      </div>

      {/* Center Core App Mark */}
      <div className="relative z-10 flex size-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#221c12] via-[#14121a] to-[#09090f] shadow-[0_0_24px_rgba(251,191,36,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95 sm:size-14">
        <svg
          className="size-6 drop-shadow-[0_1px_8px_rgba(251,191,36,0.65)] sm:size-7"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
              <stop offset="0%" stopColor="#FFF0B3" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
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
