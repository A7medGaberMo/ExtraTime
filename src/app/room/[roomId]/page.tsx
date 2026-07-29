"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { Copy, Users, Settings2, Clock, Check, Loader2, ArrowRight } from "lucide-react";

export default function RoomLobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [guestId, setGuestId] = useState<Id<"guestUsers"> | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("extratime_guestId") as Id<"guestUsers">;
    if (id) setGuestId(id);
  }, []);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip"
  );

  const room = state?.room;
  const auction = state?.auction;
  const isHost = state?.isHost ?? true;

  // Auto redirect to auction screen when opponent joins or auction starts
  useEffect(() => {
    if (auction?.status === "active" || room?.status === "in_progress") {
      router.push(`/auction/${roomId}`);
    }
  }, [auction?.status, room?.status, roomId, router]);

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const roomCode = room?.code || roomId.toUpperCase().slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4 md:py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Waiting Room" subtitle="Invite your opponent or wait for matchmaking" backUrl="/" />

        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 self-start md:self-auto shadow-lg">
          <span className="text-xs text-steel font-black uppercase tracking-wider">Room Code:</span>
          <span className="text-2xl font-stats text-lime tracking-widest">{roomCode}</span>
          <button
            onClick={copyCode}
            className="p-2 bg-slate-900 hover:bg-lime/10 rounded-xl transition-all text-steel hover:text-lime border border-border"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-lime" />
            Players ({room?.guestId ? "2/2" : "1/2"})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Host Card */}
            <div className="bg-card border border-lime/40 bg-gradient-to-b from-lime/5 to-transparent rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-lime" />
              <div className="w-20 h-20 bg-slate-900 rounded-full border-2 border-lime flex items-center justify-center text-2xl font-black text-lime shadow-md">
                {state?.me?.userId ? "M" : "H"}
              </div>
              <div>
                <h4 className="font-black text-white text-lg">{isHost ? "You (Host)" : "Host Manager"}</h4>
                <span className="text-[10px] font-black px-3 py-1 bg-lime/10 text-lime rounded-full mt-2 inline-block border border-lime/30">
                  HOST • PERK: {state?.me?.perk || "ASSIGNED"}
                </span>
              </div>
            </div>

            {/* Guest / Opponent Card */}
            {room?.guestId ? (
              <div className="bg-card border border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                <div className="w-20 h-20 bg-slate-900 rounded-full border-2 border-blue-500 flex items-center justify-center text-2xl font-black text-blue-400 shadow-md">
                  {!isHost ? "M" : "G"}
                </div>
                <div>
                  <h4 className="font-black text-white text-lg">{!isHost ? "You (Guest)" : "Challenger"}</h4>
                  <span className="text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full mt-2 inline-block border border-blue-500/30">
                    READY TO BID
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
                <div className="w-16 h-16 bg-slate-900 rounded-full border border-border flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Waiting for opponent...</p>
                  <p className="text-xs text-steel mt-1">Share room code {roomCode} to join</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Match Settings Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-lime" />
            Match Rules
          </h3>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex justify-between items-center pb-3 border-b border-border text-xs">
              <span className="text-steel font-bold">Game Mode</span>
              <span className="font-black text-white uppercase">{room?.gameType || "Hidden Bid"}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border text-xs">
              <span className="text-steel font-bold">Starting Budget</span>
              <span className="font-stats text-lime text-sm">${room?.settings?.startingBudget || 100}M</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border text-xs">
              <span className="text-steel font-bold">Squad Size</span>
              <span className="font-bold text-white">{room?.settings?.matchSize || 11} Players</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-steel font-bold">Player Pool</span>
              <span className="font-black text-lime uppercase">{room?.settings?.poolMode || "GLOBAL"}</span>
            </div>
          </div>

          <button
            onClick={() => router.push(`/auction/${roomId}`)}
            className="w-full py-4 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Enter Auction Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
