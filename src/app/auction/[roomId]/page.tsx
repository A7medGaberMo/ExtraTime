'use client';

import React, { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { PlayerCard, formatDisplayName } from '@/components/shared/player-card';
import { ClubCrestBadge, CountryFlagBadge } from '@/components/shared/card-badges';
import { AuctionTimer } from '@/components/shared/auction-timer';
import { BidSlider } from '@/components/shared/bid-slider';
import { BidRevealAnimation } from '@/components/shared/bid-reveal-animation';
import { TacticalPitch } from '@/components/shared/tactical-pitch';
import { PlayerImage } from '@/components/shared/player-image';
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
  SignOut,
  WarningCircle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { ModalShell } from '@/components/ui/modal-shell';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';

const BLIND_PHASE_SECONDS = 30;

export default function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { guestId, sessionToken } = useGuestSession(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [showReveal, setShowReveal] = useState(false);
  const prevRoundRef = useRef<number | null>(null);
  const pendingRedirectRef = useRef(false);
  const completedTriggeredRef = useRef(false);
  const audioRef = useRef(false);

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<'rooms'>, userId: guestId } : 'skip',
  );

  // Detect match abandonment → notify and return to hub
  useEffect(() => {
    if (state?.room?.status === 'abandoned') {
      toast(lang === 'ar' ? 'تم إلغاء الماتش من قبل أحد المدربين' : 'Match was cancelled by manager', 'info');
      router.replace('/');
    }
  }, [state?.room?.status, router, toast, lang]);

  // Detect auction completion → show final round reveal before redirect
  useEffect(() => {
    const isCompleted =
      (state?.auction?.status === 'completed' || state?.room?.status === 'completed') &&
      state?.room?.status !== 'abandoned';
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
  const abandonMatch = useMutation(api.rooms.mutations.abandonUserActiveMatch);
  const mutatePerk = useMutation(api.auctions.mutations.usePerk);
  const autoResolveFired = useRef(false);

  const handleExitOrCancel = useCallback(async () => {
    setShowExitModal(false);
    if (guestId && roomId) {
      try {
        await abandonMatch({
          guestId,
          sessionToken: sessionToken ?? undefined,
          matchType: 'snipe',
          matchId: roomId,
        });
      } catch {
        try {
          await cancelRoom({
            roomId: roomId as Id<'rooms'>,
            hostId: guestId,
            sessionToken: sessionToken ?? undefined,
          });
        } catch {}
      }
    }
    toast(lang === 'ar' ? 'تمت مغادرة الماتش بنجاح' : 'Left match successfully', 'info');
    router.replace('/');
  }, [abandonMatch, cancelRoom, guestId, roomId, sessionToken, lang, toast, router]);

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [lockedAmount, setLockedAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingPerk, setIsActivatingPerk] = useState(false);
  const [activeTab, setActiveTab] = useState<'arena' | 'pitch'>('arena');
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
  const signedCount = mySquad.filter((s) => s.player).length;
  const tierColor = mainPlayer?.tier ? getTierStyle(mainPlayer.tier).highlight : '#CAFF00';

  const mainPlayerCardData: PlayerCardData | null = useMemo(() => {
    if (!mainPlayer) return null;
    return {
      id: mainPlayer._id,
      name: mainPlayer.name,
      tier: mainPlayer.tier as PlayerCardData['tier'],
      position: mainPlayer.position || currentPosition,
      club: mainPlayer.club,
      nation: mainPlayer.nation,
      imageUrl: mainPlayer.imageUrl,
      isLegend: mainPlayer.isLegend,
      kitNumber: mainPlayer.kitNumber,
      rating: mainPlayer.rating,
    };
  }, [mainPlayer, currentPosition]);

  // ── Sealed lockbox state ──
  const sealedHost = auction?.sealedBids?.host ?? null;
  const sealedGuest = auction?.sealedBids?.guest ?? null;
  const mySeal = isHost ? sealedHost : sealedGuest;
  const opponentSeal = isHost ? sealedGuest : sealedHost;
  const myLocked = Boolean(mySeal && isActive);
  const opponentLocked = Boolean(opponentSeal && isActive);
  const bothLocked = myLocked && opponentLocked;
  const displayedLockedAmount = myLocked ? lockedAmount : null;

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
      const res = await submitSealedBid({
        roomId: roomId as Id<'rooms'>,
        userId: guestId,
        sessionToken: sessionToken ?? undefined,
        amount: bidAmount,
      });
      if ((res as any)?.expired) {
        toast(
          lang === 'ar'
            ? 'انتهى وقت الجولة وجارٍ حسم النتيجة...'
            : 'Round timer expired — resolving auction results...',
          'warning',
        );
      } else {
        setLockedAmount(bidAmount);
        sfx.cardDeal();
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message || 'Bid failed';
      if (msg.toLowerCase().includes('expired')) {
        toast(
          lang === 'ar'
            ? 'انتهى وقت الجولة وجارٍ حسم النتيجة...'
            : 'Round timer expired — resolving auction results...',
          'warning',
        );
      } else {
        setError(msg);
        toast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isActive, guestId, sessionToken, myLocked, bidAmount, submitSealedBid, roomId, toast, lang]);

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
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="apple-glass-elevated p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/10 shadow-2xl">
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
      <div className="flex h-[100dvh] items-center justify-center p-4">
        <div className="apple-glass-elevated max-w-sm w-full p-6 text-center space-y-4 rounded-3xl border border-white/15 shadow-2xl">
          <AppIcon icon={Crosshair} size={36} weight="duotone" className="text-steel mx-auto" />
          <h2 className="text-lg font-black text-white uppercase font-display">Match Not Found</h2>
          <Button variant="primary" size="md" fullWidth onClick={() => router.push('/')}>
            {t('results.home')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-4xl flex-col justify-between overflow-hidden select-none p-2 sm:p-3 relative">
      {/* ── 0. BID REVEAL OVERLAY MODAL ─────────────────────────────── */}
      <BidRevealAnimation
        isOpen={showReveal}
        onClose={handleRevealClose}
        lastCompletedRound={state.lastCompletedRound}
      />

      {/* ── 0. WAITING LOBBY OVERLAY (WHEN WAITING FOR OPPONENT) ────── */}
      {room.status === 'waiting' && !auction.guest && (
        <div className="apple-glass-elevated absolute inset-2 sm:inset-4 z-40 p-6 flex flex-col items-center justify-center text-center space-y-5 rounded-3xl border border-lime/30 shadow-[0_16px_50px_rgba(149,232,16,0.15)] backdrop-blur-3xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime shadow-[0_0_20px_rgba(149,232,16,0.25)]">
            <AppIcon icon={Crosshair} size={32} weight="duotone" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display tracking-tight">
              {t('auction.waitingOverlay.title')}
            </h2>
            <p className="text-steel text-xs font-medium max-w-md mx-auto leading-relaxed">
              {t('auction.waitingOverlay.subtitle')}
            </p>
          </div>

          {/* Room Code Card */}
          <div className="apple-glass-card flex flex-col items-center gap-2 rounded-2xl border border-lime/30 bg-lime/5 p-4 max-w-xs w-full">
            <span className="text-lime text-[10px] font-black tracking-widest uppercase font-stats">
              {t('joinRoom.roomCode')}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-stats text-lime text-3xl font-black tracking-[0.25em]">
                {room.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copy Room Code"
                title="Copy Room Code"
                className="btn-haptic flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-steel hover:text-lime hover:border-lime/50 transition-colors cursor-pointer shadow-sm"
              >
                <AppIcon icon={codeCopied ? Check : Copy} size={18} weight="bold" className={codeCopied ? 'text-lime' : ''} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-steel font-medium font-stats">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime" />
            </span>
            <span>{t('lobby.waitingOpponent')}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitOrCancel}
            className="text-steel hover:text-rose-400 text-xs font-stats uppercase tracking-wider"
          >
            {t('auction.waitingOverlay.cancelMatch')}
          </Button>
        </div>
      )}

      {/* ── 1. HIGH-END LUXURY APPLE SPORTS ACTIVITY HUD ─── */}
      <header className="relative z-30 w-full overflow-hidden rounded-2xl border border-white/18 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 p-1.5 sm:p-2 shadow-[0_12px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl shrink-0 flex items-center justify-between gap-2">
        {/* Specular Titanium Top Highlight */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        {/* Dual Budget Badges */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <div className="flex flex-col items-center justify-center rounded-xl border border-lime/40 bg-gradient-to-b from-lime/20 via-lime/10 to-slate-950 px-2.5 py-1 min-w-[70px] sm:min-w-[84px] shadow-[0_2px_12px_rgba(202,255,0,0.15)]">
            <span className="text-lime text-[7.5px] leading-none font-black tracking-widest uppercase font-stats">
              {t('auction.you')}
            </span>
            <span className="font-stats text-lime text-xs sm:text-base font-black leading-tight">
              ${myBudget}M
            </span>
          </div>

          <span className="text-steel/60 text-[8px] font-black uppercase font-stats">VS</span>

          <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/40 bg-gradient-to-b from-rose-500/20 via-rose-500/10 to-slate-950 px-2.5 py-1 min-w-[70px] sm:min-w-[84px] shadow-[0_2px_12px_rgba(244,63,94,0.15)]">
            <span className="text-rose-400 text-[7.5px] leading-none font-black tracking-widest uppercase font-stats">
              {t('auction.rival')}
            </span>
            <span className="font-stats text-rose-400 text-xs sm:text-base font-black leading-tight">
              ${opponent?.budget ?? 0}M
            </span>
          </div>
        </div>

        {/* Dynamic Island: Scheme & Round Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-white/[0.05] border border-white/12 shadow-inner font-stats">
          <div className="flex flex-col items-center leading-none">
            <span className="text-slate-400 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider">
              {auction.formation} Scheme
            </span>
            <span className="text-white text-[11px] sm:text-xs font-black tracking-wider pt-0.5">
              {t('common.round')} {auction.currentRound}/{totalRounds}
            </span>
          </div>
        </div>

        {/* Turn Timer & Exit Controls */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
          <AuctionTimer
            timeLeft={timeLeft}
            maxTime={BLIND_PHASE_SECONDS}
            isActive={isActive}
            size={34}
            showBoost={isActivatingPerk}
          />

          {/* Quick Exit / Forfeit Control */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            title="Leave or Cancel Match"
            aria-label="Leave or Cancel Match"
            className="btn-haptic flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer shadow-sm"
          >
            <AppIcon icon={SignOut} size={16} weight="bold" />
          </button>
        </div>
      </header>

      {/* ── EXIT / CANCEL MATCH CONFIRMATION MODAL ── */}
      <ModalShell
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        maxWidth="sm"
      >
        <div className="text-center space-y-4 py-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
            <AppIcon icon={WarningCircle} size={28} weight="duotone" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black uppercase text-white font-display">
              {lang === 'ar' ? 'مغادرة الماتش؟' : 'Leave Snipe Match?'}
            </h3>
            <p className="text-steel text-xs font-medium leading-relaxed max-w-xs mx-auto">
              {lang === 'ar'
                ? 'هل أنت متأكد من رغبتك في المغادرة؟ سيتم إلغاء الماتش والعودة إلى الساحة الرئيسية.'
                : 'Are you sure you want to leave? Your active auction match will be cancelled.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowExitModal(false)}
              className="rounded-xl border-white/15"
            >
              {lang === 'ar' ? 'البقاء في الماتش' : 'Stay in Match'}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleExitOrCancel}
              className="rounded-xl"
            >
              {lang === 'ar' ? 'مغادرة الآن' : 'Exit to Hub'}
            </Button>
          </div>
        </div>
      </ModalShell>

      {/* ── 2. MAIN ARENA STAGE (ZERO SCROLL VIEWPORT) ─────────────────── */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-1.5 sm:py-2">
        {/* Desktop Split Screen OR Mobile Tab Screen */}
        <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-2 sm:gap-3 items-center justify-center min-h-0">
          
          {/* LEFT: AUCTION & BIDDING CONSOLE */}
          <div className={`w-full flex-col gap-2 max-w-lg mx-auto ${activeTab === 'arena' ? 'flex' : 'hidden lg:flex'}`}>
            {/* Target Player Showcase */}
            <div className="apple-glass-elevated p-2.5 sm:p-3 relative overflow-hidden space-y-2 border border-white/12 rounded-2xl">
              {/* Stage Lighting Ambient Glow */}
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 h-[120px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[60px] transition-all duration-700"
                style={{ backgroundColor: tierColor }}
              />

              {/* Top Header Row */}
              <div className="relative z-10 flex items-center justify-between gap-1.5">
                <div
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-sm backdrop-blur-md font-stats"
                  style={{
                    color: tierColor,
                    backgroundColor: `${tierColor}15`,
                    borderColor: `${tierColor}50`,
                  }}
                >
                  <AppIcon icon={Shield} size={13} weight="duotone" style={{ color: tierColor }} />
                  <span>{currentPosition} · {t('auction.targetPlayer', { tier: mainPlayer?.tier || '' })}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {me?.perk && !me.perkUsed && (
                    <button
                      type="button"
                      onClick={handleActivatePerk}
                      disabled={isActivatingPerk || myLocked}
                      className="btn-haptic inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-b from-amber-400/25 to-amber-400/10 hover:bg-amber-400/30 active:scale-95 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider backdrop-blur-xl shadow-[0_2px_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-stats"
                    >
                      <AppIcon icon={me.perk === 'SCOUT' ? Binoculars : Eye} size={13} weight="fill" className="text-amber-300" />
                      <span>{t('auction.usePerk', { perk: me.perk })}</span>
                    </button>
                  )}

                  <StatPill
                    variant={opponentLocked ? 'lime' : 'muted'}
                    size="sm"
                    label={opponentLocked ? t('auction.rivalLocked') : t('auction.rivalThinking')}
                    className={opponentLocked ? 'animate-pulse shadow-sm' : ''}
                  />
                </div>
              </div>

              {/* Target Player Authentic Card Showcase */}
              <div className="relative z-10 flex flex-col items-center justify-center py-0.5">
                {mainPlayerCardData ? (
                  <div className="relative flex flex-col items-center">
                    {/* Ambient Stage Backlight Glow */}
                    <div
                      className="pointer-events-none absolute inset-0 -m-3 rounded-full blur-2xl opacity-40 transition-all duration-700"
                      style={{ backgroundColor: tierColor }}
                    />
                    <PlayerCard
                      player={mainPlayerCardData}
                      size="xs"
                      className="hover:scale-105 transition-transform duration-300 shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="flex h-[148px] w-24 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80">
                    <AppIcon icon={CircleNotch} size={24} weight="bold" className="text-lime animate-spin" />
                  </div>
                )}

                {/* Sub / Backup Capsule */}
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-0.5 text-[9.5px] sm:text-[10px] text-slate-300 font-stats shadow-inner">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime/80" />
                  {revealedSubPlayer ? (
                    <span>
                      {t('auction.runnerUpGets')}: <strong className="text-white">{revealedSubPlayer.name}</strong> ({revealedSubPlayer.tier})
                    </span>
                  ) : (
                    <span>{t('auction.hiddenSub')}</span>
                  )}
                </div>
              </div>

              {/* Perk Intel Banner */}
              {me?.perkUsed && me?.perkUsedRound === auction.currentRound && (
                <div className="relative z-10 mt-1 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent p-2 shadow-lg backdrop-blur-md text-start">
                  <div className="rounded-lg border border-amber-400/30 bg-amber-400/15 p-1 text-amber-300 shrink-0">
                    <AppIcon icon={Lightning} size={13} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1 text-[10.5px] font-medium text-white truncate">
                    {me.perk === 'SPY' && revealedSubPlayer && (
                      <span>{t('auction.spyIntel', { name: revealedSubPlayer.name, tier: revealedSubPlayer.tier, pos: revealedSubPlayer.position })}</span>
                    )}
                    {me.perk === 'SCOUT' && revealedNextMainPlayer && (
                      <span>{t('auction.scoutIntel', { name: revealedNextMainPlayer.name, pos: nextRoundInfo?.position || '' })}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Sealed Bidding Vault Console */}
            {isActive && (
              <div
                className={`apple-glass-elevated p-2.5 sm:p-3 space-y-2.5 transition-all border rounded-2xl ${
                  myLocked
                    ? 'border-lime/40 bg-gradient-to-b from-lime/10 to-transparent shadow-[0_8px_30px_rgba(149,232,16,0.12)]'
                    : 'border-white/12'
                }`}
              >
                {/* Status Header */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`rounded-xl border p-1 ${
                        myLocked ? 'border-lime/50 bg-lime/15 text-lime shadow-[0_0_10px_rgba(149,232,16,0.2)]' : 'border-white/15 bg-white/5 text-steel'
                      }`}
                    >
                      <AppIcon icon={myLocked ? LockKey : Lock} size={14} weight={myLocked ? 'fill' : 'bold'} />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider font-stats ${bothLocked ? 'text-amber-300' : myLocked ? 'text-lime' : 'text-white'}`}>
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
                      className="shadow-[0_4px_16px_rgba(149,232,16,0.2)]"
                    />
                    <p className="text-steel text-[11px] font-medium max-w-md mx-auto leading-relaxed">
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
                          className={`btn-haptic rounded-xl border py-1 px-0.5 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-stats ${
                            bidAmount === chip.value
                              ? 'border-lime bg-lime text-slate-950 shadow-[0_2px_10px_rgba(149,232,16,0.3)] ring-1 ring-lime/50'
                              : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Slider Track */}
                    <div className="space-y-0.5 px-0.5">
                      <BidSlider value={bidAmount} min={0} max={myBudget} onChange={setBidAmount} />
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-steel flex items-center gap-1 text-[11px] font-black tracking-wider uppercase font-stats">
                          <AppIcon icon={CurrencyDollar} size={14} weight="bold" className="text-lime" />
                          <span>{t('auction.yourBidAmount')}</span>
                        </span>
                        <span className="font-stats text-lime text-lg font-black">${bidAmount}M</span>
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400">
                        {error}
                      </p>
                    )}

                    {/* Lock Offer Button */}
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={handleLockBid}
                      disabled={isSubmitting || bidAmount < 0 || bidAmount > myBudget}
                      loading={isSubmitting}
                      leftIcon={<AppIcon icon={LockKey} size={16} weight="fill" className="text-slate-950" />}
                      className="shadow-[0_8px_20px_rgba(149,232,16,0.25)] min-h-[42px]"
                    >
                      {bidAmount === 0
                        ? t('auction.lockZeroBid')
                        : t('auction.lockBidBtn', { amount: bidAmount })}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT (OR MOBILE TAB): TACTICAL PITCH */}
          <div className={`w-full flex-1 min-h-0 flex-col items-center justify-center ${activeTab === 'pitch' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="apple-glass-elevated p-2 sm:p-3 rounded-2xl border border-white/12 w-full h-full flex flex-col items-center justify-center min-h-0">
              <div className="flex items-center justify-between w-full px-2 mb-1 shrink-0">
                <span className="text-xs font-black text-white uppercase font-display">
                  {t('auction.scheme', { formation: auction.formation })}
                </span>
                <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[9px] font-black text-lime uppercase font-stats">
                  {t('auction.signedCount', { count: signedCount, total: totalRounds })}
                </span>
              </div>
              <TacticalPitch
                formation={auction.formation}
                matchSize={(auction.matchSize as 5 | 11) || 11}
                squad={formationSquad}
                rounds={auction.rounds}
                currentRound={auction.currentRound}
                totalRounds={totalRounds}
                activePosition={currentPosition}
                compact={false}
                fillContainer
                className="w-full flex-1 min-h-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM MOBILE NAVIGATION PILL (ZERO SCROLL ARCHITECTURE) ──── */}
      <footer className="lg:hidden w-full flex items-center justify-center shrink-0 pt-1">
        <div className="apple-segmented-bar flex w-full max-w-sm items-center justify-center rounded-full p-1 shadow-lg border border-white/15">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setActiveTab('arena');
            }}
            className={`btn-haptic flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'arena'
                ? 'apple-segmented-active text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AppIcon icon={Crosshair} size={15} weight="bold" className={activeTab === 'arena' ? 'text-lime' : ''} />
            <span>{t('auction.arenaTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setActiveTab('pitch');
            }}
            className={`btn-haptic flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pitch'
                ? 'apple-segmented-active text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AppIcon icon={Shield} size={15} weight="bold" className={activeTab === 'pitch' ? 'text-lime' : ''} />
            <span>{t('auction.squadTab', { count: signedCount, total: totalRounds })}</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
