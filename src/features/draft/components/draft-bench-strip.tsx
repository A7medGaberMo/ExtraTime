'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowsDownUp, Plus, Lightning } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { getTierStyle } from '@/lib/tier-styles';
import { sfx } from '@/lib/sfx';
import type { Tier } from '@/types/player';
import type { EnrichedBenchSlot } from '../types/draft';

interface DraftBenchStripProps {
  bench: EnrichedBenchSlot[];
  activeSlotIndex: number;
  selectedStarterSlotIndex: number | null;
  onSwapWithBench?: (benchIndex: number) => void;
  isSwappingPhase?: boolean;
}

export function DraftBenchStrip({
  bench,
  activeSlotIndex,
  selectedStarterSlotIndex,
  onSwapWithBench,
  isSwappingPhase = false,
}: DraftBenchStripProps) {
  const { t } = useI18n();
  const canSwap = isSwappingPhase && selectedStarterSlotIndex !== null;

  return (
    <div className="apple-glass-card w-full space-y-2 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xl border border-white/12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 shadow-sm">
            <AppIcon icon={Lightning} size={13} weight="fill" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {t('draft.superSubBench')}
          </span>
        </div>

        {canSwap && (
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-micro font-bold text-cyan-300 animate-pulse shadow-sm">
            {t('draft.tapBenchSwap')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
        {[0, 1, 2].map((idx) => {
          const slot = bench.find((b) => b.benchIndex === idx);
          const player = slot?.player;
          const isSlotActive = activeSlotIndex === 11 + idx;
          const tier = (player?.tier as Tier) || 'GOLD';
          const tierStyle = getTierStyle(tier);

          if (player) {
            return (
              <motion.div
                key={idx}
                role={canSwap ? 'button' : undefined}
                tabIndex={canSwap ? 0 : undefined}
                aria-label={canSwap ? `Swap selected starter with bench substitute ${player.name}` : `Bench substitute ${player.name}`}
                onKeyDown={(e) => {
                  if (canSwap && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    sfx.swap();
                    onSwapWithBench?.(idx);
                  }
                }}
                whileHover={canSwap ? { scale: 1.03 } : {}}
                whileTap={canSwap ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (canSwap) {
                    sfx.swap();
                    onSwapWithBench?.(idx);
                  }
                }}
                className={`btn-haptic relative flex items-center gap-2.5 rounded-xl sm:rounded-2xl border p-2 select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  canSwap
                    ? 'border-cyan-400 bg-cyan-950/40 hover:border-cyan-300 hover:bg-cyan-900/50 shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer ring-1 ring-cyan-400/50'
                    : 'border-white/10 bg-white/[0.04] shadow-sm'
                }`}
              >
                {/* Mini Token with luxury tier frame */}
                <div
                  className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl p-[1.5px] shadow-sm"
                  style={{ background: tierStyle.frame }}
                >
                  <div
                    className="flex h-full w-full flex-col items-center justify-center rounded-[10px]"
                    style={{ background: tierStyle.backdrop }}
                  >
                    <span className="font-stats text-micro sm:text-xs font-black text-white">
                      {player.rating || 80}
                    </span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400">
                      {player.position.split('/')[0]}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] sm:text-xs font-bold text-white leading-tight">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-1 text-micro text-slate-400">
                    <span className="truncate">{player.clubName || t('draft.freeAgent')}</span>
                  </div>
                </div>

                {canSwap && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-md">
                    <AppIcon icon={ArrowsDownUp} size={12} weight="bold" />
                  </span>
                )}
              </motion.div>
            );
          }

          return (
            <div
              key={idx}
              className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 select-none transition-all ${
                isSlotActive
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 animate-pulse shadow-[0_0_16px_rgba(0,240,255,0.3)]'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              }`}
            >
              {isSlotActive ? (
                <>
                  <AppIcon icon={Plus} size={14} weight="bold" />
                  <span className="text-micro font-bold">{t('draft.pickSub', { num: (idx + 1).toString() })}</span>
                </>
              ) : (
                <span className="text-micro font-medium">{t('draft.sub', { num: (idx + 1).toString() })}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
