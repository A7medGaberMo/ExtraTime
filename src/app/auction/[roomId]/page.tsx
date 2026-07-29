"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PlayerCard } from "@/components/shared/player-card";
import { AuctionTimer } from "@/components/shared/auction-timer";
import { BidSlider } from "@/components/shared/bid-slider";
import { BidRevealAnimation } from "@/components/shared/bid-reveal-animation";
import { TacticalPitch } from "@/components/shared/tactical-pitch";
import type { PlayerCardData } from "@/types/player";
import {
  Loader2, ArrowRight, X, Sparkles, Zap, Copy, Check,
  Swords, Eye, Binoculars, DollarSign, ChevronDown, ChevronUp
} from "lucide-react";

/* ── Tier accent color lookup ────────────────────────────────────── */
const TIER_COLORS: Record<string, string> = {
  ICON: "#D4AF37", MASTER: "#7C3AED", ELITE_PLUS: "#0EA5E9",
  ELITE: "#E11D48", GOLD: "#EAB308", SILVER: "#CBD5E1", BRONZE: "#C97A3A",
};

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [guestId, setGuestId] = useState<Id<"guestUsers"> | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showSquad, setShowSquad] = useState(false);
  const [squadTab, setSquadTab] = useState<"my" | "rival" | "pitch">("my");

  // Reveal animation state
  const [showReveal, setShowReveal] = useState(false);
  const prevRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("extratime_guestId") as Id<"guestUsers">;
    if (id) setGuestId(id);
    else router.push("/");
  }, [router]);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip",
  );

  /* Redirect to result page on match completion */
  useEffect(() => {
    if (state?.auction?.status === "completed" || state?.room?.status === "completed") {
      const timer = setTimeout(() => {
        router.push(`/result/${roomId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.auction?.status, state?.room?.status, roomId, router]);

  const placeBid = useMutation(api.auctions.mutations.placeBid);
  const pass = useMutation(api.auctions.mutations.pass);
  const cancelRoom = useMutation(api.rooms.mutations.cancel);
  const usePerkMutation = useMutation(api.auctions.mutations.usePerk);
  const autoPassFired = useRef(false);

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingPerk, setIsActivatingPerk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Detect round transition for dramatic card reveal animation */
  useEffect(() => {
    if (!state?.auction) return;
    const currentRoundNum = state.auction.currentRound;

    if (prevRoundRef.current !== null && currentRoundNum > prevRoundRef.current) {
      setShowReveal(true);
    }
    prevRoundRef.current = currentRoundNum;
  }, [state?.auction?.currentRound]);

  /* Perk activation handler */
  const handleActivatePerk = useCallback(async () => {
    if (!guestId || !roomId || isActivatingPerk || state?.me?.perkUsed) return;
    setIsActivatingPerk(true);
    setError(null);
    try {
      await usePerkMutation({ roomId: roomId as Id<"rooms">, userId: guestId });
    } catch (e: any) {
      setError(e.message || "Could not activate perk");
    } finally {
      setIsActivatingPerk(false);
    }
  }, [usePerkMutation, guestId, isActivatingPerk, roomId, state?.me?.perkUsed]);

  /* Timer logic */
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!state?.auction?.currentBidding?.turnExpiresAt || state.auction.status !== "active") {
      setTimeLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((state.auction.currentBidding.turnExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [state?.auction?.currentBidding?.turnExpiresAt, state?.auction?.status]);

  /* Auto-pass on timeout */
  useEffect(() => {
    if (!state || !state.auction || state.auction.status !== "active") return;
    const isMyTurn = state.auction.currentBidding.activeTurnUserId === guestId;
    if (timeLeft === 0 && isMyTurn && !isSubmitting && !autoPassFired.current) {
      autoPassFired.current = true;
      pass({ roomId: roomId as Id<"rooms">, userId: guestId! }).catch(console.error);
    }
    if (timeLeft > 0) autoPassFired.current = false;
  }, [timeLeft, state, isSubmitting, pass, roomId, guestId]);

  /* Reset bid to min whenever round/turn changes */
  useEffect(() => {
    if (!state?.auction) return;
    const hb = state.auction.currentBidding.highestBid;
    const min = hb > 0 ? hb + 1 : 1;
    setBidAmount(min);
    setError(null);
  }, [state?.auction?.currentRound, state?.auction?.currentBidding?.highestBid]);

  /* ── Derived data ───────────────────────────────────────────────────── */
  const auction = state?.auction;
  const room = state?.room;
  const me = state?.me;
  const opponent = state?.opponent;
  const mainPlayer = state?.mainPlayer;
  const revealedSubPlayer = state?.revealedSubPlayer;
  const revealedNextMainPlayer = state?.revealedNextMainPlayer;
  const nextRoundInfo = state?.nextRoundInfo;
  const mySquad = state?.mySquad ?? [];

  const isActive = auction?.status === "active";
  const isMyTurn = isActive && auction?.currentBidding?.activeTurnUserId === guestId;
  const highestBid = auction?.currentBidding?.highestBid ?? 0;
  const minBid = highestBid > 0 ? highestBid + 1 : 1;
  const myBudget = me?.budget ?? 0;
  const currentPosition = (auction?.rounds && auction?.currentRound) ? (auction.rounds[auction.currentRound - 1]?.position ?? "-") : "-";
  const totalRounds = auction?.rounds?.length ?? 11;
  const iAmLeading = auction?.currentBidding?.highestBidderId === guestId;
  const tierColor = TIER_COLORS[mainPlayer?.tier as string] ?? "#95E810";

  const playerData: PlayerCardData | null = mainPlayer ? {
    id: mainPlayer._id, name: mainPlayer.name, tier: mainPlayer.tier as any,
    position: mainPlayer.position, club: mainPlayer.club, nation: mainPlayer.nation,
    imageUrl: mainPlayer.imageUrl, isLegend: mainPlayer.isLegend, kitNumber: mainPlayer.kitNumber,
  } : null;

  const quickChips = [
    { label: `$${minBid}M`, value: minBid },
    { label: `$${Math.min(myBudget, minBid + 4)}M`, value: Math.min(myBudget, minBid + 4) },
    { label: `$${Math.min(myBudget, minBid + 9)}M`, value: Math.min(myBudget, minBid + 9) },
    { label: "ALL IN", value: myBudget },
  ].filter((c, i, arr) => c.value <= myBudget && c.value >= minBid && arr.findIndex(x => x.value === c.value) === i);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleBid = useCallback(async () => {
    if (!isActive || !guestId || bidAmount < minBid || bidAmount > myBudget) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await placeBid({ roomId: roomId as Id<"rooms">, userId: guestId, amount: bidAmount });
    } catch (e: any) {
      setError(e.message || "Bid failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, bidAmount, minBid, myBudget, placeBid, roomId]);

  const handlePass = useCallback(async () => {
    if (!isActive || !guestId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await pass({ roomId: roomId as Id<"rooms">, userId: guestId });
    } catch (e: any) {
      setError(e.message || "Pass failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, pass, roomId]);

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  /* ── Loading / Error states ──────────────────────────────────────── */
  if (!guestId || state === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-lime animate-spin" />
          <p className="text-xs text-steel font-bold uppercase tracking-widest">Loading Auction…</p>
        </div>
      </div>
    );
  }

  if (state === null || !auction || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center space-y-4 max-w-xs">
          <Swords className="w-8 h-8 mx-auto text-steel" />
          <h2 className="text-base font-bold text-white">Auction Not Found</h2>
          <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-lime text-background rounded-xl font-bold text-xs">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  /* ── RENDER ──────────────────────────────────────────────────────── */
  const opponentSquad = state?.opponentSquad ?? [];

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-3 pb-24 md:pb-6 animate-fade-in relative">
      {/* ── CARD REVEAL OVERLAY ────────────────────────────────────────── */}
      {state.lastCompletedRound && (
        <BidRevealAnimation
          isOpen={showReveal}
          onClose={() => setShowReveal(false)}
          lastCompletedRound={state.lastCompletedRound as any}
        />
      )}

      {/* ── WAITING FOR OPPONENT OVERLAY ────────────────────────────── */}
      {auction.status === "pending" && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-5 p-6 animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-lime/8 blur-[120px] rounded-full pointer-events-none" />
          <Loader2 className="w-10 h-10 text-lime animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Waiting for Opponent</h2>
            <p className="text-xs text-steel">Share this code so your rival can join</p>
          </div>
          <div className="flex items-center gap-3 bg-card border border-lime/30 rounded-2xl px-6 py-4">
            <span className="text-3xl font-stats text-lime tracking-[0.3em]">{room.code}</span>
            <button onClick={copyCode} className="p-2 rounded-xl bg-slate-900 border border-border hover:border-lime/40 text-steel hover:text-lime transition-all">
              {codeCopied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={async () => {
              try { await cancelRoom({ roomId: roomId as Id<"rooms">, hostId: guestId! }); router.push("/"); } catch {}
            }}
            className="text-xs text-steel hover:text-rose-400 transition-colors mt-4"
          >
            Cancel Room
          </button>
        </div>
      )}

      {/* ── COMPACT SCOREBAR ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border/80 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          {/* Budget pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-lime/10 border border-lime/30 rounded-lg">
              <DollarSign className="w-3.5 h-3.5 text-lime" />
              <div className="flex flex-col">
                <span className="text-[9px] text-steel font-bold uppercase leading-none">You</span>
                <span className="font-stats text-sm text-lime leading-tight">${myBudget}M</span>
              </div>
            </div>
            <span className="text-steel/50 text-xs font-bold">vs</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-steel font-bold uppercase leading-none">Rival</span>
                <span className="font-stats text-sm text-rose-400 leading-tight">${opponent?.budget ?? 0}M</span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <AuctionTimer timeLeft={timeLeft} maxTime={30} isActive={isActive} size={44} showBoost={isActivatingPerk} />
        </div>

        {/* Round progress bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime/60 to-lime rounded-full transition-all duration-500"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-steel whitespace-nowrap">
            R{auction.currentRound}/{totalRounds} • {auction.formation}
          </span>
        </div>
      </div>

      {/* ── MAIN CARD SPOTLIGHT ────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-5 relative overflow-hidden shadow-lg">
        {/* Ambient tier glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] sm:w-[300px] h-[160px] sm:h-[200px] blur-[100px] rounded-full pointer-events-none opacity-15"
          style={{ backgroundColor: tierColor }}
        />

        {/* Position badge + Bid status */}
        <div className="relative z-10 flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm"
              style={{
                color: tierColor,
                backgroundColor: `${tierColor}15`,
                borderColor: `${tierColor}40`,
              }}
            >
              {currentPosition}
            </span>
            <span className="text-[10px] text-steel font-bold uppercase tracking-wider">{mainPlayer?.tier}</span>
          </div>

          <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            highestBid === 0
              ? "bg-slate-900 border-border text-steel"
              : iAmLeading
              ? "bg-lime/10 border-lime/30 text-lime"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {highestBid === 0 ? "Opening Bid" : iAmLeading ? `You lead $${highestBid}M` : `Rival leads $${highestBid}M`}
          </span>
        </div>

        {/* Player Card */}
        <div className="relative z-10 flex justify-center py-0.5">
          {playerData ? (
            <div className="animate-scale-in scale-90 sm:scale-100 origin-center" key={`${auction.currentRound}-${playerData.id}`}>
              <PlayerCard player={playerData} size="md" />
            </div>
          ) : (
            <div className="w-44 sm:w-48 h-[240px] sm:h-[260px] rounded-2xl bg-border/20 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-steel animate-spin" />
            </div>
          )}
        </div>

        {/* ── Perk Intel Banner ──────────────────────────────────────── */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0 text-[11px] sm:text-xs">
              {me.perk === "SPY" && revealedSubPlayer && (
                <p className="text-white font-medium">
                  🕵️ <strong className="text-amber-300">SPY INTEL</strong>: Hidden Backup is <strong className="text-amber-200">{revealedSubPlayer.name}</strong> ({revealedSubPlayer.tier} • {revealedSubPlayer.position})
                </p>
              )}
              {me.perk === "SCOUT" && revealedNextMainPlayer && (
                <p className="text-white font-medium">
                  🔭 <strong className="text-amber-300">SCOUT INTEL</strong>: Next Target is <strong className="text-amber-200">{revealedNextMainPlayer.name}</strong> ({nextRoundInfo?.position})
                </p>
              )}
              {me.perk === "SPY" && !revealedSubPlayer && (
                <p className="text-white font-medium">
                  🕵️ <strong className="text-amber-300">SPY INTEL</strong>: Rival remaining budget is <strong className="text-amber-200">${opponent?.budget ?? 0}M</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BID CONTROLS ───────────────────────────────────────────── */}
      {isMyTurn ? (
        <div className="bg-card border border-lime/30 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-lg animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-lime font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-lime" /> Your turn to bid
            </span>

            {/* Perk button inline */}
            {me?.perk && !me.perkUsed && (
              <button
                onClick={handleActivatePerk}
                disabled={isActivatingPerk}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              >
                {me.perk === "SCOUT" ? <Binoculars className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Use {me.perk}
              </button>
            )}
            {me?.perk && me.perkUsed && (
              <span className="text-[10px] text-steel font-bold uppercase bg-slate-900 px-2 py-0.5 rounded-md border border-border">{me.perk} Used</span>
            )}
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setBidAmount(chip.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  bidAmount === chip.value
                    ? "bg-lime text-slate-950 border-lime shadow-sm"
                    : "bg-slate-900 border-border text-white hover:border-lime/30"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="pt-0.5">
            <BidSlider value={bidAmount} min={minBid} max={myBudget} onChange={setBidAmount} />
          </div>

          {error && <p className="text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">{error}</p>}

          <div className="flex gap-2 pt-0.5">
            <button
              onClick={handlePass}
              disabled={isSubmitting}
              className="flex-1 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <X className="w-3.5 h-3.5" /> Pass
            </button>
            <button
              onClick={handleBid}
              disabled={isSubmitting || bidAmount < minBid || bidAmount > myBudget}
              className="flex-[2] py-2.5 sm:py-3 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40"
            >
              Bid ${bidAmount}M <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : isActive ? (
        <div className="bg-card border border-border/80 rounded-2xl p-3.5 flex items-center justify-center gap-2 shadow-md">
          <Loader2 className="w-4 h-4 text-steel animate-spin shrink-0" />
          <span className="text-steel font-bold text-xs uppercase tracking-wider">Rival is considering a bid…</span>
        </div>
      ) : null}

      {/* ── ACQUIRED SQUAD DRAWER (PLAYER PACKS VIBES) ───────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowSquad(!showSquad)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-steel hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            Squad Roster ({mySquad.length}/{totalRounds})
          </span>
          {showSquad ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSquad && (
          <div className="px-3 pb-3 space-y-3 animate-slide-down">
            {/* Squad Tabs */}
            <div className="flex border-b border-border text-xs">
              <button
                onClick={() => setSquadTab("my")}
                className={`flex-1 py-2 font-black uppercase text-[11px] border-b-2 transition-colors ${
                  squadTab === "my" ? "border-lime text-lime" : "border-transparent text-steel hover:text-white"
                }`}
              >
                My Squad ({mySquad.length})
              </button>
              <button
                onClick={() => setSquadTab("rival")}
                className={`flex-1 py-2 font-black uppercase text-[11px] border-b-2 transition-colors ${
                  squadTab === "rival" ? "border-rose-400 text-rose-400" : "border-transparent text-steel hover:text-white"
                }`}
              >
                Rival Squad ({opponentSquad.length})
              </button>
              <button
                onClick={() => setSquadTab("pitch")}
                className={`flex-1 py-2 font-black uppercase text-[11px] border-b-2 transition-colors ${
                  squadTab === "pitch" ? "border-amber-400 text-amber-400" : "border-transparent text-steel hover:text-white"
                }`}
              >
                Tactical Pitch
              </button>
            </div>

            {/* My Squad / Rival Squad List */}
            {squadTab === "pitch" ? (
              <TacticalPitch
                formation={auction.formation}
                matchSize={(auction.matchSize as 5 | 11) || 11}
                squad={mySquad}
                compact={true}
                title="Your Current Lineup"
                accentColor="#95E810"
              />
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {(squadTab === "my" ? mySquad : opponentSquad).length === 0 ? (
                  <p className="text-center py-4 text-xs text-steel">No players acquired yet</p>
                ) : (
                  (squadTab === "my" ? mySquad : opponentSquad).map((slot, idx) => {
                    const playerTierColor = TIER_COLORS[slot.player?.tier as string] ?? "#848487";
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-border/60 hover:border-border transition-all"
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase border shrink-0"
                          style={{
                            color: playerTierColor,
                            borderColor: `${playerTierColor}50`,
                            backgroundColor: `${playerTierColor}15`,
                          }}
                        >
                          {slot.position}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{slot.player?.name ?? "Unknown"}</p>
                          <p className="text-[10px] text-steel truncate">{slot.player?.club} • <span style={{ color: playerTierColor }}>{slot.player?.tier}</span></p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-stats ${slot.cost > 0 ? "text-lime" : "text-steel"}`}>
                            {slot.cost > 0 ? `$${slot.cost}M` : "FREE"}
                          </span>
                          {slot.isSub && (
                            <span className="block text-[9px] text-amber-400 font-bold">SUB</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
