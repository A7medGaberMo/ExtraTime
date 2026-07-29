"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Users, PlusCircle, Zap, Swords, Sparkles, Shield, Loader2, Clock, Layers } from "lucide-react";

type PoolMode = "GLOBAL" | "EPL" | "ICONS";

const FIRST = ["Coach", "Boss", "Gaffer", "Mister", "Don", "Captain", "Chief", "Maestro", "Legend", "Striker"];
const LAST = ["Santos", "Müller", "Silva", "Ali", "Rossi", "Park", "König", "Torres", "Diallo", "Kovač"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

export default function HomePage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const findMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const queueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const [poolMode, setPoolMode] = useState<PoolMode>("GLOBAL");
  const [loading, setLoading] = useState(false);
  const waiting11 = queueSummary?.queues[poolMode][11] ?? 0;
  const waiting5 = queueSummary?.queues[poolMode][5] ?? 0;

  async function quickMatch(matchSize: 5 | 11) {
    if (loading) return;
    setLoading(true);
    try {
      const nickname = randomName();
      const userId = await createGuest({ nickname, avatarSeed: nickname });
      localStorage.setItem("extratime_guestId", userId);
      const result = await findMatch({ userId, matchSize, poolMode });
      router.push(`/auction/${result.roomId}`);
    } catch (error: any) {
      alert(error.message || "Could not start matchmaking");
      setLoading(false);
    }
  }

  const selectClass = "w-full bg-card/90 border border-border/80 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-lime transition-all appearance-none cursor-pointer";

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-10 py-6 md:py-12 pb-24 md:pb-12 animate-fade-in">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-5 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-lime/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative animate-slide-up space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime/10 border border-lime/30 text-lime text-[11px] font-black uppercase tracking-widest shadow-md">
            <Clock className="w-3.5 h-3.5" /> 30s Turn Drafts • +10s Perk Boosts
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-none">
            Extra<span className="gradient-text-lime">Time</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-steel max-w-xl mx-auto leading-relaxed">
            The ultimate collectible football drafting platform — blind auctions, tactical pitch management, real-time database player packs, and dynamic perks.
          </p>
        </div>
      </div>

      {/* ── CTA BUTTONS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-xl animate-slide-up delay-100" style={{ animationFillMode: 'both' }}>
        <Link
          href="/create-room"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic shadow-xl shadow-lime/20"
        >
          <PlusCircle className="w-4 h-4" /> Create Room
        </Link>
        <Link
          href="/join-room"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-card hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-border hover:border-white/30 shadow-md"
        >
          <Users className="w-4 h-4" /> Join Room
        </Link>
        <Link
          href="/packs"
          className="flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-amber-500/10 text-amber-400 font-black text-xs uppercase tracking-wider rounded-2xl transition-all btn-haptic border border-amber-500/40 hover:border-amber-400 shadow-lg"
        >
          <Trophy className="w-4 h-4 text-amber-400" /> Tier Packs
        </Link>
      </div>

      {/* ── QUICK MATCH ARENA ───────────────────────────────────────────── */}
      <div className="w-full max-w-md rounded-3xl border border-lime/30 bg-gradient-to-b from-lime/5 via-card/80 to-card p-6 space-y-5 animate-slide-up delay-200 shadow-2xl shadow-lime/5" style={{ animationFillMode: 'both' }}>
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="p-2.5 rounded-xl bg-lime/10 text-lime border border-lime/30">
            <Zap className="w-5 h-5 fill-lime" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-white text-base uppercase tracking-tight">Public Matchmaking</h2>
            <p className="text-[11px] text-steel">Instant 30s turn draft against online managers</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-steel tracking-wider block">Player Pool Filter</span>
          <select value={poolMode} onChange={(e) => setPoolMode(e.target.value as PoolMode)} className={selectClass}>
            <option value="GLOBAL">🌍 Global Mix — All Top Leagues</option>
            <option value="EPL">🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL Only — Premier League Stars</option>
            <option value="ICONS">👑 Icons Only — Global Legends</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => quickMatch(11)}
            disabled={loading}
            className="py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime/10 transition-all btn-haptic disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                11 vs 11
                {waiting11 > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-stats">{waiting11} in queue</span>
                )}
              </>
            )}
          </button>
          <button
            onClick={() => quickMatch(5)}
            disabled={loading}
            className="py-4 bg-slate-900 hover:bg-white/5 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-border transition-all btn-haptic disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                5 vs 5
                {waiting5 > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-lime font-stats">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_6px_rgba(149,232,16,0.8)]" />
                    {waiting5}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── FEATURE HIGHLIGHTS ────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up delay-300" style={{ animationFillMode: 'both' }}>
        {[
          { icon: Swords, title: "30s Hidden Bids", desc: "Outbid or pass — win the star or get the backup sub card." },
          { icon: Shield, title: "Tactical Formations", desc: "Auto-assigned 4-3-3, 4-4-2, 3-5-2 and more every match." },
          { icon: Sparkles, title: "Scout & Spy Perks", desc: "Activate Perks to gain intel and add +10s to your turn timer." },
        ].map((f) => (
          <div key={f.title} className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center text-center gap-3 hover:border-lime/30 hover:shadow-lg hover:shadow-lime/5 transition-all group">
            <div className="p-2.5 rounded-xl bg-lime/10 text-lime group-hover:scale-110 transition-transform">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white">{f.title}</h3>
            <p className="text-xs text-steel leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
