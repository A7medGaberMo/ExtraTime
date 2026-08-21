'use client';

import React, { useEffect } from 'react';
import { X, CaretLeft, CaretRight, Shield, Globe, Medal } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
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

export function CardDetailModal({ card, onClose, cardsList, onSelectCard }: CardDetailModalProps) {
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
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/90 p-3 backdrop-blur-lg sm:p-4"
      onClick={onClose}
      id="modal-card-inspection"
    >
      <div
        className="animate-scale-in relative my-auto flex max-h-[92vh] w-full max-w-sm flex-col items-center gap-3.5 overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/95 p-4 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
        style={{
          boxShadow: `0 24px 48px rgba(0,0,0,0.8), 0 0 32px ${tierStyle.glow}`,
          borderColor: `${tierStyle.accent}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Navigation & Close */}
        <div className="flex w-full items-center justify-between pb-1">
          <div
            className="flex items-center gap-1.5 rounded-full border bg-slate-950/80 px-2.5 py-1 text-[10px] font-black tracking-widest uppercase"
            style={{ borderColor: `${tierStyle.accent}50`, color: tierStyle.highlight }}
          >
            <ETLogo variant="icon-only" size={12} />
            <span>Card Telemetry</span>
          </div>

          <div className="flex items-center gap-1">
            {cardsList && cardsList.length > 1 && (
              <span className="text-steel px-2 font-stats text-[10px] font-black">
                {currentIndex + 1} / {cardsList.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-steel hover:border-lime/40 cursor-pointer rounded-xl border border-white/10 bg-slate-950 p-1.5 transition-colors hover:text-white"
              id="btn-close-card-modal"
              aria-label="Close"
            >
              <AppIcon icon={X} size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* 3D Holographic Card View with Next/Prev Arrow Triggers */}
        <div className="relative my-1 flex w-full items-center justify-center">
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-0 z-30 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-slate-950/80 p-2 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
              aria-label="Previous Card"
            >
              <AppIcon icon={CaretLeft} size={16} weight="bold" />
            </button>
          )}

          <div className="scale-90 transition-transform sm:scale-100">
            <PlayerCard player={card} size="lg" showTierLabelBelow />
          </div>

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-0 z-30 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-slate-950/80 p-2 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
              aria-label="Next Card"
            >
              <AppIcon icon={CaretRight} size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Player Metadata Specs Grid */}
        <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs sm:rounded-2xl">
          <div className="flex items-center gap-2 space-y-1 rounded-lg border border-white/5 bg-slate-900/70 p-2 sm:rounded-xl">
            <ClubCrestBadge clubName={card.club} className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            <div className="min-w-0">
              <span className="text-steel flex items-center gap-1 text-[8px] font-bold uppercase sm:text-[9px]">
                <AppIcon icon={Shield} size={10} weight="duotone" /> Club
              </span>
              <p className="truncate text-[10px] font-bold text-white sm:text-[11px]">
                {card.club}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 space-y-1 rounded-lg border border-white/5 bg-slate-900/70 p-2 sm:rounded-xl">
            <CountryFlagBadge nationName={card.nation} className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            <div className="min-w-0">
              <span className="text-steel flex items-center gap-1 text-[8px] font-bold uppercase sm:text-[9px]">
                <AppIcon icon={Globe} size={10} weight="duotone" /> Nation
              </span>
              <p className="truncate text-[10px] font-bold text-white sm:text-[11px]">
                {card.nation}
              </p>
            </div>
          </div>

          <div className="space-y-0.5 rounded-lg border border-white/5 bg-slate-900/70 p-2 sm:rounded-xl">
            <span className="text-steel block text-[8px] font-bold uppercase sm:text-[9px]">
              Position
            </span>
            <p className="text-lime font-stats text-xs font-black sm:text-sm">{card.position}</p>
          </div>

          <div className="space-y-0.5 rounded-lg border border-white/5 bg-slate-900/70 p-2 sm:rounded-xl">
            <span className="text-steel flex items-center gap-1 text-[8px] font-bold uppercase sm:text-[9px]">
              <AppIcon icon={Medal} size={10} weight="duotone" /> Tier
            </span>
            <p
              className="font-stats text-xs font-black sm:text-sm"
              style={{ color: tierStyle.highlight }}
            >
              {card.tier}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="bg-lime hover:bg-vivid w-full cursor-pointer rounded-xl py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-lg transition-all active:scale-95 sm:py-3"
          id="btn-done-modal"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
}
