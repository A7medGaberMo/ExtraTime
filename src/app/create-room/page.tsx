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
  Shuffle,
  Ranking,
  CircleNotch,
  PlusCircle,
  Vault,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { TextInput } from '@/components/ui/text-input';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { UserIdentity } from '@/components/ui/user-identity';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';

type GameMode = 'snipe' | 'rank' | 'draft' | 'bank';
type MatchSize = 5 | 11;
type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'EGYPT' | 'ICONS';
type RankModeType = 'duel' | 'quick' | 'solo';
type DraftModeType = 'duel' | 'quick';
type BankModeType = 'duel' | 'quick' | 'solo';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const modeParam = searchParams.get('mode');
  const initialMode: GameMode =
    modeParam === 'rank'
      ? 'rank'
      : modeParam === 'draft'
        ? 'draft'
        : modeParam === 'bank'
          ? 'bank'
          : 'snipe';
  const [selectedGame, setSelectedGame] = useState<GameMode>(initialMode);

  // Convex Mutations
  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const createRankSolo = useMutation(api.rank.mutations.createSoloGame);
  const findRankPublic = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const createDraftDuel = useMutation(api.draft.mutations.createDuelPrivateRoom);

  const findDraftPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createBankDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);
  const createBankSolo = useMutation(api.bank.mutations.createSoloGame);
  const findBankPublic = useMutation(api.bank.mutations.findOrCreatePublicMatch);

  // Convex Queries
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);
  const draftQueueStats = useQuery(api.draft.queries.getPublicQueueSummary);
  const bankQueueStats = useQuery(api.bank.queries.getPublicQueueSummary);

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


  // Bank options
  const [bankType, setBankType] = useState<BankModeType>('duel');

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
      } else if (selectedGame === 'draft') {
        if (draftType === 'duel') {
          const result = await createDraftDuel({ hostId: guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        } else {
          const result = await findDraftPublic({ guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        }
      } else {
        if (bankType === 'duel') {
          const result = await createBankDuel({ hostId: guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
        } else if (bankType === 'quick') {
          const result = await findBankPublic({ guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
        } else {
          const result = await createBankSolo({ guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
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
      icon: <AppIcon icon={Crosshair} size={15} weight="fill" className="text-gold" />,
    },
    {
      value: 'rank',
      label: lang === 'ar' ? 'رتّب' : 'Rank',
      sublabel: lang === 'ar' ? 'معلومات' : 'Trivia',
      icon: <AppIcon icon={Ranking} size={15} weight="fill" className="text-gold" />,
    },
    {
      value: 'draft',
      label: lang === 'ar' ? 'درافت' : 'Draft',
      sublabel: lang === 'ar' ? 'تشكيلة' : 'Synergy',
      icon: <AppIcon icon={Lightning} size={15} weight="fill" className="text-gold" />,
    },
    {
      value: 'bank',
      label: lang === 'ar' ? 'بَنِّك' : 'Bank',
      sublabel: lang === 'ar' ? 'تحدي وسرعة' : 'Push-Your-Luck',
      icon: <AppIcon icon={Vault} size={15} weight="fill" className="text-gold" />,
    },
  ];

  const poolOptions: SegmentedOption<PoolMode>[] = [
    {
      value: 'ACTIVE',
      label: t('pools.ACTIVE.label'),
      icon: <AppIcon icon={UserCheck} size={14} weight="duotone" />,
    },
    {
      value: 'GLOBAL',
      label: t('pools.GLOBAL.label'),
      icon: <AppIcon icon={Globe} size={14} weight="duotone" />,
    },
    {
      value: 'EPL',
      label: t('pools.EPL.label'),
      icon: <AppIcon icon={Flame} size={14} weight="duotone" />,
    },
    {
      value: 'EGYPT',
      label: t('pools.EGYPT.label'),
      icon: <AppIcon icon={Star} size={14} weight="duotone" />,
    },
    {
      value: 'ICONS',
      label: t('pools.ICONS.label'),
      icon: <AppIcon icon={Crown} size={14} weight="duotone" />,
    },
  ];

  const sizeOptions: SegmentedOption<MatchSize>[] = [
    {
      value: 11,
      label: t('createRoom.match11'),
      icon: <AppIcon icon={Users} size={14} weight="duotone" />,
    },
    {
      value: 5,
      label: t('createRoom.match5'),
      icon: <AppIcon icon={Lightning} size={14} weight="duotone" />,
    },
  ];

  const budgetOptions: SegmentedOption<number>[] = [
    { value: 100, label: '$100M' },
    { value: 150, label: '$150M' },
    { value: 200, label: '$200M' },
  ];



  const draftModeOptions: SegmentedOption<DraftModeType>[] = [
    {
      value: 'duel',
      label: lang === 'ar' ? 'مبارزة 1v1' : 'Private Duel',
      icon: <AppIcon icon={Users} size={14} weight="duotone" />,
    },
    {
      value: 'quick',
      label: lang === 'ar' ? 'ماتش سريع' : 'Quick Match',
      icon: <AppIcon icon={Lightning} size={14} weight="duotone" />,
    },
  ];

  const rankModeOptions: SegmentedOption<RankModeType>[] = [
    {
      value: 'duel',
      label: lang === 'ar' ? 'مبارزة 1v1' : 'Private Duel',
      icon: <AppIcon icon={Users} size={14} weight="duotone" />,
    },
    {
      value: 'quick',
      label: lang === 'ar' ? 'ماتش سريع' : 'Quick Match',
      icon: <AppIcon icon={Ranking} size={14} weight="duotone" />,
    },
    {
      value: 'solo',
      label: lang === 'ar' ? 'سباق فردي' : 'Solo Trivia',
      icon: <AppIcon icon={Star} size={14} weight="duotone" />,
    },
  ];

  const bankModeOptions: SegmentedOption<BankModeType>[] = [
    {
      value: 'duel',
      label: lang === 'ar' ? 'مبارزة 1v1' : '1v1 Duel',
      icon: <AppIcon icon={Users} size={14} weight="duotone" />,
    },
    {
      value: 'quick',
      label: lang === 'ar' ? 'ماتش سريع' : 'Quick Match',
      icon: <AppIcon icon={Vault} size={14} weight="duotone" />,
    },
    {
      value: 'solo',
      label: lang === 'ar' ? 'سباق فردي' : 'Solo Run',
      icon: <AppIcon icon={Star} size={14} weight="duotone" />,
    },
  ];

  const roundOptions: SegmentedOption<3 | 5>[] = [
    { value: 3, label: t('rank.rounds3') },
    { value: 5, label: t('rank.rounds5') },
  ];

  return (
    <PageShell
      title={lang === 'ar' ? 'إنشاء غرفة مخصصة' : 'Custom Lobby'}
      subtitle={
        selectedGame === 'snipe'
          ? lang === 'ar'
            ? 'حدد قواعد مزاد السنايب وابدأ التحدي.'
            : 'Configure Snipe auction parameters and launch.'
          : selectedGame === 'rank'
            ? lang === 'ar'
              ? 'اختر نظام تحدي رتّب وابدأ اللعب.'
              : 'Configure Rank trivia challenge and start.'
            : selectedGame === 'draft'
              ? lang === 'ar'
                ? 'اختر تشكيلة وتحدي الدرافت وابدأ البناء.'
                : 'Configure Pro Draft chemistry squad and launch.'
              : lang === 'ar'
                ? 'حدد نمط لعبة بَنِّك واجمع أعلى رصيد.'
                : 'Configure Bank It push-your-luck sprint.'
      }
      badge={
        <div className="hidden xs:inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-gold-light shadow-sm backdrop-blur-xl">
          <AppIcon icon={PlusCircle} size={12} weight="fill" className="text-gold" />
          <span className="font-stats tracking-wider uppercase font-bold">
            {lang === 'ar' ? 'غرفة مخصصة' : 'Custom Arena Setup'}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="xl"
      className="py-0.5 gap-1 sm:gap-2"
    >
      <div className="luxury-glass-elevated relative z-10 p-2.5 sm:p-4 space-y-1.5 sm:space-y-2.5 rounded-2xl sm:rounded-3xl border border-gold/15 shadow-xl">
        {/* Game Mode Switch */}
        <div className="space-y-1">
          <label className="text-steel text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase block px-1 font-stats">
            {lang === 'ar' ? 'اختر نمط اللعبة' : 'Game Mode'}
          </label>
          <SegmentedControl
            options={gameOptions}
            value={selectedGame}
            onChange={setSelectedGame}
            size="sm"
            activeVariant="gold"
          />
        </div>

        {/* Manager Handle Input */}
        <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-steel font-stats">
              {lang === 'ar' ? 'هوية المدرب' : 'Manager Identity'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
            <div className="flex-1 min-w-0">
              <TextInput
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
                    className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-steel hover:text-white transition-all cursor-pointer"
                  >
                    <AppIcon icon={Shuffle} size={15} weight="bold" />
                  </button>
                }
              />
            </div>
          </div>
        </div>

        {/* ── SNIPE CONFIGURATION (EACH OPTION ON A SEPARATE LINE) ── */}
        {selectedGame === 'snipe' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            {/* Match Size (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {t('createRoom.matchSize')}
              </label>
              <SegmentedControl
                options={sizeOptions}
                value={matchSize}
                onChange={setMatchSize}
                size="sm"
                activeVariant="gold"
              />
            </div>

            {/* Starting Budget (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {t('createRoom.startingBudget')}
              </label>
              <SegmentedControl
                options={budgetOptions}
                value={startingBudget}
                onChange={setStartingBudget}
                size="sm"
                activeVariant="gold"
              />
            </div>

            {/* Player Pool (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {t('createRoom.playerPool')}
              </label>
              <SegmentedControl
                options={poolOptions}
                value={poolMode}
                onChange={setPoolMode}
                size="sm"
                activeVariant="gold"
              />
            </div>

            {/* Room Visibility (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {t('createRoom.visibility')}
              </label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`btn-haptic flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer font-stats ${
                    !isPublic
                      ? 'border-gold/40 bg-gold/15 text-gold-light shadow-sm'
                      : 'text-steel border-white/8 bg-white/[0.02] hover:text-white'
                  }`}
                >
                  <AppIcon icon={Lock} size={13} weight={!isPublic ? 'fill' : 'duotone'} />
                  <span>{t('createRoom.privateCode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`btn-haptic flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer font-stats ${
                    isPublic
                      ? 'border-gold/40 bg-gold/15 text-gold-light shadow-sm'
                      : 'text-steel border-white/8 bg-white/[0.02] hover:text-white'
                  }`}
                >
                  <AppIcon icon={Globe} size={13} weight={isPublic ? 'fill' : 'duotone'} />
                  <span>{t('createRoom.publicArena')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RANK CONFIGURATION (EACH OPTION ON A SEPARATE LINE) ── */}
        {selectedGame === 'rank' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            {/* Rank Mode (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {lang === 'ar' ? 'نظام التحدي' : 'Rank Mode'}
              </label>
              <SegmentedControl
                options={rankModeOptions}
                value={rankType}
                onChange={setRankType}
                size="sm"
                activeVariant="gold"
              />
            </div>

            {/* Match Length (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {t('rank.matchLength')}
              </label>
              <SegmentedControl
                options={roundOptions}
                value={roundCount}
                onChange={setRoundCount}
                size="sm"
                activeVariant="gold"
              />
            </div>



            {/* Mode Specs Clarifier */}
            <div className="luxury-glass p-1.5 sm:p-2 rounded-xl border border-gold/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  {rankType === 'duel' ? (
                    <AppIcon icon={Users} size={12} weight="fill" />
                  ) : rankType === 'quick' ? (
                    <AppIcon icon={Ranking} size={12} weight="fill" />
                  ) : (
                    <AppIcon icon={Star} size={12} weight="fill" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-white block truncate">
                    {rankType === 'duel'
                      ? lang === 'ar'
                        ? 'مبارزة 1v1 مباشرة برمز سري'
                        : 'Private 1v1 Room Duel'
                      : rankType === 'quick'
                        ? lang === 'ar'
                          ? 'رادار المطابقة السريعة'
                          : 'Radar Live Matchmaking'
                        : lang === 'ar'
                          ? 'سباق فردي كلاسيكي'
                          : 'Solo Trivia Challenge'}
                  </span>
                  <span className="text-[9px] text-steel block truncate">
                    {rankType === 'duel'
                      ? lang === 'ar'
                        ? 'تحدَّ صديقك بنفس جولات الترتيب'
                        : 'Challenge a friend with the same questions'
                      : rankType === 'quick'
                        ? lang === 'ar'
                          ? 'مطابقة فورية مع مدرب متاح'
                          : 'Instantly match against an online rival'
                        : lang === 'ar'
                          ? 'اختبر معلوماتك وتصدر قائمة الترتيب'
                          : 'Test your football trivia prowess solo'}
                  </span>
                </div>
              </div>

              {rankType === 'quick' ? (
                <StatPill
                  variant="gold"
                  size="sm"
                  label={t('rank.inQueueStats', { count: queueStats?.waitingCount ?? 0 })}
                />
              ) : (
                <span className="text-[9.5px] font-bold text-gold font-stats shrink-0">
                  {rankType === 'duel' ? '1v1 DUEL' : 'SOLO'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── DRAFT CONFIGURATION (EACH OPTION ON A SEPARATE LINE) ── */}
        {selectedGame === 'draft' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            {/* Draft Mode (Full Width Separate Line) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {lang === 'ar' ? 'نظام الدرافت' : 'Draft Mode'}
              </label>
              <SegmentedControl
                options={draftModeOptions}
                value={draftType}
                onChange={setDraftType}
                size="sm"
                activeVariant="gold"
              />
            </div>



            {/* Sleek Minimal Synergy Bar (Clean, Noise-Free) */}
            <div className="luxury-glass px-2.5 sm:px-3 py-1.5 rounded-xl border border-gold/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <AppIcon icon={Lightning} size={12} weight="fill" />
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase font-stats tracking-wider truncate">
                  {lang === 'ar' ? 'كيمياء وتناغم التشكيلة' : 'Chemistry Synergy'}
                </span>
              </div>
              <div className="flex items-center gap-2 font-stats text-[9.5px] shrink-0">
                <span className="text-steel">
                  {lang === 'ar' ? 'نادي' : 'Club'}{' '}
                  <span className="font-bold text-gold" dir="ltr">+3</span>
                </span>
                <span className="text-white/20">·</span>
                <span className="text-steel">
                  {lang === 'ar' ? 'دوري' : 'League'}{' '}
                  <span className="font-bold text-gold" dir="ltr">+2</span>
                </span>
                <span className="text-white/20">·</span>
                <span className="text-steel">
                  {lang === 'ar' ? 'جنسية' : 'Nation'}{' '}
                  <span className="font-bold text-gold" dir="ltr">+1</span>
                </span>
              </div>
            </div>

            {/* Row 3: Mode Specs Clarifier */}
            <div className="luxury-glass p-1.5 sm:p-2 rounded-xl border border-gold/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  {draftType === 'duel' ? (
                    <AppIcon icon={Users} size={12} weight="fill" />
                  ) : draftType === 'quick' ? (
                    <AppIcon icon={Lightning} size={12} weight="fill" />
                  ) : (
                    <AppIcon icon={Star} size={12} weight="fill" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-white block truncate">
                    {draftType === 'duel'
                      ? lang === 'ar'
                        ? 'مبارزة درافت 1v1 مباشرة'
                        : 'Direct 1v1 Draft Duel'
                      : draftType === 'quick'
                        ? lang === 'ar'
                          ? 'طابور الدرافت المباشر'
                          : 'Live Draft Queue Matchmaking'
                        : lang === 'ar'
                          ? 'بناء تشكيلة فردي'
                          : 'Solo Squad Builder'}
                  </span>
                  <span className="text-[9px] text-steel block truncate">
                    {draftType === 'duel'
                      ? lang === 'ar'
                        ? 'تنافس في جولات الاختيار وجهاً لوجه'
                        : 'Turn-based head-to-head draft battle'
                      : draftType === 'quick'
                        ? lang === 'ar'
                          ? 'مطابقة فورية في طابور الدرافت'
                          : 'Instant matchmaking with online managers'
                        : lang === 'ar'
                          ? 'ابنِ تشكيلة أحلامك واختبر كيمياء اللاعبين'
                          : 'Assemble dream squad and test synergies'}
                  </span>
                </div>
              </div>

              {draftType === 'quick' ? (
                <StatPill
                  variant="gold"
                  size="sm"
                  label={
                    lang === 'ar'
                      ? `${draftQueueStats?.waitingCount ?? 0} في الانتظار`
                      : `${draftQueueStats?.waitingCount ?? 0} in queue`
                  }
                />
              ) : (
                <span className="text-[9.5px] font-bold text-gold font-stats shrink-0">
                  {draftType === 'duel' ? '1v1 DUEL' : 'SOLO'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── BANK CONFIGURATION (TAILORED TO BANK PUSH-YOUR-LUCK MECHANICS) ── */}
        {selectedGame === 'bank' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            {/* Row 1: Full-width Bank Mode Selector (No truncation!) */}
            <div className="luxury-glass rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/8 space-y-0.5">
              <label className="text-steel text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase block px-0.5 font-stats">
                {lang === 'ar' ? 'نظام لعبة بَنِّك' : 'Bank Game Mode'}
              </label>
              <SegmentedControl
                options={bankModeOptions}
                value={bankType}
                onChange={setBankType}
                size="sm"
                activeVariant="gold"
              />
            </div>

            {/* Row 2: The Signature 2X Doubling Progression & Core Rules */}
            <div className="rounded-xl sm:rounded-2xl border border-gold/30 bg-gradient-to-b from-slate-900/90 via-[#0a0e17]/95 to-slate-950/95 p-2.5 sm:p-3 shadow-inner space-y-2 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />

              {/* Ladder Header: 1 >> 2K */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border border-gold/40 bg-gold/15 text-gold shadow-sm">
                    <AppIcon icon={Lightning} size={12} weight="fill" />
                  </span>
                  <span className="text-[11px] font-black uppercase text-gold-light tracking-wider font-stats">
                    {lang === 'ar' ? 'سلّم الجائزة الكبرى المضاعف (2x)' : 'THE 2X DOUBLING LADDER'}
                  </span>
                </div>
                {/* 1 >> 2K Milestone */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-gold/40 bg-gold/15 shadow-sm">
                  <span className="text-[11px] font-black text-white font-stats">1</span>
                  <span className="text-[10px] font-bold text-gold font-stats">{lang === 'ar' ? '←' : '➔'}</span>
                  <span className="text-[11px] font-black text-gold font-stats tracking-wider">2K</span>
                </div>
              </div>

              {/* Tactical Rules: Bank Safe vs Wipeout Risk - Clear & Prominent */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex items-center gap-2 rounded-xl bg-gold/5 border border-gold/25 p-2 transition-colors hover:border-gold/45">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40 shadow-sm">
                    <AppIcon icon={Vault} size={15} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <span className="font-black text-white text-xs block leading-tight">
                      {lang === 'ar' ? 'تأمين البنك' : 'Bank Safe'}
                    </span>
                    <span className="text-[10px] text-amber-200/80 font-medium block leading-tight mt-0.5">
                      {lang === 'ar' ? 'احفظ نقاطك الحالية بأمان' : 'Lock points safely'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-rose-500/5 border border-rose-500/25 p-2 transition-colors hover:border-rose-500/45">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm">
                    <AppIcon icon={Flame} size={15} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <span className="font-black text-white text-xs block leading-tight">
                      {lang === 'ar' ? 'خطر التصفير' : 'Wipeout Risk'}
                    </span>
                    <span className="text-[10px] text-rose-200/80 font-medium block leading-tight mt-0.5">
                      {lang === 'ar' ? 'الخطأ يُصفّر النقاط المعلقة' : 'Miss wipes unbanked streak'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Mode Specs Clarifier (Clear info based on selected bankType) */}
            <div className="luxury-glass p-1.5 sm:p-2 rounded-xl border border-gold/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  {bankType === 'duel' ? (
                    <AppIcon icon={Users} size={12} weight="fill" />
                  ) : bankType === 'quick' ? (
                    <AppIcon icon={Vault} size={12} weight="fill" />
                  ) : (
                    <AppIcon icon={Star} size={12} weight="fill" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-white block truncate">
                    {bankType === 'duel'
                      ? lang === 'ar'
                        ? 'مبارزة 1v1 مباشرة برمز سري'
                        : 'Direct 1v1 Head-to-Head Duel'
                      : bankType === 'quick'
                        ? lang === 'ar'
                          ? 'رادار المطابقة السريعة المباشرة'
                          : 'Instant Live Matchmaking'
                        : lang === 'ar'
                          ? 'سباق فردي 90 ثانية لكسر الرقم القياسي'
                          : '90s Solo Sprint High Score Run'}
                  </span>
                  <span className="text-[9px] text-steel block truncate">
                    {bankType === 'duel'
                      ? lang === 'ar'
                        ? 'نفس الأسئلة للمدربين · وقت إضافي عند التعادل'
                        : 'Same 12 questions · 15s sudden death tiebreaker'
                      : bankType === 'quick'
                        ? lang === 'ar'
                          ? 'بحث تلقائي عن خصم متاح أونلاين'
                          : 'Auto-finds active manager online'
                        : lang === 'ar'
                          ? 'سباق ضد الوقت للوصول لقمة المتصدرين'
                          : 'Climb ladder and set your personal best'}
                  </span>
                </div>
              </div>

              {bankType === 'quick' ? (
                <StatPill
                  variant="gold"
                  size="sm"
                  label={
                    lang === 'ar'
                      ? `${bankQueueStats?.waitingCount ?? 0} في الانتظار`
                      : `${bankQueueStats?.waitingCount ?? 0} in queue`
                  }
                />
              ) : (
                <span className="text-[9.5px] font-bold text-gold font-stats shrink-0">
                  {bankType === 'duel' ? '1v1 DUEL' : '90s SPRINT'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Launch Button */}
        <Button
          variant="gold"
          size="lg"
          fullWidth
          onClick={handleCreateMatch}
          disabled={loading || !nickname.trim()}
          loading={loading}
          className="rounded-2xl font-bold h-10 sm:h-12 text-xs sm:text-sm"
        >
          {loading
            ? t('createRoom.launching')
            : selectedGame === 'snipe'
              ? (lang === 'ar' ? 'ابدأ ماتش سنايب' : 'Launch Snipe Match')
              : selectedGame === 'rank'
                ? (lang === 'ar' ? 'ابدأ ماتش رتّب' : 'Launch Rank Match')
                : selectedGame === 'draft'
                  ? (lang === 'ar' ? 'ابدأ ماتش درافت' : 'Launch Draft Session')
                  : (lang === 'ar' ? 'ابدأ ماتش بَنِّك' : 'Launch Bank Match')}
        </Button>
      </div>
    </PageShell>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-gold animate-spin" />
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
