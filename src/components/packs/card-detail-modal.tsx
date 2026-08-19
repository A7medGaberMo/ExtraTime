'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PlayerCard } from '@/components/shared/player-card';
import { ETLogo } from '@/components/shared/et-logo';
import { ClubCrestBadge, CountryFlagBadge } from '@/components/shared/card-badges';
import type { PlayerCardData } from '@/types/player';

interface CardDetailModalProps {
  card: PlayerCardData | null;
  onClose: () => void;
}

export function CardDetailModal({
  card,
  onClose,
}: CardDetailModalProps) {
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      id="modal-card-inspection"
    >
      <div
        className="relative bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-colors cursor-pointer"
          id="btn-close-card-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title Header */}
        <div className="text-center space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-lime px-3 py-0.5 rounded-full bg-lime/10 border border-lime/30">
            <ETLogo variant="icon-only" size={12} />
            <span>Card Telemetry</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight pt-1">
            {card.name}
          </h3>
        </div>

        {/* 3D Holographic Card View */}
        <div className="scale-100 transition-transform my-1">
          <PlayerCard player={card} size="lg" showTierLabelBelow />
        </div>

        {/* Player Metadata Specs */}
        <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950/90 p-3.5 rounded-2xl border border-white/10">
          <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
            <ClubCrestBadge clubName={card.club} className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-steel font-bold uppercase block">Club</span>
              <p className="text-white font-bold truncate text-[11px]">{card.club}</p>
            </div>
          </div>

          <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
            <CountryFlagBadge nationName={card.nation} className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-steel font-bold uppercase block">Nation</span>
              <p className="text-white font-bold truncate text-[11px]">{card.nation}</p>
            </div>
          </div>

          <div className="space-y-0.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
            <span className="text-[9px] text-steel font-bold uppercase block">Position</span>
            <p className="text-lime font-black font-mono">{card.position}</p>
          </div>

          <div className="space-y-0.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
            <span className="text-[9px] text-steel font-bold uppercase block">Tier Classification</span>
            <p className="text-amber-400 font-black font-mono">{card.tier}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          id="btn-done-modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}

