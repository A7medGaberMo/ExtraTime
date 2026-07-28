"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PlayerCard } from "@/components/shared/player-card";
import { AuctionTimer } from "@/components/shared/auction-timer";
import { BidSlider } from "@/components/shared/bid-slider";
import type { PlayerCardData } from "@/types/player";
import {
  Wallet, Loader2, ArrowRight, X, Trophy, Shield, Eye, Zap,
  Swords, Crown, ChevronRight, Sparkles, Copy, Check,
} from "lucide-react";

/* ── Random football-themed name generator ────────────────────────────── */
const FIRST = ["Coach", "Boss", "Gaffer", "Mister", "Don", "Captain", "Chief", "Maestro", "Legend", "Striker"];
const LAST = ["Santos", "Müller", "Silva", "Ali", "Rossi", "Park", "König", "Torres", "Diallo", "Kovač"];
function randomManagerName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

/* ── Tier color helper ─────────────────────────────────────────────────── */
function tierAccent(tier?: string) {
  const map: Record<string, string> = {
    ICON: "text-lime", MASTER: "text-purple-400", ELITE_PLUS: "text-blue-400",
    ELITE: "text-cyan-400", GOLD: "text-amber-400", SILVER: "text-slate-300", BRONZE: "text-orange-500",
  };
  return map[tier || ""] || "text-white";
}

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [guestId, setGuestId] = useState<Id<"guestUsers"> | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("extratime_guestId") as Id<"guestUsers">;
    if (id) setGuestId(id);
    else router.push("/");
  }, [router]);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip",
  );

  const placeBid = useMutation(api.auctions.mutations.placeBid);
  const pass = useMutation(api.auctions.mutations.pass);

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"bid" | "pass" | null>(null);

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
    if (timeLeft === 0 && isMyTurn && !isSubmitting) {
      pass({ roomId: roomId as Id<"rooms">, userId: guestId! }).catch(console.error);
    }
  }, [timeLeft, state, isSubmitting, pass, roomId, guestId]);

  /* Reset bid to min whenever round/turn changes */
  useEffect(() => {
    if (!state?.auction) return;
    const hb = state.auction.currentBidding.highestBid;
    const min = hb > 0 ? hb + 1 : 1;
    setBidAmount(min);
    setError(null);
    setLastAction(null);
  }, [state?.auction?.currentRound, state?.auction?.currentBidding?.highestBid]);

  /* ── Derived data ───────────────────────────────────────────────────── */
  const auction = state?.auction;
  const room = state?.room;
  const me = state?.me;
  const opponent = state?.opponent;
  const mainPlayer = state?.mainPlayer;
  const mySquad = state?.mySquad;
  const opponentSquad = state?.opponentSquad;

  const isActive = auction?.status === "active";
  const isMyTurn = isActive && auction?.currentBidding?.activeTurnUserId === guestId;
  const highestBid = auction?.currentBidding?.highestBid ?? 0;
  const minBid = highestBid > 0 ? highestBid + 1 : 1;
  const myBudget = me?.budget ?? 0;
  const squad = mySquad ?? [];
  const rivalSquad = opponentSquad ?? [];
  const currentPosition = (auction?.rounds && auction?.currentRound) ? (auction.rounds[auction.currentRound - 1]?.position ?? "-") : "-";
  const totalRounds = auction?.rounds?.length ?? 11;
  const progress = Math.round((squad.length / totalRounds) * 100);
  const iAmLeading = auction?.currentBidding?.highestBidderId === guestId;

  const playerData: PlayerCardData | null = mainPlayer ? {
    id: mainPlayer._id, name: mainPlayer.name, tier: mainPlayer.tier as any,
    position: mainPlayer.position, club: mainPlayer.club, nation: mainPlayer.nation,
    imageUrl: mainPlayer.imageUrl, isLegend: mainPlayer.isLegend, kitNumber: mainPlayer.kitNumber,
  } : null;

  /* Quick bid chips: +1, +5, +10, ALL-IN */
  const quickChips = [
    { label: "+1", value: minBid },
    { label: "+5", value: Math.min(myBudget, minBid + 4) },
    { label: "+10", value: Math.min(myBudget, minBid + 9) },
    { label: "ALL IN", value: myBudget },
  ].filter((c, i, arr) => c.value <= myBudget && c.value >= minBid && arr.findIndex(x => x.value === c.value) === i);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleBid = useCallback(async () => {
    if (!isActive || !guestId || bidAmount < minBid || bidAmount > myBudget) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await placeBid({ roomId: roomId as Id<"rooms">, userId: guestId, amount: bidAmount });
      setLastAction("bid");
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
      setLastAction("pass");
    } catch (e: any) {
      setError(e.message || "Pass failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, pass, roomId]);

  /* ── Loading states ─────────────────────────────────────────────────── */
  if (!guestId || state === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-lime/20 border-t-lime animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-6 h-6 text-lime" />
            </div>
          </div>
          <p className="text-sm text-steel font-black uppercase tracking-widest">Loading Auction…</p>
        </div>
      </div>
    );
  }

  if (state === null || !auction || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
            <Swords className="w-7 h-7 text-steel" />
          </div>
          <h2 className="text-lg font-black text-white">Auction Not Found</h2>
          <p className="text-sm text-steel">This room may not exist or hasn't started yet.</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-lime text-background rounded-xl font-black text-xs active:scale-95 transition-transform">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  /* RENDER                                                              */
  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-24 md:pb-8 animate-fade-in">
      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3">
        {/* Left: budgets */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-lime shrink-0" />
            <span className="font-stats text-base text-lime">${myBudget}M</span>
          </div>
          <div className="w-px h-6 bg-border shrink-0" />
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-stats text-base text-rose-400">${opponent?.budget ?? 0}M</span>
          </div>
        </div>

        {/* Center: timer */}
        <AuctionTimer timeLeft={timeLeft} maxTime={15} isActive={isActive} size={56} />

        {/* Right: round info */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-steel tracking-wider">Round</span>
            <span className="font-stats text-base text-white">{auction.currentRound}/{auction.rounds.length}</span>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-steel tracking-wider">Slot</span>
            <span className="font-stats text-base text-white">{currentPosition}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 relative">

        {/* OVERLAY: waiting for opponent */}
        {auction.status === "pending" && (
          <div className="absolute inset-0 z-50 glass-card rounded-2xl flex flex-col items-center justify-center gap-5 animate-fade-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-lime/20 border-t-lime animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="w-8 h-8 text-lime animate-float" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white">Waiting for Opponent</h2>
              <p className="text-sm text-steel max-w-xs">Share the room code below. The auction begins when someone joins.</p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-lime/30 hover:border-lime transition-all active:scale-95"
            >
              <span className="font-stats text-2xl tracking-[0.3em] text-lime">{room.code}</span>
              {codeCopied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4 text-steel" />}
            </button>
          </div>
        )}

        {/* OVERLAY: completed */}
        {auction.status === "completed" && (
          <div className="absolute inset-0 z-50 glass-card rounded-2xl flex flex-col items-center justify-center gap-5 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-lime/10 border-2 border-lime flex items-center justify-center animate-breathe-glow">
              <Trophy className="w-10 h-10 text-lime" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">Auction Complete!</h2>
              <p className="text-sm text-steel">Your squad is locked in. Check the final results.</p>
            </div>
            <button
              onClick={() => router.push(`/result/${roomId}`)}
              className="px-8 py-3 bg-lime hover:bg-vivid text-background font-black text-sm rounded-xl shadow-lg shadow-lime/20 active:scale-95 transition-all flex items-center gap-2"
            >
              View Results <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── LEFT: Player spotlight + Bidding ─────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-[11px] font-black uppercase tracking-wider text-steel">
              <Shield className="w-3 h-3 text-lime" /> {currentPosition} Slot
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
              iAmLeading ? "bg-lime/10 border border-lime/30 text-lime" : highestBid > 0 ? "bg-rose-500/10 border border-rose-500/30 text-rose-400" : "bg-card border border-border text-steel"
            }`}>
              <Eye className="w-3 h-3" />
              {highestBid === 0 ? "No Bids" : iAmLeading ? "You Lead" : "Rival Leads"}
            </span>
            {auction.rounds[auction.currentRound - 1]?.isMysteryRound && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-black uppercase tracking-wider animate-badge-bounce">
                <Sparkles className="w-3 h-3" /> Mystery
              </span>
            )}
          </div>

          {/* Player card showcase */}
          <div className="auction-spotlight bg-card border border-border rounded-2xl p-5 md:p-8 flex flex-col items-center gap-6 min-h-[320px]">
            {playerData ? (
              <div className="animate-card-reveal" key={`${auction.currentRound}-${playerData.id}`}>
                <PlayerCard player={playerData} size="lg" />
              </div>
            ) : (
              <div className="w-56 h-[290px] rounded-3xl bg-border/30 animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-steel animate-spin" />
              </div>
            )}

            {/* Current bid display */}
            {highestBid > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background/60 border border-border animate-slide-up">
                <span className="text-[10px] font-black uppercase text-steel">Current Bid</span>
                <span className="font-stats text-xl text-lime">${highestBid}M</span>
                <span className={`text-[10px] font-black uppercase ${iAmLeading ? "text-lime" : "text-rose-400"}`}>
                  {iAmLeading ? "• YOU" : "• RIVAL"}
                </span>
              </div>
            )}
          </div>

          {/* ── BID CONTROLS ───────────────────────────────────────────── */}
          {isMyTurn ? (
            <div className="bg-card border-2 border-lime/30 rounded-2xl p-5 space-y-5 animate-swipe-up shadow-xl shadow-lime/5" key="bid-controls">
              <div className="flex items-center justify-between">
                <h3 className="text-lime font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-lime" /> Your Turn
                </h3>
                <span className="font-stats text-xs text-steel">Budget: ${myBudget}M</span>
              </div>

              {/* Quick bid chips */}
              <div className="flex flex-wrap gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setBidAmount(chip.value)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all btn-haptic border ${
                      bidAmount === chip.value
                        ? "bg-lime text-background border-lime shadow-md shadow-lime/20"
                        : "bg-background border-border text-white hover:border-lime/50 hover:text-lime"
                    }`}
                  >
                    {chip.label === "ALL IN" ? "🔥 ALL IN" : `$${chip.value}M`}
                  </button>
                ))}
              </div>

              {/* Swipe slider */}
              <div className="pt-4 pb-2 px-1">
                <BidSlider
                  value={bidAmount}
                  min={minBid}
                  max={myBudget}
                  onChange={setBidAmount}
                />
              </div>

              {error && (
                <p className="text-rose-500 text-xs font-black bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePass}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all btn-haptic flex items-center justify-center gap-2 border border-rose-500/20"
                >
                  <X className="w-4 h-4" /> Pass
                </button>
                <button
                  onClick={handleBid}
                  disabled={isSubmitting || bidAmount < minBid || bidAmount > myBudget}
                  className="flex-[2] py-3.5 bg-lime hover:bg-vivid text-background font-black text-xs uppercase tracking-wider rounded-xl transition-all btn-haptic disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-lime/20"
                >
                  Bid ${bidAmount}M <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isActive ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center gap-4 animate-fade-in" key="waiting-turn">
              <Loader2 className="w-5 h-5 text-steel animate-spin shrink-0" />
              <div>
                <p className="text-white font-black text-sm">Opponent's Turn</p>
                <p className="text-steel text-xs">They'll bid or pass — you'll be up next.</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── RIGHT SIDEBAR: My Squad ──────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col max-h-[600px] lg:max-h-none">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-lime" /> My Squad
            </h2>
            <span className="px-2 py-0.5 bg-lime/10 rounded-md text-lime text-[11px] font-stats border border-lime/20">
              {squad.length}/{auction.rounds.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime/60 to-lime transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Squad list */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-hidden pr-1">
            {squad.map((slot, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all animate-slide-in-up ${
                  slot.isSub
                    ? "bg-background/40 border border-dashed border-border"
                    : "bg-background border border-lime/15"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className={`w-9 text-center text-[10px] font-black rounded-md py-1 ${
                  slot.isSub ? "bg-border/50 text-steel" : "bg-lime/15 text-lime"
                }`}>
                  {slot.position}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${slot.isSub ? "text-steel/70 line-through" : "text-white"}`}>
                    {slot.player?.name || "Unknown"}
                  </p>
                  <p className="text-[10px] text-steel truncate">{slot.player?.club || ""}</p>
                </div>
                <span className="font-stats text-[10px] text-lime shrink-0">
                  {slot.cost > 0 ? `$${slot.cost}M` : "Free"}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, auction.rounds.length - squad.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed border-border/50 bg-background/10"
              >
                <span className="w-9 text-center text-[10px] font-black text-border rounded-md py-1 bg-border/20">—</span>
                <div className="flex-1 h-2 w-16 bg-border/20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Opponent draft ──────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-400" /> Opponent Draft
          </h2>
          <span className="font-stats text-[11px] text-steel">{rivalSquad.length}/{auction.rounds.length}</span>
        </div>
        {rivalSquad.length === 0 ? (
          <p className="text-center text-xs text-steel py-4">No picks yet.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
            {rivalSquad.map((slot, idx) => (
              <div
                key={`${slot.playerId}-${idx}`}
                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                  slot.isSub ? "bg-background/40 border-border" : "bg-background border-lime/15"
                }`}
                style={{ minWidth: 90 }}
              >
                <span className={`text-[10px] font-black ${slot.isSub ? "text-steel" : "text-white"}`}>
                  {slot.position}
                </span>
                <p className={`text-[10px] font-bold text-center truncate w-full ${slot.isSub ? "text-steel/60" : "text-white"}`}>
                  {slot.player?.name || "Unknown"}
                </p>
                <span className="font-stats text-[9px] text-lime">${slot.cost}M</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
