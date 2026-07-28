'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { PlayerCardData, Tier } from '@/types/player';
import { TierBadge } from './tier-badge';
import { PlayerSilhouette } from './player-silhouette';
import { Crown, Sparkles, Shield, Star, Award } from 'lucide-react';

const tierCardStyles: Record<Tier, {
  border: string;
  bg: string;
  glow: string;
  accent: string;
  headerBg: string;
  ratingColor: string;
}> = {
  ICON: {
    border: 'border-2 border-amber-400/90',
    bg: 'bg-gradient-to-b from-amber-400/30 via-slate-950 to-amber-950/40',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]',
    accent: '#F59E0B',
    headerBg: 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950',
    ratingColor: 'text-amber-400',
  },
  MASTER: {
    border: 'border-2 border-purple-400/80',
    bg: 'bg-gradient-to-b from-purple-500/25 via-slate-950 to-purple-950/40',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]',
    accent: '#A855F7',
    headerBg: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white',
    ratingColor: 'text-purple-300',
  },
  ELITE_PLUS: {
    border: 'border-2 border-blue-400/80',
    bg: 'bg-gradient-to-b from-blue-500/25 via-slate-950 to-blue-950/40',
    glow: 'shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_35px_rgba(59,130,246,0.35)]',
    accent: '#3B82F6',
    headerBg: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white',
    ratingColor: 'text-blue-300',
  },
  ELITE: {
    border: 'border border-emerald-400/70',
    bg: 'bg-gradient-to-b from-emerald-500/20 via-slate-950 to-emerald-950/30',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    accent: '#10B981',
    headerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-slate-950',
    ratingColor: 'text-emerald-400',
  },
  GOLD: {
    border: 'border border-amber-500/60',
    bg: 'bg-gradient-to-b from-amber-500/15 via-slate-950 to-slate-900',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.12)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    accent: '#F59E0B',
    headerBg: 'bg-amber-500/20 text-amber-300',
    ratingColor: 'text-amber-400',
  },
  SILVER: {
    border: 'border border-slate-400/60',
    bg: 'bg-gradient-to-b from-slate-400/15 via-slate-950 to-slate-900',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.1)] hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]',
    accent: '#94A3B8',
    headerBg: 'bg-slate-400/20 text-slate-200',
    ratingColor: 'text-slate-300',
  },
  BRONZE: {
    border: 'border border-amber-700/60',
    bg: 'bg-gradient-to-b from-amber-800/15 via-slate-950 to-slate-900',
    glow: 'shadow-[0_0_12px_rgba(180,83,9,0.1)] hover:shadow-[0_0_20px_rgba(180,83,9,0.2)]',
    accent: '#D97706',
    headerBg: 'bg-amber-800/20 text-amber-300',
    ratingColor: 'text-amber-500',
  },
};

const tierRatingMap: Record<Tier, number> = {
  ICON: 95,
  MASTER: 91,
  ELITE_PLUS: 88,
  ELITE: 85,
  GOLD: 81,
  SILVER: 75,
  BRONZE: 70,
};

interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: PlayerCardData;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerCard({ className, player, size = 'md', ...props }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  const silhouetteVariant = ((player.name.charCodeAt(0) + player.name.length) % 6) as 0 | 1 | 2 | 3 | 4 | 5;
  const tier = (player.tier as Tier) || 'SILVER';
  const tierStyle = tierCardStyles[tier] || tierCardStyles.SILVER;
  const overallRating = tierRatingMap[tier] || 75;
  const isIcon = tier === 'ICON' || player.isLegend;

  const hasValidImage =
    Boolean(player.imageUrl) &&
    !imgError &&
    !player.imageUrl?.includes('Photo-Missing.png') &&
    player.imageUrl?.trim() !== '';

  const sizeStyles = {
    sm: 'w-36 min-h-[210px] p-2.5 rounded-2xl',
    md: 'w-48 min-h-[270px] p-3.5 rounded-3xl',
    lg: 'w-56 min-h-[310px] p-4 rounded-[2rem]',
  }[size];

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center overflow-hidden transition-all duration-300 hover:-translate-y-2 select-none backdrop-blur-md',
        tierStyle.border,
        tierStyle.bg,
        tierStyle.glow,
        sizeStyles,
        className
      )}
      {...props}
    >
      {/* Authentic Foil Diagonal Light Streak */}
      <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine pointer-events-none" />

      {/* Top FUT Style Header: Rating + Position */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 mb-2 z-10">
        <div className="flex items-center gap-1.5">
          <span className={cn('font-stats text-base md:text-lg font-black leading-none', tierStyle.ratingColor)}>
            {overallRating}
          </span>
          <span className="text-[10px] font-black uppercase text-white/90 px-1.5 py-0.5 rounded bg-white/10 border border-white/10">
            {player.position}
          </span>
        </div>

        {/* Kit Number / Tier Crest */}
        <div className="flex items-center gap-1">
          {isIcon ? (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
              <Crown className="w-3 h-3 fill-slate-950" /> ICON
            </span>
          ) : (
            <TierBadge tier={tier} />
          )}
        </div>
      </div>

      {/* Player Portrait Avatar */}
      <div className="relative my-1 flex items-center justify-center">
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-full border-2 bg-slate-950 shadow-xl transition-transform duration-300 group-hover:scale-105',
            size === 'sm' && 'h-20 w-20',
            size === 'md' && 'h-24 w-24',
            size === 'lg' && 'h-28 w-28'
          )}
          style={{ borderColor: `${tierStyle.accent}80` }}
        >
          {hasValidImage ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-white/10 to-transparent" style={{ color: tierStyle.accent }}>
              <PlayerSilhouette
                variant={silhouetteVariant}
                className={cn(
                  'transition-opacity duration-300 group-hover:opacity-100',
                  size === 'sm' && 'h-16 w-16 opacity-75',
                  size === 'md' && 'h-20 w-20 opacity-80',
                  size === 'lg' && 'h-24 w-24 opacity-85'
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player Name */}
      <h3
        className={cn(
          'mt-1 text-center font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-10 max-w-full truncate px-1',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}
      >
        {player.name}
      </h3>

      {/* Club & Nation Tag Pill */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-300 z-10 w-full px-1 mt-0.5">
        <span className="truncate max-w-[80px] font-semibold">{player.club}</span>
        <span className="text-slate-600">•</span>
        <span className="truncate max-w-[65px] font-semibold">{player.nation}</span>
      </div>

      {/* Bottom Authentic Foil Ribbon */}
      <div className="mt-auto pt-2 z-10 w-full flex items-center justify-center">
        <div
          className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border shadow-sm"
          style={{
            color: tierStyle.accent,
            backgroundColor: `${tierStyle.accent}15`,
            borderColor: `${tierStyle.accent}40`,
          }}
        >
          {isIcon ? (
            <>
              <Sparkles className="w-2.5 h-2.5" /> LEGENDARY EDITION
            </>
          ) : (
            <>
              <Award className="w-2.5 h-2.5" /> OFFICIAL FUT CARD
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayerCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-white/10 bg-slate-950 p-4 animate-pulse relative',
        size === 'sm' && 'w-36 min-h-[210px]',
        size === 'md' && 'w-48 min-h-[270px]',
        size === 'lg' && 'w-56 min-h-[310px]'
      )}
    >
      <div className="w-full flex justify-between items-center mb-3">
        <div className="h-5 w-10 bg-white/10 rounded" />
        <div className="h-5 w-12 bg-white/10 rounded" />
      </div>
      <div className="mb-3 h-24 w-24 rounded-full bg-white/10" />
      <div className="mb-1 h-4 w-24 rounded bg-white/10" />
      <div className="h-3 w-28 rounded bg-white/10" />
    </div>
  );
}
