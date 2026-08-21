'use client';

import React from 'react';
import { CheckCircle, ArrowRight, Trophy, ShieldCheck, Medal } from '@phosphor-icons/react';
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
  questionSubtitle,
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
  const isPerfectRound = userRoundScore === 10;

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
    <div className="w-full max-w-xl mx-auto space-y-4 select-none animate-fade-in">
      {/* Header Prompt */}
      <div className="text-center space-y-1.5 pt-1 pb-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-lime/30 text-lime text-xs font-black uppercase tracking-wider">
          <AppIcon icon={ShieldCheck} size={14} weight="duotone" />
          <span>{lang === 'ar' ? 'كشف الترتيب الرسمي' : 'OFFICIAL REVEAL'}</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight font-display">{questionTitle}</h2>
        {questionSubtitle && (
          <p className="text-xs text-steel font-medium max-w-lg mx-auto">{questionSubtitle}</p>
        )}
      </div>

      {/* Perfect Round Celebration Banner */}
      {isPerfectRound && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 text-center flex items-center justify-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider animate-bounce">
          <AppIcon icon={Medal} size={18} weight="fill" />
          <span>{t('rank.perfectOrder')}</span>
        </div>
      )}

      {/* Round Score Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-lime/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[11px] text-steel font-bold uppercase tracking-wider">
            {t('rank.yourScore')}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white font-stats">
            {userRoundScore > 0 ? `+${userRoundScore}` : userRoundScore}{' '}
            <span className="text-xs font-semibold text-lime">pts</span>
          </span>
        </div>

        {/* In Duel: Opponent Score Breakdown */}
        {isDuel && opponentRoundScore !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-steel font-bold uppercase tracking-wider">
              {opponentName ? `${opponentName}:` : t('rank.rivalScore')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-300 font-stats">
              {opponentRoundScore > 0 ? `+${opponentRoundScore}` : opponentRoundScore}{' '}
              <span className="text-xs font-medium text-steel">pts</span>
            </span>
          </div>
        )}
      </div>

      {/* Correct Order List (Rank 1 to 5) */}
      <div className="space-y-2">
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
                flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200
                ${
                  isExact
                    ? 'bg-slate-900/95 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-900/80 border-slate-800'
                }
              `}
            >
              {/* Left Side: Correct Rank + Avatar + Text */}
              <div className="flex items-center gap-2.5 min-w-0 pe-2">
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-sm text-lime font-stats shrink-0">
                  #{item.correctRank}
                </div>

                <RankEntityAvatar media={item.media} name={item.name} size="sm" />

                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {item.name}
                  </span>
                  {item.subText && (
                    <span className="text-[10px] sm:text-[11px] text-steel font-medium truncate">
                      {item.subText}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-[11px] mt-0.5">
                    <span className="font-bold text-lime font-stats">{item.valueLabel}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-steel font-medium">
                      {lang === 'ar' ? `ترتيبك: #${submittedRank}` : `You: #${submittedRank}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Points Badge */}
              <div className="shrink-0">{getPointsBadge(points, delta)}</div>
            </div>
          );
        })}
      </div>

      {/* Advance Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onAdvance}
          disabled={isAdvancing}
          loading={isAdvancing}
          leftIcon={isLastRound ? <AppIcon icon={Trophy} size={18} weight="bold" /> : undefined}
          rightIcon={!isLastRound ? <AppIcon icon={ArrowRight} size={18} weight="bold" /> : undefined}
        >
          {isLastRound ? t('rank.viewFinalResults') : t('rank.nextRound')}
        </Button>
      </div>
    </div>
  );
}
