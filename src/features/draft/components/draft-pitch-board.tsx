'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AppIcon } from '@/components/ui/app-icon';
import { Plus, ArrowsClockwise, Lightning } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { MiniPitchCard } from './mini-pitch-card';
import {
  FORMATION_LINKS,
  calculateLinkStrength,
  getLinkStyle,
  type PlayerLinkData,
} from '../lib/formation-links';
import type { EnrichedStarterSlot } from '../types/draft';

interface DraftPitchBoardProps {
  formation: string;
  starters: EnrichedStarterSlot[];
  activeSlotIndex: number;
  selectedSlotIndex: number | null;
  onSelectSlot?: (slotIndex: number) => void;
  onSwapStarters?: (slotIndexA: number, slotIndexB: number) => void;
  onSelectTargetSlot?: (slotIndex: number) => void;
  isSwappingPhase?: boolean;
  isDraftingPhase?: boolean;
}

interface Coord {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

// Tuned coordinate mappings per formation (11 positions) with mobile breathing room
const FORMATION_COORDS: Record<string, Coord[]> = {
  '4-3-3': [
    { x: 50, y: 13 }, // ST (Slot 0)
    { x: 18, y: 20 }, // LW
    { x: 82, y: 20 }, // RW
    { x: 50, y: 35 }, // CAM
    { x: 28, y: 50 }, // CM (L)
    { x: 72, y: 50 }, // CM (R)
    { x: 16, y: 68 }, // LB
    { x: 37, y: 70 }, // CB (L)
    { x: 63, y: 70 }, // CB (R)
    { x: 84, y: 68 }, // RB
    { x: 50, y: 87 }, // GK
  ],
  '4-2-3-1': [
    { x: 50, y: 13 }, // ST
    { x: 50, y: 33 }, // CAM
    { x: 18, y: 35 }, // LM
    { x: 82, y: 35 }, // RM
    { x: 33, y: 51 }, // CDM (L)
    { x: 67, y: 51 }, // CDM (R)
    { x: 16, y: 68 }, // LB
    { x: 37, y: 70 }, // CB (L)
    { x: 63, y: 70 }, // CB (R)
    { x: 84, y: 68 }, // RB
    { x: 50, y: 87 }, // GK
  ],
  '4-4-2': [
    { x: 35, y: 13 }, // ST (L)
    { x: 65, y: 13 }, // CF (R)
    { x: 17, y: 38 }, // LM
    { x: 83, y: 38 }, // RM
    { x: 37, y: 49 }, // CM (L)
    { x: 63, y: 49 }, // CM (R)
    { x: 16, y: 68 }, // LB
    { x: 37, y: 70 }, // CB (L)
    { x: 63, y: 70 }, // CB (R)
    { x: 84, y: 68 }, // RB
    { x: 50, y: 87 }, // GK
  ],
  '3-5-2': [
    { x: 35, y: 13 }, // ST (L)
    { x: 65, y: 13 }, // ST (R)
    { x: 50, y: 32 }, // CAM
    { x: 16, y: 45 }, // LM
    { x: 84, y: 45 }, // RM
    { x: 36, y: 53 }, // CDM
    { x: 64, y: 53 }, // CM
    { x: 24, y: 70 }, // CB (L)
    { x: 50, y: 70 }, // CB (C)
    { x: 76, y: 70 }, // CB (R)
    { x: 50, y: 87 }, // GK
  ],
  '4-1-2-1-2': [
    { x: 35, y: 13 }, // ST (L)
    { x: 65, y: 13 }, // CF (R)
    { x: 50, y: 31 }, // CAM
    { x: 24, y: 46 }, // CM (L)
    { x: 76, y: 46 }, // CM (R)
    { x: 50, y: 59 }, // CDM
    { x: 16, y: 68 }, // LB
    { x: 37, y: 71 }, // CB (L)
    { x: 63, y: 71 }, // CB (R)
    { x: 84, y: 68 }, // RB
    { x: 50, y: 87 }, // GK
  ],
};

export function DraftPitchBoard({
  formation,
  starters,
  activeSlotIndex,
  selectedSlotIndex,
  onSelectSlot,
  onSwapStarters,
  onSelectTargetSlot,
  isSwappingPhase = false,
  isDraftingPhase = false,
}: DraftPitchBoardProps) {
  const { t } = useI18n();
  const coords = FORMATION_COORDS[formation] || FORMATION_COORDS['4-3-3'];
  const links = FORMATION_LINKS[formation] || [];

  const handleSlotClick = (idx: number, hasPlayer: boolean) => {
    if (hasPlayer) {
      if (isSwappingPhase) {
        if (selectedSlotIndex === null) {
          onSelectSlot?.(idx);
        } else if (selectedSlotIndex === idx) {
          onSelectSlot?.(idx);
        } else {
          onSwapStarters?.(selectedSlotIndex, idx);
        }
      } else {
        // Outside swapping phase, toggle selection
        onSelectSlot?.(idx);
      }
    } else {
      // Empty slot clicked during drafting: allow free position choice!
      if (isDraftingPhase) {
        onSelectTargetSlot?.(idx);
      }
    }
  };

  return (
    <div className="apple-glass-card relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex flex-col justify-between border border-white/15">
      {/* Pitch Stadium Container - strictly bounded by available height to guarantee zero scroll */}
      <div className="relative aspect-[3/3.8] min-h-0 flex-1 w-auto max-w-full rounded-xl sm:rounded-2xl border border-white/12 bg-gradient-to-b from-[#03130A] via-[#072414] to-[#03130A] overflow-hidden shadow-inner mx-auto">
        {/* Apple Dynamic Stadium Floodlight Ambient Glows */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-80 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-44 w-80 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-52 w-52 rounded-full bg-cyan-400/8 blur-3xl" />

        {/* Pitch Lines (Laser-Etched Specular White) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Outer Border */}
          <div className="absolute inset-2 sm:inset-3 rounded-xl border border-white/[0.11]" />

          {/* Halfway line */}
          <div className="absolute top-1/2 left-2 right-2 sm:left-3 sm:right-3 h-[1px] bg-white/[0.11]" />

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 h-20 w-20 sm:h-28 sm:w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.11]" />
          <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />

          {/* Top penalty area (Opponent Box) */}
          <div className="absolute top-2 sm:top-3 left-1/2 h-16 sm:h-22 w-36 sm:w-48 -translate-x-1/2 rounded-b-xl border-b border-x border-white/[0.1]" />
          <div className="absolute top-2 sm:top-3 left-1/2 h-7 sm:h-10 w-18 sm:w-24 -translate-x-1/2 rounded-b-lg border-b border-x border-white/[0.08]" />

          {/* Bottom penalty area (Our GK Box) */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 h-16 sm:h-22 w-36 sm:w-48 -translate-x-1/2 rounded-t-xl border-t border-x border-white/[0.1]" />
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 h-7 sm:h-10 w-18 sm:w-24 -translate-x-1/2 rounded-t-lg border-t border-x border-white/[0.08]" />
        </div>

        {/* ── SVG CHEMISTRY LINKS LAYER ────────────────────────── */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 5 }}
        >
          <defs>
            <filter id="linkGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.8" />
            </filter>
            <filter id="linkGlowAmber" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.7" />
            </filter>
          </defs>

          {links.map((link, lIdx) => {
            const coordFrom = coords[link.from];
            const coordTo = coords[link.to];
            if (!coordFrom || !coordTo) return null;

            const slotFrom = starters.find((s) => s.slotIndex === link.from);
            const slotTo = starters.find((s) => s.slotIndex === link.to);

            const playerFrom: PlayerLinkData | null = slotFrom?.player
              ? {
                  tier: slotFrom.player.tier,
                  clubName: slotFrom.player.clubName,
                  league: slotFrom.player.league,
                  nationName: slotFrom.player.nationName,
                }
              : null;

            const playerTo: PlayerLinkData | null = slotTo?.player
              ? {
                  tier: slotTo.player.tier,
                  clubName: slotTo.player.clubName,
                  league: slotTo.player.league,
                  nationName: slotTo.player.nationName,
                }
              : null;

            const strength = calculateLinkStrength(playerFrom, playerTo);
            const style = getLinkStyle(strength);

            return (
              <line
                key={`link-${lIdx}`}
                x1={`${coordFrom.x}%`}
                y1={`${coordFrom.y}%`}
                x2={`${coordTo.x}%`}
                y2={`${coordTo.y}%`}
                stroke={style.color}
                strokeWidth={style.width}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                filter={
                  strength === 'perfect' || strength === 'strong'
                    ? 'url(#linkGlow)'
                    : strength === 'weak'
                      ? 'url(#linkGlowAmber)'
                      : undefined
                }
                className="transition-all duration-500 opacity-95"
              />
            );
          })}
        </svg>

        {/* ── 11 PITCH SLOTS (Filled Mini Cards & Empty Glass Docking Bays) ── */}
        {coords.map((coord, idx) => {
          const slot = starters.find((s) => s.slotIndex === idx);
          const isSlotActive = activeSlotIndex === idx;
          const isSlotSelected = selectedSlotIndex === idx;
          const isSwapTarget =
            selectedSlotIndex !== null && selectedSlotIndex !== idx && Boolean(slot?.player);
          const hasPlayer = Boolean(slot?.player);

          return (
            <div
              key={idx}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
            >
              {hasPlayer && slot ? (
                /* ── FILLED STARTER MINI CARD ────────────────────── */
                <MiniPitchCard
                  slot={slot}
                  isSelected={isSlotSelected}
                  isSwapCandidate={isSwapTarget}
                  onClick={() => handleSlotClick(idx, true)}
                />
              ) : (
                /* ── UNFILLED CLICKABLE TARGET SLOT (Apple Glass Docking Bay) ── */
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSlotClick(idx, false)}
                  aria-label={`Draft slot for position ${slot?.position || 'POS'}`}
                  className={`btn-haptic group relative flex flex-col items-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl transition-all ${
                    isSlotActive ? 'scale-105 z-20' : 'opacity-90 hover:opacity-100 z-10'
                  }`}
                  title={`Tap to draft ${slot?.position || 'POS'}`}
                >
                  {/* Apple Glass Docking Bay */}
                  <div
                    className={`relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all w-[46px] h-[70px] sm:w-[56px] sm:h-[84px] md:w-[62px] md:h-[94px] ${
                      isSlotActive
                        ? 'border-2 border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_24px_rgba(0,240,255,0.7),inset_0_1px_0_0_rgba(255,255,255,0.35)] ring-1 ring-cyan-300'
                        : 'border border-white/15 bg-white/[0.05] text-slate-400 hover:border-cyan-400/60 hover:bg-white/[0.1] hover:text-white backdrop-blur-md shadow-inner'
                    }`}
                  >
                    {isSlotActive ? (
                      <div className="flex flex-col items-center gap-1.5 p-1">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 animate-pulse border border-cyan-400/40 shadow-sm">
                          <AppIcon icon={Plus} size={16} weight="bold" />
                        </span>
                        <span className="text-[8.5px] sm:text-[10px] font-black tracking-wider text-cyan-300 uppercase drop-shadow-sm">
                          {slot?.position || 'POS'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 p-1">
                        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30 transition-all">
                          <AppIcon icon={Plus} size={14} weight="bold" className="opacity-70 group-hover:opacity-100 group-hover:text-cyan-300 transition-opacity" />
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight uppercase text-slate-400 group-hover:text-cyan-300 transition-colors">
                          {slot?.position || 'POS'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER STATUS / INSTRUCTIONS PILL ───────────────────── */}
      <footer className="mt-1 flex items-center justify-between gap-1.5 sm:gap-2 px-1 text-micro text-slate-400 shrink-0 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-950/60 px-2.5 py-0.5 text-micro font-black tracking-wider text-cyan-300 whitespace-nowrap shrink-0 shadow-sm">
            {formation}
          </span>
          <span className="hidden sm:inline text-white/15">|</span>
          <span className="hidden sm:inline text-slate-400 font-medium whitespace-nowrap">{t('draft.startingXI')}</span>
        </div>

        {isSwappingPhase ? (
          <div className="flex items-center gap-1.5 font-bold text-cyan-400 animate-pulse truncate min-w-0 text-[10px] sm:text-xs">
            <AppIcon icon={ArrowsClockwise} size={13} weight="bold" className="shrink-0" />
            <span className="truncate">
              {selectedSlotIndex !== null
                ? t('draft.tapOtherSwap')
                : t('draft.tapToSwap')}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium truncate min-w-0 text-[10px] sm:text-xs">
            <AppIcon icon={Lightning} size={12} weight="fill" className="shrink-0" />
            <span className="truncate">{t('draft.tapEmptySlot')}</span>
          </span>
        )}
      </footer>
    </div>
  );
}
