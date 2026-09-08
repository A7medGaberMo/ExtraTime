'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  CircleNotch,
  ArrowCounterClockwise,
  Cards,
  House,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { useI18n } from '@/lib/i18n';

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
  }>;
}

interface SquadSlot {
  position: string;
  isSub?: boolean;
  cost?: number;
  playerId: string;
  player?: {
    _id: string;
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
  const { t } = useI18n();
  const { guestId } = useGuestSession(true);
  const roomIdTyped = roomId as Id<'rooms'>;

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomIdTyped, userId: guestId } : 'skip',
  );
  const match = useQuery(api.matches.queries.getByRoom, roomId ? { roomId: roomIdTyped } : 'skip');

  const runSimulation = useMutation(api.matches.mutations.runSimulation);
  const triggeredRef = useRef(false);
  const [audioReady, setAudioReady] = useState(false);

  const viewerIsHost = state?.isHost ?? true;

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
        playerId: slot.player?._id ?? (slot.player as any)?.id ?? slot.playerId,
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
          (s) => s.playerId === p._id || s.player?._id === p._id || (s.player as any)?.id === p._id,
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
          rating: (p as any).rating,
          cost: matchingRaw?.cost,
        };
      });
    }

    if (raw && raw.length > 0) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? (slot.player as any)?.id ?? slot.playerId,
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
        playerId: slot.player?._id ?? (slot.player as any)?.id ?? slot.playerId,
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
          (s) => s.playerId === p._id || s.player?._id === p._id || (s.player as any)?.id === p._id,
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
          rating: (p as any).rating,
          cost: matchingRaw?.cost,
        };
      });
    }

    if (raw && raw.length > 0) {
      return (raw as unknown as SquadSlot[]).map((slot) => ({
        playerId: slot.player?._id ?? (slot.player as any)?.id ?? slot.playerId,
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
            <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
            <p className="text-steel text-xs font-black tracking-widest uppercase font-stats">
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
          <div className="apple-glass-elevated p-8 sm:p-10 w-full space-y-5 text-center border border-lime/30 shadow-[0_16px_50px_rgba(149,232,16,0.15)]">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="bg-lime/25 absolute inset-0 rounded-full blur-xl animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime shadow-[0_0_20px_rgba(149,232,16,0.2)]">
                <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-display">
                Resolving Matchday
              </h2>
              <p className="text-steel text-xs font-medium leading-relaxed max-w-sm mx-auto">
                Both squads are locked in. The tactical engine is resolving the matchday...
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <article className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-3xl flex-col justify-between overflow-hidden select-none p-2 sm:p-3 relative">
      {/* Ambient Top Glow Mesh based on match outcome */}
      <div
        className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[220px] w-[90%] max-w-2xl rounded-full blur-[100px] opacity-25 transition-colors duration-700 ${
          viewerWon === true ? 'bg-lime' : viewerWon === false ? 'bg-amber-400' : 'bg-cyan-400'
        }`}
      />

      <Confetti active={viewerWon === true} />

      {/* ── 1. SLEEK TOP HUD BAR (ZERO SCROLL HEADER) ─────────── */}
      <header className="relative z-20 flex w-full items-center justify-between gap-2 shrink-0 py-0.5">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-bold text-steel hover:text-white transition-all cursor-pointer shadow-sm backdrop-blur-md"
        >
          <AppIcon icon={House} size={14} weight="bold" />
          <span>{t('results.home')}</span>
        </button>

        {/* Outcome Pill */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-xl shadow-lg ${
            viewerWon === true
              ? 'border-lime/40 bg-lime/15 text-lime shadow-[0_0_20px_rgba(149,232,16,0.25)]'
              : viewerWon === false
                ? 'border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
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
              ? 'border-lime/50 bg-lime/20 text-lime shadow-[0_0_12px_rgba(149,232,16,0.3)] ring-1 ring-lime/40'
              : 'border-white/15 bg-slate-900/90 text-steel hover:text-white'
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

      {/* ── 3. BOTTOM ACTION BAR ─────────────────────────────────── */}
      <footer className="grid grid-cols-3 gap-2 shrink-0 pt-1 relative z-10">
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/create-room')}
          leftIcon={<AppIcon icon={ArrowCounterClockwise} size={16} weight="bold" className="text-slate-950" />}
          className="shadow-[0_8px_20px_rgba(149,232,16,0.2)]"
        >
          {t('results.rematch')}
        </Button>

        <Button
          variant="gold"
          size="md"
          onClick={() => router.push('/packs')}
          leftIcon={<AppIcon icon={Cards} size={16} weight="bold" className="text-slate-950" />}
          className="shadow-[0_8px_20px_rgba(245,158,11,0.2)]"
        >
          {t('results.packs')}
        </Button>

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
