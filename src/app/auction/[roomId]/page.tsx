"use client";

import { use, useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { unlockAudio } from "@/lib/sfx";
import {
  Loader2, X, Layers, Copy, Check,
  Swords, Eye, Binoculars, DollarSign, ChevronDown, ChevronUp,
  Sparkles, Lock
} from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  ICON: "#D4AF37", HERO: "#10B981", MASTER: "#A855F7", ELITE_PLUS: "#0EA5E9",
  ELITE: "#E11D48", GOLD: "#EAB308", SILVER: "#CBD5E1", BRONZE: "#C97A3A",
};

const BLIND_PHASE_SECONDS = 30;

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { guestId } = useGuestSession(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showFormation, setShowFormation] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768
  );
  const prevRoundRef = useRef<number | null>(null);
  const pendingRedirectRef = useRef(false);
  const completedTriggeredRef = useRef(false);
  const audioRef = useRef(false);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<"rooms">, userId: guestId } : "skip",
  );

  // Detect auction completion → show final round reveal before redirect
  useEffect(() => {
    const isCompleted = state?.auction?.status === "completed" || state?.room?.status === "completed";
    if (isCompleted) {
      if (state?.lastCompletedRound && !completedTriggeredRef.current) {
        completedTriggeredRef.current = true;
        setShowReveal(true);
        pendingRedirectRef.current = true;
      } else if (!state?.lastCompletedRound) {
        const timer = setTimeout(() => router.push(`/result/${roomId}`), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state?.auction?.status, state?.room?.status, state?.lastCompletedRound, roomId, router]);

  const submitSealedBid = useMutation(api.auctions.sealed.submitSealedBid);
  const resolveSealedRound = useMutation(api.auctions.sealed.resolveSealedRound);
  const cancelRoom = useMutation(api.rooms.mutations.cancel);
  const mutatePerk = useMutation(api.auctions.mutations.usePerk);
  const autoResolveFired = useRef(false);

  const [bidAmount, setBidAmount] = useState<number>(1);
  const [lockedAmount, setLockedAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingPerk, setIsActivatingPerk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.auction) return;
    const cur = state.auction.currentRound;
    const prev = prevRoundRef.current;
    if (prev !== null && cur > prev) setShowReveal(true);
    // Reset per-round submit state when a fresh locked round starts.
    if (prev !== null && cur !== prev) {
      setBidAmount(1);
      setLockedAmount(null);
      setError(null);
      autoResolveFired.current = false;
    }
    prevRoundRef.current = cur;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.auction?.currentRound]);

  const handleActivatePerk = useCallback(async () => {
    if (!guestId || !roomId || isActivatingPerk || state?.me?.perkUsed) return;
    setIsActivatingPerk(true); setError(null);
    try { await mutatePerk({ roomId: roomId as Id<"rooms">, userId: guestId }); }
    catch (e: unknown) { setError((e as { message?: string }).message || "Could not activate perk"); }
    finally { setIsActivatingPerk(false); }
  }, [mutatePerk, guestId, isActivatingPerk, roomId, state?.me?.perkUsed]);

  // ── Blind phase 30s countdown (sealed lockbox deadline) ──
  const [timeLeft, setTimeLeft] = useState(0);
  const deadline = state?.auction?.bidDeadline ?? state?.auction?.currentBidding?.turnExpiresAt;
  useEffect(() => {
    if (!deadline || state?.auction?.status !== "active") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadline, state?.auction?.status]);

  // Auto-resolve when the blind phase expires without both locks.
  useEffect(() => {
    if (!state || !state.auction || state.auction.status !== "active") return;
    if (!deadline) return;
    const isExpired = timeLeft === 0 && Date.now() >= deadline - 500;
    if (isExpired && !autoResolveFired.current && !isSubmitting && guestId) {
      autoResolveFired.current = true;
      resolveSealedRound({
        roomId: roomId as Id<"rooms">,
        userId: guestId,
      }).catch(() => {
        autoResolveFired.current = false;
      });
    }
    if (timeLeft > 0) autoResolveFired.current = false;
  }, [timeLeft, deadline, state, isSubmitting, resolveSealedRound, roomId, guestId]);

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
  const isHost = state?.isHost ?? true;
  const myBudget = me?.budget ?? 0;
  const currentPosition = (auction?.rounds && auction?.currentRound) ? (auction.rounds[auction.currentRound - 1]?.position ?? "-") : "-";
  const totalRounds = auction?.rounds?.length ?? 11;
  const tierColor = TIER_COLORS[mainPlayer?.tier as string] ?? "#95E810";

  // ── Sealed lockbox state ──
  const sealedHost = auction?.sealedBids?.host ?? null;
  const sealedGuest = auction?.sealedBids?.guest ?? null;
  const mySeal = isHost ? sealedHost : sealedGuest;
  const opponentSeal = isHost ? sealedGuest : sealedHost;
  const myLocked = Boolean(mySeal && isActive);
  const opponentLocked = Boolean(opponentSeal && isActive);
  const bothLocked = myLocked && opponentLocked;
  const displayedLockedAmount = myLocked ? lockedAmount : null;

  const playerData: PlayerCardData | null = mainPlayer ? {
    id: mainPlayer._id, name: mainPlayer.name, tier: mainPlayer.tier as PlayerCardData["tier"],
    position: mainPlayer.position, club: mainPlayer.club, nation: mainPlayer.nation,
    imageUrl: mainPlayer.imageUrl, isLegend: mainPlayer.isLegend, kitNumber: mainPlayer.kitNumber,
  } : null;

  const quickChips = useMemo(() => {
    if (myBudget <= 0) return [{ label: "$0M", value: 0 }];

    const quarter = Math.max(1, Math.round(myBudget * 0.25));
    const half = Math.max(1, Math.round(myBudget * 0.5));

    const rawChips = [
      { label: "$1M", value: 1 },
      { label: `$${quarter}M`, value: quarter },
      { label: `$${half}M`, value: half },
      { label: "ALL IN", value: myBudget },
    ];

    return rawChips.filter(
      (c, i, arr) => c.value >= 0 && c.value <= myBudget && arr.findIndex((x) => x.value === c.value) === i
    );
  }, [myBudget]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleLockBid = useCallback(async () => {
    if (!isActive || !guestId || myLocked) return;
    setIsSubmitting(true); setError(null);
    try {
      await submitSealedBid({ roomId: roomId as Id<"rooms">, userId: guestId, amount: bidAmount });
      setLockedAmount(bidAmount);
    } catch (e: unknown) {
      setError((e as { message?: string }).message || "Bid failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, myLocked, bidAmount, submitSealedBid, roomId]);

  const handlePass = useCallback(async () => {
    if (!isActive || !guestId || myLocked) return;
    setIsSubmitting(true); setError(null);
    try {
      await submitSealedBid({ roomId: roomId as Id<"rooms">, userId: guestId, amount: 0 });
      setLockedAmount(0);
    } catch (e: unknown) {
      setError((e as { message?: string }).message || "Could not pass");
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, myLocked, submitSealedBid, roomId]);

  const handleRevealClose = useCallback(() => {
    setShowReveal(false);
    if (pendingRedirectRef.current) {
      pendingRedirectRef.current = false;
      router.push(`/result/${roomId}`);
      return;
    }
    setShowFormation(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => setShowFormation(false), 3800);
    }
  }, [router, roomId]);

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Audio unlock on first touch of the reveal.
  useEffect(() => {
    if (showReveal && !audioRef.current) {
      audioRef.current = true;
      unlockAudio();
    }
  }, [showReveal]);

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
    <div className="mx-auto flex max-w-2xl flex-col gap-3.5 animate-fade-in relative pb-6 px-1 sm:px-0">
      {/* CARD REVEAL OVERLAY */}
      {state.lastCompletedRound && (
        <BidRevealAnimation isOpen={showReveal} onClose={handleRevealClose}
          lastCompletedRound={state.lastCompletedRound as unknown as Parameters<typeof BidRevealAnimation>[0]["lastCompletedRound"]} />
      )}

      {/* WAITING FOR OPPONENT OVERLAY */}
      {auction.status === "pending" && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 p-5 animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-lime/20 blur-xl animate-pulse" />
            <Loader2 className="relative w-12 h-12 text-lime animate-spin" />
          </div>
          <div className="text-center space-y-2 max-w-xs">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Matchday Lockbox</h2>
            <p className="text-xs text-steel font-medium leading-relaxed">Share this room code with your rival manager to enter the auction room.</p>
          </div>
          <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-lime/30 bg-card/90 px-5 py-4 shadow-[0_0_50px_rgba(149,232,16,0.15)] backdrop-blur-xl">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-steel">Room Code</span>
              <p className="font-stats text-3xl text-lime tracking-[0.22em]">{room.code}</p>
            </div>
            <button onClick={copyCode} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-border hover:border-lime/50 text-steel hover:text-lime transition-all active:scale-95 shadow-md">
              {codeCopied ? <Check className="w-5 h-5 text-lime" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={async () => { try { await cancelRoom({ roomId: roomId as Id<"rooms">, hostId: guestId! }); router.push("/"); } catch { } }}
            className="text-xs font-bold text-steel hover:text-rose-400 transition-colors mt-2 uppercase tracking-wider">Cancel Matchday</button>
        </div>
      )}

      {/* ── HIGH-END SCOREBAR HEADER ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-card/95 via-card/90 to-slate-950 p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lime/60 to-transparent" />
        <div className="flex items-center justify-between gap-2">
          {/* Manager budgets */}
          <div className="flex flex-1 items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="flex flex-col items-center justify-center rounded-xl border border-lime/30 bg-lime/5 px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-0 flex-1 shadow-inner">
              <span className="text-[8px] sm:text-[9px] text-steel font-black uppercase tracking-widest leading-none">Manager (You)</span>
              <span className="font-stats text-sm sm:text-lg text-lime leading-tight tracking-wide">${myBudget}M</span>
            </div>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-md">
              <span className="text-[9px] font-black text-steel uppercase tracking-tighter">VS</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/5 px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-0 flex-1 shadow-inner">
              <span className="text-[8px] sm:text-[9px] text-steel font-black uppercase tracking-widest leading-none">Rival</span>
              <span className="font-stats text-sm sm:text-lg text-rose-400 leading-tight tracking-wide">${opponent?.budget ?? 0}M</span>
            </div>
          </div>
          <AuctionTimer timeLeft={timeLeft} maxTime={BLIND_PHASE_SECONDS} isActive={isActive} size={42} showBoost={isActivatingPerk} />
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div className="h-full bg-gradient-to-r from-lime/50 via-lime to-vivid rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(149,232,16,0.6)]"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-steel whitespace-nowrap bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Round {auction.currentRound}/{totalRounds} · <span className="text-lime">{auction.formation}</span>
          </span>
        </div>
      </div>

      {/* ── LIVE TACTICAL FORMATION DISPLAY ──────────────────── */}
      <div className="bg-card/95 border border-white/15 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all">
        <button onClick={() => setShowFormation(!showFormation)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-steel hover:text-white transition-colors bg-gradient-to-r from-white/5 to-transparent">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-lime animate-pulse" />
            Squad Formation · {mySquad.filter(s => s.player).length}/{totalRounds} Signed
          </span>
          {showFormation ? <ChevronUp className="w-4 h-4 text-lime" /> : <ChevronDown className="w-4 h-4 text-steel" />}
        </button>
        {showFormation && (
          <div className="px-2 pb-3 animate-slide-down">
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

      {/* ── HIGH-END PLAYER CARD STAGE ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-card via-slate-950 to-card p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
        {/* Stadium Floodlight Backdrop */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[220px] blur-[100px] rounded-full opacity-25 transition-all duration-700"
          style={{ backgroundColor: tierColor }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40" />

        {/* Top Tier Header Strip */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-lg backdrop-blur-md"
            style={{ color: tierColor, backgroundColor: `${tierColor}15`, borderColor: `${tierColor}50` }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: tierColor }} />
            {currentPosition} · {mainPlayer?.tier} Target
          </div>

          <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${opponentLocked
              ? "bg-lime/10 border-lime/40 text-lime animate-pulse"
              : "bg-slate-900/90 border-white/10 text-steel"
            }`}>
            {opponentLocked ? "🔒 Rival Locked Bid" : "⏳ Rival Thinking..."}
          </span>
        </div>

        {/* Player Card Frame Showcase */}
        <div className="relative z-10 flex justify-center py-2">
          {playerData ? (
            <div className="animate-scale-in origin-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]" key={`${auction.currentRound}-${playerData.id}`}>
              <PlayerCard player={playerData} size="md" />
            </div>
          ) : (
            <div className="w-48 sm:w-52 h-[260px] sm:h-[280px] rounded-2xl bg-slate-900/80 border border-white/10 animate-pulse flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-lime animate-spin" />
              <span className="text-[10px] font-black uppercase text-steel tracking-widest">Hydrating Target...</span>
            </div>
          )}
        </div>

        {/* Perk Intel Banner */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-4 p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md">
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              {me.perk === "SPY" && revealedSubPlayer && (
                <p className="text-white font-medium"><strong className="text-amber-300 font-black uppercase tracking-wider">SPY INTEL:</strong> Secret Backup is <strong className="text-amber-200">{revealedSubPlayer.name}</strong> ({revealedSubPlayer.tier} - {revealedSubPlayer.position})</p>
              )}
              {me.perk === "SCOUT" && revealedNextMainPlayer && (
                <p className="text-white font-medium"><strong className="text-amber-300 font-black uppercase tracking-wider">SCOUT INTEL:</strong> Next Round Target is <strong className="text-amber-200">{revealedNextMainPlayer.name}</strong> ({nextRoundInfo?.position})</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── LUXURY SEALED BID VAULT ──────────────────────────── */}
      {isActive && (
        <div className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 space-y-4 shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
          myLocked
            ? "border-lime/50 bg-gradient-to-b from-lime/10 via-card to-slate-950 shadow-[0_0_50px_rgba(149,232,16,0.15)]"
            : "border-white/15 bg-gradient-to-b from-card/95 via-card to-slate-950 animate-slide-up"
        }`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Status Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
              bothLocked ? "text-amber-300" : myLocked ? "text-lime" : "text-white"
            }`}>
              <div className={`p-1.5 rounded-lg border ${myLocked ? "bg-lime/10 border-lime/40 text-lime" : "bg-slate-900 border-white/10 text-steel"}`}>
                <Lock className={`w-4 h-4 ${myLocked ? "fill-lime" : ""}`} />
              </div>
              {bothLocked
                ? "Both Sealed — Resolving Round!"
                : myLocked
                  ? displayedLockedAmount != null
                    ? `✉️ Secret Envelope Sealed ($${displayedLockedAmount}M)`
                    : "✉️ Secret Envelope Sealed"
                  : "Sealed Bid Vault"}
            </span>

            {me?.perk && !me.perkUsed && (
              <button onClick={handleActivatePerk} disabled={isActivatingPerk || myLocked}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 flex items-center gap-1.5 transition-all active:scale-95 shadow-md disabled:opacity-40">
                {me.perk === "SCOUT" ? <Binoculars className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Use {me.perk}
              </button>
            )}
            {me?.perk && me.perkUsed && (
              <span className="text-[10px] text-steel font-black uppercase bg-slate-900/90 px-3 py-1 rounded-xl border border-white/10">
                {me.perk} Activated
              </span>
            )}
          </div>

          {myLocked ? (
            <div className="py-4 text-center space-y-1.5 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime/30 bg-lime/10 text-lime text-xs font-black uppercase tracking-widest shadow-inner">
                <Check className="w-4 h-4 text-lime" />{" "}
                {lockedAmount != null ? `Locked at $${lockedAmount}M` : "Envelope Locked"}
              </div>
              <p className="text-xs text-steel font-medium">
                {opponentLocked
                  ? "Both sealed envelopes are in — server resolving round instantly..."
                  : "Your secret bid is safe. Waiting for rival manager to lock..."}
              </p>
            </div>
          ) : (
            <>
              {/* Quick Chip Selector */}
              <div className="grid grid-cols-4 gap-2">
                {quickChips.map((chip) => (
                  <button key={chip.value} onClick={() => setBidAmount(chip.value)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-black transition-all active:scale-95 shadow-sm ${
                      bidAmount === chip.value
                        ? "bg-lime text-slate-950 border-lime shadow-[0_0_15px_rgba(149,232,16,0.4)]"
                        : "bg-slate-900/90 border-white/10 text-white hover:border-lime/40 hover:bg-slate-800"
                    }`}>
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Slider Track */}
              <div className="pt-1">
                <BidSlider value={bidAmount} min={0} max={myBudget} onChange={setBidAmount} />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-black text-steel uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-lime" /> Your Bid Amount
                  </span>
                  <span className="font-stats text-2xl text-lime tracking-wide">${bidAmount}M</span>
                </div>
              </div>

              {error && (
                <p className="text-rose-400 text-xs font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30 animate-shake">
                  {error}
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-[1fr_1.8fr] gap-3 pt-1">
                <button onClick={handlePass} disabled={isSubmitting}
                  className="py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-wider rounded-2xl border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 shadow-md">
                  <X className="w-4 h-4" /> Pass ($0M)
                </button>
                <button onClick={handleLockBid} disabled={isSubmitting || bidAmount < 0 || bidAmount > myBudget}
                  className="py-4 bg-gradient-to-r from-lime via-lime to-vivid hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(149,232,16,0.35)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40">
                  <Lock className="w-4 h-4 fill-slate-950" /> Lock Secret Bid · ${bidAmount}M
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}