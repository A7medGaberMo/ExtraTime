'use client';

import React from 'react';
import { BankQuestionOption } from '@/types/bank';
import { CircularTimer } from './circular-timer';
import { Lightning, HourglassSimple } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

interface SuddenDeathModalProps {
  isOpen: boolean;
  pairIndex: number;
  deadline?: number;
  question?: {
    question: { en: string; ar: string };
    options: BankQuestionOption[];
    type: 'mcq' | 'tf';
    category?: string;
  } | null;
  isMyTurn: boolean;
  onSelectOption: (optionId: string) => void;
  selectedOptionId?: string | null;
  isSubmitting?: boolean;
  onExpire?: () => void;
  lang: 'ar' | 'en';
}

export function SuddenDeathModal({
  isOpen,
  pairIndex,
  deadline,
  question,
  isMyTurn,
  onSelectOption,
  selectedOptionId,
  isSubmitting = false,
  onExpire,
  lang,
}: SuddenDeathModalProps) {
  if (!isOpen) return null;
  const isArabic = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-xl apple-glass-elevated border border-gold/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(229,184,66,0.3)] relative overflow-hidden">
        {/* Top Gold Lighting Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gold via-yellow-200 to-gold" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
              <AppIcon icon={Lightning} size={20} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-black text-gold tracking-wide ${isArabic ? 'font-sans' : 'font-display'}`}>
                  {isArabic ? 'سؤال الحسم الذهبي' : 'SUDDEN DEATH SHOOTOUT'}
                </h3>
                <span className="text-[11px] font-black text-gold bg-gold/20 px-2 py-0.5 rounded-full border border-gold/30 font-stats tabular-nums">
                  {isArabic ? `زوج ${pairIndex} من 3` : `Pair ${pairIndex}/3`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'سؤال واحد، 15 ثانية فقط. أول فارق يحدد الفائز!'
                  : '15-second golden question. First difference decides the champion!'}
              </p>
            </div>
          </div>

          {/* 15-second Golden Timer */}
          {deadline && <CircularTimer deadline={deadline} totalDurationMs={15_000} onExpire={onExpire} />}
        </div>

        {/* Golden Question Content */}
        {isMyTurn && question ? (
          <div className="flex flex-col gap-4">
            <div className="apple-glass-card border border-white/10 rounded-2xl p-4 sm:p-5 text-center">
              <h4
                className={`text-base sm:text-lg font-black text-white leading-relaxed ${isArabic ? 'font-sans' : 'font-display'}`}
                dir={isArabic ? 'rtl' : 'ltr'}
              >
                {question.question[lang] || question.question.en}
              </h4>
            </div>

            {/* Options */}
            <div
              className={`grid ${
                question.type === 'tf' ? 'grid-cols-2 gap-3' : 'grid-cols-1 sm:grid-cols-2 gap-2.5'
              }`}
            >
              {question.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const letterBadge = ['A', 'B', 'C', 'D'][idx] || '';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitting || !isMyTurn}
                    onClick={() => onSelectOption(opt.id)}
                    className={`min-h-[52px] p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-start transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? 'border-gold bg-gold/25 text-gold shadow-[0_0_15px_rgba(229,184,66,0.35)] scale-[1.02]'
                        : 'apple-glass-card border-white/10 hover:border-gold/40 hover:bg-white/[0.08] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {question.type === 'mcq' && (
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-stats text-xs font-black shrink-0 ${
                            isSelected ? 'bg-gold text-slate-950' : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {letterBadge}
                        </span>
                      )}
                      <span className="text-sm sm:text-base font-semibold">
                        {opt.text[lang] || opt.text.en}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Waiting for opponent state */
          <div className="min-h-[160px] flex flex-col items-center justify-center gap-3 apple-glass-card border border-white/10 rounded-2xl p-6 text-center">
            <AppIcon icon={HourglassSimple} size={36} weight="duotone" className="text-gold animate-spin-slow" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-200">
                {isArabic
                  ? 'المنافس يجاوب سؤاله الذهبي الآن...'
                  : 'Opponent is answering their golden question...'}
              </span>
              <span className="text-xs text-slate-400">
                {isArabic
                  ? 'ثواني ونكشف النتيجة النهائية للماتش'
                  : 'Revealing shootout outcome in a few seconds'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
