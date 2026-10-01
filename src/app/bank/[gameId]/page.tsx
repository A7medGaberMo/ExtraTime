'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useBankHeartbeat } from '@/hooks/use-bank-heartbeat';
import { useI18n } from '@/lib/i18n';
import { CircularTimer } from '@/components/bank/circular-timer';
import { StreakLadder } from '@/components/bank/streak-ladder';
import { QuestionCard } from '@/components/bank/question-card';
import { BankActionControls } from '@/components/bank/bank-action-controls';
import { SpectatorArena } from '@/components/bank/spectator-arena';
import { SuddenDeathModal } from '@/components/bank/sudden-death-modal';
import { ResultsModal } from '@/components/bank/results-modal';
import { GameShell } from '@/components/game-ui';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  CircleNotch,
  SpeakerHigh,
  SpeakerSlash,
  SignOut,
  Vault,
  Flame,
  Trophy,
} from '@phosphor-icons/react';
import { sfx, isAudioMuted, toggleAudioMuted } from '@/lib/sfx';

const BANK_TOTAL_QUESTIONS = 12;
const BANK_TOTAL_SPRINT_DURATION_MS = 90_000;
const ANSWER_FEEDBACK_DELAY_MS = 800;

export default function BankArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const isArabic = lang === 'ar';

  const gameId = params.gameId as Id<'bankGames'>;
  const { guestId, sessionToken, ensureGuestId } = useGuestSession();

  // Auto-bootstrap guest session if user visits room URL directly
  useEffect(() => {
    if (!guestId) {
      void ensureGuestId();
    }
  }, [guestId, ensureGuestId]);

  // Queries
  const game = useQuery(api.bank.queries.getGame, { gameId });

  const rematchState = useQuery(
    api.bank.queries.getRematchState,
    guestId && game?.mode === 'duel_private' && game?.status === 'completed'
      ? { gameId, guestId }
      : 'skip'
  );

  useEffect(() => {
    if (rematchState?.status === 'accepted' && rematchState.rematchGameId) {
      router.push(`/bank/${rematchState.rematchGameId}`);
    }
  }, [rematchState?.status, rematchState?.rematchGameId, router]);
  const currentQuestion = useQuery(api.bank.queries.getCurrentQuestion, {
    gameId,
    guestId: guestId ?? undefined,
  });

  // Mutations
  const submitAnswer = useMutation(api.bank.mutations.submitAnswer);
  const bankPoints = useMutation(api.bank.mutations.bankPoints);
  const passQuestion = useMutation(api.bank.mutations.passQuestion);
  const handleTimeExpiry = useMutation(api.bank.mutations.handleTimeExpiry);
  const claimOpponentAbandon = useMutation(api.bank.mutations.claimOpponentAbandon);
  const forfeitMatch = useMutation(api.bank.mutations.forfeitMatch);
  const submitSuddenDeathAnswer = useMutation(api.bank.mutations.submitSuddenDeathAnswer);
  const handleSuddenDeathTimeExpiry = useMutation(api.bank.mutations.handleSuddenDeathTimeExpiry);
  const requestBankRematch = useMutation(api.bank.mutations.requestBankRematch);
  const acceptBankRematch = useMutation(api.bank.mutations.acceptBankRematch);
  const declineBankRematch = useMutation(api.bank.mutations.declineBankRematch);

  // Local UI state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isBanking, setIsBanking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const [isSubmittingSD, setIsSubmittingSD] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const isAnySubmitting = isAnswering || isBanking || isPassing;
  const [copiedCode, setCopiedCode] = useState(false);
  const [muted, setMuted] = useState(() => isAudioMuted());

  // Freeze the displayed question so it doesn't snap away instantly upon answer submission
  const [displayedQuestion, setDisplayedQuestion] = useState(currentQuestion);
  const [revealedCorrectId, setRevealedCorrectId] = useState<string | null>(null);

  if (currentQuestion && currentQuestion._id !== displayedQuestion?._id && !isAnswering) {
    setDisplayedQuestion(currentQuestion);
    setRevealedCorrectId(null);
  }

  // Heartbeat integration
  const isMatchActive = game?.status === 'in_progress' || game?.status === 'sudden_death';
  useBankHeartbeat(gameId, guestId, sessionToken, isMatchActive);

  // Sound toggle
  const handleToggleSound = () => {
    const next = toggleAudioMuted();
    setMuted(next);
  };

  // Copy code helper
  const handleCopyCode = async () => {
    if (!game?.code) return;
    try {
      await navigator.clipboard.writeText(game.code);
      setCopiedCode(true);
      sfx.tap();
      setTimeout(() => setCopiedCode(false), 2000);
      toast({ title: 'Code Copied', message: game.code, type: 'success' });
    } catch {
      // ignore
    }
  };

  // Submit Answer handler
  const handleAnswerSelect = async (optionId: string) => {
    if (!game || !guestId || isAnySubmitting || game.status !== 'in_progress') return;
    setSelectedOptionId(optionId);
    setIsAnswering(true);

    try {
      const res = await submitAnswer({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
        optionId,
      });

      if (res.expired) {
        sfx.wipeout();
        sfx.haptic('warning');
        toast({ title: "Time's Up", message: 'Run expired!', type: 'warning' });
      } else if (res.correct) {
        sfx.goal();
        sfx.haptic('success');
        setRevealedCorrectId(res.correctOptionId || optionId);
      } else {
        sfx.wipeout();
        sfx.haptic('error');
        setRevealedCorrectId(res.correctOptionId || null);
      }
      
      // Delay so the user can see the outcome (green/red flash) before moving to next question
      await new Promise((resolve) => setTimeout(resolve, ANSWER_FEEDBACK_DELAY_MS));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit answer';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setSelectedOptionId(null);
      setIsAnswering(false);
    }
  };

  // Bank Points handler
  const handleBank = async () => {
    if (!game || !guestId || isAnySubmitting || game.status !== 'in_progress') return;
    setIsBanking(true);
    try {
      const res = await bankPoints({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      if (res.banked && res.banked > 0) {
        sfx.bank();
        sfx.haptic('success');
        toast({
          title: isArabic ? 'تم التبنيك!' : 'Points Banked!',
          message: isArabic ? `+${res.banked} نقطة مضمونة` : `+${res.banked} points secured!`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to bank';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsBanking(false);
    }
  };

  // Pass Question handler
  const handlePass = async () => {
    if (!game || !guestId || isAnySubmitting || game.status !== 'in_progress') return;
    setIsPassing(true);
    try {
      await passQuestion({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      sfx.tap();
      sfx.haptic('warning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to pass';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsPassing(false);
    }
  };

  // Timer Expiration handler (fired when countdown reaches 0)
  const handleCountdownExpire = async () => {
    if (!game || !guestId || game.status !== 'in_progress') return;
    try {
      await handleTimeExpiry({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
        expectedRound: game.currentRound,
        expectedTurnPlayerIndex: game.activeTurnPlayerIndex,
      });
    } catch {
      // fallback handled by authoritative server scheduler
    }
  };

  // Claim Abandonment Victory
  const handleClaimVictory = async () => {
    if (!game || !guestId) return;
    try {
      await claimOpponentAbandon({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      sfx.victory();
      sfx.haptic('success');
      toast({
        title: isArabic ? 'فوز بالانسحاب!' : 'Victory by Forfeit!',
        message: isArabic ? 'المنافس غير متصل' : 'Opponent disconnected',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      toast({ title: 'Notice', message: msg, type: 'info' });
    }
  };

  // Forfeit Match
  const handleForfeit = async () => {
    if (!game || !guestId) return;
    const confirmMsg = isArabic
      ? 'هل أنت متأكد من الانسحاب من الماتش؟'
      : 'Are you sure you want to forfeit this match?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await forfeitMatch({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      router.push('/bank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to forfeit';
      toast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  // Sudden Death answer handler
  const handleSuddenDeathSelect = async (optionId: string) => {
    if (!game || !guestId || game.status !== 'sudden_death' || isSubmittingSD || !isSuddenDeathTurn) return;
    setIsSubmittingSD(true);
    setSelectedOptionId(optionId);
    try {
      const res = await submitSuddenDeathAnswer({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
        optionId,
      });
      if (res.winner) {
        if (res.winner === guestId) {
          sfx.victory();
        } else {
          sfx.runnerUp();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Shootout error';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmittingSD(false);
      setSelectedOptionId(null);
    }
  };

  // Sudden Death 15s Timer Expiry
  const handleSuddenDeathExpire = async () => {
    if (!game || !guestId || game.status !== 'sudden_death') return;
    try {
      await handleSuddenDeathTimeExpiry({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
        expectedPairIndex: game.suddenDeathState?.pairIndex ?? 1,
        expectedTurnPlayerIndex: game.activeTurnPlayerIndex,
      });
    } catch {
      // Server authoritative scheduler provides fallback
    }
  };

  // Unified Rematch action (creates linked rematch room or joins pending challenge)
  const handleRematch = async () => {
    if (!game || !guestId || isRematching) return;
    setIsRematching(true);
    try {
      const res = await requestBankRematch({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      if (isSolo) {
        router.push(`/bank/${res.gameId}`);
      } else {
        toast({
          title: isArabic ? 'تم إرسال الدعوة' : 'Rematch Sent',
          message: isArabic ? 'في انتظار موافقة المنافس...' : 'Waiting for opponent to accept...',
          type: 'info',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rematch failed';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsRematching(false);
    }
  };

  const handleAcceptRematch = async () => {
    if (!game || !guestId || isRematching) return;
    setIsRematching(true);
    try {
      const res = await acceptBankRematch({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      if (res?.gameId) {
        router.push(`/bank/${res.gameId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept rematch';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsRematching(false);
    }
  };

  const handleDeclineRematch = async () => {
    if (!game || !guestId) return;
    try {
      await declineBankRematch({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
      toast({
        title: isArabic ? 'تم الرفض' : 'Declined',
        message: isArabic ? 'تم رفض طلب الإعادة' : 'Rematch declined',
        type: 'info',
      });
    } catch {
      // silent
    }
  };

  // Loading Screen
  if (game === undefined) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="apple-glass-card rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center max-w-sm border border-white/12 shadow-2xl">
          <AppIcon icon={CircleNotch} size={36} className="text-game-accent animate-spin" />
          <span className="text-sm font-semibold text-foreground">
            {isArabic ? 'جاري تجهيز صالة بَنِّك...' : 'Entering Bank It Arena...'}
          </span>
        </div>
      </div>
    );
  }

  // Not Found Screen
  if (!game) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="apple-glass-card rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center max-w-sm border border-white/12 shadow-2xl">
          <h2 className="text-xl font-bold text-white">
            {isArabic ? 'الماتش مش موجود أو انتهى' : 'Match Not Found'}
          </h2>
          <Button
            variant="gold"
            onClick={() => router.push('/bank')}
            className="bg-gradient-to-r from-game-accent via-game-accent-light to-game-accent text-game-on-accent font-black shadow-lg shadow-game-accent/30 rounded-2xl"
          >
            <span>{isArabic ? 'الرجوع لصالة بَنِّك' : 'Back to Bank It Hub'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // Participants resolution
  const isSolo = game.mode === 'solo';
  const myParticipant =
    game.participants.find((p) => p.guestId === guestId) || game.participants[0];
  const opponent = game.participants.find((p) => p.guestId !== guestId);

  const isMyTurn =
    isSolo || game.participants[game.activeTurnPlayerIndex]?.guestId === guestId;

  const isSuddenDeathTurn =
    game.status === 'sudden_death' &&
    game.participants[game.activeTurnPlayerIndex]?.guestId === guestId;

  // --- LOBBY WAITING SCREEN ---
  if (game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-canvas text-white p-4 sm:p-6 flex flex-col items-center justify-center animate-fade-in">
        <div className="apple-glass-elevated w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/18 shadow-[0_24px_50px_var(--et-shade-70)] backdrop-blur-3xl flex flex-col items-center text-center relative overflow-hidden space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-game-accent/15 border border-game-accent/30 flex items-center justify-center text-game-accent shadow-[0_0_30px_var(--game-glow)]">
            <AppIcon icon={Users} size={32} weight="duotone" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isArabic ? 'في انتظار المنافس...' : 'Waiting for Challenger...'}
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xs leading-relaxed">
            {isArabic
              ? 'شارك كود الروم مع صاحبك أو استنى منافس يدخل عبر الطابور العام.'
              : 'Share this 6-character room code with your rival to begin the duel.'}
          </p>

          {/* Room Code Box */}
          <div className="w-full apple-glass-card border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner my-2">
            <div className="flex flex-col text-start">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                {isArabic ? 'كود الروم' : 'ROOM CODE'}
              </span>
              <span className="text-2xl font-mono font-black text-game-accent tracking-widest">
                {game.code}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="gap-1.5 rounded-xl border-white/15"
            >
              {copiedCode ? (
                <>
                  <AppIcon icon={Check} size={16} weight="bold" className="text-success" />
                  <span className="text-success">{isArabic ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <AppIcon icon={Copy} size={16} weight="bold" />
                  <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                </>
              )}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleForfeit}
            className="text-muted hover:text-danger transition-colors"
          >
            <span>{isArabic ? 'إلغاء الروم والرجوع' : 'Cancel Lobby'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // --- ACTIVE GAMEPLAY ARENA ---
  return (
    <GameShell
      game="bank"
      className="selection:bg-game-accent selection:text-game-on-accent"
      bodyClassName="flex flex-col"
      header={
        /* 🧭 Top Unified Navigation & HUD Header — Fixed 56px/64px single-line rhythm */
      <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-xl border-b border-game-accent/20 px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 select-none shrink-0">
        {/* Left: Back & Question / Round info */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/bank')}
            className="btn-haptic w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label={t('common.back')}
          >
            <AppIcon icon={ArrowLeft} size={16} weight="bold" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-game-accent/15 border border-game-accent/30 items-center justify-center text-game-accent shrink-0 shadow-[0_0_12px_var(--game-glow)]">
              <AppIcon icon={Vault} size={18} weight="duotone" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className={`text-xs sm:text-sm font-black tracking-wide text-white ${isArabic ? 'font-sans' : 'font-display'}`}>
                  {isArabic ? 'بَنِّك' : 'BANK IT'}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-game-accent font-stats tabular-nums shrink-0">
                  {Math.min(game.currentQuestionIndex + 1, BANK_TOTAL_QUESTIONS)}/{BANK_TOTAL_QUESTIONS}
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium hidden xs:inline-block truncate">
                {isSolo
                  ? isArabic
                    ? 'تحدي الـ 90 ثانية'
                    : '90s Solo Sprint'
                  : isArabic
                    ? `جولة ${game.currentRound}/2`
                    : `Round ${game.currentRound}/2`}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Banked Score & Pot Counters */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Safe Banked Score */}
          <div className="apple-glass-card flex items-center gap-1 sm:gap-1.5 border border-game-accent/30 bg-game-accent/10 px-2 sm:px-3 py-1 rounded-xl shadow-inner shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-game-accent uppercase hidden xs:inline font-stats">
              {isArabic ? 'المضمون' : 'Banked'}
            </span>
            <span className="text-xs sm:text-sm font-black font-stats text-white tabular-nums">
              {myParticipant.totalBankedScore} <span className="text-[9px] sm:text-[10px] text-game-accent font-sans">pts</span>
            </span>
          </div>

          {/* If Duel: Opponent Score */}
          {!isSolo && opponent && (
            <div className="apple-glass-card flex items-center gap-1 sm:gap-1.5 border border-white/10 bg-surface/60 px-2 sm:px-3 py-1 rounded-xl text-foreground shrink-0">
              <span className="text-[9px] sm:text-[10px] text-muted hidden md:inline truncate max-w-[80px]">{opponent.name}</span>
              <span className="text-xs sm:text-sm font-black font-stats text-game-accent tabular-nums">
                {opponent.totalBankedScore} pts
              </span>
            </div>
          )}

          {/* Live At-Risk Pot (glowing gold pill if unbankedPoints > 0) */}
          {game.unbankedPoints > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 border border-game-accent/50 bg-game-accent/20 px-2 sm:px-2.5 py-1 rounded-xl shadow-[0_0_15px_var(--game-glow)] animate-pulse text-game-accent shrink-0">
              <AppIcon icon={Flame} size={13} weight="fill" className="text-game-accent shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase hidden sm:inline font-stats">
                {isArabic ? 'معلق' : 'Pot'}
              </span>
              <span className="text-xs sm:text-sm font-black font-stats tabular-nums">
                +{game.unbankedPoints}
              </span>
            </div>
          )}
        </div>

        {/* Right: Circular Timer & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {game.runDeadline && (
            <div className="shrink-0">
              <CircularTimer
                deadline={game.runDeadline}
                totalDurationMs={BANK_TOTAL_SPRINT_DURATION_MS}
                size={38}
                strokeWidth={3}
                onExpire={handleCountdownExpire}
              />
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              className="btn-haptic w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <AppIcon icon={SpeakerSlash} size={15} weight="bold" />
              ) : (
                <AppIcon icon={SpeakerHigh} size={15} weight="bold" />
              )}
            </button>

            {!isSolo && (
              <button
                type="button"
                onClick={handleForfeit}
                title={isArabic ? 'انسحاب' : 'Forfeit'}
                aria-label={isArabic ? 'انسحاب' : 'Forfeit'}
                className="btn-haptic w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-danger/10 border border-danger/25 flex items-center justify-center text-danger hover:bg-danger/20 transition-colors cursor-pointer shrink-0"
              >
                <AppIcon icon={SignOut} size={15} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </header>
      }
    >

      {/* 🏟️ Main Pitch Content — Exact Same Invariant max-w-md Frame as Rank */}
      <main className="max-w-md mx-auto w-full px-3 py-2 sm:px-4 sm:py-3 flex flex-col justify-center gap-2 sm:gap-2.5 flex-1 min-h-0 select-none">
        {/* CASE 1: Opponent Turn (Render Live Spectator Arena) */}
        {!isSolo && !isMyTurn && opponent ? (
          <SpectatorArena
            opponent={opponent}
            currentRound={game.currentRound}
            runDeadline={game.runDeadline}
            currentQuestionIndex={game.currentQuestionIndex}
            currentStreak={game.currentStreak}
            unbankedPoints={game.unbankedPoints}
            lastAction={game.lastAction}
            currentQuestion={currentQuestion}
            lang={lang}
            onClaimVictory={handleClaimVictory}
          />
        ) : (
          /* CASE 2: My Active Turn (Render Active Runner Controls) */
          <div className="w-full flex flex-col gap-2 sm:gap-2.5 min-h-0">
            {/* 🎯 Prominent Apple-Style Duel Turn Capsule */}
            {!isSolo && opponent && (
              <div className="w-full bg-gradient-to-r from-game-accent/15 via-game-accent/25 to-game-accent/15 border border-game-accent/40 rounded-2xl px-3 sm:px-3.5 py-1.5 flex items-center justify-between shadow-[0_0_20px_var(--game-glow)] animate-fade-in shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-game-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-game-accent" />
                  </span>
                  <span className={`text-xs sm:text-sm font-black text-game-accent tracking-wide ${isArabic ? 'font-sans' : 'font-display'}`}>
                    {isArabic ? `🎯 دورك الآن · الجولة ${game.currentRound}/2` : `🎯 YOUR TURN · Round ${game.currentRound}/2`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-stats font-bold text-white">
                  {myParticipant.totalBankedScore > opponent.totalBankedScore ? (
                    <span className="text-game-accent bg-game-accent/15 border border-game-accent/30 px-2 py-0.5 rounded-full">
                      {isArabic
                        ? `متقدم بـ +${myParticipant.totalBankedScore - opponent.totalBankedScore}`
                        : `Leading by +${myParticipant.totalBankedScore - opponent.totalBankedScore}`}
                    </span>
                  ) : myParticipant.totalBankedScore < opponent.totalBankedScore ? (
                    <span className="text-game-accent-light bg-game-accent/20 border border-game-accent/40 px-2 py-0.5 rounded-full">
                      {isArabic
                        ? `تحتاج +${opponent.totalBankedScore - myParticipant.totalBankedScore + 1} للتفوق`
                        : `Need +${opponent.totalBankedScore - myParticipant.totalBankedScore + 1} to lead`}
                    </span>
                  ) : (
                    <span className="text-foreground bg-white/10 px-2 py-0.5 rounded-full">
                      {isArabic ? 'النتيجة متعادلة' : 'Tied Score'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top Multiplier Rail */}
            <div className="w-full shrink-0">
              <StreakLadder
                currentStreak={game.currentStreak}
                unbankedPoints={game.unbankedPoints}
                bankedPoints={myParticipant.totalBankedScore}
                variant="horizontal"
                lang={lang}
              />
            </div>

            {/* Active Question Card OR Sprint Complete Final Bank Phase */}
            {game.currentQuestionIndex >= BANK_TOTAL_QUESTIONS ? (
              <div className="w-full max-w-md mx-auto h-[290px] min-h-[290px] max-h-[290px] sm:h-[300px] sm:min-h-[300px] sm:max-h-[300px] apple-glass-elevated rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-game-accent/30 bg-gradient-to-b from-surface/95 via-well/95 to-canvas/95 shadow-[0_16px_36px_var(--et-shade-60),0_0_40px_var(--game-glow)] flex flex-col items-center justify-between text-center relative overflow-hidden select-none animate-fade-in shrink-0">
                {/* Monaco Vault Gold Ambient Top Shimmer */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-game-accent to-transparent" />
                
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-game-accent/20 border border-game-accent/40 flex items-center justify-center text-game-accent shadow-[0_0_24px_var(--game-glow)] animate-bounce shrink-0 mt-0.5">
                  <AppIcon icon={Trophy} size={24} weight="fill" />
                </div>

                <div className="space-y-1 max-w-sm px-2">
                  <h3 className={`text-sm sm:text-base font-black text-game-accent tracking-tight ${isArabic ? 'font-sans' : 'font-display'}`}>
                    {isArabic ? 'أكملت جميع الـ 12 سؤال بنجاح!' : 'ALL 12 QUESTIONS COMPLETED!'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-foreground leading-snug">
                    {isArabic
                      ? 'تم تأمين رصيدك ونقاطك تلقائياً بنجاح!'
                      : 'All questions answered! Your score has been automatically secured.'}
                  </p>
                </div>

                <div className="w-full flex flex-col items-center gap-1.5 mb-0.5">
                  {game.unbankedPoints > 0 ? (
                    <>
                      <div className="flex items-center gap-2 bg-game-accent/15 border border-game-accent/40 px-3.5 py-1 rounded-xl shadow-[0_0_20px_var(--game-glow)]">
                        <AppIcon icon={Flame} size={15} weight="fill" className="text-game-accent animate-pulse" />
                        <span className="text-[11px] sm:text-xs font-bold text-game-accent">
                          {isArabic ? 'نقاط معلقة:' : 'Unbanked Pot:'}
                        </span>
                        <span className="text-xs sm:text-sm font-black font-stats text-game-accent tabular-nums">
                          +{game.unbankedPoints} pts
                        </span>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        variant="gold"
                        onClick={handleBank}
                        loading={isBanking}
                        className="w-full max-w-xs min-h-[40px] sm:min-h-[44px] bg-gradient-to-r from-game-accent via-game-accent-light to-game-accent text-game-on-accent font-black shadow-[0_0_30px_var(--game-glow)] rounded-xl sm:rounded-2xl animate-pulse cursor-pointer"
                      >
                        <AppIcon icon={Vault} size={17} weight="duotone" />
                        <span className={isArabic ? 'font-sans font-black text-xs sm:text-sm' : 'font-display font-black text-xs sm:text-sm'}>
                          {isArabic ? `بَنِّك +${game.unbankedPoints} نقطة فوراً` : `BANK +${game.unbankedPoints} PTS NOW`}
                        </span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-game-accent font-bold text-xs bg-game-accent/10 border border-game-accent/20 px-3 py-1.5 rounded-xl">
                      <AppIcon icon={Check} size={15} weight="bold" />
                      <span>{isArabic ? 'تم تأمين جميع النقاط تلقائياً' : 'All Points Auto-Banked & Secured'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : displayedQuestion ? (
              <div className="w-full max-w-md mx-auto h-[290px] min-h-[290px] max-h-[290px] sm:h-[300px] sm:min-h-[300px] sm:max-h-[300px] shrink-0">
                <QuestionCard
                  questionText={displayedQuestion.question}
                  options={displayedQuestion.options}
                  type={displayedQuestion.type}
                  category={displayedQuestion.category}
                  lang={lang}
                  onSelectOption={handleAnswerSelect}
                  selectedOptionId={selectedOptionId}
                  correctOptionId={revealedCorrectId}
                  disabled={isAnySubmitting}
                />
              </div>
            ) : (
              <div className="w-full max-w-md mx-auto h-[290px] min-h-[290px] max-h-[290px] sm:h-[300px] sm:min-h-[300px] sm:max-h-[300px] apple-glass-elevated rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-white/10 bg-surface/60 shadow-[0_16px_36px_var(--et-shade-60)] backdrop-blur-3xl flex flex-col items-center justify-center gap-3 shrink-0 animate-pulse">
                <AppIcon icon={CircleNotch} size={28} className="text-game-accent animate-spin" />
                <span className="text-xs font-semibold text-muted">
                  {isArabic ? 'جاري تجهيز السؤال...' : 'Loading question...'}
                </span>
              </div>
            )}

              {/* Action Buttons: BANK & PASS */}
              <div className="w-full shrink-0">
                <BankActionControls
                  unbankedPoints={game.unbankedPoints}
                  currentStreak={game.currentStreak}
                  isSprintComplete={game.currentQuestionIndex >= 12}
                  onBank={handleBank}
                  onPass={handlePass}
                  isBanking={isBanking}
                  isPassing={isPassing}
                  isSubmitting={isAnySubmitting}
                  disabled={game.status !== 'in_progress' || !isMyTurn}
                  lang={lang}
                />
              </div>
            </div>
        )}
      </main>

      {/* ⚡ Sudden Death Shootout Modal */}
      <SuddenDeathModal
        isOpen={game.status === 'sudden_death'}
        pairIndex={game.suddenDeathState?.pairIndex ?? 1}
        deadline={game.suddenDeathDeadline}
        question={displayedQuestion}
        isMyTurn={isSuddenDeathTurn}
        isSubmitting={isSubmittingSD}
        onSelectOption={handleSuddenDeathSelect}
        onExpire={handleSuddenDeathExpire}
        selectedOptionId={selectedOptionId}
        lang={lang}
      />

      {/* 🏆 Post-Game Results Modal */}
      <ResultsModal
        isOpen={game.status === 'completed'}
        isSolo={isSolo}
        winnerId={game.winnerId}
        isDraw={game.isDraw}
        myParticipant={myParticipant}
        opponent={opponent}
        rematchGameId={game.rematchGameId}
        isRematchPending={isRematching}
        onRematch={handleRematch}
        onHome={() => router.push('/')}
        onHub={() => router.push('/bank')}
        lang={lang}
        rematchState={rematchState}
        onAcceptRematch={handleAcceptRematch}
        onDeclineRematch={handleDeclineRematch}
      />
    </GameShell>
  );
}
