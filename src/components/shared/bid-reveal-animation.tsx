"use client";

import React, { useEffect, useState, useRef } from "react";
import { PlayerCard } from "@/components/shared/player-card";
import type { PlayerCardData } from "@/types/player";
import { Swords, Trophy, ShieldCheck, HelpCircle, X } from "lucide-react";

export interface LastCompletedRoundInfo {
  roundNumber: number;
  position: string;
  mainPlayer: PlayerCardData | null;
  subPlayer: PlayerCardData | null;
  /** Sealed bids from the round history (blind reveal). */
  myBid?: number;
  opponentBid?: number;
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
  winnerUserId: string | null;
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
  const [stage, setStage] = useState<"enter" | "show" | "exit">("enter");
  const [progressPct, setProgressPct] = useState(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const enterTimer = setTimeout(() => setStage("show"), 80);

      const progressStart = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - progressStart;
        setProgressPct(Math.min(100, (elapsed / REVEAL_DURATION) * 100));
      }, 50);

      const dismissTimer = setTimeout(() => {
        setStage("exit");
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

  const { roundNumber, position, myPick, opponentPick, winnerIsMe, winningBid } = lastCompletedRound;

  const yourPlayer = myPick?.player ?? null;
  const yourCost = myPick?.cost ?? 0;
  const rivalPlayer = opponentPick?.player ?? null;
  const rivalCost = opponentPick?.cost ?? 0;

  const myBid = lastCompletedRound.myBid;
  const opponentBid = lastCompletedRound.opponentBid;
  const wasTieLottery = lastCompletedRound.wasTieLottery ?? false;

  const bidLine = (me: number | undefined, rival: number | undefined): string => {
    const parts: string[] = [];
    if (me !== undefined) parts.push(`You sealed $${me}M`);
    if (rival !== undefined) parts.push(`Rival sealed $${rival}M`);
    return parts.join(" · ");
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/98 backdrop-blur-2xl transition-all duration-300 ${
        stage === "exit" ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
      onClick={() => {
        setStage("exit");
        setTimeout(() => onCloseRef.current(), 280);
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[480px] h-[300px] sm:h-[480px] bg-lime/12 blur-[130px] rounded-full pointer-events-none" />

      <div
        className="relative max-w-lg w-full flex flex-col items-center gap-4 animate-scale-in bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-md max-h-[96vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setStage("exit");
            setTimeout(() => onCloseRef.current(), 280);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 border border-white/10 text-steel hover:text-white transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Round + Position */}
        <div className="flex flex-col items-center text-center z-10 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-white/15 text-[10px] font-black uppercase tracking-widest text-steel shadow-inner">
            <Swords className="w-3.5 h-3.5 text-lime" />
            R{roundNumber} · {position}
          </div>
        </div>

        {/* Status */}
        <div className="z-10 text-center space-y-1.5">
          {winnerIsMe ? (
            <>
              <div className="text-lime text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-1.5 justify-center animate-pulse">
                <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-lime animate-bounce" />
                You Won {yourPlayer?.name}!
              </div>
              <p className="text-[10px] sm:text-xs text-steel font-bold uppercase tracking-wide">
                {bidLine(myBid ?? winningBid, opponentBid)}
                {winningBid > 0 && <span className="text-lime"> · Paid ${winningBid}M</span>}
              </p>
              <p className="text-[9px] text-steel/60 font-semibold uppercase tracking-wide">
                Rival got <span className="text-rose-400">{rivalPlayer?.name}</span> as secret sub (${rivalCost}M)
              </p>
            </>
          ) : winningBid > 0 ? (
            <>
              <div className="text-rose-400 text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-400" />
                Rival Won {rivalPlayer?.name}!
              </div>
              <p className="text-[10px] sm:text-xs text-steel font-bold uppercase tracking-wide">
                {bidLine(myBid ?? 0, opponentBid ?? winningBid)}
                {winningBid > 0 && <span className="text-rose-400"> · Paid ${winningBid}M</span>}
              </p>
              <p className="text-[9px] text-steel/60 font-semibold uppercase tracking-wide">
                You received <span className="text-lime">{yourPlayer?.name}</span> as secret sub (${yourCost}M)
              </p>
            </>
          ) : (
            <>
              <div className="text-amber-300 text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-1.5 justify-center">
                <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
                Dual Pass
              </div>
              <p className="text-[10px] sm:text-xs text-steel font-bold uppercase tracking-wide">
                {bidLine(0, 0)} · Starter claims Main at $0M
              </p>
            </>
          )}
          {wasTieLottery && (
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-300 animate-pulse">
              🪙 Equal sealed bids — room-seed lot draw resolved it!
            </p>
          )}
        </div>

        {/* Horizontal card comparison */}
        <div className="relative w-full z-10 flex justify-center items-center py-2 h-[200px] sm:h-[240px]">
          {/* RIVAL card (behind, smaller) */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-700 delay-100 transform absolute ${
            stage === "show" ? "translate-y-0 opacity-70 translate-x-14 sm:translate-x-16 scale-[0.68]" : "translate-y-4 opacity-0 scale-[0.6]"
          } z-10`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shadow-sm">
              Rival: {opponentPick?.isSub ? 'Sub' : 'Main'}
            </span>
            <div className="relative">
              {rivalPlayer ? (
                <>
                  <PlayerCard player={rivalPlayer} size="sm" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950 text-rose-300 text-[8px] font-black uppercase whitespace-nowrap border border-rose-500/30 shadow-md">
                    ${rivalCost}M
                  </div>
                </>
              ) : (
                <div className="w-24 h-32 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-[9px] text-steel">—</div>
              )}
            </div>
          </div>

          {/* YOUR card (front, larger) */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-700 transform absolute ${
            stage === "show" ? "translate-y-0 opacity-100 -translate-x-14 sm:-translate-x-16 scale-[0.88]" : "translate-y-4 opacity-0 scale-[0.8]"
          } z-20`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-lime bg-lime/10 px-2 py-0.5 rounded-full border border-lime/30 shadow-sm">
              You: {myPick?.isSub ? 'Sub' : 'Main'}
            </span>
            <div className="relative">
              {yourPlayer ? (
                <>
                  <PlayerCard player={yourPlayer} size="sm" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-lime text-slate-950 text-[9px] font-black uppercase whitespace-nowrap shadow-lg border border-lime">
                    ${yourCost}M
                  </div>
                </>
              ) : (
                <div className="w-28 h-36 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-[9px] text-steel">—</div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="w-full max-w-[180px] flex flex-col items-center gap-1.5 z-10">
          <div className="w-full bg-slate-950 border border-white/10 rounded-full h-1 overflow-hidden">
            <div
              className="bg-lime h-full rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
            />
          </div>
          <span className="text-[7px] font-black text-steel/40 uppercase tracking-widest">Next round</span>
        </div>
      </div>
    </div>
  );
}
