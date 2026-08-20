'use client';

import { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { PlayerCard } from '@/components/shared/player-card';
import { AuctionTimer } from '@/components/shared/auction-timer';
import { BidSlider } from '@/components/shared/bid-slider';
import { BidRevealAnimation } from '@/components/shared/bid-reveal-animation';
import { TacticalPitch } from '@/components/shared/tactical-pitch';
import type { PlayerCardData } from '@/types/player';
import { useGuestSession } from '@/hooks/use-guest-session';
import { unlockAudio } from '@/lib/sfx';
import { getTierStyle } from '@/lib/tier-styles';
import {
  Loader2,
  X,
  Layers,
  Copy,
  Check,
  Swords,
  Eye,
  Binoculars,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
  Lock,
  Shield,
} from 'lucide-react';

const BLIND_PHASE_SECONDS = 30;

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { guestId } = useGuestSession(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showFormation, setShowFormation] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
  );
  const prevRoundRef = useRef<number | null>(null);
  const pendingRedirectRef = useRef(false);
  const completedTriggeredRef = useRef(false);
  const audioRef = useRef(false);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<'rooms'>, userId: guestId } : 'skip',
  );

  // Detect auction completion → show final round reveal before redirect
  useEffect(() => {
    const isCompleted =
      state?.auction?.status === 'completed' || state?.room?.status === 'completed';
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
    setIsActivatingPerk(true);
    setError(null);
    try {
      await mutatePerk({ roomId: roomId as Id<'rooms'>, userId: guestId });
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Could not activate perk');
    } finally {
      setIsActivatingPerk(false);
    }
  }, [mutatePerk, guestId, isActivatingPerk, roomId, state?.me?.perkUsed]);

  // ── Blind phase 30s countdown (sealed lockbox deadline) ──
  const [timeLeft, setTimeLeft] = useState(0);
  const deadline = state?.auction?.bidDeadline ?? state?.auction?.currentBidding?.turnExpiresAt;
  useEffect(() => {
    if (!deadline || state?.auction?.status !== 'active') return;
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
    if (!state || !state.auction || state.auction.status !== 'active') return;
    if (!deadline) return;
    const isExpired = timeLeft === 0 && Date.now() >= deadline - 500;
    if (isExpired && !autoResolveFired.current && !isSubmitting && guestId) {
      autoResolveFired.current = true;
      resolveSealedRound({
        roomId: roomId as Id<'rooms'>,
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

  const isActive = auction?.status === 'active';
  const isHost = state?.isHost ?? true;
  const myBudget = me?.budget ?? 0;
  const currentPosition =
    auction?.rounds && auction?.currentRound
      ? (auction.rounds[auction.currentRound - 1]?.position ?? '-')
      : '-';
  const totalRounds = auction?.rounds?.length ?? 11;
  const tierColor = mainPlayer?.tier ? getTierStyle(mainPlayer.tier).highlight : '#95E810';

  // ── Sealed lockbox state ──
  const sealedHost = auction?.sealedBids?.host ?? null;
  const sealedGuest = auction?.sealedBids?.guest ?? null;
  const mySeal = isHost ? sealedHost : sealedGuest;
  const opponentSeal = isHost ? sealedGuest : sealedHost;
  const myLocked = Boolean(mySeal && isActive);
  const opponentLocked = Boolean(opponentSeal && isActive);
  const bothLocked = myLocked && opponentLocked;
  const displayedLockedAmount = myLocked ? lockedAmount : null;

  const playerData: PlayerCardData | null = mainPlayer
    ? {
        id: mainPlayer._id,
        name: mainPlayer.name,
        tier: mainPlayer.tier as PlayerCardData['tier'],
        position: mainPlayer.position,
        club: mainPlayer.club,
        nation: mainPlayer.nation,
        imageUrl: mainPlayer.imageUrl,
        isLegend: mainPlayer.isLegend,
        kitNumber: mainPlayer.kitNumber,
      }
    : null;

  const quickChips = useMemo(() => {
    if (myBudget <= 0) return [{ label: '$0M', value: 0 }];

    const quarter = Math.max(1, Math.round(myBudget * 0.25));
    const half = Math.max(1, Math.round(myBudget * 0.5));

    const rawChips = [
      { label: '$1M', value: 1 },
      { label: `$${quarter}M`, value: quarter },
      { label: `$${half}M`, value: half },
      { label: 'ALL IN', value: myBudget },
    ];

    return rawChips.filter(
      (c, i, arr) =>
        c.value >= 0 && c.value <= myBudget && arr.findIndex((x) => x.value === c.value) === i,
    );
  }, [myBudget]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleLockBid = useCallback(async () => {
    if (!isActive || !guestId || myLocked) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitSealedBid({ roomId: roomId as Id<'rooms'>, userId: guestId, amount: bidAmount });
      setLockedAmount(bidAmount);
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Bid failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, myLocked, bidAmount, submitSealedBid, roomId]);

  const handlePass = useCallback(async () => {
    if (!isActive || !guestId || myLocked) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitSealedBid({ roomId: roomId as Id<'rooms'>, userId: guestId, amount: 0 });
      setLockedAmount(0);
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Could not pass');
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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => setShowFormation(false), 3800);
    }
  }, [router, roomId]);

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-fade-in flex flex-col items-center gap-3">
          <Loader2 className="text-lime h-8 w-8 animate-spin" />
          <p className="text-steel text-xs font-bold tracking-widest uppercase">
            Loading Auction...
          </p>
        </div>
      </div>
    );
  }
  if (state === null || !auction || !room) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] items-center justify-center">
        <div className="max-w-xs space-y-4 text-center">
          <Swords className="text-steel mx-auto h-8 w-8" />
          <h2 className="text-base font-bold text-white">Auction Not Found</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-lime text-background rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const formationSquad = mySquad.map((slot) => ({
    position: slot.position,
    roundNumber: slot.roundNumber,
    player: slot.player
      ? { name: slot.player.name, tier: slot.player.tier, imageUrl: slot.player.imageUrl }
      : null,
    cost: slot.cost,
    isSub: slot.isSub,
  }));

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in relative mx-auto flex max-w-2xl flex-col gap-3.5 px-1 pb-6 sm:px-0">
      {/* CARD REVEAL OVERLAY */}
      {state.lastCompletedRound && (
        <BidRevealAnimation
          isOpen={showReveal}
          onClose={handleRevealClose}
          lastCompletedRound={state.lastCompletedRound}
        />
      )}

      {/* WAITING FOR OPPONENT OVERLAY */}
      {auction.status === 'pending' && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-5 backdrop-blur-2xl">
          <div className="bg-lime/10 pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]" />
          <div className="relative">
            <div className="bg-lime/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
            <Loader2 className="text-lime relative h-12 w-12 animate-spin" />
          </div>
          <div className="max-w-xs space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
              Matchday Lockbox
            </h2>
            <p className="text-steel text-xs leading-relaxed font-medium">
              Share this room code with your rival manager to enter the auction room.
            </p>
          </div>
          <div className="border-lime/30 bg-card/90 flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border px-5 py-4 shadow-[0_0_50px_rgba(149,232,16,0.15)] backdrop-blur-xl">
            <div className="space-y-0.5">
              <span className="text-steel text-[9px] font-black tracking-widest uppercase">
                Room Code
              </span>
              <p className="font-stats text-lime text-3xl tracking-[0.22em]">{room.code}</p>
            </div>
            <button
              onClick={copyCode}
              className="border-border hover:border-lime/50 text-steel hover:text-lime flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-slate-900 shadow-md transition-all active:scale-95"
            >
              {codeCopied ? <Check className="text-lime h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                await cancelRoom({ roomId: roomId as Id<'rooms'>, hostId: guestId! });
                router.push('/');
              } catch {}
            }}
            className="text-steel mt-2 text-xs font-bold tracking-wider uppercase transition-colors hover:text-rose-400"
          >
            Cancel Matchday
          </button>
        </div>
      )}

      {/* ── HIGH-END SCOREBAR HEADER ──────────────────────────── */}
      <div className="from-card/95 via-card/90 relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b to-slate-950 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="via-lime/60 pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent to-transparent" />
        <div className="flex items-center justify-between gap-2">
          {/* Manager budgets */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
            <div className="border-lime/30 bg-lime/5 flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 shadow-inner sm:px-4 sm:py-2">
              <span className="text-steel text-[8px] leading-none font-black tracking-widest uppercase sm:text-[9px]">
                Manager (You)
              </span>
              <span className="font-stats text-lime text-sm leading-tight tracking-wide sm:text-lg">
                ${myBudget}M
              </span>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-md sm:h-8 sm:w-8">
              <span className="text-steel text-[9px] font-black tracking-tighter uppercase">
                VS
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/5 px-2.5 py-1.5 shadow-inner sm:px-4 sm:py-2">
              <span className="text-steel text-[8px] leading-none font-black tracking-widest uppercase sm:text-[9px]">
                Rival
              </span>
              <span className="font-stats text-sm leading-tight tracking-wide text-rose-400 sm:text-lg">
                ${opponent?.budget ?? 0}M
              </span>
            </div>
          </div>
          <AuctionTimer
            timeLeft={timeLeft}
            maxTime={BLIND_PHASE_SECONDS}
            isActive={isActive}
            size={42}
            showBoost={isActivatingPerk}
          />
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5">
            <div
              className="from-lime/50 via-lime to-vivid h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(149,232,16,0.6)] transition-all duration-500"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }}
            />
          </div>
          <span className="text-steel rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[10px] font-black tracking-widest whitespace-nowrap uppercase">
            Round {auction.currentRound}/{totalRounds} ·{' '}
            <span className="text-lime">{auction.formation}</span>
          </span>
        </div>
      </div>

      {/* ── LIVE TACTICAL FORMATION DISPLAY ──────────────────── */}
      <div className="bg-card/95 overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-xl transition-all">
        <button
          onClick={() => setShowFormation(!showFormation)}
          className="text-steel flex w-full items-center justify-between bg-gradient-to-r from-white/5 to-transparent px-4 py-3 text-xs font-black tracking-wider uppercase transition-colors hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Layers className="text-lime h-4 w-4 animate-pulse" />
            Squad Formation · {mySquad.filter((s) => s.player).length}/{totalRounds} Signed
          </span>
          {showFormation ? (
            <ChevronUp className="text-lime h-4 w-4" />
          ) : (
            <ChevronDown className="text-steel h-4 w-4" />
          )}
        </button>
        {showFormation && (
          <div className="animate-slide-down px-2 pb-3">
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
      <div className="from-card to-card relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b via-slate-950 p-4 shadow-2xl backdrop-blur-2xl sm:p-6">
        {/* Stadium Floodlight Backdrop */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[220px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[100px] transition-all duration-700"
          style={{ backgroundColor: tierColor }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40" />

        {/* Top Tier Header Strip */}
        <div className="relative z-10 mb-4 flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-black tracking-wider uppercase shadow-lg backdrop-blur-md"
            style={{
              color: tierColor,
              backgroundColor: `${tierColor}15`,
              borderColor: `${tierColor}50`,
            }}
          >
            <Shield className="h-3.5 w-3.5" style={{ color: tierColor }} />
            {currentPosition} · {mainPlayer?.tier} Target
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-wider uppercase shadow-sm ${
              opponentLocked
                ? 'bg-lime/10 border-lime/40 text-lime animate-pulse'
                : 'text-steel border-white/10 bg-slate-900/90'
            }`}
          >
            {opponentLocked ? '🔒 Rival Locked Bid' : '⏳ Rival Thinking...'}
          </span>
        </div>

        {/* Player Card Frame Showcase */}
        <div className="relative z-10 flex justify-center py-2">
          {playerData ? (
            <div
              className="animate-scale-in origin-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
              key={`${auction.currentRound}-${playerData.id}`}
            >
              <PlayerCard player={playerData} size="md" />
            </div>
          ) : (
            <div className="flex h-[260px] w-48 animate-pulse flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 sm:h-[280px] sm:w-52">
              <Loader2 className="text-lime h-7 w-7 animate-spin" />
              <span className="text-steel text-[10px] font-black tracking-widest uppercase">
                Hydrating Target...
              </span>
            </div>
          )}
        </div>

        {/* Perk Intel Banner */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-3 shadow-xl backdrop-blur-md">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-2 text-amber-300">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              {me.perk === 'SPY' && revealedSubPlayer && (
                <p className="font-medium text-white">
                  <strong className="font-black tracking-wider text-amber-300 uppercase">
                    SPY INTEL:
                  </strong>{' '}
                  Secret Backup is{' '}
                  <strong className="text-amber-200">{revealedSubPlayer.name}</strong> (
                  {revealedSubPlayer.tier} - {revealedSubPlayer.position})
                </p>
              )}
              {me.perk === 'SCOUT' && revealedNextMainPlayer && (
                <p className="font-medium text-white">
                  <strong className="font-black tracking-wider text-amber-300 uppercase">
                    SCOUT INTEL:
                  </strong>{' '}
                  Next Round Target is{' '}
                  <strong className="text-amber-200">{revealedNextMainPlayer.name}</strong> (
                  {nextRoundInfo?.position})
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── LUXURY SEALED BID VAULT ──────────────────────────── */}
      {isActive && (
        <div
          className={`relative space-y-4 overflow-hidden rounded-3xl border p-4 shadow-2xl backdrop-blur-2xl transition-all duration-500 sm:p-5 ${
            myLocked
              ? 'border-lime/50 from-lime/10 via-card bg-gradient-to-b to-slate-950 shadow-[0_0_50px_rgba(149,232,16,0.15)]'
              : 'from-card/95 via-card animate-slide-up border-white/15 bg-gradient-to-b to-slate-950'
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Status Bar */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`flex items-center gap-2 text-xs font-black tracking-wider uppercase ${
                bothLocked ? 'text-amber-300' : myLocked ? 'text-lime' : 'text-white'
              }`}
            >
              <div
                className={`rounded-lg border p-1.5 ${myLocked ? 'bg-lime/10 border-lime/40 text-lime' : 'text-steel border-white/10 bg-slate-900'}`}
              >
                <Lock className={`h-4 w-4 ${myLocked ? 'fill-lime' : ''}`} />
              </div>
              {bothLocked
                ? 'Both Sealed — Resolving Round!'
                : myLocked
                  ? displayedLockedAmount != null
                    ? `✉️ Secret Envelope Sealed ($${displayedLockedAmount}M)`
                    : '✉️ Secret Envelope Sealed'
                  : 'Sealed Bid Vault'}
            </span>

            {me?.perk && !me.perkUsed && (
              <button
                onClick={handleActivatePerk}
                disabled={isActivatingPerk || myLocked}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-3.5 py-1.5 text-xs font-black tracking-wider text-slate-950 uppercase shadow-md transition-all hover:from-amber-300 hover:to-amber-200 active:scale-95 disabled:opacity-40"
              >
                {me.perk === 'SCOUT' ? (
                  <Binoculars className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Use {me.perk}
              </button>
            )}
            {me?.perk && me.perkUsed && (
              <span className="text-steel rounded-xl border border-white/10 bg-slate-900/90 px-3 py-1 text-[10px] font-black uppercase">
                {me.perk} Activated
              </span>
            )}
          </div>

          {myLocked ? (
            <div className="animate-fade-in space-y-1.5 py-4 text-center">
              <div className="border-lime/30 bg-lime/10 text-lime inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-inner">
                <Check className="text-lime h-4 w-4" />{' '}
                {lockedAmount != null ? `Locked at $${lockedAmount}M` : 'Envelope Locked'}
              </div>
              <p className="text-steel text-xs font-medium">
                {opponentLocked
                  ? 'Both sealed envelopes are in — server resolving round instantly...'
                  : 'Your secret bid is safe. Waiting for rival manager to lock...'}
              </p>
            </div>
          ) : (
            <>
              {/* Quick Chip Selector */}
              <div className="grid grid-cols-4 gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setBidAmount(chip.value)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-black shadow-sm transition-all active:scale-95 ${
                      bidAmount === chip.value
                        ? 'bg-lime border-lime text-slate-950 shadow-[0_0_15px_rgba(149,232,16,0.4)]'
                        : 'hover:border-lime/40 border-white/10 bg-slate-900/90 text-white hover:bg-slate-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Slider Track */}
              <div className="pt-1">
                <BidSlider value={bidAmount} min={0} max={myBudget} onChange={setBidAmount} />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-steel flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase">
                    <DollarSign className="text-lime h-3.5 w-3.5" /> Your Bid Amount
                  </span>
                  <span className="font-stats text-lime text-2xl tracking-wide">${bidAmount}M</span>
                </div>
              </div>

              {error && (
                <p className="animate-shake rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400">
                  {error}
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-[1fr_1.8fr] gap-3 pt-1">
                <button
                  onClick={handlePass}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-4 text-xs font-black tracking-wider text-rose-400 uppercase shadow-md transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-40"
                >
                  <X className="h-4 w-4" /> Pass ($0M)
                </button>
                <button
                  onClick={handleLockBid}
                  disabled={isSubmitting || bidAmount < 0 || bidAmount > myBudget}
                  className="from-lime via-lime to-vivid flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-4 text-xs font-black tracking-wider text-slate-950 uppercase shadow-[0_0_30px_rgba(149,232,16,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
                >
                  <Lock className="h-4 w-4 fill-slate-950" /> Lock Secret Bid · ${bidAmount}M
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
