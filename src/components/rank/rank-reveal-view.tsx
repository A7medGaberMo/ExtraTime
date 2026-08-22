'use client';

import React from 'react';
import { CheckCircle, ArrowRight, Trophy } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { RankEntityAvatar, RankMedia } from './rank-entity-avatar';
import { useI18n } from '@/lib/i18n';

export interface RevealAnswerItem {
  answerKey: string;
  name: string;
  subText?: string;
  media: RankMedia;
  value: number;
  valueLabel: string;
  correctRank: number;
}

export interface CardDeltaResult {
  answerKey: string;
  submittedRank: number;
  actualRank: number;
  delta: number;
  points: number;
}

interface RankRevealViewProps {
  questionTitle: string;
  questionSubtitle?: string;
  answers: RevealAnswerItem[];
  userDeltas: CardDeltaResult[];
  userRoundScore: number;
  opponentRoundScore?: number;
  opponentName?: string;
  isDuel?: boolean;
  isLastRound: boolean;
  onAdvance: () => void;
  isAdvancing: boolean;
}

export function RankRevealView({
  questionTitle,
  answers,
  userDeltas,
  userRoundScore,
  opponentRoundScore,
  opponentName,
  isDuel,
  isLastRound,
  onAdvance,
  isAdvancing,
}: RankRevealViewProps) {
  const { lang, t } = useI18n();
  const deltaMap = new Map(userDeltas.map((d) => [d.answerKey, d]));
  const sortedAnswers = [...answers].sort((a, b) => a.correctRank - b.correctRank);

  const getPointsBadge = (points: number, delta: number) => {
    if (delta === 0) {
      return (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-black shadow-md font-stats">
          <AppIcon icon={CheckCircle} size={14} weight="fill" />
          <span>+2 pts</span>
        </div>
      );
    }
    if (delta === 1) {
      return (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-black font-stats">
          <span>+1 pt</span>
        </div>
      );
    }
    if (delta === 2) {
      return (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-steel text-xs font-bold font-stats">
          <span>0 pts</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-400 text-xs font-black font-stats">
        <span>{points > 0 ? `+${points}` : points} pts</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto select-none overflow-hidden min-h-0 gap-1 sm:gap-2 animate-fade-in">
      {/* ── HEADER PROMPT & ROUND SCORE COMBINED STRIP ────────────────────── */}
      <div className="shrink-0 space-y-1 text-center px-1">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-lime/20 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] text-steel font-bold uppercase tracking-wider">
              {t('rank.yourScore')}:
            </span>
            <span className="text-base sm:text-lg font-black text-lime font-stats">
              {userRoundScore > 0 ? `+${userRoundScore}` : userRoundScore} pts
            </span>
          </div>

          {isDuel && opponentRoundScore !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] text-steel font-bold uppercase tracking-wider truncate max-w-[90px]">
                {opponentName ? `${opponentName}:` : t('rank.rivalScore')}:
              </span>
              <span className="text-base sm:text-lg font-black text-slate-300 font-stats">
                {opponentRoundScore > 0 ? `+${opponentRoundScore}` : opponentRoundScore} pts
              </span>
            </div>
          )}
        </div>

        <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-tight font-display line-clamp-1">
          {questionTitle}
        </h2>
      </div>

      {/* ── CORRECT ORDER LIST (Rank 1 to 5 with Revealed Values) ─────────── */}
      <div className="flex-1 flex flex-col justify-between min-h-0 py-0.5 gap-1.5 sm:gap-2">
        {sortedAnswers.map((item) => {
          const deltaInfo = deltaMap.get(item.answerKey);
          const submittedRank = deltaInfo?.submittedRank ?? item.correctRank;
          const points = deltaInfo?.points ?? 0;
          const delta = deltaInfo?.delta ?? 0;
          const isExact = delta === 0;

          return (
            <div
              key={item.answerKey}
              className={`
                flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border transition-all duration-200
                ${
                  isExact
                    ? 'bg-slate-900/95 border-emerald-500/50 shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-900/85 border-white/10'
                }
              `}
            >
              {/* Left Side: Correct Rank + Avatar + Text */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pe-1.5">
                <div
                  className={`
                    w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm font-stats shrink-0 border
                    ${
                      isExact
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-slate-950 text-white border-white/10'
                    }
                  `}
                >
                  #{item.correctRank}
                </div>

                <RankEntityAvatar media={item.media} name={item.name} size="sm" />

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-white truncate leading-tight">
                      {item.name}
                    </span>
                    <span className="font-black text-lime text-xs sm:text-sm font-stats shrink-0">
                      ({item.valueLabel})
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-steel font-medium truncate leading-tight pt-0.5">
                    {lang === 'ar' ? `ترتيبك كان: #${submittedRank}` : `You guessed: #${submittedRank}`}
                  </span>
                </div>
              </div>

              {/* Right Side: Points Badge */}
              <div className="shrink-0">{getPointsBadge(points, delta)}</div>
            </div>
          );
        })}
      </div>

      {/* ── ADVANCE ACTION BUTTON (Permanently Visible at Bottom) ─────────── */}
      <div className="shrink-0 pt-1 pb-1">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onAdvance}
          disabled={isAdvancing}
          loading={isAdvancing}
          leftIcon={isLastRound ? <AppIcon icon={Trophy} size={16} weight="bold" /> : undefined}
          rightIcon={!isLastRound ? <AppIcon icon={ArrowRight} size={16} weight="bold" /> : undefined}
          className="min-h-[42px] sm:min-h-[46px] text-xs sm:text-sm font-black shadow-lg shadow-lime/10"
        >
          {isLastRound ? t('rank.viewFinalResults') : t('rank.nextRound')}
        </Button>
      </div>
    </div>
  );
}
