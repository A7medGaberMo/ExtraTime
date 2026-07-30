"use client";

import React, { useEffect, useState, useRef } from "react";
import { PlayerCard } from "@/components/shared/player-card";
import type { PlayerCardData } from "@/types/player";
import { Sparkles, Trophy, ShieldCheck, HelpCircle, X } from "lucide-react";

export interface LastCompletedRoundInfo {
  roundNumber: number;
  position: string;
  mainPlayer: PlayerCardData | null;
  subPlayer: PlayerCardData | null;
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

  const { roundNumber, position, myPick, winnerIsMe, winnerName, winningBid, mainPlayer, subPlayer } = lastCompletedRound;

  // Determine who got which player
  const youGotMain = myPick ? !myPick.isSub : false;

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
      {/* Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[480px] h-[300px] sm:h-[480px] ${
        winnerIsMe ? "bg-lime/15" : "bg-rose-500/10"
      } blur-[130px] rounded-full pointer-events-none`} />

      <div
        className="relative max-w-lg w-full flex flex-col items-center gap-3 sm:gap-4 animate-scale-in bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-md max-h-[96vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setStage("exit");
            setTimeout(() => onCloseRef.current(), 280);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 border border-white/10 text-steel hover:text-white transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Summary */}
        <div className="flex flex-col items-center text-center space-y-1.5 z-10 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-white/15 text-[10px] sm:text-xs font-black uppercase tracking-widest text-steel shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            Round {roundNumber} Reveal · {position}
          </div>

          <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
            {winningBid > 0 ? (
              winnerIsMe ? (
                <>
                  <Trophy className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-lime shrink-0 animate-bounce" />
                  <span className="text-lime">Target Won for ${winningBid}M</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-rose-400 shrink-0" />
                  <span className="text-rose-400">{winnerName} won for ${winningBid}M</span>
                </>
              )
            ) : (
              <>
                <HelpCircle className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-amber-400 shrink-0" />
                <span className="text-amber-300">Dual Pass — Random Assignment</span>
              </>
            )}
          </h2>
        </div>

        {/* MAIN VS SUB SIDE-BY-SIDE */}
        <div className="relative w-full grid grid-cols-2 gap-3 sm:gap-6 py-2.5 z-10">
          {/* MAIN PLAYER OF THE ROUND */}
          <div className={`flex flex-col items-center gap-2 transition-all duration-700 transform ${
            stage === "show" ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-90"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-lime/90 flex items-center gap-1">
              ⭐ Main Target
            </span>

            {mainPlayer ? (
              <div className={`relative rounded-2xl transition-all duration-500 scale-[0.82] sm:scale-95 origin-center ${
                youGotMain
                  ? "shadow-[0_0_25px_rgba(149,232,16,0.3)] ring-2 ring-lime"
                  : "shadow-[0_0_25px_rgba(244,63,94,0.15)] ring-2 ring-rose-500/40"
              }`}>
                <PlayerCard player={mainPlayer} size="sm" />
                
                {/* Winner Label Overlay */}
                <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-lg whitespace-nowrap ${
                  youGotMain
                    ? "bg-lime text-slate-950 border-lime"
                    : "bg-rose-500 text-white border-rose-400"
                }`}>
                  {youGotMain ? `YOU WON · $${winningBid}M` : `${winnerName.split(" ")[0]} WON`}
                </div>
              </div>
            ) : (
              <div className="w-32 sm:w-36 h-40 sm:h-48 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-xs text-steel">
                Empty
              </div>
            )}
          </div>

          {/* SUB/BACKUP PLAYER OF THE ROUND */}
          <div className={`flex flex-col items-center gap-2 transition-all duration-700 delay-100 transform ${
            stage === "show" ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-90"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              📦 Backup Player
            </span>

            {subPlayer ? (
              <div className={`relative rounded-2xl transition-all duration-500 scale-[0.82] sm:scale-95 origin-center ${
                !youGotMain
                  ? "shadow-[0_0_25px_rgba(149,232,16,0.3)] ring-2 ring-lime"
                  : "shadow-md ring-1 ring-white/10 opacity-75"
              }`}>
                <PlayerCard player={subPlayer} size="sm" />

                {/* Receiver Label Overlay */}
                <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-lg whitespace-nowrap ${
                  !youGotMain
                    ? "bg-lime text-slate-950 border-lime"
                    : "bg-slate-950 text-steel border-white/10"
                }`}>
                  {!youGotMain ? "YOU ASSIGNED (FREE)" : "RIVAL ASSIGNED"}
                </div>
              </div>
            ) : (
              <div className="w-32 sm:w-36 h-40 sm:h-48 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-xs text-steel">
                Empty
              </div>
            )}
          </div>
        </div>

        {/* Countdown Progress */}
        <div className="w-full max-w-[200px] sm:max-w-xs flex flex-col items-center gap-1.5 z-10 pt-2">
          <div className="w-full bg-slate-950 border border-white/10 rounded-full h-1 overflow-hidden">
            <div
              className="bg-lime h-full rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
            />
          </div>
          <span className="text-[8px] sm:text-[9px] font-black text-steel uppercase tracking-widest">
            NEXT ROUND STARTING...
          </span>
        </div>
      </div>
    </div>
  );
}
