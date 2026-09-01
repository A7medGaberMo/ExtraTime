'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Stack, Question } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerImage } from './player-image';
import { getTierStyle } from '@/lib/tier-styles';

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

/* ── Tier Priority (stronger players are placed first) ────── */
const TIER_PRIORITY: Record<string, number> = {
  ICON: 8,
  HERO: 7,
  ULTIMATE: 6,
  MASTER: 5,
  ELITE: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

/* ── Coordinates ───────────────────────────────────────────── */
type Coord = { pos: string; x: number; y: number };

const C11: Record<string, Coord[]> = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 12 },
    { pos: 'LB', x: 16, y: 28 },
    { pos: 'CB', x: 38, y: 26 },
    { pos: 'CB', x: 62, y: 26 },
    { pos: 'RB', x: 84, y: 28 },
    { pos: 'CDM', x: 50, y: 44 },
    { pos: 'CM', x: 32, y: 58 },
    { pos: 'CAM', x: 68, y: 58 },
    { pos: 'LW', x: 18, y: 82 },
    { pos: 'ST', x: 50, y: 86 },
    { pos: 'RW', x: 82, y: 82 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 12 },
    { pos: 'LB', x: 16, y: 28 },
    { pos: 'CB', x: 38, y: 26 },
    { pos: 'CB', x: 62, y: 26 },
    { pos: 'RB', x: 84, y: 28 },
    { pos: 'CDM', x: 36, y: 44 },
    { pos: 'CDM', x: 64, y: 44 },
    { pos: 'CAM', x: 50, y: 64 },
    { pos: 'LW', x: 20, y: 70 },
    { pos: 'RW', x: 80, y: 70 },
    { pos: 'ST', x: 50, y: 88 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 12 },
    { pos: 'CB', x: 24, y: 26 },
    { pos: 'CB', x: 50, y: 24 },
    { pos: 'CB', x: 76, y: 26 },
    { pos: 'LM', x: 14, y: 54 },
    { pos: 'RM', x: 86, y: 54 },
    { pos: 'CDM', x: 50, y: 42 },
    { pos: 'CM', x: 38, y: 50 },
    { pos: 'CM', x: 62, y: 50 },
    { pos: 'ST', x: 36, y: 84 },
    { pos: 'CF', x: 64, y: 84 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 12 },
    { pos: 'LB', x: 16, y: 28 },
    { pos: 'CB', x: 38, y: 26 },
    { pos: 'CB', x: 62, y: 26 },
    { pos: 'RB', x: 84, y: 28 },
    { pos: 'LW', x: 18, y: 56 },
    { pos: 'CM', x: 38, y: 54 },
    { pos: 'CM', x: 62, y: 54 },
    { pos: 'RW', x: 82, y: 56 },
    { pos: 'ST', x: 36, y: 86 },
    { pos: 'ST', x: 64, y: 86 },
  ],
};

const C5: Record<string, Coord[]> = {
  '1-2-1': [
    { pos: 'GK', x: 50, y: 14 },
    { pos: 'CB', x: 50, y: 36 },
    { pos: 'CM', x: 28, y: 58 },
    { pos: 'CAM', x: 72, y: 58 },
    { pos: 'ST', x: 50, y: 84 },
  ],
  '2-1-1': [
    { pos: 'GK', x: 50, y: 14 },
    { pos: 'CB', x: 32, y: 36 },
    { pos: 'CB', x: 68, y: 36 },
    { pos: 'CM', x: 50, y: 58 },
    { pos: 'ST', x: 50, y: 84 },
  ],
  '1-1-2': [
    { pos: 'GK', x: 50, y: 14 },
    { pos: 'CB', x: 50, y: 36 },
    { pos: 'CM', x: 50, y: 56 },
    { pos: 'ST', x: 34, y: 82 },
    { pos: 'CF', x: 66, y: 82 },
  ],
};

/* ── Close Match Groups for Position Alignment ───────────── */
const CLOSE_GROUPS: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM'],
  LM: ['LM', 'LW'],
  RM: ['RM', 'RW'],
  LW: ['LW', 'LM'],
  RW: ['RW', 'RM'],
  ST: ['ST', 'CF'],
  CF: ['CF', 'ST'],
};

/* ── Position Compatibility Rules ── */
const POSITION_VARIANTS: Partial<Record<string, string[]>> = {
  LB: ['LWB'],
  LWB: ['LB'],
  RB: ['RWB'],
  RWB: ['RB'],
  ST: ['CF'],
  CF: ['ST'],
  LW: ['LM'],
  LM: ['LW'],
  RW: ['RM'],
  RM: ['RW'],
  CM: ['CDM', 'CAM'],
  CDM: ['CM', 'CAM'],
  CAM: ['CM', 'CDM'],
};

export function normalizePosition(pos: string): string {
  return pos.trim().toUpperCase().split('/')[0];
}

export function isPosCompatible(playerPos: string, slotPos: string): boolean {
  const normP = normalizePosition(playerPos);
  const normS = normalizePosition(slotPos);

  if (normP === normS) return true;
  const allowed = POSITION_VARIANTS[normS];
  return Boolean(allowed?.includes(normP));
}

function findBestCoordinateIndex(
  targetPos: string,
  coords: Coord[],
  usedCoords: Set<number>,
): number {
  const normTarget = normalizePosition(targetPos);

  let found = coords.findIndex(
    (c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) === normTarget,
  );
  if (found !== -1) return found;

  const allowed = POSITION_VARIANTS[normTarget] || [];
  for (const fallback of allowed) {
    found = coords.findIndex(
      (c, idx) => !usedCoords.has(idx) && normalizePosition(c.pos) === fallback,
    );
    if (found !== -1) return found;
  }

  return -1;
}

/* ── Component ────────────────────────────────────────────── */
export function TacticalPitch({
  formation,
  matchSize,
  squad,
  rounds,
  currentRound,
  totalRounds = 11,
  title = 'Squad Lineup',
  badgeLabel,
  compact = false,
}: TacticalPitchProps) {
  const [is3DView, setIs3DView] = useState(!compact);

  const coordsMap = matchSize === 5 ? C5 : C11;
  const coords = coordsMap[formation] || coordsMap[matchSize === 5 ? '1-2-1' : '4-3-3'];
  const is5 = matchSize === 5;

  const isDraftMode = Boolean(rounds && currentRound !== undefined);

  // ── Mapping Logic ────────────────────────────────────────
  const { onField, substitutes } = useMemo(() => {
    const placedIndices = new Map<number, TacticalSquadSlot>();
    const assignedSquadSlotIdxs = new Set<number>();

    const sortedSquad = [...squad].map((slot, originalIdx) => ({
      slot,
      originalIdx,
      weight: TIER_PRIORITY[slot.player?.tier ?? ''] ?? 1,
    }));
    sortedSquad.sort((a, b) => {
      if (a.slot.isSub && !b.slot.isSub) return 1;
      if (!a.slot.isSub && b.slot.isSub) return -1;
      return b.weight - a.weight;
    });

    const takeForCoord = (slotPos: string): TacticalSquadSlot | null => {
      const normSlot = normalizePosition(slotPos);
      const pools = [normSlot];
      const variants = POSITION_VARIANTS[normSlot] || [];
      const close = CLOSE_GROUPS[normSlot] || [];
      const lookup = (pos: string) =>
        sortedSquad.findIndex(
          (item) =>
            !assignedSquadSlotIdxs.has(item.originalIdx) &&
            normalizePosition(item.slot.position) === pos,
        );

      for (const pos of [...pools, ...variants, ...close]) {
        const found = lookup(pos);
        if (found !== -1) {
          const item = sortedSquad[found];
          assignedSquadSlotIdxs.add(item.originalIdx);
          return item.slot;
        }
      }
      const fallback = sortedSquad.find((item) => !assignedSquadSlotIdxs.has(item.originalIdx));
      if (fallback) {
        assignedSquadSlotIdxs.add(fallback.originalIdx);
        return fallback.slot;
      }
      return null;
    };

    if (isDraftMode && rounds) {
      const roundToCoord = new Map<number, number>();
      const usedCoordsForRounds = new Set<number>();

      for (const round of rounds) {
        const coordIdx = findBestCoordinateIndex(round.position, coords, usedCoordsForRounds);
        if (coordIdx !== -1) {
          roundToCoord.set(round.roundNumber, coordIdx);
          usedCoordsForRounds.add(coordIdx);
        }
      }

      squad.forEach((slot, sIdx) => {
        if (!slot.roundNumber) return;
        const coordIdx = roundToCoord.get(slot.roundNumber);
        if (coordIdx !== undefined && coordIdx !== -1) {
          placedIndices.set(coordIdx, slot);
          assignedSquadSlotIdxs.add(sIdx);
        }
      });

      coords.forEach((coord, ci) => {
        if (placedIndices.has(ci)) return;
        const hasRound = Array.from(roundToCoord.values()).includes(ci);
        if (hasRound) return;
        const slot = takeForCoord(coord.pos);
        if (slot) placedIndices.set(ci, slot);
      });

      const onFieldData = coords.map((coord, ci) => {
        const slot = placedIndices.get(ci);
        const matchedRound = rounds.find((r) => roundToCoord.get(r.roundNumber) === ci);

        return {
          coord,
          slot: slot || null,
          isCurrentSlot: matchedRound?.roundNumber === currentRound,
          isFutureSlot: matchedRound ? matchedRound.roundNumber > (currentRound || 0) : false,
        };
      });

      const substitutesData = squad.filter((_, sIdx) => !assignedSquadSlotIdxs.has(sIdx));

      return { onField: onFieldData, substitutes: substitutesData };
    }

    coords.forEach((coord, ci) => {
      const slot = takeForCoord(coord.pos);
      if (slot) placedIndices.set(ci, slot);
    });

    const onFieldData = coords.map((coord, ci) => {
      const slot = placedIndices.get(ci);
      return {
        coord,
        slot: slot || null,
        isCurrentSlot: false,
        isFutureSlot: false,
      };
    });

    const substitutesData = squad.filter((_, sIdx) => !assignedSquadSlotIdxs.has(sIdx));

    return { onField: onFieldData, substitutes: substitutesData };
  }, [squad, rounds, currentRound, coords, isDraftMode]);

  return (
    <div
      className={`relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/12 bg-slate-950/90 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-2xl select-none ${compact ? 'p-2 sm:p-3' : 'p-3.5 sm:p-4 md:p-6'}`}
    >
      {/* Pitch Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/10 ${compact ? 'mb-2 pb-1.5' : 'mb-2.5 pb-2.5'}`}>
        <div className="flex items-center gap-2">
          <AppIcon icon={Shield} size={compact ? 16 : 18} weight="duotone" className="text-lime animate-pulse" />
          <h3 className={`font-black tracking-wider text-white uppercase font-display ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
            {title} — <span className="text-lime">{formation}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIs3DView(!is3DView)}
            className={`btn-haptic hover:border-lime/40 text-steel flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 font-black tracking-wider uppercase shadow-sm transition-all hover:text-white cursor-pointer backdrop-blur-xl ${compact ? 'px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px]' : 'px-3 py-1 text-[9px] sm:text-[10px]'}`}
          >
            <AppIcon icon={Stack} size={compact ? 12 : 14} weight="duotone" className="text-lime" />
            <span>{is3DView ? '3D Stadium' : '2D Pitch'}</span>
          </button>
          {badgeLabel && (
            <span className={`border-lime/30 bg-lime/10 text-lime rounded-full border font-black tracking-widest uppercase shadow-sm ${compact ? 'px-2 py-0.5 text-[8px] sm:text-[9px]' : 'px-2.5 py-1 text-[9px] sm:text-[10px]'}`}>
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stadium Pitch Container */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-b from-[#06200f] via-[#0b3319] to-[#04170b] shadow-[0_0_40px_rgba(0,0,0,0.7)]"
        style={{ paddingBottom: compact ? (is5 ? '64%' : '72%') : (is5 ? '82%' : '96%') }}
      >
        <div
          className={`absolute inset-0 transition-transform duration-700 ${is3DView ? 'origin-bottom [transform:perspective(800px)_rotateX(20deg)_scale(0.95)] transform' : ''}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_36px)] opacity-15" />

          <svg
            className="absolute inset-0 h-full w-full fill-none stroke-white/20 stroke-[1.2]"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
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
            const tierColor = player?.tier ? getTierStyle(player.tier).highlight : '#95E810';
            const nodeSize = compact ? (is5 ? 36 : 30) : (is5 ? 46 : 38);
            const emptySize = compact ? (is5 ? 32 : 26) : (is5 ? 42 : 34);

            return (
              <motion.div
                key={`${coord.pos}-${idx}`}
                className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${coord.x}%`, top: `${100 - coord.y}%` }}
                initial={{ y: 15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.4, ease: 'easeOut' }}
              >
                <AnimatePresence mode="wait">
                  {hasPlayer && player ? (
                    <motion.div
                      key="filled"
                      className="flex flex-col items-center"
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    >
                      <div
                        className="relative flex items-center justify-center rounded-xl border-2 bg-slate-950 shadow-lg"
                        style={{
                          width: nodeSize,
                          height: nodeSize,
                          borderColor: tierColor,
                          boxShadow: `0 0 16px ${tierColor}45`,
                        }}
                      >
                        <PlayerImage
                          src={player.imageUrl}
                          alt={player.name}
                          name={player.name}
                          className="rounded-[10px]"
                          imgClassName="rounded-[10px]"
                          fallbackClassName="rounded-[10px]"
                        />

                        {/* Position indicator */}
                        <span
                          className="py-0.2 absolute -top-1.5 -left-1.5 rounded border px-1.5 text-[7px] font-black uppercase shadow-md"
                          style={{
                            backgroundColor: '#090d16',
                            color: tierColor,
                            borderColor: `${tierColor}80`,
                          }}
                        >
                          {slot?.position || coord.pos}
                        </span>

                        {/* Sub badge indicator */}
                        {slot?.isSub && (
                          <span className="absolute -top-1.5 -right-1.5 rounded border border-amber-300 bg-amber-500 px-1 text-[6px] font-black text-slate-950 uppercase">
                            SUB
                          </span>
                        )}
                      </div>

                      {/* Name & price badge */}
                      <div
                        className="mt-0.5 flex max-w-[70px] items-center gap-0.5 truncate rounded border px-1 py-0.5 text-center text-[7px] font-black uppercase backdrop-blur-md sm:max-w-[85px] sm:text-[8px]"
                        style={{
                          backgroundColor: 'rgba(9,13,22,0.92)',
                          borderColor: `${tierColor}40`,
                          color: '#fff',
                        }}
                      >
                        <span className="truncate">{player.name?.split(' ').pop()}</span>
                        {slot?.cost !== undefined && slot.cost > 0 && (
                          <span className="text-lime shrink-0 text-[7px] font-stats">${slot.cost}M</span>
                        )}
                      </div>
                    </motion.div>
                  ) : isCurrentSlot ? (
                    <motion.div
                      key="active"
                      className="flex flex-col items-center"
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <div
                        className="border-lime bg-lime/10 animate-active-ring flex animate-pulse items-center justify-center rounded-xl border-2 border-dashed"
                        style={{ width: nodeSize, height: nodeSize }}
                      >
                        <span className="text-lime text-[9px] font-black uppercase sm:text-xs">
                          {coord.pos}
                        </span>
                      </div>
                      <div className="py-0.2 text-lime bg-lime/10 border-lime/40 mt-0.5 rounded border px-1 text-[6px] font-black uppercase">
                        BIDDING
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFutureSlot ? 0.35 : 0.6 }}
                    >
                      <div
                        className="flex animate-pulse items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/40"
                        style={{ width: emptySize, height: emptySize }}
                      >
                        <span className="text-steel/60 text-[8px] font-black uppercase sm:text-[9px]">
                          {coord.pos}
                        </span>
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
        <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-slate-900/60 p-3">
          <h4 className="text-steel flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase sm:text-[10px]">
            <AppIcon icon={Question} size={14} weight="duotone" className="text-amber-500" />
            Substitutes & Backups ({substitutes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {substitutes.map((sub, sIdx) => {
              const subTierColor = sub.player?.tier
                ? getTierStyle(sub.player.tier).highlight
                : '#95E810';
              return (
                <div
                  key={sIdx}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/80 p-1.5 shadow-sm"
                  style={{ borderColor: `${subTierColor}30` }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border bg-slate-900"
                    style={{ borderColor: subTierColor }}
                  >
                    <PlayerImage
                      src={sub.player?.imageUrl}
                      alt={sub.player?.name}
                      name={sub.player?.name}
                      className="rounded"
                      imgClassName="rounded"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col pe-1">
                    <span className="max-w-[80px] truncate text-[9px] leading-tight font-black text-white">
                      {sub.player?.name?.split(' ').pop()}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-steel rounded bg-white/5 px-1 text-[7px] font-bold uppercase">
                        {sub.position}
                      </span>
                      {sub.cost !== undefined && sub.cost > 0 && (
                        <span className="text-lime text-[7px] font-black font-stats">${sub.cost}M</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/60 px-2 py-1.5 text-[9px] font-black tracking-widest uppercase sm:text-[10px]">
        <span className="text-steel">
          <span className="text-lime">{formation}</span> Scheme
        </span>
        <span className="text-steel font-stats">
          <span className="text-white">{squad.filter((s) => s.player).length}</span>/{totalRounds}{' '}
          Signed
        </span>
      </div>
    </div>
  );
}
