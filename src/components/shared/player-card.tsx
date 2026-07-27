'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { PlayerCardData } from '@/types/player';
import { TierBadge } from './tier-badge';
import { PlayerSilhouette } from './player-silhouette';
import { Crown, Sparkles, ShieldAlert, Shirt } from 'lucide-react';

const playerCardVariants = cva(
  'group relative flex flex-col items-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl select-none',
  {
    variants: {
      tier: {
        ICON: 'border-2 border-amber-400/80 bg-gradient-to-b from-amber-300/20 via-amber-900/30 to-[#181105] shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:shadow-[0_0_35px_rgba(245,158,11,0.45)]',
        MASTER:
          'border border-purple-500/50 bg-gradient-to-b from-purple-500/20 via-purple-950/40 to-[#0e0719] hover:border-purple-400 hover:shadow-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
        ELITE_PLUS:
          'border border-blue-500/50 bg-gradient-to-b from-blue-500/20 via-blue-950/40 to-[#070e1e] hover:border-blue-400 hover:shadow-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        ELITE:
          'border border-cyan-500/40 bg-gradient-to-b from-cyan-500/15 via-slate-900 to-[#06151a] hover:border-cyan-400 hover:shadow-cyan-500/20',
        GOLD: 'border border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-slate-900 to-[#181408] hover:border-amber-400 hover:shadow-amber-500/20',
        SILVER:
          'border border-slate-400/40 bg-gradient-to-b from-slate-400/15 via-slate-900 to-[#0f141d] hover:border-slate-300 hover:shadow-slate-400/20',
        BRONZE:
          'border border-orange-700/40 bg-gradient-to-b from-orange-700/15 via-slate-900 to-[#170e0a] hover:border-orange-600 hover:shadow-orange-700/20',
      },
      size: {
        sm: 'w-36 p-3 rounded-xl min-h-[190px]',
        md: 'w-48 p-4 rounded-2xl min-h-[250px]',
        lg: 'w-56 p-5 rounded-3xl min-h-[290px]',
      },
    },
    defaultVariants: {
      tier: 'SILVER',
      size: 'md',
    },
  },
);

interface PlayerCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof playerCardVariants> {
  player: PlayerCardData;
}

export function PlayerCard({ className, player, size = 'md', ...props }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Generate a consistent silhouette variant from the player name
  const silhouetteVariant = ((player.name.charCodeAt(0) + player.name.length) % 6) as 0 | 1 | 2 | 3 | 4 | 5;

  const isIcon = player.tier === 'ICON' || player.isLegend;

  // Check if image URL is valid and not a placeholder
  const hasValidImage =
    Boolean(player.imageUrl) &&
    !imgError &&
    !player.imageUrl?.includes('Photo-Missing.png') &&
    player.imageUrl?.trim() !== '';

  const cardSize = size || 'md';

  // ---------------------------------------------------------------------------
  // ICON SPECIAL CARD DESIGN
  // ---------------------------------------------------------------------------
  if (isIcon) {
    return (
      <div
        className={cn(
          playerCardVariants({ tier: 'ICON', size: cardSize }),
          'relative bg-[#120d04] ring-1 ring-amber-400/40',
          className,
        )}
        {...props}
      >
        {/* Shimmer light effect line overlay */}
        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent group-hover:animate-shine" />

        {/* Golden top filigree / crown banner */}
        <div className="w-full flex items-center justify-between border-b border-amber-400/30 pb-2 mb-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 px-2 py-0.5 rounded-md font-extrabold text-[10px] tracking-wider shadow-sm">
            <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
            <span>ICON</span>
          </div>

          {/* Kit Number badge for ICON */}
          {player.kitNumber !== undefined && player.kitNumber !== null && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono font-extrabold text-xs shadow-inner">
              <span className="text-[9px] text-amber-400/70 font-sans">#</span>
              <span>{player.kitNumber}</span>
            </div>
          )}
        </div>

        {/* Position badge */}
        <div className="absolute top-10 left-3 z-10">
          <span className="inline-flex items-center rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-300 backdrop-blur-md">
            {player.position}
          </span>
        </div>

        {/* Player Image / Shadow Silhouette */}
        <div className="relative my-2 flex items-center justify-center">
          <div
            className={cn(
              'relative flex items-center justify-center overflow-hidden rounded-full border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/20 via-amber-900/40 to-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105',
              cardSize === 'sm' && 'h-20 w-20',
              cardSize === 'md' && 'h-24 w-24',
              cardSize === 'lg' && 'h-28 w-28',
            )}
          >
            {hasValidImage ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              /* Shadow silhouette as fallback */
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent">
                <PlayerSilhouette
                  variant={silhouetteVariant}
                  className={cn(
                    'text-amber-300/80 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] transition-all duration-300 group-hover:opacity-100',
                    cardSize === 'sm' && 'h-16 w-16 opacity-75',
                    cardSize === 'md' && 'h-20 w-20 opacity-80',
                    cardSize === 'lg' && 'h-24 w-24 opacity-85',
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Player Name */}
        <h3
          className={cn(
            'mb-1 text-center font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 max-w-full truncate px-1',
            cardSize === 'sm' && 'text-xs',
            cardSize === 'md' && 'text-sm',
            cardSize === 'lg' && 'text-base',
          )}
        >
          {player.name}
        </h3>

        {/* Club & Nation info */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-200/70 z-10 w-full px-1">
          <span className="truncate max-w-[80px] font-medium">{player.club}</span>
          <span className="text-amber-400/50">•</span>
          <span className="truncate max-w-[65px] font-medium">{player.nation}</span>
        </div>

        {/* Legend Ribbon bottom */}
        <div className="mt-auto pt-2 z-10 w-full flex items-center justify-center">
          <div className="flex items-center gap-1 text-[9px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-400/30 rounded-full px-2.5 py-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>LEGENDARY</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // REGULAR CARD DESIGN (MASTER, ELITE_PLUS, ELITE, GOLD, SILVER, BRONZE)
  // ---------------------------------------------------------------------------
  return (
    <div
      className={cn(playerCardVariants({ tier: player.tier, size: cardSize }), 'bg-[#0b101d]', className)}
      {...props}
    >
      {/* Tier badge top right */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <TierBadge tier={player.tier} />
      </div>

      {/* Position badge top left */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/80 backdrop-blur-sm border border-white/10">
          {player.position}
        </span>
      </div>

      {/* Kit Number display top right below tier or alongside */}
      {player.kitNumber !== undefined && player.kitNumber !== null && (
        <div className="absolute top-9 left-2.5 z-10">
          <span className="inline-flex items-center rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700/60 shadow-sm">
            #{player.kitNumber}
          </span>
        </div>
      )}

      {/* Player avatar (Image if present, else Silhouette shadow) */}
      <div
        className={cn(
          'relative mb-3 mt-4 flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-900/80 shadow-md transition-transform duration-300 group-hover:scale-105',
          cardSize === 'sm' && 'h-20 w-20',
          cardSize === 'md' && 'h-24 w-24',
          cardSize === 'lg' && 'h-28 w-28',
        )}
      >
        {hasValidImage ? (
          <img
            src={player.imageUrl}
            alt={player.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          /* Shadow silhouette fallback */
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-white/5 to-transparent">
            <PlayerSilhouette
              variant={silhouetteVariant}
              className={cn(
                'text-slate-300 opacity-60 transition-opacity duration-300 group-hover:opacity-90',
                cardSize === 'sm' && 'h-16 w-16',
                cardSize === 'md' && 'h-20 w-20',
                cardSize === 'lg' && 'h-24 w-24',
              )}
            />
          </div>
        )}
      </div>

      {/* Player name */}
      <h3
        className={cn(
          'mb-1 text-center font-bold leading-tight text-white max-w-full truncate px-1',
          cardSize === 'sm' && 'text-xs',
          cardSize === 'md' && 'text-sm',
          cardSize === 'lg' && 'text-base',
        )}
      >
        {player.name}
      </h3>

      {/* Club & Nation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 max-w-full truncate px-1 mt-auto">
        <span className="max-w-[75px] truncate">{player.club}</span>
        <span className="text-slate-600">•</span>
        <span className="max-w-[60px] truncate">{player.nation}</span>
      </div>
    </div>
  );
}

/** Skeleton loading state for PlayerCard */
export function PlayerCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-white/5 bg-[#0b101d] p-5 animate-pulse',
        size === 'sm' && 'w-36 p-3 min-h-[190px]',
        size === 'md' && 'w-48 p-4 min-h-[250px]',
        size === 'lg' && 'w-56 p-5 min-h-[290px]',
      )}
    >
      <div className="absolute top-2.5 right-2.5 h-5 w-14 rounded-full bg-white/5" />
      <div className="mb-3 mt-4 h-24 w-24 rounded-full bg-white/5" />
      <div className="mb-2 h-4 w-24 rounded bg-white/5" />
      <div className="h-3 w-28 rounded bg-white/5" />
    </div>
  );
}

