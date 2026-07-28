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
    <div className="max-w-4xl mx-auto space-y-12 py-4 md:py-8 animate-fade-in">
      <main className="w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white animate-slide-up uppercase">
            Extra<span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-vivid">Time</span>
          </h1>
          <p className="text-lg md:text-xl text-steel max-w-2xl mx-auto">
            Hidden Bid football drafting with random formations, auto perks, position-fit cards, and fast public matchmaking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center">
          <Link 
            href="/create-room" 
            className="group w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-lime hover:bg-vivid text-background font-black rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-lime/10 hover:shadow-lime/20"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Room</span>
          </Link>
          <Link 
            href="/join-room" 
            className="group w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-white/5 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20 hover:border-white/40"
          >
            <Users className="w-5 h-5" />
            <span>Join Room</span>
          </Link>
        </div>

        <section className="w-full rounded-2xl border border-lime/30 bg-lime/5 p-5 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-lg shadow-lime/5">
          <div className="flex items-center gap-3 text-center lg:text-left">
            <div className="p-3 rounded-xl bg-lime/10 text-lime">
              <Zap className="w-6 h-6 fill-lime" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">Public Quick Match</h2>
              <p className="text-xs text-steel">
                {queueSummary && queueSummary.totalWaiting > 0
                  ? `${queueSummary.totalWaiting} public queue${queueSummary.totalWaiting === 1 ? "" : "s"} active now. Pick the same mode to match faster.`
                  : "Match by size and pool. Formation and perks are automatic."}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <select 
              value={poolMode} 
              onChange={(e) => setPoolMode(e.target.value as PoolMode)} 
              className="rounded-xl border border-border bg-card px-3 py-3 text-xs font-bold text-white focus:outline-none focus:border-lime"
            >
              <option value="GLOBAL">Global Mix</option>
              <option value="EPL">EPL Only</option>
              <option value="ICONS">Icons Only</option>
            </select>
            <button 
              onClick={() => quickMatch(11)} 
              disabled={loading} 
              className="px-5 py-3 bg-lime hover:bg-vivid text-background font-black text-xs rounded-xl shadow-lg shadow-lime/10 transition-all active:scale-95 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                {loading ? "Searching..." : "11P Match"}
                {waiting11 > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-background px-1.5 py-0.5 rounded-full bg-lime shadow-[0_0_8px_rgba(149,232,16,0.5)]">
                    {waiting11}
                  </span>
                )}
              </span>
            </button>
            <button 
              onClick={() => quickMatch(5)} 
              disabled={loading} 
              className="px-5 py-3 bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                5P Match
                {waiting5 > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-lime">
                    <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_8px_rgba(149,232,16,0.8)]" />
                    {waiting5}
                  </span>
                )}
              </span>
            </button>
          </div>
        </section>

        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center gap-4 hover:border-lime/20 hover:shadow-lg hover:shadow-lime/5 transition-all">
            <div className="p-3 bg-lime/10 rounded-full text-lime">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Random Setup</h3>
            <p className="text-sm text-steel">Every match starts with a surprise formation and shuffled position order.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center gap-4 hover:border-lime/20 hover:shadow-lg hover:shadow-lime/5 transition-all">
            <div className="p-3 bg-lime/10 rounded-full text-lime">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Fair Perks</h3>
            <p className="text-sm text-steel">Scout and Spy are assigned automatically so players can focus on bidding.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center gap-4 hover:border-lime/20 hover:shadow-lg hover:shadow-lime/5 transition-all">
            <div className="p-3 bg-lime/10 rounded-full text-lime">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Simple Pools</h3>
            <p className="text-sm text-steel">Global Mix is default, with EPL Only and Icons Only for focused rooms.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
