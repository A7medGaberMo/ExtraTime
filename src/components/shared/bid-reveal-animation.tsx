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

  const bidLine = (me: number | null | undefined, rival: number | null | undefined): string => {
    const parts: string[] = [];
    if (me !== undefined && me !== null) parts.push(`You sealed $${me}M`);
    if (rival !== undefined && rival !== null) parts.push(`Rival sealed $${rival}M`);
    return parts.join(' · ');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 p-3 backdrop-blur-2xl transition-all duration-300 sm:p-4 select-none ${
        stage === 'exit' ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      onClick={() => {
        setStage('exit');
        setTimeout(() => onCloseRef.current(), 280);
      }}
    >
      <div className="bg-lime/12 pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] sm:h-[480px] sm:w-[480px]" />

      <div
        className="animate-scale-in relative flex max-h-[96vh] w-full max-w-lg flex-col items-center gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setStage('exit');
            setTimeout(() => onCloseRef.current(), 280);
          }}
          className="text-steel absolute top-3 right-3 z-20 rounded-full border border-white/10 bg-slate-950/80 p-1.5 transition-all hover:text-white cursor-pointer"
        >
          <AppIcon icon={X} size={16} weight="bold" />
        </button>

        {/* Round + Position */}
        <div className="z-10 flex flex-col items-center pt-1 text-center">
          <div className="text-steel inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-inner font-stats">
            <AppIcon icon={Sword} size={14} weight="duotone" className="text-lime" />R{roundNumber} · {position}
          </div>
        </div>

        {/* Status */}
        <div className="z-10 space-y-1.5 text-center">
          {winnerIsMe ? (
            <>
              <div className="text-lime flex animate-pulse items-center justify-center gap-1.5 text-base font-black tracking-wider uppercase sm:text-lg font-display">
                <AppIcon icon={Trophy} size={20} weight="duotone" className="text-lime animate-bounce" />
                You Won {yourPlayer?.name}!
              </div>
              <p className="text-steel text-[10px] font-bold tracking-wide uppercase sm:text-xs font-stats">
                {bidLine(myBid ?? winningBid, opponentBid)}
                {winningBid > 0 && <span className="text-lime"> · Paid ${winningBid}M</span>}
              </p>
              <p className="text-steel/60 text-[9px] font-semibold tracking-wide uppercase font-stats">
                Rival got <span className="text-rose-400">{rivalPlayer?.name}</span> as secret sub
                (${rivalCost}M)
              </p>
            </>
          ) : winningBid > 0 ? (
            <>
              <div className="flex items-center justify-center gap-1.5 text-base font-black tracking-wider text-rose-400 uppercase sm:text-lg font-display">
                <AppIcon icon={ShieldCheck} size={20} weight="duotone" className="text-rose-400" />
                Rival Won {rivalPlayer?.name}!
              </div>
              <p className="text-steel text-[10px] font-bold tracking-wide uppercase sm:text-xs font-stats">
                {bidLine(myBid ?? 0, opponentBid ?? winningBid)}
                {winningBid > 0 && <span className="text-rose-400"> · Paid ${winningBid}M</span>}
              </p>
              <p className="text-steel/60 text-[9px] font-semibold tracking-wide uppercase font-stats">
                You received <span className="text-lime">{yourPlayer?.name}</span> as secret sub ($
                {yourCost}M)
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 text-base font-black tracking-wider text-amber-300 uppercase sm:text-lg font-display">
                <AppIcon icon={Question} size={20} weight="duotone" className="text-amber-300" />
                Both Offered $0M
              </div>
              <p className="text-steel text-[10px] font-bold tracking-wide uppercase sm:text-xs font-stats">
                {bidLine(0, 0)} · Round starter gets Main at $0M, other gets Sub at $0M
              </p>
            </>
          )}
          {wasTieLottery && (
            <p className="animate-pulse text-[9px] font-black tracking-widest text-amber-300 uppercase font-stats">
              🪙 Equal sealed bids — room-seed lot draw resolved it!
            </p>
          )}
        </div>

        {/* Horizontal card comparison */}
        <div className="relative z-10 flex h-[200px] w-full items-center justify-center py-2 sm:h-[240px]">
          {/* RIVAL card (behind, smaller) */}
          <div
            className={`absolute flex transform flex-col items-center gap-1 transition-all delay-100 duration-700 ${
              stage === 'show'
                ? 'translate-x-14 translate-y-0 scale-[0.68] opacity-70 sm:translate-x-16'
                : 'translate-y-4 scale-[0.6] opacity-0'
            } z-10`}
          >
            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-rose-400 uppercase shadow-sm font-stats">
              Rival: {opponentPick?.isSub ? 'Sub' : 'Main'}
            </span>
            <div className="relative">
              {rivalPlayer ? (
                <>
                  <PlayerCard player={rivalPlayer} size="sm" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-rose-500/30 bg-slate-950 px-2 py-0.5 text-[8px] font-black whitespace-nowrap text-rose-300 uppercase shadow-md font-stats">
                    ${rivalCost}M
                  </div>
                </>
              ) : (
                <div className="text-steel flex h-32 w-24 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-[9px]">
                  —
                </div>
              )}
            </div>
          </div>

          {/* YOUR card (front, larger) */}
          <div
            className={`absolute flex transform flex-col items-center gap-1 transition-all duration-700 ${
              stage === 'show'
                ? '-translate-x-14 translate-y-0 scale-[0.88] opacity-100 sm:-translate-x-16'
                : 'translate-y-4 scale-[0.8] opacity-0'
            } z-20`}
          >
            <span className="text-lime bg-lime/10 border-lime/30 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-sm font-stats">
              You: {myPick?.isSub ? 'Sub' : 'Main'}
            </span>
            <div className="relative">
              {yourPlayer ? (
                <>
                  <PlayerCard player={yourPlayer} size="sm" />
                  <div className="bg-lime border-lime absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border px-2.5 py-0.5 text-[9px] font-black whitespace-nowrap text-slate-950 uppercase shadow-lg font-stats">
                    ${yourCost}M
                  </div>
                </>
              ) : (
                <div className="text-steel flex h-36 w-28 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-[9px]">
                  —
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="z-10 flex w-full max-w-[180px] flex-col items-center gap-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950">
            <div
              className="bg-lime h-full rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
            />
          </div>
          <span className="text-steel/40 text-[7px] font-black tracking-widest uppercase font-stats">
            Next round
          </span>
        </div>
      </div>
    </div>
  );
}
