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
  Users,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { StatPill } from '@/components/ui/stat-pill';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const createGuest = useMutation(api.guests.mutations.create);
  const findMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const createSoloRank = useMutation(api.rank.mutations.createSoloGame);
  const queueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const dbStats = useQuery(api.players.queries.getStats);

  // Snipe state
  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [matchSize, setMatchSize] = useState<5 | 11>(11);

  // Rank state
  const [rankTab, setRankTab] = useState<'solo' | 'duel'>('solo');

  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extratime_guestName') || randomName();
    }
    return randomName();
  });

  const waiting11 = queueSummary?.queues[poolMode]?.[11] ?? 0;
  const waiting5 = queueSummary?.queues[poolMode]?.[5] ?? 0;
  const waitingCurrent = matchSize === 11 ? waiting11 : waiting5;
  const playerCount = dbStats === undefined ? '...' : dbStats.totalPlayers.toLocaleString();

  function openNameModal() {
    const saved = localStorage.getItem('extratime_guestName');
    setNickname(saved || randomName());
    setShowNameModal(true);
  }

  async function handleLaunchSnipe() {
    if (loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const userId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem('extratime_guestId', userId);
      localStorage.setItem('extratime_guestName', nickname.trim());
      const result = await findMatch({ userId, matchSize, poolMode });
      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not start matchmaking', 'error');
      setLoading(false);
    }
  }

  async function handleLaunchRank() {
    if (loading) return;
    if (rankTab === 'duel') {
      router.push('/rank');
      return;
    }

    setLoading(true);
    try {
      let guestId = localStorage.getItem('extratime_guestId');
      if (!guestId) {
        const name = nickname.trim() || randomName();
        guestId = await createGuest({ nickname: name, avatarSeed: name });
        localStorage.setItem('extratime_guestId', guestId);
        localStorage.setItem('extratime_guestName', name);
      }
      const result = await createSoloRank({ guestId: guestId as Id<'guestUsers'>, roundCount: 3 });
      router.push(`/rank/${result.gameId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not start rank match', 'error');
      setLoading(false);
    }
  }

  const poolOptions: SegmentedOption<PoolMode>[] = [
    {
      value: 'ACTIVE',
      label: t('pools.ACTIVE.label'),
      icon: <AppIcon icon={UserCheck} size={15} weight="duotone" />,
    },
    {
      value: 'GLOBAL',
      label: t('pools.GLOBAL.label'),
      icon: <AppIcon icon={Globe} size={15} weight="duotone" />,
    },
    {
      value: 'EPL',
      label: t('pools.EPL.label'),
      icon: <AppIcon icon={Flame} size={15} weight="duotone" />,
    },
    {
      value: 'TOP_TEAMS',
      label: t('pools.TOP_TEAMS.label'),
      icon: <AppIcon icon={Star} size={15} weight="duotone" />,
    },
    {
      value: 'ICONS',
      label: t('pools.ICONS.label'),
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

  const rankModeOptions: SegmentedOption<'solo' | 'duel'>[] = [
    {
      value: 'solo',
      label: lang === 'ar' ? 'لعب فردي' : 'Solo',
      sublabel: lang === 'ar' ? '3 جولات' : '3 Rounds',
      icon: <AppIcon icon={Play} size={15} weight="duotone" />,
    },
    {
      value: 'duel',
      label: lang === 'ar' ? 'تحدي لايف' : '1v1 Duel',
      sublabel: lang === 'ar' ? 'رأس برأس' : 'Head to Head',
      icon: <AppIcon icon={Users} size={15} weight="duotone" />,
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

            {/* Pool Selector Segmented */}
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
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={openNameModal}
              disabled={loading}
              leftIcon={<AppIcon icon={Sword} size={18} weight="bold" />}
              rightIcon={
                waitingCurrent > 0 ? (
                  <span className="font-stats rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px] text-slate-950 font-black">
                    {waitingCurrent} {t('home.snipeCard.inQueue')}
                  </span>
                ) : undefined
              }
            >
              {lang === 'ar' ? `ابدأ ماتش (${matchSize === 11 ? '11 ضد 11' : 'خماسي'})` : `Play Snipe (${matchSize}v${matchSize})`}
            </Button>

            <div className="flex items-center justify-between px-1 text-xs">
              <Link
                href="/create-room"
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

            {/* Mode Segmented */}
            <div className="space-y-1">
              <span className="text-steel text-[10px] font-black uppercase block">
                {lang === 'ar' ? 'نوع اللعب' : 'Game Mode'}
              </span>
              <SegmentedControl
                options={rankModeOptions}
                value={rankTab}
                onChange={setRankTab}
                size="sm"
              />
            </div>

            {/* Clean Mini Preview Pill */}
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-2.5 flex items-center justify-between text-[11px] text-steel">
              <span className="font-bold text-white">
                {lang === 'ar' ? 'مثال: رتّب الأكثر تتويجاً بدوري الأبطال' : 'e.g. Rank by Champions League titles'}
              </span>
              <span className="text-amber-300 font-stats font-black">+10 pts</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <Button
              variant={rankTab === 'solo' ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              onClick={handleLaunchRank}
              disabled={loading}
              leftIcon={<AppIcon icon={rankTab === 'solo' ? Play : Users} size={18} weight="bold" />}
            >
              {rankTab === 'solo'
                ? (lang === 'ar' ? 'ابدأ رتّب (فردي)' : 'Start Solo Rank')
                : (lang === 'ar' ? 'ادخل ساحة التحدي' : 'Go to 1v1 Hub')}
            </Button>

            <div className="flex items-center justify-between px-1 text-xs">
              <Link
                href="/rank"
                className="text-steel flex items-center gap-1 hover:text-white transition-colors font-bold uppercase"
              >
                <AppIcon icon={PlusCircle} size={14} weight="duotone" className="text-amber-400" />
                <span>{lang === 'ar' ? 'اعمل روم خاص' : 'Create Duel'}</span>
              </Link>
              <Link
                href="/rank"
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
            onClick={handleLaunchSnipe}
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
