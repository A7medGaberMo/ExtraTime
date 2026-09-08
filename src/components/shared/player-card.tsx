'use client';

import React from 'react';
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
export function formatMainPosition(pos: string): string {
  if (!pos) return 'ST';
  return pos.split('/')[0].trim().toUpperCase();
}

/**
 * Format long player names cleanly for jersey/card display.
 * e.g., "Mohamed Salah" -> "M. SALAH"
 * e.g., "Cristiano Ronaldo" -> "C. RONALDO"
 * e.g., "Kevin De Bruyne" -> "DE BRUYNE"
 * e.g., "Trent Alexander-Arnold" -> "ALEXANDER-ARNOLD"
 */
export function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim().toUpperCase();
  if (trimmed.length <= 10) return trimmed;

  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length > 1) {
    const prefixes = ['DE', 'VAN', 'VON', 'DI', 'DA', 'DEL', 'SAN', 'ST.', 'AL', 'EL', 'LA'];

    // Handle 2-part compound surnames (e.g. "Van Dijk" -> "VAN DIJK", "De Bruyne" -> "DE BRUYNE")
    if (parts.length === 2 && prefixes.includes(parts[0])) {
      return `${parts[0]} ${parts[1]}`;
    }

    // Handle suffix-bearing names (e.g. "Vinicius Junior" -> "VINI JR.")
    const last = parts[parts.length - 1];
    if (last === 'JUNIOR' || last === 'JR' || last === 'JR.') {
      const first = parts[0];
      if (first === 'VINICIUS') return 'VINI JR.';
      return `${first} JR.`;
    }

    // Handle compound prefixes (e.g., DE BRUYNE, VAN DIJK, DI MARIA)
    if (parts.length >= 3 && prefixes.includes(parts[parts.length - 2])) {
      const compoundLastName = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
      if (compoundLastName.length <= 12) {
        return compoundLastName;
      }
    }

    const lastName = parts[parts.length - 1];
    if (lastName.length <= 10) {
      const firstNameInitial = parts[0][0];
      return `${firstNameInitial}. ${lastName}`;
    }
    return lastName;
  }
  return trimmed;
}

export function getDynamicNameSizeClass(displayName: string, size: 'pitch' | 'draft' | 'xs' | 'sm' | 'md' | 'lg'): string {
  const len = displayName.length;
  if (size === 'pitch') {
    if (len > 12) return 'text-[6px] sm:text-[7.5px] tracking-tighter leading-none';
    if (len > 8) return 'text-[7px] sm:text-[8.5px] tracking-tight leading-none';
    return 'text-[7.5px] sm:text-[9px] tracking-tight leading-none';
  }
  if (size === 'draft') {
    if (len > 12) return 'text-[6.5px] xs:text-[7.5px] sm:text-[9px] md:text-[10.5px] lg:text-xs xl:text-[13px] tracking-tight leading-none';
    if (len > 8) return 'text-[7.5px] xs:text-[8.5px] sm:text-[10px] md:text-xs lg:text-[13px] xl:text-[14.5px] tracking-tight leading-none';
    return 'text-[8.5px] xs:text-[9.5px] sm:text-[11px] md:text-[13px] lg:text-sm xl:text-base tracking-tight leading-none';
  }
  if (size === 'xs') {
    if (len > 13) return 'text-[7.5px] sm:text-[8.5px] tracking-tighter leading-none';
    if (len > 10) return 'text-[8.5px] sm:text-[10px] tracking-tight leading-none';
    return 'text-[9.5px] sm:text-xs tracking-tight leading-none';
  }
  if (size === 'sm') {
    if (len > 13) return 'text-[9px] sm:text-[10px] tracking-tight leading-none';
    if (len > 10) return 'text-[10px] sm:text-[11.5px] tracking-tight leading-none';
    return 'text-xs sm:text-[13px] tracking-normal leading-none';
  }
  if (size === 'md') {
    if (len > 13) return 'text-xs sm:text-sm tracking-tight leading-none';
    if (len > 10) return 'text-xs sm:text-[15px] tracking-tight leading-none';
    return 'text-sm sm:text-base tracking-normal leading-none';
  }
  // size === 'lg'
  if (len > 13) return 'text-sm tracking-tight leading-none';
  if (len > 10) return 'text-base tracking-normal leading-none';
  return 'text-lg tracking-normal leading-none';
}

interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: PlayerCardData;
  size?: 'pitch' | 'draft' | 'xs' | 'sm' | 'md' | 'lg';
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
    pitch: {
      card: 'w-[46px] h-[70px] sm:w-[56px] sm:h-[84px] md:w-[62px] md:h-[94px]',
      framePad: 'p-[1px] sm:p-[1.5px]',
      inner: 'p-0.5 sm:p-1',
      header: 'h-2.5 sm:h-3.5',
      num: 'text-[10px] sm:text-[14px] font-black font-card-num',
      etBadge: 'h-2.5 w-2.5 p-0.5 sm:h-3 sm:w-3',
      etLogoSize: 7,
      avatarRing: 'mt-0.5 h-[26px] w-[26px] sm:h-[34px] sm:w-[34px] p-[1px]',
      infoPill: 'mt-0.5 h-2.5 px-0.5 gap-0.5 text-[4.5px] sm:h-3 sm:px-1 sm:gap-1 sm:text-[6px]',
      flag: 'h-1.5 w-2.5 sm:h-2 sm:w-3',
      club: 'h-2 w-2 sm:h-2.5 sm:w-2.5',
      posBadge: 'h-2 min-w-2.5 px-0.5 text-[4.5px] sm:text-[6px] font-black',
      nameWrap: 'h-3 sm:h-4 px-0.5 flex items-center justify-center',
      tierContainer: 'hidden',
      tierBadge: 'px-1 py-0 text-[4px] sm:text-[5px] tracking-[0.1em]',
    },
    draft: {
      card: 'w-[64px] h-[98px] xs:w-[70px] xs:h-[108px] sm:w-[102px] sm:h-[156px] md:w-[124px] md:h-[190px] lg:w-[148px] lg:h-[226px] xl:w-[164px] xl:h-[250px]',
      framePad: 'p-[1px] xs:p-[1.2px] sm:p-[1.5px] md:p-[2px]',
      inner: 'p-1 xs:p-1 sm:p-1.5 md:p-2',
      header: 'h-3 xs:h-3.5 sm:h-4.5 md:h-6 lg:h-7 xl:h-8',
      num: 'text-[12px] xs:text-[14px] sm:text-[18px] md:text-[24px] lg:text-[28px] xl:text-[32px] font-black font-card-num',
      etBadge: 'h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4.5 sm:w-4.5 md:h-6 md:w-6 lg:h-7 lg:w-7 p-0.5',
      etLogoSize: 10,
      avatarRing: 'mt-0.5 h-[34px] w-[34px] xs:h-[38px] xs:w-[38px] sm:h-[54px] sm:w-[54px] md:h-[68px] md:w-[68px] lg:h-[82px] lg:w-[82px] xl:h-[94px] xl:w-[94px] p-[1.2px] sm:p-[1.5px] md:p-[2px]',
      infoPill: 'mt-0.5 h-3 xs:h-3.5 sm:h-4.5 md:h-5.5 lg:h-6.5 px-1 xs:px-1.5 sm:px-2 gap-0.5 xs:gap-1 sm:gap-1.5 text-[5.5px] xs:text-[6.5px] sm:text-[8px] md:text-[9.5px] lg:text-xs',
      flag: 'h-2 w-3 xs:h-2.5 xs:w-3.5 sm:h-3 sm:w-4.5 md:h-3.5 md:w-5.5 lg:h-4 lg:w-6',
      club: 'h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5',
      posBadge: 'h-2.5 min-w-3 xs:h-3 xs:min-w-3.5 sm:h-3.5 sm:min-w-5 md:h-4 md:min-w-6 lg:h-4.5 lg:min-w-7 px-0.5 sm:px-1 text-[5.5px] xs:text-[6.5px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black',
      nameWrap: 'py-0.5 px-0.5 xs:px-1 sm:py-1 sm:px-1.5 md:py-1.5 md:px-2',
      tierContainer: 'pt-0.5 pb-0 hidden sm:block',
      tierBadge: 'px-1 sm:px-2 md:px-2.5 py-0 sm:py-0.5 text-[5px] sm:text-[7px] md:text-[8px] lg:text-[9px] tracking-[0.16em]',
    },
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
        aria-label={props['aria-label'] || (props.onClick ? `${displayName}, ${mainPosition}, rating ${rating}, ${tierStyle.name}` : undefined)}
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
                  borderRadius: (size === 'pitch' || size === 'draft') ? '5px 5px 4px 4px' : '999px 999px 12px 12px',
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
                    'font-card font-extrabold relative z-10 w-full max-w-full truncate text-center uppercase',
                    (size === 'pitch' || size === 'draft') ? 'px-0.5' : 'px-1',
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

export function PlayerCardSkeleton({ size = 'md' }: { size?: 'pitch' | 'xs' | 'sm' | 'md' | 'lg' }) {
  const scaleMap = {
    pitch: 'w-[54px] h-[82px] sm:w-[68px] sm:h-[104px]',
    xs: 'w-24 h-[148px] sm:w-28 sm:h-[174px]',
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
