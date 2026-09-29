'use client';

import React, { useEffect, useState } from 'react';
import { BankAction, BankParticipant, BankQuestionOption } from '@/types/bank';
import { CircularTimer } from './circular-timer';
import { StreakLadder } from './streak-ladder';
import { QuestionCard } from './question-card';
import { Button } from '@/components/ui/button';
import { UserIdentity } from '@/components/ui/user-identity';
import { Broadcast, Warning, Trophy } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { sfx } from '@/lib/sfx';

interface SpectatorArenaProps {
  opponent: BankParticipant;
  currentRound: number;
  runDeadline?: number;
  currentQuestionIndex: number;
  currentStreak: number;
  unbankedPoints: number;
  lastAction?: BankAction;
  currentQuestion?: {
    _id?: string;
    question: { en: string; ar: string };
    options: BankQuestionOption[];
    type: 'mcq' | 'tf';
    category?: string;
    difficulty: 'easy' | 'medium' | 'hard';
  } | null;
  lang: 'ar' | 'en';
  onClaimVictory: () => void;
}

export function SpectatorArena({
  opponent,
  currentRound,
  runDeadline,
  currentQuestionIndex,
  currentStreak,
  unbankedPoints,
  lastAction,
  currentQuestion,
  lang,
  onClaimVictory,
}: SpectatorArenaProps) {
  const isArabic = lang === 'ar';
  const [secondsDisconnected, setSecondsDisconnected] = useState(0);

  // Smooth Spectator Question State to allow viewers to see answer outcome before advancing
  const [displayedQuestion, setDisplayedQuestion] = useState(currentQuestion);
  const [revealedSelection, setRevealedSelection] = useState<string | null>(null);
  const [revealedCorrect, setRevealedCorrect] = useState<string | null>(null);

  useEffect(() => {
    if (currentQuestion && currentQuestion._id !== displayedQuestion?._id) {
      if (lastAction && displayedQuestion && lastAction.questionId === displayedQuestion._id) {
        // Show opponent's answer outcome on the current question for 1000ms
        const revealTimer = setTimeout(() => {
          setRevealedSelection(lastAction.selectedOptionId || null);
          setRevealedCorrect(lastAction.correctOptionId || null);
        }, 0);

        const transitionTimer = setTimeout(() => {
          setDisplayedQuestion(currentQuestion);
          setRevealedSelection(null);
          setRevealedCorrect(null);
        }, 1000);

        return () => {
          clearTimeout(revealTimer);
          clearTimeout(transitionTimer);
        };
      } else {
        const timer = setTimeout(() => {
          setDisplayedQuestion(currentQuestion);
          setRevealedSelection(null);
          setRevealedCorrect(null);
        }, 0);
        return () => clearTimeout(timer);
      }
    } else if (!displayedQuestion && currentQuestion) {
      const timer = setTimeout(() => {
        setDisplayedQuestion(currentQuestion);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, displayedQuestion, lastAction]);

  // Monitor opponent headless heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = now - opponent.lastPingAt;
      setSecondsDisconnected(Math.floor(diffMs / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [opponent.lastPingAt]);

  // Play audio effects when opponent performs actions
  useEffect(() => {
    if (!lastAction) return;
    if (lastAction.type === 'bank') {
      sfx.bank();
      sfx.haptic('medium');
    } else if (lastAction.type === 'wrong') {
      sfx.wipeout();
    } else if (lastAction.type === 'correct') {
      sfx.goal();
    } else if (lastAction.type === 'pass') {
      sfx.tap();
    }
  }, [lastAction]);

  const isDisconnected = secondsDisconnected >= 10;
  const canClaimAbandon = secondsDisconnected >= 30;
  const isSprintComplete = currentQuestionIndex >= 12;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-2 sm:gap-2.5 animate-fade-in select-none">
      {/* 📺 Integrated Luxury Broadcast Header Capsule */}
      <div className="w-full bg-gradient-to-r from-slate-900/95 via-[#0a0e17]/95 to-slate-900/95 border border-gold/30 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(229,184,66,0.12)] shrink-0">
        {/* Left: Opponent Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <UserIdentity nickname={opponent.name} size="sm" showAvatarOnly />
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                {opponent.name}
              </span>
              <span className="text-[10px] font-black text-gold bg-gold/15 px-1.5 py-0.5 rounded font-stats tabular-nums">
                {opponent.totalBankedScore} pts
              </span>
            </div>
            <span className="text-[9.5px] text-steel font-stats">
              {isArabic
                ? `الجولة ${currentRound}/2 · س${Math.min(currentQuestionIndex + 1, 12)}/12`
                : `Round ${currentRound}/2 · Q${Math.min(currentQuestionIndex + 1, 12)}/12`}
            </span>
          </div>
        </div>

        {/* Right: Opponent Timer & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-wider font-stats bg-gold/10 border border-gold/25 px-2 py-0.5 rounded-full">
            <AppIcon icon={Broadcast} size={11} weight="fill" className="text-gold" />
            <span>{isArabic ? 'بث مباشر' : 'LIVE'}</span>
          </span>
          {runDeadline && (
            <CircularTimer deadline={runDeadline} totalDurationMs={90_000} size={36} strokeWidth={3} />
          )}
        </div>
      </div>

      {/* 🎯 Real-Time Opponent Action Feedback Toast */}
      <div
        className={`w-full px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs font-bold shadow-sm transition-all shrink-0 ${
          lastAction?.type === 'correct'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : lastAction?.type === 'wrong'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : lastAction?.type === 'bank'
                ? 'bg-gold/20 border-gold/40 text-gold shadow-[0_0_16px_rgba(229,184,66,0.25)]'
                : 'bg-white/[0.03] border-white/10 text-slate-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <span>
            {lastAction?.type === 'correct' && '✅'}
            {lastAction?.type === 'wrong' && '💥'}
            {lastAction?.type === 'bank' && '🏦'}
            {lastAction?.type === 'pass' && '⏭️'}
            {!lastAction && '💬'}
          </span>
          <span className="truncate">
            {lastAction?.type === 'correct'
              ? isArabic
                ? 'إجابة صحيحة من المنافس!'
                : 'Opponent answered correctly!'
              : lastAction?.type === 'wrong'
                ? isArabic
                  ? 'إجابة خاطئة! فقد المنافس السلسلة المعلقة'
                  : 'Opponent answered wrong! Pot lost.'
                : lastAction?.type === 'bank'
                  ? isArabic
                    ? `المنافس بَنَّك رصيده (+${lastAction.pointsEarned ?? 0} نقطة)!`
                    : `Opponent banked points (+${lastAction.pointsEarned ?? 0} pts)!`
                  : lastAction?.type === 'pass'
                    ? isArabic
                      ? 'المنافس تخطى السؤال'
                      : 'Opponent passed question'
                    : isArabic
                      ? 'المنافس يفكر في السؤال الحالي...'
                      : 'Opponent is analyzing question...'}
          </span>
        </span>
        {lastAction?.pointsEarned !== undefined && lastAction.pointsEarned > 0 && (
          <span className="font-stats font-black text-gold tabular-nums shrink-0">
            +{lastAction.pointsEarned} pts
          </span>
        )}
      </div>

      {/* Disconnection Warning Banner */}
      {isDisconnected && (
        <div className="w-full bg-gold/15 border border-gold/30 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-gold text-xs font-medium animate-pulse shrink-0">
          <div className="flex items-center gap-2">
            <AppIcon icon={Warning} size={16} weight="bold" className="shrink-0 text-gold" />
            <span>
              {isArabic
                ? `اتصال المنافس مهزوز (انقطاع منذ ${secondsDisconnected}ث)`
                : `Opponent offline (${secondsDisconnected}s)`}
            </span>
          </div>

          {canClaimAbandon && (
            <Button
              type="button"
              size="sm"
              variant="gold"
              onClick={onClaimVictory}
              className="font-bold text-xs h-7 px-2.5"
            >
              <AppIcon icon={Trophy} size={13} weight="fill" />
              <span>{isArabic ? 'المطالبة بالفوز' : 'Claim Victory'}</span>
            </Button>
          )}
        </div>
      )}

      {/* Opponent's Live Streak Ladder */}
      <div className="w-full shrink-0">
        <StreakLadder
          currentStreak={currentStreak}
          unbankedPoints={unbankedPoints}
          bankedPoints={opponent.totalBankedScore}
          lang={lang}
        />
      </div>

      {/* Live Question Card OR Opponent Completed Sprint Card */}
      {isSprintComplete ? (
        <div className="w-full max-w-md mx-auto h-[295px] min-h-[295px] max-h-[295px] sm:h-[305px] sm:min-h-[305px] sm:max-h-[305px] apple-glass-elevated rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-gold/30 bg-gradient-to-b from-slate-900/95 via-[#0b0f19]/95 to-slate-950/95 shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_40px_rgba(229,184,66,0.2)] flex flex-col items-center justify-between text-center relative overflow-hidden select-none shrink-0 animate-fade-in">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_20px_rgba(229,184,66,0.3)] animate-pulse shrink-0 mt-0.5">
            <AppIcon icon={Trophy} size={24} weight="fill" />
          </div>

          <div className="space-y-1 px-2">
            <h3 className={`text-sm sm:text-base font-black text-gold tracking-wide ${isArabic ? 'font-sans' : 'font-display'}`}>
              {isArabic ? 'المنافس أكمل جميع الأسئلة الـ 12!' : 'Opponent Completed All 12 Questions!'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
              {isArabic
                ? 'في انتظار قرار المنافس: هل يبَنِّك ويثبت رصيده قبل انتهاء الـ 90 ثانية؟'
                : 'Waiting for their decision: Will they bank to lock in their score before time runs out?'}
            </p>
          </div>

          {unbankedPoints > 0 && (
            <div className="flex items-center gap-2 bg-gold/15 border border-gold/40 px-3.5 py-1.5 rounded-xl shadow-sm mb-0.5">
              <span className="text-[11px] sm:text-xs font-bold text-gold">
                {isArabic ? 'نقاط في خطر:' : 'At-Risk Pot:'}
              </span>
              <span className="text-xs sm:text-sm font-black font-stats text-gold tabular-nums">
                +{unbankedPoints} pts
              </span>
            </div>
          )}
        </div>
      ) : displayedQuestion ? (
        <QuestionCard
          questionText={displayedQuestion.question}
          options={displayedQuestion.options}
          type={displayedQuestion.type}
          category={displayedQuestion.category}
          difficulty={displayedQuestion.difficulty}
          lang={lang}
          disabled={true}
          isSpectating={true}
          selectedOptionId={revealedSelection}
          correctOptionId={revealedCorrect}
        />
      ) : (
        <div className="w-full max-w-md mx-auto h-[295px] min-h-[295px] max-h-[295px] sm:h-[305px] sm:min-h-[305px] sm:max-h-[305px] apple-glass-elevated rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-white/10 bg-slate-900/60 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-3xl flex flex-col items-center justify-center gap-3 shrink-0 animate-pulse text-center text-slate-400 text-xs sm:text-sm">
          <AppIcon icon={Broadcast} size={28} className="text-gold animate-pulse" />
          <span>{isArabic ? 'المنافس يجهز للبدء...' : 'Opponent is preparing for challenge...'}</span>
        </div>
      )}
    </div>
  );
}
