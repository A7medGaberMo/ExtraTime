'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { BankParticipant, getScoreTier } from '@/types/bank';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Crown,
  Medal,
  Shield,
  Clock,
  CheckCircle,
  Flame,
  ArrowClockwise,
  House,
  Lightning,
  Ranking,
  Cards,
  UserPlus,
  X,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { sfx } from '@/lib/sfx';

export interface BankRematchStateProps {
  status: 'none' | 'pending' | 'accepted' | 'declined';
  rematchGameId?: string;
  iAmInviter?: boolean;
  inviterName?: string;
}

interface ResultsModalProps {
  isOpen: boolean;
  isSolo: boolean;
  winnerId?: string;
  isDraw?: boolean;
  myParticipant: BankParticipant;
  opponent?: BankParticipant;
  rematchGameId?: string;
  isRematchPending?: boolean;
  onRematch?: () => void;
  onHome: () => void;
  onHub: () => void;
  lang: 'ar' | 'en';
  rematchState?: BankRematchStateProps;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
}

export function ResultsModal({
  isOpen,
  isSolo,
  winnerId,
  isDraw,
  myParticipant,
  opponent,
  rematchGameId,
  isRematchPending = false,
  onRematch,
  onHome,
  onHub,
  lang,
  rematchState,
  onAcceptRematch,
  onDeclineRematch,
}: ResultsModalProps) {
  const isArabic = lang === 'ar';
  const isWinner = !isSolo && !isDraw && winnerId === myParticipant.guestId;

  useEffect(() => {
    if (!isOpen) return;
    if (isWinner || (isSolo && myParticipant.totalBankedScore >= 16)) {
      sfx.victory();
    } else if (!isSolo && !isDraw && !isWinner) {
      sfx.runnerUp();
    } else {
      sfx.roundBonus();
    }
  }, [isOpen, isWinner, isSolo, isDraw, myParticipant.totalBankedScore]);

  if (!isOpen) return null;

  const tierInfo = getScoreTier(myParticipant.totalBankedScore);

  const tierIcons = {
    legend: <AppIcon icon={Crown} size={28} weight="fill" className="text-tier-gold" />,
    gold: <AppIcon icon={Trophy} size={28} weight="fill" className="text-tier-gold" />,
    silver: <AppIcon icon={Medal} size={28} weight="fill" className="text-tier-silver" />,
    bronze: <AppIcon icon={Shield} size={28} weight="fill" className="text-tier-bronze" />,
  };

  const outcomeTitle = isSolo
    ? isArabic
      ? 'انتهى التحدي'
      : 'CHALLENGE COMPLETE'
    : isDraw
      ? isArabic
        ? 'تعادل تاريخي!'
        : 'IT’S A DRAW!'
      : isWinner
        ? isArabic
          ? 'فوز مستحق! 🏆'
          : 'VICTORY!'
        : isArabic
          ? 'هاردلك!'
          : 'DEFEAT';

  const outcomeColor = isSolo
    ? 'text-game-accent'
    : isDraw
      ? 'text-game-accent'
      : isWinner
        ? 'text-game-accent'
        : 'text-muted';

  const timeUsedSecs = (myParticipant.totalTimeUsedMs / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="w-full max-w-md apple-glass-elevated border border-game-accent/30 rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_var(--et-shade-80),0_0_80px_var(--game-glow)] backdrop-blur-3xl relative overflow-hidden flex flex-col items-center text-center bg-gradient-to-b from-surface/95 via-well/95 to-canvas/95">
        {/* Monaco Vault Gold Shimmer */}
        <div
          className="absolute top-0 inset-x-0 h-1.5 opacity-90"
          style={{
            background: isWinner || isSolo
              ? 'linear-gradient(90deg, transparent, var(--game-accent), var(--game-accent-light), var(--game-accent), transparent)'
              : 'linear-gradient(90deg, transparent, var(--et-muted), var(--et-muted), var(--et-muted), transparent)',
          }}
        />

        {/* Outcome Header */}
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 sm:mt-2 ${isArabic ? 'font-sans' : 'font-display'} ${outcomeColor}`}>
          {outcomeTitle}
        </h2>

        {/* Big Score Display */}
        <div className="my-3 sm:my-4 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest font-stats">
            {isArabic ? 'الرصيد المضمون النهائي' : 'FINAL BANKED SCORE'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-5xl sm:text-6xl font-black font-stats text-white tracking-tighter tabular-nums">
              {myParticipant.totalBankedScore}
            </span>
            <span className="text-sm font-black font-stats text-game-accent">pts</span>
          </div>
        </div>

        {/* Tier Badge Pill */}
        <div className="flex items-center gap-2.5 bg-game-accent/10 border border-game-accent/25 px-4 py-2 rounded-2xl shadow-inner mb-4 sm:mb-5">
          {tierIcons[tierInfo.tier]}
          <div className="flex flex-col text-start">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider font-stats">
              {isArabic ? 'التصنيف المحقق' : 'ACHIEVED TIER'}
            </span>
            <span className="text-xs sm:text-sm font-black uppercase font-stats" style={{ color: tierInfo.color }}>
              {tierInfo.label[lang]}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
          {/* Correct Answers */}
          <div className="apple-glass-card border border-white/10 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
            <AppIcon icon={CheckCircle} size={18} weight="fill" className="text-success mb-0.5" />
            <span className="text-[10px] text-muted font-bold uppercase font-stats">
              {isArabic ? 'صح' : 'Correct'}
            </span>
            <span className="text-xs sm:text-sm font-black text-white font-stats tabular-nums">
              {myParticipant.totalCorrectAnswers} / {myParticipant.totalQuestionsAnswered}
            </span>
          </div>

          {/* Highest Streak */}
          <div className="apple-glass-card border border-white/10 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
            <AppIcon icon={Flame} size={18} weight="fill" className="text-game-accent mb-0.5" />
            <span className="text-[10px] text-muted font-bold uppercase font-stats">
              {isArabic ? 'أطول متتالية' : 'Best Streak'}
            </span>
            <span className="text-xs sm:text-sm font-black text-game-accent font-stats tabular-nums">
              x{myParticipant.highestStreak}
            </span>
          </div>

          {/* Time Used */}
          <div className="apple-glass-card border border-white/10 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
            <AppIcon icon={Clock} size={18} weight="duotone" className="text-info mb-0.5" />
            <span className="text-[10px] text-muted font-bold uppercase font-stats">
              {isArabic ? 'الوقت' : 'Time'}
            </span>
            <span className="text-xs sm:text-sm font-black text-white font-stats tabular-nums">{timeUsedSecs}s</span>
          </div>
        </div>

        {/* 1v1 Opponent Comparison Pill */}
        {!isSolo && opponent && (
          <div className="w-full apple-glass-card border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground truncate max-w-[120px]">{opponent.name}</span>
            </div>
            <div className="flex items-center gap-1.5 font-stats font-black text-foreground tabular-nums">
              <span className="text-game-accent">{opponent.totalBankedScore} pts</span>
              <span className="text-muted">·</span>
              <span className="text-muted">{opponent.totalCorrectAnswers} correct</span>
            </div>
          </div>
        )}

        {/* Rematch invitation banner */}
        {!isSolo && rematchGameId && (
          <div className="w-full apple-glass-card border border-game-accent/40 bg-game-accent/15 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 mb-2 sm:mb-3 shadow-[0_0_20px_var(--game-glow)] animate-pulse">
            <div className="flex items-center gap-2 text-start">
              <div className="w-8 h-8 rounded-xl bg-game-accent/25 border border-game-accent/40 flex items-center justify-center text-game-accent shrink-0">
                <AppIcon icon={Lightning} size={18} weight="fill" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-game-accent">
                  {isArabic ? 'المنافس جاهز للريماتش!' : 'Rematch Room Ready!'}
                </span>
                <span className="text-[10px] text-foreground">
                  {isArabic ? 'اضغط قبول للدخول فوراً في الماتش الجديد' : 'Tap accept to jump straight into the new match'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {onRematch && (
            <Button
              type="button"
              size="lg"
              variant={rematchState?.status === 'declined' ? 'danger' : 'gold'}
              fullWidth
              loading={isRematchPending || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted'}
              disabled={isRematchPending || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted'}
              onClick={onRematch}
              className="bg-gradient-to-r from-game-accent via-game-accent-light to-game-accent text-game-on-accent font-black shadow-lg shadow-game-accent/30 rounded-xl sm:rounded-2xl"
            >
              <AppIcon icon={rematchGameId ? Lightning : ArrowClockwise} size={18} weight="bold" />
              <span className={isArabic ? 'font-sans font-black' : 'font-display font-black'}>
                {rematchState?.status === 'accepted'
                  ? isArabic
                    ? 'جارٍ دخول ماتش الإعادة...'
                    : 'Entering Rematch...'
                  : rematchState?.status === 'pending' && rematchState.iAmInviter
                    ? isArabic
                      ? 'في انتظار موافقة المنافس...'
                      : 'Waiting for Opponent...'
                    : rematchState?.status === 'declined'
                      ? isArabic
                        ? 'رفض المنافس الإعادة (طلب مرة أخرى)'
                        : 'Opponent Declined (Try Again)'
                      : isSolo
                        ? isArabic
                          ? 'العب مرة تانية'
                          : 'Play Again'
                        : isArabic
                          ? 'طلب ريماتش (ماتش جديد)'
                          : 'Request Rematch'}
              </span>
            </Button>
          )}

          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              size="md"
              variant="secondary"
              fullWidth
              onClick={onHub}
              className="font-bold text-xs text-foreground apple-glass-card rounded-xl"
            >
              <AppIcon icon={Trophy} size={16} weight="duotone" />
              <span className={isArabic ? 'font-sans' : 'font-display'}>
                {isArabic ? 'صالة بَنِّك' : 'Bank It Hub'}
              </span>
            </Button>

            <Button
              type="button"
              size="md"
              variant="outline"
              fullWidth
              onClick={onHome}
              className="font-bold text-xs text-muted rounded-xl border-white/10 hover:border-white/20"
            >
              <AppIcon icon={House} size={16} weight="duotone" />
              <span className={isArabic ? 'font-sans' : 'font-display'}>
                {isArabic ? 'الرئيسية' : 'Home'}
              </span>
            </Button>
          </div>

          {/* Cross-Game Promo Links */}
          <div className="flex items-center justify-center gap-2 pt-1 w-full">
            <Link
              href="/rank"
              className="btn-haptic flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-game-accent/25 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
            >
              <AppIcon icon={Ranking} size={13} weight="bold" />
              <span>{isArabic ? 'تحدي رتّب' : 'Play Rank'}</span>
            </Link>
            <Link
              href="/create-room"
              className="btn-haptic flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-game-accent/25 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
            >
              <AppIcon icon={Cards} size={13} weight="bold" />
              <span>{isArabic ? 'مزاد واشتباك' : 'Snipe Auction'}</span>
            </Link>
          </div>
        </div>
      </div>
      {/* Opponent Rematch Invitation Overlay */}
      {!isSolo && rematchState?.status === 'pending' && !rematchState.iAmInviter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="apple-glass-elevated max-w-sm w-full p-6 text-center space-y-5 rounded-3xl border border-game-accent/40 shadow-[0_20px_60px_var(--game-glow)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-game-accent/40 bg-game-accent/10 text-game-accent mx-auto shadow-[0_0_24px_var(--game-glow)]">
              <AppIcon icon={UserPlus} size={32} weight="duotone" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white uppercase font-display tracking-tight">
                {isArabic ? 'دعوة لإعادة الماتش!' : 'Rematch Invitation!'}
              </h2>
              <p className="text-muted text-xs font-medium max-w-xs mx-auto leading-relaxed">
                {isArabic
                  ? `${rematchState.inviterName || 'المنافس'} يتحداك في جولة بَنِّك جديدة!`
                  : `${rematchState.inviterName || 'Your opponent'} challenges you to a Bank It Rematch!`}
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
                {isArabic ? 'قبول التحدي' : 'Accept Rematch'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={onDeclineRematch}
                leftIcon={<AppIcon icon={X} size={16} weight="bold" className="text-muted" />}
                className="text-muted hover:text-white"
              >
                {isArabic ? 'رفض' : 'Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
