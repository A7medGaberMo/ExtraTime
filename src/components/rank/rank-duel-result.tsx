'use client';

import React, { useState } from 'react';
import {
  ArrowCounterClockwise,
  ShareNetwork,
  House,
  CheckCircle,
  ShieldCheck,
  Check,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';

interface ParticipantSummary {
  guestId: string;
  name: string;
  avatarSeed: string;
  totalScore: number;
  roundScores: number[];
}

interface RoundHistorySummary {
  roundIndex: number;
  questionTitle?: string;
  results: Array<{
    guestId: string;
    roundScore: number;
  }>;
}

interface RankDuelResultProps {
  isDuel: boolean;
  user: ParticipantSummary;
  opponent?: ParticipantSummary;
  winnerId?: string;
  roundCount: number;
  roundHistory: RoundHistorySummary[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function RankDuelResult({
  isDuel,
  user,
  opponent,
  winnerId,
  roundCount,
  onPlayAgain,
  onGoHome,
}: RankDuelResultProps) {
  const { lang } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const isWinner = isDuel && winnerId === user.guestId;
  const isDraw = isDuel && !winnerId && opponent && user.totalScore === opponent.totalScore;
  const isDefeat = isDuel && winnerId && winnerId !== user.guestId;

  const maxPossibleScore = roundCount * 10;

  function handleShare() {
    const text =
      isDuel && opponent
        ? `⚽ ExtraTime Rank: ${isWinner ? '🏆 VICTORY!' : isDraw ? '🤝 DRAW!' : 'DEFEAT'} I scored ${user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore} pts vs ${opponent.name} (${opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore} pts).`
        : `⚽ ExtraTime Rank: I scored ${user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}/${maxPossibleScore} pts in Solo Mode.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast(lang === 'ar' ? 'تم نسخ النتيجة!' : 'Score copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const getHeaderTitle = () => {
    if (!isDuel) {
      return lang === 'ar' ? 'النتيجة النهائية' : 'FINAL RESULT';
    }
    if (isWinner) {
      return lang === 'ar' ? '🏆 انتصار تكتيكي!' : '🏆 VICTORY';
    }
    if (isDraw) {
      return lang === 'ar' ? '🤝 تعادل قوي!' : '🤝 DRAW';
    }
    return lang === 'ar' ? 'هزيمة' : 'DEFEAT';
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 select-none animate-fade-in py-2">
      {/* Top Status Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-lime/30 text-lime text-xs font-black uppercase tracking-wider">
          <AppIcon icon={ShieldCheck} size={14} weight="duotone" />
          <span>{lang === 'ar' ? 'صافرة النهاية' : 'MATCH COMPLETE'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-display">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Score Cards (Duel vs Solo) */}
      {isDuel && opponent ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* User Card */}
          <div
            className={`
              p-4 rounded-2xl border flex flex-col items-center justify-between text-center relative
              ${
                isWinner
                  ? 'bg-slate-900 border-lime shadow-lg shadow-lime/10'
                  : 'bg-slate-900/80 border-slate-800'
              }
            `}
          >
            {isWinner && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-lime/20 text-lime text-[9px] font-black border border-lime/40">
                WINNER
              </div>
            )}
            <span className="text-[11px] font-bold text-steel uppercase tracking-wider">
              {lang === 'ar' ? 'أنت' : 'YOU'}
            </span>
            <span className="text-sm font-black text-white truncate max-w-[120px]">{user.name}</span>

            <div className="my-2">
              <span className="text-3xl font-black text-white font-stats">
                {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
              </span>
              <span className="text-[10px] text-lime font-bold block">pts</span>
            </div>
          </div>

          {/* Opponent Card */}
          <div
            className={`
              p-4 rounded-2xl border flex flex-col items-center justify-between text-center relative
              ${
                isDefeat
                  ? 'bg-slate-900 border-lime shadow-lg shadow-lime/10'
                  : 'bg-slate-900/80 border-slate-800'
              }
            `}
          >
            {isDefeat && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-lime/20 text-lime text-[9px] font-black border border-lime/40">
                WINNER
              </div>
            )}
            <span className="text-[11px] font-bold text-steel uppercase tracking-wider">
              {lang === 'ar' ? 'الخصم' : 'RIVAL'}
            </span>
            <span className="text-sm font-black text-white truncate max-w-[120px]">{opponent.name}</span>

            <div className="my-2">
              <span className="text-3xl font-black text-slate-300 font-stats">
                {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
              </span>
              <span className="text-[10px] text-steel font-bold block">pts</span>
            </div>
          </div>
        </div>
      ) : (
        /* Solo Score Display */
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
          <span className="text-[11px] font-bold text-steel uppercase tracking-wider">
            {lang === 'ar' ? 'إجمالي النقاط' : 'TOTAL SCORE'}
          </span>
          <div className="text-4xl sm:text-5xl font-black text-white font-stats">
            {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
            <span className="text-base text-steel font-semibold font-sans"> / {maxPossibleScore} pts</span>
          </div>
        </div>
      )}

      {/* Round-by-Round Breakdown */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
        <span className="text-[11px] font-black text-steel uppercase tracking-wider block">
          {lang === 'ar' ? 'تفاصيل الجولات' : 'ROUNDS'}
        </span>

        <div className="space-y-1.5">
          {user.roundScores.map((score, index) => {
            const oppScore = opponent?.roundScores[index];
            const roundNum = index + 1;
            const isPerfect = score === 10;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span className="text-steel font-stats font-black">R{roundNum}</span>
                  {isPerfect && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-[10px] font-black border border-emerald-500/40 flex items-center gap-0.5">
                      <AppIcon icon={CheckCircle} size={12} weight="fill" /> 10/10
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-lime font-stats">
                    {score > 0 ? `+${score}` : score} pts
                  </span>

                  {isDuel && oppScore !== undefined && (
                    <>
                      <span className="text-steel font-bold">vs</span>
                      <span className="font-bold text-steel font-stats">
                        {oppScore > 0 ? `+${oppScore}` : oppScore} pts
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onPlayAgain}
          leftIcon={<AppIcon icon={ArrowCounterClockwise} size={18} weight="bold" />}
        >
          {lang === 'ar' ? 'لعب جولة جديدة' : isDuel ? 'REMATCH' : 'PLAY AGAIN'}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleShare}
            leftIcon={<AppIcon icon={copied ? Check : ShareNetwork} size={16} weight="bold" className={copied ? 'text-lime' : ''} />}
          >
            {copied ? (lang === 'ar' ? 'تم النسخ!' : 'COPIED!') : lang === 'ar' ? 'مشاركة' : 'SHARE'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onGoHome}
            leftIcon={<AppIcon icon={House} size={16} weight="bold" />}
          >
            {lang === 'ar' ? 'الرئيسية' : 'RANK HUB'}
          </Button>
        </div>
      </div>
    </div>
  );
}
