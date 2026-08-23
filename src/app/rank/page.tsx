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
  DiceFive,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
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
      executeAction(action);
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
      icon: <AppIcon icon={Play} size={16} weight="duotone" />,
    },
    {
      value: 'quick',
      label: t('rank.quickTab'),
      icon: <AppIcon icon={Compass} size={16} weight="duotone" />,
    },
    {
      value: 'duel',
      label: t('rank.duelTab'),
      icon: <AppIcon icon={Sword} size={16} weight="duotone" />,
    },
  ];

  const roundOptions: SegmentedOption<3 | 5>[] = [
    {
      value: 3,
      label: t('rank.rounds3'),
      sublabel: '~2 mins',
    },
    {
      value: 5,
      label: t('rank.rounds5'),
      sublabel: '~4 mins',
    },
  ];

  return (
    <PageShell
      title={t('rank.hubTitle')}
      subtitle={t('rank.hubSubtitle')}
      badge={
        <StatPill
          variant="lime"
          size="sm"
          icon={<AppIcon icon={Ranking} size={14} weight="duotone" />}
          label="Official Records & Trivia"
        />
      }
      maxWidth="2xl"
    >
      {/* ── 1. MODE SELECTOR CARD ────────────────────────────────────── */}
      <Panel variant="highlight" className="p-4 sm:p-6 space-y-5">
        {/* Manager Identity Header Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
            <div className="min-w-0">
              <span className="text-[10px] text-steel font-black uppercase tracking-wider block">
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-bold text-steel hover:border-lime/40 hover:text-white transition-all cursor-pointer"
          >
            <AppIcon icon={DiceFive} size={14} weight="duotone" className="text-lime" />
            <span>{lang === 'ar' ? 'تغيير' : 'Change'}</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <SegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
        />

        {/* Round Count Selector */}
        <div className="space-y-1.5">
          <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
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
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-black text-white uppercase">
                <AppIcon icon={ShieldCheck} size={16} weight="duotone" className="text-lime" />
                <span>{t('rank.scoringRuleTitle')}</span>
              </div>
              <p className="text-steel text-[11px] leading-relaxed">
                {t('rank.scoringRuleDesc')}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'solo' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Play} size={20} weight="bold" />}
            >
              {t('rank.startSolo', { rounds: roundCount })}
            </Button>
          </div>
        )}

        {/* ── TAB 2: QUICK MATCH ────────────────────────────────────── */}
        {activeTab === 'quick' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-steel font-black uppercase block">
                  {lang === 'ar' ? 'رادار المطابقة السريعة' : 'Radar Matchmaking'}
                </span>
                <p className="text-xs text-white font-medium">
                  {lang === 'ar'
                    ? `مطابقة فورية مع منافس لايف اختار نفس المدة (${roundCount} جولات).`
                    : `Auto-pairs with a live manager on the same match length (${roundCount} rounds).`}
                </p>
              </div>
              <StatPill
                variant="lime"
                size="sm"
                label={t('rank.inQueueStats', {
                  count: roundCount === 3 ? (queueStats?.waiting3 ?? 0) : (queueStats?.waiting5 ?? 0),
                })}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'quick' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Sword} size={20} weight="bold" />}
            >
              {lang === 'ar' ? `ابحث عن منافس لايف (${roundCount} جولات)` : `Find 1v1 Opponent (${roundCount} Rounds)`}
            </Button>
          </div>
        )}

        {/* ── TAB 3: PRIVATE DUEL ───────────────────────────────────── */}
        {activeTab === 'duel' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'duel_create' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Users} size={20} weight="bold" />}
            >
              {t('rank.createPrivateDuel')}
            </Button>

            <div className="flex items-center gap-3 text-[10px] text-steel font-black uppercase">
              <div className="h-px bg-white/10 flex-1" />
              <span>{t('rank.orJoinWithCode')}</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Join Code Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput
                  placeholder={t('rank.joinCodePlaceholder')}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  leftIcon={<AppIcon icon={Key} size={18} weight="duotone" />}
                  aria-label={t('rank.joinCodePlaceholder')}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  triggerActionWithName({ type: 'duel_join', code: joinCode.trim() })
                }
                disabled={loading || !joinCode.trim()}
              >
                {t('rank.joinDuelBtn')}
              </Button>
            </div>
          </div>
        )}
      </Panel>

      {/* ── 2. RULES SUMMARY CARDS ───────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Panel variant="subtle" className="p-3 text-center sm:text-start space-y-0.5">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-lime font-black text-xs">
            <AppIcon icon={Clock} size={14} weight="duotone" />
            <span>45s Timer</span>
          </div>
          <p className="text-[10px] text-steel font-medium truncate">Fast live rounds</p>
        </Panel>

        <Panel variant="subtle" className="p-3 text-center sm:text-start space-y-0.5">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-black text-xs">
            <AppIcon icon={ShieldCheck} size={14} weight="duotone" />
            <span>+2 to -2</span>
          </div>
          <p className="text-[10px] text-steel font-medium truncate">Distance scoring</p>
        </Panel>

        <Panel variant="subtle" className="p-3 text-center sm:text-start space-y-0.5">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 font-black text-xs">
            <AppIcon icon={ArrowsDownUp} size={14} weight="duotone" />
            <span>5 Cards</span>
          </div>
          <p className="text-[10px] text-steel font-medium truncate">Drag & drop order</p>
        </Panel>
      </section>

      {/* ── 3. MANAGER NAME ENTRY MODAL ──────────────────────────────── */}
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
    </PageShell>
  );
}
