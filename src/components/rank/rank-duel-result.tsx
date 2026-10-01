'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowCounterClockwise,
  ShareNetwork,
  House,
  CheckCircle,
  ShieldCheck,
  Check,
  Vault,
  Cards,
  UserPlus,
  X,
  CircleNotch,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { Confetti } from '@/components/shared/confetti';

interface ParticipantSummary {
  guestId: string;
  name: string;
  avatarSeed: string;
  totalScore: number;
  roundScores: number[];
}

export interface RematchStateProps {
  status: 'none' | 'pending' | 'accepted' | 'declined';
  rematchGameId?: string;
  iAmInviter?: boolean;
  inviterName?: string;
}

interface RankDuelResultProps {
  isDuel: boolean;
  user: ParticipantSummary;
  opponent?: ParticipantSummary;
  winnerId?: string;
  roundCount: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  rematchState?: RematchStateProps;
  onRequestRematch?: () => void;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
  isRematching?: boolean;
}

export function RankDuelResult({
  isDuel,
  user,
  opponent,
  winnerId,
  roundCount,
  onPlayAgain,
  onGoHome,
  rematchState,
  onRequestRematch,
  onAcceptRematch,
  onDeclineRematch,
  isRematching = false,
}: RankDuelResultProps) {
  const { lang } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const playedSfxRef = useRef(false);

  const isWinner = isDuel && winnerId === user.guestId;
  const isDraw = isDuel && !winnerId && opponent && user.totalScore === opponent.totalScore;
  const isDefeat = isDuel && winnerId && winnerId !== user.guestId;
  const maxPossibleScore = roundCount * 10;
  const isSoloHigh = !isDuel && user.totalScore >= maxPossibleScore * 0.7;
  const shouldCelebrate = isWinner || isSoloHigh;

  useEffect(() => {
    if (playedSfxRef.current) return;
    playedSfxRef.current = true;
    if (shouldCelebrate) {
      sfx.victory();
      sfx.haptic('success');
    } else if (isDefeat) {
      sfx.runnerUp();
      sfx.haptic('warning');
    }
  }, [shouldCelebrate, isDefeat]);

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
    <div className="w-full max-w-lg mx-auto space-y-4 select-none animate-fade-in py-2 relative">
      <Confetti active={shouldCelebrate} />
      {/* Top Status Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-game-accent/30 text-game-accent text-xs font-black uppercase tracking-wider">
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
              p-4 rounded-3xl border flex flex-col items-center justify-between text-center relative backdrop-blur-2xl transition-all
              ${
                isWinner
                  ? 'bg-surface/95 border-game-accent/50 shadow-[0_16px_36px_var(--et-shade-65),0_0_24px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-15)]'
                  : 'bg-surface/85 border-white/[0.12] shadow-[0_12px_28px_var(--et-shade-50),inset_0_1px_0_0_var(--et-hi-08)]'
              }
            `}
          >
            {isWinner && (
              <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full bg-game-accent/20 text-game-accent text-[9px] font-black border border-game-accent/40 shadow-sm">
                WINNER
              </div>
            )}
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              {lang === 'ar' ? 'أنت' : 'YOU'}
            </span>
            <span className="text-sm font-black text-white truncate max-w-[120px]">{user.name}</span>

            <div className="my-2">
              <span className="text-3xl font-black text-white font-stats">
                {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
              </span>
              <span className="text-[10px] text-game-accent font-bold block">pts</span>
            </div>
          </div>

          {/* Opponent Card */}
          <div
            className={`
              p-4 rounded-3xl border flex flex-col items-center justify-between text-center relative backdrop-blur-2xl transition-all
              ${
                isDefeat
                  ? 'bg-surface/95 border-danger/50 shadow-[0_16px_36px_var(--et-shade-65),0_0_24px_var(--et-danger-glow),inset_0_1px_0_0_var(--et-hi-15)]'
                  : 'bg-surface/85 border-white/[0.12] shadow-[0_12px_28px_var(--et-shade-50),inset_0_1px_0_0_var(--et-hi-08)]'
              }
            `}
          >
            {isDefeat && (
              <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full bg-game-accent/20 text-game-accent text-[9px] font-black border border-game-accent/40 shadow-sm">
                WINNER
              </div>
            )}
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              {lang === 'ar' ? 'الخصم' : 'RIVAL'}
            </span>
            <span className="text-sm font-black text-white truncate max-w-[120px]">{opponent.name}</span>

            <div className="my-2">
              <span className="text-3xl font-black text-foreground font-stats">
                {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
              </span>
              <span className="text-[10px] text-muted font-bold block">pts</span>
            </div>
          </div>
        </div>
      ) : (
        /* Solo Score Display */
        <div className="p-6 rounded-3xl bg-surface/90 border border-white/12 shadow-[0_16px_36px_var(--et-shade-65),inset_0_1px_0_0_var(--et-hi-12)] backdrop-blur-2xl text-center space-y-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            {lang === 'ar' ? 'إجمالي النقاط' : 'TOTAL SCORE'}
          </span>
          <div className="text-4xl sm:text-5xl font-black text-white font-stats">
            {user.totalScore > 0 ? `+${user.totalScore}` : user.totalScore}
            <span className="text-base text-muted font-semibold font-sans"> / {maxPossibleScore} pts</span>
          </div>
        </div>
      )}

      {/* Round-by-Round Breakdown */}
      <div className="p-3.5 rounded-3xl bg-surface/85 border border-white/[0.12] shadow-[0_12px_28px_var(--et-shade-50),inset_0_1px_0_0_var(--et-hi-08)] backdrop-blur-2xl space-y-2">
        <span className="text-[11px] font-black text-muted uppercase tracking-wider block px-1">
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
                className="flex items-center justify-between p-2.5 rounded-2xl bg-canvas/70 border border-white/[0.08] text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted font-stats font-black">R{roundNum}</span>
                  {isPerfect && (
                    <span className="px-2 py-0.5 rounded-full bg-game-accent/15 text-game-accent text-[10px] font-black border border-game-accent/40 flex items-center gap-0.5 shadow-sm">
                      <AppIcon icon={CheckCircle} size={12} weight="fill" className="text-game-accent" /> 10/10
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-game-accent font-stats">
                    {score > 0 ? `+${score}` : score} pts
                  </span>

                  {isDuel && oppScore !== undefined && (
                    <>
                      <span className="text-muted font-bold">vs</span>
                      <span className="font-bold text-muted font-stats">
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

{/* Rematch Invitation Modal for Opponent */}
      {isDuel && rematchState?.status === 'pending' && !rematchState.iAmInviter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="apple-glass-elevated max-w-sm w-full p-6 text-center space-y-5 rounded-3xl border border-game-accent/40 shadow-[0_20px_60px_var(--game-glow)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-game-accent/40 bg-game-accent/10 text-game-accent mx-auto shadow-[0_0_24px_var(--game-glow)]">
              <AppIcon icon={UserPlus} size={32} weight="duotone" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white uppercase font-display tracking-tight">
                {lang === 'ar' ? 'دعوة لإعادة الماتش!' : 'Rematch Invitation!'}
              </h2>
              <p className="text-muted text-xs font-medium max-w-xs mx-auto leading-relaxed">
                {lang === 'ar'
                  ? `${rematchState.inviterName || 'المنافس'} يتحداك في جولة إعادة بنفس القواعد!`
                  : `${rematchState.inviterName || 'Your opponent'} challenges you to a rematch!`}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={onAcceptRematch}
                leftIcon={<AppIcon icon={CheckCircle} size={20} weight="fill" className="text-game-on-accent" />}
                className="font-bold text-game-on-accent shadow-[0_4px_20px_var(--game-glow)]"
              >
                {lang === 'ar' ? 'قبول التحدي' : 'Accept Rematch'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={onDeclineRematch}
                leftIcon={<AppIcon icon={X} size={16} weight="bold" className="text-muted" />}
                className="text-muted hover:text-white"
              >
                {lang === 'ar' ? 'رفض' : 'Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {isDuel ? (
          <Button
            variant={rematchState?.status === 'declined' ? 'danger' : 'gold'}
            size="lg"
            fullWidth
            onClick={onRequestRematch || onPlayAgain}
            disabled={isRematching || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted'}
            leftIcon={
              isRematching || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted' ? (
                <AppIcon icon={CircleNotch} size={18} weight="bold" className="animate-spin text-game-on-accent" />
              ) : (
                <AppIcon icon={ArrowCounterClockwise} size={18} weight="bold" className="text-game-on-accent" />
              )
            }
            className="font-bold text-game-on-accent"
          >
            {rematchState?.status === 'accepted'
              ? (lang === 'ar' ? 'جارٍ بدء جولة الإعادة...' : 'Entering Rematch...')
              : rematchState?.status === 'pending' && rematchState.iAmInviter
                ? (lang === 'ar' ? 'في انتظار موافقة المنافس...' : 'Waiting for Opponent...')
                : rematchState?.status === 'declined'
                  ? (lang === 'ar' ? 'رفض المنافس الإعادة (طلب مرة أخرى)' : 'Opponent Declined (Try Again)')
                  : (lang === 'ar' ? 'طلب إعادة الماتش' : 'REMATCH')}
          </Button>
        ) : (
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            leftIcon={<AppIcon icon={ArrowCounterClockwise} size={18} weight="bold" className="text-game-on-accent" />}
            className="font-bold text-game-on-accent"
          >
            {lang === 'ar' ? 'لعب جولة جديدة' : 'PLAY AGAIN'}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleShare}
            leftIcon={<AppIcon icon={copied ? Check : ShareNetwork} size={16} weight="bold" className={copied ? 'text-game-accent' : ''} />}
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

        {/* Cross-Game Promo Links */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link
            href="/bank"
            className="btn-haptic flex items-center gap-1.5 px-3 py-1 rounded-full border border-game-accent/30 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
          >
            <AppIcon icon={Vault} size={13} weight="bold" />
            <span>{lang === 'ar' ? 'صالة بَنِّك 90s' : 'Bank It Sprint'}</span>
          </Link>
          <Link
            href="/create-room"
            className="btn-haptic flex items-center gap-1.5 px-3 py-1 rounded-full border border-game-accent/30 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
          >
            <AppIcon icon={Cards} size={13} weight="bold" />
            <span>{lang === 'ar' ? 'مزاد واشتباك' : 'Snipe Auction'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
