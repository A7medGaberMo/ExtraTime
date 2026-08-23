'use client';

import React from 'react';
import { ArrowRight, Trophy, Check } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { RankEntityAvatar, RankMedia } from './rank-entity-avatar';
import { parseEntityName } from '@/lib/rank-formatters';
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

function getPointsBadge(points: number, delta: number) {
  if (delta === 0) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-lime/15 border border-lime/30 text-lime text-xs font-semibold font-stats shadow-sm shrink-0">
        <AppIcon icon={Check} size={12} weight="bold" />
        <span>+2 pts</span>
      </div>
    );
  }
  if (delta === 1) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold font-stats shrink-0">
        <span>+1 pt</span>
      </div>
    );
  }
  if (delta === 2) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-steel text-xs font-medium font-stats shrink-0">
        <span>0 pts</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold font-stats shrink-0">
      <span>{points > 0 ? `+${points}` : points} pts</span>
    </div>
  );
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

  return (
    <div className="w-full max-w-md mx-auto select-none flex flex-col gap-2.5 sm:gap-3.5 py-1 animate-fade-in">
      {/* ── HEADER SCORE SUMMARY STRIP & FULL QUESTION TITLE ───────────── */}
      <div className="text-center shrink-0 space-y-1.5 px-2">
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-stats">
            <span className="text-xs text-steel font-semibold uppercase tracking-wider">
              {t('rank.yourScore')}:
            </span>
            <span className="text-sm font-bold text-lime">
              {userRoundScore > 0 ? `+${userRoundScore}` : userRoundScore} pts
            </span>
          </div>

          {isDuel && opponentRoundScore !== undefined && (
            <div className="flex items-center gap-1.5 font-stats">
              <span className="text-xs text-steel font-semibold uppercase tracking-wider truncate max-w-[90px]">
                {opponentName ? `${opponentName}:` : t('rank.rivalScore')}:
              </span>
              <span className="text-sm font-bold text-slate-300">
                {opponentRoundScore > 0 ? `+${opponentRoundScore}` : opponentRoundScore} pts
              </span>
            </div>
          )}
        </div>

        {/* Full Question Title */}
        <h2 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-white font-display">
          {questionTitle}
        </h2>
        {questionSubtitle && (
          <p className="text-xs text-steel font-medium">{questionSubtitle}</p>
        )}
      </div>


      {/* ── CORRECT ORDER LIST (Apple Frosted Glass Rows) ─── */}
      <div className="flex flex-col gap-2 w-full">
        {sortedAnswers.map((item) => {
          const deltaInfo = deltaMap.get(item.answerKey);
          const submittedRank = deltaInfo?.submittedRank ?? item.correctRank;
          const points = deltaInfo?.points ?? 0;
          const delta = deltaInfo?.delta ?? 0;
          const isExact = delta === 0;
          const isTop = item.correctRank === 1;
          const { mainName, tag } = parseEntityName(item.name);

          return (
            <div
              key={item.answerKey}
              className={`
                flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border w-full transition-all
                ${
                  isExact
                    ? 'border-lime/40 bg-slate-900/95 shadow-sm shadow-lime/5'
                    : isTop
                      ? 'border-white/15 bg-slate-900/90'
                      : 'border-white/8 bg-slate-900/80'
                }
              `}
            >
              {/* Left Side: Correct Rank + Avatar + Text Details */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pe-1.5">
                {/* Rank Number Badge */}
                <div
                  className={`
                    flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-display-number
                    ${
                      isTop
                        ? 'bg-lime text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300'
                    }
                  `}
                >
                  {item.correctRank}
                </div>

                {/* Avatar with rich media */}
                <div className="shrink-0 mx-1 sm:mx-1.5">
                  <RankEntityAvatar media={item.media} name={mainName || item.name} size="md" />
                </div>

                {/* Name, Season Tag, Metric Value, and Guess Comparison */}
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                      {mainName}
                    </span>
                    {tag && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-lime font-stats text-[10px] sm:text-[11px] font-semibold leading-none">
                        {tag}
                      </span>
                    )}
                    <span className="font-semibold text-lime text-xs font-stats shrink-0">
                      ({item.valueLabel})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-steel font-normal truncate leading-none pt-0.5">
                    {item.subText && <span>{item.subText} • </span>}
                    <span>
                      {lang === 'ar'
                        ? `ترتيبك: #${submittedRank}${isExact ? ' (مطابق ✓)' : ''}`
                        : `You guessed: #${submittedRank}${isExact ? ' (Exact ✓)' : ''}`}
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

      {/* ── ADVANCE ACTION BUTTON ─────────── */}
      <div className="shrink-0 pt-0.5 pb-1">
        <button
          type="button"
          onClick={onAdvance}
          disabled={isAdvancing}
          className="btn-haptic flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 bg-lime shadow-sm transition-all active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:pointer-events-none font-display uppercase"
        >
          {isLastRound ? (
            <>
              <AppIcon icon={Trophy} size={18} weight="bold" />
              <span>{t('rank.viewFinalResults')}</span>
            </>
          ) : (
            <>
              <span>{t('rank.nextRound')}</span>
              <AppIcon icon={ArrowRight} size={18} weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

