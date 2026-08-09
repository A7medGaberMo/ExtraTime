"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { Trophy, RefreshCw, Swords, Crown } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  ICON: "bg-amber-400 text-slate-950",
  HERO: "bg-amber-300 text-slate-950",
  MASTER: "bg-fuchsia-400 text-slate-950",
  ELITE_PLUS: "bg-lime-300 text-slate-950",
  ELITE: "bg-lime-500 text-slate-950",
  GOLD: "bg-yellow-400 text-slate-950",
  SILVER: "bg-slate-300 text-slate-950",
  BRONZE: "bg-orange-500 text-slate-950",
};

export default function SquadDraftResultPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const result = useQuery(
    api.squadDraft.queries.getMatchResultByRoom,
    roomId ? { roomId: roomId as Id<"rooms"> } : "skip"
  );

  const host = result?.squads?.host;
  const guest = result?.squads?.guest;
  const hostScore = result?.score?.host ?? 0;
  const guestScore = result?.score?.guest ?? 0;
  const winnerSide = result?.winnerSide;
  const wasShootout = result?.wasShootout ?? false;

  const heading = winnerSide
    ? winnerSide === "host"
      ? "Host wins the match!"
      : "Guest wins the match!"
    : wasShootout
      ? "Penalties decided it!"
      : "A fair draw.";

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fade-in">
      <PageHeader
        title="Match Result"
        subtitle="The squads have clashed — here's how the chemistry played out."
        backUrl="/"
        className="mb-3"
      />

      {result === undefined && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-16 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-lime" />
          <p className="text-sm font-black text-white">Simulating the match...</p>
        </div>
      )}

      {result !== null && result !== undefined && (
        <>
          {/* Scoreboard */}
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full bg-lime/10 blur-3xl" />
            <div className="relative flex flex-col items-center gap-4">
              <span className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                <Trophy className="h-4 w-4" /> {heading}
              </span>

              <div className="flex w-full items-center justify-center gap-4 sm:gap-10">
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-lime/50 bg-slate-950 font-stats text-2xl text-lime">
                    H
                  </div>
                  <p className="text-sm font-black text-white">Host</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-steel">
                    {host?.isSubmitted ? `Chem ${host.totalChem}/33` : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <span className={`font-stats text-6xl sm:text-7xl ${hostScore > guestScore ? "text-lime" : "text-white"}`}>
                    {hostScore}
                  </span>
                  <span className="font-stats text-4xl text-steel">:</span>
                  <span className={`font-stats text-6xl sm:text-7xl ${guestScore > hostScore ? "text-lime" : "text-white"}`}>
                    {guestScore}
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-400/50 bg-slate-950 font-stats text-2xl text-sky-300">
                    G
                  </div>
                  <p className="text-sm font-black text-white">Guest</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-steel">
                    {guest?.isSubmitted ? `Chem ${guest.totalChem}/33` : "—"}
                  </p>
                </div>
              </div>

              {wasShootout && (
                <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Resolved on penalties
                </span>
              )}

              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-xl shadow-lime/15 transition-all hover:bg-vivid active:scale-[0.98]"
              >
                <Swords className="h-4 w-4" /> New Duel
              </button>
            </div>
          </section>

          {/* Squad cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SquadPanel title="Host Squad" isWinner={winnerSide === "host"} squad={host} accent="lime" />
            <SquadPanel title="Guest Squad" isWinner={winnerSide === "guest"} squad={guest} accent="sky" />
          </div>
        </>
      )}

      {result === null && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-16 text-center">
          <p className="text-sm font-black text-white">No completed match for this room yet.</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-lime px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-950"
          >
            Back Home
          </button>
        </div>
      )}
    </div>
  );
}

function SquadPanel({
  title,
  isWinner,
  squad,
  accent,
}: {
  title: string;
  isWinner: boolean;
  squad: SquadView | undefined;
  accent: "lime" | "sky";
}) {
  const border = accent === "lime" ? "border-lime/40 bg-lime/10" : "border-sky-400/40 bg-sky-400/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-card/90 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`flex items-center gap-2 text-base font-black ${isWinner ? "text-lime" : "text-white"}`}>
          {isWinner && <Crown className="h-5 w-5 text-amber-300" />}
          {title}
        </h2>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${border}`}>
          {squad?.isSubmitted ? `${squad.totalChem}/33 chem · ${squad.totalOvr} OVR` : "Awaiting"}
        </span>
      </div>

      <div className="space-y-1.5">
        {(squad?.slots ?? []).map((slot) => (
          <div
            key={slot.slotIndex}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2"
          >
            <span className="w-10 shrink-0 text-[10px] font-black uppercase tracking-widest text-steel">
              {slot.position}
            </span>
            {slot.player ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white">
                    {slot.player.name}
                    {slot.isJoker && <Crown className="ml-1 inline h-3 w-3 text-amber-300" />}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-steel">
                    {slot.player.position}
                  </p>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-black ${TIER_COLORS[slot.player.tier] ?? "bg-slate-700 text-white"}`}>
                  {slot.player.tier}
                </span>
                <span className="w-14 text-right font-stats text-sm text-lime">{slot.syntheticOvr}</span>
              </>
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-steel">Empty slot</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

interface SquadView {
  isSubmitted: boolean;
  totalChem: number;
  totalOvr: number;
  slots: Array<{
    slotIndex: number;
    position: string;
    isJoker: boolean;
    chemContribution: number;
    syntheticOvr: number;
    player?: {
      playerId: string;
      name: string;
      tier: string;
      position: string;
      imageUrl?: string;
    };
  }>;
}