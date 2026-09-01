'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerCardData, Tier } from '@/types/player';
import { getTierStyle } from '@/lib/tier-styles';
import { getEffectiveRating } from '@/lib/rating-utils';
import { CardBackgroundTexture } from './card-textures';
import { ClubCrestBadge, CountryFlagBadge } from './card-badges';
import { PlayerImage } from './player-image';
import { ETLogo } from './et-logo';

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
    // Handle compound prefixes (e.g., DE BRUYNE, VAN DIJK, DI MARIA)
    const prefixes = ['DE', 'VAN', 'VON', 'DI', 'DA', 'DEL', 'SAN', 'ST.', 'AL', 'EL', 'LA'];
    if (parts.length >= 3 && prefixes.includes(parts[parts.length - 2])) {
      const compoundLastName = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
      if (compoundLastName.length <= 13) {
        return compoundLastName;
      }
    }

    const lastName = parts[parts.length - 1];
    if (lastName.length <= 11) {
      const firstNameInitial = parts[0][0];
      return `${firstNameInitial}. ${lastName}`;
    }
    return lastName;
  }
  return trimmed;
}

function getDynamicNameSizeClass(displayName: string, size: 'xs' | 'sm' | 'md' | 'lg'): string {
  const len = displayName.length;
  if (size === 'xs') {
    if (len > 13) return 'text-[6.5px] tracking-tighter';
    if (len > 10) return 'text-[7.5px] tracking-tight';
    return 'text-[8.5px] tracking-tight';
  }
  if (size === 'sm') {
    if (len > 13) return 'text-[8.5px] tracking-tight';
    if (len > 10) return 'text-[9.5px] tracking-tight';
    return 'text-[11px] tracking-normal';
  }
  if (size === 'md') {
    if (len > 13) return 'text-[10px] sm:text-xs tracking-tight';
    if (len > 10) return 'text-xs sm:text-sm tracking-tight';
    return 'text-xs sm:text-[15px] tracking-normal';
  }
  // size === 'lg'
  if (len > 13) return 'text-sm tracking-tight';
  if (len > 10) return 'text-base tracking-normal';
  return 'text-lg tracking-normal';
}

interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: PlayerCardData;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function PlayerCard({
  className,
  player,
  size = 'md',
  ...props
}: PlayerCardProps) {
  const tier = (player?.tier as Tier) || 'SILVER';
  const tierStyle = getTierStyle(tier);
  const isLightCard = tier === 'ICON';
  const playerName = player?.name || 'Player';
  const silhouetteVariant = ((playerName.charCodeAt(0) + playerName.length) % 6) as
    0 | 1 | 2 | 3 | 4 | 5;

  const rating = getEffectiveRating(player);
  const displayName = formatDisplayName(playerName);
  const mainPosition = formatMainPosition(player?.position || 'ST');

  // Scaled dimensions with Apple subpixel balance
  const scaleMap = {
    xs: {
      card: 'w-24 h-[148px] sm:w-28 sm:h-[174px]',
      framePad: 'p-[1.5px]',
      inner: 'p-1.5',
      header: 'h-4.5 sm:h-5',
      num: 'text-[18px] sm:text-[22px] font-black font-card-num',
      etBadge: 'h-4 w-4 p-0.5 sm:h-5 sm:w-5',
      etLogoSize: 11,
      avatarRing: 'mt-0.5 h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] p-[1.5px]',
      infoPill: 'mt-1 h-4 px-1.5 gap-1 text-[7px]',
      flag: 'h-3 w-4.5 sm:h-3.5 sm:w-5.5',
      club: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
      posBadge: 'h-3 min-w-4 px-0.5 text-[6.5px] sm:text-[7.5px] font-black',
      nameWrap: 'py-0.5 px-1',
      tierContainer: 'pt-0.5 pb-0',
      tierBadge: 'px-1.5 py-0 text-[6.5px] sm:text-[7px] tracking-[0.16em]',
    },
    sm: {
      card: 'w-32 h-[195px] sm:w-36 sm:h-[220px]',
      framePad: 'p-[2px]',
      inner: 'p-2',
      header: 'h-7',
      num: 'text-[24px] sm:text-[28px] font-black font-card-num',
      etBadge: 'h-6 w-6 p-0.5',
      etLogoSize: 15,
      avatarRing: 'mt-1 h-[68px] w-[68px] sm:h-[78px] sm:w-[78px] p-[2px]',
      infoPill: 'mt-1.5 h-5.5 px-2 gap-1.5 text-[8.5px]',
      flag: 'h-3.5 w-5.5',
      club: 'h-4.5 w-4.5',
      posBadge: 'h-4 min-w-6 px-1 text-[8.5px] font-black',
      nameWrap: 'py-1 px-1.5',
      tierContainer: 'pt-1 pb-0.5',
      tierBadge: 'px-2.5 py-0.5 text-[7.5px] tracking-[0.24em]',
    },
    md: {
      card: 'w-36 h-[220px] sm:w-48 sm:h-[295px]',
      framePad: 'p-[2px] sm:p-[2.5px]',
      inner: 'p-2 sm:p-3',
      header: 'h-7 sm:h-9',
      num: 'text-[28px] sm:text-[38px] font-black font-card-num',
      etBadge: 'h-6 w-6 p-0.5 sm:h-7.5 sm:w-7.5 sm:p-1',
      etLogoSize: 18,
      avatarRing: 'mt-1 h-[78px] w-[78px] p-[2px] sm:mt-2 sm:h-[110px] sm:w-[110px] sm:p-[2.5px]',
      infoPill: 'mt-1.5 h-6 px-2 gap-1.5 text-[8.5px] sm:mt-2 sm:h-7 sm:px-2.5 sm:gap-2 sm:text-xs',
      flag: 'h-4 w-6 sm:h-4.5 sm:w-7',
      club: 'h-4.5 w-4.5 sm:h-5.5 sm:w-5.5',
      posBadge: 'h-4 min-w-6 px-1 text-[8.5px] font-black sm:h-4.5 sm:min-w-7 sm:text-[9.5px]',
      nameWrap: 'py-1 px-1.5 sm:py-1.5 sm:px-2',
      tierContainer: 'pt-1 sm:pt-1.5 pb-0.5',
      tierBadge: 'px-2.5 py-0.5 text-[7.5px] tracking-[0.24em] sm:px-3 sm:py-0.5 sm:text-[8.5px] sm:tracking-[0.26em]',
    },
    lg: {
      card: 'w-60 h-[370px]',
      framePad: 'p-[3px]',
      inner: 'p-3.5',
      header: 'h-11',
      num: 'text-[48px] font-black font-card-num',
      etBadge: 'h-9 w-9 p-1.5',
      etLogoSize: 22,
      avatarRing: 'mt-2.5 h-[138px] w-[138px] p-[3px]',
      infoPill: 'mt-2.5 h-8.5 px-3 gap-2.5 text-xs',
      flag: 'h-5.5 w-8.5',
      club: 'h-6.5 w-6.5',
      posBadge: 'h-5 min-w-8 px-2 text-[11px] font-black',
      nameWrap: 'py-2 px-2.5',
      tierContainer: 'pt-2 pb-1',
      tierBadge: 'px-4 py-1 text-[10px] tracking-[0.28em]',
    },
  }[size];

  // Precision Chamfered Frame Clip
  const chamferClip = 'polygon(8% 0%, 92% 0%, 100% 5%, 100% 95%, 92% 100%, 8% 100%, 0% 95%, 0% 5%)';

  return (
    <div className="flex flex-col items-center" dir="ltr">
      {/* Outer Card Shell with Chamfered Metallic Frame */}
      <div
        tabIndex={props.onClick ? 0 : undefined}
        role={props.onClick ? 'button' : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && props.onClick) {
            e.preventDefault();
            props.onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        className={cn(
          'relative flex flex-col items-center text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-lime/70',
          props.onClick ? 'cursor-pointer' : '',
          scaleMap.card,
          className,
        )}
        style={{
          filter: `drop-shadow(0 10px 20px rgba(0,0,0,0.75)) drop-shadow(0 0 12px ${tierStyle.glow})`,
        }}
        {...props}
      >
        {/* Layer 1: Outer Metallic Edge Frame */}
        <div
          className={cn('absolute inset-0 overflow-hidden shadow-2xl', scaleMap.framePad)}
          style={{ clipPath: chamferClip, background: tierStyle.frame }}
        >
          {/* Layer 2: Shadow Groove & Inner Surface */}
          <div
            className={cn('relative flex h-full w-full flex-col overflow-hidden', scaleMap.inner)}
            style={{ clipPath: chamferClip, background: tierStyle.backdrop }}
          >
            {/* Layer 3: Subtle Background Pattern Texture */}
            <CardBackgroundTexture tier={tier} />

            <div
              className="pointer-events-none absolute inset-0 opacity-95"
              style={{
                background: `
                  linear-gradient(135deg, ${tierStyle.highlight}42 0%, transparent 32%),
                  linear-gradient(320deg, ${tierStyle.accent}38 0%, transparent 42%),
                  radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 34%),
                  radial-gradient(circle at 50% 38%, transparent 0%, rgba(0,0,0,0.24) 62%, rgba(0,0,0,0.68) 100%)
                `,
              }}
            />

            <div className="pointer-events-none absolute inset-x-[12%] top-3 h-10 rounded-full bg-white/10 blur-xl" />
            <div
              className="pointer-events-none absolute inset-x-5 bottom-11 h-16 rounded-full blur-2xl"
              style={{ backgroundColor: `${tierStyle.accent}24` }}
            />

            {/* Layer 4: Specular Border */}
            <div
              className="pointer-events-none absolute inset-0 border border-white/20"
              style={{ clipPath: chamferClip }}
            />

            {/* 1. TOP HEADER: OVERALL RATING (LEFT) & ET LOGO (RIGHT) */}
            <div className={cn('relative z-20 flex w-full items-start justify-between', scaleMap.header)}>
              {/* TOP LEFT: Overall Rating */}
              <div className="flex min-w-0 flex-col items-start leading-none">
                <span
                  className={cn(
                    'uppercase leading-none',
                    scaleMap.num,
                  )}
                  style={{
                    color: isLightCard ? tierStyle.ink : '#FFFFFF',
                    textShadow: isLightCard
                      ? '0 1px 0 rgba(255,255,255,0.8)'
                      : `0 2px 5px rgba(0,0,0,0.95), 0 0 10px ${tierStyle.glow}`,
                  }}
                >
                  {rating}
                </span>
              </div>

              {/* TOP RIGHT: Integrated Metallic ET Logo Badge */}
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border shadow-md backdrop-blur-md',
                    scaleMap.etBadge,
                  )}
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    background: 'linear-gradient(180deg, rgba(18, 26, 42, 0.94) 0%, rgba(4, 7, 16, 0.96) 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
                  }}
                  title="ExtraTime Authentic Badge"
                >
                  <ETLogo
                    variant="card-badge"
                    size={scaleMap.etLogoSize}
                    className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                  />
                </div>
              </div>
            </div>

            {/* 2. CENTER: CIRCULAR PLAYER PORTRAIT */}
            <div className="pointer-events-none relative z-10 flex w-full shrink-0 items-center justify-center">
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full shadow-xl',
                  scaleMap.avatarRing,
                )}
                style={{
                  background: `conic-gradient(from 180deg, ${tierStyle.highlight}, ${tierStyle.accent}, ${tierStyle.primary}, ${tierStyle.highlight})`,
                  boxShadow: `0 0 20px ${tierStyle.glow}, 0 0 36px rgba(0,0,0,0.55)`,
                }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-white/25 bg-slate-950/70">
                  <div className="pointer-events-none absolute inset-x-3 top-2 z-10 h-6 rounded-full bg-white/20 blur-md" />
                  <PlayerImage
                    src={player?.imageUrl}
                    alt={player?.name}
                    name={player?.name}
                    variant={silhouetteVariant}
                  />
                </div>
              </div>
            </div>

            {/* 3. HORIZONTAL INFO ROW (NATION FLAG, CLUB CREST, POSITION BADGE) */}
            <div className="relative z-20 flex w-full shrink-0 items-center justify-center">
              <div
                className={cn(
                  'flex w-auto max-w-full items-center justify-center rounded-full border border-white/20 bg-slate-950/85 text-center shadow-md backdrop-blur-md',
                  scaleMap.infoPill,
                )}
                style={{
                  borderColor: `${tierStyle.accent}55`,
                  boxShadow: `0 0 10px ${tierStyle.glow}`,
                }}
              >
                {/* NATION FLAG */}
                <CountryFlagBadge
                  nationName={player.nation}
                  className={cn('shrink-0 rounded-sm border-0 p-0 shadow-none', scaleMap.flag)}
                />

                {/* CLUB CREST */}
                <ClubCrestBadge
                  clubName={player.club}
                  className={cn('shrink-0 rounded-full border-0 p-0 shadow-none', scaleMap.club)}
                />

                {/* POSITION BADGE */}
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded border border-white/15 bg-white/10 leading-none text-white uppercase font-stats',
                    scaleMap.posBadge,
                  )}
                >
                  {mainPosition}
                </span>
              </div>
            </div>

            {/* 4. BOTTOM SECTION: SLEEK FLOATING GLASS PLAYER NAME BAR & DEDICATED TIER BADGE */}
            <div className="relative z-20 mt-auto flex w-full flex-col items-center">
              {/* A. PLAYER NAME PLAQUE */}
              <div
                className={cn(
                  'relative isolate flex w-full items-center justify-center overflow-hidden border text-center shadow-xl backdrop-blur-xl',
                  scaleMap.nameWrap,
                )}
                style={{
                  borderColor: isLightCard ? `${tierStyle.accent}80` : `${tierStyle.accent}60`,
                  borderRadius: '999px 999px 12px 12px',
                  background: isLightCard
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(246,239,226,0.92) 100%)'
                    : 'linear-gradient(180deg, rgba(12,18,30,0.92) 0%, rgba(2,5,12,0.96) 100%)',
                  boxShadow: isLightCard
                    ? `inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 14px rgba(0,0,0,0.2), 0 0 14px ${tierStyle.glow}`
                    : `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.7), 0 0 18px ${tierStyle.glow}`,
                }}
              >
                {/* Specular rim on top */}
                <div
                  className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-90"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${tierStyle.highlight}, transparent)`,
                  }}
                />

                {/* Ambient glow highlight */}
                <div
                  className="pointer-events-none absolute inset-x-5 -top-4 h-6 rounded-full blur-lg"
                  style={{ backgroundColor: `${tierStyle.highlight}26` }}
                />

                <h3
                  className={cn(
                    'font-display relative z-10 w-full truncate px-1 text-center font-black uppercase tracking-wider',
                    getDynamicNameSizeClass(displayName, size),
                  )}
                  style={{
                    color: isLightCard ? tierStyle.ink : '#FFFFFF',
                    textShadow: isLightCard
                      ? '0 1px 0 rgba(255,255,255,0.75)'
                      : '0 2px 4px rgba(0,0,0,0.95)',
                  }}
                >
                  {displayName}
                </h3>
              </div>

              {/* B. DEDICATED TIER DISPLAY BADGE */}
              <div className={cn('flex w-full items-center justify-center', scaleMap.tierContainer)}>
                <div
                  className={cn(
                    'font-card relative inline-flex max-w-full items-center justify-center rounded-full border font-black uppercase',
                    scaleMap.tierBadge,
                  )}
                  style={{
                    borderColor: isLightCard ? `${tierStyle.accent}90` : `${tierStyle.accent}65`,
                    background: isLightCard
                      ? 'linear-gradient(180deg, rgba(255,253,246,0.92) 0%, rgba(235,223,198,0.95) 100%)'
                      : `linear-gradient(180deg, rgba(16,22,34,0.88) 0%, rgba(4,6,12,0.95) 100%)`,
                    color: isLightCard ? tierStyle.ink : tierStyle.highlight,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 10px ${tierStyle.glow}, inset 0 1px 0 rgba(255,255,255,${isLightCard ? '0.6' : '0.18'})`,
                  }}
                >
                  <span
                    className="truncate drop-shadow-sm"
                    style={{
                      textShadow: isLightCard
                        ? '0 1px 0 rgba(255,255,255,0.7)'
                        : `0 0 8px ${tierStyle.glow}`,
                    }}
                  >
                    {tierStyle.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
        'relative flex animate-pulse flex-col justify-between overflow-hidden border border-white/10 bg-slate-950 p-3',
        scaleMap,
      )}
      style={{ clipPath: chamferClip }}
    >
      <div className="flex items-start justify-between">
        <div className="h-6 w-6 rounded-md bg-white/10" />
        <div className="h-5 w-8 rounded-full bg-white/10" />
      </div>
      <div className="mx-auto mt-1 mb-auto h-20 w-20 rounded-full bg-white/10 sm:h-24 sm:w-24" />
      <div className="mx-auto my-1 h-5 w-24 rounded-full bg-white/10" />
      <div className="mx-auto h-6 w-28 rounded-xl bg-white/10" />
      <div className="mx-auto mt-1 h-4 w-16 rounded-full bg-white/10" />
    </div>
  );
}
