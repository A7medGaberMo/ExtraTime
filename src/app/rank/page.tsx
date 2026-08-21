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
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';
import { StatPill } from '@/components/ui/stat-pill';
import { TextInput } from '@/components/ui/text-input';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';

export default function RankHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const createGuest = useMutation(api.guests.mutations.create);
  const createSolo = useMutation(api.rank.mutations.createSoloGame);
  const createDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const joinDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);
  const findPublicMatch = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);

  const [nickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extratime_guestName') || randomName();
    }
    return randomName();
  });

  const [roundCount, setRoundCount] = useState<3 | 5>(3);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'solo' | 'quick' | 'duel'>('solo');
  const [joinCode, setJoinCode] = useState('');

  async function ensureGuestUser(): Promise<Id<'guestUsers'>> {
    let guestId = localStorage.getItem('extratime_guestId');
    if (!guestId) {
      const name = nickname.trim() || randomName();
      guestId = await createGuest({ nickname: name, avatarSeed: name });
      localStorage.setItem('extratime_guestId', guestId);
      localStorage.setItem('extratime_guestName', name);
    }
    return guestId as Id<'guestUsers'>;
  }

  async function handleStartSolo() {
    if (loading) return;
    setLoading(true);
    try {
      const guestId = await ensureGuestUser();
      const result = await createSolo({ guestId, roundCount });
      router.push(`/rank/${result.gameId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Failed to start solo game', 'error');
      setLoading(false);
    }
  }

  async function handleCreatePrivateDuel() {
    if (loading) return;
    setLoading(true);
    try {
      const guestId = await ensureGuestUser();
      const result = await createDuel({ hostId: guestId, roundCount });
      router.push(`/rank/${result.gameId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Failed to create duel room', 'error');
      setLoading(false);
    }
  }

  async function handleJoinPrivateDuel() {
    if (loading || !joinCode.trim()) return;
    setLoading(true);
    try {
      const guestId = await ensureGuestUser();
      const result = await joinDuel({ guestId, code: joinCode.trim() });
      router.push(`/rank/${result.gameId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Could not join room', 'error');
      setLoading(false);
    }
  }

  async function handleQuickMatch() {
    if (loading) return;
    setLoading(true);
    try {
      const guestId = await ensureGuestUser();
      const result = await findPublicMatch({ guestId, roundCount });
      router.push(`/rank/${result.gameId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Matchmaking failed', 'error');
      setLoading(false);
    }
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
              onClick={handleStartSolo}
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
                <span className="text-[10px] text-steel font-black uppercase block">Radar</span>
                <p className="text-xs text-white font-medium">Auto-pair with live manager</p>
              </div>
              <StatPill
                variant="lime"
                size="sm"
                label={t('rank.inQueueStats', { count: queueStats?.waitingCount ?? 0 })}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleQuickMatch}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Sword} size={20} weight="bold" />}
            >
              {t('rank.findQuick')}
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
              onClick={handleCreatePrivateDuel}
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
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleJoinPrivateDuel}
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
    </PageShell>
  );
}
