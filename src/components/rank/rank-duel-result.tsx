'use client';

import React, { useState } from 'react';
import {
  ArrowCounterClockwise,
  ShareNetwork,
  House,
  CheckCircle,
  ShieldCheck,
  Check,
  Trophy,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
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
      return lang === 'ar' ? 'انتصار تكتيكي' : 'TACTICAL VICTORY';
    }
    if (isDraw) {
      return lang === 'ar' ? 'تعادل تكتيكي' : 'HONORABLE DRAW';
    }
    return lang === 'ar' ? 'هزيمة تكتيكية' : 'TACTICAL DEFEAT';
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 select-none animate-fade-in py-2">
      {/* Top Status Header */}
      <div className="text-center space-y-2">
        <StatPill
          variant={isWinner ? 'lime' : isDraw ? 'amber' : 'muted'}
          size="sm"
          icon={<AppIcon icon={isWinner ? Trophy : ShieldCheck} size={14} weight="duotone" />}
          label={lang === 'ar' ? 'صافرة النهاية' : 'MATCH COMPLETE'}
        />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight font-display">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Score Cards (Duel vs Solo) */}
      {isDuel && opponent ? (
        <div className="grid grid-cols-2 gap-3">
          {/* User Card */}
          <Panel
            variant={isWinner ? 'highlight' : 'default'}
            className="p-4 flex flex-col items-center justify-between text-center relative"
          >
            {isWinner && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-lime/20 text-lime text-[9px] font-black border border-lime/40 uppercase font-stats">
                WINNER
              </div>
            )}
            <span className="text-[10px] font-extrabold text-steel uppercase tracking-wider font-stats">
              {lang === 'ar' ? 'أنت' : 'YOU'}
            </span>
            <span className="text-sm font-extrabold text-white truncate max-w-[120px] font-stats">{user.name}</span>

            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-stats">
                {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
              </span>
              <span className="text-[10px] text-lime font-bold block uppercase font-stats">pts</span>
            </div>
          </Panel>

          {/* Opponent Card */}
          <Panel
            variant={isDefeat ? 'highlight' : 'default'}
            className="p-4 flex flex-col items-center justify-between text-center relative"
          >
            {isDefeat && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-lime/20 text-lime text-[9px] font-black border border-lime/40 uppercase font-stats">
                WINNER
              </div>
            )}
            <span className="text-[10px] font-extrabold text-steel uppercase tracking-wider font-stats">
              {lang === 'ar' ? 'المنافس' : 'RIVAL'}
            </span>
            <span className="text-sm font-extrabold text-white truncate max-w-[120px] font-stats">{opponent.name}</span>

            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-300 font-stats">
                {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
              </span>
              <span className="text-[10px] text-steel font-bold block uppercase font-stats">pts</span>
            </div>
          </Panel>
        </div>
      ) : (
        /* Solo Score Display */
        <Panel variant="highlight" className="p-6 text-center space-y-1">
          <span className="text-[11px] font-extrabold text-steel uppercase tracking-wider font-stats">
            {lang === 'ar' ? 'إجمالي النقاط' : 'TOTAL SCORE'}
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-white font-stats">
            {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
            <span className="text-base text-steel font-semibold font-stats"> / {maxPossibleScore} pts</span>
          </div>
        </Panel>
      )}

      {/* Round-by-Round Breakdown */}
      <Panel variant="subtle" className="p-4 space-y-2">
        <span className="text-[10px] font-black text-steel uppercase tracking-wider block font-stats">
          {lang === 'ar' ? 'تفاصيل الجولات' : 'ROUNDS BREAKDOWN'}
        </span>

        <div className="space-y-1.5">
          {user.roundScores.map((score, index) => {
            const oppScore = opponent?.roundScores[index];
            const roundNum = index + 1;
            const isPerfect = score === 10;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span className="text-steel font-stats font-black">R{roundNum}</span>
                  {isPerfect && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 text-[10px] font-black border border-emerald-500/40 flex items-center gap-0.5 font-stats">
                      <AppIcon icon={CheckCircle} size={12} weight="fill" /> 10/10
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-stats">
                  <span className="font-bold text-lime">
                    {score > 0 ? `+${score}` : score} pts
                  </span>

                  {isDuel && oppScore !== undefined && (
                    <>
                      <span className="text-steel font-medium">vs</span>
                      <span className="font-bold text-steel">
                        {oppScore > 0 ? `+${oppScore}` : oppScore} pts
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

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
