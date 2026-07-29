"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { TacticalPitch } from "@/components/shared/tactical-pitch";
import { useGuestSession } from "@/hooks/use-guest-session";
import { Loader2, Trophy, Swords, RefreshCw, Home } from "lucide-react";

/* Tier weights for squad quality evaluation */
const TIER_WEIGHTS: Record<string, number> = {
  ICON: 7, MASTER: 6, ELITE_PLUS: 5, ELITE: 4,
  GOLD: 3, SILVER: 2, BRONZE: 1,
};

/* Tier counts breakdown helper */
function countTiers(squad: Array<{ player?: { tier?: string } | null }>) {
  const counts: Record<string, number> = { ICON: 0, MASTER: 0, ELITE_PLUS: 0, ELITE: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
  for (const item of squad) {
    if (item.player?.tier && counts[item.player.tier] !== undefined) {
      counts[item.player.tier]++;
    }
  }
  return counts;
}

export default function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { guestId } = useGuestSession(true);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip"
  );

  const rawMySquad = state?.mySquad;
  const rawRivalSquad = state?.opponentSquad;

  const mySquad = useMemo(() => rawMySquad ?? [], [rawMySquad]);
  const rivalSquad = useMemo(() => rawRivalSquad ?? [], [rawRivalSquad]);

  /* 1. Squad Quality Score: sum of tier weights */
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

  /* 2. Winner Determination Logic:
     - Higher Tier Quality Score wins
     - If equal, Manager with MORE remaining budget (spent less) wins!
     - If budget also equal, Manager with LESS total spent wins!
  */
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-lime animate-spin" />
          <p className="text-xs text-steel font-bold uppercase tracking-widest">Loading Final Match Summary…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 md:py-6 pb-20 animate-fade-in">
      <PageHeader title="Match Summary & Results" subtitle="Final draft evaluation and tactical comparison" backUrl="/" />

      {/* ── WINNER HERO BANNER ────────────────────────────────────────── */}
      <div className={`relative w-full rounded-3xl border p-5 md:p-6 overflow-hidden shadow-2xl transition-all ${
        iWon
          ? "border-lime/40 bg-gradient-to-b from-lime/10 via-card to-card shadow-[0_0_50px_rgba(149,232,16,0.15)]"
          : "border-purple-500/40 bg-gradient-to-b from-purple-500/10 via-card to-card shadow-[0_0_50px_rgba(168,85,247,0.15)]"
      }`}>
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-lime flex items-center justify-center shadow-xl shadow-lime/20 animate-bounce">
            <Trophy className="w-7 h-7 text-lime" />
          </div>

          <div className="space-y-0.5">
            <span className="px-3 py-0.5 rounded-full bg-lime/10 text-lime text-[11px] font-black uppercase tracking-widest border border-lime/30">
              {iWon ? "🏆 VICTORIOUS MANAGER" : "🥈 RUNNER-UP DRAFT"}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
              {iWon ? "Draft Champion!" : "Competitive Match"}
            </h1>
          </div>

          {/* Quick Scoreboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl pt-2">
            <div className="bg-slate-900/80 border border-border p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-steel font-black uppercase">Your Squad Rating</span>
              <span className="text-xl font-stats text-lime">{mySquadQuality} <span className="text-xs font-normal">pts</span></span>
              <span className="text-[9px] text-steel mt-0.5">${myRemainingBudget}M Budget Saved</span>
            </div>
            <div className="bg-slate-900/80 border border-border p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-steel font-black uppercase">Rival Squad Rating</span>
              <span className="text-xl font-stats text-rose-400">{rivalSquadQuality} <span className="text-xs font-normal">pts</span></span>
              <span className="text-[9px] text-steel mt-0.5">${rivalRemainingBudget}M Budget Saved</span>
            </div>
            <div className="bg-slate-900/80 border border-border p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-steel font-black uppercase">Your Top Tiers</span>
              <span className="text-xl font-stats text-amber-400">
                {myTierCounts.ICON > 0 ? `${myTierCounts.ICON} Icon` : `${myTierCounts.MASTER + myTierCounts.ELITE_PLUS} Elite+`}
              </span>
              <span className="text-[9px] text-steel mt-0.5">Total Spent: ${myTotalSpent}M</span>
            </div>
            <div className="bg-slate-900/80 border border-border p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-steel font-black uppercase">Rival Top Tiers</span>
              <span className="text-xl font-stats text-purple-400">
                {rivalTierCounts.ICON > 0 ? `${rivalTierCounts.ICON} Icon` : `${rivalTierCounts.MASTER + rivalTierCounts.ELITE_PLUS} Elite+`}
              </span>
              <span className="text-[9px] text-steel mt-0.5">Total Spent: ${rivalTotalSpent}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => router.push("/create-room")}
          className="px-5 py-3 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Play Rematch
        </button>
        <button
          onClick={() => router.push("/packs")}
          className="px-5 py-3 bg-slate-900 hover:bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 hover:border-amber-400 transition-all flex items-center gap-2"
        >
          <Trophy className="w-4 h-4 text-amber-400" /> Open Tier Packs
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-3 bg-card hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-border transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Main Menu
        </button>
      </div>

      {/* ── SIDE-BY-SIDE TACTICAL PITCHES ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-lime" /> Final Lineups & Formations
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TacticalPitch
            formation={state?.auction?.formation || "4-3-3"}
            matchSize={(state?.auction?.matchSize as 5 | 11) || 11}
            squad={mySquad}
            title="Your Final Lineup"
            accentColor="#95E810"
            badgeLabel="HOME MANAGER"
          />
          <TacticalPitch
            formation={state?.auction?.formation || "4-3-3"}
            matchSize={(state?.auction?.matchSize as 5 | 11) || 11}
            squad={rivalSquad}
            title="Rival Final Lineup"
            accentColor="#F43F5E"
            badgeLabel="AWAY MANAGER"
          />
        </div>
      </div>
    </div>
  );
}
