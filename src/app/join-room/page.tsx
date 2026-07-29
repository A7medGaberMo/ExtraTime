"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Search } from "lucide-react";

import { randomEgyptianManagerName as randomName } from "@/lib/random-names";

export default function JoinRoomPage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const joinRoom = useMutation(api.rooms.mutations.join);

  const [nickname, setNickname] = useState(() => randomName());
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedCode = roomCode.replace(/[^A-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const room = useQuery(api.rooms.queries.getByCode, normalizedCode.length === 6 ? { code: normalizedCode } : "skip");
  const canJoin = Boolean(room && room.status === "waiting" && !room.guestId);

  const statusIcon = normalizedCode.length < 6
    ? <Search className="w-4 h-4 text-steel" />
    : room === undefined
      ? <Loader2 className="w-4 h-4 text-lime animate-spin" />
      : canJoin
        ? <CheckCircle2 className="w-4 h-4 text-lime" />
        : <XCircle className="w-4 h-4 text-rose-400" />;

  const statusText = normalizedCode.length < 6
    ? "Enter a 6-character room code"
    : room === undefined
      ? "Checking…"
      : canJoin
        ? "Room found — ready to join!"
        : room
          ? "Room is full or already started"
          : "Room not found";

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!canJoin || loading) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem("extratime_guestId", guestId);
      const result = await joinRoom({ roomId: room!._id, guestId });
      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Could not join room");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      <PageHeader title="Join Room" subtitle="Enter a code to join an existing match" backUrl="/" />

      <form onSubmit={handleJoin} className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
        {/* Nickname */}
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider">Manager Name</span>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={24}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-colors"
            />
            <button
              type="button"
              onClick={() => setNickname(randomName())}
              className="px-3 rounded-xl bg-background border border-border text-steel hover:text-lime hover:border-lime/50 transition-all active:scale-95"
              title="Random name"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </label>

        {/* Room Code */}
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider">Room Code</span>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase())}
            maxLength={6}
            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-center text-2xl tracking-[0.35em] uppercase font-stats text-lime placeholder:text-border focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-colors"
            placeholder="X7K9M2"
            autoComplete="off"
          />
        </label>

        {/* Status indicator */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
          canJoin ? "bg-lime/5 border-lime/30" : "bg-background border-border"
        }`}>
          {statusIcon}
          <span className={`text-sm font-bold ${canJoin ? "text-lime" : "text-steel"}`}>{statusText}</span>
        </div>

        {/* Join button */}
        <button
          type="submit"
          disabled={!canJoin || loading}
          className="w-full py-4 bg-lime hover:bg-vivid text-background font-black text-sm rounded-xl shadow-lg shadow-lime/10 hover:shadow-lime/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
          ) : (
            "Join Room"
          )}
        </button>
      </form>
    </div>
  );
}
