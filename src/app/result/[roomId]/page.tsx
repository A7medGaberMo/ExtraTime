"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { TacticalPitch } from "@/components/shared/tactical-pitch";
import { useGuestSession } from "@/hooks/use-guest-session";
import { Loader2, Trophy, Swords, RefreshCw, Home, Package, Coins, Star } from "lucide-react";

const TIER_WEIGHTS: Record<string, number> = {
  ICON: 7, HERO: 6.5, MASTER: 6, ELITE_PLUS: 5, ELITE: 4,
  GOLD: 3, SILVER: 2, BRONZE: 1,
};

function countTiers(squad: Array<{ player?: { tier?: string } | null }>) {
  const counts: Record<string, number> = { ICON: 0, HERO: 0, MASTER: 0, ELITE_PLUS: 0, ELITE: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
  for (const item of squad) {
    if (item.player?.tier && counts[item.player.tier] !== undefined) {
      counts[item.player.tier]++;
    }
  }
  return counts;
}

function topTierLabel(counts: Record<string, number>) {
  if (counts.ICON > 0) return `${counts.ICON} Icon`;
  if (counts.HERO > 0) return `${counts.HERO} Hero`;
  const eliteCount = counts.MASTER + counts.ELITE_PLUS + counts.ELITE;
  if (eliteCount > 0) return `${eliteCount} Elite`;
  if (counts.GOLD > 0) return `${counts.GOLD} Gold`;
  return "Developing";
}

export default function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { guestId } = useGuestSession(true);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip"
  );

  const [activeTab, setActiveTab] = useState<"me" | "rival">("me");

  const rawMySquad = state?.mySquad;
  const rawRivalSquad = state?.opponentSquad;

  const mySquad = useMemo(() => rawMySquad ?? [], [rawMySquad]);
  const rivalSquad = useMemo(() => rawRivalSquad ?? [], [rawRivalSquad]);

  const viewerName = state?.isHost ? state?.hostName : state?.guestName;
  const opponentName = state?.isHost ? state?.guestName : state?.hostName;

  const myName = viewerName ? `You (${viewerName})` : "You";
  const rivalName = opponentName ?? "Rival";

  const matchSize = (state?.auction?.matchSize as 5 | 11) || 11;
  const totalRounds = matchSize === 5 ? 5 : 11;

  const mySquadQuality = useMemo(
    () => mySquad.reduce((sum, s) => sum + (TIER_WEIGHTS[s.player?.tier as string] ?? 1), 0),
    [mySquad]
  );
  const rivalSquadQuality = useMemo(
    () => rivalSquad.reduce((sum, s) => sum + (TIER_WEIGHTS[s.player?.tier as string] ?? 1), 0),
    [rivalSquad]
  );

  const myTierCounts = useMemo(() => countTiers(mySquad), [mySquad]);
  const rivalTierCounts = useMemo(() => countTiers(rivalSquad), [rivalSquad]);

  const myTotalSpent = useMemo(() => mySquad.reduce((sum, s) => sum + s.cost, 0), [mySquad]);
  const rivalTotalSpent = useMemo(() => rivalSquad.reduce((sum, s) => sum + s.cost, 0), [rivalSquad]);

  const myRemainingBudget = state?.me?.budget ?? 0;
  const rivalRemainingBudget = state?.opponent?.budget ?? 0;

  const iWon = useMemo(() => {
    if (mySquadQuality !== rivalSquadQuality) {
      return mySquadQuality > rivalSquadQuality;
    }
    if (myRemainingBudget !== rivalRemainingBudget) {
      return myRemainingBudget > rivalRemainingBudget;
    }
    return myTotalSpent <= rivalTotalSpent;
  }, [mySquadQuality, rivalSquadQuality, myRemainingBudget, rivalRemainingBudget, myTotalSpent, rivalTotalSpent]);

  if (!guestId || state === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-lime" />
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Loading Final Match Summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-in px-3">
      <PageHeader
        title="Hidden Bid Result"
        subtitle="Final squad value, saved budget, and tactical lineups."
        backUrl="/"
        className="mb-2"
      />

      <section className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:p-5 ${
        iWon
          ? "border-lime/40 bg-gradient-to-b from-lime/10 via-card to-card shadow-[0_0_50px_rgba(149,232,16,0.14)]"
          : "border-rose-400/30 bg-gradient-to-b from-rose-500/10 via-card to-card shadow-[0_0_50px_rgba(244,63,94,0.12)]"
      }`}>
        <div className="pointer-events-none absolute inset-x-10 top-0 h-36 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 items-center">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-lime/50 bg-slate-950 shadow-xl shadow-lime/15">
              <Trophy className="h-6 w-6 text-lime animate-bounce" />
            </div>
            <div>
              <span className="inline-flex rounded-full border border-lime/30 bg-lime/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-lime">
                {iWon ? "Victorious Manager" : "Runner-Up Draft"}
              </span>
              <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
                {iWon ? `${myName} Wins!` : "Strong Fight!"}
              </h1>
              <p className="mt-1 text-xs font-medium leading-relaxed text-steel max-w-sm mx-auto">
                {iWon
                  ? "Your card quality and budget control won the hidden bid battle."
                  : "Your rival edged the draft. Budget ties favor the manager who saved more."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            <div className="rounded-xl border border-lime/30 bg-lime/10 p-2.5 text-center">
              <Star className="mx-auto mb-1 h-3.5 w-3.5 text-lime" />
              <p className="text-[9px] font-black uppercase tracking-widest text-steel truncate">{myName}&apos;s Rating</p>
              <p className="font-stats text-xl text-lime">{mySquadQuality}</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center">
              <Star className="mx-auto mb-1 h-3.5 w-3.5 text-rose-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-steel truncate">{rivalName}&apos;s Rating</p>
              <p className="font-stats text-xl text-rose-400">{rivalSquadQuality}</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-center">
              <Coins className="mx-auto mb-1 h-3.5 w-3.5 text-amber-300" />
              <p className="text-[9px] font-black uppercase tracking-widest text-steel">Saved Budget</p>
              <p className="font-stats text-xl text-amber-300">${myRemainingBudget}M</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-center">
              <Package className="mx-auto mb-1 h-3.5 w-3.5 text-white" />
              <p className="text-[9px] font-black uppercase tracking-widest text-steel">Top Cards</p>
              <p className="font-stats text-base text-white truncate">{topTierLabel(myTierCounts)}</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="space-y-4">
        {/* Modern Tab Selector */}
        <div className="flex flex-col items-center gap-3 bg-card border border-white/10 p-3 rounded-2xl">
          <div className="flex items-center justify-between w-full border-b border-white/5 pb-2">
            <span className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
              <Swords className="h-4 w-4 text-lime" />
              Final Lineups
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-steel">
              Spent: ${myTotalSpent}M vs ${rivalTotalSpent}M
            </span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-white/5 w-full">
            <button
              onClick={() => setActiveTab("me")}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === "me"
                  ? "bg-lime text-slate-950 shadow-md"
                  : "text-steel hover:text-white"
              }`}
            >
              {myName}
            </button>
            <button
              onClick={() => setActiveTab("rival")}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === "rival"
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-steel hover:text-white"
              }`}
            >
              {rivalName}
            </button>
          </div>
        </div>

        {/* Tab Content: Single Pitch */}
        <div className="w-full">
          {activeTab === "me" ? (
            <TacticalPitch
              formation={state?.auction?.formation || "4-3-3"}
              matchSize={matchSize}
              squad={mySquad}
              totalRounds={totalRounds}
              title={`${myName}'s Lineup`}
              accentColor="#95E810"
              badgeLabel="HOME SQUAD"
            />
          ) : (
            <TacticalPitch
              formation={state?.auction?.formation || "4-3-3"}
              matchSize={matchSize}
              squad={rivalSquad}
              totalRounds={totalRounds}
              title={`${rivalName}'s Lineup`}
              accentColor="#F43F5E"
              badgeLabel={`AWAY · ${topTierLabel(rivalTierCounts)}`}
            />
          )}
        </div>
      </section>
    </div>
  );
}
