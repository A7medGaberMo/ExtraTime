'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PlayerCard } from '@/components/shared/player-card';
import type { PlayerCardData } from '@/types/player';
import { Sword, Trophy, ShieldCheck, Question, X } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

export interface LastCompletedRoundInfo {
  roundNumber: number;
  position: string;
  mainPlayer: PlayerCardData | null;
  subPlayer: PlayerCardData | null;
  /** Sealed bids from the round history (blind reveal). */
  myBid?: number | null;
  opponentBid?: number | null;
  wasTieLottery?: boolean;
  myPick: {
    isSub: boolean;
    cost: number;
    player: PlayerCardData | null;
  } | null;
  opponentPick: {
    isSub: boolean;
    cost: number;
    player: PlayerCardData | null;
  } | null;
  winnerUserId?: string | null;
  winnerIsMe: boolean;
  winnerName: string;
  winningBid: number;
}

interface BidRevealAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  lastCompletedRound: LastCompletedRoundInfo | null;
}

const REVEAL_DURATION = 5000; // ms

export function BidRevealAnimation({
  isOpen,
  onClose,
  lastCompletedRound,
}: BidRevealAnimationProps) {
  const [stage, setStage] = useState<'enter' | 'show' | 'exit'>('enter');
  const [progressPct, setProgressPct] = useState(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const enterTimer = setTimeout(() => setStage('show'), 60);

      const progressStart = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - progressStart;
        setProgressPct(Math.min(100, (elapsed / REVEAL_DURATION) * 100));
      }, 40);

      const dismissTimer = setTimeout(() => {
        setStage('exit');
        setTimeout(() => {
          onCloseRef.current();
        }, 240);
      }, REVEAL_DURATION);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(dismissTimer);
        clearInterval(progressInterval);
      };
    }
  }, [isOpen]);

  if (!isOpen || !lastCompletedRound) return null;

  const { roundNumber, position, myPick, opponentPick, winnerIsMe, winningBid } =
    lastCompletedRound;

  const yourPlayer = myPick?.player ?? null;
  const yourCost = myPick?.cost ?? 0;
  const rivalPlayer = opponentPick?.player ?? null;
  const rivalCost = opponentPick?.cost ?? 0;
  const wasTieLottery = lastCompletedRound.wasTieLottery ?? false;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-3 sm:p-4 backdrop-blur-2xl transition-all duration-200 select-none ${
        stage === 'exit' ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      onClick={() => {
        setStage('exit');
        setTimeout(() => onCloseRef.current(), 240);
      }}
    >
      {/* Dynamic Stadium Stage Spotlight */}
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 h-[320px] w-[320px] sm:h-[480px] sm:w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-all duration-700 ${
          winnerIsMe ? 'bg-lime/20' : winningBid > 0 ? 'bg-rose-500/15' : 'bg-amber-500/15'
        }`}
      />

      <div
        className="animate-scale-in relative flex max-h-[96vh] w-full max-w-xl flex-col items-center gap-3.5 sm:gap-4 overflow-y-auto rounded-3xl border border-white/12 bg-slate-950/95 p-4 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            setStage('exit');
            setTimeout(() => onCloseRef.current(), 240);
          }}
          className="btn-haptic absolute top-3.5 right-3.5 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-steel hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <AppIcon icon={X} size={15} weight="bold" />
        </button>

        {/* 1. Header: Round Tag & Single Outcome Badge (0 Redundancy) */}
        <div className="z-10 flex flex-col items-center gap-1.5 pt-1 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-[10px] sm:text-[11px] font-bold text-steel uppercase font-stats">
            <AppIcon icon={Sword} size={13} weight="duotone" className="text-lime" />
            <span>Round {roundNumber} • {position}</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            {winnerIsMe ? (
              <div className="flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/15 px-3 py-1 text-xs sm:text-sm font-extrabold text-lime uppercase font-display tracking-wide shadow-glow-lime animate-pulse">
                <AppIcon icon={Trophy} size={16} weight="fill" />
                <span>Target Secured</span>
              </div>
            ) : winningBid > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs sm:text-sm font-extrabold text-rose-400 uppercase font-display tracking-wide">
                <AppIcon icon={ShieldCheck} size={16} weight="fill" />
                <span>Backup Signed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs sm:text-sm font-extrabold text-amber-300 uppercase font-display tracking-wide">
                <AppIcon icon={Question} size={16} weight="bold" />
                <span>Tied at $0M</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Side-by-Side Clean Card Stage (You vs Rival) */}
        <div className="z-10 grid w-full grid-cols-2 gap-2.5 sm:gap-6 py-1">
          {/* YOU COLUMN */}
          <div className="flex flex-col items-center gap-2">
            {/* Header pill directly above card: YOU • $PRICE • TARGET/SUB */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              <div className="flex items-center justify-center gap-1.5 rounded-full border border-lime/40 bg-lime/15 px-2.5 sm:px-3 py-0.5 text-center font-stats shadow-sm">
                <span className="text-[10px] sm:text-xs font-black text-lime uppercase tracking-wider">
                  YOU
                </span>
                <span className="text-[10px] sm:text-xs font-black text-white">
                  ${yourCost}M
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-steel uppercase font-stats">
                {myPick?.isSub ? 'Secret Backup' : 'Main Target'}
              </span>
            </div>

            {/* Your Player Card */}
            <div className="transition-transform duration-300 hover:scale-105">
              {yourPlayer ? (
                <PlayerCard player={yourPlayer} size="sm" />
              ) : (
                <div className="flex h-[220px] w-36 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-xs text-steel">
                  —
                </div>
              )}
            </div>
          </div>

          {/* RIVAL COLUMN */}
          <div className="flex flex-col items-center gap-2">
            {/* Header pill directly above card: RIVAL • $PRICE • TARGET/SUB */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              <div className="flex items-center justify-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 sm:px-3 py-0.5 text-center font-stats shadow-sm">
                <span className="text-[10px] sm:text-xs font-black text-rose-400 uppercase tracking-wider">
                  RIVAL
                </span>
                <span className="text-[10px] sm:text-xs font-black text-white">
                  ${rivalCost}M
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-steel uppercase font-stats">
                {opponentPick?.isSub ? 'Secret Backup' : 'Main Target'}
              </span>
            </div>

            {/* Rival Player Card */}
            <div className="transition-transform duration-300 hover:scale-105">
              {rivalPlayer ? (
                <PlayerCard player={rivalPlayer} size="sm" />
              ) : (
                <div className="flex h-[220px] w-36 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-xs text-steel">
                  —
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle Lot Tie Badge if applicable */}
        {wasTieLottery && (
          <div className="z-10 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase font-stats">
            🪙 Equal Sealed Bids • Seed Toss Resolved
          </div>
        )}

        {/* 3. Auto-Dismiss Progress Bar */}
        <div className="z-10 flex w-full max-w-[200px] flex-col items-center gap-1 pt-1">
          <div className="h-1 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950">
            <div
              className="bg-lime h-full rounded-full transition-[width] duration-100 ease-linear shadow-glow-lime"
              style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
            />
          </div>
          <span className="text-steel/50 text-[8px] font-bold tracking-widest uppercase font-stats">
            Next Round
          </span>
        </div>
      </div>
    </div>
  );
}
