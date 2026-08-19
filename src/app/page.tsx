"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/shared/toast";
import {
  Trophy, Users, PlusCircle, Swords, Globe, Loader2,
  Flame, Star, Crown, UserCheck, X, RefreshCw, ArrowRight, Clock, Coins, Binoculars
} from "lucide-react";
import { randomEgyptianManagerName as randomName } from "@/lib/random-names";

type PoolMode = "GLOBAL" | "ACTIVE" | "EPL" | "TOP_TEAMS" | "ICONS";

const poolOptions = [
  { id: "ACTIVE" as PoolMode, label: "Active", icon: UserCheck, sub: "Current stars" },
  { id: "GLOBAL" as PoolMode, label: "Global", icon: Globe, sub: "All + Icons" },
  { id: "EPL" as PoolMode, label: "EPL", icon: Flame, sub: "Prem only" },
  { id: "TOP_TEAMS" as PoolMode, label: "Top Clubs", icon: Star, sub: "Big teams" },
  { id: "ICONS" as PoolMode, label: "Icons", icon: Crown, sub: "Legends" },
];

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createGuest = useMutation(api.guests.mutations.create);
  const findMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const queueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const dbStats = useQuery(api.players.queries.getStats);

  const [poolMode, setPoolMode] = useState<PoolMode>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingMatchSize, setPendingMatchSize] = useState<5 | 11 | null>(null);
  const [nickname, setNickname] = useState(() => randomName());

  const waiting11 = queueSummary?.queues[poolMode]?.[11] ?? 0;
  const waiting5 = queueSummary?.queues[poolMode]?.[5] ?? 0;
  const playerCount = dbStats === undefined ? "..." : dbStats.totalPlayers.toLocaleString();

  function openNameModal(matchSize: 5 | 11) {
    const saved = localStorage.getItem("extratime_guestName");
    setNickname(saved || randomName());
    setPendingMatchSize(matchSize);
    setShowNameModal(true);
  }

  async function quickMatch() {
    if (loading || !pendingMatchSize || !nickname.trim()) return;
    setLoading(true);
    setShowNameModal(false);
    try {
      const userId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem("extratime_guestId", userId);
      localStorage.setItem("extratime_guestName", nickname.trim());
      const result = await findMatch({ userId, matchSize: pendingMatchSize, poolMode });
      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || "Could not start matchmaking", "error");
      setLoading(false);
    }
  }

  return (
    <article className="max-w-5xl mx-auto flex flex-col items-center gap-8 py-6 md:py-10 animate-fade-in px-3 sm:px-6">
      {/* ── HERO HEADER ────────────────────────────────────────────────── */}
      <header className="text-center space-y-3.5 relative w-full pt-2">
        {/* Ambient backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[250px] bg-gradient-to-r from-lime/15 via-sky-500/15 to-amber-500/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative animate-slide-up space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-lime/40 text-lime text-xs font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
            <Trophy className="w-4 h-4 shrink-0 text-lime" />
            <span>The Premier Football Strategy Arena</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white uppercase leading-none">
            Extra<span className="gradient-text-lime">Time</span>
          </h1>

          <p className="text-xs sm:text-base text-steel max-w-xl mx-auto font-medium leading-relaxed">
            Outsmart rivals in <strong className="text-lime">Hidden Bid Auctions</strong>. Manage budget, unleash tactical Scout & Spy perks, and build your championship squad.
          </p>
        </div>
      </header>

      {/* ── FLAGSHIP HIDDEN BID AUCTION ARENA CARD ────────────────────────────── */}
      <section aria-label="Hidden Bid Arena" className="w-full max-w-3xl animate-slide-up delay-100" style={{ animationFillMode: "both" }}>
        <div className="relative overflow-hidden rounded-3xl border border-lime/50 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col justify-between group hover:border-lime transition-all duration-300">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime/20 blur-3xl group-hover:bg-lime/30 transition-all" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/15 text-lime border border-lime/40 shadow-xl shadow-lime/10">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime">Multiplayer Strategy Arena</span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Hidden Bid Auction</h2>
                </div>
              </div>
              <span className="rounded-full bg-lime/20 border border-lime/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lime">
                Live Duel
              </span>
            </div>

            <p className="text-xs sm:text-sm text-steel font-medium leading-relaxed">
              Place secret bids against your rival in 30-second escalating auction rounds. The winning bid takes the star; the losing bid claims the hidden backup card!
            </p>

            {/* Core Tactical Rules Highlights */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center sm:text-left">
                <div className="flex items-center gap-1.5 mb-1 justify-center sm:justify-start">
                  <Clock className="w-3.5 h-3.5 text-lime" />
                  <span className="text-[10px] font-black uppercase text-lime">30s Turns</span>
                </div>
                <p className="text-[10px] text-steel font-medium">Fast-paced live auctions</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center sm:text-left">
                <div className="flex items-center gap-1.5 mb-1 justify-center sm:justify-start">
                  <Binoculars className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-black uppercase text-sky-400">Scout & Spy</span>
                </div>
                <p className="text-[10px] text-steel font-medium">Tactical intelligence perks</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center sm:text-left">
                <div className="flex items-center gap-1.5 mb-1 justify-center sm:justify-start">
                  <Coins className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[10px] font-black uppercase text-amber-300">Budget Cap</span>
                </div>
                <p className="text-[10px] text-steel font-medium">Strategic resource bidding</p>
              </div>
            </div>

            {/* Player Pool Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-steel tracking-wider">Select Player Pool</span>
                <span className="text-[10px] font-black uppercase text-lime">{poolMode}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {poolOptions.map((option) => {
                  const IconComp = option.icon;
                  const selected = poolMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPoolMode(option.id)}
                      className={`py-2.5 px-1.5 rounded-xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                        selected
                          ? "border-lime bg-lime/20 text-white shadow-lg shadow-lime/10"
                          : "border-white/10 bg-slate-900/90 text-steel hover:text-white"
                      }`}
                    >
                      <IconComp className={`h-4 w-4 mb-1 ${selected ? "text-lime" : "text-steel"}`} />
                      <span className="text-[9px] font-black uppercase tracking-wider truncate w-full">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 relative z-10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openNameModal(11)}
                disabled={loading}
                className="py-4 bg-gradient-to-r from-lime to-vivid hover:from-vivid hover:to-lime text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic shadow-lg shadow-lime/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (
                  <>
                    <span>11 vs 11 Arena</span>
                    {waiting11 > 0 && (
                      <span className="text-[9px] font-stats bg-slate-950/30 px-1.5 py-0.5 rounded-full text-slate-950">
                        {waiting11}
                      </span>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={() => openNameModal(5)}
                disabled={loading}
                className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-lime/40 transition-all btn-haptic disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (
                  <>
                    <span>5 vs 5 Quick Match</span>
                    {waiting5 > 0 && (
                      <span className="text-[9px] font-stats text-lime">
                        {waiting5}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 px-1">
              <Link
                href="/create-room"
                className="text-[11px] font-black text-steel hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-lime" />
                <span>Create Custom Room</span>
              </Link>
              <Link
                href="/join-room"
                className="text-[11px] font-black text-steel hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-steel" />
                <span>Join with Code</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC DATABASE STATS & PACKS SECTION ────────────────────────────────── */}
      <section aria-label="Stats and Tier Packs" className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up delay-200" style={{ animationFillMode: "both" }}>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4 shadow-xl backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/10 text-lime border border-lime/30 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-steel tracking-wider">Live Player Database</span>
            <p className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <span className="text-lime font-stats text-lg">{playerCount}</span>
              <span className="text-steel text-xs font-normal">Active Stars & Icons</span>
            </p>
          </div>
        </div>

        <Link href="/packs" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-center justify-between hover:border-amber-400 transition-all group shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shrink-0 font-black shadow-md shadow-amber-400/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block truncate">Card Collection</span>
              <p className="text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate mt-0.5">Explore Packs & Tier Stars</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </Link>
      </section>

      {/* ── NAME POPUP MODAL FOR AUCTION MATCHMAKING ───────────────────── */}
      {showNameModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { if (!loading) setShowNameModal(false); }}
        >
          <div
            className="relative w-full max-w-sm bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNameModal(false)}
              disabled={loading}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-all disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lime px-3 py-1 rounded-full bg-lime/10 border border-lime/30">
                <Swords className="w-3 h-3" />
                <span>{pendingMatchSize} vs {pendingMatchSize} Hidden Bid Arena</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Enter the Arena</h3>
              <p className="text-xs text-steel font-medium">Choose your manager handle</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-steel">Manager Name</label>
              <div className="flex gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={24}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-base font-black text-white outline-none transition-all placeholder:text-steel focus:border-lime/70 focus:ring-2 focus:ring-lime/20 disabled:opacity-30"
                  placeholder="Your name"
                  autoFocus
                />
                <button
                  onClick={() => setNickname(randomName())}
                  disabled={loading}
                  className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-steel transition-all hover:border-lime/50 hover:text-lime active:scale-95 disabled:opacity-30"
                  title="Randomize"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              onClick={quickMatch}
              disabled={loading || !nickname.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime to-vivid text-slate-950 px-4 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-lime/20 transition-all hover:from-vivid hover:to-lime active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin shrink-0" /> Finding Match...</>
              ) : (
                <><Swords className="h-4 w-4 shrink-0" /> Start Hidden Bid Auction</>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

