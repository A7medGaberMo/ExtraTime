'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Crosshair,
  Trophy,
  Ranking,
  PlusCircle,
  SignIn,
  Globe,
  Flame,
  Star,
  Crown,
  UserCheck,
  Sword,
  Cards,
  Database,
  Play,
  Compass,
  DiceFive,
  Lightning,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { StatPill } from '@/components/ui/stat-pill';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { ActiveMatchBanner } from '@/components/shared/active-match-banner';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';

type HomeAction =
  | { type: 'snipe' }
  | { type: 'rank_solo' }
  | { type: 'rank_public' }
  | { type: 'rank_create_duel' }
  | { type: 'draft_solo' }
  | { type: 'draft_public' };

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const { ensureGuestId } = useGuestSession();

  // Mutations
  const findSnipeMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const createSoloRank = useMutation(api.rank.mutations.createSoloGame);
  const findRankMatch = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const createSoloDraft = useMutation(api.draft.mutations.createSoloDraft);
  const findDraftMatch = useMutation(api.draft.mutations.findOrCreatePublicMatch);

  // Queries
  const snipeQueueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const rankQueueSummary = useQuery(api.rank.queries.getPublicQueueSummary);
  const draftQueueSummary = useQuery(api.draft.queries.getPublicQueueSummary);
  const dbStats = useQuery(api.players.queries.getStats);

  // Snipe state
  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [matchSize, setMatchSize] = useState<5 | 11>(11);

  // Rank state
  const [rankRounds, setRankRounds] = useState<3 | 5>(3);

  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<HomeAction | null>(null);

  const [nickname, setNickname] = useGuestNickname();

  const waitingSnipeCurrent =
    matchSize === 11
      ? (snipeQueueSummary?.queues[poolMode]?.[11] ?? 0)
      : (snipeQueueSummary?.queues[poolMode]?.[5] ?? 0);
  const waitingRankCurrent =
    rankRounds === 3 ? (rankQueueSummary?.waiting3 ?? 0) : (rankQueueSummary?.waiting5 ?? 0);
  const waitingDraftCurrent = draftQueueSummary?.waitingCount ?? 0;

  const playerCount = dbStats === undefined ? '…' : dbStats.totalPlayers.toLocaleString();

  function triggerActionWithName(action: HomeAction) {
    const saved = localStorage.getItem('extratime_guestName');
    if (saved) {
      executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(action: HomeAction) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId(nickname.trim() || randomName());
      const actionSessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      switch (action.type) {
        case 'snipe': {
          const result = await findSnipeMatch({
            userId: guestId,
            sessionToken: actionSessionToken,
            matchSize,
            poolMode,
          });
          router.push(`/auction/${result.roomId}`);
          break;
        }
        case 'rank_solo': {
          const result = await createSoloRank({
            guestId,
            sessionToken: actionSessionToken,
            roundCount: rankRounds,
          });
          router.push(`/rank/${result.gameId}`);
          break;
        }
        case 'rank_public': {
          const result = await findRankMatch({
            guestId,
            sessionToken: actionSessionToken,
            roundCount: rankRounds,
          });
          router.push(`/rank/${result.gameId}`);
          break;
        }
        case 'rank_create_duel': {
          const result = await createRankDuel({
            hostId: guestId,
            sessionToken: actionSessionToken,
            roundCount: rankRounds,
          });
          router.push(`/rank/${result.gameId}`);
          break;
        }
        case 'draft_solo': {
          router.push('/draft?tab=solo');
          break;
        }
        case 'draft_public': {
          const result = await findDraftMatch({
            guestId,
            sessionToken: actionSessionToken,
          });
          router.push(`/draft/${result.gameId}`);
          break;
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Action failed. Please try again.', 'error');
      setLoading(false);
    }
  }

  async function handleModalSubmit() {
    if (!pendingAction || !nickname.trim()) return;
    setShowNameModal(false);
    await executeAction(pendingAction);
  }

  return (
    <article className="animate-fade-in mx-auto flex w-full max-w-4xl select-none flex-col items-center gap-4 sm:gap-7 py-2 sm:py-6 overflow-x-clip">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <header className="relative w-full space-y-3 pt-2 text-center overflow-hidden">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[220px] sm:h-[260px] w-[340px] sm:w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-lime/15 via-cyan-400/12 to-amber-400/15 blur-[90px] sm:blur-[120px]" />

        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/10 px-3 py-1 shadow-[0_0_16px_rgba(202,255,0,0.15)] backdrop-blur-md">
            <AppIcon icon={Trophy} size={14} weight="fill" className="text-lime" />
            <span className="text-micro sm:text-xs font-black uppercase tracking-wider text-lime">
              {t('home.heroBadge')}
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-sm">
            Extra<span className="bg-gradient-to-r from-lime via-emerald-300 to-lime bg-clip-text text-transparent">Time</span>
          </h1>

          <p className="mx-auto max-w-md text-xs sm:text-sm font-medium leading-relaxed text-slate-300">
            {t('common.heroDesc')}
          </p>
        </div>
      </header>

      {/* ── ACTIVE MATCH RECONNECTION BANNER ──────────────────────────── */}
      <ActiveMatchBanner />

      {/* ── 3 SIGNATURE GAME MODES (ONE FULL CARD PER LINE) ─────────── */}
      <section className="flex w-full flex-col gap-4 sm:gap-5">
        {/* ── CARD 1: SNIPE (ELECTRIC LIME) ── */}
        <div className="apple-glass-card group relative flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden rounded-3xl p-5 sm:p-6 md:p-7 border border-lime/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl hover:border-lime/60 transition-all duration-300">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-lime/10 blur-3xl group-hover:scale-125 transition-transform duration-500" />

          {/* Left / Info column */}
          <div className="relative flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-lime/50 bg-lime/15 text-lime shadow-[0_0_20px_rgba(202,255,0,0.25)]">
                  <AppIcon icon={Crosshair} size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
                      {t('home.snipeCard.title')}
                    </h2>
                    <span className="inline-flex items-center rounded-full border border-lime/40 bg-lime/10 px-2.5 py-0.5 text-xs font-black text-lime font-stats shadow-sm">
                      11v11 / 5v5
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-lime">
                    {t('home.snipeCard.subtitle')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-xl">
              {t('home.snipeCard.desc')}
            </p>

            {/* Badges / Status row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs shadow-inner">
                <span className="font-semibold text-white">Sealed Bids Match</span>
                <span className="text-slate-600">·</span>
                {waitingSnipeCurrent > 0 ? (
                  <span className="font-stats font-bold text-lime">
                    {waitingSnipeCurrent} {t('home.snipeCard.inQueue')}
                  </span>
                ) : (
                  <span className="font-medium text-slate-400">{t('home.snipeCard.queueReady')}</span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] px-3 py-1.5 text-xs text-slate-300 font-stats">
                <span className="font-black text-lime uppercase tracking-wider">
                  {lang === 'ar' ? 'الإعداد العام:' : 'Public Match:'}
                </span>
                <span className="truncate text-slate-300">
                  {lang === 'ar'
                    ? 'نجوم حاليين · 11 ضد 11 · ميزانية $100M'
                    : 'Active Stars · 11v11 · $100M Budget'}
                </span>
              </div>
            </div>
          </div>

          {/* Right / Actions column */}
          <div className="relative w-full md:w-72 lg:w-80 shrink-0 space-y-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-s border-white/10 md:ps-6 flex flex-col justify-center">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'snipe' })}
              disabled={loading}
              leftIcon={<AppIcon icon={Sword} size={18} weight="bold" className="text-slate-950" />}
              className="bg-gradient-to-b from-lime to-[#B2E600] text-slate-950 font-black shadow-lg shadow-lime/20 hover:brightness-110 rounded-2xl h-12 text-sm"
              rightIcon={
                waitingSnipeCurrent > 0 ? (
                  <span className="rounded-full bg-slate-950/30 px-2 py-0.5 font-stats text-micro text-slate-950 font-black">
                    {waitingSnipeCurrent}
                  </span>
                ) : undefined
              }
            >
              {lang === 'ar' ? 'العب ماتش عام' : 'Play Public Arena'}
            </Button>

            <div className="flex items-center justify-between px-1">
              <Link
                href="/create-room?mode=snipe"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-lime"
              >
                <AppIcon icon={PlusCircle} size={14} weight="bold" />
                <span>{t('home.snipeCard.createCustom')}</span>
              </Link>
              <Link
                href="/join-room"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-lime"
              >
                <AppIcon icon={SignIn} size={14} weight="bold" />
                <span>{t('home.snipeCard.joinWithCode')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── CARD 2: RANK (IMPERIAL AMBER) ── */}
        <div className="apple-glass-card group relative flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden rounded-3xl p-5 sm:p-6 md:p-7 border border-amber-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl hover:border-amber-400/60 transition-all duration-300">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl group-hover:scale-125 transition-transform duration-500" />

          {/* Left / Info column */}
          <div className="relative flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <AppIcon icon={Ranking} size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
                      {t('home.rankCard.title')}
                    </h2>
                    <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-black text-amber-300 font-stats shadow-sm">
                      45s Rounds · +10 Max PTS
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-amber-400">
                    {t('home.rankCard.subtitle')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-xl">
              {t('home.rankCard.desc')}
            </p>

            {/* Badges / Status row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs shadow-inner">
                <span className="font-semibold text-white">Live Trivia Radar</span>
                <span className="text-slate-600">·</span>
                {waitingRankCurrent > 0 ? (
                  <span className="font-stats font-bold text-amber-300">
                    {waitingRankCurrent} {t('home.snipeCard.inQueue')}
                  </span>
                ) : (
                  <span className="font-medium text-slate-400">{t('home.snipeCard.queueReady')}</span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-1.5 text-xs text-slate-300 font-stats">
                <span className="font-black text-amber-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'نظام الحساب:' : 'Distance Scoring:'}
                </span>
                <span className="text-slate-300">
                  {lang === 'ar' ? 'دقة القياس (+2 إلى -2) · 3 أو 5 جولات' : 'Official Metrics (+2 to -2) · 3 or 5 Rounds'}
                </span>
              </div>
            </div>
          </div>

          {/* Right / Actions column */}
          <div className="relative w-full md:w-72 lg:w-80 shrink-0 space-y-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-s border-white/10 md:ps-6 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="primary"
                onClick={() => triggerActionWithName({ type: 'rank_solo' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Play} size={16} weight="bold" className="text-slate-950" />}
                className="bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black hover:brightness-110 rounded-2xl shadow-md shadow-amber-400/20 h-12 text-xs sm:text-sm whitespace-nowrap"
              >
                {t('home.rankCard.playSolo')}
              </Button>

              <Button
                variant="secondary"
                onClick={() => triggerActionWithName({ type: 'rank_public' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Compass} size={16} weight="bold" className="text-amber-400" />}
                className="apple-glass-card border-amber-400/30 hover:border-amber-400/60 rounded-2xl font-bold h-12 text-xs sm:text-sm whitespace-nowrap"
                rightIcon={
                  waitingRankCurrent > 0 ? (
                    <span className="font-stats text-micro text-amber-300 font-black">{waitingRankCurrent}</span>
                  ) : undefined
                }
              >
                {lang === 'ar' ? 'ماتش 1v1' : '1v1 Match'}
              </Button>
            </div>

            <div className="flex items-center justify-between px-1">
              <Link
                href="/create-room?mode=rank"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-amber-300"
              >
                <AppIcon icon={PlusCircle} size={14} weight="bold" className="text-amber-400" />
                <span>{t('home.rankCard.createDuelLink')}</span>
              </Link>
              <Link
                href="/join-room"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-amber-300"
              >
                <AppIcon icon={SignIn} size={14} weight="bold" />
                <span>{t('home.snipeCard.joinWithCode')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── CARD 3: PRO DRAFT (ELECTRIC CYAN) ── */}
        <div className="apple-glass-card group relative flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden rounded-3xl p-5 sm:p-6 md:p-7 border border-cyan-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl hover:border-cyan-400/60 transition-all duration-300">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl group-hover:scale-125 transition-transform duration-500" />

          {/* Left / Info column */}
          <div className="relative flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-400/15 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                  <AppIcon icon={Lightning} size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
                      {t('home.draftCard.title')}
                    </h2>
                    <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-black text-cyan-300 font-stats shadow-sm">
                      14 Picks · 33 Chem
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-cyan-400">
                    {t('home.draftCard.subtitle')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-xl">
              {t('home.draftCard.desc')}
            </p>

            {/* Badges / Status row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs shadow-inner">
                <span className="font-semibold text-white">Engine 3 · Pro Squad</span>
                <span className="text-slate-600">·</span>
                {waitingDraftCurrent > 0 ? (
                  <span className="font-stats font-bold text-cyan-300">
                    {waitingDraftCurrent} {t('home.snipeCard.inQueue')}
                  </span>
                ) : (
                  <span className="font-medium text-slate-400">{t('home.snipeCard.queueReady')}</span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-1.5 text-xs text-slate-300 font-stats">
                <span className="font-black text-cyan-300 uppercase tracking-wider">
                  {lang === 'ar' ? 'الأطوار:' : 'Game Modes:'}
                </span>
                <span className="text-slate-300">
                  {lang === 'ar' ? 'تحديات فردية + كويست الحظ · ديربي 1v1' : 'Solo Quests + Lucky Dice · 1v1 Duel Showdown'}
                </span>
              </div>
            </div>
          </div>

          {/* Right / Actions column */}
          <div className="relative w-full md:w-72 lg:w-80 shrink-0 space-y-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-s border-white/10 md:ps-6 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="cyan"
                onClick={() => triggerActionWithName({ type: 'draft_solo' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Play} size={16} weight="bold" className="text-slate-950" />}
                className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-black hover:brightness-110 rounded-2xl shadow-md shadow-cyan-400/25 h-12 text-xs sm:text-sm whitespace-nowrap"
              >
                {t('home.draftCard.playSolo')}
              </Button>

              <Button
                variant="secondary"
                onClick={() => triggerActionWithName({ type: 'draft_public' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Compass} size={16} weight="bold" className="text-cyan-400" />}
                className="apple-glass-card border-cyan-400/30 hover:border-cyan-400/60 rounded-2xl font-bold h-12 text-xs sm:text-sm whitespace-nowrap"
                rightIcon={
                  waitingDraftCurrent > 0 ? (
                    <span className="font-stats text-micro text-cyan-300 font-black">{waitingDraftCurrent}</span>
                  ) : undefined
                }
              >
                {lang === 'ar' ? 'ماتش 1v1' : '1v1 Match'}
              </Button>
            </div>

            <div className="flex items-center justify-between px-1">
              <Link
                href="/create-room?mode=draft"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-cyan-300"
              >
                <AppIcon icon={PlusCircle} size={14} weight="bold" className="text-cyan-400" />
                <span>{t('home.draftCard.createRoom')}</span>
              </Link>
              <Link
                href="/draft?tab=solo"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-cyan-300"
              >
                <AppIcon icon={SignIn} size={14} weight="bold" />
                <span>{t('home.draftCard.hubLink')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECONDARY BAR: APP STORE STYLE LUXURY GLASS TILES ─────────── */}
      <section className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/packs"
          className="apple-glass-card group flex cursor-pointer items-center gap-3 rounded-3xl p-4 sm:p-5 border border-white/15 shadow-lg backdrop-blur-2xl transition-all hover:border-lime/50 hover:scale-[1.02]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lime/40 bg-lime/15 text-lime transition-transform group-hover:scale-105 shadow-[0_0_12px_rgba(202,255,0,0.2)]">
            <AppIcon icon={Cards} size={22} weight="fill" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm sm:text-base font-bold text-white">{t('home.packsBanner.title')}</h3>
            <p className="truncate text-xs font-medium text-slate-400">{t('home.packsBanner.subtitle')}</p>
          </div>
        </Link>

        <div className="apple-glass-card flex items-center gap-3 rounded-3xl p-4 sm:p-5 border border-white/15 shadow-lg backdrop-blur-2xl">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-400/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <AppIcon icon={Database} size={22} weight="fill" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm sm:text-base font-bold text-white">
              <span className="font-stats">{playerCount}</span>{' '}
              {lang === 'ar' ? 'لاعب' : 'Players'}
            </h3>
            <p className="truncate text-xs font-medium text-slate-400">{t('home.databaseStat.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* ── MANAGER NAME MODAL ───────────────────────────────────────── */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title={t('home.nameModal.title')}
        subtitle={t('home.nameModal.subtitle')}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <TextInput
            label={t('home.nameModal.label')}
            placeholder={t('home.nameModal.placeholder')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
            maxLength={18}
            rightIcon={
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                aria-label={t('home.nameModal.randomize')}
                title={t('home.nameModal.randomize')}
                className="btn-haptic flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-colors hover:border-lime/50 hover:text-lime"
              >
                <AppIcon icon={DiceFive} size={18} weight="bold" />
              </button>
            }
          />

          <div className="flex items-center justify-end px-1">
            <span className="font-stats text-xs text-slate-400">{nickname.length}/18</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleModalSubmit}
            disabled={loading || !nickname.trim()}
            loading={loading}
            className="bg-gradient-to-b from-lime to-[#B2E600] text-slate-950 font-black shadow-lg shadow-lime/20 rounded-2xl"
          >
            {loading ? t('home.nameModal.finding') : t('common.confirm')}
          </Button>
        </div>
      </ModalShell>
    </article>
  );
}
