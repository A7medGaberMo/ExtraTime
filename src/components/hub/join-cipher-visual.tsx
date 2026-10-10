'use client';

import React from 'react';
import {
  Key,
  Crosshair,
  Ranking,
  Lightning,
  Vault,
  CircleNotch,
  X,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { type GameId } from '@/config/games';

export interface JoinCipherVisualProps {
  code: string;
  isChecking?: boolean;
  matchedGame?: GameId | null;
  isInvalid?: boolean;
}

export function JoinCipherVisual({
  code,
  isChecking = false,
  matchedGame = null,
  isInvalid = false,
}: JoinCipherVisualProps) {
  const chars = code.slice(0, 6).split('');
  const count = chars.length;

  // 6 Orbital positions around the center ring (angles in degrees: 30, 90, 150, 210, 270, 330)
  // Distance from center is ~38% of container radius
  const angles = [30, 90, 150, 210, 270, 330];

  return (
    <div className="relative size-full flex items-center justify-center pointer-events-none">
      {/* ── Orbital Cipher Node Ring ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {angles.map((deg, idx) => {
          const char = chars[idx];
          const isFilled = Boolean(char);
          const rad = (deg - 90) * (Math.PI / 180);
          // Radius ~ 37% (distance from center 50%)
          const x = 50 + 37 * Math.cos(rad);
          const y = 50 + 37 * Math.sin(rad);

          return (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
            >
              <div
                className={`flex size-6 sm:size-7 items-center justify-center rounded-full font-mono font-bold text-[11px] sm:text-xs transition-all duration-300 ${
                  matchedGame
                    ? 'border border-[var(--hub-accent)] bg-[color-mix(in_srgb,var(--hub-accent)_25%,rgba(7,9,15,0.9))] text-white shadow-[0_0_12px_var(--hub-accent-glow)] scale-110'
                    : isFilled
                      ? 'border border-[var(--hub-accent)] bg-[color-mix(in_srgb,var(--hub-accent)_15%,rgba(7,9,15,0.8))] text-[var(--hub-accent)] shadow-[0_0_8px_var(--hub-accent-glow)]'
                      : isInvalid
                        ? 'border border-rose-500/40 bg-rose-500/10 text-rose-400/50'
                        : 'border border-white/10 bg-black/40 text-white/20'
                }`}
              >
                {char || '·'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Connecting Hexagon Wireframe (Subtle) ── */}
      <svg
        viewBox="0 0 240 240"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <polygon
          points={angles
            .map((deg) => {
              const rad = (deg - 90) * (Math.PI / 180);
              const px = 120 + 89 * Math.cos(rad);
              const py = 120 + 89 * Math.sin(rad);
              return `${px.toFixed(1)},${py.toFixed(1)}`;
            })
            .join(' ')}
          fill="none"
          stroke={
            matchedGame
              ? 'var(--hub-accent)'
              : count > 0
                ? 'color-mix(in srgb, var(--hub-accent) 30%, transparent)'
                : 'rgba(255, 255, 255, 0.06)'
          }
          strokeWidth={matchedGame ? '1.5' : '1'}
          strokeDasharray={matchedGame ? 'none' : '3 3'}
          className="transition-colors duration-300"
        />
      </svg>

      {/* ── Center 58px Badge Content ── */}
      <div className="relative z-10 flex size-[58px] items-center justify-center rounded-full">
        {isChecking ? (
          <AppIcon
            icon={CircleNotch}
            size={24}
            weight="bold"
            className="animate-spin text-[var(--hub-accent)]"
          />
        ) : matchedGame === 'snipe' ? (
          <AppIcon
            icon={Crosshair}
            size={26}
            weight="fill"
            className="text-[var(--hub-accent)] drop-shadow-[0_0_8px_var(--hub-accent)]"
          />
        ) : matchedGame === 'draft' ? (
          <AppIcon
            icon={Lightning}
            size={26}
            weight="fill"
            className="text-[var(--hub-accent)] drop-shadow-[0_0_8px_var(--hub-accent)]"
          />
        ) : matchedGame === 'rank' ? (
          <AppIcon
            icon={Ranking}
            size={26}
            weight="fill"
            className="text-[var(--hub-accent)] drop-shadow-[0_0_8px_var(--hub-accent)]"
          />
        ) : matchedGame === 'bank' ? (
          <AppIcon
            icon={Vault}
            size={26}
            weight="fill"
            className="text-[var(--hub-accent)] drop-shadow-[0_0_8px_var(--hub-accent)]"
          />
        ) : isInvalid ? (
          <AppIcon icon={X} size={24} weight="bold" className="text-rose-400" />
        ) : count > 0 ? (
          <div className="flex flex-col items-center justify-center">
            <span
              className="font-mono text-sm font-black tracking-tight"
              style={{ color: 'var(--hub-accent)' }}
            >
              {count}/6
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/50 leading-none">
              PIN
            </span>
          </div>
        ) : (
          <AppIcon
            icon={Key}
            size={22}
            weight="fill"
            className="text-[var(--hub-accent)] transition-transform duration-300"
          />
        )}
      </div>
    </div>
  );
}
