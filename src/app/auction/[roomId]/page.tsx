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
import { useGuestSession } from "@/hooks/use-guest-session";
import {
  Loader2, ArrowRight, X, Sparkles, Zap, Copy, Check,
  Swords, Eye, Binoculars, DollarSign, ChevronDown, ChevronUp
} from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  ICON: "#D4AF37", MASTER: "#A855F7", ELITE_PLUS: "#0EA5E9",
  ELITE: "#E11D48", GOLD: "#EAB308", SILVER: "#CBD5E1", BRONZE: "#C97A3A",
};

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { guestId } = useGuestSession(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showFormation, setShowFormation] = useState(true);
  const prevRoundRef = useRef<number | null>(null);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip",
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowFormation(false);
    }
  }, []);

  useEffect(() => {
    if (state?.auction?.status === "completed" || state?.room?.status === "completed") {
      const timer = setTimeout(() => router.push(`/result/${roomId}`), 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.auction?.status, state?.room?.status, roomId, router]);

  const placeBid = useMutation(api.auctions.mutations.placeBid);
  const pass = useMutation(api.auctions.mutations.pass);
  const cancelRoom = useMutation(api.rooms.mutations.cancel);
  const mutatePerk = useMutation(api.auctions.mutations.usePerk);
  const autoPassFired = useRef(false);

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingPerk, setIsActivatingPerk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.auction) return;
    const cur = state.auction.currentRound;
    if (prevRoundRef.current !== null && cur > prevRoundRef.current) setShowReveal(true);
    prevRoundRef.current = cur;
  }, [state?.auction]);

  const handleActivatePerk = useCallback(async () => {
    if (!guestId || !roomId || isActivatingPerk || state?.me?.perkUsed) return;
    setIsActivatingPerk(true); setError(null);
    try { await mutatePerk({ roomId: roomId as Id<"rooms">, userId: guestId }); }
    catch (e: unknown) { setError((e as { message?: string }).message || "Could not activate perk"); }
    finally { setIsActivatingPerk(false); }
  }, [mutatePerk, guestId, isActivatingPerk, roomId, state?.me?.perkUsed]);

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!state?.auction?.currentBidding?.turnExpiresAt || state.auction.status !== "active") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((state.auction.currentBidding.turnExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [state?.auction?.currentBidding?.turnExpiresAt, state?.auction?.status]);

  useEffect(() => {
    if (!state || !state.auction || state.auction.status !== "active" || !state.auction.currentBidding?.turnExpiresAt) return;
    const isMyTurn = state.auction.currentBidding.activeTurnUserId === guestId;
    const isExpired = timeLeft === 0 && (Date.now() >= state.auction.currentBidding.turnExpiresAt - 500);
    if (isExpired && isMyTurn && !isSubmitting && !autoPassFired.current) {
      autoPassFired.current = true;
      pass({ roomId: roomId as Id<"rooms">, userId: guestId! }).catch(console.error);
    }
    if (timeLeft > 0) autoPassFired.current = false;
  }, [timeLeft, state, isSubmitting, pass, roomId, guestId]);

  const prevBiddingKeyRef = useRef<string>("");
  const currentBiddingKey = `${state?.auction?.currentRound}-${state?.auction?.currentBidding?.highestBid}`;
  useEffect(() => {
    if (!state?.auction) return;
    if (prevBiddingKeyRef.current !== currentBiddingKey) {
      prevBiddingKeyRef.current = currentBiddingKey;
      const hb = state.auction.currentBidding.highestBid;
      setBidAmount(hb > 0 ? hb + 1 : 1);
      setError(null);
    }
  }, [currentBiddingKey, state?.auction]);

  /* ── Derived ───────────────────────────────────────────────── */
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
    id: mainPlayer._id, name: mainPlayer.name, tier: mainPlayer.tier as PlayerCardData["tier"],
    position: mainPlayer.position, club: mainPlayer.club, nation: mainPlayer.nation,
    imageUrl: mainPlayer.imageUrl, isLegend: mainPlayer.isLegend, kitNumber: mainPlayer.kitNumber,
  } : null;

  const quickChips = [
    { label: `$${minBid}M`, value: minBid },
    { label: `$${Math.min(myBudget, minBid + 4)}M`, value: Math.min(myBudget, minBid + 4) },
    { label: `$${Math.min(myBudget, minBid + 9)}M`, value: Math.min(myBudget, minBid + 9) },
    { label: "ALL IN", value: myBudget },
  ].filter((c, i, arr) => c.value <= myBudget && c.value >= minBid && arr.findIndex(x => x.value === c.value) === i);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleBid = useCallback(async () => {
    if (!isActive || !guestId || bidAmount < minBid || bidAmount > myBudget) return;
    setIsSubmitting(true); setError(null);
    try { await placeBid({ roomId: roomId as Id<"rooms">, userId: guestId, amount: bidAmount }); }
    catch (e: unknown) { setError((e as { message?: string }).message || "Bid failed"); }
    finally { setIsSubmitting(false); }
  }, [isActive, guestId, bidAmount, minBid, myBudget, placeBid, roomId]);

  const handlePass = useCallback(async () => {
    if (!isActive || !guestId) return;
    setIsSubmitting(true); setError(null);
    try { await pass({ roomId: roomId as Id<"rooms">, userId: guestId }); }
    catch (e: unknown) { setError((e as { message?: string }).message || "Pass failed"); }
    finally { setIsSubmitting(false); }
  }, [isActive, guestId, pass, roomId]);

  const handleRevealClose = useCallback(() => {
    setShowReveal(false);
    setShowFormation(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => {
        setShowFormation(false);
      }, 3800);
    }
  }, []);

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  /* ── Loading / Error states ─────────────────────────────────── */
  if (!guestId || state === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-lime animate-spin" />
          <p className="text-xs text-steel font-bold uppercase tracking-widest">Loading Auction...</p>
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
          <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-lime text-background rounded-xl font-bold text-xs">Go Home</button>
        </div>
      </div>
    );
  }

  const formationSquad = mySquad.map((slot) => ({
    position: slot.position,
    roundNumber: slot.roundNumber,
    player: slot.player ? { name: slot.player.name, tier: slot.player.tier, imageUrl: slot.player.imageUrl } : null,
    cost: slot.cost, isSub: slot.isSub,
  }));

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2.5 pb-24 md:pb-6 animate-fade-in relative">
      {/* CARD REVEAL OVERLAY */}
      {state.lastCompletedRound && (
        <BidRevealAnimation isOpen={showReveal} onClose={handleRevealClose}
          lastCompletedRound={state.lastCompletedRound as unknown as Parameters<typeof BidRevealAnimation>[0]["lastCompletedRound"]} />
      )}

      {/* WAITING FOR OPPONENT OVERLAY */}
      {auction.status === "pending" && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-5 p-5 animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-lime/8 blur-[120px] rounded-full pointer-events-none" />
          <Loader2 className="w-10 h-10 text-lime animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Waiting for Opponent</h2>
            <p className="text-sm text-steel">Share this code so your rival can join.</p>
          </div>
          <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-lime/30 bg-card px-4 py-4 shadow-2xl">
            <span className="font-stats text-3xl text-lime tracking-[0.22em]">{room.code}</span>
            <button onClick={copyCode} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-border hover:border-lime/40 text-steel hover:text-lime transition-all">
              {codeCopied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={async () => { try { await cancelRoom({ roomId: roomId as Id<"rooms">, hostId: guestId! }); router.push("/"); } catch {} }}
            className="text-xs text-steel hover:text-rose-400 transition-colors mt-4">Cancel Room</button>
        </div>
      )}

      {/* ── SCOREBAR ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-card/95 p-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-lime/30 bg-lime/10 px-2.5 py-2">
              <DollarSign className="w-3.5 h-3.5 text-lime" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] text-steel font-bold uppercase leading-none">You</span>
                <span className="font-stats text-sm text-lime leading-tight">${myBudget}M</span>
              </div>
            </div>
            <span className="text-steel/50 text-xs font-bold">vs</span>
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-2">
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] text-steel font-bold uppercase leading-none">Rival</span>
                <span className="font-stats text-sm text-rose-400 leading-tight">${opponent?.budget ?? 0}M</span>
              </div>
            </div>
          </div>
          <AuctionTimer timeLeft={timeLeft} maxTime={30} isActive={isActive} size={44} showBoost={isActivatingPerk} />
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-lime/60 to-lime rounded-full transition-all duration-500"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }} />
          </div>
          <span className="text-[10px] font-bold text-steel whitespace-nowrap">
            R{auction.currentRound}/{totalRounds} · {auction.formation}
          </span>
        </div>
      </div>

      {/* ── LIVE FORMATION VIEW ──────────────────────────────── */}
      <div className="bg-card/95 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        <button onClick={() => setShowFormation(!showFormation)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-steel hover:text-white transition-colors">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            Live Squad Builder ({mySquad.filter(s => s.player).length}/{totalRounds})
          </span>
          {showFormation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFormation && (
          <div className="px-2 pb-2 animate-slide-down">
            <TacticalPitch
              formation={auction.formation}
              matchSize={(auction.matchSize as 5 | 11) || 11}
              squad={formationSquad}
              rounds={auction.rounds}
              currentRound={auction.currentRound}
              totalRounds={totalRounds}
            />
          </div>
        )}
      </div>

      {/* ── MAIN CARD + BID STATUS ───────────────────────────── */}
      <div className="bg-card/95 border border-white/10 rounded-2xl p-3 sm:p-4 relative overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[140px] blur-[90px] rounded-full pointer-events-none opacity-15"
          style={{ backgroundColor: tierColor }} />

        <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm"
              style={{ color: tierColor, backgroundColor: `${tierColor}15`, borderColor: `${tierColor}40` }}>
              {currentPosition}
            </span>
            <span className="text-[10px] text-steel font-bold uppercase tracking-wider">{mainPlayer?.tier}</span>
          </div>
          <span className={`shrink-0 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border ${
            highestBid === 0 ? "bg-slate-900 border-border text-steel"
              : iAmLeading ? "bg-lime/10 border-lime/30 text-lime"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {highestBid === 0 ? "Opening Bid" : iAmLeading ? `You lead $${highestBid}M` : `Rival leads $${highestBid}M`}
          </span>
        </div>

        <div className="relative z-10 flex justify-center py-0.5">
          {playerData ? (
            <div className="animate-scale-in origin-center" key={`${auction.currentRound}-${playerData.id}`}>
              <PlayerCard player={playerData} size="md" />
            </div>
          ) : (
            <div className="w-44 sm:w-48 h-[240px] sm:h-[260px] rounded-2xl bg-border/20 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-steel animate-spin" />
            </div>
          )}
        </div>

        {/* Perk Intel Banner */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0 text-[11px] sm:text-xs">
              {me.perk === "SPY" && revealedSubPlayer && (
                <p className="text-white font-medium"><strong className="text-amber-300">SPY INTEL</strong>: Secret backup is <strong className="text-amber-200">{revealedSubPlayer.name}</strong> ({revealedSubPlayer.tier} - {revealedSubPlayer.position})</p>
              )}
              {me.perk === "SCOUT" && revealedNextMainPlayer && (
                <p className="text-white font-medium"><strong className="text-amber-300">SCOUT INTEL</strong>: Next target is <strong className="text-amber-200">{revealedNextMainPlayer.name}</strong> ({nextRoundInfo?.position})</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BID CONTROLS ─────────────────────────────────────── */}
      {isMyTurn ? (
        <div className="bg-card/95 border border-lime/30 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl animate-slide-up backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-lime font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-lime" /> Your turn to bid
            </span>
            {me?.perk && !me.perkUsed && (
              <button onClick={handleActivatePerk} disabled={isActivatingPerk}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition-all active:scale-95 shadow-sm">
                {me.perk === "SCOUT" ? <Binoculars className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Use {me.perk}
              </button>
            )}
            {me?.perk && me.perkUsed && (
              <span className="text-[10px] text-steel font-bold uppercase bg-slate-900 px-2 py-0.5 rounded-md border border-border">{me.perk} Used</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickChips.map((chip) => (
              <button key={chip.value} onClick={() => setBidAmount(chip.value)}
                className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition-all ${
                  bidAmount === chip.value ? "bg-lime text-slate-950 border-lime shadow-sm" : "bg-slate-900 border-border text-white hover:border-lime/30"
                }`}>{chip.label}</button>
            ))}
          </div>

          <div className="pt-0.5"><BidSlider value={bidAmount} min={minBid} max={myBudget} onChange={setBidAmount} /></div>

          {error && <p className="text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">{error}</p>}

          <div className="grid grid-cols-[1fr_1.7fr] gap-2 pt-0.5">
            <button onClick={handlePass} disabled={isSubmitting}
              className="py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-1 active:scale-95">
              <X className="w-3.5 h-3.5" /> Pass
            </button>
            <button onClick={handleBid} disabled={isSubmitting || bidAmount < minBid || bidAmount > myBudget}
              className={`py-3.5 font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40 ${
                bidAmount > (opponent?.budget ?? 0)
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                  : "bg-lime hover:bg-vivid text-slate-950"
              }`}>
              {bidAmount > (opponent?.budget ?? 0) ? (
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 fill-slate-950" /> AUTO-WIN ${bidAmount}M</span>
              ) : (<>Bid ${bidAmount}M <ArrowRight className="w-3.5 h-3.5" /></>)}
            </button>
          </div>
        </div>
      ) : isActive ? (
        <div className="bg-card/95 border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-xl animate-shimmer">
          <Loader2 className="w-4 h-4 text-steel animate-spin shrink-0" />
          <span className="text-steel font-bold text-xs uppercase tracking-wider">Rival is considering a bid...</span>
        </div>
      ) : null}
    </div>
  );
}
