"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Layers, HelpCircle } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
export interface TacticalSquadSlot {
  position: string;
  roundNumber?: number;
  player?: {
    name: string;
    tier?: string;
    imageUrl?: string;
    club?: string;
    nation?: string;
    isLegend?: boolean;
    kitNumber?: number;
  } | null;
  cost?: number;
  isSub?: boolean;
}

export interface TacticalRound {
  roundNumber: number;
  position: string;
}

interface TacticalPitchProps {
  formation: string;
  matchSize: 5 | 11;
  squad: TacticalSquadSlot[];
  rounds?: TacticalRound[];
  currentRound?: number;
  totalRounds?: number;
  title?: string;
  accentColor?: string;
  badgeLabel?: string;
  compact?: boolean;
}

/* ── Tier Colors ──────────────────────────────────────────── */
const TIER_COLORS: Record<string, string> = {
  ICON: "#D4AF37", MASTER: "#A855F7", ELITE_PLUS: "#0EA5E9",
  ELITE: "#E11D48", GOLD: "#EAB308", SILVER: "#CBD5E1", BRONZE: "#C97A3A",
};

/* ── Coordinates ───────────────────────────────────────────── */
type Coord = { pos: string; x: number; y: number };

const C11: Record<string, Coord[]> = {
  "4-3-3": [
    { pos: "GK", x: 50, y: 12 }, { pos: "LB", x: 16, y: 28 }, { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 }, { pos: "RB", x: 84, y: 28 }, { pos: "CDM", x: 50, y: 44 },
    { pos: "CM", x: 32, y: 58 }, { pos: "CAM", x: 68, y: 58 }, { pos: "LW", x: 18, y: 82 },
    { pos: "ST", x: 50, y: 86 }, { pos: "RW", x: 82, y: 82 },
  ],
  "4-2-3-1": [
    { pos: "GK", x: 50, y: 12 }, { pos: "LB", x: 16, y: 28 }, { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 }, { pos: "RB", x: 84, y: 28 }, { pos: "CDM", x: 36, y: 44 },
    { pos: "CDM", x: 64, y: 44 }, { pos: "CAM", x: 50, y: 64 }, { pos: "LW", x: 20, y: 70 },
    { pos: "RW", x: 80, y: 70 }, { pos: "ST", x: 50, y: 88 },
  ],
  "3-5-2": [
    { pos: "GK", x: 50, y: 12 }, { pos: "CB", x: 24, y: 26 }, { pos: "CB", x: 50, y: 24 },
    { pos: "CB", x: 76, y: 26 }, { pos: "LM", x: 14, y: 54 }, { pos: "RM", x: 86, y: 54 },
    { pos: "CDM", x: 50, y: 42 }, { pos: "CM", x: 38, y: 50 }, { pos: "CM", x: 62, y: 50 },
    { pos: "ST", x: 36, y: 84 }, { pos: "CF", x: 64, y: 84 },
  ],
  "4-4-2": [
    { pos: "GK", x: 50, y: 12 }, { pos: "LB", x: 16, y: 28 }, { pos: "CB", x: 38, y: 26 },
    { pos: "CB", x: 62, y: 26 }, { pos: "RB", x: 84, y: 28 }, { pos: "LW", x: 18, y: 56 },
    { pos: "CM", x: 38, y: 54 }, { pos: "CM", x: 62, y: 54 }, { pos: "RW", x: 82, y: 56 },
    { pos: "ST", x: 36, y: 86 }, { pos: "ST", x: 64, y: 86 },
  ],
};

const C5: Record<string, Coord[]> = {
  "1-2-1": [
    { pos: "GK", x: 50, y: 14 }, { pos: "CB", x: 50, y: 36 },
    { pos: "CM", x: 28, y: 58 }, { pos: "CAM", x: 72, y: 58 }, { pos: "ST", x: 50, y: 84 },
  ],
  "2-1-1": [
    { pos: "GK", x: 50, y: 14 }, { pos: "CB", x: 32, y: 36 },
    { pos: "CB", x: 68, y: 36 }, { pos: "CM", x: 50, y: 58 }, { pos: "ST", x: 50, y: 84 },
  ],
  "1-1-2": [
    { pos: "GK", x: 50, y: 14 }, { pos: "CB", x: 50, y: 36 },
    { pos: "CM", x: 50, y: 56 }, { pos: "ST", x: 34, y: 82 }, { pos: "CF", x: 66, y: 82 },
  ],
};

/* ── Close Match Groups for Position Alignment ───────────── */
const CLOSE_GROUPS: Record<string, string[]> = {
  GK: ["GK"],
  CB: ["CB"],
  LB: ["LB", "LWB"],
  RB: ["RB", "RWB"],
  LWB: ["LWB", "LB"],
  RWB: ["RWB", "RB"],
  CDM: ["CDM", "CM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM"],
  LM: ["LM", "LW"],
  RM: ["RM", "RW"],
  LW: ["LW", "LM"],
  RW: ["RW", "RM"],
  ST: ["ST", "CF"],
  CF: ["CF", "ST"],
};

function normalizePosition(pos: string): string {
  return pos.trim().toUpperCase().split("/")[0];
}

/**
 * Finds the index of the best matching coordinate slot for a position.
 */
function findBestCoordinateIndex(targetPos: string, coords: Coord[], usedCoords: Set<number>): number {
  const normTarget = normalizePosition(targetPos);

  // 1. Exact match (CB to CB, ST to ST, GK to GK, etc.)
  let found = coords.findIndex((c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) === normTarget);
  if (found !== -1) return found;

  // 2. Close variant match (CF for ST, LWB for LB, RWB for RB)
  const close = CLOSE_GROUPS[normTarget] || [];
  for (const fallback of close) {
    found = coords.findIndex((c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) === fallback);
    if (found !== -1) return found;
  }

  // 3. Line match (STRICT: GK coordinate is ONLY for GK)
  const getLine = (p: string) => {
    const n = normalizePosition(p);
    if (n === "GK") return "GK";
    if (["CB", "LB", "RB", "LWB", "RWB"].includes(n)) return "DEF";
    if (["CDM", "CM", "CAM", "LM", "RM"].includes(n)) return "MID";
    return "ATT";
  };
  const targetLine = getLine(normTarget);
  if (targetLine === "GK") {
    found = coords.findIndex((c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) === "GK");
    if (found !== -1) return found;
    return -1; // Never place GK in outfield
  }

  found = coords.findIndex((c, idx) => !usedCoords.has(idx) && getLine(c.pos) === targetLine);
  if (found !== -1) return found;

  // 4. Ultimate outfield fallback: pick first unused non-GK slot
  return coords.findIndex((c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) !== "GK");
}

/* ── Component ────────────────────────────────────────────── */
export function TacticalPitch({
  formation,
  matchSize,
  squad,
  rounds,
  currentRound,
  totalRounds = 11,
  title = "Squad Lineup",
  accentColor = "#95E810",
  badgeLabel,
  compact = false,
}: TacticalPitchProps) {
  const [is3DView, setIs3DView] = useState(!compact);

  const coordsMap = matchSize === 5 ? C5 : C11;
  const coords = coordsMap[formation] || coordsMap[matchSize === 5 ? "1-2-1" : "4-3-3"];
  const is5 = matchSize === 5;

  // Identify display modes: active drafting or final completed view
  const isDraftMode = Boolean(rounds && currentRound !== undefined);

  // ── Mapping Logic ────────────────────────────────────────
  const { onField, substitutes } = useMemo(() => {
    const placedIndices = new Map<number, TacticalSquadSlot>();
    const usedCoordIdx = new Set<number>();
    const assignedSquadSlotIdxs = new Set<number>();

    if (isDraftMode && rounds) {
      // 1. DRAFT MODE: Map players specifically based on the round order
      // Find coordinates for each round index
      const roundToCoord = new Map<number, number>();
      const usedCoordsForRounds = new Set<number>();

      for (const round of rounds) {
        const coordIdx = findBestCoordinateIndex(round.position, coords, usedCoordsForRounds);
        if (coordIdx !== -1) {
          roundToCoord.set(round.roundNumber, coordIdx);
          usedCoordsForRounds.add(coordIdx);
        }
      }

      // Assign won players to their specific round coordinate slot
      squad.forEach((slot, sIdx) => {
        if (!slot.roundNumber) return;
        const coordIdx = roundToCoord.get(slot.roundNumber);
        if (coordIdx !== undefined && coordIdx !== -1) {
          placedIndices.set(coordIdx, slot);
          assignedSquadSlotIdxs.add(sIdx);
        }
      });

      // Find if active round matches a coordinate slot
      let activeCoordIdx: number | undefined;
      if (currentRound) {
        activeCoordIdx = roundToCoord.get(currentRound);
      }

      // Reconstruct the 11 pitch slots
      const onFieldData = coords.map((coord, ci) => {
        const slot = placedIndices.get(ci);
        const matchedRound = rounds.find(r => roundToCoord.get(r.roundNumber) === ci);

        return {
          coord,
          slot: slot || null,
          isCurrentSlot: matchedRound?.roundNumber === currentRound,
          isFutureSlot: matchedRound ? matchedRound.roundNumber > (currentRound || 0) : false,
        };
      });

      // Substitutes in draft mode are anything leftover
      const subsData = squad.filter((_, sIdx) => !assignedSquadSlotIdxs.has(sIdx));

      return { onField: onFieldData, substitutes: subsData };
    } else {
      // 2. FINAL LINEUP MODE: Smart positional allocation
      // Sort squad: Main starters first, Subs second
      const sortedSquad = [...squad].map((slot, originalIdx) => ({ slot, originalIdx }));
      sortedSquad.sort((a, b) => {
        if (a.slot.isSub && !b.slot.isSub) return 1;
        if (!a.slot.isSub && b.slot.isSub) return -1;
        return 0;
      });

      // Allocate starting slots by matching coordinates
      coords.forEach((coord, ci) => {
        const foundIndex = sortedSquad.findIndex(
          (item) => !assignedSquadSlotIdxs.has(item.originalIdx) &&
            (normalizePosition(item.slot.position) === normalizePosition(coord.pos) ||
              CLOSE_GROUPS[normalizePosition(coord.pos)]?.includes(normalizePosition(item.slot.position)))
        );

        if (foundIndex !== -1) {
          const item = sortedSquad[foundIndex];
          placedIndices.set(ci, item.slot);
          assignedSquadSlotIdxs.add(item.originalIdx);
          usedCoordIdx.add(ci);
        } else {
          // General line matching fallback
          const getLine = (p: string) => {
            const n = normalizePosition(p);
            if (n === "GK") return "GK";
            if (["CB", "LB", "RB", "LWB", "RWB"].includes(n)) return "DEF";
            if (["CDM", "CM", "CAM", "LM", "RM", "LW", "RW"].includes(n)) return "MID";
            return "ATT";
          };
          const coordLine = getLine(coord.pos);
          const fallbackIdx = sortedSquad.findIndex(
            (item) => !assignedSquadSlotIdxs.has(item.originalIdx) && getLine(item.slot.position) === coordLine
          );
          if (fallbackIdx !== -1) {
            const item = sortedSquad[fallbackIdx];
            placedIndices.set(ci, item.slot);
            assignedSquadSlotIdxs.add(item.originalIdx);
            usedCoordIdx.add(ci);
          }
        }
      });

      // Reconstruct onField list
      const onFieldData = coords.map((coord, ci) => {
        const slot = placedIndices.get(ci);
        return {
          coord,
          slot: slot || null,
          isCurrentSlot: false,
          isFutureSlot: false,
        };
      });

      // Substitutes are anything leftover (duplicate positions, etc.)
      const subsData = squad.filter((_, sIdx) => !assignedSquadSlotIdxs.has(sIdx));

      return { onField: onFieldData, substitutes: subsData };
    }
  }, [squad, rounds, currentRound, coords, isDraftMode]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/85 shadow-2xl backdrop-blur-md flex flex-col justify-between ${compact ? "p-3" : "p-4 md:p-6"}`}>
      {/* Pitch Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-lime animate-pulse" />
          <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
            {title} — <span className="text-lime">{formation}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIs3DView(!is3DView)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-lime/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-steel hover:text-white transition-all flex items-center gap-1 shadow-sm">
            <Layers className="w-3 h-3 text-lime" />
            {is3DView ? "3D Pitch" : "2D Pitch"}
          </button>
          {badgeLabel && (
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-lime/20 bg-lime/5 text-lime">
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stadium Pitch Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#06200f] via-[#0b3319] to-[#04170b] border border-lime/20 shadow-[0_0_30px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: is5 ? "85%" : "100%" }}>
        <div className={`absolute inset-0 transition-transform duration-700 ${is3DView ? "transform [transform:perspective(800px)_rotateX(20deg)_scale(0.95)] origin-bottom" : ""}`}>

          {/* Turf stripes */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_36px)]" />

          {/* Pitch SVG markings */}
          <svg className="absolute inset-0 w-full h-full stroke-white/20 fill-none stroke-[1.2]" preserveAspectRatio="none" viewBox="0 0 100 100">
            <rect x="3" y="3" width="94" height="94" rx="1.5" />
            <line x1="3" y1="50" x2="97" y2="50" />
            <circle cx="50" cy="50" r="12" />
            <circle cx="50" cy="50" r="0.8" fill="#ffffff" />
            <rect x="26" y="78" width="48" height="19" />
            <rect x="36" y="88" width="28" height="9" />
            <rect x="26" y="3" width="48" height="19" />
            <rect x="36" y="3" width="28" height="9" />
          </svg>

          {/* Formation Nodes */}
          {onField.map(({ coord, slot, isCurrentSlot, isFutureSlot }, idx) => {
            const hasPlayer = Boolean(slot?.player);
            const player = slot?.player;
            const tierColor = player?.tier ? (TIER_COLORS[player.tier] || "#95E810") : "#95E810";
            const nodeSize = is5 ? 46 : 38;
            const emptySize = is5 ? 42 : 34;

            return (
              <motion.div
                key={`${coord.pos}-${idx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                style={{ left: `${coord.x}%`, top: `${100 - coord.y}%` }}
                initial={{ y: 15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.4, ease: "easeOut" }}
              >
                <AnimatePresence mode="wait">
                  {hasPlayer && player ? (
                    <motion.div key="filled" className="flex flex-col items-center"
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      <div className="relative rounded-xl border-2 shadow-lg bg-slate-950 flex items-center justify-center"
                        style={{ width: nodeSize, height: nodeSize, borderColor: tierColor, boxShadow: `0 0 16px ${tierColor}45` }}>
                        {player.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-[10px]"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full rounded-[10px] flex items-center justify-center font-black text-[9px] uppercase"
                            style={{ backgroundColor: `${tierColor}20`, color: tierColor }}>
                            {player.name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                        )}

                        {/* Position indicator */}
                        <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 text-[7px] font-black uppercase rounded border shadow-md"
                          style={{ backgroundColor: "#090d16", color: tierColor, borderColor: `${tierColor}80` }}>
                          {slot?.position || coord.pos}
                        </span>

                        {/* Sub badge indicator */}
                        {slot?.isSub && (
                          <span className="absolute -top-1.5 -right-1.5 px-1 text-[6px] font-black uppercase bg-amber-500 text-slate-950 rounded border border-amber-300">SUB</span>
                        )}
                      </div>

                      {/* Name & price badge */}
                      <div className="mt-0.5 px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase text-center border backdrop-blur-md max-w-[70px] sm:max-w-[85px] truncate flex items-center gap-0.5"
                        style={{ backgroundColor: "rgba(9,13,22,0.92)", borderColor: `${tierColor}40`, color: "#fff" }}>
                        <span className="truncate">{player.name?.split(" ").pop()}</span>
                        {slot?.cost !== undefined && slot.cost > 0 && (
                          <span className="text-[7px] text-lime shrink-0">${slot.cost}M</span>
                        )}
                      </div>
                    </motion.div>
                  ) : isCurrentSlot ? (
                    <motion.div key="active" className="flex flex-col items-center"
                      initial={{ scale: 0.7 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="rounded-xl border-2 border-lime border-dashed bg-lime/10 flex items-center justify-center animate-active-ring animate-pulse"
                        style={{ width: nodeSize, height: nodeSize }}>
                        <span className="text-[9px] sm:text-xs font-black uppercase text-lime">{coord.pos}</span>
                      </div>
                      <div className="mt-0.5 px-1 py-0.2 rounded text-[6px] font-black uppercase text-lime bg-lime/10 border border-lime/40">
                        BIDDING
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" className="flex flex-col items-center"
                      initial={{ opacity: 0 }} animate={{ opacity: isFutureSlot ? 0.35 : 0.6 }}
                    >
                      <div className="rounded-xl border border-dashed border-white/20 bg-black/40 flex items-center justify-center animate-pulse"
                        style={{ width: emptySize, height: emptySize }}>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase text-steel/60">{coord.pos}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Substitutes Bench Area */}
      {substitutes.length > 0 && (
        <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-steel tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Substitutes & Backups ({substitutes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {substitutes.map((sub, sIdx) => {
              const subTierColor = sub.player?.tier ? (TIER_COLORS[sub.player.tier] || "#95E810") : "#95E810";
              return (
                <div key={sIdx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-white/10 shadow-sm"
                  style={{ borderColor: `${subTierColor}30` }}>
                  <div className="w-7 h-7 rounded bg-slate-900 border flex items-center justify-center shrink-0"
                    style={{ borderColor: subTierColor }}>
                    {sub.player?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.player.imageUrl} alt={sub.player.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-[8px] font-black text-white">{sub.player?.name?.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[9px] font-black text-white truncate max-w-[80px] leading-tight">{sub.player?.name?.split(" ").pop()}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-bold text-steel bg-white/5 px-1 rounded uppercase">{sub.position}</span>
                      {sub.cost !== undefined && sub.cost > 0 && <span className="text-[7px] text-lime font-black">${sub.cost}M</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 mt-2 bg-slate-950/60 border border-white/5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
        <span className="text-steel"><span className="text-lime">{formation}</span> Scheme</span>
        <span className="text-steel"><span className="text-white">{squad.filter(s => s.player).length}</span>/{totalRounds} Signed</span>
      </div>
    </div>
  );
}
