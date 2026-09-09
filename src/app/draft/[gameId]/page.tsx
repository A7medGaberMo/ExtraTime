'use client';

import React, { useState, use, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import { useGuestSession } from '@/hooks/use-guest-session';
import { DraftHeader } from '@/features/draft/components/draft-header';
import { FormationSelector } from '@/features/draft/components/formation-selector';
import { DraftPickOverlay } from '@/features/draft/components/draft-pick-overlay';
import { DraftPitchBoard } from '@/features/draft/components/draft-pitch-board';
import { DraftBenchStrip } from '@/features/draft/components/draft-bench-strip';
import { DraftShowdownModal } from '@/features/draft/components/draft-showdown-modal';
import { DraftChallengeResultModal } from '@/features/draft/components/draft-challenge-result-modal';
import { DraftChallengeHud } from '@/features/draft/components/draft-challenge-hud';
import { getChallengeById } from '@/features/draft/lib/challenges';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { Copy, Check, Users, Sword, Trophy, House } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { getNextNaturalDraftSlot } from '@/features/draft/lib/formation-links';

interface DraftArenaPageProps {
  params: Promise<{ gameId: string }>;
}

export default function DraftArenaPage({ params }: DraftArenaPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const resolvedParams = use(params);
  const gameId = resolvedParams.gameId as Id<'draftGames'>;

  const { guestId } = useGuestSession();
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('extratime_sessionToken') || undefined : undefined;

  // Convex Query
  const game = useQuery(api.draft.queries.getDraftGame, { gameId });

  // Convex Mutations
  const selectFormation = useMutation(api.draft.mutations.selectFormation);
  const makeDraftPick = useMutation(api.draft.mutations.makeDraftPick);
  const swapPlayers = useMutation(api.draft.mutations.swapSquadPlayers);
  const swapStarters = useMutation(api.draft.mutations.swapStarters);
  const finishDraft = useMutation(api.draft.mutations.finishDraft);
  const simulateBoss = useMutation(api.draft.mutations.simulateBossMatch);
  const autoPickExpired = useMutation(api.draft.mutations.autoPickExpiredTurn);
  const abandonMatch = useMutation(api.rooms.mutations.abandonUserActiveMatch);

  // Local state
  const [selectedStarterSlotIndex, setSelectedStarterSlotIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissedResults, setDismissedResults] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Detect abandonment
  useEffect(() => {
    if (game?.status === 'abandoned') {
      toast(lang === 'ar' ? 'تم إلغاء الماتش من قبل أحد المدربين' : 'Draft match was cancelled by manager', 'info');
      router.replace('/draft');
    }
  }, [game?.status, router, toast, lang]);

  const handleLeaveDraft = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      if (guestId && gameId) {
        await abandonMatch({
          guestId,
          sessionToken,
          matchType: 'draft',
          matchId: gameId,
        });
      }
    } catch {}
    toast(lang === 'ar' ? 'تمت مغادرة الماتش والعودة' : 'Left draft match', 'info');
    router.replace('/draft');
  }, [abandonMatch, isLeaving, guestId, gameId, sessionToken, lang, toast, router]);

  // Find user's participant state (or fallback to participant 0)
  const participant =
    game?.participants?.find((p) => p.guestId === guestId) ?? game?.participants?.[0];
  const opponent = game?.participants?.find((p) => p.guestId !== participant?.guestId);
  const is1v1 = game ? game.mode !== 'solo' : false;
  const isSwappingPhase = participant ? (participant.currentSlotIndex >= 14 || game?.status === 'swapping') : false;
  const activeChallenge = !is1v1 && game?.challengeType ? getChallengeById(game.challengeType) : null;

  // Copy shareable room code
  const handleCopyCode = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    sfx.tap();
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Formation Selection
  const handleSelectFormation = async (formation: string) => {
    if (!participant || actionLoading) return;
    setActionLoading(true);
    try {
      await selectFormation({
        gameId,
        guestId: participant.guestId as Id<'guestUsers'>,
        sessionToken,
        formation,
      });
      sfx.lock();
    } catch (err: any) {
      toast(err.message || 'Failed to select formation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Draft Pick Card Selection
  const handlePickCard = useCallback(
    async (playerId: string) => {
      if (!participant || actionLoading) return;
      setActionLoading(true);
      try {
        await makeDraftPick({
          gameId,
          guestId: participant.guestId as Id<'guestUsers'>,
          sessionToken,
          playerId: playerId as Id<'players'>,
        });
      } catch (err: any) {
        toast(err.message || 'Failed to pick card', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [participant, actionLoading, gameId, sessionToken, makeDraftPick, toast],
  );

  // 3. Auto-pick on timeout expiry (local player)
  const handleTimeoutExpired = useCallback(() => {
    if (participant?.currentCandidates && participant.currentCandidates.length > 0 && !actionLoading) {
      handlePickCard(participant.currentCandidates[0].id);
    }
  }, [participant?.currentCandidates, actionLoading, handlePickCard]);

  // 3b. Watchdog for 1v1 opponent timeout: nudges auto-pick if opponent disconnected
  useEffect(() => {
    if (!is1v1 || !opponent || opponent.currentSlotIndex >= 14 || !opponent.turnExpiresAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now > opponent.turnExpiresAt! + 1200) {
        autoPickExpired({
          gameId,
          targetGuestId: opponent.guestId as Id<'guestUsers'>,
        }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [is1v1, opponent, gameId, autoPickExpired]);

  // 4. Bench Swap
  const handleSwapWithBench = async (benchIndex: number) => {
    if (selectedStarterSlotIndex === null || !participant || actionLoading) return;
    setActionLoading(true);
    try {
      await swapPlayers({
        gameId,
        guestId: participant.guestId as Id<'guestUsers'>,
        sessionToken,
        starterSlotIndex: selectedStarterSlotIndex,
        benchIndex,
      });
      setSelectedStarterSlotIndex(null);
    } catch (err: any) {
      toast(err.message || 'Failed to swap players', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Swap Starters on Pitch (Starter-to-Starter)
  const handleSwapStarters = async (slotIndexA: number, slotIndexB: number) => {
    if (!participant || actionLoading) return;
    setActionLoading(true);
    try {
      await swapStarters({
        gameId,
        guestId: participant.guestId as Id<'guestUsers'>,
        sessionToken,
        slotIndexA,
        slotIndexB,
      });
      setSelectedStarterSlotIndex(null);
      sfx.tap();
    } catch (err: any) {
      toast(err.message || 'Failed to swap starters', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Finish Drafting & Mark Ready / Check Challenge
  const handleFinishDraft = async () => {
    if (!participant || actionLoading) return;
    setActionLoading(true);
    try {
      await finishDraft({
        gameId,
        guestId: participant.guestId as Id<'guestUsers'>,
        sessionToken,
      });
      sfx.kickoff();
    } catch (err: any) {
      toast(err.message || 'Failed to finish draft', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Boss Match
  const handlePlayBossMatch = async () => {
    if (!participant || actionLoading) return;
    setActionLoading(true);
    try {
      await simulateBoss({
        gameId,
        guestId: participant.guestId as Id<'guestUsers'>,
        sessionToken,
      });
    } catch (err: any) {
      toast(err.message || 'Failed to start boss match', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Active target slot and pick index (natural EA FC progression)
  const currentPickIndex = participant?.currentSlotIndex ?? 0;
  const isCaptainRound = currentPickIndex === 0;

  // Moves from GK forward (GK -> DEF -> MID -> ATT) after Captain!
  const nextUnfilledStarter = getNextNaturalDraftSlot(participant?.startingXI ?? []);
  const activePitchSlotIndex = isCaptainRound
    ? -1
    : (nextUnfilledStarter?.slotIndex ?? -1);

  let activeTargetPosition = 'CAPTAIN';
  if (!isCaptainRound && currentPickIndex <= 10) {
    activeTargetPosition = nextUnfilledStarter?.position ?? 'GK';
  } else if (currentPickIndex >= 11) {
    activeTargetPosition = 'SUPER-SUB';
  }

  // Early loading / not found returns AFTER all hooks have executed unconditionally
  if (game === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-steel">
            {t('draft.enteringArena')}
          </span>
        </div>
      </div>
    );
  }

  if (game === null || !participant) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-white">{t('draft.gameNotFound')}</h2>
        <p className="text-xs text-steel">{t('draft.gameNotFoundDesc')}</p>
        <Button variant="primary" onClick={() => router.push('/draft')}>
          {t('draft.returnToHub')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between h-full max-h-full gap-1.5 sm:gap-2.5 px-1 sm:px-3 overflow-hidden">
      {/* ── APPLE AIRDROP / SHAREPLAY STYLE WAITING LOBBY ──────── */}
      {game.status === 'waiting' && (
        <section aria-label="Waiting Room" className="apple-glass-elevated w-full max-w-md my-auto rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          {/* Concentric Apple Radar Waves */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping" />
            <span className="absolute -inset-2 rounded-full border border-cyan-400/20" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-cyan-400/20 to-cyan-500/10 text-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.25)]">
              <AppIcon icon={Users} size={32} weight="duotone" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('draft.waitingRival')}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('draft.shareCodePrompt')}
            </p>
          </div>

          {/* Apple Passcode Style Room Code Pill */}
          <div className="apple-segmented-bar flex items-center justify-center gap-3 rounded-2xl p-3 sm:p-4 shadow-inner">
            <span className="font-stats text-3xl sm:text-4xl font-black tracking-[0.25em] text-white">
              {game.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-haptic flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-md shadow-cyan-400/25 cursor-pointer"
              title="Copy Room Code"
            >
              <AppIcon icon={copied ? Check : Copy} size={19} weight="bold" />
            </button>
          </div>

          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-micro font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span>{t('draft.roomActiveNotice')}</span>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveDraft}
              loading={isLeaving}
              className="text-slate-400 hover:text-rose-400 text-xs font-stats uppercase tracking-wider"
            >
              {lang === 'ar' ? 'إلغاء الماتش والعودة' : 'Cancel Match & Return'}
            </Button>
          </div>
        </section>
      )}

      {/* ── ACTIVE DRAFTING & SWAPPING ARENA ────────────────────── */}
      {participant.formation ? (
        <div className="w-full h-full max-h-full flex flex-col justify-between gap-1.5 sm:gap-2 overflow-hidden">
          {/* 1. Apple Dynamic Navigation Header */}
          <DraftHeader
            participant={participant}
            opponent={opponent}
            is1v1={is1v1}
            code={game.code}
            onTimeExpired={handleTimeoutExpired}
            onLeave={handleLeaveDraft}
          />

          {/* 1.5 Apple Activity Rings HUD (Solo Mode) */}
          {!is1v1 && activeChallenge && (
            <DraftChallengeHud
              challenge={activeChallenge}
              starters={participant.startingXI}
              chemistryScore={participant.chemistryScore}
              squadRating={participant.squadRating}
            />
          )}

          {/* 2. Apple Sports Pro Stadium Pitch Board */}
          <DraftPitchBoard
            formation={participant.formation}
            starters={participant.startingXI}
            activeSlotIndex={activePitchSlotIndex}
            selectedSlotIndex={selectedStarterSlotIndex}
            onSelectSlot={(idx) => {
              sfx.tap();
              setSelectedStarterSlotIndex(selectedStarterSlotIndex === idx ? null : idx);
            }}
            onSwapStarters={handleSwapStarters}
            isSwappingPhase={isSwappingPhase}
          />

          {/* 3. Bottom Dock: Candidate Cards OR Bench Subs */}
          {!isSwappingPhase && participant.currentCandidates && participant.currentCandidates.length > 0 ? (
            <DraftPickOverlay
              candidates={participant.currentCandidates}
              slotIndex={currentPickIndex}
              targetPosition={activeTargetPosition}
              isCaptainRound={isCaptainRound}
              onPick={handlePickCard}
              disabled={actionLoading}
              activeChallenge={activeChallenge}
              starters={participant.startingXI}
            />
          ) : isSwappingPhase && game.status !== 'showdown' && game.status !== 'completed' ? (
            <div className="space-y-1 sm:space-y-1.5 shrink-0">
              {/* Ready / Finish button banner — Apple Dynamic Island style */}
              <div className="apple-glass-card flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2 sm:py-2.5 shadow-lg border border-cyan-400/30">
                <div className="text-left leading-tight">
                  <span className="block text-xs sm:text-sm font-black text-white tracking-wide">
                    {t('draft.squadComplete')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {is1v1 ? t('draft.tunePositions') : t('draft.checkObjectives')}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinishDraft}
                  disabled={actionLoading || participant.isReady}
                  leftIcon={<AppIcon icon={participant.isReady ? Check : Sword} size={15} weight="bold" />}
                  className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-black hover:brightness-110 shrink-0 rounded-xl shadow-md shadow-cyan-400/25 px-4"
                >
                  {participant.isReady ? t('draft.evaluating') : is1v1 ? t('draft.lockSquad') : t('draft.checkChallenge')}
                </Button>
              </div>

              {/* Bench strip */}
              <DraftBenchStrip
                bench={participant.bench}
                activeSlotIndex={currentPickIndex}
                selectedStarterSlotIndex={selectedStarterSlotIndex}
                onSwapWithBench={handleSwapWithBench}
                isSwappingPhase={isSwappingPhase}
              />
            </div>
          ) : null}
        </div>
      ) : (
        /* If no formation set, fallback to compact formation selector */
        <div className="w-full max-w-lg mx-auto py-4">
          <FormationSelector
            options={participant.formationOptions ?? ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '4-1-2-1-2']}
            selectedFormation={participant.formation ?? null}
            onSelectFormation={handleSelectFormation}
            loading={actionLoading}
          />
        </div>
      )}

      {/* ── SOLO CHALLENGE RESULT MODAL ── */}
      {!is1v1 && !dismissedResults && (game.challengeEvaluation || (game.status === 'completed' && game.challengeEvaluation)) && game.challengeEvaluation && (
        <DraftChallengeResultModal
          evaluation={game.challengeEvaluation}
          onPlayAgain={() => router.push('/draft')}
          onPlayBossMatch={handlePlayBossMatch}
          onClose={() => setDismissedResults(true)}
          bossLoading={actionLoading}
        />
      )}

      {/* ── 1v1 SHOWDOWN MODAL ── */}
      {(is1v1 || game.challengeType === 'boss_match' || game.status === 'showdown') &&
        !dismissedResults &&
        (game.status === 'showdown' || (game.status === 'completed' && game.showdownResult)) &&
        game.showdownResult && (
        <DraftShowdownModal
          showdownResult={game.showdownResult}
          hostParticipant={participant}
          guestParticipant={opponent}
          currentUserId={participant.guestId}
          isSolo={!is1v1}
          challengeType={game.challengeType}
          onPlayBossMatch={handlePlayBossMatch}
          onPlayAgain={() => router.push('/draft')}
          onClose={() => setDismissedResults(true)}
          bossLoading={actionLoading}
        />
      )}

      {/* ── FLOATING TOOLBAR WHEN RESULT MODAL IS DISMISSED TO REVIEW PITCH ── */}
      {dismissedResults && (game.challengeEvaluation || game.showdownResult) && (
        <div className="apple-glass-elevated fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full px-4 py-2 shadow-2xl border border-white/20 animate-fade-in">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDismissedResults(false)}
            leftIcon={<AppIcon icon={Trophy} size={15} weight="fill" />}
            className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-cyan-400/25 rounded-full px-4"
          >
            {t('draft.showResults')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/draft')}
            leftIcon={<AppIcon icon={House} size={15} weight="bold" />}
            className="rounded-full border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.15] px-4"
          >
            {t('draft.draftHub')}
          </Button>
        </div>
      )}
    </div>
  );
}
