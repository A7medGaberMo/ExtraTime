'use client';

import React, { useState } from 'react';


import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
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
  Info,
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

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  // Mutations
  const ensureGuest = useMutation(api.guests.mutations.ensure);
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
  const [pendingAction, setPendingAction] = useState<
    | { type: 'snipe' }
    | { type: 'rank_solo' }
    | { type: 'rank_public' }
    | { type: 'rank_create_duel' }
    | null
  >(null);

  const [nickname, setNickname] = useGuestNickname();

  const waitingSnipe11 = snipeQueueSummary?.queues[poolMode]?.[11] ?? 0;
  const waitingSnipe5 = snipeQueueSummary?.queues[poolMode]?.[5] ?? 0;
  const waitingSnipeCurrent = matchSize === 11 ? waitingSnipe11 : waitingSnipe5;
  const waitingRankCurrent =
    rankRounds === 3 ? (rankQueueSummary?.waiting3 ?? 0) : (rankQueueSummary?.waiting5 ?? 0);

  const playerCount = dbStats === undefined ? '...' : dbStats.totalPlayers.toLocaleString();

  async function ensureGuestId(): Promise<Id<'guestUsers'>> {
    const name = nickname.trim() || randomName();
    const existingId = localStorage.getItem('extratime_guestId') as Id<'guestUsers'> | null;
    const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;
    const res = await ensureGuest({
      existingId: existingId ?? undefined,
      sessionToken,
      nickname: name,
      avatarSeed: name,
    });
    localStorage.setItem('extratime_guestId', res.guestId);
    if (res.sessionToken) {
      localStorage.setItem('extratime_sessionToken', res.sessionToken);
    }
    localStorage.setItem('extratime_guestName', name);
    return res.guestId as Id<'guestUsers'>;
  }


  function triggerActionWithName(
    action:
      | { type: 'snipe' }
      | { type: 'rank_solo' }
      | { type: 'rank_public' }
      | { type: 'rank_create_duel' },
  ) {
    const saved = localStorage.getItem('extratime_guestName');
    if (saved) {
      executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(
    action:
      | { type: 'snipe' }
      | { type: 'rank_solo' }
      | { type: 'rank_public' }
      | { type: 'rank_create_duel' },
  ) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId();
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      if (action.type === 'snipe') {
        const result = await findSnipeMatch({ userId: guestId, sessionToken, matchSize, poolMode });
        router.push(`/auction/${result.roomId}`);
      } else if (action.type === 'rank_solo') {
        const result = await createSoloRank({ guestId, sessionToken, roundCount: rankRounds });
        router.push(`/rank/${result.gameId}`);
      } else if (action.type === 'rank_public') {
        const result = await findRankMatch({ guestId, sessionToken, roundCount: rankRounds });
        router.push(`/rank/${result.gameId}`);
      } else if (action.type === 'rank_create_duel') {
        const result = await createRankDuel({ hostId: guestId, sessionToken, roundCount: rankRounds });
        router.push(`/rank/${result.gameId}`);
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

  const poolDetailsMap: Record<PoolMode, { descEn: string; descAr: string }> = {
    ACTIVE: {
      descEn: 'Current top stars and 2025/2026 season performers across major leagues.',
      descAr: 'ألمع نجوم الجيل الحالي وتشكيلات الموسم 2025/2026 في الدوريات الكبرى.',
    },
    GLOBAL: {
      descEn: 'Complete worldwide verified database spanning all tiers and legendary players.',
      descAr: 'قاعدة بيانات شاملة لجميع اللاعبين الحاليين والأساطير عبر مختلف الفئات.',
    },
    EPL: {
      descEn: 'Premier League stars and English top-flight football icons only.',
      descAr: 'نجوم الدوري الإنجليزي الممتاز وأساطير البريميرليج فقط.',
    },
    TOP_TEAMS: {
      descEn: 'Elite powerhouses: Real Madrid, Man City, Bayern, Barcelona, Liverpool & Arsenal.',
      descAr: 'كبار أندية أوروبا: ريال مدريد، السيتي، البايرن، برشلونة، ليفربول وآرسنال.',
    },
    ICONS: {
      descEn: 'All-time immortals, Ballon d’Or winners, and World Cup legends.',
      descAr: 'أساطير كرة القدم الخالدة، الفائزين بالكرة الذهبية، وأبطال كأس العالم.',
    },
  };

  const poolOptions: SegmentedOption<PoolMode>[] = [
    {
      value: 'ACTIVE',
      label: t('pools.ACTIVE.label'),
      sublabel: t('pools.ACTIVE.sub'),
      icon: <AppIcon icon={UserCheck} size={15} weight="duotone" />,
    },
    {
      value: 'GLOBAL',
      label: t('pools.GLOBAL.label'),
      sublabel: t('pools.GLOBAL.sub'),
      icon: <AppIcon icon={Globe} size={15} weight="duotone" />,
    },
    {
      value: 'EPL',
      label: t('pools.EPL.label'),
      sublabel: t('pools.EPL.sub'),
      icon: <AppIcon icon={Flame} size={15} weight="duotone" />,
    },
    {
      value: 'TOP_TEAMS',
      label: t('pools.TOP_TEAMS.label'),
      sublabel: t('pools.TOP_TEAMS.sub'),
      icon: <AppIcon icon={Star} size={15} weight="duotone" />,
    },
    {
      value: 'ICONS',
      label: t('pools.ICONS.label'),
      sublabel: t('pools.ICONS.sub'),
      icon: <AppIcon icon={Crown} size={15} weight="duotone" />,
    },
  ];

  const matchSizeOptions: SegmentedOption<5 | 11>[] = [
    {
      value: 11,
      label: '11v11',
      sublabel: lang === 'ar' ? 'ملعب كامل' : 'Full Squad',
    },
    {
      value: 5,
      label: '5v5',
      sublabel: lang === 'ar' ? 'خماسي سريع' : 'Fast 5s',
    },
  ];

  const rankRoundOptions: SegmentedOption<3 | 5>[] = [
    {
      value: 3,
      label: lang === 'ar' ? '3 جولات' : '3 Rounds',
      sublabel: '~2 mins',
    },
    {
      value: 5,
      label: lang === 'ar' ? '5 جولات' : '5 Rounds',
      sublabel: '~4 mins',
    },
  ];

  return (
    <article className="animate-fade-in mx-auto flex max-w-4xl flex-col items-center gap-5 sm:gap-7 px-3 py-3 sm:py-6 select-none">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <header className="relative w-full space-y-2 text-center pt-1">
        <div className="from-lime/10 pointer-events-none absolute top-1/2 left-1/2 h-[200px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-sky-500/10 to-amber-500/10 blur-[100px]" />

        <div className="relative space-y-1.5">
          <StatPill
            variant="lime"
            icon={<AppIcon icon={Trophy} size={13} weight="duotone" />}
            label={t('home.heroBadge')}
            size="sm"
          />

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase font-display">
            Extra<span className="text-lime">Time</span>
          </h1>

          <p className="text-steel mx-auto max-w-md text-xs sm:text-sm font-medium leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
        </div>
      </header>

      {/* ── ACTIVE MATCH RECONNECTION BANNER ──────────────────────────── */}
      <ActiveMatchBanner />

      {/* ── 2 FLAGSHIP CARDS: SNIPE & RANK (Minimal Apple Aesthetic) ───── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* ── CARD 1: SNIPE ── */}
        <Panel variant="highlight" className="p-5 sm:p-6 flex flex-col justify-between gap-5 relative overflow-hidden group">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime shadow-md shadow-lime/10">
                  <AppIcon icon={Crosshair} size={24} weight="duotone" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display">
                    {t('home.snipeCard.title')}
                  </h2>
                  <span className="text-lime text-[11px] font-black uppercase">
                    {t('home.snipeCard.subtitle')}
                  </span>
                </div>
              </div>
              <StatPill variant="lime" size="sm">
                {matchSize === 11 ? '11v11' : '5v5'}
              </StatPill>
            </div>

            {/* Explainer */}
            <p className="text-steel text-xs leading-relaxed font-medium">
              {t('home.snipeCard.desc')}
            </p>

            {/* Match Size Segmented */}
            <div className="space-y-1">
              <span className="text-steel text-[10px] font-black uppercase block">
                {t('createRoom.matchSize')}
              </span>
              <SegmentedControl
                options={matchSizeOptions}
                value={matchSize}
                onChange={setMatchSize}
                size="sm"
              />
            </div>

            {/* Pool Selector Segmented with Sublabels */}
            <div className="space-y-1">
              <span className="text-steel text-[10px] font-black uppercase block">
                {t('home.snipeCard.selectPool')}
              </span>
              <SegmentedControl
                options={poolOptions}
                value={poolMode}
                onChange={setPoolMode}
                size="sm"
              />
            </div>

            {/* Inline Selected Pool Explanation Box */}
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white flex items-center gap-1">
                  <AppIcon icon={Info} size={13} weight="duotone" className="text-lime shrink-0" />
                  <span>{poolOptions.find((p) => p.value === poolMode)?.label}</span>
                </span>
                <span className="text-lime font-stats text-[10px] font-black">
                  {waitingSnipeCurrent > 0
                    ? `${waitingSnipeCurrent} ${lang === 'ar' ? 'في الانتظار' : 'in queue'}`
                    : (lang === 'ar' ? 'جاهز للمطابقة' : 'Queue ready')}
                </span>
              </div>
              <p className="text-[10px] text-steel leading-tight">
                {lang === 'ar' ? poolDetailsMap[poolMode].descAr : poolDetailsMap[poolMode].descEn}
              </p>
              <p className="text-[9px] text-steel/60 pt-0.5">
                {lang === 'ar'
                  ? 'المطابقة العامة بتجمعك فقط بمدربين اختاروا نفس التشكيلة ونظام الماتش.'
                  : 'Public matching pairs you strictly with managers on the same pool & format.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'snipe' })}
              disabled={loading}
              leftIcon={<AppIcon icon={Sword} size={18} weight="bold" />}
              rightIcon={
                waitingSnipeCurrent > 0 ? (
                  <span className="font-stats rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px] text-slate-950 font-black">
                    {waitingSnipeCurrent} {t('home.snipeCard.inQueue')}
                  </span>
                ) : undefined
              }
            >
              {lang === 'ar'
                ? `ابدأ ماتش عام (${matchSize === 11 ? '11 ضد 11' : 'خماسي'})`
                : `Play Public Snipe (${matchSize}v${matchSize})`}
            </Button>

            <div className="flex items-center justify-between px-1 text-xs">
              <Link
                href="/create-room?mode=snipe"
                className="text-steel flex items-center gap-1 hover:text-white transition-colors font-bold uppercase"
              >
                <AppIcon icon={PlusCircle} size={14} weight="duotone" className="text-lime" />
                <span>{t('home.snipeCard.createCustom')}</span>
              </Link>
              <Link
                href="/join-room"
                className="text-steel flex items-center gap-1 hover:text-white transition-colors font-bold uppercase"
              >
                <AppIcon icon={SignIn} size={14} weight="duotone" className="text-steel" />
                <span>{t('home.snipeCard.joinWithCode')}</span>
              </Link>
            </div>
          </div>
        </Panel>

        {/* ── CARD 2: RANK (رتّب) ── */}
        <Panel variant="highlight" className="p-5 sm:p-6 flex flex-col justify-between gap-5 relative overflow-hidden group">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-md shadow-amber-400/10">
                  <AppIcon icon={Ranking} size={24} weight="duotone" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display">
                    {t('home.rankCard.title')}
                  </h2>
                  <span className="text-amber-400 text-[11px] font-black uppercase">
                    {t('home.rankCard.subtitle')}
                  </span>
                </div>
              </div>
              <StatPill variant="amber" size="sm">
                45s
              </StatPill>
            </div>

            {/* Explainer */}
            <p className="text-steel text-xs leading-relaxed font-medium">
              {t('home.rankCard.desc')}
            </p>

            {/* Match Length Selector */}
            <div className="space-y-1">
              <span className="text-steel text-[10px] font-black uppercase block">
                {t('rank.matchLength')}
              </span>
              <SegmentedControl
                options={rankRoundOptions}
                value={rankRounds}
                onChange={setRankRounds}
                size="sm"
              />
            </div>

            {/* Clean Mini Preview Pill */}
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-2.5 flex items-center justify-between text-[11px] text-steel">
              <span className="font-bold text-white truncate pe-2">
                {lang === 'ar' ? 'مثال: رتّب الأكثر تتويجاً بدوري الأبطال' : 'e.g. Rank by UCL titles'}
              </span>
              <span className="text-amber-300 font-stats font-black shrink-0">+10 pts max</span>
            </div>
          </div>

          {/* Direct Actions: Solo & Public 1v1 Radar (No redundant redirect!) */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => triggerActionWithName({ type: 'rank_solo' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Play} size={16} weight="bold" />}
              >
                {lang === 'ar' ? 'لعب فردي' : 'Solo Rank'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => triggerActionWithName({ type: 'rank_public' })}
                disabled={loading}
                leftIcon={<AppIcon icon={Compass} size={16} weight="bold" className="text-amber-400" />}
                rightIcon={
                  waitingRankCurrent > 0 ? (
                    <span className="font-stats text-[10px] text-amber-300 font-black">
                      {waitingRankCurrent}
                    </span>
                  ) : undefined
                }
              >
                {lang === 'ar' ? 'منافس لايف' : 'Public 1v1'}
              </Button>
            </div>

            <div className="flex items-center justify-between px-1 text-xs">
              <Link
                href="/rank?tab=duel"
                className="text-steel flex items-center gap-1 hover:text-white transition-colors font-bold uppercase"
              >
                <AppIcon icon={PlusCircle} size={14} weight="duotone" className="text-amber-400" />
                <span>{lang === 'ar' ? 'اعمل روم خاص' : 'Create Duel'}</span>
              </Link>
              <Link
                href="/join-room"
                className="text-steel flex items-center gap-1 hover:text-white transition-colors font-bold uppercase"
              >
                <AppIcon icon={SignIn} size={14} weight="duotone" className="text-steel" />
                <span>{lang === 'ar' ? 'ادخل بالكود' : 'Join with Code'}</span>
              </Link>
            </div>
          </div>
        </Panel>
      </section>

      {/* ── 3. CLEAN SECONDARY BAR (Packs & Database) ────────────────── */}
      <section className="grid grid-cols-2 gap-3 w-full max-w-4xl">
        <Link
          href="/packs"
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 hover:border-lime/40 hover:bg-slate-900 transition-all group cursor-pointer"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime/10 text-lime border border-lime/20 group-hover:scale-105 transition-transform">
            <AppIcon icon={Cards} size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white uppercase font-display truncate">
              {t('home.packsBanner.title')}
            </h3>
            <p className="text-[10px] text-steel truncate">{t('home.packsBanner.subtitle')}</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AppIcon icon={Database} size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white uppercase font-display truncate">
              {playerCount} {lang === 'ar' ? 'لاعب' : 'Players'}
            </h3>
            <p className="text-[10px] text-steel truncate">
              {lang === 'ar' ? 'قاعدة بيانات رسمية' : 'Verified Database'}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. MANAGER NAME ENTRY MODAL ──────────────────────────────── */}
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
            rightAction={
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                aria-label={t('home.nameModal.randomize')}
                title={t('home.nameModal.randomize')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:border-lime/40 hover:text-lime transition-all active:scale-95 cursor-pointer"
              >
                <AppIcon icon={DiceFive} size={20} weight="duotone" />
              </button>
            }
          />

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setNickname(randomName())}
              className="text-steel hover:text-lime underline transition-colors cursor-pointer font-bold uppercase"
            >
              {t('home.nameModal.randomize')}
            </button>
            <span className="text-steel/50 font-stats">{nickname.length}/18</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleModalSubmit}
            disabled={loading || !nickname.trim()}
            loading={loading}
          >
            {loading ? t('home.nameModal.finding') : t('home.nameModal.submit')}
          </Button>
        </div>
      </ModalShell>
    </article>
  );
}
