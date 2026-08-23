'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import { useGuestSession } from '@/hooks/use-guest-session';
import { RankHeader } from '@/components/rank/rank-header';
import { RankCardList } from '@/components/rank/rank-card-list';
import { RankRevealView } from '@/components/rank/rank-reveal-view';
import { RankDuelResult } from '@/components/rank/rank-duel-result';
import {
  CircleNotch,
  Copy,
  Check,
  Users,
  ArrowLeft,
  Clock,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';

interface RankParticipant {
  guestId: Id<'guestUsers'>;
  name: string;
  avatarSeed: string;
  totalScore: number;
  hasSubmittedCurrentRound: boolean;
  roundScores?: number[];
}

interface RankAnswerItem {
  answerKey: string;
  name: { en: string; ar: string } | string;
  value?: number;
  valueLabel?: { en: string; ar: string } | string;
}

export default function RankArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { lang, t } = useI18n();
  const { guestId, sessionToken } = useGuestSession();


  const gameId = params.gameId as Id<'rankGames'>;

  const gameState = useQuery(
    api.rank.queries.getGameState,
    guestId ? { gameId, guestId, locale: lang } : 'skip',
  );

  const submitRoundMutation = useMutation(api.rank.mutations.submitRound);
  const advanceRoundMutation = useMutation(api.rank.mutations.advanceRound);
  const createSoloMutation = useMutation(api.rank.mutations.createSoloGame);

  const [customOrder, setCustomOrder] = useState<string[] | null>(null);
  const [syncedRound, setSyncedRound] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-round 3-second reveal state
  const [introSecondsLeft, setIntroSecondsLeft] = useState<number | null>(null);

  // Calculate default order from gameState
  const defaultOrder = React.useMemo(() => {
    if (gameState?.question?.answers) {
      return (gameState.question.answers as RankAnswerItem[]).map((a) => a.answerKey);
    }
    return [];
  }, [gameState?.question?.answers]);

  // Synchronize when round changes
  if (gameState && gameState.currentRoundIndex !== syncedRound) {
    setSyncedRound(gameState.currentRoundIndex);
    setCustomOrder(null);
    setIntroSecondsLeft(3);
  }

  const currentOrder = customOrder ?? defaultOrder;

  // Intro reveal countdown timer
  useEffect(() => {
    if (introSecondsLeft === null || introSecondsLeft <= 0) return;

    const timer = setTimeout(() => {
      setIntroSecondsLeft((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [introSecondsLeft]);

  if (!guestId || gameState === undefined) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
        <span className="text-xs font-black uppercase text-steel font-stats">{t('common.loading')}</span>
      </div>
    );
  }

  if (gameState === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Panel variant="highlight" className="max-w-sm p-6 text-center space-y-4">
          <h2 className="text-xl font-black text-white uppercase">Room Not Found</h2>
          <p className="text-xs text-steel">This game session has expired or does not exist.</p>
          <Button variant="primary" size="md" fullWidth onClick={() => router.push('/rank')}>
            Back to Rank Hub
          </Button>
        </Panel>
      </div>
    );
  }

  const isDuel = gameState.mode === 'duel_private' || gameState.mode === 'duel_public';
  const participants = (gameState.participants as RankParticipant[]) || [];
  const userParticipant = participants.find((p) => p.guestId === guestId);
  const opponentParticipant = participants.find((p) => p.guestId !== guestId);
  const hasSubmitted = userParticipant?.hasSubmittedCurrentRound ?? false;

  async function handleSubmitRanking() {
    if (isSubmitting || hasSubmitted || !guestId) return;
    setIsSubmitting(true);
    try {
      await submitRoundMutation({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
        submittedOrder: currentOrder,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Failed to submit ranking', 'error');
    } finally {

      setIsSubmitting(false);
    }
  }

  async function handleAdvance() {
    if (isAdvancing || !guestId) return;
    setIsAdvancing(true);
    try {
      await advanceRoundMutation({
        gameId,
        guestId,
        sessionToken: sessionToken ?? undefined,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Failed to advance', 'error');
    } finally {
      setIsAdvancing(false);
    }
  }

  async function handlePlayAgain() {
    if (!guestId || !gameState) return;
    try {
      const result = await createSoloMutation({
        guestId,
        sessionToken: sessionToken ?? undefined,
        roundCount: (gameState.roundCount || 3) as 3 | 5,
      });
      router.push(`/rank/${result.gameId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Failed to create new game', 'error');
    }
  }

  function handleCopyCode() {
    if (gameState?.code && navigator.clipboard) {
      navigator.clipboard.writeText(gameState.code);
      setCopied(true);
      toast('Room code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ── 1. WAITING LOBBY (Duel Mode) ──────────────────────────────────
  if (gameState.status === 'waiting') {
    return (
      <article className="animate-fade-in mx-auto flex max-w-lg flex-col items-center gap-6 px-3 py-8 text-center select-none">
        <Panel variant="highlight" className="p-6 sm:p-8 w-full space-y-5">
          <div className="space-y-2">
            <StatPill
              variant="lime"
              size="sm"
              icon={<AppIcon icon={Users} size={14} weight="duotone" />}
              label={lang === 'ar' ? 'في انتظار المنافس' : 'Waiting for Opponent'}
            />
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-display">
              {lang === 'ar' ? 'غرفة المواجهة 1 ضد 1' : '1v1 Duel Lobby'}
            </h2>
            <p className="text-xs text-steel">
              {lang === 'ar'
                ? 'شارك هذا الكود مع منافسك لبدء المواجهة:'
                : 'Share this code with your rival to start the match:'}
            </p>
          </div>

          {/* Room Code Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-lime/30 flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-stats font-black text-white tracking-[0.24em] pl-2">
              {gameState.code}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyCode}
              leftIcon={<AppIcon icon={copied ? Check : Copy} size={16} weight="bold" />}
            >
              {copied ? t('common.copied') : t('common.copy')}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-lime font-black uppercase animate-pulse">
            <AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin" />
            <span>{lang === 'ar' ? 'في انتظار دخول المنافس...' : 'Waiting for rival to connect...'}</span>
          </div>
        </Panel>

        <button
          type="button"
          onClick={() => router.push('/rank')}
          className="text-xs text-steel hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-black uppercase tracking-wider"
        >
          <AppIcon icon={ArrowLeft} size={14} weight="bold" />
          <span>{lang === 'ar' ? 'إلغاء والعودة لمركز الرانك' : 'Cancel and return to Rank Hub'}</span>
        </button>
      </article>
    );
  }


  // ── 2. FINAL COMPLETED RESULT SCREEN ──────────────────────────────
  if (gameState.status === 'completed') {
    const userSummary = {
      guestId: userParticipant?.guestId || guestId!,
      name: userParticipant?.name || 'You',
      avatarSeed: userParticipant?.avatarSeed || 'you',
      totalScore: userParticipant?.totalScore || 0,
      roundScores: userParticipant?.roundScores || [],
    };

    const opponentSummary = opponentParticipant
      ? {
          guestId: opponentParticipant.guestId,
          name: opponentParticipant.name,
          avatarSeed: opponentParticipant.avatarSeed,
          totalScore: opponentParticipant.totalScore,
          roundScores: opponentParticipant.roundScores || [],
        }
      : undefined;

    return (
      <RankDuelResult
        isDuel={isDuel}
        user={userSummary}
        opponent={opponentSummary}
        winnerId={gameState.winnerId}
        roundCount={gameState.roundCount}
        roundHistory={gameState.roundHistory || []}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.push('/rank')}
      />
    );
  }

  // ── 3. REVEAL STATE (Post-Submission) ──────────────────────────────
  if (gameState.status === 'round_reveal' && gameState.question) {
    const roundResults = gameState.currentRoundResult?.results || [];
    const userResult = roundResults.find((r) => r.guestId === guestId);
    const opponentResult = roundResults.find((r) => r.guestId !== guestId);

    return (
      <article className="mx-auto flex max-w-[400px] w-full flex-col gap-2.5 sm:gap-3 px-2 select-none relative">
        <RankHeader
          currentRound={gameState.currentRoundIndex + 1}
          totalRounds={gameState.roundCount}
          scopeType={gameState.question.scopeType}
          isDuel={isDuel}
          participants={gameState.participants}
          currentGuestId={guestId}
        />

        <RankRevealView
          questionTitle={gameState.question.title}
          questionSubtitle={gameState.question.subtitle}
          answers={gameState.question.answers || []}
          userDeltas={userResult?.cardDeltas || []}
          userRoundScore={userResult?.roundScore ?? 0}
          opponentRoundScore={opponentResult?.roundScore}
          opponentName={opponentParticipant?.name}
          isDuel={isDuel}
          isLastRound={gameState.currentRoundIndex >= gameState.roundCount - 1}
          onAdvance={handleAdvance}
          isAdvancing={isAdvancing}
        />
      </article>
    );
  }

  // ── 4. ACTIVE ROUND GAMEPLAY ───────────────────────────────────────
  return (
    <article className="mx-auto flex max-w-[400px] w-full flex-col gap-2.5 sm:gap-3 px-2 select-none relative">
      <RankHeader
        currentRound={gameState.currentRoundIndex + 1}
        totalRounds={gameState.roundCount}
        deadline={gameState.roundDeadline}
        onTimeExpired={handleSubmitRanking}
        scopeType={gameState.question?.scopeType}
        isDuel={isDuel}
        participants={gameState.participants}
        currentGuestId={guestId}
      />

      {/* Pre-Round Question Reveal Overlay */}
      {introSecondsLeft !== null && introSecondsLeft > 0 && gameState.question && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-3xl p-6 text-center space-y-4 animate-fade-in">
          <StatPill
            variant="lime"
            size="md"
            icon={<AppIcon icon={Clock} size={16} weight="duotone" />}
            label={t('rank.roundStarting', {
              round: gameState.currentRoundIndex + 1,
              sec: introSecondsLeft,
            })}
          />

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug font-display">
            {gameState.question.title}
          </h2>

          <div className="w-14 h-14 rounded-full bg-lime text-slate-950 font-black text-2xl flex items-center justify-center font-stats shadow-lg shadow-lime/20 animate-pulse">
            {introSecondsLeft}
          </div>

          <button
            type="button"
            onClick={() => setIntroSecondsLeft(null)}
            className="text-xs text-steel hover:text-lime font-black uppercase tracking-wider underline transition-colors cursor-pointer"
          >
            {t('rank.skipCountdown')}
          </button>
        </div>
      )}

      {gameState.question && (
        <RankCardList
          questionTitle={gameState.question.title}
          questionSubtitle={gameState.question.subtitle}
          metricLabel={gameState.question.metricLabel}
          direction={gameState.question.direction}
          tags={gameState.question.tags}
          scopeType={gameState.question.scopeType}
          asOfDate={gameState.question.asOfDate}
          items={gameState.question.answers || []}
          currentOrder={currentOrder}
          onOrderChange={(order) => setCustomOrder(order)}
          onSubmit={handleSubmitRanking}
          isSubmitting={isSubmitting}
          hasSubmitted={hasSubmitted}
        />
      )}
    </article>
  );
}
