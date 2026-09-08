'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerImage } from './player-image';
import { formatDisplayName } from './player-card';
import { cn } from '@/lib/utils';
import { getTierStyle } from '@/lib/tier-styles';

/* ── Types ─────────────────────────────────────────────────── */
export interface TacticalSquadSlot {
  position: string;
  roundNumber?: number;
  player?: {
    id?: string;
    name: string;
    tier?: string;
    imageUrl?: string;
    club?: string;
    nation?: string;
    isLegend?: boolean;
    kitNumber?: number;
    rating?: number;
    position?: string;
  } | null;
  cost?: number;
  isSub?: boolean;
}

export interface TacticalRound {
  roundNumber: number;
  position: string;
}

export interface TacticalPitchProps {
  formation: string;
  matchSize?: 5 | 11;
  squad: TacticalSquadSlot[];
  rounds?: TacticalRound[];
  currentRound?: number;
  totalRounds?: number;
  title?: string;
  accentColor?: string;
  badgeLabel?: string;
  compact?: boolean;
  fillContainer?: boolean;
  scale?: number;
  activePosition?: string;
  onSelectSlot?: (position: string, slotIndex: number) => void;
  className?: string;
}

type Coord = { pos: string; x: number; y: number };

/* ── Broadcast Coordinates (Attackers Top 15%, GK Bottom 84%) ─ */
const FORMATION_11_COORDS: Record<string, Coord[]> = {
  '4-3-3': [
    { pos: 'ST', x: 50, y: 13 },
    { pos: 'LW', x: 18, y: 20 },
    { pos: 'RW', x: 82, y: 20 },
    { pos: 'CAM', x: 50, y: 35 },
    { pos: 'CM', x: 28, y: 50 },
    { pos: 'CM', x: 72, y: 50 },
    { pos: 'LB', x: 16, y: 68 },
    { pos: 'CB', x: 37, y: 70 },
    { pos: 'CB', x: 63, y: 70 },
    { pos: 'RB', x: 84, y: 68 },
    { pos: 'GK', x: 50, y: 87 },
  ],
  '4-2-3-1': [
    { pos: 'ST', x: 50, y: 13 },
    { pos: 'CAM', x: 50, y: 33 },
    { pos: 'LM', x: 18, y: 35 },
    { pos: 'RM', x: 82, y: 35 },
    { pos: 'CDM', x: 33, y: 51 },
    { pos: 'CDM', x: 67, y: 51 },
    { pos: 'LB', x: 16, y: 68 },
    { pos: 'CB', x: 37, y: 70 },
    { pos: 'CB', x: 63, y: 70 },
    { pos: 'RB', x: 84, y: 68 },
    { pos: 'GK', x: 50, y: 87 },
  ],
  '4-4-2': [
    { pos: 'ST', x: 35, y: 13 },
    { pos: 'CF', x: 65, y: 13 },
    { pos: 'LM', x: 17, y: 38 },
    { pos: 'RM', x: 83, y: 38 },
    { pos: 'CM', x: 37, y: 49 },
    { pos: 'CM', x: 63, y: 49 },
    { pos: 'LB', x: 16, y: 68 },
    { pos: 'CB', x: 37, y: 70 },
    { pos: 'CB', x: 63, y: 70 },
    { pos: 'RB', x: 84, y: 68 },
    { pos: 'GK', x: 50, y: 87 },
  ],
  '3-5-2': [
    { pos: 'ST', x: 35, y: 13 },
    { pos: 'ST', x: 65, y: 13 },
    { pos: 'CAM', x: 50, y: 32 },
    { pos: 'LM', x: 16, y: 45 },
    { pos: 'RM', x: 84, y: 45 },
    { pos: 'CDM', x: 36, y: 53 },
    { pos: 'CM', x: 64, y: 53 },
    { pos: 'CB', x: 24, y: 70 },
    { pos: 'CB', x: 50, y: 70 },
    { pos: 'CB', x: 76, y: 70 },
    { pos: 'GK', x: 50, y: 87 },
  ],
  '4-1-2-1-2': [
    { pos: 'ST', x: 35, y: 13 },
    { pos: 'CF', x: 65, y: 13 },
    { pos: 'CAM', x: 50, y: 31 },
    { pos: 'CM', x: 24, y: 46 },
    { pos: 'CM', x: 76, y: 46 },
    { pos: 'CDM', x: 50, y: 59 },
    { pos: 'LB', x: 16, y: 68 },
    { pos: 'CB', x: 37, y: 71 },
    { pos: 'CB', x: 63, y: 71 },
    { pos: 'RB', x: 84, y: 68 },
    { pos: 'GK', x: 50, y: 87 },
  ],
};

const FORMATION_5_COORDS: Record<string, Coord[]> = {
  '1-2-1': [
    { pos: 'ATT', x: 50, y: 18 },
    { pos: 'MID', x: 28, y: 45 },
    { pos: 'MID', x: 72, y: 45 },
    { pos: 'DEF', x: 50, y: 66 },
    { pos: 'GK', x: 50, y: 84 },
  ],
  '2-1-1': [
    { pos: 'ATT', x: 50, y: 18 },
    { pos: 'MID', x: 50, y: 45 },
    { pos: 'DEF', x: 32, y: 66 },
    { pos: 'DEF', x: 68, y: 66 },
    { pos: 'GK', x: 50, y: 84 },
  ],
  '1-1-2': [
    { pos: 'ATT', x: 32, y: 18 },
    { pos: 'ATT', x: 68, y: 18 },
    { pos: 'MID', x: 50, y: 45 },
    { pos: 'DEF', x: 50, y: 66 },
    { pos: 'GK', x: 50, y: 84 },
  ],
};

// Tactical connection lines between slot indices for standard formations
const TACTICAL_LINKS: Record<string, Array<[number, number]>> = {
  '4-3-3': [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [2, 5], [3, 4], [3, 5],
    [4, 6], [4, 7], [5, 8], [5, 9],
    [6, 7], [7, 8], [8, 9],
    [7, 10], [8, 10],
  ],
  '4-2-3-1': [
    [0, 1], [1, 2], [1, 3],
    [2, 4], [3, 5], [4, 5],
    [4, 6], [4, 7], [5, 8], [5, 9],
    [6, 7], [7, 8], [8, 9],
    [7, 10], [8, 10],
  ],
  '4-4-2': [
    [0, 1], [0, 2], [1, 3],
    [0, 4], [1, 5], [4, 5],
    [2, 4], [3, 5], [2, 6], [3, 9],
    [4, 7], [5, 8], [6, 7], [7, 8], [8, 9],
    [7, 10], [8, 10],
  ],
  '3-5-2': [
    [0, 1], [0, 2], [1, 2],
    [2, 3], [2, 4], [2, 5], [2, 6],
    [3, 5], [4, 6], [5, 6],
    [5, 7], [5, 8], [6, 8], [6, 9],
    [7, 8], [8, 9], [7, 10], [8, 10], [9, 10],
  ],
  '4-1-2-1-2': [
    [0, 1], [0, 2], [1, 2],
    [2, 3], [2, 4], [3, 5], [4, 5],
    [3, 6], [4, 9], [5, 7], [5, 8],
    [6, 7], [7, 8], [8, 9], [7, 10], [8, 10],
  ],
  '1-2-1': [
    [0, 1], [0, 2], [1, 3], [2, 3], [3, 4],
  ],
  '2-1-1': [
    [0, 1], [1, 2], [1, 3], [2, 4], [3, 4],
  ],
  '1-1-2': [
    [0, 1], [0, 2], [1, 2], [2, 3], [3, 4],
  ],
};

export function TacticalPitch({
  formation,
  matchSize = 11,
  squad,
  rounds,
  currentRound,
  totalRounds,
  title,
  accentColor = '#95E810',
  badgeLabel,
  compact = false,
  fillContainer = false,
  scale,
  activePosition,
  onSelectSlot,
  className,
}: TacticalPitchProps) {
  // Select coordinates based on matchSize & formation
  const coords = useMemo(() => {
    if (matchSize === 5) {
      return FORMATION_5_COORDS[formation] || FORMATION_5_COORDS['1-2-1'];
    }
    return FORMATION_11_COORDS[formation] || FORMATION_11_COORDS['4-3-3'];
  }, [formation, matchSize]);

  // Links for connecting dashed lines
  const links = useMemo(() => {
    return TACTICAL_LINKS[formation] || [];
  }, [formation]);

  // Match squad players to formation slots with comprehensive fallback
  const mappedSlots = useMemo(() => {
    const assignedPlayers = new Set<string>();
    const usedSquadIndices = new Set<number>();

    const DEF_POS = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB', 'DEF']);
    const MID_POS = new Set(['CDM', 'CM', 'CAM', 'LM', 'RM', 'MID']);
    const ATT_POS = new Set(['ST', 'CF', 'LW', 'RW', 'LF', 'RF', 'ATT']);

    const getSector = (pos?: string): 'GK' | 'DEF' | 'MID' | 'ATT' | 'OTHER' => {
      if (!pos) return 'OTHER';
      const clean = pos.toUpperCase();
      if (clean === 'GK') return 'GK';
      if (DEF_POS.has(clean)) return 'DEF';
      if (MID_POS.has(clean)) return 'MID';
      if (ATT_POS.has(clean)) return 'ATT';
      return 'OTHER';
    };

    // First pass: exact position matches
    const result: Array<{
      slotIndex: number;
      expectedPos: string;
      slot: TacticalSquadSlot;
    }> = coords.map((c, idx) => {
      // 1. Direct index match if position matches
      const directMatch = squad[idx];
      if (
        directMatch?.player &&
        (directMatch.position === c.pos || directMatch.player.position === c.pos) &&
        !assignedPlayers.has(directMatch.player.name)
      ) {
        assignedPlayers.add(directMatch.player.name);
        usedSquadIndices.add(idx);
        return {
          slotIndex: idx,
          expectedPos: c.pos,
          slot: directMatch,
        };
      }

      // 2. Find any squad player with exact position
      const exactIndex = squad.findIndex(
        (s, sIdx) =>
          !usedSquadIndices.has(sIdx) &&
          s.player &&
          (s.position === c.pos || s.player.position === c.pos),
      );
      if (exactIndex !== -1) {
        const found = squad[exactIndex];
        assignedPlayers.add(found.player!.name);
        usedSquadIndices.add(exactIndex);
        return {
          slotIndex: idx,
          expectedPos: c.pos,
          slot: found,
        };
      }

      return {
        slotIndex: idx,
        expectedPos: c.pos,
        slot: { position: c.pos },
      };
    });

    // Second pass: sector/group matches (e.g. CDM to CAM/CM, CF to ST, etc.)
    result.forEach((item, idx) => {
      if (item.slot.player) return; // already assigned
      const targetSector = getSector(item.expectedPos);

      const sectorIndex = squad.findIndex(
        (s, sIdx) =>
          !usedSquadIndices.has(sIdx) &&
          s.player &&
          (getSector(s.position) === targetSector || getSector(s.player.position) === targetSector),
      );

      if (sectorIndex !== -1) {
        const found = squad[sectorIndex];
        assignedPlayers.add(found.player!.name);
        usedSquadIndices.add(sectorIndex);
        result[idx] = {
          ...item,
          slot: found,
        };
      }
    });

    // Third pass: assign ANY remaining unassigned squad players (e.g. 11th round pick) to remaining empty slots
    result.forEach((item, idx) => {
      if (item.slot.player) return;

      const anyIndex = squad.findIndex(
        (s, sIdx) => !usedSquadIndices.has(sIdx) && s.player,
      );

      if (anyIndex !== -1) {
        const found = squad[anyIndex];
        assignedPlayers.add(found.player!.name);
        usedSquadIndices.add(anyIndex);
        result[idx] = {
          ...item,
          slot: found,
        };
      }
    });

    return result;
  }, [coords, squad]);

  return (
    <div
      className={cn(
        'relative mx-auto w-full select-none flex flex-col items-center justify-center',
        className,
      )}
    >
      {/* ── THE PITCH BOARD CONTAINER ──────────────────────────── */}
      <div
        style={scale ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}
        className={cn(
          'relative aspect-[3/3.85] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#031c13] via-[#02140d] to-[#010b07] p-1.5 sm:p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.1)]',
          fillContainer
            ? 'max-w-full h-full'
            : compact
              ? 'max-w-[250px] sm:max-w-[295px]'
              : 'max-w-[275px] sm:max-w-[325px] md:max-w-[350px]',
        )}
      >
        {/* Subtle Pitch Grass Turf Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,transparent_75%)]" />

        {/* Specular White Field Markings (Center Circle, Penalty Boxes, Halfway Line) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Outer Border */}
          <div className="absolute inset-2 sm:inset-3 rounded-xl border border-white/[0.08]" />

          {/* Halfway Line */}
          <div className="absolute top-1/2 left-2 right-2 sm:left-3 sm:right-3 h-[1px] bg-white/[0.08]" />

          {/* Center Circle & Spot */}
          <div className="absolute top-1/2 left-1/2 h-16 w-16 sm:h-22 sm:w-22 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />

          {/* Top Penalty Box (Opponent Box) */}
          <div className="absolute top-2 sm:top-3 left-1/2 h-14 sm:h-18 w-32 sm:w-42 -translate-x-1/2 rounded-b-xl border-b border-x border-white/[0.08]" />
          <div className="absolute top-2 sm:top-3 left-1/2 h-6 sm:h-8 w-16 sm:w-20 -translate-x-1/2 rounded-b-lg border-b border-x border-white/[0.06]" />

          {/* Bottom Penalty Box (Our GK Box) */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 h-14 sm:h-18 w-32 sm:w-42 -translate-x-1/2 rounded-t-xl border-t border-x border-white/[0.08]" />
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 h-6 sm:h-8 w-16 sm:w-20 -translate-x-1/2 rounded-t-lg border-t border-x border-white/[0.06]" />
        </div>

        {/* ── SVG TACTICAL DASHED CONNECTION LINKS ───────────────── */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 5 }}>
          {links.map(([fromIdx, toIdx], lIdx) => {
            const coordFrom = coords[fromIdx];
            const coordTo = coords[toIdx];
            if (!coordFrom || !coordTo) return null;

            return (
              <line
                key={`link-${lIdx}`}
                x1={`${coordFrom.x}%`}
                y1={`${coordFrom.y}%`}
                x2={`${coordTo.x}%`}
                y2={`${coordTo.y}%`}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* ── PITCH FORMATION SLOTS ──────────────────────────────── */}
        {mappedSlots.map(({ slotIndex, expectedPos, slot }) => {
          const coord = coords[slotIndex];
          if (!coord) return null;

          const player = slot?.player;
          const hasPlayer = Boolean(player);
          const cost = slot?.cost;

          // Check if this slot is currently being auctioned
          const isTargetActive =
            !hasPlayer &&
            (activePosition === expectedPos ||
              (rounds && currentRound && rounds[currentRound - 1]?.position === expectedPos));

          const displayName = player ? formatDisplayName(player.name) : '';
          const tierStyle = player?.tier ? getTierStyle(player.tier) : null;

          return (
            <div
              key={`slot-${slotIndex}`}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center select-none"
            >
              {hasPlayer && player ? (
                /* ── SIGNED SLOT: AVATAR + NAME + PRICE PILL ─────── */
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => onSelectSlot?.(expectedPos, slotIndex)}
                  className="group relative flex flex-col items-center justify-between rounded-xl sm:rounded-2xl border border-white/20 bg-slate-950/90 p-1 shadow-[0_4px_16px_rgba(0,0,0,0.7)] backdrop-blur-xl w-[44px] h-[64px] sm:w-[54px] sm:h-[76px] transition-all hover:scale-105 cursor-pointer"
                  style={{
                    borderColor: tierStyle ? `${tierStyle.accent}60` : 'rgba(255,255,255,0.2)',
                    boxShadow: tierStyle ? `0 0 12px ${tierStyle.glow}` : undefined,
                  }}
                  title={`${player.name} (${expectedPos}) - ${cost !== undefined ? `$${cost}M` : player.rating ? `${player.rating} OVR` : ''}`}
                >
                  {/* Top Avatar Ring */}
                  <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20 bg-slate-900 shadow-sm mt-0.5">
                    <PlayerImage
                      imageUrl={player.imageUrl}
                      name={player.name}
                      tier={player.tier}
                      size={32}
                    />
                    {/* Position Mini-Badge */}
                    <span className="absolute bottom-0 right-0 rounded-full bg-slate-950/95 px-1 text-[5px] sm:text-[6px] font-black uppercase text-steel font-stats border border-white/20 leading-none">
                      {expectedPos}
                    </span>
                  </div>

                  {/* Player Name */}
                  <span className="font-card font-extrabold uppercase text-[7px] sm:text-[8.5px] text-white truncate max-w-full text-center leading-none tracking-tight px-0.5 drop-shadow-sm">
                    {displayName}
                  </span>

                  {/* Transfer Price Badge (or Rating if no price) */}
                  <div className="flex w-full items-center justify-center">
                    {cost !== undefined ? (
                      <span className="font-stats font-black text-lime bg-lime/15 border border-lime/40 px-1.5 py-[1px] rounded-full text-[6.5px] sm:text-[8px] leading-none shadow-[0_0_6px_rgba(149,232,16,0.3)]">
                        ${cost}M
                      </span>
                    ) : player.rating ? (
                      <span className="font-stats font-black text-amber-400 bg-amber-400/15 border border-amber-400/40 px-1.5 py-[1px] rounded-full text-[6.5px] sm:text-[8px] leading-none">
                        {player.rating}
                      </span>
                    ) : (
                      <span className="font-stats font-black text-steel bg-white/10 px-1 rounded text-[6px] leading-none">
                        <AppIcon icon={Check} size={8} weight="bold" />
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* ── EMPTY / ACTIVE TARGET SLOT (FROSTED SHIELD) ─── */
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectSlot?.(expectedPos, slotIndex)}
                  className={cn(
                    'group relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all w-[44px] h-[64px] sm:w-[54px] sm:h-[76px] select-none cursor-pointer',
                    isTargetActive
                      ? 'border-2 border-lime bg-lime/15 text-lime shadow-[0_0_20px_rgba(149,232,16,0.7),inset_0_1px_0_0_rgba(255,255,255,0.3)] scale-105 z-20 animate-pulse'
                      : 'border border-dashed border-white/15 bg-slate-950/60 text-steel hover:border-lime/50 hover:bg-slate-900/80 hover:text-white backdrop-blur-md z-10',
                  )}
                  title={isTargetActive ? `Current Target: ${expectedPos}` : `Empty ${expectedPos}`}
                >
                  {isTargetActive ? (
                    <div className="flex flex-col items-center gap-1 p-1 text-center">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-lime/25 text-lime animate-bounce border border-lime/50">
                        <AppIcon icon={Plus} size={14} weight="bold" />
                      </span>
                      <span className="text-[7.5px] sm:text-[9px] font-black tracking-wider text-lime uppercase drop-shadow-sm font-stats">
                        {expectedPos}
                      </span>
                      <span className="text-[5.5px] sm:text-[6.5px] font-black uppercase tracking-widest text-lime/80 leading-none">
                        LIVE
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-1 text-center">
                      <AppIcon
                        icon={Plus}
                        size={13}
                        weight="bold"
                        className="opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="text-[7px] sm:text-[8.5px] font-extrabold tracking-wider uppercase text-steel group-hover:text-lime transition-colors font-stats">
                        {expectedPos}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
