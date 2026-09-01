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

const REVEAL_DURATION = 5500; // ms

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
      const enterTimer = setTimeout(() => setStage('show'), 80);

      const progressStart = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - progressStart;
        setProgressPct(Math.min(100, (elapsed / REVEAL_DURATION) * 100));
      }, 50);

      const dismissTimer = setTimeout(() => {
        setStage('exit');
        setTimeout(() => {
          onCloseRef.current();
        }, 280);
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

  return (
    <div
      className={`fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/98 p-3 backdrop-blur-2xl transition-all duration-300 sm:p-4 select-none ${
        stage === 'exit' ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      onClick={() => {
        setStage('exit');
        setTimeout(() => onCloseRef.current(), 280);
      }}
    >
      {/* Dynamic Ambient Glow */}
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] sm:h-[500px] sm:w-[500px] ${
          winnerIsMe ? 'bg-lime/20' : 'bg-rose-500/20'
        }`}
      />

      <div
        className="animate-scale-in relative flex max-h-[96vh] w-full max-w-xl flex-col items-center gap-3 overflow-y-auto rounded-3xl border border-white/18 bg-slate-900/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setStage('exit');
            setTimeout(() => onCloseRef.current(), 280);
          }}
          className="btn-haptic text-steel absolute top-3.5 right-3.5 z-20 rounded-full border border-white/12 bg-slate-950/85 p-1.5 transition-all hover:text-white hover:border-lime/40 cursor-pointer"
          title="Close"
        >
          <AppIcon icon={X} size={15} weight="bold" />
        </button>

        {/* ── TOP BADGE & OUTCOME HEADER ── */}
        <div className="z-10 flex flex-col items-center pt-0.5 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/85 px-3 py-1 text-[11px] font-black tracking-widest uppercase shadow-inner font-stats text-steel">
            <AppIcon icon={Sword} size={14} weight="duotone" className="text-lime" />
            <span>ROUND {roundNumber} · {position} SHOWDOWN</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            {winnerIsMe ? (
              <div className="flex items-center gap-1.5 text-lime text-base sm:text-lg font-black uppercase font-display tracking-wider animate-pulse">
                <AppIcon icon={Trophy} size={20} weight="fill" className="text-lime" />
                <span>YOU WON STAR TARGET!</span>
              </div>
            ) : winningBid > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-400 text-base sm:text-lg font-black uppercase font-display tracking-wider">
                <AppIcon icon={ShieldCheck} size={20} weight="fill" className="text-rose-400" />
                <span>RIVAL SIGNED STAR TARGET</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-300 text-base sm:text-lg font-black uppercase font-display tracking-wider">
                <AppIcon icon={Question} size={20} weight="bold" className="text-amber-300" />
                <span>BOTH BID $0M</span>
              </div>
            )}
          </div>

          {wasTieLottery && (
            <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[9.5px] font-bold text-amber-300 uppercase font-stats">
              🪙 Equal Bids — Decided by Tie Lottery Draw
            </span>
          )}
        </div>

        {/* ── 2-COLUMN SHOWDOWN TABLE: [ YOU ] vs [ RIVAL ] ── */}
        <div className="z-10 grid grid-cols-2 gap-2.5 sm:gap-4 w-full pt-1">
          {/* ── LEFT COLUMN: YOU ── */}
          <div
            className={`flex flex-col items-center justify-between rounded-2xl border p-2.5 sm:p-3.5 transition-all ${
              winnerIsMe
                ? 'border-lime/50 bg-lime/[0.07] shadow-[0_8px_24px_rgba(142,224,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                : 'border-white/12 bg-slate-950/70 shadow-inner'
            }`}
          >
            {/* Header Tag */}
            <div className="flex flex-col items-center gap-1 mb-2 w-full text-center">
              <div className="flex items-center justify-between w-full px-1">
                <span className="font-display text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                  YOU
                </span>
                {myBid !== undefined && myBid !== null && (
                  <span className="rounded-full border border-lime/40 bg-lime/15 px-2 py-0.5 text-[9px] font-black text-lime uppercase font-stats">
                    ${myBid}M BID
                  </span>
                )}
              </div>
              <div
                className={`w-full text-center py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest font-stats ${
                  !myPick?.isSub
                    ? 'bg-lime text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-steel border border-white/10'
                }`}
              >
                {!myPick?.isSub ? '⭐ STAR TARGET' : '🛡️ BACKUP SUB'}
              </div>
            </div>

            {/* Card Display */}
            <div className="py-1 flex justify-center w-full">
              {yourPlayer ? (
                <div className="transition-transform hover:scale-105">
                  <div className="block sm:hidden scale-[0.88] origin-center -my-2">
                    <PlayerCard player={yourPlayer} size="sm" />
                  </div>
                  <div className="hidden sm:block">
                    <PlayerCard player={yourPlayer} size="sm" />
                  </div>
                </div>
              ) : (
                <div className="flex h-36 w-28 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-xs text-steel">
                  No Player
                </div>
              )}
            </div>

            {/* Cost Pill Under Card */}
            <div className="mt-2 text-center w-full pt-1.5 border-t border-white/[0.08]">
              <span className="text-[10px] sm:text-[11px] font-bold text-steel font-stats block">
                Cost: <span className="text-lime font-black">${yourCost}M</span>
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: RIVAL ── */}
          <div
            className={`flex flex-col items-center justify-between rounded-2xl border p-2.5 sm:p-3.5 transition-all ${
              !winnerIsMe && winningBid > 0
                ? 'border-rose-500/50 bg-rose-500/[0.07] shadow-[0_8px_24px_rgba(244,63,94,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                : 'border-white/12 bg-slate-950/70 shadow-inner'
            }`}
          >
            {/* Header Tag */}
            <div className="flex flex-col items-center gap-1 mb-2 w-full text-center">
              <div className="flex items-center justify-between w-full px-1">
                <span className="font-display text-xs sm:text-sm font-black tracking-wider text-steel uppercase">
                  RIVAL
                </span>
                {opponentBid !== undefined && opponentBid !== null && (
                  <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[9px] font-black text-rose-300 uppercase font-stats">
                    ${opponentBid}M BID
                  </span>
                )}
              </div>
              <div
                className={`w-full text-center py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest font-stats ${
                  !opponentPick?.isSub
                    ? 'bg-rose-500 text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-steel border border-white/10'
                }`}
              >
                {!opponentPick?.isSub ? '⭐ STAR TARGET' : '🛡️ BACKUP SUB'}
              </div>
            </div>

            {/* Card Display */}
            <div className="py-1 flex justify-center w-full">
              {rivalPlayer ? (
                <div className="transition-transform hover:scale-105">
                  <div className="block sm:hidden scale-[0.88] origin-center -my-2">
                    <PlayerCard player={rivalPlayer} size="sm" />
                  </div>
                  <div className="hidden sm:block">
                    <PlayerCard player={rivalPlayer} size="sm" />
                  </div>
                </div>
              ) : (
                <div className="flex h-36 w-28 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-xs text-steel">
                  No Player
                </div>
              )}
            </div>

            {/* Cost Pill Under Card */}
            <div className="mt-2 text-center w-full pt-1.5 border-t border-white/[0.08]">
              <span className="text-[10px] sm:text-[11px] font-bold text-steel font-stats block">
                Cost: <span className="text-rose-400 font-black">${rivalCost}M</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── AUTO DISMISS PROGRESS TIMER ── */}
        <div className="z-10 flex w-full max-w-[200px] flex-col items-center gap-1 pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950 shadow-inner">
            <div
              className="bg-lime h-full rounded-full transition-[width] duration-100 ease-linear shadow-[0_0_8px_rgba(142,224,0,0.6)]"
              style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
            />
          </div>
          <span className="text-steel/60 text-[8px] font-bold tracking-widest uppercase font-stats">
            Next round starting...
          </span>
        </div>
      </div>
    </div>
  );
}
