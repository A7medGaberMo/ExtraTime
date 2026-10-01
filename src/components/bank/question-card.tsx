'use client';

import React, { useMemo } from 'react';
import { BankQuestionOption } from '@/types/bank';
import { CheckCircle, XCircle, Question, Tag, Check, X } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

interface QuestionCardProps {
  questionText: { en: string; ar: string };
  options: BankQuestionOption[];
  type: 'mcq' | 'tf';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  lang: 'ar' | 'en';
  onSelectOption?: (optionId: string) => void;
  selectedOptionId?: string | null;
  correctOptionId?: string | null; // provided in spectator or post-answer reveal
  disabled?: boolean;
  isSpectating?: boolean;
}

export function QuestionCard({
  questionText,
  options,
  type,
  category,
  lang,
  onSelectOption,
  selectedOptionId,
  correctOptionId,
  disabled = false,
  isSpectating = false,
}: QuestionCardProps) {
  const isArabic = lang === 'ar';
  const categoryLabel = (category ?? 'football').replace(/_/g, ' ').toUpperCase();
  const isTF = type === 'tf';

  // Dynamic font sizing: scales smoothly for any length so questions never overflow or alter card size
  const activeText = questionText[lang] || questionText.en || '';
  const questionFontSize = useMemo(() => {
    const len = activeText.length;
    if (len > 120) return 'text-[11px] sm:text-xs font-semibold leading-snug';
    if (len > 70) return 'text-xs sm:text-sm font-semibold leading-snug';
    if (len > 35) return 'text-sm sm:text-base font-bold leading-snug';
    return 'text-base sm:text-lg font-black leading-snug';
  }, [activeText]);

  return (
    <div className="w-full max-w-md mx-auto h-[290px] min-h-[290px] max-h-[290px] sm:h-[300px] sm:min-h-[300px] sm:max-h-[300px] apple-glass-elevated rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-[0_16px_36px_var(--et-shade-60)] backdrop-blur-3xl relative overflow-hidden border border-game-accent/25 bg-gradient-to-b from-surface/95 via-well/95 to-canvas/95 select-none flex flex-col justify-between shrink-0 transition-all duration-200">
      {/* Monaco Vault Gold Ambient Top Shimmer */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-game-accent/50 to-transparent" />

      {/* ── TOP SECTION: Category & Type Header + Fixed Question Text Window ── */}
      <div className="w-full flex flex-col shrink-0">
        {/* Luxury Vault Header */}
        <div className="flex items-center justify-between gap-2 h-6 sm:h-7 mb-1 sm:mb-1.5">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-game-accent bg-game-accent/10 border border-game-accent/25 px-2.5 py-0.5 rounded-full shadow-[inset_0_1px_0_var(--game-glow)] h-6 sm:h-7">
            <AppIcon icon={Tag} size={12} weight="bold" className="text-game-accent shrink-0" />
            <span className="tracking-wide uppercase font-stats truncate max-w-[140px] sm:max-w-none">
              {categoryLabel}
            </span>
          </div>

          {/* Right: Spectator Pill (if spectating) + Question Type Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isSpectating && (
              <span className="text-[10px] font-bold text-game-accent bg-game-accent/10 border border-game-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1 h-6 sm:h-7">
                <AppIcon icon={Question} size={11} weight="duotone" />
                <span className="hidden xs:inline">{isArabic ? 'المنافس يختار...' : 'Opponent answering...'}</span>
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] font-bold text-muted bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-stats shrink-0 h-6 sm:h-7 flex items-center">
              {isTF ? (isArabic ? 'صح أو خطأ' : 'True / False') : isArabic ? '4 اختيارات' : '4 Choices'}
            </span>
          </div>
        </div>

        {/* Unified Constant Height Question Text Window — ZERO VERTICAL BOUNCING */}
        <div className="w-full h-[86px] sm:h-[92px] flex items-center justify-center px-3 sm:px-4 text-center overflow-y-auto scrollbar-hidden">
          <h2
            className={`text-white text-center tracking-tight ${questionFontSize} ${
              isArabic ? 'font-sans' : 'font-display'
            }`}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {activeText}
          </h2>
        </div>
      </div>

      {/* ── BOTTOM SECTION: UNIFIED OPTIONS GRID (EXACT SAME BOUNDING BOX & HEIGHT) ── */}
      <div className="w-full h-[126px] sm:h-[132px] flex items-center justify-center shrink-0">
        {isTF ? (
          /* ── TRUE / FALSE: 2 UNIFIED LUXURY CARDS (STACKED 2-ROWS TO MATCH MCQ HEIGHT EXACTLY!) ── */
          <div className="w-full grid grid-cols-1 gap-2">
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = Boolean(correctOptionId && correctOptionId === opt.id);
              const isWrong = Boolean(
                isSelected && !isCorrect && correctOptionId !== null && correctOptionId !== undefined
              );

              const isTrueOpt = opt.id === 'true' || opt.text.en.toLowerCase() === 'true';

              let cardStyle = isTrueOpt
                ? 'bg-success/[0.08] border-success/25 hover:bg-success/15 text-success'
                : 'bg-danger/[0.08] border-danger/25 hover:bg-danger/15 text-danger';

              if (isCorrect) {
                cardStyle =
                  'border-success bg-success/30 text-success shadow-[0_0_24px_var(--et-success-glow)] scale-[1.01]';
              } else if (isWrong) {
                cardStyle =
                  'border-danger bg-danger/30 text-danger shadow-[0_0_24px_var(--et-danger-glow)] animate-shake';
              } else if (isSelected) {
                cardStyle =
                  'border-game-accent bg-game-accent/25 text-game-accent-light shadow-[0_0_20px_var(--game-glow)] scale-[1.01]';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectOption?.(opt.id)}
                  className={`w-full h-[58px] min-h-[58px] max-h-[58px] sm:h-[60px] sm:min-h-[60px] sm:max-h-[60px] px-2.5 sm:px-3 py-1 rounded-xl sm:rounded-2xl border flex items-center justify-between gap-2 transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed ${cardStyle}`}
                >
                  {/* Start Badge */}
                  <span
                    className={`w-7 h-7 min-w-[28px] max-w-[28px] rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                      isCorrect
                        ? 'bg-success text-canvas'
                        : isWrong
                          ? 'bg-danger text-white'
                          : isSelected
                            ? 'bg-game-accent text-game-on-accent'
                            : isTrueOpt
                              ? 'bg-success/20 text-success border border-success/40'
                              : 'bg-danger/20 text-danger border border-danger/40'
                    }`}
                  >
                    {isTrueOpt ? (
                      <AppIcon icon={Check} size={16} weight="bold" />
                    ) : (
                      <AppIcon icon={X} size={16} weight="bold" />
                    )}
                  </span>

                  {/* Balanced Symmetrical Label */}
                  <span className="text-xs sm:text-sm font-black tracking-wide flex-1 text-center px-1 truncate">
                    {opt.text[lang] || opt.text.en}
                  </span>

                  {/* Balanced End Slot — Same 28px width as Start Badge for 100% symmetric RL padding */}
                  <div className="w-7 h-7 min-w-[28px] max-w-[28px] flex items-center justify-center shrink-0">
                    {isCorrect && (
                      <AppIcon
                        icon={CheckCircle}
                        size={18}
                        weight="fill"
                        className="text-success animate-scale-in"
                      />
                    )}
                    {isWrong && (
                      <AppIcon icon={XCircle} size={18} weight="fill" className="text-danger animate-shake" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── 4-CHOICE MCQ (2 Rows of 2, Perfectly Symmetric RL Padding) ── */
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5">
            {options.map((opt, idx) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = Boolean(correctOptionId && correctOptionId === opt.id);
              const isWrong = Boolean(
                isSelected && !isCorrect && correctOptionId !== null && correctOptionId !== undefined
              );

              let btnStyles =
                'apple-glass-card border border-white/10 hover:border-game-accent/40 hover:bg-game-accent/[0.05] text-foreground shadow-sm';

              if (isCorrect) {
                btnStyles =
                  'border-success bg-success/25 text-success shadow-[0_0_20px_var(--et-success-glow)] scale-[1.01]';
              } else if (isWrong) {
                btnStyles =
                  'border-danger bg-danger/25 text-danger shadow-[0_0_20px_var(--et-danger-glow)] animate-shake';
              } else if (isSelected) {
                btnStyles =
                  'border-game-accent bg-game-accent/25 text-game-accent-light shadow-[0_0_20px_var(--game-glow)] scale-[1.01]';
              }

              const letterBadge = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectOption?.(opt.id)}
                  className={`w-full h-[58px] min-h-[58px] max-h-[58px] sm:h-[60px] sm:min-h-[60px] sm:max-h-[60px] px-2.5 sm:px-3 py-1 rounded-xl sm:rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed ${btnStyles}`}
                >
                  {/* Start Badge */}
                  <span
                    className={`w-7 h-7 min-w-[28px] max-w-[28px] rounded-lg sm:rounded-xl flex items-center justify-center font-stats text-xs font-black shrink-0 transition-colors ${
                      isCorrect
                        ? 'bg-success text-canvas shadow-sm'
                        : isWrong
                          ? 'bg-danger text-white shadow-sm'
                          : isSelected
                            ? 'bg-game-accent text-game-on-accent shadow-sm'
                            : 'bg-white/10 text-foreground'
                    }`}
                  >
                    {letterBadge}
                  </span>

                  {/* Balanced Symmetrical Text */}
                  <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 break-words flex-1 text-center px-0.5">
                    {opt.text[lang] || opt.text.en}
                  </span>

                  {/* Balanced End Slot — Same 28px width as Start Badge for 100% symmetric RL padding */}
                  <div className="w-7 h-7 min-w-[28px] max-w-[28px] flex items-center justify-center shrink-0">
                    {isCorrect && (
                      <AppIcon
                        icon={CheckCircle}
                        size={18}
                        weight="fill"
                        className="text-success animate-scale-in"
                      />
                    )}
                    {isWrong && (
                      <AppIcon icon={XCircle} size={18} weight="fill" className="text-danger animate-shake" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
