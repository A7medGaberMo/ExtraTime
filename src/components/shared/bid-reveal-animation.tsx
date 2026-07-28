"use client";

import React, { useEffect, useState } from "react";
import { PlayerCard } from "@/components/shared/player-card";
import type { PlayerCardData } from "@/types/player";
import { Crown, Sparkles, Trophy, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

interface BidRevealAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  position: string;
  roundNumber: number;
  mainPlayer: PlayerCardData | null;
  subPlayer: PlayerCardData | null;
  winnerName: string;
  winnerIsMe: boolean;
  winningBid: number;
  runnerUpName: string;
}

export function BidRevealAnimation({
  isOpen,
  onClose,
  position,
  roundNumber,
  mainPlayer,
  subPlayer,
  winnerName,
  winnerIsMe,
  winningBid,
  runnerUpName,
}: BidRevealAnimationProps) {
  const [stage, setStage] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    if (isOpen) {
      setStage("enter");
      const timer1 = setTimeout(() => setStage("show"), 400);
      return () => clearTimeout(timer1);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setStage("exit");
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen || !mainPlayer) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-opacity duration-400 ${
        stage === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Stadium spotlight glow backdrop */}
      <div className="absolute inset-0 bg-radial-gradient from-lime/15 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-4xl w-full flex flex-col items-center gap-6 animate-scale-in">
        {/* TV Broadcast Banner */}
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-lime/40 text-lime text-xs font-black uppercase tracking-widest shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-lime animate-spin" />
            Round {roundNumber} Result — {position} Slot
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            {winningBid > 0 ? (
              <>
                <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
                {winnerIsMe ? "You Won The Bid!" : `${winnerName} Won The Bid!`}
              </>
            ) : (
              "Passed — Players Distributed"
            )}
          </h2>
          <p className="text-xs text-steel font-medium">
            {winningBid > 0 ? `Winning Bid: $${winningBid}M` : "Free allocation round"}
          </p>
        </div>

        {/* Dynamic Dual Card Front-and-Center Stage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center justify-center w-full max-w-2xl">
          {/* Main Card (Winner) */}
          <div
            className={`flex flex-col items-center gap-3 transition-all duration-500 transform ${
              stage === "enter"
                ? "-translate-x-12 opacity-0 scale-90"
                : stage === "exit"
                ? winnerIsMe
                  ? "-translate-x-32 opacity-0"
                  : "translate-x-32 opacity-0"
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-lime to-emerald-400 rounded-3xl blur-md opacity-40 group-hover:opacity-80 transition" />
              <div className="relative">
                <PlayerCard player={mainPlayer} size="md" />
              </div>
              <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg border border-amber-300">
                <Crown className="w-3 h-3 fill-slate-950" /> Starter
              </div>
            </div>

            <div className="text-center bg-slate-900/90 border border-lime/30 rounded-xl px-4 py-2 w-full shadow-lg">
              <p className="text-[10px] font-black uppercase text-lime tracking-wider flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Winner: {winnerName}
              </p>
              <p className="font-stats text-sm text-white">
                {winningBid > 0 ? `$${winningBid}M` : "Free Starter"}
              </p>
            </div>
          </div>

          {/* Sub Card (Runner Up / Sub Player) */}
          {subPlayer && (
            <div
              className={`flex flex-col items-center gap-3 transition-all duration-500 delay-100 transform ${
                stage === "enter"
                  ? "translate-x-12 opacity-0 scale-90"
                  : stage === "exit"
                  ? winnerIsMe
                    ? "translate-x-32 opacity-0"
                    : "-translate-x-32 opacity-0"
                  : "translate-x-0 opacity-100 scale-100"
              }`}
            >
              <div className="relative opacity-90 hover:opacity-100 transition">
                <PlayerCard player={subPlayer} size="md" />
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg border border-blue-400">
                  <UserPlus className="w-3 h-3" /> Sub Player
                </div>
              </div>

              <div className="text-center bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 w-full shadow-lg">
                <p className="text-[10px] font-black uppercase text-steel tracking-wider">
                  Reserve: {runnerUpName}
                </p>
                <p className="font-stats text-sm text-slate-300">Free Sub</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          className="mt-2 px-8 py-3.5 bg-lime hover:bg-vivid text-background font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-lime/20 active:scale-95 transition-all flex items-center gap-2"
        >
          Continue Draft <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
