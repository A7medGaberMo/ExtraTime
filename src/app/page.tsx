"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Users, PlusCircle, ArrowRight, Zap } from "lucide-react";

type PoolMode = "GLOBAL" | "EPL" | "ICONS";

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
      const nickname = `Manager_${Math.floor(1000 + Math.random() * 9000)}`;
      const userId = await createGuest({ nickname, avatarSeed: nickname });
      localStorage.setItem("extratime_guestId", userId);
      const result = await findMatch({ userId, matchSize, poolMode });
      router.push(`/auction/${result.roomId}`);
    } catch (error: any) {
      alert(error.message || "Could not start matchmaking");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <main className="w-full max-w-4xl flex flex-col items-center gap-10 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-green-400 to-emerald-600 text-transparent bg-clip-text animate-slide-up">
            ExtraTime
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Hidden Bid football drafting with random formations, auto perks, position-fit cards, and fast public matchmaking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center">
          <Link href="/create-room" className="group w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <PlusCircle className="w-5 h-5" />
            <span>Create Room</span>
          </Link>
          <Link href="/join-room" className="group w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 border border-slate-700 hover:border-slate-500">
            <Users className="w-5 h-5" />
            <span>Join Room</span>
          </Link>
        </div>

        <section className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center lg:text-left">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-white">Public Quick Match</h2>
              <p className="text-xs text-slate-300">
                {queueSummary && queueSummary.totalWaiting > 0
                  ? `${queueSummary.totalWaiting} public queue${queueSummary.totalWaiting === 1 ? "" : "s"} active now. Pick the same mode to match faster.`
                  : "Match by size and pool. Formation and perks are automatic."}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <select value={poolMode} onChange={(e) => setPoolMode(e.target.value as PoolMode)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs font-bold text-slate-200">
              <option value="GLOBAL">Global Mix</option>
              <option value="EPL">EPL Only</option>
              <option value="ICONS">Icons Only</option>
            </select>
            <button onClick={() => quickMatch(11)} disabled={loading} className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl disabled:opacity-60">
              <span className="inline-flex items-center gap-2">
                {loading ? "Searching..." : "11P Match"}
                {waiting11 > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-950" title={`${waiting11} waiting`}>
                    <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
                    {waiting11}
                  </span>
                )}
              </span>
            </button>
            <button onClick={() => quickMatch(5)} disabled={loading} className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl disabled:opacity-60">
              <span className="inline-flex items-center gap-2">
                5P Match
                {waiting5 > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-300" title={`${waiting5} waiting`}>
                    <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
                    {waiting5}
                  </span>
                )}
              </span>
            </button>
          </div>
        </section>

        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-bold">Random Setup</h3>
            <p className="text-sm text-slate-400">Every match starts with a surprise formation and shuffled position order.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4">
            <Users className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-bold">Fair Perks</h3>
            <p className="text-sm text-slate-400">Scout and Spy are assigned automatically so players can focus on bidding.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4">
            <ArrowRight className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-bold">Simple Pools</h3>
            <p className="text-sm text-slate-400">Global Mix is default, with EPL Only and Icons Only for focused rooms.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
