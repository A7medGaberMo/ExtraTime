'use client';

import React from 'react';
import { calculateLadderPoints } from '@/types/bank';
import { Flame, Vault, Check, Crown, Lightning } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

interface StreakLadderProps {
  currentStreak: number;
  unbankedPoints: number;
  bankedPoints?: number;
  lang?: 'ar' | 'en';
  variant?: 'horizontal' | 'vertical';
}

const LADDER_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function StreakLadder({
  currentStreak,
  unbankedPoints,
  bankedPoints = 0,
  lang = 'ar',
  variant = 'horizontal',
}: StreakLadderProps) {
  const isArabic = lang === 'ar';
  const nextStepPoints = calculateLadderPoints(currentStreak + 1);

  // ── VERTICAL VARIANT (DESKTOP SIDEBAR) ────────────────────────────────────
  if (variant === 'vertical') {
    const reversedSteps = [...LADDER_STEPS].reverse();
    return (
      <div className="w-full apple-glass-elevated rounded-3xl p-4 sm:p-5 shadow-[0_24px_50px_var(--et-shade-70),0_0_40px_var(--game-glow)] backdrop-blur-3xl flex flex-col gap-3 select-none border border-game-accent/30 bg-gradient-to-b from-surface/95 via-well/95 to-canvas/95 relative overflow-hidden">
        {/* Monaco Vault Gold Ambient Top Shimmer */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-game-accent to-transparent opacity-85" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-game-accent/25 to-game-accent-deep/20 border border-game-accent/40 flex items-center justify-center text-game-accent shadow-[0_0_16px_var(--game-glow)]">
              <AppIcon icon={Lightning} size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-black uppercase text-game-accent-light tracking-wider ${isArabic ? 'font-sans' : 'font-display'}`}>
                {isArabic ? 'سلم الجائزة الكبرى' : 'PRIZE LADDER'}
              </span>
              <span className="text-[10px] text-muted font-stats">
                {isArabic ? '12 سؤال متصاعد بمضاعفة 2x' : '12-Step Doubling Run'}
              </span>
            </div>
          </div>

          <span className="text-xs font-stats font-black text-game-accent bg-game-accent/15 px-2.5 py-1 rounded-xl border border-game-accent/30 tabular-nums shadow-[0_0_12px_var(--game-glow)]">
            x{currentStreak}/12
          </span>
        </div>

        {/* Vertical Ladder Track */}
        <div className="flex flex-col gap-1.5 py-1">
          {reversedSteps.map((step) => {
            const stepPoints = calculateLadderPoints(step);
            const isActive = currentStreak === step;
            const isPassed = currentStreak > step;
            const isJackpot = step === 12;

            let stepStyle = 'bg-white/[0.02] border-white/5 text-muted opacity-60';
            if (isActive) {
              stepStyle =
                'bg-gradient-to-r from-game-accent/35 via-game-accent-light/25 to-game-accent/35 border-game-accent text-white shadow-[0_0_24px_var(--game-glow)] scale-[1.02] z-10';
            } else if (isPassed) {
              stepStyle = 'bg-game-accent/10 border-game-accent/30 text-game-accent-light opacity-90';
            } else if (isJackpot) {
              stepStyle =
                'bg-gradient-to-r from-game-accent/15 via-game-accent-deep/10 to-game-accent/15 border-game-accent/40 text-game-accent shadow-[0_0_16px_var(--game-glow)]';
            }

            return (
              <div
                key={step}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all duration-200 ${stepStyle}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-stats font-bold tabular-nums">
                    {isPassed ? (
                      <AppIcon icon={Check} size={13} weight="bold" className="text-game-accent" />
                    ) : isJackpot ? (
                      <AppIcon icon={Crown} size={14} weight="fill" className="text-game-accent animate-pulse" />
                    ) : (
                      `#${step}`
                    )}
                  </span>
                  {isActive && (
                    <span className="inline-block w-2 h-2 rounded-full bg-game-accent animate-ping" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-stats font-black text-xs sm:text-sm tracking-wide tabular-nums ${
                      isActive ? 'text-white font-black' : isPassed ? 'text-game-accent-light' : isJackpot ? 'text-game-accent' : 'text-muted'
                    }`}
                  >
                    {stepPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-sans opacity-70">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Bottom Summary */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground flex items-center gap-1.5">
              <AppIcon icon={Flame} size={15} weight="fill" className="text-game-accent" />
              <span>{isArabic ? 'نقاط معلقة (في خطر):' : 'At-Risk Pot:'}</span>
            </span>
            <span className="font-stats font-black text-game-accent tabular-nums">
              +{unbankedPoints} pts
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground flex items-center gap-1.5">
              <AppIcon icon={Vault} size={15} weight="duotone" className="text-game-accent" />
              <span>{isArabic ? 'الرصيد المضمون:' : 'Banked Safe:'}</span>
            </span>
            <span className="font-stats font-black text-game-accent tabular-nums">
              {bankedPoints} pts
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── HORIZONTAL COMPACT VARIANT (MOBILE & RESPONSIVE DESKTOP) ──────────────
  return (
    <div className="w-full apple-glass-card rounded-2xl p-2 sm:p-2.5 border border-game-accent/25 bg-gradient-to-r from-surface/95 via-well/95 to-surface/95 shadow-lg backdrop-blur-2xl select-none relative overflow-hidden">
      {/* Monaco Gold Top Accent Shimmer */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-game-accent/60 to-transparent" />

      {/* Top Status Strip: Multiplier Badge + Next Reward */}
      <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
        {/* Left: Active Streak / Multiplier Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-black transition-all ${
              currentStreak > 0
                ? 'bg-game-accent/20 border border-game-accent/50 text-game-accent-light shadow-[0_0_14px_var(--game-glow)]'
                : 'bg-white/5 border border-white/10 text-muted'
            }`}
          >
            <AppIcon
              icon={Flame}
              size={13}
              weight={currentStreak > 0 ? 'fill' : 'bold'}
              className={currentStreak > 0 ? 'text-game-accent animate-pulse' : 'text-muted'}
            />
            <span className="font-stats font-black tracking-tight tabular-nums">
              x{currentStreak}
            </span>
            <span className="text-[10px] font-bold opacity-80">
              {isArabic ? 'متتالية' : 'Streak'}
            </span>
          </div>

          {unbankedPoints > 0 && (
            <span className="text-xs font-stats font-black text-game-accent tabular-nums flex items-center gap-1">
              <span>+{unbankedPoints}</span>
              <span className="text-[10px] font-sans opacity-80">pts</span>
            </span>
          )}
        </div>

        {/* Right: Next Step Reward Pill */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
          <span className="text-muted text-[10px] uppercase font-stats">{isArabic ? 'القادم:' : 'Next:'}</span>
          <span className="font-stats font-black text-game-accent tabular-nums">
            {currentStreak >= 12
              ? (isArabic ? 'الحد الأقصى' : 'MAX (JACKPOT)')
              : `+${nextStepPoints} pts`}
          </span>
        </div>
      </div>

      {/* ── 12 EQUALIZER BARS WITH TIER PROGRESSION ── */}
      <div className="w-full flex items-center gap-1 sm:gap-1.5 px-0.5">
        {LADDER_STEPS.map((step) => {
          const isActive = currentStreak === step;
          const isPassed = currentStreak > step;
          const isJackpot = step === 12;

          let barBg = 'bg-white/10 border-white/5';
          if (isActive) {
            barBg =
              'bg-gradient-to-t from-game-accent via-game-accent-light to-game-accent shadow-[0_0_16px_var(--game-glow)] border-game-accent-light scale-y-125 z-10';
          } else if (isPassed) {
            barBg =
              'bg-gradient-to-t from-game-accent/60 to-game-accent shadow-[0_0_8px_var(--game-glow)] border-game-accent/40';
          } else if (isJackpot) {
            barBg = 'bg-game-accent/20 border-game-accent/40';
          }

          return (
            <div
              key={step}
              title={`Step #${step}: ${calculateLadderPoints(step)} pts`}
              className="flex-1 flex flex-col items-center gap-0.5 group cursor-default"
            >
              <div
                className={`w-full h-2.5 sm:h-3 rounded-full border transition-all duration-200 ${barBg}`}
              />
            </div>
          );
        })}
      </div>

      {/* Milestone Indicators Under the Rail */}
      <div className="w-full flex items-center justify-between text-[9px] font-stats font-bold text-muted px-1 pt-1 opacity-75">
        <span>#1 (1pt)</span>
        <span>#4 (8pts)</span>
        <span>#8 (128pts)</span>
        <span className="text-game-accent font-black flex items-center gap-0.5">
          <AppIcon icon={Crown} size={10} weight="fill" />
          <span>#12 (2048)</span>
        </span>
      </div>
    </div>
  );
}
