'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PlayerCard } from '@/components/shared/player-card';
import type { PlayerCardData } from '@/types/player';
import { Sword, Trophy, ShieldCheck, Question, X, ArrowRight } from '@phosphor-icons/react';
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

const REVEAL_DURATION = 3500; // 3.5s crisp auto-dismiss

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
      setStage('enter');
      setProgressPct(0);
      const enterTimer = setTimeout(() => setStage('show'), 40);

      const progressStart = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - progressStart;
        setProgressPct(Math.min(100, (elapsed / REVEAL_DURATION) * 100));
      }, 40);

      const dismissTimer = setTimeout(() => {
        setStage('exit');
        setTimeout(() => {
          onCloseRef.current();
        }, 250);
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

  const myBid = lastCompletedRound.myBid;
  const opponentBid = lastCompletedRound.opponentBid;
  const wasTieLottery = lastCompletedRound.wasTieLottery ?? false;

  const handleManualClose = () => {
    setStage('exit');
    setTimeout(() => onCloseRef.current(), 220);
  };

  return (
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/90 p-2 sm:p-4 backdrop-blur-2xl transition-all duration-300 select-none ${
        stage === 'exit' ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      onClick={handleManualClose}
    >
      {/* Dynamic Ambient Mesh Glow */}
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-colors duration-500 sm:h-[460px] sm:w-[460px] ${
          winnerIsMe
            ? 'bg-lime/25'
            : winningBid > 0
              ? 'bg-rose-500/20'
              : 'bg-amber-400/20'
        }`}
      />

      <div
        className="relative flex max-h-[94dvh] w-full max-w-lg flex-col items-center gap-2 sm:gap-3.5 overflow-hidden rounded-3xl border border-white/18 bg-slate-900/90 p-3 sm:p-5 shadow-[0_32px_80px_rgba(0,0,0,0.88),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dismiss Button */}
        <button
          onClick={handleManualClose}
          className="btn-haptic absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-slate-950/80 text-steel transition-all hover:border-lime/40 hover:text-white cursor-pointer active:scale-90"
          title="Skip Reveal"
          aria-label="Skip Reveal"
        >
          <AppIcon icon={X} size={14} weight="bold" />
        </button>

        {/* ── MINIMAL APPLE KEYNOTE HEADER ── */}
        <header className="z-10 flex flex-col items-center pt-1 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase font-stats text-steel">
            <AppIcon icon={Sword} size={12} weight="duotone" className="text-lime" />
            <span>Round {roundNumber} · {position}</span>
          </div>

          <h2 className="text-sm sm:text-base font-black uppercase font-display tracking-wide pt-0.5">
            {winnerIsMe ? (
              <span className="text-lime">You Won The Star Target</span>
            ) : winningBid > 0 ? (
              <span className="text-rose-400">Rival Won The Star Target</span>
            ) : (
              <span className="text-amber-300">Both Passed · $0M Tie</span>
            )}
          </h2>

          {wasTieLottery && (
            <span className="text-[9px] font-bold text-amber-300 uppercase font-stats">
              Decided by Tie Draw
            </span>
          )}
        </header>

        {/* ── 2-COLUMN CARDS: [ YOU ] vs [ RIVAL ] ── */}
        <div className="z-10 grid grid-cols-2 gap-2 sm:gap-3.5 w-full pt-1">
          {/* ── LEFT: YOU ── */}
          <div
            className={`flex flex-col items-center justify-between rounded-2xl border p-2 sm:p-3 transition-all ${
              winnerIsMe
                ? 'border-lime/40 bg-lime/[0.06] shadow-[0_4px_20px_rgba(202,255,0,0.12)]'
                : 'border-white/10 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between w-full px-1 mb-1.5 font-stats">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                You
              </span>
              <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                winnerIsMe ? 'border-lime/40 bg-lime/15 text-lime' : 'border-white/10 bg-white/5 text-steel'
              }`}>
                ${myBid ?? 0}M Bid
              </span>
            </div>

            {/* Card Preview */}
            <div className="py-1 flex justify-center items-center w-full">
              {yourPlayer ? (
                <div className="scale-[0.82] min-[380px]:scale-[0.88] sm:scale-100 origin-center -my-2 sm:my-0">
                  <PlayerCard player={yourPlayer} size="xs" />
                </div>
              ) : (
                <div className="flex h-32 w-24 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-xs text-steel">
                  None
                </div>
              )}
            </div>

            <div className="mt-1 text-center w-full pt-1.5 border-t border-white/[0.08]">
              <span className="text-[9.5px] font-bold text-steel uppercase font-stats tracking-wider">
                {!myPick?.isSub ? '★ Star Target' : 'Backup Sub'} · <strong className="text-white">${yourCost}M</strong>
              </span>
            </div>
          </div>

          {/* ── RIGHT: RIVAL ── */}
          <div
            className={`flex flex-col items-center justify-between rounded-2xl border p-2 sm:p-3 transition-all ${
              !winnerIsMe && winningBid > 0
                ? 'border-rose-500/40 bg-rose-500/[0.06] shadow-[0_4px_20px_rgba(244,63,94,0.12)]'
                : 'border-white/10 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between w-full px-1 mb-1.5 font-stats">
              <span className="text-xs font-black text-steel uppercase tracking-wider">
                Rival
              </span>
              <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                !winnerIsMe && winningBid > 0 ? 'border-rose-500/40 bg-rose-500/15 text-rose-300' : 'border-white/10 bg-white/5 text-steel'
              }`}>
                ${opponentBid ?? 0}M Bid
              </span>
            </div>

            {/* Card Preview */}
            <div className="py-1 flex justify-center items-center w-full">
              {rivalPlayer ? (
                <div className="scale-[0.82] min-[380px]:scale-[0.88] sm:scale-100 origin-center -my-2 sm:my-0">
                  <PlayerCard player={rivalPlayer} size="xs" />
                </div>
              ) : (
                <div className="flex h-32 w-24 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-xs text-steel">
                  None
                </div>
              )}
            </div>

            <div className="mt-1 text-center w-full pt-1.5 border-t border-white/[0.08]">
              <span className="text-[9.5px] font-bold text-steel uppercase font-stats tracking-wider">
                {!opponentPick?.isSub ? '★ Star Target' : 'Backup Sub'} · <strong className="text-white">${rivalCost}M</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM QUIET TIMER & CONTINUE ── */}
        <div className="z-10 flex w-full items-center justify-between gap-3 pt-1 px-1">
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-950 border border-white/10">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-75 ease-linear"
                style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
              />
            </div>
            <span className="text-steel/60 text-[8px] font-bold tracking-wider uppercase font-stats">
              Next round starting...
            </span>
          </div>

          <button
            onClick={handleManualClose}
            className="btn-haptic inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer font-stats"
          >
            <span>Continue</span>
            <AppIcon icon={ArrowRight} size={11} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
