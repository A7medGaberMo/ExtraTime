'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FastForward, Vault } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { sfx } from '@/lib/sfx';

interface BankActionControlsProps {
  unbankedPoints: number;
  currentStreak: number;
  canBank?: boolean;
  isSprintComplete?: boolean;
  onBank: () => void;
  onPass: () => void;
  isBanking?: boolean;
  isPassing?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
  lang: 'ar' | 'en';
}

export function BankActionControls({
  unbankedPoints,
  canBank,
  isSprintComplete = false,
  onBank,
  onPass,
  isBanking = false,
  isPassing = false,
  isSubmitting = false,
  disabled = false,
  lang,
}: BankActionControlsProps) {
  const isArabic = lang === 'ar';
  const resolvedCanBank = canBank !== undefined ? canBank : (unbankedPoints > 0 || isSprintComplete);
  const isAnyBusy = disabled || isSubmitting || isBanking || isPassing;

  const handleBankClick = React.useCallback(() => {
    if (!resolvedCanBank || isAnyBusy) return;
    sfx.tap();
    sfx.haptic('medium');
    onBank();
  }, [resolvedCanBank, isAnyBusy, onBank]);

  const handlePassClick = React.useCallback(() => {
    if (isAnyBusy || isSprintComplete) return;
    sfx.tap();
    sfx.haptic('warning');
    onPass();
  }, [isAnyBusy, isSprintComplete, onPass]);

  // Keyboard shortcut listener: Space or 'B' to Bank, 'P' to Pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea or action is in-flight
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isAnyBusy
      ) {
        return;
      }

      if ((e.code === 'Space' || e.key.toLowerCase() === 'b') && resolvedCanBank) {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        handleBankClick();
      } else if (e.key.toLowerCase() === 'p' && !isSprintComplete) {
        e.preventDefault();
        handlePassClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolvedCanBank, isAnyBusy, isSprintComplete, handleBankClick, handlePassClick]);

  return (
    <div className="w-full flex flex-col gap-1 sm:gap-1.5 shrink-0 select-none">
      <div className="w-full flex items-center gap-2 sm:gap-3">
        {/* 🏦 Prominent Monaco 24K Gold BANK Button */}
        <Button
          type="button"
          size="lg"
          variant={resolvedCanBank ? 'gold' : 'secondary'}
          disabled={!resolvedCanBank || isAnyBusy}
          loading={isBanking}
          onClick={handleBankClick}
          className={`flex-1 min-h-[46px] sm:min-h-[50px] text-xs sm:text-base font-black tracking-wide relative overflow-hidden transition-all duration-200 rounded-xl sm:rounded-2xl ${
            resolvedCanBank
              ? isSprintComplete
                ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-slate-950 font-black shadow-[0_0_35px_rgba(245,158,11,0.65)] ring-2 ring-amber-300 animate-pulse scale-[1.02] border-none'
                : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-[0_4px_24px_rgba(245,158,11,0.4)] scale-[1.01] hover:brightness-110 active:scale-[0.99] border-none'
              : 'opacity-50 bg-white/[0.04] border border-white/10 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AppIcon
              icon={Vault}
              size={20}
              weight="duotone"
              className={resolvedCanBank ? 'text-slate-950 animate-pulse' : 'text-slate-500'}
            />

            <span className={isArabic ? 'font-sans font-black' : 'font-display font-black'}>
              {isSprintComplete
                ? isArabic
                  ? 'بَنِّك نقاطك الآن!'
                  : 'LOCK IN BANKED POINTS!'
                : isArabic
                  ? 'بَنِّك'
                  : 'BANK'}
              {resolvedCanBank && unbankedPoints > 0 ? (
                <span className="font-stats font-black tabular-nums"> (+{unbankedPoints})</span>
              ) : ''}
            </span>

            {resolvedCanBank && (
              <span className="hidden sm:inline text-[9px] uppercase font-bold opacity-80 bg-slate-950/20 px-1.5 py-0.5 rounded-md font-stats">
                Space / B
              </span>
            )}
          </div>
        </Button>

        {/* ⏭️ PASS Button (hidden or disabled if sprint is complete) */}
        {!isSprintComplete && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={isAnyBusy}
            loading={isPassing}
            onClick={handlePassClick}
            className="min-w-[84px] sm:min-w-[110px] min-h-[46px] sm:min-h-[50px] text-xs sm:text-sm font-bold text-slate-300 border-white/15 hover:border-white/30 hover:bg-white/10 hover:text-white rounded-xl sm:rounded-2xl transition-all shadow-sm"
          >
            <div className="flex items-center justify-center gap-1.5">
              <AppIcon icon={FastForward} size={16} weight="bold" />
              <span className={isArabic ? 'font-sans' : 'font-display'}>{isArabic ? 'تخطي' : 'Pass'}</span>
            </div>
          </Button>
        )}
      </div>

      {/* Zero CLS (Cumulative Layout Shift) Stable Hint Slot */}
      <div className="h-5 sm:h-6 flex items-center justify-center text-center text-[10px] sm:text-[11px] font-bold leading-none select-none">
        {resolvedCanBank ? (
          <span className="text-amber-300/90 animate-fade-in flex items-center gap-1">
            <span>
              {isSprintComplete
                ? isArabic
                  ? '⚡ تم حفظ نقاطك تلقائياً في رصيدك النهائي!'
                  : '⚡ All points auto-banked into your safe score!'
                : isArabic
                  ? '💡 دوس بَنِّك لتأمين النقاط المعلقة قبل ما تجاوب أو تخاطر!'
                  : '💡 Tap BANK to lock your points into your safe score!'}
            </span>
          </span>
        ) : (
          <span className="text-slate-500/70 text-[10px] font-medium hidden sm:inline">
            {isArabic
              ? 'جاوب صح لمضاعفة النقاط، أو بَنِّك لحمايتها'
              : 'Answer correctly to double points, or BANK to secure them'}
          </span>
        )}
      </div>
    </div>
  );
}
