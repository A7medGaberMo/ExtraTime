"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { Dices, ShieldCheck } from "lucide-react";

type MatchSize = 5 | 11;
type PoolMode = "GLOBAL" | "EPL" | "ICONS";

export default function CreateRoomPage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const createRoom = useMutation(api.rooms.mutations.create);
  const [nickname, setNickname] = useState("Manager");
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>("GLOBAL");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname, avatarSeed: nickname });
      localStorage.setItem("extratime_guestId", guestId);
      const room = await createRoom({ hostId: guestId, matchSize, startingBudget, isPublic, poolMode });
      router.push(`/auction/${room.roomId}`);
    } catch (error: any) {
      alert(error.message || "Could not create room");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader title="Create Room" subtitle="Auto formation, auto perks, easy setup" backUrl="/" />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3">
            <Dices className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-300">Hidden Bid engine handles the boring parts.</p>
              <p className="text-xs text-slate-400 mt-1">Formation, position order, first turn, and Scout/Spy perks are assigned automatically.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-300">Your Nickname</span>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Match Size</span>
              <select value={matchSize} onChange={(e) => setMatchSize(Number(e.target.value) as MatchSize)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100">
                <option value={11}>11P Full Squad</option>
                <option value={5}>5P Futsal</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Budget</span>
              <select value={startingBudget} onChange={(e) => setStartingBudget(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100">
                <option value={100}>$100M Standard</option>
                <option value={150}>$150M High</option>
                <option value={200}>$200M Mega</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Player Pool</span>
              <select value={poolMode} onChange={(e) => setPoolMode(e.target.value as PoolMode)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100">
                <option value="GLOBAL">Global Mix</option>
                <option value="EPL">EPL Only</option>
                <option value="ICONS">Icons Only</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
              <span className="text-sm font-medium text-slate-300">Public matchmaking</span>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-green-500" />
            </label>
          </div>

          <button onClick={handleCreate} disabled={loading} className="w-full py-4 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl disabled:opacity-60">
            {loading ? "Creating..." : "Create Hidden Bid Room"}
          </button>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
          <ShieldCheck className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">Private rooms still get a shareable code. Public rooms can be matched automatically with players using the same size and pool.</p>
        </div>
      </div>
    </div>
  );
}
