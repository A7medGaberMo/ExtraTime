"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/shared/toast";
import { Trophy, Users, PlusCircle, Zap, Swords, Binoculars, Shield, Loader2, Clock, Globe, Flame, Star, Crown, UserCheck, X, RefreshCw, LayoutGrid } from "lucide-react";

type PoolMode = "GLOBAL" | "ACTIVE" | "EPL" | "TOP_TEAMS" | "ICONS";

import { randomEgyptianManagerName as randomName } from "@/lib/random-names";

const poolOptions = [
  { id: "ACTIVE" as PoolMode, label: "Active", icon: UserCheck, sub: "Current players" },
  { id: "GLOBAL" as PoolMode, label: "Global", icon: Globe, sub: "All + Legends" },
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
    <article className="max-w-4xl mx-auto flex flex-col items-center gap-10 py-6 md:py-12 animate-fade-in">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <header className="text-center space-y-5 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-lime/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative animate-slide-up space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime/10 border border-lime/30 text-lime text-[11px] font-black uppercase tracking-widest shadow-md whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>30s Turn Bids • +10s Perk Boosts</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-none">
            Extra<span className="gradient-text-lime">Time</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-steel max-w-lg mx-auto leading-relaxed font-medium">
            Draft real stars. Outbid your rival. Build the best squad.
          </p>

          {/* Dynamic DB Players Badge Card (Desktop only to prevent mobile duplication) */}
          <div className="pt-2 hidden sm:flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-lime/30 shadow-xl backdrop-blur-md transition-all hover:border-lime/60">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-lime/10 text-lime border border-lime/30 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-wider text-steel">Live Player Database</div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span className="text-lime text-sm font-stats">
                    {dbStats?.totalPlayers ? dbStats.totalPlayers.toLocaleString() : "3,126"}
                  </span>
                  <span>Active Stars & Icons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CTA BUTTONS ────────────────────────────────────────────────── */}
      <nav aria-label="Main Actions" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full max-w-xl animate-slide-up delay-100" style={{ animationFillMode: 'both' }}>
        <Link
          href="/create-room"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic shadow-xl shadow-lime/20 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Create Room</span>
        </Link>
        <Link
          href="/join-room"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-card hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-border hover:border-white/30 shadow-md whitespace-nowrap"
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Join Room</span>
        </Link>
        <Link
          href="/squad-draft/create"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-lime/10 text-lime font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-lime/40 hover:border-lime shadow-lg whitespace-nowrap"
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Squad Draft</span>
        </Link>
        <Link
          href="/squad-draft/join"
          className="hidden sm:flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-lime/10 text-lime font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-lime/40 hover:border-lime shadow-lg whitespace-nowrap"
        >
          <Users className="w-4 h-4 shrink-0 text-lime" />
          <span>Join Draft</span>
        </Link>
        <Link
          href="/packs"
          className="hidden sm:flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-amber-500/10 text-amber-400 font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-amber-500/40 hover:border-amber-400 shadow-lg whitespace-nowrap"
        >
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Tier Packs</span>
        </Link>
      </nav>

      {/* ── QUICK MATCH ARENA ───────────────────────────────────────────── */}
      <section aria-label="Public Matchmaking" className="w-full max-w-xl rounded-3xl border border-lime/30 bg-gradient-to-b from-lime/5 via-card/80 to-card p-3 sm:p-6 space-y-5 animate-slide-up delay-200 shadow-2xl shadow-lime/5" style={{ animationFillMode: 'both' }}>
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="p-2.5 rounded-xl bg-lime/10 text-lime border border-lime/30 shrink-0">
            <Zap className="w-5 h-5 fill-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-white text-base uppercase tracking-tight whitespace-nowrap truncate">
              <span className="hidden sm:inline">Public </span>Matchmaking
            </h2>
            <p className="text-[11px] text-steel font-medium whitespace-nowrap truncate">Quick 30s bid rounds vs real players</p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-steel tracking-wider block whitespace-nowrap">Player Pool</span>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-2">
            {/* Mobile Row 1: 2 items (Global, Active Stars) */}
            <div className="grid grid-cols-2 gap-2 sm:contents">
              {poolOptions.slice(0, 2).map((option) => {
                const IconComp = option.icon;
                const selected = poolMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPoolMode(option.id)}
                    className={`min-h-[72px] sm:min-h-[76px] rounded-xl border p-2 text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                      selected ? "border-lime/60 bg-lime/10" : "border-white/10 bg-slate-950/80"
                    }`}
                  >
                    <IconComp className={`mx-auto mb-1 h-4 w-4 shrink-0 ${selected ? "text-lime" : "text-steel"}`} />
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate max-w-full">{option.label}</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-steel whitespace-nowrap truncate max-w-full">{option.sub}</p>
                  </button>
                );
              })}
            </div>

            {/* Mobile Row 2: 3 items (EPL, Top Clubs, Icons) */}
            <div className="grid grid-cols-3 gap-2 sm:contents">
              {poolOptions.slice(2).map((option) => {
                const IconComp = option.icon;
                const selected = poolMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPoolMode(option.id)}
                    className={`min-h-[72px] sm:min-h-[76px] rounded-xl border p-2 text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                      selected ? "border-lime/60 bg-lime/10" : "border-white/10 bg-slate-950/80"
                    }`}
                  >
                    <IconComp className={`mx-auto mb-1 h-4 w-4 shrink-0 ${selected ? "text-lime" : "text-steel"}`} />
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate max-w-full">{option.label}</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-steel whitespace-nowrap truncate max-w-full">{option.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openNameModal(11)}
            disabled={loading}
            className="py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime/10 transition-all btn-haptic disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (
              <>
                <span className="whitespace-nowrap">11 vs 11</span>
                {waiting11 > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-950 font-stats whitespace-nowrap bg-slate-950/15 px-2 py-0.5 rounded-full border border-slate-950/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-950 shadow-[0_0_6px_rgba(2,6,23,0.8)] shrink-0 animate-pulse" />
                    {waiting11}
                  </span>
                )}
              </>
            )}
          </button>
          <button
            onClick={() => openNameModal(5)}
            disabled={loading}
            className="py-4 bg-slate-900 hover:bg-white/5 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-border transition-all btn-haptic disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (
              <>
                <span className="whitespace-nowrap">5 vs 5</span>
                {waiting5 > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-lime font-stats whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_6px_rgba(149,232,16,0.8)] shrink-0" />
                    {waiting5}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ────────────────────────────────────────── */}
      <section aria-label="Core Features" className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up delay-300" style={{ animationFillMode: 'both' }}>
        {[
          { icon: Swords, title: "Hidden Bids", desc: "Bid or pass. Win the star or get the backup." },
          { icon: Shield, title: "Auto Formation", desc: "Random 4-3-3, 4-4-2, 3-5-2 each game." },
          { icon: Binoculars, title: "Perks", desc: "Use Scout or Spy for intel and +10s time." },
          { icon: LayoutGrid, title: "Squad Draft", desc: "Snake draft your XI with Joker wildcards." },
        ].map((f) => (
          <div key={f.title} className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center text-center gap-3 hover:border-lime/30 hover:shadow-lg hover:shadow-lime/5 transition-all group">
            <div className="p-2.5 rounded-xl bg-lime/10 text-lime group-hover:scale-110 transition-transform shrink-0">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white whitespace-nowrap">{f.title}</h3>
            <p className="text-xs text-steel leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── NAME POPUP MODAL ──────────────────────────────────────────── */}
      {showNameModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { if (!loading) setShowNameModal(false); }}
        >
          <div
            className="relative w-full max-w-sm bg-slate-900 border border-white/20 rounded-2xl p-5 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNameModal(false)}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-all disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 mb-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lime px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/30">
                <Swords className="w-3 h-3" />
                <span>{pendingMatchSize} vs {pendingMatchSize}</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Enter the Arena</h3>
              <p className="text-xs text-steel font-medium">Set your name and go</p>
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3.5 text-sm font-black uppercase tracking-widest text-slate-950 shadow-xl shadow-lime/15 transition-all hover:bg-vivid active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Finding Match...</>
              ) : (
                <><Swords className="h-4 w-4" /> Find Match</>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
