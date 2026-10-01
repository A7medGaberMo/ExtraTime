'use client';

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { ScoreHub } from '@/components/match/score-hub';
import type { PitchSquadPlayer } from '@/components/match/tactical-pitch-view';
import type { MatchSimulationResult } from '@/core/simulation/simulation.interface';
import { useGuestSession } from '@/hooks/use-guest-session';
import { unlockAudio, sfx } from '@/lib/sfx';
import { Confetti } from '@/components/shared/confetti';
import { useToast } from '@/components/shared/toast';
import {
  CircleNotch,
  ArrowCounterClockwise,
  House,
  SpeakerHigh,
  SpeakerSlash,
  UserPlus,
  X,
  CheckCircle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { useI18n } from '@/lib/i18n';
import { gameIdForType } from '@/config/games';

interface HydratedMatch {
  simulation?: MatchSimulationResult | null;
  hostSquadDetails?: Array<{
    _id: string;
    name: string;
    position: string;
    tier: string;
    imageUrl?: string;
    isLegend?: boolean;
    kitNumber?: number;
    club?: string;
    nation?: string;
    rating?: number;
  }>;
  guestSquadDetails?: Array<{
    _id: string;
    name: string;
    position: string;
    tier: string;
    imageUrl?: string;
    isLegend?: boolean;
    kitNumber?: number;
    club?: string;
    nation?: string;
    rating?: number;
  }>;
}

interface SquadSlot {
  position: string;
  isSub?: boolean;
  cost?: number;
  playerId: string;
  player?: {
    _id?: string;
    id?: string;
    name: string;
    tier?: string;
    position?: string;
    imageUrl?: string;
    club?: string;
    nation?: string;
    isLegend?: boolean;
    kitNumber?: number;
    rating?: number;
  };
}

export default function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { guestId, sessionToken } = useGuestSession(true);
  const roomIdTyped = roomId as Id<'rooms'>;

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomIdTyped, userId: guestId } : 'skip',
  );
  const match = useQuery(api.matches.queries.getByRoom, roomId ? { roomId: roomIdTyped } : 'skip');

  // ── Rematch invitation system ──
  const rematchState = useQuery(
    api.rooms.queries.getRematchState,
    guestId && roomId ? { roomId: roomIdTyped, userId: guestId } : 'skip',
  );
  const requestRematch = useMutation(api.rooms.mutations.requestSnipeRematch);
  const acceptRematch = useMutation(api.rooms.mutations.acceptRematchInvite);
  const declineRematch = useMutation(api.rooms.mutations.declineRematchInvite);
  const [isRematchLoading, setIsRematchLoading] = useState(false);

  const runSimulation = useMutation(api.matches.mutations.runSimulation);
  const triggeredRef = useRef(false);
  const [audioReady, setAudioReady] = useState(false);

  const viewerIsHost = state?.isHost ?? true;

  // Auto-redirect when rematch is accepted
  useEffect(() => {
    if (rematchState?.status === 'accepted' && rematchState.rematchRoomId) {
      router.push(`/auction/${rematchState.rematchRoomId}`);
    }
  }, [rematchState?.status, rematchState?.rematchRoomId, router]);

  const handleRequestRematch = useCallback(async () => {
    if (!guestId || isRematchLoading) return;
    setIsRematchLoading(true);
    try {
      const result = await requestRematch({
        completedRoomId: roomIdTyped,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
      });
      if ((result as Record<string, unknown>).autoAccepted) {
        router.push(`/auction/${result.rematchRoomId}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || (lang === 'ar' ? 'فشل طلب الريماتش' : 'Failed to request rematch'), 'error');
    } finally {
      setIsRematchLoading(false);
    }
  }, [guestId, isRematchLoading, requestRematch, roomIdTyped, sessionToken, router, toast, lang]);

  const handleAcceptRematch = useCallback(async () => {
    if (!guestId || !rematchState?.rematchRoomId || isRematchLoading) return;
    setIsRematchLoading(true);
    try {
      await acceptRematch({
        rematchRoomId: rematchState.rematchRoomId,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
      });
      router.push(`/auction/${rematchState.rematchRoomId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || (lang === 'ar' ? 'فشل قبول الريماتش' : 'Failed to accept rematch'), 'error');
    } finally {
      setIsRematchLoading(false);
    }
  }, [guestId, rematchState, isRematchLoading, acceptRematch, sessionToken, router, toast, lang]);

  const handleDeclineRematch = useCallback(async () => {
    if (!guestId || !rematchState?.rematchRoomId || isRematchLoading) return;
    setIsRematchLoading(true);
    try {
      await declineRematch({
        rematchRoomId: rematchState.rematchRoomId,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
      });
      toast(lang === 'ar' ? 'تم رفض الريماتش' : 'Rematch declined', 'info');
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || (lang === 'ar' ? 'خطأ' : 'Error'), 'error');
    } finally {
      setIsRematchLoading(false);
    }
  }, [guestId, rematchState, isRematchLoading, declineRematch, sessionToken, toast, lang]);

  useEffect(() => {
    const mat = match as HydratedMatch | null | undefined;
    const needsTrigger = mat && !mat.simulation && !triggeredRef.current && guestId && roomId;
    if (!needsTrigger || !guestId) return;

    if (viewerIsHost) {
      triggeredRef.current = true;
      void runSimulation({ roomId: roomIdTyped, userId: guestId }).catch(console.error);
    } else {
      const timer = setTimeout(() => {
        const currentMat = match as HydratedMatch | null | undefined;
        if (!triggeredRef.current && currentMat && !currentMat.simulation) {
          triggeredRef.current = true;
          void runSimulation({ roomId: roomIdTyped, userId: guestId }).catch(console.error);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [match, guestId, roomId, roomIdTyped, runSimulation, viewerIsHost]);

  useEffect(() => {
    if (audioReady) unlockAudio();
  }, [audioReady]);

  const simulation = (match as HydratedMatch | null | undefined)?.simulation ?? null;

  const hostSquad = useMemo<PitchSquadPlayer[]>(() => {
    const raw = viewerIsHost ? state?.mySquad : state?.opponentSquad;
    const details = viewerIsHost
      ? (match as HydratedMatch | null)?.hostSquadDetails
      : (match as HydratedMatch | null)?.guestSquadDetails;

    if (raw && raw.length >= (state?.auction?.rounds?.length ?? 11)) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? slot.player?.id ?? slot.playerId,
        name: slot.player?.name ?? '',
        tier: slot.player?.tier ?? 'GOLD',
        position: slot.position || slot.player?.position || 'ST',
        imageUrl: slot.player?.imageUrl,
        club: slot.player?.club,
        nation: slot.player?.nation,
        isLegend: slot.player?.isLegend,
        kitNumber: slot.player?.kitNumber,
        isSub: slot.isSub,
        rating: slot.player?.rating,
        cost: slot.cost,
      }));
    }

    if (details && details.length > 0) {
      return details.filter(Boolean).map((p) => {
        const matchingRaw = (raw as unknown as SquadSlot[] | undefined)?.find(
          (s) => s.playerId === p._id || s.player?._id === p._id || s.player?.id === p._id,
        );
        return {
          playerId: p._id,
          name: p.name,
          tier: p.tier,
          position: matchingRaw?.position || p.position || 'ST',
          imageUrl: p.imageUrl,
          club: p.club,
          nation: p.nation,
          isLegend: p.isLegend,
          kitNumber: p.kitNumber,
          isSub: matchingRaw?.isSub ?? false,
          rating: p.rating,
          cost: matchingRaw?.cost,
        };
      });
    }

    if (raw && raw.length > 0) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? slot.player?.id ?? slot.playerId,
        name: slot.player?.name ?? '',
        tier: slot.player?.tier ?? 'GOLD',
        position: slot.position || slot.player?.position || 'ST',
        imageUrl: slot.player?.imageUrl,
        club: slot.player?.club,
        nation: slot.player?.nation,
        isLegend: slot.player?.isLegend,
        kitNumber: slot.player?.kitNumber,
        isSub: slot.isSub,
        rating: slot.player?.rating,
        cost: slot.cost,
      }));
    }

    return [];
  }, [state?.mySquad, state?.opponentSquad, state?.auction?.rounds?.length, viewerIsHost, match]);

  const guestSquad = useMemo<PitchSquadPlayer[]>(() => {
    const raw = viewerIsHost ? state?.opponentSquad : state?.mySquad;
    const details = viewerIsHost
      ? (match as HydratedMatch | null)?.guestSquadDetails
      : (match as HydratedMatch | null)?.hostSquadDetails;

    if (raw && raw.length >= (state?.auction?.rounds?.length ?? 11)) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? slot.player?.id ?? slot.playerId,
        name: slot.player?.name ?? '',
        tier: slot.player?.tier ?? 'GOLD',
        position: slot.position || slot.player?.position || 'ST',
        imageUrl: slot.player?.imageUrl,
        club: slot.player?.club,
        nation: slot.player?.nation,
        isLegend: slot.player?.isLegend,
        kitNumber: slot.player?.kitNumber,
        isSub: slot.isSub,
        rating: slot.player?.rating,
        cost: slot.cost,
      }));
    }

    if (details && details.length > 0) {
      return details.filter(Boolean).map((p) => {
        const matchingRaw = (raw as unknown as SquadSlot[] | undefined)?.find(
          (s) => s.playerId === p._id || s.player?._id === p._id || s.player?.id === p._id,
        );
        return {
          playerId: p._id,
          name: p.name,
          tier: p.tier,
          position: matchingRaw?.position || p.position || 'ST',
          imageUrl: p.imageUrl,
          club: p.club,
          nation: p.nation,
          isLegend: p.isLegend,
          kitNumber: p.kitNumber,
          isSub: matchingRaw?.isSub ?? false,
          rating: p.rating,
          cost: matchingRaw?.cost,
        };
      });
    }

    if (raw && raw.length > 0) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? slot.player?.id ?? slot.playerId,
        name: slot.player?.name ?? '',
        tier: slot.player?.tier ?? 'GOLD',
        position: slot.position || slot.player?.position || 'ST',
        imageUrl: slot.player?.imageUrl,
        club: slot.player?.club,
        nation: slot.player?.nation,
        isLegend: slot.player?.isLegend,
        kitNumber: slot.player?.kitNumber,
        isSub: slot.isSub,
        rating: slot.player?.rating,
        cost: slot.cost,
      }));
    }

    return [];
  }, [state?.mySquad, state?.opponentSquad, state?.auction?.rounds?.length, viewerIsHost, match]);

  const viewerName = viewerIsHost ? state?.hostName : state?.guestName;
  const opponentName = viewerIsHost ? state?.guestName : state?.hostName;
  const myName = viewerName ? `You (${viewerName})` : 'You';
  const rivalName = opponentName ?? 'Rival';

  const viewerWon =
    simulation == null
      ? null
      : simulation.winnerId == null
        ? null
        : simulation.winnerId === guestId;

  const formation = state?.auction?.formation ?? '4-3-3';
  const matchSize = ((state?.auction?.matchSize ?? 11) as 5 | 11) || 11;
  const game = gameIdForType(match?.gameType);

  const celebratedRef = useRef(false);

  useEffect(() => {
    if (simulation && viewerWon === true && !celebratedRef.current) {
      celebratedRef.current = true;
      sfx.victory();
      sfx.haptic('success');
    } else if (simulation && viewerWon === false && !celebratedRef.current) {
      celebratedRef.current = true;
      sfx.runnerUp();
    }
  }, [simulation, viewerWon]);

  if (!guestId || state === undefined || match === undefined) {
    return (
      <PageShell title={t('results.title')} subtitle={t('results.subtitle')} backUrl="/" maxWidth="md">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="apple-glass-elevated p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/10 shadow-2xl">
            <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-game-accent animate-spin" />
            <p className="text-muted text-xs font-black tracking-widest uppercase font-stats">
              {t('common.loading')}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!match || !simulation) {
    return (
      <PageShell title={t('results.title')} subtitle={t('results.subtitle')} backUrl="/" maxWidth="md">
        <div className="animate-fade-in mx-auto flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 px-3 text-center">
          <div className="apple-glass-elevated p-8 sm:p-10 w-full space-y-5 text-center border border-game-accent/30 shadow-[0_16px_50px_var(--game-glow)]">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="bg-game-accent/25 absolute inset-0 rounded-full blur-xl animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-game-accent/40 bg-game-accent/10 text-game-accent shadow-[0_0_20px_var(--game-glow)]">
                <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-game-accent animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-display">
                Resolving Matchday
              </h2>
              <p className="text-muted text-xs font-medium leading-relaxed max-w-sm mx-auto">
                Both squads are locked in. The tactical engine is resolving the matchday...
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <article
      data-game={game ?? undefined}
      className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl flex-col justify-between overflow-hidden select-none p-2 sm:p-3 lg:p-4 relative"
    >
      {/* Ambient Top Glow Mesh based on match outcome */}
      <div
        className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[220px] w-[90%] max-w-2xl rounded-full blur-[100px] opacity-25 transition-colors duration-700 ${
          viewerWon === true ? 'bg-game-accent' : viewerWon === false ? 'bg-game-accent-deep' : 'bg-game-accent/40'
        }`}
      />

      <Confetti active={viewerWon === true} />

      {/* ── 1. SLEEK TOP HUD BAR (ZERO SCROLL HEADER) ─────────── */}
      <header className="relative z-20 flex w-full items-center justify-between gap-2 shrink-0 py-0.5">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-canvas/80 px-3 py-1 text-xs font-bold text-muted hover:text-white transition-all cursor-pointer shadow-sm backdrop-blur-md"
        >
          <AppIcon icon={House} size={14} weight="bold" />
          <span>{t('results.home')}</span>
        </button>

        {/* Outcome Pill */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-xl shadow-lg ${
            viewerWon === true
              ? 'border-game-accent/40 bg-game-accent/15 text-game-accent shadow-[0_0_20px_var(--game-glow)]'
              : viewerWon === false
                ? 'border-game-accent/30 bg-game-accent/10 text-game-accent-light shadow-[0_0_16px_var(--game-glow)]'
                : 'border-white/20 bg-white/10 text-white'
          }`}
        >
          <span className="font-stats tracking-wider uppercase text-[11px] font-black">
            {viewerWon === true
              ? '★ VICTORY CONFIRMED'
              : viewerWon === false
                ? 'RUNNER-UP'
                : 'MATCHDAY COMPLETED'}
          </span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => {
            setAudioReady(!audioReady);
            unlockAudio();
          }}
          className={`btn-haptic flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all cursor-pointer ${
            audioReady
              ? 'border-game-accent/50 bg-game-accent/20 text-game-accent shadow-[0_0_12px_var(--game-glow)] ring-1 ring-game-accent/40'
              : 'border-white/15 bg-surface/90 text-muted hover:text-white'
          }`}
          title="Toggle matchday audio"
          aria-label="Toggle matchday audio"
        >
          <AppIcon icon={audioReady ? SpeakerHigh : SpeakerSlash} size={16} weight="bold" />
        </button>
      </header>

      {/* ── 2. MAIN SCOREHUB STAGE (FLEX-1 ZERO SCROLL) ─────────── */}
      <div className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden py-1 relative z-10">
        <ScoreHub
          simulation={simulation}
          hostName={viewerIsHost ? myName : rivalName}
          guestName={viewerIsHost ? rivalName : myName}
          viewerWon={viewerWon}
          viewerIsHost={viewerIsHost}
          hostSquad={hostSquad}
          guestSquad={guestSquad}
          formation={formation}
          matchSize={matchSize}
        />
      </div>

      {/* ── INCOMING REMATCH INVITE OVERLAY ─────────────────────── */}
      {rematchState?.status === 'pending' && !rematchState.iAmInviter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="apple-glass-elevated relative w-[90%] max-w-sm rounded-3xl p-6 border border-game-accent/30 shadow-[0_24px_60px_var(--game-glow)] space-y-5 text-center">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-32 w-48 rounded-full bg-game-accent/20 blur-3xl" />

            <div className="relative space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-game-accent/50 bg-game-accent/15 px-3 py-1 shadow-sm">
                <AppIcon icon={UserPlus} size={14} weight="fill" className="text-game-accent" />
                <span className="text-[11px] font-black uppercase tracking-wider text-game-accent">
                  {lang === 'ar' ? 'دعوة ريماتش' : 'Rematch Invite'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white uppercase font-display tracking-tight">
                {lang === 'ar'
                  ? `${rematchState.inviterName} عايز يلعب تاني!`
                  : `${rematchState.inviterName} wants a rematch!`}
              </h3>
              <p className="text-xs text-foreground">
                {lang === 'ar'
                  ? 'هل تقبل التحدي من جديد؟'
                  : 'Accept the challenge for another round?'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="gold"
                size="md"
                onClick={handleAcceptRematch}
                disabled={isRematchLoading}
                leftIcon={<AppIcon icon={CheckCircle} size={16} weight="bold" className="text-game-on-accent" />}
                className="flex-1 shadow-[0_8px_20px_var(--game-glow)] font-bold text-game-on-accent"
              >
                {isRematchLoading
                  ? <AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin text-game-on-accent" />
                  : (lang === 'ar' ? 'قبول' : 'Accept')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleDeclineRematch}
                disabled={isRematchLoading}
                leftIcon={<AppIcon icon={X} size={14} weight="bold" className="text-danger" />}
                className="flex-1 border-danger/30 bg-danger/10 hover:border-danger/50 text-danger shadow-md font-semibold"
              >
                {lang === 'ar' ? 'رفض' : 'Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. BOTTOM ACTION BAR ─────────────────────────────────── */}
      <footer className="grid grid-cols-3 gap-2 shrink-0 pt-1 relative z-10">
        {/* Dynamic Rematch Button */}
        {rematchState?.status === 'pending' && rematchState.iAmInviter ? (
          <Button
            variant="secondary"
            size="md"
            disabled
            leftIcon={<AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin text-game-accent" />}
            className="border-game-accent/30 bg-game-accent/10 text-game-accent shadow-md font-bold cursor-wait"
          >
            {lang === 'ar' ? 'في الانتظار...' : 'Waiting...'}
          </Button>
        ) : rematchState?.status === 'declined' ? (
          <Button
            variant="secondary"
            size="md"
            disabled
            leftIcon={<AppIcon icon={X} size={14} weight="bold" className="text-danger" />}
            className="border-danger/30 bg-danger/10 text-danger shadow-md font-bold"
          >
            {lang === 'ar' ? 'تم الرفض' : 'Declined'}
          </Button>
        ) : rematchState?.status === 'accepted' ? (
          <Button
            variant="gold"
            size="md"
            disabled
            leftIcon={<AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin text-game-on-accent" />}
            className="shadow-[0_8px_20px_var(--game-glow)] font-bold text-game-on-accent"
          >
            {lang === 'ar' ? 'جاري التحويل...' : 'Joining...'}
          </Button>
        ) : (
          <Button
            variant="gold"
            size="md"
            onClick={handleRequestRematch}
            disabled={isRematchLoading}
            leftIcon={
              isRematchLoading
                ? <AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin text-game-on-accent" />
                : <AppIcon icon={ArrowCounterClockwise} size={16} weight="bold" className="text-game-on-accent" />
            }
            className="shadow-[0_8px_20px_var(--game-glow)] font-bold text-game-on-accent"
          >
            {t('results.rematch')}
          </Button>
        )}

        <Button
          variant="secondary"
          size="md"
          onClick={() => router.push('/')}
          leftIcon={<AppIcon icon={House} size={16} weight="bold" />}
          className="btn-haptic border-white/15 bg-white/5 hover:border-white/30 active:scale-95 shadow-md"
        >
          {t('results.home')}
        </Button>
      </footer>
    </article>
  );
}
