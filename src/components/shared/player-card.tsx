'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerCardData, Tier } from '@/types/player';
import { CardBackgroundTexture } from './card-textures';
import { ClubCrestBadge, CountryFlagBadge } from './card-badges';
import { ETLogo } from './et-logo';
import { PlayerSilhouette } from './player-silhouette';

export interface TierConfig {
  name: string;
  identity: string;
  materials: string;
  colors: {
    primary: string;
    highlight: string;
    shadow: string;
    accent: string;
  };
  frameGradient: string;
  bgGradient: string;
  rimGlow: string;
  textShadow: string;
}

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  ICON: {
    name: 'ICON',
    identity: 'Legendary',
    materials: 'White marble, Ivory ceramic, Brushed gold',
    colors: {
      primary: '#F7F5EF',
      highlight: '#F3E2A9',
      shadow: '#8B6A22',
      accent: '#D4AF37',
    },
    frameGradient: 'from-[#FFF8E7] via-[#D4AF37] to-[#8B6A22]',
    bgGradient: 'from-[#2C2518] via-[#16130C] to-[#0A0805]',
    rimGlow: 'rgba(212, 175, 55, 0.45)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  MASTER: {
    name: 'MASTER',
    identity: 'Elite Masterpiece',
    materials: 'Royal crystal, Purple titanium, Luxury lacquer',
    colors: {
      primary: '#7C3AED',
      highlight: '#D8B4FE',
      shadow: '#4C1D95',
      accent: '#E9D5FF',
    },
    frameGradient: 'from-[#F3E8FF] via-[#7C3AED] to-[#4C1D95]',
    bgGradient: 'from-[#240A47] via-[#120424] to-[#07010E]',
    rimGlow: 'rgba(124, 58, 237, 0.45)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  ELITE_PLUS: {
    name: 'ELITE+',
    identity: 'World Class Azure',
    materials: 'Electric azure, Cyan titanium, Sapphire crystal',
    colors: {
      primary: '#0EA5E9',
      highlight: '#7DD3FC',
      shadow: '#0369A1',
      accent: '#E0F2FE',
    },
    frameGradient: 'from-[#E0F2FE] via-[#0EA5E9] to-[#0369A1]',
    bgGradient: 'from-[#0C4A6E] via-[#031D33] to-[#010B14]',
    rimGlow: 'rgba(14, 165, 233, 0.45)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  ELITE: {
    name: 'ELITE',
    identity: 'Professional Excellence Red',
    materials: 'Crimson ruby, Red metallic, Premium lacquer',
    colors: {
      primary: '#E11D48',
      highlight: '#FDA4AF',
      shadow: '#881337',
      accent: '#FFE4E6',
    },
    frameGradient: 'from-[#FFE4E6] via-[#E11D48] to-[#881337]',
    bgGradient: 'from-[#4C0519] via-[#1C020B] to-[#050002]',
    rimGlow: 'rgba(225, 29, 72, 0.45)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  GOLD: {
    name: 'GOLD',
    identity: 'Premium Professional',
    materials: 'Champagne gold, Brushed metallic',
    colors: {
      primary: '#EAB308',
      highlight: '#FDE68A',
      shadow: '#78350F',
      accent: '#FFF7CC',
    },
    frameGradient: 'from-[#FEF3C7] via-[#EAB308] to-[#78350F]',
    bgGradient: 'from-[#332402] via-[#1A1201] to-[#080500]',
    rimGlow: 'rgba(234, 179, 8, 0.45)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  SILVER: {
    name: 'SILVER',
    identity: 'Professional',
    materials: 'Brushed aluminum, Titanium',
    colors: {
      primary: '#CBD5E1',
      highlight: '#F8FAFC',
      shadow: '#64748B',
      accent: '#EEF2F7',
    },
    frameGradient: 'from-[#F8FAFC] via-[#CBD5E1] to-[#64748B]',
    bgGradient: 'from-[#1E293B] via-[#0F172A] to-[#020617]',
    rimGlow: 'rgba(203, 213, 225, 0.35)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
  BRONZE: {
    name: 'BRONZE',
    identity: 'Rising Talent',
    materials: 'Copper, Bronze, Oxidized metal',
    colors: {
      primary: '#C97A3A',
      highlight: '#F0C8A0',
      shadow: '#6A3E1B',
      accent: '#F8E4D0',
    },
    frameGradient: 'from-[#F0C8A0] via-[#C97A3A] to-[#6A3E1B]',
    bgGradient: 'from-[#2A160A] via-[#140B04] to-[#060301]',
    rimGlow: 'rgba(201, 122, 58, 0.35)',
    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
  },
};

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
  const [imgError, setImgError] = useState(false);

  const tier = (player.tier as Tier) || 'SILVER';
  const tierCfg = TIER_CONFIGS[tier] || TIER_CONFIGS.SILVER;
  const silhouetteVariant = ((player.name.charCodeAt(0) + player.name.length) % 6) as 0 | 1 | 2 | 3 | 4 | 5;

  const hasValidImage =
    Boolean(player.imageUrl) &&
    !imgError &&
    !player.imageUrl?.includes('Photo-Missing.png') &&
    player.imageUrl?.trim() !== '';

  const kitNum = player.kitNumber ?? (player.isLegend ? 10 : (player.name.length % 20) + 1);
  const displayName = formatDisplayName(player.name);
  const mainPosition = formatMainPosition(player.position);

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
    <div className="flex flex-col items-center group">
      {/* Outer Card Shell with Chamfered Metallic Frame */}
      <div
        className={cn(
          'relative flex flex-col items-center transition-all duration-300 select-none cursor-pointer group-hover:-translate-y-2 group-hover:brightness-105',
          scaleMap.card,
          className
        )}
        style={{
          filter: `drop-shadow(0 14px 28px rgba(0,0,0,0.85)) drop-shadow(0 0 16px ${tierCfg.rimGlow})`,
        }}
        {...props}
      >
        {/* Layer 1: Outer Metallic Edge Frame */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-b p-[3px] shadow-2xl overflow-hidden',
            tierCfg.frameGradient
          )}
          style={{ clipPath: chamferClip }}
        >
          {/* Layer 2: Shadow Groove & Inner Surface */}
          <div
            className={cn(
              'relative w-full h-full bg-gradient-to-b overflow-hidden flex flex-col justify-between p-2.5 sm:p-3',
              tierCfg.bgGradient
            )}
            style={{ clipPath: chamferClip }}
          >
            {/* Layer 3: Subtle Background Pattern Texture (4% opacity) */}
            <CardBackgroundTexture tier={tier} />

            {/* Layer 4: Specular Border */}
            <div className="absolute inset-0 border border-white/20 pointer-events-none" style={{ clipPath: chamferClip }} />

            {/* Layer 5: Holographic Light Sweep on Hover */}
            <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-25 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine pointer-events-none z-30" />

            {/* 1. TOP HEADER: KIT NUMBER (LEFT) & ET LOGO (RIGHT) */}
            <div className="relative z-20 w-full flex items-start justify-between">
              {/* TOP LEFT: Shirt Number */}
              <div className="flex flex-col items-start leading-none pl-0.5 pt-0.5">
                <span
                  className={cn('uppercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]', scaleMap.num)}
                  style={{
                    color: tierCfg.colors.highlight,
                    fontFamily: 'var(--font-anton), var(--font-bebas), sans-serif',
                    background: `linear-gradient(180deg, #FFFFFF 20%, ${tierCfg.colors.highlight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {kitNum}
                </span>
              </div>

              {/* TOP RIGHT: Integrated Metallic ET Logo Badge */}
              <div className="flex flex-col items-center pr-0.5 pt-0.5">
                <div
                  className="px-2 py-0.5 rounded-full border border-white/20 bg-slate-950/70 backdrop-blur-md shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ borderColor: `${tierCfg.colors.accent}60` }}
                >
                  <ETLogo variant="card-badge" size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />
                </div>
              </div>
            </div>

            {/* 2. CENTER: CIRCULAR PLAYER PORTRAIT (PUSHED UP NEAR TOP HEADER) */}
            <div className="relative z-10 w-full flex items-center justify-center pointer-events-none pt-0 sm:pt-1">
              <div
                className={cn(
                  'rounded-full border-2 border-white/30 bg-slate-950/60 overflow-hidden flex items-center justify-center shadow-2xl relative transition-transform duration-300 group-hover:scale-105',
                  scaleMap.avatar
                )}
                style={{
                  borderColor: `${tierCfg.colors.highlight}90`,
                  boxShadow: `0 0 25px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.5), 0 0 15px ${tierCfg.rimGlow}`,
                }}
              >
                {hasValidImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <PlayerSilhouette
                    variant={silhouetteVariant}
                    className="w-3/4 h-3/4 text-white/90 transition-transform duration-300 group-hover:scale-110"
                  />
                )}
              </div>
            </div>

            {/* 3. HORIZONTAL OCD INFO ROW (NATION FLAG, CLUB CREST, SINGLE MAIN POSITION BADGE) */}
            <div className="relative z-20 w-full flex items-center justify-center my-1.5">
              <div
                className={cn(
                  'w-auto rounded-full bg-slate-950/85 backdrop-blur-md border border-white/25 shadow-lg flex items-center justify-center text-center',
                  scaleMap.infoPill
                )}
                style={{ borderColor: `${tierCfg.colors.accent}50` }}
              >
                {/* NATION FLAG */}
                <CountryFlagBadge nationName={player.nation} className="w-6 h-4 sm:w-7 sm:h-4.5 rounded-sm border-0 shadow-none p-0 shrink-0" />

                {/* CLUB CREST */}
                <ClubCrestBadge clubName={player.club} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-0 shadow-none p-0 shrink-0" />

                {/* SINGLE MAIN POSITION BADGE */}
                <span
                  className={cn(
                    'font-black uppercase tracking-wider text-white bg-white/10 rounded border border-white/15 leading-none flex items-center justify-center',
                    scaleMap.posBadge
                  )}
                  style={{ fontFamily: 'var(--font-inter-tight), sans-serif' }}
                >
                  {mainPosition}
                </span>
              </div>
            </div>

            {/* 4. BOTTOM SECTION: SLEEK FLOATING GLASS PLAYER NAME BAR */}
            <div className="relative z-20 w-full mt-auto mb-0.5">
              <div className="w-full bg-slate-950/85 backdrop-blur-xl border border-white/25 rounded-xl py-1.5 px-1 shadow-2xl flex items-center justify-center text-center">
                <h3
                  className={cn(
                    'font-black uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] truncate w-full px-0.5 text-center',
                    getDynamicNameSizeClass(displayName, size)
                  )}
                  style={{
                    fontFamily: 'var(--font-anton), var(--font-bebas), var(--font-inter-tight), sans-serif',
                    background: `linear-gradient(180deg, #FFFFFF 30%, ${tierCfg.colors.highlight} 100%)`,
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
          className="mt-1.5 text-[10px] font-black uppercase tracking-widest"
          style={{ color: tierCfg.colors.highlight }}
        >
          {tierCfg.name}
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
        'relative border border-white/10 bg-slate-950 p-4 animate-pulse flex flex-col justify-between overflow-hidden',
        scaleMap
      )}
      style={{ clipPath: chamferClip }}
    >
      <div className="flex justify-between items-start">
        <div className="h-7 w-7 bg-white/10 rounded-md" />
        <div className="h-5 w-5 bg-white/10 rounded-full" />
      </div>
      <div className="mt-2 mb-auto h-24 w-24 rounded-full bg-white/10 mx-auto" />
      <div className="h-6 w-32 rounded-full bg-white/10 mx-auto my-1" />
      <div className="h-6 w-28 bg-white/10 rounded-xl mx-auto" />
    </div>
  );
}
