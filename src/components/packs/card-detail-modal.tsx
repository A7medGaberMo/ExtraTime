'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerCard } from '@/components/shared/player-card';
import { ETLogo } from '@/components/shared/et-logo';
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
  // Deduplicate cards list by unique player ID
  const uniqueCards = useMemo(() => {
    const list = cardsList && cardsList.length > 0 ? cardsList : card ? [card] : [];
    const map = new Map<string, PlayerCardData>();
    for (const c of list) {
      if (c && c.id) map.set(c.id, c);
    }
    if (card && card.id && !map.has(card.id)) {
      map.set(card.id, card);
    }
    return Array.from(map.values());
  }, [cardsList, card]);

  const rawIndex = card ? uniqueCards.findIndex((c) => c.id === card.id) : -1;
  const currentIndex = rawIndex >= 0 ? rawIndex : 0;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < uniqueCards.length - 1;

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (uniqueCards.length > 1 && onSelectCard) {
        if (e.key === 'ArrowRight' && hasNext) {
          sfx.cardDeal();
          onSelectCard(uniqueCards[currentIndex + 1]);
        } else if (e.key === 'ArrowLeft' && hasPrev) {
          sfx.cardDeal();
          onSelectCard(uniqueCards[currentIndex - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasNext, hasPrev, onClose, onSelectCard, uniqueCards]);

  if (!card) return null;
  const tierStyle = getTierStyle(card.tier);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasPrev && onSelectCard) {
      sfx.cardDeal();
      onSelectCard(uniqueCards[currentIndex - 1]);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasNext && onSelectCard) {
      sfx.cardDeal();
      onSelectCard(uniqueCards[currentIndex + 1]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && hasNext) handleNext();
      else if (diff < 0 && hasPrev) handlePrev();
    }
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-3 backdrop-blur-xl sm:p-4 select-none"
      onClick={onClose}
      id="modal-card-inspection"
      role="dialog"
      aria-modal="true"
      aria-label="Player Card Inspection"
    >
      <div
        className="animate-scale-in relative my-auto flex max-h-[90vh] w-full max-w-[320px] flex-col items-center gap-3 overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-4 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:max-w-sm sm:p-5"
        style={{
          boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 36px ${tierStyle.glow}`,
          borderColor: `${tierStyle.accent}45`,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header: Telemetry pill, Counter, Close button */}
        <div className="flex w-full items-center justify-between pb-0.5">
          <div
            className="flex items-center gap-1.5 rounded-full border bg-slate-950/80 px-2.5 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm"
            style={{ borderColor: `${tierStyle.accent}60`, color: tierStyle.highlight }}
          >
            <ETLogo variant="card-badge" size={13} />
            <span>{card.tier} VAULT</span>
          </div>

          <div className="flex items-center gap-1.5">
            {uniqueCards.length > 1 && (
              <span className="text-steel font-stats text-[10px] font-black tracking-wider">
                {currentIndex + 1} / {uniqueCards.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-steel hover:border-lime/40 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-slate-950 transition-colors hover:text-white"
              id="btn-close-card-modal"
              aria-label="Close"
            >
              <AppIcon icon={X} size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* 3D Holographic Card View with Next/Prev Arrow Triggers */}
        <div className="relative my-1 flex w-full items-center justify-center">
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute top-1/2 -left-2 z-30 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-slate-950/85 p-2 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 sm:-left-3"
              aria-label="Previous Card"
            >
              <AppIcon icon={CaretLeft} size={16} weight="bold" />
            </button>
          )}

          <div className="scale-95 transition-transform duration-200 sm:scale-100">
            <PlayerCard player={card} size="md" />
          </div>

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute top-1/2 -right-2 z-30 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-slate-950/85 p-2 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 sm:-right-3"
              aria-label="Next Card"
            >
              <AppIcon icon={CaretRight} size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Minimalist Apple Action Bar */}
        <button
          onClick={onClose}
          className="bg-lime hover:bg-vivid mt-1 w-full cursor-pointer rounded-2xl py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-lg transition-all active:scale-95"
          id="btn-done-modal"
        >
          Done
        </button>
      </div>
    </div>
  );
}
