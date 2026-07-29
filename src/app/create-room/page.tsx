"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import {
  Loader2, Globe, Lock, RefreshCw, Clock, Zap,
  Swords, Coins, Users, Star, Crown, Flame
} from "lucide-react";

type MatchSize = 5 | 11;
type PoolMode = "GLOBAL" | "EPL" | "TOP_TEAMS" | "ICONS";

const FIRST = ["Coach", "Boss", "Gaffer", "Mister", "Don", "Captain", "Chief", "Maestro", "Legend", "Striker", "El Capitán", "Manager"];
const LAST = ["Santos", "Müller", "Silva", "Ali", "Rossi", "Park", "König", "Torres", "Diallo", "Kovač", "Zidane", "Pirlo", "Maldini", "Ramos"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const createRoom = useMutation(api.rooms.mutations.create);

  const [nickname, setNickname] = useState(() => randomName());
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>("GLOBAL");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem("extratime_guestId", guestId);
      const room = await createRoom({ hostId: guestId, matchSize, startingBudget, isPublic, poolMode });
      router.push(`/auction/${room.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Could not create room");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      <PageHeader title="Create Match" subtitle="Set up a 30s Hidden Bid arena in seconds" backUrl="/" />

      <div className="bg-card/90 border border-border/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-60 h-60 bg-lime/8 blur-3xl rounded-full pointer-events-none" />

        {/* Dynamic Timer Rule Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-lime/30 text-lime text-xs font-bold shadow-md">
          <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-lime" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-black uppercase text-[11px] tracking-wider">30s Turn Bidding</span>
            <span className="text-[10px] text-steel font-medium">Using Scout or Spy perk adds +10s decision boost</span>
          </div>
        </div>

        {/* Manager Name Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-steel tracking-widest block flex items-center justify-between">
            <span>Manager Handle</span>
            <span className="text-[9px] text-lime font-bold">Auto Generated</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="w-full bg-slate-950/90 border border-border rounded-2xl px-4 py-3.5 text-white text-sm font-black focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                placeholder="Enter handle..."
              />
            </div>
            <button
              type="button"
              onClick={() => setNickname(randomName())}
              className="px-4 rounded-2xl bg-slate-900 border border-border text-steel hover:text-lime hover:border-lime/50 transition-all active:scale-95 flex items-center justify-center gap-1.5 font-bold text-xs"
              title="Randomize manager handle"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reroll</span>
            </button>
          </div>
        </div>

        {/* Match Format */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-steel tracking-widest block">Match Format</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMatchSize(11)}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 active:scale-95 ${
                matchSize === 11
                  ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_20px_rgba(149,232,16,0.15)]"
                  : "bg-slate-950/80 border-border text-steel hover:text-white"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                matchSize === 11 ? "bg-lime/20 border-lime text-lime" : "bg-slate-900 border-border text-steel"
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-white">11 vs 11</span>
                <span className="text-[10px] text-steel font-medium truncate">Full Squad (11 Rounds)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMatchSize(5)}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 active:scale-95 ${
                matchSize === 5
                  ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_20px_rgba(149,232,16,0.15)]"
                  : "bg-slate-950/80 border-border text-steel hover:text-white"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                matchSize === 5 ? "bg-lime/20 border-lime text-lime" : "bg-slate-900 border-border text-steel"
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-white">5 vs 5</span>
                <span className="text-[10px] text-steel font-medium truncate">Futsal (5 Rounds)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Starting Budget */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-steel tracking-widest block">Starting Budget</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { amount: 100, label: "$100M", desc: "Standard" },
              { amount: 150, label: "$150M", desc: "High Stakes" },
              { amount: 200, label: "$200M", desc: "Mega Budget" },
            ].map((b) => (
              <button
                key={b.amount}
                type="button"
                onClick={() => setStartingBudget(b.amount)}
                className={`py-3 px-2 rounded-2xl text-center transition-all border flex flex-col items-center justify-center active:scale-95 ${
                  startingBudget === b.amount
                    ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_15px_rgba(149,232,16,0.15)]"
                    : "bg-slate-950/80 border-border text-steel hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-black tracking-wider text-white">{b.label}</span>
                </div>
                <span className="text-[9px] text-steel font-bold mt-0.5">{b.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Player Pool Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-steel tracking-widest block">Player Pool Filter</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "GLOBAL" as PoolMode, label: "Global", icon: Globe, sub: "All Leagues" },
              { id: "EPL" as PoolMode, label: "EPL", icon: Flame, sub: "Premier Stars" },
              { id: "TOP_TEAMS" as PoolMode, label: "Top Clubs", icon: Star, sub: "RM, Barca, City..." },
              { id: "ICONS" as PoolMode, label: "Icons", icon: Crown, sub: "Legends Only" },
            ].map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPoolMode(p.id)}
                  className={`p-3 rounded-2xl transition-all border flex flex-col items-center justify-center text-center active:scale-95 ${
                    poolMode === p.id
                      ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_15px_rgba(149,232,16,0.15)]"
                      : "bg-slate-950/80 border-border text-steel hover:text-white"
                  }`}
                >
                  <IconComp className={`w-4 h-4 mb-1 ${poolMode === p.id ? "text-lime" : "text-steel"}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-white">{p.label}</span>
                  <span className="text-[9px] text-steel font-medium mt-0.5 truncate max-w-full">{p.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Privacy */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-steel tracking-widest block">Room Privacy</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all border active:scale-95 ${
                !isPublic
                  ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_15px_rgba(149,232,16,0.15)]"
                  : "bg-slate-950/80 border-border text-steel hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4 text-lime" /> Private Code
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all border active:scale-95 ${
                isPublic
                  ? "bg-lime/10 border-lime/50 text-lime shadow-[0_0_15px_rgba(149,232,16,0.15)]"
                  : "bg-slate-950/80 border-border text-steel hover:text-white"
              }`}
            >
              <Globe className="w-4 h-4 text-lime" /> Public Arena
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCreate}
          disabled={loading || !nickname.trim()}
          className="w-full py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-lime/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Launching Match Arena…</>
          ) : (
            <><Swords className="w-4 h-4" /> Create Match Arena</>
          )}
        </button>
      </div>
    </div>
  );
}
