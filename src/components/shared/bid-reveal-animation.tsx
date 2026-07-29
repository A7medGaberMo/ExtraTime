"use client";

import React, { useEffect, useState, useRef } from "react";
import { PlayerCard } from "@/components/shared/player-card";
import type { PlayerCardData } from "@/types/player";
import { Sparkles, Trophy, ShieldCheck, UserCheck, Crown, X } from "lucide-react";

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

const REVEAL_DURATION = 5000; // ms

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

  const { roundNumber, position, myPick, opponentPick, winnerIsMe, winnerName, winningBid } = lastCompletedRound;
  const myPlayer = myPick?.player;
  const opponentPlayer = opponentPick?.player;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/96 backdrop-blur-2xl transition-all duration-300 ${
        stage === "exit" ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
      onClick={() => {
        setStage("exit");
        setTimeout(() => onCloseRef.current(), 280);
      }}
    >
      {/* Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] ${
        winnerIsMe ? "bg-lime/20" : "bg-blue-500/15"
      } blur-[120px] rounded-full pointer-events-none`} />

      <div
        className="relative max-w-md w-full flex flex-col items-center gap-2.5 sm:gap-4 animate-scale-in bg-card/90 border border-lime/30 rounded-3xl p-3.5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button top right */}
        <button
          onClick={() => {
            setStage("exit");
            setTimeout(() => onCloseRef.current(), 280);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 border border-border text-steel hover:text-white transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-1 z-10 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-lime/40 text-lime text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
            <Sparkles className="w-3 h-3 text-lime" />
            Round {roundNumber} • {position}
          </div>

          <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight flex items-center gap-1.5">
            {winningBid > 0 ? (
              winnerIsMe ? (
                <>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 animate-bounce" />
                  <span className="text-lime">MAIN TARGET WON — ${winningBid}M</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
                  <span className="text-white">{winnerName.toUpperCase()} WON — ${winningBid}M</span>
                </>
              )
            ) : (
              <span className="text-amber-300">FREE PASS CLAIM — $0M</span>
            )}
          </h2>
        </div>

        {/* DUAL CARDS SPOTLIGHT WITH SQUAD MOTION */}
        <div className="relative w-full flex items-center justify-center gap-2 sm:gap-5 py-2 z-10">
          {/* YOUR CARD NODE */}
          <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 transition-all duration-700 transform ${
            stage === "show" ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-90"
          }`}>
            <div className="px-2.5 py-0.5 bg-lime/15 border border-lime/50 text-lime text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm">
              <UserCheck className="w-3.5 h-3.5" /> You
            </div>

            {myPlayer ? (
              <div className={`relative rounded-2xl transition-all duration-500 scale-85 sm:scale-95 origin-center ${
                !myPick?.isSub
                  ? "shadow-[0_0_30px_rgba(149,232,16,0.45)] ring-2 ring-lime animate-pulse-glow"
                  : "shadow-md ring-1 ring-border opacity-90"
              }`}>
                <PlayerCard player={myPlayer} size="sm" />
                <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-lg whitespace-nowrap ${
                  !myPick?.isSub
                    ? "bg-lime text-slate-950 border-lime"
                    : "bg-slate-900 text-steel border-border"
                }`}>
                  {!myPick?.isSub ? `WON MAIN • $${myPick?.cost ?? 0}M` : "ASSIGNED BACKUP"}
                </div>
              </div>
            ) : (
              <div className="w-32 sm:w-36 h-40 sm:h-48 rounded-2xl bg-card border border-border flex items-center justify-center text-xs text-steel">
                No Card
              </div>
            )}
          </div>

          {/* VS SEPARATOR */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-xs font-black text-steel/60 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded-full border border-border/60">
              VS
            </span>
          </div>

          {/* RIVAL CARD NODE */}
          <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 transition-all duration-700 delay-100 transform ${
            stage === "show" ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-90"
          }`}>
            <div className="px-2.5 py-0.5 bg-blue-500/15 border border-blue-500/50 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm">
              <Crown className="w-3.5 h-3.5" /> Rival
            </div>

            {opponentPlayer ? (
              <div className={`relative rounded-2xl transition-all duration-500 scale-85 sm:scale-95 origin-center ${
                !opponentPick?.isSub
                  ? "shadow-[0_0_30px_rgba(59,130,246,0.45)] ring-2 ring-blue-400 animate-pulse-glow"
                  : "shadow-md ring-1 ring-border opacity-90"
              }`}>
                <PlayerCard player={opponentPlayer} size="sm" />
                <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-lg whitespace-nowrap ${
                  !opponentPick?.isSub
                    ? "bg-blue-500 text-white border-blue-400"
                    : "bg-slate-900 text-steel border-border"
                }`}>
                  {!opponentPick?.isSub ? `WON MAIN • $${opponentPick?.cost ?? 0}M` : "ASSIGNED BACKUP"}
                </div>
              </div>
            ) : (
              <div className="w-32 sm:w-36 h-40 sm:h-48 rounded-2xl bg-card border border-border flex items-center justify-center text-xs text-steel">
                No Card
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs flex flex-col items-center gap-1 z-10 pt-1">
          <div className="w-full bg-slate-900 border border-border/80 rounded-full h-1.5 overflow-hidden">
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
