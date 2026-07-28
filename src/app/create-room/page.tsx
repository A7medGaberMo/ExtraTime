"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { Loader2, Globe, Lock, RefreshCw } from "lucide-react";

type MatchSize = 5 | 11;
type PoolMode = "GLOBAL" | "EPL" | "ICONS";

/* ── Random football manager name ────────────────────────────────────── */
const FIRST = ["Coach", "Boss", "Gaffer", "Mister", "Don", "Captain", "Chief", "Maestro", "Legend", "Striker", "El Capitán", "The Gaffer", "Manager"];
const LAST = ["Santos", "Müller", "Silva", "Ali", "Rossi", "Park", "König", "Torres", "Diallo", "Kovač", "Zidane", "Pirlo", "Maldini", "Ramos"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const createGuest = useMutation(api.guests.mutations.create);
  const createRoom = useMutation(api.rooms.mutations.create);

  const [nickname, setNickname] = useState("");
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>("GLOBAL");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Auto-generate a random nickname on mount */
  useEffect(() => {
    setNickname(randomName());
  }, []);

  const rerollName = () => setNickname(randomName());

  async function handleCreate() {
    if (loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem("extratime_guestId", guestId);
      const room = await createRoom({ hostId: guestId, matchSize, startingBudget, isPublic, poolMode });
      router.push(`/auction/${room.roomId}`);
    } catch (error: any) {
      alert(error.message || "Could not create room");
      setLoading(false);
    }
  }

  /* shared select styling */
  const selectClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-colors appearance-none cursor-pointer";

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      <PageHeader title="Create Room" subtitle="Set up a Hidden Bid match in seconds" backUrl="/" />

      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
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
              onClick={rerollName}
              className="px-3 rounded-xl bg-background border border-border text-steel hover:text-lime hover:border-lime/50 transition-all active:scale-95"
              title="Random name"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </label>

        {/* Match Size */}
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider">Match Size</span>
          <select value={matchSize} onChange={(e) => setMatchSize(Number(e.target.value) as MatchSize)} className={selectClass}>
            <option value={11}>11 vs 11 — Full Squad</option>
            <option value={5}>5 vs 5 — Futsal</option>
          </select>
        </label>

        {/* Budget */}
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider">Starting Budget</span>
          <select value={startingBudget} onChange={(e) => setStartingBudget(Number(e.target.value))} className={selectClass}>
            <option value={100}>$100M — Standard</option>
            <option value={150}>$150M — High Roller</option>
            <option value={200}>$200M — Mega Draft</option>
          </select>
        </label>

        {/* Player Pool */}
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider">Player Pool</span>
          <select value={poolMode} onChange={(e) => setPoolMode(e.target.value as PoolMode)} className={selectClass}>
            <option value="GLOBAL">Global Mix — All leagues</option>
            <option value="EPL">EPL Only — Premier League</option>
            <option value="ICONS">Icons Only — Legends</option>
          </select>
        </label>

        {/* Public / Private — Radio pills */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider block">Room Visibility</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border btn-haptic ${
                !isPublic
                  ? "bg-lime/10 border-lime/40 text-lime shadow-[0_0_12px_rgba(149,232,16,0.1)]"
                  : "bg-background border-border text-steel hover:text-white hover:border-steel/50"
              }`}
            >
              <Lock className="w-4 h-4" />
              Private
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border btn-haptic ${
                isPublic
                  ? "bg-lime/10 border-lime/40 text-lime shadow-[0_0_12px_rgba(149,232,16,0.1)]"
                  : "bg-background border-border text-steel hover:text-white hover:border-steel/50"
              }`}
            >
              <Globe className="w-4 h-4" />
              Public
            </button>
          </div>
          <p className="text-[11px] text-steel leading-relaxed mt-1">
            {isPublic
              ? "Anyone can find & join your room via public matchmaking."
              : "Only players with your room code can join."}
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={loading || !nickname.trim()}
          className="w-full py-4 bg-lime hover:bg-vivid text-background font-black text-sm rounded-xl shadow-lg shadow-lime/10 hover:shadow-lime/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create Hidden Bid Room"
          )}
        </button>
      </div>

      {/* Info note */}
      <p className="text-[11px] text-steel text-center leading-relaxed px-4">
        Formation, position order, first turn, and Scout / Spy perks are all assigned automatically by the engine.
      </p>
    </div>
  );
}
