"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { ScoreHub } from "@/components/match/score-hub";
import type { PitchSquadPlayer } from "@/components/match/tactical-pitch-view";
import type { MatchSimulationResult } from "@/core/simulation/simulation.interface";
import { useGuestSession } from "@/hooks/use-guest-session";
import { unlockAudio } from "@/lib/sfx";
import { Loader2, RefreshCw, Trophy, Home, Volume2 } from "lucide-react";

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
  const { guestId } = useGuestSession(true);
  const roomIdTyped = roomId as Id<"rooms">;

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomIdTyped, userId: guestId } : "skip"
  );
  const match = useQuery(api.matches.queries.getByRoom, roomId ? { roomId: roomIdTyped } : "skip");

  const runSimulation = useMutation(api.matches.mutations.runSimulation);
  const triggeredRef = useRef(false);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    const mat = match as HydratedMatch | null | undefined;
    const needsTrigger =
      mat && !mat.simulation && !triggeredRef.current && guestId && roomId;
    if (needsTrigger && guestId) {
      triggeredRef.current = true;
      void runSimulation({ roomId: roomIdTyped, userId: guestId }).catch(console.error);
    }
  }, [match, guestId, roomId, roomIdTyped, runSimulation]);

  useEffect(() => {
    if (audioReady) unlockAudio();
  }, [audioReady]);

  const simulation = (match as HydratedMatch | null | undefined)?.simulation ?? null;

  const viewerIsHost = state?.isHost ?? true;

  const hostSquad = useMemo<PitchSquadPlayer[]>(() => {
    const raw = viewerIsHost ? state?.mySquad : state?.opponentSquad;
    if (!raw) return [];
    return (raw as unknown as SquadSlot[]).map((slot) => ({
      playerId: slot.player?._id ?? slot.playerId,
      name: slot.player?.name ?? "",
      tier: slot.player?.tier ?? "GOLD",
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
      name: slot.player?.name ?? "",
      tier: slot.player?.tier ?? "GOLD",
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
  const myName = viewerName ? `You (${viewerName})` : "You";
  const rivalName = opponentName ?? "Rival";

  const viewerWon =
    simulation == null
      ? null
      : simulation.winnerId == null
        ? null
        : simulation.winnerId === guestId;

  const formation = state?.auction?.formation ?? "4-3-3";
  const matchSize = ((state?.auction?.matchSize ?? 11) as 5 | 11) || 11;

  if (!guestId || state === undefined || match === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-lime" />
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Loading Matchday...</p>
        </div>
      </div>
    );
  }

  if (!match || !simulation) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-3 text-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-lime/25 blur-2xl" />
          <Loader2 className="relative h-10 w-10 animate-spin text-lime" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-tight text-white">Final Whistle</h2>
          <p className="text-xs font-medium text-steel">
            Both squads are locked in. The tactical engine is resolving the matchday...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in px-3">
      <PageHeader
        title="Hidden Bid Result"
        subtitle="Match result · sealed bids resolved."
        backUrl="/"
        className="mb-1"
      />

      <button
        onClick={() => {
          setAudioReady(true);
          unlockAudio();
        }}
        className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-xl border shadow-xl backdrop-blur-xl transition-all ${
          audioReady
            ? "border-lime/30 bg-lime/10 text-lime"
            : "border-white/10 bg-card/90 text-steel hover:text-lime"
        }`}
        title="Enable matchday audio"
      >
        <Volume2 className="h-4 w-4" />
      </button>

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

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => router.push("/create-room")}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-lime py-3 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg transition-all hover:bg-vivid active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Rematch
        </button>
        <button
          onClick={() => router.push("/packs")}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-slate-900 py-3 text-[10px] font-black uppercase tracking-wider text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-500/10 active:scale-95"
        >
          <Trophy className="h-3.5 w-3.5" /> Packs
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-card py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-white/5 active:scale-95"
        >
          <Home className="h-3.5 w-3.5" /> Home
        </button>
      </div>
    </div>
  );
}