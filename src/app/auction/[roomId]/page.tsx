"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PlayerCard } from "@/components/shared/player-card";
import { AuctionTimer } from "@/components/shared/auction-timer";
import { BidSlider } from "@/components/shared/bid-slider";
import { TacticalPitch } from "@/components/shared/tactical-pitch";
import { BidRevealAnimation } from "@/components/shared/bid-reveal-animation";
import type { PlayerCardData } from "@/types/player";
import {
  Wallet, Loader2, ArrowRight, X, Trophy, Shield, Eye, Zap,
  Swords, Crown, Sparkles, Copy, Check
} from "lucide-react";

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [guestId, setGuestId] = useState<Id<"guestUsers"> | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [selectedTeamTab, setSelectedTeamTab] = useState<"me" | "rival">("me");

  // Reveal animation state
  const [showReveal, setShowReveal] = useState(false);
  const [revealData, setRevealData] = useState<{
    position: string;
    roundNumber: number;
    mainPlayer: PlayerCardData | null;
    subPlayer: PlayerCardData | null;
    winnerName: string;
    winnerIsMe: boolean;
    winningBid: number;
    runnerUpName: string;
  } | null>(null);

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
      const prevRoundIdx = prevRoundRef.current - 1;
      const prevRound = state.auction.rounds[prevRoundIdx];
      if (prevRound) {
        const myLastPick = state.mySquad?.find(s => s.position === prevRound.position);
        const rivalLastPick = state.opponentSquad?.find(s => s.position === prevRound.position);

        const iGotMain = myLastPick && !myLastPick.isSub;
        const winnerIsMe = Boolean(iGotMain);
        const winnerName = winnerIsMe ? "You" : "Opponent";
        const runnerUpName = winnerIsMe ? "Opponent" : "You";
        const winningBid = iGotMain ? myLastPick.cost : (rivalLastPick?.cost || 0);

        setRevealData({
          position: prevRound.position,
          roundNumber: prevRoundRef.current,
          mainPlayer: state.mainPlayer,
          subPlayer: state.revealedSubPlayer ? {
            id: state.revealedSubPlayer._id,
            name: state.revealedSubPlayer.name,
            tier: state.revealedSubPlayer.tier as any,
            position: state.revealedSubPlayer.position,
            club: state.revealedSubPlayer.club,
            nation: state.revealedSubPlayer.nation,
            imageUrl: state.revealedSubPlayer.imageUrl,
          } : null,
          winnerName,
          winnerIsMe,
          winningBid,
          runnerUpName,
        });
        setShowReveal(true);
      }
    }
    prevRoundRef.current = currentRoundNum;
  }, [state?.auction?.currentRound, state?.mySquad, state?.opponentSquad, state?.mainPlayer, state?.revealedSubPlayer]);

  const handleCancelRoom = useCallback(async () => {
    if (!guestId || !roomId) return;
    try {
      await cancelRoom({ roomId: roomId as Id<"rooms">, hostId: guestId });
      router.push("/");
    } catch (e: any) {
      alert(e.message || "Could not cancel room");
    }
  }, [cancelRoom, guestId, roomId, router]);

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
  const iAmLeading = auction?.currentBidding?.highestBidderId === guestId;

  const playerData: PlayerCardData | null = mainPlayer ? {
    id: mainPlayer._id, name: mainPlayer.name, tier: mainPlayer.tier as any,
    position: mainPlayer.position, club: mainPlayer.club, nation: mainPlayer.nation,
    imageUrl: mainPlayer.imageUrl, isLegend: mainPlayer.isLegend, kitNumber: mainPlayer.kitNumber,
  } : null;

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

  if (!guestId || state === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-lime animate-spin" />
          <p className="text-xs text-steel font-bold uppercase tracking-widest">Loading Game Screen…</p>
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

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-3 pb-20 md:pb-6 animate-fade-in">
      {/* ── CARD REVEAL OVERLAY ────────────────────────────────────────── */}
      {revealData && (
        <BidRevealAnimation
          isOpen={showReveal}
          onClose={() => setShowReveal(false)}
          position={revealData.position}
          roundNumber={revealData.roundNumber}
          mainPlayer={revealData.mainPlayer}
          subPlayer={revealData.subPlayer}
          winnerName={revealData.winnerName}
          winnerIsMe={revealData.winnerIsMe}
          winningBid={revealData.winningBid}
          runnerUpName={revealData.runnerUpName}
        />
      )}

      {/* ── CLEAN BROADCAST SCOREBAR ───────────────────────────────────── */}
      <div className="bg-card rounded-xl px-4 py-2.5 border border-border/80 flex items-center justify-between gap-2 shadow-md">
        {/* Left: Clean Budget Display */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-lime" />
            <span className="text-steel">YOU:</span>
            <span className="font-stats text-sm text-lime">${myBudget}M</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-steel">RIVAL:</span>
            <span className="font-stats text-sm text-rose-400">${opponent?.budget ?? 0}M</span>
          </div>
        </div>

        {/* Center: Timer & Round */}
        <div className="flex items-center gap-3">
          <AuctionTimer timeLeft={timeLeft} maxTime={15} isActive={isActive} size={44} />
          <div className="flex flex-col text-center">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              {currentPosition} • R{auction.currentRound}/{totalRounds}
            </span>
            <span className="text-[9px] text-steel font-medium">({auction.formation || "4-3-3"})</span>
          </div>
        </div>

        {/* Right: Perk Button */}
        <div>
          {me?.perk && (
            <button
              onClick={handleActivatePerk}
              disabled={me.perkUsed || isActivatingPerk || !isActive}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                me.perkUsed
                  ? "bg-slate-900 text-steel border border-border cursor-not-allowed"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm active:scale-95"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {me.perkUsed ? `${me.perk} USED` : me.perk}
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 relative">
        {/* OVERLAY: Waiting for Opponent */}
        {auction.status === "pending" && (
          <div className="absolute inset-0 z-30 bg-card/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 p-6 border border-border">
            <Loader2 className="w-8 h-8 text-lime animate-spin" />
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Waiting for Opponent</h2>
              <p className="text-xs text-steel">Room Code: <span className="text-lime font-stats text-base">{room.code}</span></p>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-2 bg-slate-900 border border-border hover:border-lime/40 text-xs font-bold text-white rounded-lg flex items-center gap-1.5"
            >
              {codeCopied ? "Copied!" : "Copy Code"} <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── LEFT: Card Spotlight & Clean Controls ─────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Card Spotlight Container */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col items-center gap-4 relative shadow-md">
            {/* Status Line */}
            <div className="w-full flex items-center justify-between text-[11px] text-steel font-bold px-1">
              <span>{currentPosition} SLOT</span>
              <span className={highestBid > 0 ? (iAmLeading ? "text-lime" : "text-rose-400") : "text-steel"}>
                {highestBid === 0 ? "STARTING BID" : iAmLeading ? "YOU LEAD ($" + highestBid + "M)" : "RIVAL LEADS ($" + highestBid + "M)"}
              </span>
            </div>

            {/* Main Player Card */}
            {playerData ? (
              <div className="animate-card-reveal" key={`${auction.currentRound}-${playerData.id}`}>
                <PlayerCard player={playerData} size="lg" />
              </div>
            ) : (
              <div className="w-48 h-[260px] rounded-2xl bg-border/20 animate-pulse flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-steel animate-spin" />
              </div>
            )}

            {/* Perk Intel (Clean, Unobtrusive) */}
            {me?.perkUsed && (
              <div className="w-full p-2.5 bg-slate-900 border border-amber-500/30 rounded-xl text-xs flex items-center justify-between">
                <span className="text-amber-400 font-bold text-[10px] uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> INTEL:
                </span>
                {me.perk === "SPY" && revealedSubPlayer && (
                  <span className="text-white text-[11px] font-medium truncate max-w-[220px]">
                    Sub: <strong className="text-amber-300">{revealedSubPlayer.name}</strong> ({revealedSubPlayer.club})
                  </span>
                )}
                {me.perk === "SCOUT" && revealedNextMainPlayer && (
                  <span className="text-white text-[11px] font-medium truncate max-w-[220px]">
                    Next: <strong className="text-amber-300">{revealedNextMainPlayer.name}</strong> ({nextRoundInfo?.position})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Clean Action Controls */}
          {isMyTurn ? (
            <div className="bg-card border border-lime/30 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-lime font-bold uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-lime" /> YOUR TURN TO BID
                </span>
                <span className="font-stats text-steel">Max: ${myBudget}M</span>
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setBidAmount(chip.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      bidAmount === chip.value
                        ? "bg-lime text-slate-950 border-lime shadow-sm"
                        : "bg-slate-900 border-border text-white hover:border-lime/30"
                    }`}
                  >
                    {chip.label === "ALL IN" ? "ALL IN" : `$${chip.value}M`}
                  </button>
                ))}
              </div>

              <BidSlider value={bidAmount} min={minBid} max={myBudget} onChange={setBidAmount} />

              {error && <p className="text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1 rounded-lg">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handlePass}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Pass
                </button>
                <button
                  onClick={handleBid}
                  disabled={isSubmitting || bidAmount < minBid || bidAmount > myBudget}
                  className="flex-[2] py-2.5 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                >
                  Bid ${bidAmount}M <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isActive ? (
            <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-steel animate-spin shrink-0" />
              <span className="text-steel font-bold text-xs uppercase tracking-wider">Opponent's Turn...</span>
            </div>
          ) : null}
        </div>

        {/* ── RIGHT: Tactical Pitch View ────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {/* Pitch Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-border/80">
            <button
              onClick={() => setSelectedTeamTab("me")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedTeamTab === "me"
                  ? "bg-lime text-slate-950 shadow-sm"
                  : "text-steel hover:text-white"
              }`}
            >
              My Squad ({squad.length})
            </button>
            <button
              onClick={() => setSelectedTeamTab("rival")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedTeamTab === "rival"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-steel hover:text-white"
              }`}
            >
              Rival Squad ({rivalSquad.length})
            </button>
          </div>

          {/* Tactical Pitch Component */}
          <TacticalPitch
            formation={auction.formation || "4-3-3"}
            matchSize={(auction.matchSize as 5 | 11) || 11}
            squad={selectedTeamTab === "me" ? squad : rivalSquad}
            title={selectedTeamTab === "me" ? "My Pitch" : "Rival Pitch"}
            accentColor={selectedTeamTab === "me" ? "#95E810" : "#F43F5E"}
            badgeLabel={selectedTeamTab === "me" ? "Home" : "Away"}
          />
        </div>
      </div>
    </div>
  );
}
