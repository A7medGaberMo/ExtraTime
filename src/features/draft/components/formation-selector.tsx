'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DRAFT_FORMATIONS } from '../types/draft';
import { sfx } from '@/lib/sfx';
import { Check } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

interface FormationSelectorProps {
  options: string[];
  selectedFormation: string | null;
  onSelectFormation: (formation: string) => void;
  loading?: boolean;
}

// Minimal breakdown of defense - midfield - attack for each formation
const FORMATION_BREAKDOWN: Record<string, string> = {
  '4-3-3': '4 DEF · 3 MID · 3 ATT',
  '4-2-3-1': '4 DEF · 5 MID · 1 ATT',
  '4-4-2': '4 DEF · 4 MID · 2 ATT',
  '3-5-2': '3 DEF · 5 MID · 2 ATT',
  '4-1-2-1-2': '4 DEF · 4 MID · 2 ATT',
};

export function FormationSelector({
  options,
  selectedFormation,
  onSelectFormation,
  loading = false,
}: FormationSelectorProps) {
  return (
    <section aria-label="Formation Selection" className="w-full max-w-xl mx-auto space-y-3.5 py-3 px-1 text-center">
      {/* Apple Minimal Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300 backdrop-blur-md">
          TACTICAL SHAPE
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
          Select Formation
        </h2>
      </div>

      {/* Apple Glass Cards */}
      <div className="flex gap-2.5 pt-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 -mx-1 px-1">
        {options.map((key) => {
          const info = DRAFT_FORMATIONS[key];
          if (!info) return null;
          const isSelected = selectedFormation === key;
          const breakdown = FORMATION_BREAKDOWN[key] || '11 Positions';
          const subLabel = info.label.split(' ')[1] || 'Tactical';

          return (
            <motion.button
              key={key}
              type="button"
              whileHover={loading ? undefined : { scale: 1.04, y: -2 }}
              whileTap={loading ? undefined : { scale: 0.96 }}
              disabled={loading}
              onClick={() => {
                sfx.lock();
                onSelectFormation(key);
              }}
              className={`btn-haptic relative flex flex-col items-center justify-between rounded-2xl p-3.5 text-center transition-all cursor-pointer select-none outline-none shrink-0 min-w-[6rem] flex-1 snap-center ${
                isSelected
                  ? 'border-2 border-cyan-400 bg-cyan-950/50 text-white shadow-[0_0_24px_rgba(0,240,255,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)] ring-1 ring-cyan-300'
                  : 'apple-glass-card text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-md">
                  <AppIcon icon={Check} size={10} weight="bold" />
                </span>
              )}

              <span dir="ltr" className="font-display text-xl font-black tracking-wide text-white whitespace-nowrap">
                {key}
              </span>

              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 pt-0.5">
                {subLabel}
              </span>

              <span className="text-[8.5px] sm:text-[9px] font-medium text-slate-400 pt-2 border-t border-white/8 w-full mt-2">
                {breakdown}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
