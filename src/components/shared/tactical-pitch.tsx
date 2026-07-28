"use client";

import React, { useState } from "react";
import { PlayerCardData } from "@/types/player";
import { Shield, Sparkles, UserCheck, Layers, Eye, Users, Shirt } from "lucide-react";

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
  badgeLabel?: string;
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
  "5-3-2": [
    { pos: "GK", x: 50, y: 10 },
    { pos: "LB", x: 14, y: 26 },
    { pos: "CB", x: 32, y: 24 },
    { pos: "CB", x: 50, y: 22 },
    { pos: "CB", x: 68, y: 24 },
    { pos: "RB", x: 86, y: 26 },
    { pos: "CM", x: 32, y: 54 },
    { pos: "CDM", x: 50, y: 46 },
    { pos: "CM", x: 68, y: 54 },
    { pos: "ST", x: 38, y: 84 },
    { pos: "ST", x: 62, y: 84 },
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
  badgeLabel = "EA Broadcast TV Mode",
}: TacticalPitchProps) {
  const [is3DView, setIs3DView] = useState(true);

  const coordsMap = matchSize === 5 ? FORMATION_COORDS_5 : FORMATION_COORDS_11;
  const positions = coordsMap[formation] || coordsMap[matchSize === 5 ? "1-2-1" : "4-3-3"];

  const starterSlots = squad.filter((s) => !s.isSub);
  const subSlots = squad.filter((s) => s.isSub);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border bg-card shadow-2xl p-4 md:p-6 space-y-4">
      {/* Broadcast Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 animate-pulse" style={{ color: accentColor }} />
          <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wider">
            {title} — <span style={{ color: accentColor }}>{formation}</span>
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIs3DView(!is3DView)}
            className="px-3 py-1 rounded-full bg-background border border-border hover:border-lime/50 text-[11px] font-black uppercase tracking-wider text-steel hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-lime" />
            {is3DView ? "3D Pitch View" : "2D Pitch View"}
          </button>

          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border hidden sm:inline-block"
            style={{
              color: accentColor,
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}40`,
            }}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      {/* Realistic Broadcast Pitch Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#092612] via-[#0e3b1c] to-[#082210] border border-lime/20 shadow-2xl flex items-center justify-center p-2">
        <div
          className={`relative w-full h-full transition-transform duration-700 ${
            is3DView ? "transform [transform:perspective(1000px)_rotateX(26deg)_scale(0.94)] origin-bottom" : ""
          }`}
        >
          {/* Turf pattern stripes */}
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_40px)]" />

          {/* Authentic Stadium SVG Pitch Markings */}
          <svg className="absolute inset-0 w-full h-full stroke-white/30 fill-none stroke-[1.5]" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Outer Boundary */}
            <rect x="2" y="2" width="96" height="96" rx="2" />
            {/* Corner Arcs */}
            <path d="M 2 6 A 4 4 0 0 0 6 2" />
            <path d="M 94 2 A 4 4 0 0 0 98 6" />
            <path d="M 2 94 A 4 4 0 0 1 6 98" />
            <path d="M 94 98 A 4 4 0 0 1 98 94" />

            {/* Halfway Line & Center Circle */}
            <line x1="2" y1="50" x2="98" y2="50" />
            <circle cx="50" cy="50" r="14" />
            <circle cx="50" cy="50" r="0.9" fill="#ffffff" />

            {/* Goal Posts Top & Bottom */}
            <rect x="42" y="0.5" width="16" height="1.5" fill="#ffffff" opacity="0.6" />
            <rect x="42" y="98" width="16" height="1.5" fill="#ffffff" opacity="0.6" />

            {/* Bottom Penalty Area (Our Side) */}
            <rect x="24" y="76" width="52" height="22" />
            <rect x="36" y="88" width="28" height="10" />
            <path d="M 38 76 A 12 12 0 0 1 62 76" />
            <circle cx="50" cy="84" r="0.9" fill="#ffffff" />

            {/* Top Penalty Area (Opponent Side) */}
            <rect x="24" y="2" width="52" height="22" />
            <rect x="36" y="2" width="28" height="10" />
            <path d="M 38 24 A 12 12 0 0 0 62 24" />
            <circle cx="50" cy="16" r="0.9" fill="#ffffff" />
          </svg>

          {/* Realistic Broadcast Player Pins */}
          {positions.map((item, idx) => {
            const slot = starterSlots[idx] || squad[idx];
            const hasPlayer = Boolean(slot?.player);
            const playerName = slot?.player?.name || item.pos;

            return (
              <div
                key={`${item.pos}-${idx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-500 hover:scale-110 z-10 cursor-pointer"
                style={{ left: `${item.x}%`, top: `${100 - item.y}%` }}
              >
                {/* Team Jersey Kit Circle Pin */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all ${
                    hasPlayer
                      ? "bg-slate-950 border-lime text-lime shadow-lime/40 animate-pulse-glow"
                      : "bg-black/70 border-white/20 text-steel"
                  }`}
                  style={{
                    borderColor: hasPlayer ? accentColor : undefined,
                    boxShadow: hasPlayer ? `0 0 20px ${accentColor}50` : undefined,
                  }}
                >
                  {hasPlayer ? (
                    <Shirt className="w-5 h-5" style={{ color: accentColor }} />
                  ) : (
                    <span className="text-xs font-black uppercase text-white">{item.pos}</span>
                  )}
                </div>

                {/* Player Tag Pill */}
                <div
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide truncate max-w-[85px] sm:max-w-[105px] text-center border shadow-xl backdrop-blur-md transition-all ${
                    hasPlayer
                      ? "bg-slate-950/90 text-white border-lime/50"
                      : "bg-black/80 text-steel border-white/10"
                  }`}
                  style={{
                    borderColor: hasPlayer ? `${accentColor}80` : undefined,
                  }}
                >
                  {playerName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Substitute Players (Sub Bench) Section */}
      <div className="bg-background/60 border border-border/80 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-steel flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" /> Substitute Players ({subSlots.length})
          </h4>
          <span className="text-[10px] font-black text-steel uppercase">Reserve Squad</span>
        </div>

        {subSlots.length === 0 ? (
          <p className="text-[11px] text-steel/60 italic py-1">No substitute players on bench yet.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
            {subSlots.map((slot, i) => (
              <div
                key={`sub-${i}-${slot.player?.id || i}`}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-blue-500/30 text-xs shadow-md"
              >
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded uppercase">
                  {slot.position}
                </span>
                <span className="font-bold text-white text-xs truncate max-w-[100px]">
                  {slot.player?.name || "Sub Player"}
                </span>
                <span className="text-[10px] font-stats text-slate-400">Reserve</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
