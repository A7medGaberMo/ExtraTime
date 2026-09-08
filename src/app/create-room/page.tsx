'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  Globe,
  Lock,
  Lightning,
  Users,
  Crosshair,
  UserCheck,
  Flame,
  Star,
  Crown,
  DiceFive,
  Ranking,
  Play,
  Compass,
  Sword,
  CircleNotch,
  PlusCircle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { TextInput } from '@/components/ui/text-input';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { UserIdentity } from '@/components/ui/user-identity';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';

type GameMode = 'snipe' | 'rank' | 'draft';
type MatchSize = 5 | 11;
type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';
type RankModeType = 'duel' | 'quick' | 'solo';
type DraftModeType = 'duel' | 'quick' | 'solo';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const modeParam = searchParams.get('mode');
  const initialMode: GameMode =
    modeParam === 'rank' ? 'rank' : modeParam === 'draft' ? 'draft' : 'snipe';
  const [selectedGame, setSelectedGame] = useState<GameMode>(initialMode);

  // Mutations
  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const createRankSolo = useMutation(api.rank.mutations.createSoloGame);
  const findRankPublic = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const createDraftDuel = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const createDraftSolo = useMutation(api.draft.mutations.createSoloDraft);
  const findDraftPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);

  // Queries
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);
  const draftQueueStats = useQuery(api.draft.queries.getPublicQueueSummary);

  const [nickname, setNickname] = useGuestNickname();

  // Snipe options
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [isPublic, setIsPublic] = useState(false);

  // Rank options
  const [rankType, setRankType] = useState<RankModeType>('duel');
  const [roundCount, setRoundCount] = useState<3 | 5>(3);

  // Draft options
  const [draftType, setDraftType] = useState<DraftModeType>('duel');
  const [draftFormation, setDraftFormation] = useState<string>('4-3-3');

  const [loading, setLoading] = useState(false);

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

  async function handleCreateMatch() {
    if (loading || !nickname.trim()) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId();
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      if (selectedGame === 'snipe') {
        const room = await createSnipeRoom({
          hostId: guestId,
          sessionToken,
          matchSize,
          startingBudget,
          isPublic,
          poolMode,
        });
        router.push(`/auction/${room.roomId}`);
      } else if (selectedGame === 'rank') {
        // Rank match
        if (rankType === 'duel') {
          const result = await createRankDuel({ hostId: guestId, sessionToken, roundCount });
          router.push(`/rank/${result.gameId}`);
        } else if (rankType === 'quick') {
          const result = await findRankPublic({ guestId, sessionToken, roundCount });
          router.push(`/rank/${result.gameId}`);
        } else {
          const result = await createRankSolo({ guestId, sessionToken, roundCount });
          router.push(`/rank/${result.gameId}`);
        }
      } else {
        // Draft match
        if (draftType === 'duel') {
          const result = await createDraftDuel({ hostId: guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        } else if (draftType === 'quick') {
          const result = await findDraftPublic({ guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        } else {
          const result = await createDraftSolo({
            guestId,
            sessionToken,
            formation: draftFormation,
          });
          router.push(`/draft/${result.gameId}`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not create room', 'error');
      setLoading(false);
    }
  }

  const gameOptions: SegmentedOption<GameMode>[] = [
    {
      value: 'snipe',
      label: lang === 'ar' ? 'سنايب' : 'Snipe',
      sublabel: lang === 'ar' ? 'مزاد سري' : 'Auction',
      icon: <AppIcon icon={Crosshair} size={16} weight="duotone" />,
    },
    {
      value: 'rank',
      label: lang === 'ar' ? 'رتّب' : 'Rank',
      sublabel: lang === 'ar' ? 'معلومات' : 'Trivia',
      icon: <AppIcon icon={Ranking} size={16} weight="duotone" />,
    },
    {
      value: 'draft',
      label: lang === 'ar' ? 'درافت' : 'Draft',
      sublabel: lang === 'ar' ? 'تشكيلة' : 'Synergy',
      icon: <AppIcon icon={Lightning} size={16} weight="duotone" />,
    },
  ];

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

  const sizeOptions: SegmentedOption<MatchSize>[] = [
    {
      value: 11,
      label: t('createRoom.match11'),
      sublabel: t('createRoom.match11Sub'),
      icon: <AppIcon icon={Users} size={16} weight="duotone" />,
    },
    {
      value: 5,
      label: t('createRoom.match5'),
      sublabel: t('createRoom.match5Sub'),
      icon: <AppIcon icon={Lightning} size={16} weight="duotone" />,
    },
  ];

  const budgetOptions: SegmentedOption<number>[] = [
    { value: 100, label: '$100M', sublabel: t('createRoom.budgetStandard') },
    { value: 150, label: '$150M', sublabel: t('createRoom.budgetStakes') },
    { value: 200, label: '$200M', sublabel: t('createRoom.budgetMega') },
  ];

  const draftFormationOptions: SegmentedOption<string>[] = [
    { value: '4-3-3', label: '4-3-3', sublabel: 'Balanced' },
    { value: '4-4-2', label: '4-4-2', sublabel: 'Classic' },
    { value: '3-5-2', label: '3-5-2', sublabel: 'Midfield' },
    { value: '4-2-3-1', label: '4-2-3-1', sublabel: 'Tactical' },
  ];

  const draftModeOptions: SegmentedOption<DraftModeType>[] = [
    {
      value: 'duel',
      label: lang === 'ar' ? 'روم خاص 1v1' : 'Private Duel',
      sublabel: lang === 'ar' ? 'شارك الكود' : 'Share code',
      icon: <AppIcon icon={Sword} size={16} weight="duotone" />,
    },
    {
      value: 'quick',
      label: lang === 'ar' ? 'رادار سريع' : 'Quick Match',
      sublabel: lang === 'ar' ? 'منافس لايف' : 'Live match',
      icon: <AppIcon icon={Compass} size={16} weight="duotone" />,
    },
    {
      value: 'solo',
      label: lang === 'ar' ? 'فردي' : 'Solo Run',
      sublabel: lang === 'ar' ? 'تمرين' : 'Practice',
      icon: <AppIcon icon={Play} size={16} weight="duotone" />,
    },
  ];

  const rankModeOptions: SegmentedOption<RankModeType>[] = [
    {
      value: 'duel',
      label: lang === 'ar' ? 'روم خاص 1v1' : 'Private Duel',
      sublabel: lang === 'ar' ? 'شارك الكود' : 'Share code',
      icon: <AppIcon icon={Sword} size={16} weight="duotone" />,
    },
    {
      value: 'quick',
      label: lang === 'ar' ? 'رادار سريع' : 'Quick Match',
      sublabel: lang === 'ar' ? 'منافس لايف' : 'Live match',
      icon: <AppIcon icon={Compass} size={16} weight="duotone" />,
    },
    {
      value: 'solo',
      label: lang === 'ar' ? 'فردي' : 'Solo',
      sublabel: lang === 'ar' ? 'تمرين' : 'Solo run',
      icon: <AppIcon icon={Play} size={16} weight="duotone" />,
    },
  ];

  const roundOptions: SegmentedOption<3 | 5>[] = [
    { value: 3, label: t('rank.rounds3') },
    { value: 5, label: t('rank.rounds5') },
  ];

  return (
    <PageShell
      title={lang === 'ar' ? 'اعمل ماتش جديد' : 'Create Match'}
      subtitle={
        selectedGame === 'snipe'
          ? (lang === 'ar' ? 'حدد قواعد مزاد السنايب وابدأ التحدي.' : 'Configure Snipe auction rules and launch.')
          : selectedGame === 'rank'
            ? (lang === 'ar' ? 'اختار نظام تحدي رتّب وابدأ اللعب.' : 'Configure Rank trivia challenge and start.')
            : (lang === 'ar' ? 'اختر تشكيلة وتحدي الدرافت وابدأ البناء.' : 'Configure Pro Draft chemistry squad and launch.')
      }
      badge={
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-xl ${
            selectedGame === 'snipe'
              ? 'border-lime/30 bg-lime/10 text-lime shadow-[0_0_15px_rgba(149,232,16,0.2)]'
              : selectedGame === 'rank'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          }`}
        >
          <AppIcon icon={PlusCircle} size={14} weight="duotone" className="animate-spin-slow" />
          <span className="font-stats tracking-wider uppercase text-[11px] font-bold">
            {lang === 'ar' ? 'غرفة مخصصة' : 'Custom Lobby'}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="2xl"
    >
      <div className="relative">
        {/* Ambient Top Glow Mesh */}
        <div
          className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[220px] w-[90%] max-w-lg rounded-full blur-[90px] opacity-25 transition-colors duration-700 ${
            selectedGame === 'snipe'
              ? 'bg-lime'
              : selectedGame === 'rank'
                ? 'bg-amber-400'
                : 'bg-cyan-400'
          }`}
        />

        <div className="apple-glass-elevated relative z-10 p-5 sm:p-7 space-y-6">
          {/* Game Mode Switch: Snipe vs Rank vs Draft with Apple Pill Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-steel text-[11px] font-black tracking-widest uppercase font-stats">
                {lang === 'ar' ? 'اختار اللعبة' : 'Select Game Mode'}
              </label>
              <span className={`text-[10px] font-bold uppercase tracking-wider font-stats px-2 py-0.5 rounded-full border ${
                selectedGame === 'snipe'
                  ? 'border-lime/40 bg-lime/10 text-lime'
                  : selectedGame === 'rank'
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                    : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
              }`}>
                {selectedGame === 'snipe'
                  ? 'Tactical Auction'
                  : selectedGame === 'rank'
                    ? 'Trivia Hierarchy'
                    : 'Chemistry Squad'}
              </span>
            </div>
            <SegmentedControl
              options={gameOptions}
              value={selectedGame}
              onChange={setSelectedGame}
              size="lg"
            />
          </div>

          {/* Manager Handle Input inside Apple Glass Cell */}
          <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-3">
            <div className="text-[10px] font-black tracking-widest uppercase text-steel px-1 font-stats">
              {lang === 'ar' ? 'هوية المدرب' : 'Manager Identity'}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <UserIdentity nickname={nickname} size="md" showAvatarOnly />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-[9px] font-black text-slate-950 font-stats ring-2 ring-slate-950">
                  ★
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <TextInput
                  label={t('createRoom.managerHandle')}
                  badge={t('createRoom.autoGenerated')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  placeholder="Manager name"
                  aria-label={t('createRoom.managerHandle')}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setNickname(randomName())}
                      aria-label={t('home.nameModal.randomize')}
                      title={t('home.nameModal.randomize')}
                      className="btn-haptic flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-steel hover:border-lime/50 hover:text-lime hover:bg-lime/10 transition-all cursor-pointer shadow-sm"
                    >
                      <AppIcon icon={DiceFive} size={20} weight="duotone" />
                    </button>
                  }
                />
              </div>
            </div>
          </div>

          {/* ── SNIPE CONFIGURATION ── */}
          {selectedGame === 'snipe' && (
            <div className="space-y-5 pt-1 animate-fade-in">
              {/* Match Size */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {t('createRoom.matchSize')}
                </label>
                <SegmentedControl
                  options={sizeOptions}
                  value={matchSize}
                  onChange={setMatchSize}
                  size="md"
                />
              </div>

              {/* Budget */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {t('createRoom.startingBudget')}
                </label>
                <SegmentedControl
                  options={budgetOptions}
                  value={startingBudget}
                  onChange={setStartingBudget}
                  size="sm"
                />
              </div>

              {/* Player Pool */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {t('createRoom.playerPool')}
                </label>
                <SegmentedControl
                  options={poolOptions}
                  value={poolMode}
                  onChange={setPoolMode}
                  size="sm"
                />
              </div>

              {/* Visibility with Apple Cupertino Cards */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2.5">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {t('createRoom.visibility')}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`btn-haptic flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[48px] font-stats ${
                      !isPublic
                        ? 'border-lime/60 bg-gradient-to-b from-lime/20 to-lime/5 text-lime shadow-[0_4px_16px_rgba(149,232,16,0.15)] ring-1 ring-lime/40'
                        : 'text-steel border-white/10 bg-slate-900/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <AppIcon icon={Lock} size={17} weight={!isPublic ? 'fill' : 'duotone'} />
                    <span>{t('createRoom.privateCode')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`btn-haptic flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[48px] font-stats ${
                      isPublic
                        ? 'border-lime/60 bg-gradient-to-b from-lime/20 to-lime/5 text-lime shadow-[0_4px_16px_rgba(149,232,16,0.15)] ring-1 ring-lime/40'
                        : 'text-steel border-white/10 bg-slate-900/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <AppIcon icon={Globe} size={17} weight={isPublic ? 'fill' : 'duotone'} />
                    <span>{t('createRoom.publicArena')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-steel/90 px-1 leading-relaxed">
                  {isPublic
                    ? (lang === 'ar'
                        ? 'ينشئ غرفة عامة تظهر للمدربين الباحثين عن نفس التشكيلة والميزانية.'
                        : 'Creates a public match available to any manager searching this pool & format.')
                    : (lang === 'ar'
                        ? 'ينشئ كود غرفة خاص من 6 أحرف تشاركه مع صديقك فقط.'
                        : 'Generates a private 6-character code to share directly with a friend.')}
                </p>
              </div>
            </div>
          )}

          {/* ── RANK CONFIGURATION ── */}
          {selectedGame === 'rank' && (
            <div className="space-y-5 pt-1 animate-fade-in">
              {/* Rank Mode */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {lang === 'ar' ? 'نظام التحدي' : 'Rank Challenge Mode'}
                </label>
                <SegmentedControl
                  options={rankModeOptions}
                  value={rankType}
                  onChange={setRankType}
                  size="md"
                />
              </div>

              {/* Match Length */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {t('rank.matchLength')}
                </label>
                <SegmentedControl
                  options={roundOptions}
                  value={roundCount}
                  onChange={setRoundCount}
                  size="sm"
                />
              </div>

              {rankType === 'quick' && (
                <div className="apple-glass-card p-3.5 rounded-2xl border border-amber-400/30 bg-amber-400/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                    </span>
                    <span className="text-xs text-white font-semibold">Radar Matchmaking</span>
                  </div>
                  <StatPill
                    variant="amber"
                    size="sm"
                    label={t('rank.inQueueStats', { count: queueStats?.waitingCount ?? 0 })}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── DRAFT CONFIGURATION ── */}
          {selectedGame === 'draft' && (
            <div className="space-y-5 pt-1 animate-fade-in">
              {/* Draft Mode */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {lang === 'ar' ? 'نظام الدرافت' : 'Draft Mode'}
                </label>
                <SegmentedControl
                  options={draftModeOptions}
                  value={draftType}
                  onChange={setDraftType}
                  size="md"
                />
              </div>

              {/* Formation */}
              <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-2">
                <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1 font-stats">
                  {lang === 'ar' ? 'خطة التشكيلة' : 'Formation'}
                </label>
                <SegmentedControl
                  options={draftFormationOptions}
                  value={draftFormation}
                  onChange={setDraftFormation}
                  size="sm"
                />
              </div>

              {draftType === 'quick' && (
                <div className="apple-glass-card p-3.5 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                    </span>
                    <span className="text-xs text-white font-semibold">Live Draft Queue</span>
                  </div>
                  <StatPill
                    variant="sky"
                    size="sm"
                    label={`${draftQueueStats?.waitingCount ?? 0} in queue`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Unified Launch Button with Apple Keynote Gradient and Spring */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCreateMatch}
            disabled={loading || !nickname.trim()}
            loading={loading}
            leftIcon={
              <AppIcon
                icon={
                  selectedGame === 'snipe'
                    ? Crosshair
                    : selectedGame === 'rank'
                      ? Ranking
                      : Lightning
                }
                size={20}
                weight="bold"
                className="text-slate-950"
              />
            }
            className={`shadow-[0_8px_24px_rgba(149,232,16,0.25)] ${
              selectedGame === 'rank'
                ? '!bg-gradient-to-r !from-amber-400 !to-yellow-300 !text-slate-950 !border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.25)]'
                : selectedGame === 'draft'
                  ? '!bg-gradient-to-r !from-cyan-400 !to-sky-400 !text-slate-950 !border-cyan-300 shadow-[0_8px_24px_rgba(0,240,255,0.25)]'
                  : ''
            }`}
          >
            {loading
              ? t('createRoom.launching')
              : selectedGame === 'snipe'
                ? (lang === 'ar' ? 'ابدأ ماتش سنايب' : 'Launch Snipe Match')
                : selectedGame === 'rank'
                  ? (lang === 'ar' ? 'ابدأ تحدي رتّب' : 'Launch Rank Challenge')
                  : (lang === 'ar' ? 'ابدأ ماتش درافت' : 'Launch Draft Session')}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-lime animate-spin" />
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
