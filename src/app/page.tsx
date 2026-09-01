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
  | { type: 'rank_create_duel' };

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

  // Queries
  const snipeQueueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const rankQueueSummary = useQuery(api.rank.queries.getPublicQueueSummary);
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

  const poolOptions: SegmentedOption<PoolMode>[] = [
    { value: 'ACTIVE', label: t('pools.ACTIVE.label'), sublabel: t('pools.ACTIVE.sub'), icon: <AppIcon icon={UserCheck} size={15} weight="duotone" /> },
    { value: 'GLOBAL', label: t('pools.GLOBAL.label'), sublabel: t('pools.GLOBAL.sub'), icon: <AppIcon icon={Globe} size={15} weight="duotone" /> },
    { value: 'EPL', label: t('pools.EPL.label'), sublabel: t('pools.EPL.sub'), icon: <AppIcon icon={Flame} size={15} weight="duotone" /> },
    { value: 'TOP_TEAMS', label: t('pools.TOP_TEAMS.label'), sublabel: t('pools.TOP_TEAMS.sub'), icon: <AppIcon icon={Star} size={15} weight="duotone" /> },
    { value: 'ICONS', label: t('pools.ICONS.label'), sublabel: t('pools.ICONS.sub'), icon: <AppIcon icon={Crown} size={15} weight="duotone" /> },
  ];

  const matchSizeOptions: SegmentedOption<5 | 11>[] = [
    { value: 11, label: '11v11', sublabel: lang === 'ar' ? 'ملعب كامل' : 'Full Squad' },
    { value: 5, label: '5v5', sublabel: lang === 'ar' ? 'خماسي سريع' : 'Fast 5s' },
  ];

  const rankRoundOptions: SegmentedOption<3 | 5>[] = [
    { value: 3, label: lang === 'ar' ? '3 جولات' : '3 Rounds', sublabel: '~2 min' },
    { value: 5, label: lang === 'ar' ? '5 جولات' : '5 Rounds', sublabel: '~4 min' },
  ];

  const selectedPoolLabel = poolOptions.find((p) => p.value === poolMode)?.label;

  return (
    <article className="animate-fade-in mx-auto flex w-full max-w-4xl select-none flex-col items-center gap-4 sm:gap-7 py-2 sm:py-6 overflow-x-clip">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <header className="relative w-full space-y-2 pt-1 text-center overflow-hidden">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[180px] sm:h-[200px] w-[320px] sm:w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-lime/10 via-sky-500/10 to-amber-500/10 blur-[80px] sm:blur-[100px]" />

        <div className="relative space-y-1.5">
          <StatPill
            variant="lime"
            icon={<AppIcon icon={Trophy} size={13} weight="duotone" />}
            label={t('home.heroBadge')}
            size="sm"
          />
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Extra<span className="text-lime">Time</span>
          </h1>
          <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-steel">
            {t('common.heroDesc')}
          </p>
        </div>
      </header>

      {/* ── ACTIVE MATCH RECONNECTION BANNER ──────────────────────────── */}
      <ActiveMatchBanner />
  <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
    {/* ── CARD 1: SNIPE ── */}
    <Panel variant="highlight" className="group relative flex flex-col justify-between gap-5 overflow-hidden p-5 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/40 bg-lime/10 text-lime">
              <AppIcon icon={Crosshair} size={24} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {t('home.snipeCard.title')}
              </h2>
              <span className="text-xs font-semibold text-lime">
                {t('home.snipeCard.subtitle')}
              </span>
            </div>
          </div>
          <StatPill variant="lime" size="sm" className="shrink-0">
            {matchSize === 11 ? '11v11' : '5v5'}
          </StatPill>
        </div>

        <p className="text-xs font-medium leading-relaxed text-steel">
          {t('home.snipeCard.desc')}
        </p>

        <div className="space-y-1.5">
          <span className="block text-micro font-semibold uppercase tracking-wider text-steel">
            {t('createRoom.matchSize')}
          </span>
          <SegmentedControl options={matchSizeOptions} value={matchSize} onChange={setMatchSize} size="sm" />
        </div>

        <div className="space-y-1.5">
          <span className="block text-micro font-semibold uppercase tracking-wider text-steel">
            {t('home.snipeCard.selectPool')}
          </span>
          <SegmentedControl options={poolOptions} value={poolMode} onChange={setPoolMode} size="sm" />
        </div>

        {/* Live queue status — one line, no essay */}
        <p className="flex items-center justify-between rounded-md border border-white/5 bg-slate-950/60 px-3 py-2 text-xs">
          <span className="truncate font-semibold text-white">{selectedPoolLabel}</span>
          {waitingSnipeCurrent > 0 ? (
            <span className="ms-2 shrink-0 font-stats text-lime">
              {waitingSnipeCurrent} {t('home.snipeCard.inQueue')}
            </span>
          ) : (
            <span className="ms-2 shrink-0 font-medium text-steel">{t('home.snipeCard.queueReady')}</span>
          )}
        </p>
      </div>

      <div className="space-y-2.5 border-t border-white/5 pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => triggerActionWithName({ type: 'snipe' })}
          disabled={loading}
          leftIcon={<AppIcon icon={Sword} size={18} weight="bold" />}
          rightIcon={
            waitingSnipeCurrent > 0 ? (
              <span className="rounded-full bg-slate-950/40 px-2 py-0.5 font-stats text-micro text-slate-950">
                {waitingSnipeCurrent}
              </span>
            ) : undefined
          }
        >
          {lang === 'ar'
            ? `ماتش عام (${matchSize === 11 ? '11 ضد 11' : 'خماسي'})`
            : `Play Public (${matchSize}v${matchSize})`}
        </Button>

        <div className="flex items-center justify-between px-1">
          <Link
            href="/create-room?mode=snipe"
            className="flex items-center gap-1.5 text-xs font-semibold text-steel transition-colors hover:text-lime"
          >
            <AppIcon icon={PlusCircle} size={14} weight="duotone" />
            <span>{t('home.snipeCard.createCustom')}</span>
          </Link>
          <Link
            href="/join-room"
            className="flex items-center gap-1.5 text-xs font-semibold text-steel transition-colors hover:text-lime"
          >
            <AppIcon icon={SignIn} size={14} weight="duotone" />
            <span>{t('home.snipeCard.joinWithCode')}</span>
          </Link>
        </div>
      </div>
    </Panel>

    {/* ── CARD 2: RANK ── */}
    <Panel variant="highlight" className="group relative flex flex-col justify-between gap-5 overflow-hidden p-5 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-400">
              <AppIcon icon={Ranking} size={24} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {t('home.rankCard.title')}
              </h2>
              <span className="text-xs font-semibold text-amber-400">
                {t('home.rankCard.subtitle')}
              </span>
            </div>
          </div>
          <StatPill variant="amber" size="sm" className="shrink-0">
            {rankRounds === 3 ? '3R · 45s' : '5R · 45s'}
          </StatPill>
        </div>

        <p className="text-xs font-medium leading-relaxed text-steel">
          {t('home.rankCard.desc')}
        </p>

        <div className="space-y-1.5">
          <span className="block text-micro font-semibold uppercase tracking-wider text-steel">
            {t('rank.matchLength')}
          </span>
          <SegmentedControl options={rankRoundOptions} value={rankRounds} onChange={setRankRounds} size="sm" />
        </div>
      </div>

      <div className="space-y-2.5 border-t border-white/5 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            onClick={() => triggerActionWithName({ type: 'rank_solo' })}
            disabled={loading}
            leftIcon={<AppIcon icon={Play} size={16} weight="bold" />}
          >
            {t('home.rankCard.playSolo')}
          </Button>

          <Button
            variant="secondary"
            onClick={() => triggerActionWithName({ type: 'rank_public' })}
            disabled={loading}
            leftIcon={<AppIcon icon={Compass} size={16} weight="bold" className="text-amber-400" />}
            rightIcon={
              waitingRankCurrent > 0 ? (
                <span className="font-stats text-micro text-amber-300">{waitingRankCurrent}</span>
              ) : undefined
            }
          >
            {t('rank.quickTab')}
          </Button>
        </div>

        <div className="flex items-center justify-between px-1">
          <Link
            href="/rank?tab=duel"
            className="flex items-center gap-1.5 text-xs font-semibold text-steel transition-colors hover:text-amber-300"
          >
            <AppIcon icon={PlusCircle} size={14} weight="duotone" className="text-amber-400" />
            <span>{t('home.rankCard.createDuelLink')}</span>
          </Link>
          <Link
            href="/join-room"
            className="flex items-center gap-1.5 text-xs font-semibold text-steel transition-colors hover:text-lime"
          >
            <AppIcon icon={SignIn} size={14} weight="duotone" />
            <span>{t('home.snipeCard.joinWithCode')}</span>
          </Link>
        </div>
      </div>
    </Panel>
  </section>

  {/* ── SECONDARY BAR ────────────────────────────────────────────── */}
  <section className="grid w-full max-w-4xl grid-cols-2 gap-3">
    <Link
      href="/packs"
      className="btn-haptic group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.12] bg-slate-950/70 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:border-lime/40 hover:bg-slate-900/90"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-lime transition-transform group-hover:scale-105 shadow-inner">
        <AppIcon icon={Cards} size={20} weight="duotone" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-white">{t('home.packsBanner.title')}</h3>
        <p className="truncate text-xs font-medium text-steel">{t('home.packsBanner.subtitle')}</p>
      </div>
    </Link>

    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-slate-950/70 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-inner">
        <AppIcon icon={Database} size={20} weight="duotone" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-white">
          <span className="font-stats">{playerCount}</span>{' '}
          {lang === 'ar' ? 'لاعب' : 'Players'}
        </h3>
        <p className="truncate text-xs font-medium text-steel">{t('home.databaseStat.subtitle')}</p>
      </div>
    </div>
  </section>

  {/* ── MANAGER NAME MODAL ───────────────────────────────────────── */ }
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
            className="btn-haptic flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-steel transition-colors hover:border-lime/40 hover:text-lime"
          >
            <AppIcon icon={DiceFive} size={18} weight="duotone" />
          </button>
        }
      />

      <div className="flex items-center justify-end px-1">
        <span className="font-stats text-xs text-muted">{nickname.length}/18</span>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleModalSubmit}
        disabled={loading || !nickname.trim()}
        loading={loading}
      >
        {loading ? t('home.nameModal.finding') : t('common.confirm')}
      </Button>
    </div>
  </ModalShell>
    </article >
  );
}
