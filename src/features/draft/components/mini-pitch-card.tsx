'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerCard } from '@/components/shared/player-card';
import type { PlayerCardData, Tier } from '@/types/player';
import type { EnrichedStarterSlot } from '../types/draft';

interface MiniPitchCardProps {
  slot: EnrichedStarterSlot;
  isSelected?: boolean;
  isSwapCandidate?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function MiniPitchCard({
  slot,
  isSelected = false,
  isSwapCandidate = false,
  onClick,
  disabled = false,
}: MiniPitchCardProps) {
  const player = slot.player;
  if (!player) return null;

  const chem = slot.chemistry ?? 0;

  const cardData: PlayerCardData = {
    id: player.id,
    name: player.name,
    tier: (player.tier as Tier) || 'GOLD',
    position: slot.position || player.position,
    club: player.clubName || '',
    nation: player.nationName || '',
    imageUrl: player.imageUrl,
    isLegend: player.isLegend,
    rating: player.rating,
  };

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${slot.isCaptain ? 'Captain ' : ''}${player.name}, ${cardData.position}, rating ${player.rating}, ${chem} chemistry`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      whileHover={disabled ? undefined : { scale: 1.08, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      className={`group relative flex flex-col items-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl ${
        isSelected
          ? 'scale-105 z-30'
          : isSwapCandidate
            ? 'z-20 hover:scale-105'
            : 'z-10'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Captain Golden Armband / Crown — Luxury Apple Watch Gold Finish */}
      {slot.isCaptain && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-slate-950 font-black shadow-[0_2px_10px_rgba(245,158,11,0.8)] z-30 border border-white/60">
          <AppIcon icon={Crown} size={11} weight="fill" />
        </span>
      )}

      {/* Outer Glow Halo for Selection or Swap Target */}
      <div
        className={`relative transition-all rounded-xl ${
          isSelected
            ? 'ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(0,240,255,0.9),inset_0_1px_0_0_rgba(255,255,255,0.4)] scale-105'
            : isSwapCandidate
              ? 'ring-2 ring-cyan-400/80 shadow-[0_0_16px_rgba(0,240,255,0.5)] animate-pulse'
              : ''
        }`}
      >
        <PlayerCard player={cardData} size="pitch" />

        {/* Apple Watch Style Chemistry Capsule (3 Jewel Pips) */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-full bg-black/90 px-1.5 py-[2px] border border-white/20 backdrop-blur-md shadow-md z-20">
          {[1, 2, 3].map((pip) => (
            <span
              key={pip}
              className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full transition-all ${
                pip <= chem
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]'
                  : 'bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

