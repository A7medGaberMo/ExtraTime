"use client";

import React from "react";
import { PlayerCardData } from "@/types/player";
import { Shield, Sparkles, UserCheck } from "lucide-react";

export interface SquadSlot {
  position: string;
  player?: PlayerCardData | null;
  cost?: number;
  isSub?: boolean;
}

interface TacticalPitchProps {
  formation: string;
  matchSize: 5 | 11;
  squad: SquadSlot[];
  title?: string;
  accentColor?: string;
}

// Relative pitch percentage coordinates (x: left-right, y: bottom-up from GK at bottom to ST at top)
const FORMATION_COORDS_11: Record<string, Array<{ pos: string; x: number; y: number }>> = {
  "4-3-3": [
    { pos: "GK", x: 50, y: 12 },
    { pos: "LB", x: 16, y: 28 },
    { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 },
    { pos: "RB", x: 84, y: 28 },
    { pos: "CDM", x: 50, y: 44 },
    { pos: "CM", x: 32, y: 58 },
    { pos: "CAM", x: 68, y: 58 },
    { pos: "LW", x: 18, y: 82 },
    { pos: "ST", x: 50, y: 86 },
    { pos: "RW", x: 82, y: 82 },
  ],
  "4-2-3-1": [
    { pos: "GK", x: 50, y: 12 },
    { pos: "LB", x: 16, y: 28 },
    { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 },
    { pos: "RB", x: 84, y: 28 },
    { pos: "CDM", x: 36, y: 44 },
    { pos: "CDM", x: 64, y: 44 },
    { pos: "CAM", x: 50, y: 64 },
    { pos: "LW", x: 20, y: 70 },
    { pos: "RW", x: 80, y: 70 },
    { pos: "ST", x: 50, y: 88 },
  ],
  "3-5-2": [
    { pos: "GK", x: 50, y: 12 },
    { pos: "CB", x: 24, y: 26 },
    { pos: "CB", x: 50, y: 24 },
    { pos: "CB", x: 76, y: 26 },
    { pos: "LW", x: 14, y: 54 },
    { pos: "CM", x: 38, y: 50 },
    { pos: "CDM", x: 50, y: 42 },
    { pos: "CM", x: 62, y: 50 },
    { pos: "RW", x: 86, y: 54 },
    { pos: "ST", x: 36, y: 84 },
    { pos: "CF", x: 64, y: 84 },
  ],
  "4-4-2": [
    { pos: "GK", x: 50, y: 12 },
    { pos: "LB", x: 16, y: 28 },
    { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 },
    { pos: "RB", x: 84, y: 28 },
    { pos: "LW", x: 18, y: 56 },
    { pos: "CM", x: 38, y: 54 },
    { pos: "CM", x: 62, y: 54 },
    { pos: "RW", x: 82, y: 56 },
    { pos: "ST", x: 36, y: 86 },
    { pos: "ST", x: 64, y: 86 },
  ],
};

const FORMATION_COORDS_5: Record<string, Array<{ pos: string; x: number; y: number }>> = {
  "1-2-1": [
    { pos: "GK", x: 50, y: 14 },
    { pos: "CB", x: 50, y: 34 },
    { pos: "CM", x: 30, y: 58 },
    { pos: "CAM", x: 70, y: 58 },
    { pos: "ST", x: 50, y: 84 },
  ],
  "2-1-1": [
    { pos: "GK", x: 50, y: 14 },
    { pos: "CB", x: 32, y: 34 },
    { pos: "CB", x: 68, y: 34 },
    { pos: "CM", x: 50, y: 58 },
    { pos: "ST", x: 50, y: 84 },
  ],
  "1-1-2": [
    { pos: "GK", x: 50, y: 14 },
    { pos: "CB", x: 50, y: 34 },
    { pos: "CM", x: 50, y: 56 },
    { pos: "ST", x: 34, y: 82 },
    { pos: "CF", x: 66, y: 82 },
  ],
};

export function TacticalPitch({
  formation,
  matchSize,
  squad,
  title = "Tactical Formation",
  accentColor = "#95E810",
}: TacticalPitchProps) {
  const coordsMap = matchSize === 5 ? FORMATION_COORDS_5 : FORMATION_COORDS_11;
  const positions = coordsMap[formation] || coordsMap[matchSize === 5 ? "1-2-1" : "4-3-3"];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border bg-card shadow-2xl p-4 md:p-6 space-y-4">
      {/* Broadcast Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-lime animate-pulse" />
          <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wider">
            {title} — <span className="text-lime">{formation}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime">
            EA Broadcast TV Mode
          </span>
        </div>
      </div>

      {/* Broadcast Stadium Grass Pitch */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#092612] via-[#0e3b1c] to-[#082210] border border-lime/20 shadow-inner">
        {/* Stadium turf stripes pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_40px)]" />

        {/* Tactical Pitch Lines */}
        <svg className="absolute inset-0 w-full h-full stroke-white/20 fill-none stroke-[1.5]" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Outer Boundary */}
          <rect x="2" y="2" width="96" height="96" rx="2" />
          {/* Halfway Line */}
          <line x1="2" y1="50" x2="98" y2="50" />
          {/* Center Circle */}
          <circle cx="50" cy="50" r="14" />
          <circle cx="50" cy="50" r="0.8" fill="#ffffff" />
          {/* Bottom Penalty Box (Our Side) */}
          <rect x="25" y="76" width="50" height="22" />
          <rect x="36" y="88" width="28" height="10" />
          <circle cx="50" cy="85" r="0.8" fill="#ffffff" />
          {/* Top Penalty Box */}
          <rect x="25" y="2" width="50" height="22" />
          <rect x="36" y="2" width="28" height="10" />
          <circle cx="50" cy="15" r="0.8" fill="#ffffff" />
        </svg>

        {/* Player Pins on Pitch */}
        {positions.map((item, idx) => {
          const slot = squad[idx];
          const hasPlayer = Boolean(slot?.player);
          const playerName = slot?.player?.name || item.pos;
          const tier = slot?.player?.tier || "SILVER";

          return (
            <div
              key={`${item.pos}-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-500 hover:scale-110 z-10"
              style={{ left: `${item.x}%`, top: `${100 - item.y}%` }}
            >
              {/* Glow ring */}
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                  hasPlayer
                    ? "bg-slate-900 border-lime shadow-lime/40 text-lime animate-pulse-glow"
                    : "bg-black/60 border-white/20 text-steel"
                }`}
              >
                {hasPlayer ? (
                  <UserCheck className="w-5 h-5 text-lime" />
                ) : (
                  <span className="text-xs font-black uppercase text-white">{item.pos}</span>
                )}
              </div>

              {/* Player Tag Pill */}
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide truncate max-w-[85px] sm:max-w-[100px] text-center border shadow-md backdrop-blur-md ${
                  hasPlayer
                    ? "bg-slate-950/90 text-white border-lime/50"
                    : "bg-black/70 text-steel border-white/10"
                }`}
              >
                {playerName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
