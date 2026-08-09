"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/shared/toast";
import {
  Loader2, RefreshCw, Zap, Globe, Flame, Star, Crown, ShieldCheck, LayoutGrid, UserCheck,
} from "lucide-react";

import { randomEgyptianManagerName as randomName } from "@/lib/random-names";

type PoolMode = "GLOBAL" | "ACTIVE" | "EPL" | "TOP_TEAMS" | "ICONS";

const poolOptions = [
  { id: "ACTIVE" as PoolMode, label: "Active", icon: UserCheck, sub: "Current players" },
  { id: "GLOBAL" as PoolMode, label: "Global", icon: Globe, sub: "All + Legends" },
  { id: "EPL" as PoolMode, label: "EPL", icon: Flame, sub: "Prem only" },
  { id: "TOP_TEAMS" as PoolMode, label: "Top Clubs", icon: Star, sub: "Big teams" },
  { id: "ICONS" as PoolMode, label: "Icons", icon: Crown, sub: "Legends" },
];

const formations = [
  { id: "4-3-3", size: "11v11", round: 11 },
  { id: "4-4-2", size: "11v11", round: 11 },
  { id: "4-2-3-1", size: "11v11", round: 11 },
  { id: "3-5-2", size: "11v11", round: 11 },
  { id: "1-2-1", size: "5v5", round: 5 },
  { id: "2-1-1", size: "5v5", round: 5 },
  { id: "1-1-2", size: "5v5", round: 5 },
];

export default function SquadDraftCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createGuest = useMutation(api.guests.mutations.create);
  const createDraft = useMutation(api.squadDraft.mutations.create);
  const createSolo = useMutation(api.squadDraft.mutations.createSolo);

  const [nickname, setNickname] = useState(() => randomName());
  const [formation, setFormation] = useState("4-3-3");
  const [isSolo, setIsSolo] = useState(false);
  const [poolMode, setPoolMode] = useState<PoolMode>("GLOBAL");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem("extratime_guestId", guestId);
      const room = isSolo
        ? await createSolo({ userId: guestId, formation, poolMode })
        : await createDraft({ hostId: guestId, formation, poolMode });
      router.push(`/squad-draft/${room.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || "Could not create Squad Draft", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in">
      <PageHeader
        title="Create Squad Draft"
        subtitle="Pick the formation, share the code, draft your team card by card."
        backUrl="/"
        className="mb-3"
      />

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-28 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-lime/25 bg-lime/10 p-2 sm:p-3 text-center sm:text-left">
            <ShieldCheck className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-lime shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-lime whitespace-nowrap truncate">Snake Draft</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-slate-300 whitespace-nowrap truncate">Alternating picks</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 sm:p-3 text-center sm:text-left">
            <Zap className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate">Joker Card</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">Wildcard chemistry</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 sm:p-3 text-center sm:text-left">
            <Crown className="mx-auto sm:mx-0 mb-1.5 h-4 w-4 text-lime shrink-0" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap truncate">45s Turns</p>
            <p className="mt-0.5 text-[9px] sm:text-xs font-medium text-steel whitespace-nowrap truncate">+1 reroll each</p>
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

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-steel whitespace-nowrap">Formation</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {formations.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormation(f.id)}
                  className={`rounded-xl border px-2 py-3 text-center transition-all active:scale-95 ${
                    formation === f.id ? "border-lime/60 bg-lime/10 shadow-[0_0_24px_rgba(149,232,16,0.14)]" : "border-white/10 bg-slate-950/80"
                  }`}
                >
                  <p className={`font-stats text-lg ${formation === f.id ? "text-lime" : "text-white"}`}>{f.id}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-steel">{f.size} · {f.round} rds</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-steel whitespace-nowrap">Opponent</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSolo(false)}
                className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
                  !isSolo ? "border-lime/60 bg-lime/10 text-lime" : "border-white/10 bg-slate-950 text-steel"
                }`}
              >
                Friends Duel
              </button>
              <button
                type="button"
                onClick={() => setIsSolo(true)}
                className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
                  isSolo ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-white/10 bg-slate-950 text-steel"
                }`}
              >
                Solo Draft
              </button>
            </div>
            <p className="text-[10px] font-medium text-steel">
              {isSolo ? "Solo: no opponent needed — the match sim runs when your draft finishes." : "Duo: share the 6-char code with a friend."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-steel whitespace-nowrap">Player Pool</label>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-2">
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

          <button
            onClick={handleCreate}
            disabled={loading || !nickname.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-4 text-sm font-black uppercase tracking-widest text-slate-950 shadow-xl shadow-lime/15 transition-all hover:bg-vivid active:scale-[0.98] disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin shrink-0" /> <span className="whitespace-nowrap">Setting Up Draft...</span></>
            ) : (
              <><LayoutGrid className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Create Draft Arena</span></>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}