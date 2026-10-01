'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  Ranking,
  Sword,
  Play,
  Users,
  Compass,
  Clock,
  ShieldCheck,
  ArrowsDownUp,
  Key,
  Shuffle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { StatPill } from '@/components/ui/stat-pill';
import { TextInput } from '@/components/ui/text-input';
import { ModalShell } from '@/components/ui/modal-shell';
import { UserIdentity } from '@/components/ui/user-identity';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';

export default function RankHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSolo = useMutation(api.rank.mutations.createSoloGame);
  const createDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const joinDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);
  const findPublicMatch = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);

  const [nickname, setNickname] = useGuestNickname();
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'solo' }
    | { type: 'quick' }
    | { type: 'duel_create' }
    | { type: 'duel_join'; code: string }
    | null
  >(null);

  const [roundCount, setRoundCount] = useState<3 | 5>(3);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'solo' | 'quick' | 'duel'>('solo');
  const [joinCode, setJoinCode] = useState('');

  async function ensureGuestUser(): Promise<Id<'guestUsers'>> {
    const name = nickname.trim() || randomName();
    const existingId =
      typeof window !== 'undefined'
        ? (localStorage.getItem('extratime_guestId') as Id<'guestUsers'> | null)
        : null;
    const sessionToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('extratime_sessionToken') || undefined
        : undefined;
    const res = await ensureGuest({
      existingId: existingId ?? undefined,
      sessionToken,
      nickname: name,
      avatarSeed: name,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('extratime_guestId', res.guestId);
      if (res.sessionToken) {
        localStorage.setItem('extratime_sessionToken', res.sessionToken);
      }
      localStorage.setItem('extratime_guestName', name);
    }
    return res.guestId as Id<'guestUsers'>;
  }

  function triggerActionWithName(
    action:
      | { type: 'solo' }
      | { type: 'quick' }
      | { type: 'duel_create' }
      | { type: 'duel_join'; code: string },
  ) {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('extratime_guestName') : null;
    if (saved) {
      void executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(
    action:
      | { type: 'solo' }
      | { type: 'quick' }
      | { type: 'duel_create' }
      | { type: 'duel_join'; code: string },
  ) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestUser();
      const sessionToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      if (action.type === 'solo') {
        const result = await createSolo({ guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (action.type === 'quick') {
        const result = await findPublicMatch({ guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (action.type === 'duel_create') {
        const result = await createDuel({ hostId: guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (action.type === 'duel_join') {
        const result = await joinDuel({ guestId, sessionToken, code: action.code });
        router.push(`/rank/${result.gameId}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Action failed', 'error');
      setLoading(false);
    }
  }

  async function handleModalSubmit() {
    if (!pendingAction || !nickname.trim()) return;
    setShowNameModal(false);
    await executeAction(pendingAction);
  }

  const tabOptions: SegmentedOption<'solo' | 'quick' | 'duel'>[] = [
    {
      value: 'solo',
      label: t('rank.soloTab'),
      icon: <AppIcon icon={Play} size={15} weight="duotone" />,
    },
    {
      value: 'quick',
      label: t('rank.quickTab'),
      icon: <AppIcon icon={Compass} size={15} weight="duotone" />,
    },
    {
      value: 'duel',
      label: t('rank.duelTab'),
      icon: <AppIcon icon={Sword} size={15} weight="duotone" />,
    },
  ];

  const roundOptions: SegmentedOption<3 | 5>[] = [
    {
      value: 3,
      label: t('rank.rounds3'),
      sublabel: '~2 min',
    },
    {
      value: 5,
      label: t('rank.rounds5'),
      sublabel: '~4 min',
    },
  ];

  return (
    <PageShell
      title={t('rank.hubTitle')}
      subtitle={t('rank.hubSubtitle')}
      badge={
        <StatPill
          variant="gold"
          size="sm"
          icon={<AppIcon icon={Ranking} size={13} weight="fill" />}
          label={t('rank.hubBadge')}
        />
      }
      backUrl="/"
      maxWidth="xl"
    >
      {/* ── 1. RADAR CONTROL CONSOLE ─────────────────────────────────── */}
      <div className="luxury-glass-elevated relative rounded-3xl p-3.5 sm:p-5 border border-game-accent/20 shadow-[0_24px_50px_var(--et-shade-70)] backdrop-blur-3xl space-y-3 sm:space-y-3.5">
        {/* Soft Ambient Top Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-36 w-64 rounded-full bg-game-accent/10 blur-3xl" />

        {/* Manager Handle Bar */}
        <div className="relative flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-2 sm:p-2.5 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
            <div className="min-w-0">
              <span className="text-[10px] text-muted font-bold uppercase tracking-widest block font-stats">
                {t('joinRoom.managerHandle')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate block">
                {nickname}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPendingAction(null);
              setShowNameModal(true);
            }}
            className="btn-haptic flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-game-accent/50 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <AppIcon icon={Shuffle} size={14} weight="bold" className="text-game-accent" />
            <span>{lang === 'ar' ? 'تغيير' : 'Randomize'}</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="relative">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            size="md"
            activeVariant="gold"
          />
        </div>

        {/* Round Count Selector */}
        <div className="relative space-y-1.5">
          <label className="text-muted text-[10px] font-bold tracking-widest uppercase block px-1 font-stats">
            {t('rank.matchLength')}
          </label>
          <SegmentedControl
            options={roundOptions}
            value={roundCount}
            onChange={setRoundCount}
            size="md"
          />
        </div>

        {/* ── TAB 1: SOLO PLAY ──────────────────────────────────────── */}
        {activeTab === 'solo' && (
          <div className="relative space-y-4 pt-1 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1 text-xs shadow-inner">
              <div className="flex items-center gap-2 font-bold text-white uppercase font-stats">
                <AppIcon icon={ShieldCheck} size={16} weight="fill" className="text-game-accent" />
                <span>{t('rank.scoringRuleTitle')}</span>
              </div>
              <p className="text-foreground text-xs font-normal leading-relaxed">
                {t('rank.scoringRuleDesc')}
              </p>
            </div>

            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'solo' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Play} size={18} weight="fill" />}
              className="rounded-2xl font-bold h-12 text-sm"
            >
              {t('rank.startSolo', { rounds: roundCount })}
            </Button>
          </div>
        )}

        {/* ── TAB 2: QUICK MATCH ────────────────────────────────────── */}
        {activeTab === 'quick' && (
          <div className="relative space-y-4 pt-1 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-between shadow-inner">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-[10px] text-muted font-bold uppercase block font-stats">
                  {lang === 'ar' ? 'رادار المطابقة السريعة' : 'Radar Matchmaking'}
                </span>
                <p className="text-xs text-white font-medium truncate">
                  {lang === 'ar'
                    ? `مطابقة فورية مع منافس لايف (${roundCount} جولات)`
                    : `Live 1v1 matchup (${roundCount} rounds)`}
                </p>
              </div>
              <StatPill
                variant="gold"
                size="sm"
                label={t('rank.inQueueStats', {
                  count: roundCount === 3 ? (queueStats?.waiting3 ?? 0) : (queueStats?.waiting5 ?? 0),
                })}
              />
            </div>

            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'quick' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Sword} size={18} weight="bold" />}
              className="rounded-2xl font-bold h-12 text-sm"
            >
              {lang === 'ar'
                ? `ابحث عن منافس لايف (${roundCount} جولات)`
                : `Find 1v1 Opponent (${roundCount} Rounds)`}
            </Button>
          </div>
        )}

        {/* ── TAB 3: PRIVATE DUEL ───────────────────────────────────── */}
        {activeTab === 'duel' && (
          <div className="relative space-y-4 pt-1 animate-fade-in">
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'duel_create' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Users} size={18} weight="bold" />}
              className="rounded-2xl font-bold h-12 text-sm"
            >
              {t('rank.createPrivateDuel')}
            </Button>

            <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase font-stats">
              <div className="h-px bg-white/8 flex-1" />
              <span>{t('rank.orJoinWithCode')}</span>
              <div className="h-px bg-white/8 flex-1" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput
                  placeholder={t('rank.joinCodePlaceholder')}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  leftIcon={<AppIcon icon={Key} size={16} weight="bold" />}
                  aria-label={t('rank.joinCodePlaceholder')}
                  className="font-stats tracking-widest text-center uppercase"
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  triggerActionWithName({ type: 'duel_join', code: joinCode.trim() })
                }
                disabled={loading || joinCode.trim().length !== 6}
                className="rounded-xl font-bold px-4 h-11"
              >
                {t('rank.joinDuelBtn')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. TECHNICAL SPECIFICATION TILES (APPLE LUXURY MINIMAL) ─── */}
      <section className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full">
        <div className="luxury-glass rounded-2xl p-2.5 sm:p-3 text-center sm:text-start space-y-0.5 border border-game-accent/15">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-game-accent font-bold text-xs font-stats">
            <AppIcon icon={Clock} size={13} weight="fill" />
            <span>{lang === 'ar' ? 'مؤقت 45 ثانية' : '45s Timer'}</span>
          </div>
          <p className="text-[10px] sm:text-[10.5px] text-muted font-normal truncate">
            {lang === 'ar' ? 'جولات حية وسريعة' : 'Fast live rounds'}
          </p>
        </div>

        <div className="luxury-glass rounded-2xl p-2.5 sm:p-3 text-center sm:text-start space-y-0.5 border border-game-accent/15">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-game-accent font-bold text-xs font-stats">
            <AppIcon icon={ShieldCheck} size={13} weight="fill" />
            <span>{lang === 'ar' ? '+2 إلى -2' : '+2 to -2'}</span>
          </div>
          <p className="text-[10px] sm:text-[10.5px] text-muted font-normal truncate">
            {lang === 'ar' ? 'حساب دقيق للمراكز' : 'Distance scoring'}
          </p>
        </div>

        <div className="luxury-glass rounded-2xl p-2.5 sm:p-3 text-center sm:text-start space-y-0.5 border border-game-accent/15">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-game-accent font-bold text-xs font-stats">
            <AppIcon icon={ArrowsDownUp} size={13} weight="bold" />
            <span>{lang === 'ar' ? '5 بطاقات' : '5 Cards'}</span>
          </div>
          <p className="text-[10px] sm:text-[10.5px] text-muted font-normal truncate">
            {lang === 'ar' ? 'ترتيب بالسحب والإفلات' : 'Drag & drop order'}
          </p>
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
            rightIcon={
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                aria-label={t('home.nameModal.randomize')}
                title={t('home.nameModal.randomize')}
                className="btn-haptic flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-foreground transition-colors hover:border-game-accent/50 hover:text-game-accent"
              >
                <AppIcon icon={Shuffle} size={18} weight="bold" />
              </button>
            }
          />

          <div className="flex items-center justify-end px-1">
            <span className="font-stats text-xs text-muted">{nickname.length}/18</span>
          </div>

          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={handleModalSubmit}
            disabled={loading || !nickname.trim()}
            loading={loading}
            className="rounded-2xl"
          >
            {loading ? t('home.nameModal.finding') : t('common.confirm')}
          </Button>
        </div>
      </ModalShell>
    </PageShell>
  );
}
