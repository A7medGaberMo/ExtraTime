"use client";

import React, { useState } from "react";
import { PlayerCardData } from "@/types/player";
import { Shield, Layers } from "lucide-react";

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
  compact?: boolean;
}

/* Tier accent color map for player node glows */
const TIER_ACCENT_COLORS: Record<string, string> = {
  ICON: "#D4AF37",
  MASTER: "#9333EA",
  ELITE_PLUS: "#0284C7",
  ELITE: "#E11D48",
  GOLD: "#EAB308",
  SILVER: "#94A3B8",
  BRONZE: "#D97706",
};

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
  badgeLabel = "Live Broadcast",
  compact = false,
}: TacticalPitchProps) {
  const [is3DView, setIs3DView] = useState(!compact);

  const coordsMap = matchSize === 5 ? FORMATION_COORDS_5 : FORMATION_COORDS_11;
  const positions = coordsMap[formation] || coordsMap[matchSize === 5 ? "1-2-1" : "4-3-3"];

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-border/80 bg-slate-950/90 shadow-2xl space-y-3 ${
        compact ? "p-3" : "p-4 md:p-6 space-y-4"
      }`}
    >
      {/* Broadcast Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" style={{ color: accentColor }} />
          <h3 className="text-xs sm:text-sm md:text-base font-black uppercase text-white tracking-wider">
            {title} — <span style={{ color: accentColor }}>{formation}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIs3DView(!is3DView)}
            className="px-2.5 py-1 rounded-full bg-background border border-border hover:border-lime/50 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-steel hover:text-white transition-all flex items-center gap-1 active:scale-95 shadow-sm"
          >
            <Layers className="w-3 h-3 text-lime" />
            {is3DView ? "3D Pitch" : "2D Pitch"}
          </button>

          {!compact && (
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
          )}
        </div>
      </div>

      {/* Stadium Pitch Container */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a2e16] via-[#104220] to-[#072411] border border-lime/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center p-2 ${
          compact ? "h-[300px] sm:h-[340px]" : "h-[400px] sm:h-[480px] md:h-[530px]"
        }`}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 ${
            is3DView ? "transform [transform:perspective(1000px)_rotateX(22deg)_scale(0.96)] origin-bottom" : ""
          }`}
        >
          {/* Turf stripes pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_2px,transparent_2px,transparent_48px)]" />

          {/* Stadium Pitch Markings */}
          <svg
            className="absolute inset-0 w-full h-full stroke-white/40 fill-none stroke-[1.5]"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
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
            <circle cx="50" cy="50" r="1" fill="#ffffff" />
            {/* Goals */}
            <rect x="42" y="0.5" width="16" height="1.5" fill="#ffffff" opacity="0.7" />
            <rect x="42" y="98" width="16" height="1.5" fill="#ffffff" opacity="0.7" />
            {/* Bottom Penalty Box (Home) */}
            <rect x="24" y="76" width="52" height="22" />
            <rect x="36" y="88" width="28" height="10" />
            <path d="M 38 76 A 12 12 0 0 1 62 76" />
            <circle cx="50" cy="84" r="1" fill="#ffffff" />
            {/* Top Penalty Box (Away) */}
            <rect x="24" y="2" width="52" height="22" />
            <rect x="36" y="2" width="28" height="10" />
            <path d="M 38 24 A 12 12 0 0 0 62 24" />
            <circle cx="50" cy="16" r="1" fill="#ffffff" />
          </svg>

          {/* Authentic Broadcast Player Nodes */}
          {positions.map((item, idx) => {
            const slot =
              squad.find((s: SquadSlot & { roundNumber?: number }) => s.roundNumber === idx + 1) || squad[idx];
            const hasPlayer = Boolean(slot?.player);
            const player = slot?.player;
            const tierColor = TIER_ACCENT_COLORS[player?.tier as string] ?? "#95E810";

            return (
              <div
                key={`${item.pos}-${idx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-500 hover:scale-110 z-10 cursor-pointer group"
                style={{ left: `${item.x}%`, top: `${100 - item.y}%` }}
              >
                {hasPlayer && player ? (
                  /* ── ACQUIRED PLAYER BADGE NODE ──────────────────── */
                  <div className="flex flex-col items-center">
                    <div
                      className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-2xl p-0.5 border-2 shadow-[0_0_25px_rgba(0,0,0,0.9)] bg-slate-950 flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      style={{
                        borderColor: tierColor,
                        boxShadow: `0 0 20px ${tierColor}60`,
                      }}
                    >
                      {/* Player Image or Initial Avatar */}
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-xl flex items-center justify-center font-black text-sm uppercase"
                          style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                        >
                          {player.name
                            ? player.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                            : item.pos}
                        </div>
                      )}

                      {/* Position Tag Pill */}
                      <span
                        className="absolute -top-2 -left-2 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black uppercase rounded-md border shadow-md"
                        style={{
                          backgroundColor: "#090d16",
                          color: tierColor,
                          borderColor: `${tierColor}80`,
                        }}
                      >
                        {slot.position || item.pos}
                      </span>

                      {/* Sub Tag Indicator */}
                      {slot.isSub && (
                        <span className="absolute -top-2 -right-2 px-1 py-0.2 text-[7px] font-black uppercase bg-amber-500 text-slate-950 rounded border border-amber-300 shadow-md">
                          SUB
                        </span>
                      )}
                    </div>

                    {/* Name & Cost Badge */}
                    <div
                      className="mt-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-center border shadow-xl backdrop-blur-md max-w-[90px] sm:max-w-[115px] truncate flex items-center gap-1"
                      style={{
                        backgroundColor: "rgba(9, 13, 22, 0.95)",
                        borderColor: `${tierColor}60`,
                        color: "#FFFFFF",
                      }}
                    >
                      <span className="truncate">{player.name}</span>
                      {(slot.cost ?? 0) > 0 && (
                        <span className="text-[8px] text-lime shrink-0">${slot.cost}M</span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── OPEN TARGET SLOT NODE ──────────────────────── */
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-dashed border-white/30 bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg transition-all group-hover:border-lime/60 group-hover:bg-lime/10">
                      <span className="text-xs sm:text-sm font-black uppercase text-steel group-hover:text-lime">
                        {item.pos}
                      </span>
                    </div>

                    <div className="mt-1 px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-steel/70 bg-black/70 border border-white/10">
                      Open Slot
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
