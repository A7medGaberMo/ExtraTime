'use client';

import React, { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  CurrencyDollar,
  Info,
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
  const { t, lang } = useI18n();
  const { guestId, sessionToken } = useGuestSession(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isPitchOpen, setIsPitchOpen] = useState(true);

  const [showReveal, setShowReveal] = useState(false);
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
        const timer = setTimeout(() => router.replace(`/result/${roomId}`), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state?.auction?.status, state?.room?.status, state?.lastCompletedRound, roomId, router]);

  const submitSealedBid = useMutation(api.auctions.sealed.submitSealedBid);
  const resolveSealedRound = useMutation(api.auctions.sealed.resolveSealedRound);
  const cancelRoom = useMutation(api.rooms.mutations.cancel);
  const mutatePerk = useMutation(api.auctions.mutations.usePerk);
  const autoResolveFired = useRef(false);

  const [bidAmount, setBidAmount] = useState<number>(0);
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
      const budget = state.me?.budget ?? 0;
      setBidAmount(Math.min(1, budget));
      setLockedAmount(null);
      setError(null);
      autoResolveFired.current = false;
    }
    prevRoundRef.current = cur;
  }, [state?.auction, state?.me?.budget]);

  const handleActivatePerk = useCallback(async () => {
    if (!guestId || !roomId || isActivatingPerk || state?.me?.perkUsed) return;
    setIsActivatingPerk(true);
    setError(null);
    try {
      await mutatePerk({ 
        roomId: roomId as Id<'rooms'>, 
        userId: guestId,
        sessionToken: sessionToken ?? undefined
      });
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Could not activate perk');
    } finally {
      setIsActivatingPerk(false);
    }
  }, [mutatePerk, guestId, sessionToken, isActivatingPerk, roomId, state?.me?.perkUsed]);

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
    if (!state || !state.auction || state.auction.status !== 'active' || !deadline) return;
    const isExpired = timeLeft === 0 && Date.now() >= deadline + 300;
    if (isExpired && !autoResolveFired.current && !isSubmitting && guestId) {
      autoResolveFired.current = true;
      resolveSealedRound({
        roomId: roomId as Id<'rooms'>,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
      }).catch(() => {
        autoResolveFired.current = false;
      });
    }
    if (timeLeft > 0) autoResolveFired.current = false;
  }, [timeLeft, deadline, state, isSubmitting, resolveSealedRound, roomId, guestId, sessionToken]);

  /* ── Derived ───────────────────────────────────────────────── */
  const auction = state?.auction;
  const room = state?.room;
  const me = state?.me;
  const opponent = state?.opponent;
  const mainPlayer = state?.mainPlayer;
  const revealedSubPlayer = state?.revealedSubPlayer;
  const revealedNextMainPlayer = state?.revealedNextMainPlayer;
  const nextRoundInfo = state?.nextRoundInfo;
  const rawMySquad = state?.mySquad;
  const mySquad = useMemo(() => rawMySquad ?? [], [rawMySquad]);

  const formationSquad = mySquad.map((slot) => ({
    ...slot,
    player: slot.player
      ? {
          id: slot.player._id,
          name: slot.player.name,
          tier: slot.player.tier as PlayerCardData['tier'],
          position: slot.player.position,
          club: slot.player.club,
          nation: slot.player.nation,
          imageUrl: slot.player.imageUrl,
          isLegend: slot.player.isLegend,
          kitNumber: slot.player.kitNumber,
          rating: slot.player.rating,
        }
      : null,
  }));

  const isActive = auction?.status === 'active';
  const isHost = Boolean(state?.isHost);
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
        rating: mainPlayer.rating,
      }
    : null;

  const quickChips = useMemo(() => {
    if (myBudget <= 0) return [{ label: '$0M', value: 0 }];

    const quarter = Math.max(1, Math.round(myBudget * 0.25));
    const half = Math.max(1, Math.round(myBudget * 0.5));

    const rawChips = [
      { label: '$0M', value: 0 },
      { label: '$1M', value: 1 },
      { label: `$${quarter}M`, value: quarter },
      { label: `$${half}M`, value: half },
      { label: `$${myBudget}M (MAX)`, value: myBudget },
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
      await submitSealedBid({
        roomId: roomId as Id<'rooms'>,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
        amount: bidAmount,
      });
      setLockedAmount(bidAmount);
      sfx.cardDeal();
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Bid failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, sessionToken, myLocked, bidAmount, submitSealedBid, roomId]);


  const handleRevealClose = useCallback(() => {
    setShowReveal(false);
    if (pendingRedirectRef.current) {
      pendingRedirectRef.current = false;
      router.replace(`/result/${roomId}`);
      return;
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

  return (
    <article className="mx-auto flex max-w-xl flex-col gap-2 select-none pb-4 sm:pb-2">
      {/* ── 0. BID REVEAL OVERLAY MODAL ─────────────────────────────── */}
      <BidRevealAnimation
        isOpen={showReveal}
        onClose={handleRevealClose}
        lastCompletedRound={state.lastCompletedRound}
      />

      {/* ── 0. WAITING LOBBY OVERLAY (WHEN WAITING FOR OPPONENT) ────── */}
      {room.status === 'waiting' && !auction.guest && (
        <Panel variant="highlight" className="p-5 text-center space-y-4 animate-scale-in">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl border border-lime/30 bg-lime/10 text-lime">
            <AppIcon icon={Crosshair} size={28} weight="duotone" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white uppercase font-display">
              {t('auction.waitingOverlay.title')}
            </h2>
            <p className="text-steel text-xs font-medium max-w-md mx-auto">
              {t('auction.waitingOverlay.subtitle')}
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/80 p-3">
            <span className="text-steel text-[9px] font-black tracking-widest uppercase">
              {t('joinRoom.roomCode')}
            </span>
            <div className="flex items-center gap-2.5">
              <span className="font-stats text-lime text-2xl font-black tracking-[0.2em]">
                {room.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copy Room Code"
                title="Copy Room Code"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:text-white hover:border-lime/40 transition-colors cursor-pointer"
              >
                <AppIcon icon={codeCopied ? Check : Copy} size={16} weight="bold" className={codeCopied ? 'text-lime' : ''} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-steel">
            <AppIcon icon={CircleNotch} size={15} weight="bold" className="text-lime animate-spin" />
            <span>{t('lobby.waitingOpponent')}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              cancelRoom({
                roomId: room._id,
                hostId: guestId,
                sessionToken: sessionToken ?? undefined,
              })
            }
          >
            {t('auction.waitingOverlay.cancelMatch')}
          </Button>
        </Panel>
      )}

      {/* ── 1. HUD & BUDGET COMPARISON BAR (TOP) ─────────────────────── */}
      <Panel variant="subtle" className="p-2 sm:p-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Dual Budget Comparison */}
          <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-lime/40 bg-lime/10 px-2 py-0.5 shadow-inner">
              <span className="text-steel text-[8px] leading-none font-black tracking-widest uppercase truncate max-w-full">
                {t('auction.you')}
              </span>
              <span className="font-stats text-lime text-sm sm:text-base leading-tight font-black">
                ${myBudget}M
              </span>
            </div>

            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-md">
              <span className="text-steel text-[8px] font-black uppercase font-stats">
                {t('common.vs')}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 shadow-inner">
              <span className="text-steel text-[8px] leading-none font-black tracking-widest uppercase truncate max-w-full">
                {t('auction.rival')}
              </span>
              <span className="font-stats text-rose-400 text-sm sm:text-base leading-tight font-black">
                ${opponent?.budget ?? 0}M
              </span>
            </div>
          </div>

          {/* Turn Timer */}
          <AuctionTimer
            timeLeft={timeLeft}
            maxTime={BLIND_PHASE_SECONDS}
            isActive={isActive}
            size={36}
            showBoost={isActivatingPerk}
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5">
            <div
              className="from-lime/50 via-lime to-vivid h-full rounded-full bg-gradient-to-r shadow-[0_0_8px_rgba(149,232,16,0.6)] transition-all duration-500"
              style={{ width: `${((auction.currentRound - 1) / totalRounds) * 100}%` }}
            />
          </div>
          <span className="text-steel rounded-md border border-white/5 bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase font-stats">
            {t('common.round')} {auction.currentRound}/{totalRounds} · <span className="text-lime">{auction.formation}</span>
          </span>
        </div>
      </Panel>

      {/* ── 2. TOP TARGET PLAYER CARD STAGE ─────────────────────────── */}
      <Panel variant="elevated" className="p-2 sm:p-2.5 text-center relative overflow-hidden">
        {/* Stage Lighting */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[140px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[70px] transition-all duration-700"
          style={{ backgroundColor: tierColor }}
        />

        {/* Target Strip */}
        <div className="relative z-10 mb-1.5 flex items-center justify-between gap-1.5">
          <div
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-sm backdrop-blur-md"
            style={{
              color: tierColor,
              backgroundColor: `${tierColor}15`,
              borderColor: `${tierColor}50`,
            }}
          >
            <AppIcon icon={Shield} size={12} weight="duotone" style={{ color: tierColor }} />
            <span>{currentPosition} · {t('auction.targetPlayer', { tier: mainPlayer?.tier || '' })}</span>
          </div>

          {/* Perk Trigger Button (Apple Frosted Glass Pill) & Rival Pill */}
          <div className="flex items-center gap-1.5">
            {me?.perk && !me.perkUsed && (
              <button
                type="button"
                onClick={handleActivatePerk}
                disabled={isActivatingPerk || myLocked}
                className="btn-haptic inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/10 hover:bg-amber-400/20 active:scale-95 px-2.5 py-0.5 text-[10.5px] font-black text-amber-300 uppercase tracking-wider backdrop-blur-xl shadow-[0_2px_8px_rgba(245,158,11,0.12)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-stats"
                title={
                  me.perk === 'SCOUT'
                    ? (lang === 'ar' ? 'بيرك السكاوت: اكشف نجم الجولة القادمة' : 'Scout Perk: Reveal next round star target')
                    : (lang === 'ar' ? 'بيرك الجاسوس: اكشف البديل السري لهذه الجولة' : 'Spy Perk: Reveal current round secret backup sub')
                }
              >
                <AppIcon icon={me.perk === 'SCOUT' ? Binoculars : Eye} size={13} weight="fill" className="text-amber-300" />
                <span>{t('auction.usePerk', { perk: me.perk })}</span>
              </button>
            )}

            <StatPill
              variant={opponentLocked ? 'lime' : 'muted'}
              size="sm"
              label={opponentLocked ? t('auction.rivalLocked') : t('auction.rivalThinking')}
              className={opponentLocked ? 'animate-pulse' : ''}
            />
          </div>
        </div>

        {/* Player Card Showcase */}
        <div className="relative z-10 flex justify-center py-0.5">
          {playerData ? (
            <div
              className="animate-scale-in origin-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              key={`${auction.currentRound}-${playerData.id}`}
            >
              <PlayerCard player={playerData} size="sm" />
            </div>
          ) : (
            <div className="flex h-[180px] w-32 animate-pulse flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80">
              <AppIcon icon={CircleNotch} size={18} weight="bold" className="text-lime animate-spin" />
              <span className="text-steel text-[8.5px] font-black tracking-widest uppercase">
                {t('auction.hydrating')}
              </span>
            </div>
          )}
        </div>

        {/* Perk Intel Banner */}
        {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
          <div className="relative z-10 mt-1.5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-2 shadow-lg backdrop-blur-md text-start">
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-1 text-amber-300 shrink-0">
              <AppIcon icon={Lightning} size={14} weight="fill" />
            </div>
            <div className="min-w-0 flex-1 text-[10.5px]">
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

      {/* ── 3. MIDDLE SEALED BIDDING VAULT ──────────────────────────── */}
      {isActive && (
        <Panel
          variant={myLocked ? 'highlight' : 'elevated'}
          className="p-2.5 sm:p-3 space-y-2"
        >
          {/* Status Header */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className={`rounded-lg border p-1 ${
                  myLocked ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 bg-slate-900 text-steel'
                }`}
              >
                <AppIcon icon={myLocked ? LockKey : Lock} size={14} weight={myLocked ? 'fill' : 'bold'} />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider ${bothLocked ? 'text-amber-300' : myLocked ? 'text-lime' : 'text-white'}`}>
                {bothLocked
                  ? t('auction.bothSealed')
                  : myLocked
                    ? displayedLockedAmount != null
                      ? t('auction.mySealedAmount', { amount: displayedLockedAmount })
                      : t('auction.mySealed')
                    : t('auction.vaultTitle')}
              </span>
            </div>
          </div>

          {/* Locked or Interactive Bidding Stage */}
          {myLocked ? (
            <div className="animate-fade-in space-y-1 py-1.5 text-center">
              <StatPill
                variant="lime"
                size="md"
                icon={<AppIcon icon={Check} size={15} weight="bold" />}
                label={
                  lockedAmount != null
                    ? t('auction.envelopeLockedBadge', { amount: lockedAmount })
                    : t('auction.mySealed')
                }
              />
              <p className="text-steel text-[11px] font-medium max-w-md mx-auto">
                {opponentLocked
                  ? t('auction.bothEnvelopesIn')
                  : t('auction.envelopeWaitingOther')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Quick Chip Selector */}
              <div className="grid grid-cols-5 gap-1">
                {quickChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setBidAmount(chip.value)}
                    className={`rounded-lg border py-1 px-0.5 text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-stats ${
                      bidAmount === chip.value
                        ? 'border-lime bg-lime text-slate-950 shadow-md shadow-lime/20'
                        : 'border-white/10 bg-slate-900/90 text-white hover:bg-slate-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Slider Track */}
              <div className="space-y-0.5">
                <BidSlider value={bidAmount} min={0} max={myBudget} onChange={setBidAmount} />
                <div className="flex items-center justify-between px-0.5 pt-0.5">
                  <span className="text-steel flex items-center gap-1 text-[11px] font-black tracking-wider uppercase">
                    <AppIcon icon={CurrencyDollar} size={14} weight="bold" className="text-lime" />
                    <span>{t('auction.yourBidAmount')}</span>
                  </span>
                  <span className="font-stats text-lime text-lg font-black">${bidAmount}M</span>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400">
                  {error}
                </p>
              )}

              {/* Single Primary Action Button: Lock Offer */}
              <div>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleLockBid}
                  disabled={isSubmitting || bidAmount < 0 || bidAmount > myBudget}
                  loading={isSubmitting}
                  leftIcon={<AppIcon icon={LockKey} size={16} weight="fill" />}
                >
                  {bidAmount === 0
                    ? t('auction.lockZeroBid')
                    : t('auction.lockBidBtn', { amount: bidAmount })}
                </Button>
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* ── 4. BOTTOM COLLAPSIBLE TACTICAL PITCH (APPLE THEME) ─────────── */}
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all">
        {/* Apple Capsule Collapsible Header */}
        <button
          type="button"
          onClick={() => setIsPitchOpen(!isPitchOpen)}
          className="btn-haptic flex w-full items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors hover:bg-white/[0.03] cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-lime/30 bg-lime/10 text-lime shrink-0">
              <AppIcon icon={Shield} size={15} weight="duotone" />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-black tracking-wider text-white uppercase font-display">
                {auction.formation} Scheme
              </span>
              <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[8.5px] font-black text-lime uppercase font-stats">
                {mySquad.filter((s) => s.player).length}/{totalRounds} Signed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-steel font-stats hidden sm:inline">
              {isPitchOpen ? (lang === 'ar' ? 'إخفاء الملعب' : 'Hide Pitch') : (lang === 'ar' ? 'عرض الملعب' : 'Show Pitch')}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-steel">
              <AppIcon icon={isPitchOpen ? CaretUp : CaretDown} size={13} weight="bold" />
            </div>
          </div>
        </button>

        {/* Collapsible Pitch Body */}
        <AnimatePresence initial={false}>
          {isPitchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-2 sm:p-3">
                <TacticalPitch
                  formation={auction.formation}
                  matchSize={(auction.matchSize as 5 | 11) || 11}
                  squad={formationSquad}
                  rounds={auction.rounds}
                  currentRound={auction.currentRound}
                  totalRounds={totalRounds}
                  title={t('auction.squadFormation')}
                  badgeLabel={`${mySquad.filter((s) => s.player).length}/${totalRounds} Signed`}
                  compact={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
