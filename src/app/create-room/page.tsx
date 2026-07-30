"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/shared/toast";
import {
  Loader2, Globe, Lock, RefreshCw, Clock, Zap, UserCheck,
  Swords, Coins, Users, Star, Crown, Flame, ShieldCheck
} from "lucide-react";

type MatchSize = 5 | 11;
type PoolMode = "GLOBAL" | "ACTIVE" | "EPL" | "TOP_TEAMS" | "ICONS";

import { randomEgyptianManagerName as randomName } from "@/lib/random-names";

const poolOptions = [
  { id: "GLOBAL" as PoolMode, label: "Global", icon: Globe, sub: "All leagues" },
  { id: "ACTIVE" as PoolMode, label: "Active Stars", icon: UserCheck, sub: "Current players" },
  { id: "EPL" as PoolMode, label: "EPL", icon: Flame, sub: "Premier stars" },
  { id: "TOP_TEAMS" as PoolMode, label: "Top Clubs", icon: Star, sub: "Elite clubs" },
  { id: "ICONS" as PoolMode, label: "Icons", icon: Crown, sub: "Legends only" },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      toast(err.message || "Could not create room", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in">
      <PageHeader
        title="Create Hidden Bid"
        subtitle="Pick the arena rules, share the code, and draft your squad card by card."
        backUrl="/"
        className="mb-3"
      />

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-28 rounded-full bg-lime/10 blur-3xl" />

        <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-lime/25 bg-lime/10 p-2 sm:p-3 text-center sm:text-left">
            <Clock className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-lime shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-lime whitespace-nowrap truncate">30s Turns</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-slate-300 whitespace-nowrap truncate">+10s with Scout/Spy</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 sm:p-3 text-center sm:text-left">
            <ShieldCheck className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate">Hidden Backup</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">Win star or get sub</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 sm:p-3 text-center sm:text-left">
            <Coins className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-lime shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate">Saved Cash</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">Budget breaks ties</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-steel">Manager Handle</label>
              <span className="text-[10px] font-black uppercase tracking-widest text-lime">Auto generated</span>
            </div>
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-base font-black text-white outline-none transition-all placeholder:text-steel focus:border-lime/70 focus:ring-2 focus:ring-lime/20"
                placeholder="Manager name"
              />
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel transition-all hover:border-lime/50 hover:text-lime active:scale-95"
                title="Randomize manager handle"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMatchSize(11)}
              className={`min-h-[80px] sm:min-h-[88px] rounded-xl border p-2.5 sm:p-3 text-left transition-all active:scale-[0.98] ${
                matchSize === 11 ? "border-lime/60 bg-lime/10 shadow-[0_0_24px_rgba(149,232,16,0.14)]" : "border-white/10 bg-slate-950/80"
              }`}
            >
              <Users className={`mb-1.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${matchSize === 11 ? "text-lime" : "text-steel"}`} />
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-white whitespace-nowrap">11 vs 11</p>
              <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">Full pitch - 11 rounds</p>
            </button>
            <button
              type="button"
              onClick={() => setMatchSize(5)}
              className={`min-h-[80px] sm:min-h-[88px] rounded-xl border p-2.5 sm:p-3 text-left transition-all active:scale-[0.98] ${
                matchSize === 5 ? "border-lime/60 bg-lime/10 shadow-[0_0_24px_rgba(149,232,16,0.14)]" : "border-white/10 bg-slate-950/80"
              }`}
            >
              <Zap className={`mb-1.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${matchSize === 5 ? "text-lime" : "text-steel"}`} />
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-white whitespace-nowrap">5 vs 5</p>
              <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">Fast futsal - 5 rounds</p>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-steel">Starting Budget</label>
            <div className="grid grid-cols-3 gap-2">
              {[100, 150, 200].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setStartingBudget(amount)}
                  className={`rounded-xl border px-2 py-3 text-center transition-all active:scale-95 ${
                    startingBudget === amount ? "border-lime/60 bg-lime/10" : "border-white/10 bg-slate-950/80"
                  }`}
                >
                  <p className="font-stats text-lg text-lime">${amount}M</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-steel">
                    {amount === 100 ? "Standard" : amount === 150 ? "Stakes" : "Mega"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-steel whitespace-nowrap">Player Pool</label>
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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
                !isPublic ? "border-lime/60 bg-lime/10 text-lime" : "border-white/10 bg-slate-950 text-steel"
              }`}
            >
              <Lock className="mx-auto mb-1.5 h-4 w-4" />
              Private Code
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
                isPublic ? "border-lime/60 bg-lime/10 text-lime" : "border-white/10 bg-slate-950 text-steel"
              }`}
            >
              <Globe className="mx-auto mb-1.5 h-4 w-4" />
              Public Arena
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !nickname.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-4 text-sm font-black uppercase tracking-widest text-slate-950 shadow-xl shadow-lime/15 transition-all hover:bg-vivid active:scale-[0.98] disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin shrink-0" /> <span className="whitespace-nowrap">Launching Arena...</span></>
            ) : (
              <><Swords className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Create Match Arena</span></>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
