"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { Loader2, Globe, Lock, RefreshCw } from "lucide-react";

type MatchSize = 5 | 11;
type PoolMode = "GLOBAL" | "EPL" | "ICONS";

const FIRST = ["Coach", "Boss", "Gaffer", "Mister", "Don", "Captain", "Chief", "Maestro", "Legend", "Striker", "El Capitán", "Manager"];
const LAST = ["Santos", "Müller", "Silva", "Ali", "Rossi", "Park", "König", "Torres", "Diallo", "Kovač", "Zidane", "Pirlo", "Maldini", "Ramos"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

/* Reusable radio pill group */
function RadioPills<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center justify-center px-3 py-3 rounded-xl text-center transition-all border btn-haptic ${
            value === opt.value
              ? "bg-lime/10 border-lime/40 text-lime shadow-[0_0_12px_rgba(149,232,16,0.1)]"
              : "bg-background border-border text-steel hover:text-white hover:border-steel/50"
          }`}
        >
          <span className="text-sm font-bold">{opt.label}</span>
          {opt.sub && <span className="text-[10px] opacity-70 mt-0.5">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
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

  useEffect(() => { setNickname(randomName()); }, []);

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

  const selectClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-colors appearance-none cursor-pointer";

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      <PageHeader title="Create Room" subtitle="Set up a Hidden Bid match in seconds" backUrl="/" />

      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
        {/* Nickname */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider block">Manager Name</span>
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
        </div>

        {/* Match Size — radio pills */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider block">Match Size</span>
          <RadioPills
            options={[
              { value: 11 as MatchSize, label: "11 vs 11", sub: "Full Squad" },
              { value: 5 as MatchSize, label: "5 vs 5", sub: "Futsal" },
            ]}
            value={matchSize}
            onChange={setMatchSize}
          />
        </div>

        {/* Budget — radio pills */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider block">Starting Budget</span>
          <RadioPills
            options={[
              { value: 100, label: "$100M", sub: "Standard" },
              { value: 150, label: "$150M", sub: "High" },
              { value: 200, label: "$200M", sub: "Mega" },
            ]}
            value={startingBudget}
            onChange={setStartingBudget}
          />
        </div>

        {/* Player Pool — select (3 options with descriptions work better as dropdown) */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-steel tracking-wider block">Player Pool</span>
          <RadioPills
            options={[
              { value: "GLOBAL" as PoolMode, label: "🌍 Global", sub: "All leagues" },
              { value: "EPL" as PoolMode, label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL", sub: "Prem only" },
              { value: "ICONS" as PoolMode, label: "👑 Icons", sub: "Legends" },
            ]}
            value={poolMode}
            onChange={setPoolMode}
          />
        </div>

        {/* Visibility — radio pills */}
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
              <Lock className="w-4 h-4" /> Private
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
              <Globe className="w-4 h-4" /> Public
            </button>
          </div>
          <p className="text-[11px] text-steel leading-relaxed mt-1">
            {isPublic ? "Anyone can find & join via public matchmaking." : "Only players with your room code can join."}
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={loading || !nickname.trim()}
          className="w-full py-4 bg-lime hover:bg-vivid text-background font-black text-sm rounded-xl shadow-lg shadow-lime/10 hover:shadow-lime/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Hidden Bid Room"}
        </button>
      </div>

      <p className="text-[11px] text-steel text-center leading-relaxed px-4">
        Formation, position order, first turn, and Scout / Spy perks are all assigned automatically.
      </p>
    </div>
  );
}
