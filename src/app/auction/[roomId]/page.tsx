'use client';

import React, { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { unlockAudio, sfx } from '@/lib/sfx';
import { getTierStyle } from '@/lib/tier-styles';
import {
  CircleNotch,
  X,
  Copy,
  Check,
  Crosshair,
  Eye,
  Binoculars,
  CaretDown,
  CaretUp,
  Lightning,
  Lock,
  LockKey,
  Shield,
  Stack,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';

const BLIND_PHASE_SECONDS = 30;

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t } = useI18n();
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
  }, [state?.auction]);

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
      { label: t('auction.quickChips.allIn'), value: myBudget },
    ];

    return rawChips.filter(
      (c, i, arr) =>
        c.value >= 0 && c.value <= myBudget && arr.findIndex((x) => x.value === c.value) === i,
    );
  }, [myBudget, t]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleLockBid = useCallback(async () => {
    if (!isActive || !guestId || myLocked) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitSealedBid({ roomId: roomId as Id<'rooms'>, userId: guestId, amount: bidAmount });
      setLockedAmount(bidAmount);
      sfx.cardDeal();
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
      sfx.cardDeal();
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
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
          <p className="text-steel text-xs font-black tracking-widest uppercase font-stats">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (state === null || !auction || !room) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] items-center justify-center">
        <Panel variant="highlight" className="max-w-sm p-6 text-center space-y-4">
          <AppIcon icon={Crosshair} size={36} weight="duotone" className="text-steel mx-auto" />
          <h2 className="text-lg font-black text-white uppercase">Match Not Found</h2>
          <Button variant="primary" size="md" fullWidth onClick={() => router.push('/')}>
            {t('results.home')}
          </Button>
        </Panel>
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
    <article className="animate-fade-in relative mx-auto flex max-w-2xl flex-col gap-3 sm:gap-4 px-1 pb-6 sm:px-0 select-none">
      {/* ── CARD REVEAL OVERLAY ─────────────────────────────────────── */}
      {state.lastCompletedRound && (
        <BidRevealAnimation
          isOpen={showReveal}
          onClose={handleRevealClose}
          lastCompletedRound={state.lastCompletedRound}
        />
      )}

      {/* ── WAITING FOR OPPONENT OVERLAY ────────────────────────────── */}
      {auction.status === 'pending' && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-5 backdrop-blur-2xl">
          <div className="bg-lime/10 pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]" />
          <div className="relative">
            <div className="bg-lime/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
            <AppIcon icon={CircleNotch} size={48} weight="bold" className="text-lime relative animate-spin" />
          </div>
          <div className="max-w-xs space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase font-display">
              {t('auction.waitingOverlay.title')}
            </h2>
            <p className="text-steel text-xs leading-relaxed font-medium">
              {t('auction.waitingOverlay.subtitle')}
            </p>
          </div>
          <div className="border border-lime/30 bg-slate-900/90 flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl px-5 py-4 shadow-[0_0_50px_rgba(149,232,16,0.15)] backdrop-blur-xl">
            <div className="space-y-0.5">
              <span className="text-steel text-[9px] font-black tracking-widest uppercase">
                {t('lobby.roomCode')}
              </span>
              <p className="font-stats text-lime text-3xl tracking-[0.24em] font-black">{room.code}</p>
            </div>
            <button
              onClick={copyCode}
              className="border border-white/10 hover:border-lime/50 text-steel hover:text-lime flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <AppIcon icon={codeCopied ? Check : Copy} size={20} weight="bold" className={codeCopied ? 'text-lime' : ''} />
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                await cancelRoom({ roomId: roomId as Id<'rooms'>, hostId: guestId! });
                router.push('/');
              } catch {}
            }}
            className="text-steel mt-2 text-xs font-black tracking-wider uppercase transition-colors hover:text-rose-400 cursor-pointer"
          >
            {t('auction.waitingOverlay.cancelMatch')}
          </button>
        </div>
      )}

      {/* ── 1. HIGH-END SCOREBAR HEADER ─────────────────────────────── */}
      <Panel variant="highlight" className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Manager budgets */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
            <div className="border border-lime/40 bg-lime/10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 sm:px-3 py-1.5 shadow-inner">
              <span className="text-steel text-[8px] sm:text-[9px] leading-none font-black tracking-widest uppercase truncate max-w-full">
                {t('auction.you')}
              </span>
              <span className="font-stats text-lime text-base sm:text-lg leading-tight font-black">
                ${myBudget}M
              </span>
            </div>

            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-md">
              <span className="text-steel text-[9px] font-black uppercase font-stats">
                {t('common.vs')}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10 px-2 sm:px-3 py-1.5 shadow-inner">
              <span className="text-steel text-[8px] sm:text-[9px] leading-none font-black tracking-widest uppercase truncate max-w-full">
                {t('auction.rival')}
              </span>
              <span className="font-stats text-rose-400 text-base sm:text-lg leading-tight font-black">
                ${opponent?.budget ?? 0}M
              </span>
            </div>
          </div>

          {/* Autoritative Turn Timer */}
          <AuctionTimer
            timeLeft={timeLeft}
            maxTime={BLIND_PHASE_SECONDS}
            isActive={isActive}
            size={44}
            showBoost={isActivatingPerk}
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5">
            <div
              className="from-lime/50 via-lime to-vivid h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(149,232,16,0.6)] transition-all duration-500"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }}
            />
          </div>
          <span className="text-steel rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[10px] font-black tracking-widest uppercase font-stats">
            {t('common.round')} {auction.currentRound}/{totalRounds} · <span className="text-lime">{auction.formation}</span>
          </span>
        </div>
      </Panel>

      {/* ── 2. LIVE TACTICAL FORMATION DISPLAY ──────────────────────── */}
      <Panel variant="default" className="transition-all">
        <button
          onClick={() => setShowFormation(!showFormation)}
          className="text-steel flex w-full items-center justify-between bg-gradient-to-r from-white/5 to-transparent px-4 py-3 text-xs font-black tracking-wider uppercase transition-colors hover:text-white cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <AppIcon icon={Stack} size={16} weight="duotone" className="text-lime animate-pulse" />
            <span>{t('auction.squadFormation')} · {t('auction.signedCount', { count: mySquad.filter((s) => s.player).length, total: totalRounds })}</span>
          </span>
          <AppIcon icon={showFormation ? CaretUp : CaretDown} size={16} weight="bold" className="text-steel" />
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
      </Panel>

      {/* ── 3. HIGH-END PLAYER CARD STAGE ───────────────────────────── */}
      <Panel variant="elevated" className="p-4 sm:p-6 text-center">
        {/* Stage Lighting */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[220px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[100px] transition-all duration-700"
          style={{ backgroundColor: tierColor }}
        />

        {/* Target Strip */}
        <div className="relative z-10 mb-4 flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-black tracking-wider uppercase shadow-lg backdrop-blur-md"
            style={{
              color: tierColor,
              backgroundColor: `${tierColor}15`,
              borderColor: `${tierColor}50`,
            }}
          >
            <AppIcon icon={Shield} size={14} weight="duotone" style={{ color: tierColor }} />
            <span>{currentPosition} · {t('auction.targetPlayer', { tier: mainPlayer?.tier || '' })}</span>
          </div>

          <StatPill
            variant={opponentLocked ? 'lime' : 'muted'}
            size="sm"
            label={opponentLocked ? t('auction.rivalLocked') : t('auction.rivalThinking')}
            className={opponentLocked ? 'animate-pulse' : ''}
          />
        </div>

        {/* Player Card Showcase */}
        <div className="relative z-10 flex justify-center py-1">
          {playerData ? (
            <div
              className="animate-scale-in origin-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
              key={`${auction.currentRound}-${playerData.id}`}
            >
              <PlayerCard player={playerData} size="md" />
            </div>
          ) : (
            <div className="flex h-[260px] w-48 animate-pulse flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 sm:h-[280px] sm:w-52">
              <AppIcon icon={CircleNotch} size={28} weight="bold" className="text-lime animate-spin" />
              <span className="text-steel text-[10px] font-black tracking-widest uppercase">
                {t('auction.hydrating')}
              </span>
            </div>
          )}
        </div>

        {/* Perk Intel Banner */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-3 shadow-xl backdrop-blur-md text-start">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-2 text-amber-300">
              <AppIcon icon={Lightning} size={18} weight="fill" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              {me.perk === 'SPY' && revealedSubPlayer && (
                <p className="font-medium text-white">
                  {t('auction.spyIntel', {
                    name: revealedSubPlayer.name,
                    tier: revealedSubPlayer.tier,
                    pos: revealedSubPlayer.position,
                  })}
                </p>
              )}
              {me.perk === 'SCOUT' && revealedNextMainPlayer && (
                <p className="font-medium text-white">
                  {t('auction.scoutIntel', {
                    name: revealedNextMainPlayer.name,
                    pos: nextRoundInfo?.position || '',
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* ── 4. LUXURY SEALED BID VAULT ───────────────────────────────── */}
      {isActive && (
        <Panel
          variant={myLocked ? 'highlight' : 'elevated'}
          className="p-4 sm:p-6 space-y-4"
        >
          {/* Status Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-xl border p-2 ${
                  myLocked ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 bg-slate-900 text-steel'
                }`}
              >
                <AppIcon icon={myLocked ? LockKey : Lock} size={18} weight={myLocked ? 'fill' : 'bold'} />
              </div>
              <span className={`text-xs font-black uppercase tracking-wider ${bothLocked ? 'text-amber-300' : myLocked ? 'text-lime' : 'text-white'}`}>
                {bothLocked
                  ? t('auction.bothSealed')
                  : myLocked
                    ? displayedLockedAmount != null
                      ? t('auction.mySealedAmount', { amount: displayedLockedAmount })
                      : t('auction.mySealed')
                    : t('auction.vaultTitle')}
              </span>
            </div>

            {/* Perk Trigger Button */}
            {me?.perk && !me.perkUsed && (
              <Button
                variant="gold"
                size="sm"
                onClick={handleActivatePerk}
                disabled={isActivatingPerk || myLocked}
                loading={isActivatingPerk}
                leftIcon={<AppIcon icon={me.perk === 'SCOUT' ? Binoculars : Eye} size={16} weight="bold" />}
              >
                {t('auction.usePerk', { perk: me.perk })}
              </Button>
            )}

            {me?.perk && me.perkUsed && (
              <StatPill
                variant="muted"
                size="sm"
                label={t('auction.perkActivated', { perk: me.perk })}
              />
            )}
          </div>

          {/* Locked or Interactive Bidding Stage */}
          {myLocked ? (
            <div className="animate-fade-in space-y-2 py-4 text-center">
              <StatPill
                variant="lime"
                size="md"
                icon={<AppIcon icon={Check} size={16} weight="bold" />}
                label={
                  lockedAmount != null
                    ? t('auction.envelopeLockedBadge', { amount: lockedAmount })
                    : t('auction.mySealed')
                }
              />
              <p className="text-steel text-xs font-medium max-w-md mx-auto">
                {opponentLocked
                  ? t('auction.bothEnvelopesIn')
                  : t('auction.envelopeWaitingOther')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Chip Selector */}
              <div className="grid grid-cols-4 gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setBidAmount(chip.value)}
                    className={`rounded-xl border py-2.5 px-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-stats ${
                      bidAmount === chip.value
                        ? 'border-lime bg-lime text-slate-950 shadow-lg shadow-lime/20'
                        : 'border-white/10 bg-slate-900/90 text-white hover:bg-slate-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Slider Track */}
              <div className="space-y-2 pt-1">
                <BidSlider value={bidAmount} min={0} max={myBudget} onChange={setBidAmount} />
                <div className="flex items-center justify-between px-1">
                  <span className="text-steel flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
                    <AppIcon icon={CurrencyDollar} size={16} weight="bold" className="text-lime" />
                    <span>{t('auction.yourBidAmount')}</span>
                  </span>
                  <span className="font-stats text-lime text-2xl font-black">${bidAmount}M</span>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400">
                  {error}
                </p>
              )}

              {/* Action Buttons: Pass & Lock Secret Bid */}
              <div className="grid grid-cols-[1fr_1.8fr] gap-3 pt-1">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handlePass}
                  disabled={isSubmitting}
                  leftIcon={<AppIcon icon={X} size={18} weight="bold" />}
                >
                  {t('auction.passBtn')}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleLockBid}
                  disabled={isSubmitting || bidAmount < 0 || bidAmount > myBudget}
                  loading={isSubmitting}
                  leftIcon={<AppIcon icon={LockKey} size={18} weight="fill" />}
                >
                  {t('auction.lockBidBtn', { amount: bidAmount })}
                </Button>
              </div>
            </div>
          )}
        </Panel>
      )}
    </article>
  );
}
