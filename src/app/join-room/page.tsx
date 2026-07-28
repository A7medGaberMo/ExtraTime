"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { KeyRound } from "lucide-react";

export default function JoinRoomPage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const joinRoom = useMutation(api.rooms.mutations.join);
  const [nickname, setNickname] = useState("Manager");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const normalizedCode = roomCode.replace(/[^A-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const room = useQuery(api.rooms.queries.getByCode, normalizedCode.length === 6 ? { code: normalizedCode } : "skip");
  const canJoin = Boolean(room && room.status === "waiting" && !room.guestId);

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!canJoin || loading) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname, avatarSeed: nickname });
      localStorage.setItem("extratime_guestId", guestId);
      const result = await joinRoom({ roomId: room!._id, guestId });
      router.push(`/auction/${result.roomId}`);
    } catch (error: any) {
      alert(error.message || "Could not join room");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <PageHeader title="Join Room" subtitle="Enter a code to join an existing match" backUrl="/" />

      <form onSubmit={handleJoin} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-steel">Your Nickname</span>
          <input 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)} 
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime" 
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-steel">Room Code</span>
          <input 
            value={roomCode} 
            onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase())} 
            maxLength={6} 
            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-center text-2xl tracking-[0.35em] uppercase font-stats text-lime placeholder:text-slate-800 focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime" 
            placeholder="X7K9M2" 
          />
        </label>

        <div className="rounded-xl border border-border bg-background px-4 py-3">
          <p className="text-sm font-bold text-lime">
            {normalizedCode.length < 6
              ? "Enter a six-character room code"
              : room === undefined
                ? "Checking room..."
                : canJoin
                  ? "Room ready"
                  : room
                    ? "Room unavailable"
                    : "Room not found"}
          </p>
          <p className="text-xs text-steel mt-1">
            {canJoin
              ? "Joining will activate the auction and randomly choose the first turn."
              : "Scout and Spy are assigned fairly when an opponent joins."}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={!canJoin || loading} 
          className="w-full py-4 bg-lime hover:bg-vivid text-background font-black text-sm rounded-xl shadow-lg shadow-lime/10 hover:shadow-lime/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </form>

      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
        <KeyRound className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300">Need a room code? Ask the host for the six-character code from their waiting room.</p>
      </div>
    </div>
  );
}
