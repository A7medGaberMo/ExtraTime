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
  const room = useQuery(api.rooms.queries.getByCode, roomCode.length === 6 ? { code: roomCode.toUpperCase() } : "skip");

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!room || loading) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname, avatarSeed: nickname });
      localStorage.setItem("extratime_guestId", guestId);
      await joinRoom({ roomId: room._id, guestId });
      router.push(`/auction/${room._id}`);
    } catch (error: any) {
      alert(error.message || "Could not join room");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader title="Join Room" subtitle="Enter a code to join an existing match" backUrl="/" />

        <form onSubmit={handleJoin} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-300">Your Nickname</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-300">Room Code</span>
            <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.35em] uppercase font-mono text-amber-500 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="X7K9M2" />
          </label>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <p className="text-sm font-bold text-slate-300">Auto perks enabled</p>
            <p className="text-xs text-slate-500 mt-1">Scout and Spy are assigned fairly when you join.</p>
          </div>

          <button type="submit" disabled={!room || loading} className="w-full py-4 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl disabled:bg-slate-800 disabled:text-slate-500">
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
          <KeyRound className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">Need a room code? Ask the host for the six-character code from their waiting room.</p>
        </div>
      </div>
    </div>
  );
}
