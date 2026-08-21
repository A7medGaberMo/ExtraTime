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

type GameMode = 'snipe' | 'rank';
type MatchSize = 5 | 11;
type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';
type RankModeType = 'duel' | 'quick' | 'solo';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const initialMode = searchParams.get('mode') === 'rank' ? 'rank' : 'snipe';
  const [selectedGame, setSelectedGame] = useState<GameMode>(initialMode);

  // Mutations
  const createGuest = useMutation(api.guests.mutations.create);
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const createRankSolo = useMutation(api.rank.mutations.createSoloGame);
  const findRankPublic = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);

  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extratime_guestName') || randomName();
    }
    return randomName();
  });

  // Snipe options
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [isPublic, setIsPublic] = useState(false);

  // Rank options
  const [rankType, setRankType] = useState<RankModeType>('duel');
  const [roundCount, setRoundCount] = useState<3 | 5>(3);

  const [loading, setLoading] = useState(false);

  async function ensureGuestId(): Promise<Id<'guestUsers'>> {
    const name = nickname.trim() || randomName();
    let guestId = localStorage.getItem('extratime_guestId');
    if (!guestId) {
      guestId = await createGuest({ nickname: name, avatarSeed: name });
      localStorage.setItem('extratime_guestId', guestId);
    }
    localStorage.setItem('extratime_guestName', name);
    return guestId as Id<'guestUsers'>;
  }

  async function handleCreateMatch() {
    if (loading || !nickname.trim()) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId();

      if (selectedGame === 'snipe') {
        const room = await createSnipeRoom({
          hostId: guestId,
          matchSize,
          startingBudget,
          isPublic,
          poolMode,
        });
        router.push(`/auction/${room.roomId}`);
      } else {
        // Rank match
        if (rankType === 'duel') {
          const result = await createRankDuel({ hostId: guestId, roundCount });
          router.push(`/rank/${result.gameId}`);
        } else if (rankType === 'quick') {
          const result = await findRankPublic({ guestId, roundCount });
          router.push(`/rank/${result.gameId}`);
        } else {
          const result = await createRankSolo({ guestId, roundCount });
          router.push(`/rank/${result.gameId}`);
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
      label: lang === 'ar' ? 'سنايب (مزاد سري)' : 'Snipe (Secret Bids)',
      icon: <AppIcon icon={Crosshair} size={16} weight="duotone" />,
    },
    {
      value: 'rank',
      label: lang === 'ar' ? 'رتّب (تحدي أرقام)' : 'Rank (Trivia Order)',
      icon: <AppIcon icon={Ranking} size={16} weight="duotone" />,
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
          : (lang === 'ar' ? 'اختار نظام تحدي رتّب وابدأ اللعب.' : 'Configure Rank trivia challenge and start.')
      }
      backUrl="/"
      maxWidth="2xl"
    >
      <Panel variant="highlight" className="p-4 sm:p-6 space-y-5">
        {/* Game Mode Switch: Snipe vs Rank */}
        <div className="space-y-1.5">
          <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
            {lang === 'ar' ? 'اختار اللعبة' : 'Select Game'}
          </label>
          <SegmentedControl
            options={gameOptions}
            value={selectedGame}
            onChange={setSelectedGame}
            size="lg"
          />
        </div>

        {/* Manager Handle Input */}
        <div className="flex items-center gap-3 pt-1">
          <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:border-lime/40 hover:text-lime transition-all active:scale-95 cursor-pointer"
                >
                  <AppIcon icon={DiceFive} size={20} weight="duotone" />
                </button>
              }
            />
          </div>
        </div>

        {/* ── SNIPE CONFIGURATION ── */}
        {selectedGame === 'snipe' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Match Size */}
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
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
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
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
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
                {t('createRoom.playerPool')}
              </label>
              <SegmentedControl
                options={poolOptions}
                value={poolMode}
                onChange={setPoolMode}
                size="sm"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
                {t('createRoom.visibility')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
                    !isPublic
                      ? 'border-lime/60 bg-lime/10 text-lime shadow-inner'
                      : 'text-steel border-white/10 bg-slate-950/80 hover:text-white'
                  }`}
                >
                  <AppIcon icon={Lock} size={16} weight="duotone" />
                  <span>{t('createRoom.privateCode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
                    isPublic
                      ? 'border-lime/60 bg-lime/10 text-lime shadow-inner'
                      : 'text-steel border-white/10 bg-slate-950/80 hover:text-white'
                  }`}
                >
                  <AppIcon icon={Globe} size={16} weight="duotone" />
                  <span>{t('createRoom.publicArena')}</span>
                </button>
              </div>
              <p className="text-[10px] text-steel px-1">
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
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Rank Mode */}
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
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
            <div className="space-y-1.5">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
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
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-white font-medium">Radar Matchmaking</span>
                <StatPill
                  variant="lime"
                  size="sm"
                  label={t('rank.inQueueStats', { count: queueStats?.waitingCount ?? 0 })}
                />
              </div>
            )}
          </div>
        )}

        {/* Unified Launch Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCreateMatch}
          disabled={loading || !nickname.trim()}
          loading={loading}
          leftIcon={<AppIcon icon={selectedGame === 'snipe' ? Crosshair : Ranking} size={20} weight="bold" />}
        >
          {loading
            ? t('createRoom.launching')
            : selectedGame === 'snipe'
              ? (lang === 'ar' ? 'ابدأ ماتش سنايب' : 'Create Snipe Match')
              : (lang === 'ar' ? 'ابدأ تحدي رتّب' : 'Create Rank Match')}
        </Button>
      </Panel>
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
