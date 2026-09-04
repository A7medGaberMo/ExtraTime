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
  playerId: string;
  player?: {
    _id: string;
    name: string;
    tier?: string;
    imageUrl?: string;
    club?: string;
    nation?: string;
    isLegend?: boolean;
    kitNumber?: number;
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
    if (!raw) return [];
    return (raw as unknown as SquadSlot[]).map((slot) => ({
      playerId: slot.player?._id ?? slot.playerId,
      name: slot.player?.name ?? '',
      tier: slot.player?.tier ?? 'GOLD',
      position: slot.position,
      imageUrl: slot.player?.imageUrl,
      club: slot.player?.club,
      nation: slot.player?.nation,
      isLegend: slot.player?.isLegend,
      kitNumber: slot.player?.kitNumber,
      isSub: slot.isSub,
    }));
  }, [state?.mySquad, state?.opponentSquad, viewerIsHost]);

  const guestSquad = useMemo<PitchSquadPlayer[]>(() => {
    const raw = viewerIsHost ? state?.opponentSquad : state?.mySquad;
    if (!raw) return [];
    return (raw as unknown as SquadSlot[]).map((slot) => ({
      playerId: slot.player?._id ?? slot.playerId,
      name: slot.player?.name ?? '',
      tier: slot.player?.tier ?? 'GOLD',
      position: slot.position,
      imageUrl: slot.player?.imageUrl,
      club: slot.player?.club,
      nation: slot.player?.nation,
      isLegend: slot.player?.isLegend,
      kitNumber: slot.player?.kitNumber,
      isSub: slot.isSub,
    }));
  }, [state?.mySquad, state?.opponentSquad, viewerIsHost]);

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-fade-in flex flex-col items-center gap-3">
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
          <p className="text-steel text-xs font-black tracking-widest uppercase font-stats">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (!match || !simulation) {
    return (
      <div className="animate-fade-in mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-3 text-center">
        <Panel variant="highlight" className="p-8 w-full space-y-4 text-center">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <div className="bg-lime/25 absolute inset-0 rounded-full blur-xl animate-pulse" />
            <AppIcon icon={CircleNotch} size={40} weight="bold" className="text-lime relative animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-tight text-white uppercase font-display">
              Resolving Matchday
            </h2>
            <p className="text-steel text-xs font-medium leading-relaxed">
              Both squads are locked in. The tactical engine is resolving the matchday...
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <PageShell
      title={t('results.title')}
      subtitle={t('results.subtitle')}
      backUrl="/"
      maxWidth="2xl"
    >
      <Confetti active={viewerWon === true} />
      {/* Sound Toggle Floating Button */}
      <button
        type="button"
        onClick={() => {
          setAudioReady(!audioReady);
          unlockAudio();
        }}
        className={`fixed end-5 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl transition-all cursor-pointer ${
          audioReady
            ? 'border-lime/40 bg-lime/20 text-lime shadow-lime/20'
            : 'border-white/15 bg-slate-900/90 text-steel hover:text-white'
        }`}
        title="Toggle matchday audio"
      >
        <AppIcon icon={audioReady ? SpeakerHigh : SpeakerSlash} size={20} weight="bold" />
      </button>

      {/* Main ScoreHub */}
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

      {/* Action Buttons: Rematch, Packs, Home */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/create-room')}
          leftIcon={<AppIcon icon={ArrowCounterClockwise} size={16} weight="bold" />}
        >
          {t('results.rematch')}
        </Button>

        <Button
          variant="gold"
          size="md"
          onClick={() => router.push('/packs')}
          leftIcon={<AppIcon icon={Cards} size={16} weight="bold" />}
        >
          {t('results.packs')}
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => router.push('/')}
          leftIcon={<AppIcon icon={House} size={16} weight="bold" />}
        >
          {t('results.home')}
        </Button>
      </div>
    </PageShell>
  );
}
