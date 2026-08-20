'use client';

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Shield, Globe, Award } from 'lucide-react';
import { PlayerCard } from '@/components/shared/player-card';
import { ETLogo } from '@/components/shared/et-logo';
import { ClubCrestBadge, CountryFlagBadge } from '@/components/shared/card-badges';
import type { PlayerCardData } from '@/types/player';
import { getTierStyle } from '@/lib/tier-styles';
import { sfx } from '@/lib/sfx';

interface CardDetailModalProps {
  card: PlayerCardData | null;
  onClose: () => void;
  cardsList?: PlayerCardData[];
  onSelectCard?: (card: PlayerCardData) => void;
}

export function CardDetailModal({
  card,
  onClose,
  cardsList,
  onSelectCard,
}: CardDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (cardsList && cardsList.length > 1 && card && onSelectCard) {
        const currentIndex = cardsList.findIndex((c) => c.id === card.id);
        if (e.key === 'ArrowRight' && currentIndex < cardsList.length - 1) {
          sfx.cardDeal();
          onSelectCard(cardsList[currentIndex + 1]);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          sfx.cardDeal();
          onSelectCard(cardsList[currentIndex - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, cardsList, onClose, onSelectCard]);

  if (!card) return null;
  const tierStyle = getTierStyle(card.tier);

  const currentIndex = cardsList ? cardsList.findIndex((c) => c.id === card.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = cardsList && currentIndex >= 0 && currentIndex < cardsList.length - 1;

  const handlePrev = () => {
    if (hasPrev && cardsList && onSelectCard) {
      sfx.cardDeal();
      onSelectCard(cardsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && cardsList && onSelectCard) {
      sfx.cardDeal();
      onSelectCard(cardsList[currentIndex + 1]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      id="modal-card-inspection"
    >
      <div
        className="relative bg-slate-900/95 border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center gap-3.5 animate-scale-in my-auto max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: `0 24px 48px rgba(0,0,0,0.8), 0 0 32px ${tierStyle.glow}`,
          borderColor: `${tierStyle.accent}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Navigation & Close */}
        <div className="w-full flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-950/80 border" style={{ borderColor: `${tierStyle.accent}50`, color: tierStyle.highlight }}>
            <ETLogo variant="icon-only" size={12} />
            <span>Card Telemetry</span>
          </div>

          <div className="flex items-center gap-1">
            {cardsList && cardsList.length > 1 && (
              <span className="text-[10px] font-mono text-steel px-2 font-bold">
                {currentIndex + 1} / {cardsList.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-colors cursor-pointer"
              id="btn-close-card-modal"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Holographic Card View with Next/Prev Arrow Triggers */}
        <div className="relative w-full flex items-center justify-center my-1">
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/80 border border-white/20 text-white hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md cursor-pointer"
              aria-label="Previous Card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="scale-90 sm:scale-100 transition-transform">
            <PlayerCard player={card} size="lg" showTierLabelBelow />
          </div>

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/80 border border-white/20 text-white hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md cursor-pointer"
              aria-label="Next Card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Player Metadata Specs Grid */}
        <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950/90 p-3 rounded-xl sm:rounded-2xl border border-white/10">
          <div className="space-y-1 p-2 rounded-lg sm:rounded-xl bg-slate-900/70 border border-white/5 flex items-center gap-2">
            <ClubCrestBadge clubName={card.club} className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] sm:text-[9px] text-steel font-bold uppercase block flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Club
              </span>
              <p className="text-white font-bold truncate text-[10px] sm:text-[11px]">{card.club}</p>
            </div>
          </div>

          <div className="space-y-1 p-2 rounded-lg sm:rounded-xl bg-slate-900/70 border border-white/5 flex items-center gap-2">
            <CountryFlagBadge nationName={card.nation} className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] sm:text-[9px] text-steel font-bold uppercase block flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> Nation
              </span>
              <p className="text-white font-bold truncate text-[10px] sm:text-[11px]">{card.nation}</p>
            </div>
          </div>

          <div className="space-y-0.5 p-2 rounded-lg sm:rounded-xl bg-slate-900/70 border border-white/5">
            <span className="text-[8px] sm:text-[9px] text-steel font-bold uppercase block">Position</span>
            <p className="text-lime font-black font-mono text-xs sm:text-sm">{card.position}</p>
          </div>

          <div className="space-y-0.5 p-2 rounded-lg sm:rounded-xl bg-slate-900/70 border border-white/5">
            <span className="text-[8px] sm:text-[9px] text-steel font-bold uppercase block flex items-center gap-1">
              <Award className="w-2.5 h-2.5" /> Classification
            </span>
            <p className="font-black font-mono text-xs sm:text-sm" style={{ color: tierStyle.highlight }}>
              {card.tier}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          id="btn-done-modal"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
}
