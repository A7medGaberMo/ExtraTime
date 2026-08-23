'use client';

import React from 'react';
import { ArrowRight, Trophy, Check } from 'lucide-react';
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

function parseEntityName(rawName: string) {
  if (!rawName) return { mainName: '', tag: null };
  const match = rawName.match(/^(.+?)\s*[\(\[]([^\)\]]+)[\)\]]$/);
  if (match) {
    return { mainName: match[1].trim(), tag: match[2].trim() };
  }
  return { mainName: rawName.trim(), tag: null };
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
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lime/15 border border-lime/30 text-lime text-[11px] sm:text-xs font-bold font-stats shadow-sm shrink-0">
          <Check size={12} strokeWidth={3} />
          <span>+2 pts</span>
        </div>
      );
    }
    if (delta === 1) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-bold font-stats shrink-0">
          <span>+1 pt</span>
        </div>
      );
    }
    if (delta === 2) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-steel text-[11px] sm:text-xs font-medium font-stats shrink-0">
          <span>0 pts</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] sm:text-xs font-bold font-stats shrink-0">
        <span>{points > 0 ? `+${points}` : points} pts</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[400px] mx-auto select-none flex flex-col gap-3 sm:gap-4 py-1 px-1 animate-fade-in">
      {/* ── HEADER SCORE SUMMARY STRIP & FULL QUESTION TITLE ───────────── */}
      <div className="text-center shrink-0 space-y-2 px-1">
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-[#141416] border border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-1.5 font-stats">
            <span className="text-[11px] text-steel font-bold uppercase tracking-wider">
              {t('rank.yourScore')}:
            </span>
            <span className="text-[15px] font-bold text-lime">
              {userRoundScore > 0 ? `+${userRoundScore}` : userRoundScore} pts
            </span>
          </div>

          {isDuel && opponentRoundScore !== undefined && (
            <div className="flex items-center gap-1.5 font-stats">
              <span className="text-[11px] text-steel font-bold uppercase tracking-wider truncate max-w-[90px]">
                {opponentName ? `${opponentName}:` : t('rank.rivalScore')}:
              </span>
              <span className="text-[15px] font-bold text-slate-300">
                {opponentRoundScore > 0 ? `+${opponentRoundScore}` : opponentRoundScore} pts
              </span>
            </div>
          )}
        </div>

        {/* Full Question Title - No Line Clamp, No Truncation */}
        <h2 className="text-[17px] sm:text-[19px] font-bold leading-[1.3] tracking-[-0.01em] text-[#F5F5F7] font-display">
          {questionTitle}
        </h2>
      </div>

      {/* ── CORRECT ORDER LIST (Matches exact size & height of card list) ─── */}
      <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
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
              className="flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] sm:rounded-[20px] border transition-all duration-200"
              style={{
                background: '#141416',
                borderColor: isExact
                  ? 'rgba(198,255,74,0.35)'
                  : isTop
                    ? 'rgba(198,255,74,0.2)'
                    : 'rgba(255,255,255,0.06)',
                boxShadow: isExact ? '0 0 14px rgba(198,255,74,0.12)' : 'none',
              }}
            >
              {/* Left Side: Correct Rank + Avatar + Text Details */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pe-2">
                {/* Rank Number Badge */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold font-stats"
                  style={{
                    background: isTop ? '#C6FF4A' : '#26262A',
                    color: isTop ? '#0A0A0B' : '#98989D',
                  }}
                >
                  {item.correctRank}
                </div>

                {/* Avatar with rich media */}
                <div className="shrink-0">
                  <RankEntityAvatar media={item.media} name={mainName || item.name} size="md" />
                </div>

                {/* Name, Season Tag, Metric Value, and Guess Comparison */}
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-[13.5px] sm:text-[14.5px] font-bold text-[#F5F5F7] truncate leading-tight">
                      {mainName}
                    </span>
                    {tag && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-lime font-stats text-[11px] font-bold leading-none">
                        {tag}
                      </span>
                    )}
                    <span className="font-bold text-lime text-[11.5px] sm:text-xs font-stats shrink-0">
                      ({item.valueLabel})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-steel font-medium truncate leading-none pt-0.5">
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
      <div className="shrink-0 pt-1 pb-2">
        <button
          type="button"
          onClick={onAdvance}
          disabled={isAdvancing}
          className="flex h-[48px] sm:h-[50px] w-full items-center justify-center gap-2 rounded-[18px] text-[15px] sm:text-[16px] font-bold tracking-tight text-[#0A0A0B] bg-lime transition-all active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:pointer-events-none font-display uppercase shadow-[0_10px_28px_-6px_rgba(198,255,74,0.32)]"
        >
          {isLastRound ? (
            <>
              <Trophy size={18} strokeWidth={2.5} />
              <span>{t('rank.viewFinalResults')}</span>
            </>
          ) : (
            <>
              <span>{t('rank.nextRound')}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
