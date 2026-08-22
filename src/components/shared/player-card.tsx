'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerCardData, Tier } from '@/types/player';
import { getTierStyle } from '@/lib/tier-styles';
import { CardBackgroundTexture } from './card-textures';
import { ClubCrestBadge, CountryFlagBadge } from './card-badges';
import { ETLogo } from './et-logo';
import { PlayerImage } from './player-image';

/**
 * Display only the primary position if multi-positional (e.g. "ST/CF" -> "ST").
 */
function formatMainPosition(pos: string): string {
  if (!pos) return 'ST';
  return pos.split('/')[0].trim().toUpperCase();
}

/**
 * Format long player names cleanly for jersey/card display.
 * e.g., "Cristiano Ronaldo" -> "C. RONALDO"
 * e.g., "Kevin De Bruyne" -> "DE BRUYNE"
 * e.g., "Trent Alexander-Arnold" -> "A.-ARNOLD"
 */
function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim().toUpperCase();
  if (trimmed.length <= 13) return trimmed;

  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length > 1) {
    const lastName = parts[parts.length - 1];
    if (lastName.length <= 12) {
      const firstNameInitial = parts[0][0];
      return `${firstNameInitial}. ${lastName}`;
    }
    return lastName;
  }
  return trimmed;
}

function getDynamicNameSizeClass(displayName: string, size: 'sm' | 'md' | 'lg'): string {
  const len = displayName.length;
  if (size === 'sm') {
    if (len > 13) return 'text-[9px] tracking-tight';
    if (len > 10) return 'text-[10px] tracking-normal';
    return 'text-xs tracking-wider';
  }
  if (size === 'md') {
    if (len > 14) return 'text-[11px] sm:text-xs tracking-tight';
    if (len > 10) return 'text-xs sm:text-sm tracking-normal';
    return 'text-sm sm:text-base tracking-widest';
  }
  // size === 'lg'
  if (len > 14) return 'text-xs sm:text-sm tracking-normal';
  if (len > 10) return 'text-sm sm:text-base tracking-wider';
  return 'text-base sm:text-lg tracking-widest';
}

interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: PlayerCardData;
  size?: 'sm' | 'md' | 'lg';
  showTierLabelBelow?: boolean;
}

export function PlayerCard({
  className,
  player,
  size = 'md',
  showTierLabelBelow = false,
  ...props
}: PlayerCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ x: (y / rect.height) * -14, y: (x / rect.width) * 14 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const tier = (player?.tier as Tier) || 'SILVER';
  const tierStyle = getTierStyle(tier);
  const playerName = player?.name || 'Player';
  const silhouetteVariant = ((playerName.charCodeAt(0) + playerName.length) % 6) as
    0 | 1 | 2 | 3 | 4 | 5;

  const kitNum = player?.kitNumber ?? (player?.isLegend ? 10 : (playerName.length % 20) + 1);
  const displayName = formatDisplayName(playerName);
  const mainPosition = formatMainPosition(player?.position || 'ST');

  // Scaled dimensions with OCD-perfect spacing
  const scaleMap = {
    sm: {
      card: 'w-36 h-[220px]',
      num: 'text-2xl font-black',
      avatar: 'w-20 h-20',
      infoPill: 'h-6 px-2 gap-2 text-[9px]',
      posBadge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      card: 'w-36 h-[220px] sm:w-48 sm:h-[295px]',
      num: 'text-2xl sm:text-3.5xl font-black',
      avatar: 'w-20 h-20 sm:w-28 sm:h-28',
      infoPill: 'h-6 sm:h-7.5 px-2 sm:px-2.5 gap-2 sm:gap-2.5 text-[9px] sm:text-[11px]',
      posBadge: 'text-[9px] sm:text-[10px] px-1.5 py-0.5',
    },
    lg: {
      card: 'w-60 h-[370px]',
      num: 'text-4xl font-black',
      avatar: 'w-36 h-36',
      infoPill: 'h-8 px-3 gap-3 text-xs',
      posBadge: 'text-xs px-2 py-0.5',
    },
  }[size];

  // Precision Chamfered Frame Clip
  const chamferClip = 'polygon(8% 0%, 92% 0%, 100% 5%, 100% 95%, 92% 100%, 8% 100%, 0% 95%, 0% 5%)';

  return (
    <div className="group flex flex-col items-center" dir="ltr">
      {/* Outer Card Shell with Chamfered Metallic Frame */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative flex cursor-pointer flex-col items-center transition-all duration-150 select-none group-hover:-translate-y-2 group-hover:brightness-105 text-left',
          scaleMap.card,
          className,
        )}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          filter: `drop-shadow(0 14px 28px rgba(0,0,0,0.85)) drop-shadow(0 0 16px ${tierStyle.glow})`,
        }}
        {...props}
      >
        {/* Layer 1: Outer Metallic Edge Frame */}
        <div
          className="absolute inset-0 overflow-hidden p-[3px] shadow-2xl"
          style={{ clipPath: chamferClip, background: tierStyle.frame }}
        >
          {/* Layer 2: Shadow Groove & Inner Surface */}
          <div
            className="relative flex h-full w-full flex-col justify-between overflow-hidden p-2.5 sm:p-3"
            style={{ clipPath: chamferClip, background: tierStyle.backdrop }}
          >
            {/* Layer 3: Subtle Background Pattern Texture (4% opacity) */}
            <CardBackgroundTexture tier={tier} />

            {/* Layer 4: Specular Border */}
            <div
              className="pointer-events-none absolute inset-0 border border-white/20"
              style={{ clipPath: chamferClip }}
            />

            {/* Layer 5: Holographic Light Sweep on Hover */}
            <div className="group-hover:animate-shine pointer-events-none absolute -inset-full top-0 z-30 block h-full w-1/2 -skew-x-25 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* 1. TOP HEADER: KIT NUMBER (LEFT) & ET LOGO (RIGHT) */}
            <div className="relative z-20 flex w-full items-start justify-between">
              {/* TOP LEFT: Shirt Number */}
              <div className="flex flex-col items-start pt-0.5 pl-0.5 leading-none">
                <span
                  className={cn(
                    'font-black tracking-normal uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] font-stats',
                    scaleMap.num,
                  )}
                  style={{
                    color: tierStyle.highlight,
                    background: `linear-gradient(180deg, #FFFFFF 30%, ${tierStyle.highlight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {kitNum}
                </span>
              </div>

              {/* TOP RIGHT: Integrated Metallic ET Logo Badge */}
              <div className="flex flex-col items-center pt-0.5 pr-0.5">
                <div
                  className="flex items-center justify-center rounded-full border border-white/20 bg-slate-950/70 px-2 py-0.5 shadow-xl backdrop-blur-md transition-transform group-hover:scale-105"
                  style={{ borderColor: `${tierStyle.accent}60` }}
                >
                  <ETLogo
                    variant="card-badge"
                    size={size === 'sm' ? 14 : size === 'md' ? 18 : 22}
                  />
                </div>
              </div>
            </div>

            {/* 2. CENTER: CIRCULAR PLAYER PORTRAIT (PUSHED UP NEAR TOP HEADER) */}
            <div className="pointer-events-none relative z-10 flex w-full items-center justify-center pt-0 sm:pt-1">
              <div
                className={cn(
                  'relative flex items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-slate-950/60 shadow-2xl transition-transform duration-300 group-hover:scale-105',
                  scaleMap.avatar,
                )}
                style={{
                  borderColor: `${tierStyle.highlight}90`,
                  boxShadow: `0 0 25px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.5), 0 0 15px ${tierStyle.glow}`,
                }}
              >
                <PlayerImage
                  src={player?.imageUrl}
                  alt={player?.name}
                  name={player?.name}
                  variant={silhouetteVariant}
                  imgClassName="transition-transform duration-300 group-hover:scale-110"
                  silhouetteClassName="transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>

            {/* 3. HORIZONTAL OCD INFO ROW (NATION FLAG, CLUB CREST, SINGLE MAIN POSITION BADGE) */}
            <div className="relative z-20 my-1.5 flex w-full items-center justify-center">
              <div
                className={cn(
                  'flex w-auto items-center justify-center rounded-full border border-white/25 bg-slate-950/85 text-center shadow-lg backdrop-blur-md',
                  scaleMap.infoPill,
                )}
                style={{ borderColor: `${tierStyle.accent}50` }}
              >
                {/* NATION FLAG */}
                <CountryFlagBadge
                  nationName={player.nation}
                  className="h-4 w-6 shrink-0 rounded-sm border-0 p-0 shadow-none sm:h-4.5 sm:w-7"
                />

                {/* CLUB CREST */}
                <ClubCrestBadge
                  clubName={player.club}
                  className="h-5 w-5 shrink-0 rounded-full border-0 p-0 shadow-none sm:h-6 sm:w-6"
                />

                {/* SINGLE MAIN POSITION BADGE */}
                <span
                  className={cn(
                    'flex items-center justify-center rounded border border-white/15 bg-white/10 leading-none font-black tracking-wider text-white uppercase',
                    scaleMap.posBadge,
                  )}
                >
                  {mainPosition}
                </span>
              </div>
            </div>

            {/* 4. BOTTOM SECTION: SLEEK FLOATING GLASS PLAYER NAME BAR */}
            <div className="relative z-20 mt-auto mb-0.5 w-full">
              {player.isLegend && (
                <div className="pointer-events-none absolute -top-5 right-2 z-10 select-none opacity-35">
                  <span className="story-script-regular text-amber-200 text-xs sm:text-sm tracking-wide">
                    {displayName.split('. ').pop() || displayName}
                  </span>
                </div>
              )}
              <div className="flex w-full items-center justify-center rounded-xl border border-white/30 bg-slate-950/90 px-1.5 py-1 text-center shadow-2xl backdrop-blur-xl">
                <h3
                  className={cn(
                    'w-full truncate px-0.5 text-center font-black uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] font-display',
                    getDynamicNameSizeClass(displayName, size),
                  )}
                  style={{
                    color: tierStyle.highlight,
                    background: `linear-gradient(180deg, #FFFFFF 40%, ${tierStyle.highlight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {displayName}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Tier Name Below Card for Catalog / Showcase view */}
      {showTierLabelBelow && (
        <span
          className="mt-1.5 text-[10px] font-black tracking-widest uppercase font-stats"
          style={{ color: tierStyle.highlight }}
        >
          {tierStyle.name}
        </span>
      )}
    </div>
  );
}

export function PlayerCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scaleMap = {
    sm: 'w-36 h-[220px]',
    md: 'w-36 h-[220px] sm:w-48 sm:h-[295px]',
    lg: 'w-60 h-[370px]',
  }[size];

  const chamferClip = 'polygon(8% 0%, 92% 0%, 100% 5%, 100% 95%, 92% 100%, 8% 100%, 0% 95%, 0% 5%)';

  return (
    <div
      className={cn(
        'relative flex animate-pulse flex-col justify-between overflow-hidden border border-white/10 bg-slate-950 p-4',
        scaleMap,
      )}
      style={{ clipPath: chamferClip }}
    >
      <div className="flex items-start justify-between">
        <div className="h-7 w-7 rounded-md bg-white/10" />
        <div className="h-5 w-5 rounded-full bg-white/10" />
      </div>
      <div className="mx-auto mt-2 mb-auto h-24 w-24 rounded-full bg-white/10" />
      <div className="mx-auto my-1 h-6 w-32 rounded-full bg-white/10" />
      <div className="mx-auto h-6 w-28 rounded-xl bg-white/10" />
    </div>
  );
}
