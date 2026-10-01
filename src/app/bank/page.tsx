'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Play,
  Users,
  Sword,
  Flame,
  Key,
  Trophy,
  Crown,
  Medal,
  Shield,
  Lightning,
  Vault,
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
import { useGuestSession } from '@/hooks/use-guest-session';
import { getScoreTier } from '@/types/bank';

export default function BankHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const isArabic = lang === 'ar';

  const { guestId, ensureGuestId } = useGuestSession();
  const [nickname, setNickname] = useGuestNickname();

  const createSolo = useMutation(api.bank.mutations.createSoloGame);
  const createDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);
  const joinDuel = useMutation(api.bank.mutations.joinDuelPrivateRoom);
  const findPublicMatch = useMutation(api.bank.mutations.findOrCreatePublicMatch);

  const queueStats = useQuery(api.bank.queries.getPublicQueueSummary);
  const personalBest = useQuery(
    api.bank.queries.getPersonalBest,
    guestId ? { guestId } : 'skip',
  );

  const [activeTab, setActiveTab] = useState<'solo' | 'quick' | 'duel'>('solo');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'solo' }
    | { type: 'quick' }
    | { type: 'duel_create' }
    | { type: 'duel_join'; code: string }
    | null
  >(null);

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
      const ensuredId = await ensureGuestId(nickname);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      if (action.type === 'solo') {
        const res = await createSolo({ guestId: ensuredId, sessionToken: token });
        router.push(`/bank/${res.gameId}`);
      } else if (action.type === 'quick') {
        const res = await findPublicMatch({ guestId: ensuredId, sessionToken: token });
        router.push(`/bank/${res.gameId}`);
      } else if (action.type === 'duel_create') {
        const res = await createDuel({ hostId: ensuredId, sessionToken: token });
        router.push(`/bank/${res.gameId}`);
      } else if (action.type === 'duel_join') {
        const res = await joinDuel({
          guestId: ensuredId,
          sessionToken: token,
          code: action.code,
        });
        router.push(`/bank/${res.gameId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleModalSubmit() {
    if (!pendingAction || !nickname.trim()) return;
    setShowNameModal(false);
    await executeAction(pendingAction);
  }

  const modeOptions: SegmentedOption<'solo' | 'quick' | 'duel'>[] = [
    {
      value: 'solo',
      label: t('bank.solo'),
      icon: <AppIcon icon={Play} size={15} weight="duotone" />,
    },
    {
      value: 'quick',
      label: t('bank.quickMatch'),
      icon: <AppIcon icon={Sword} size={15} weight="duotone" />,
    },
    {
      value: 'duel',
      label: t('bank.duel'),
      icon: <AppIcon icon={Users} size={15} weight="duotone" />,
    },
  ];

  const pbTier = personalBest ? getScoreTier(personalBest.personalBestScore) : null;

  return (
    <PageShell
      title={t('bank.title')}
      subtitle={t('bank.subtitle')}
      badge={
        <div className="hidden xs:inline-flex items-center gap-1.5 rounded-full border border-game-accent/30 bg-game-accent/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-game-accent-light shadow-sm backdrop-blur-xl">
          <AppIcon icon={Vault} size={12} weight="fill" className="text-game-accent" />
          <span className="font-stats tracking-wider uppercase font-bold">
            {t('bank.badge')}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="xl"
    >
      {/* ── 1. PERSONAL BEST VIP CAPSULE (COMPACT SINGLE-LINE) ────────── */}
      {personalBest && personalBest.totalSoloGames > 0 && pbTier && (
        <div className="luxury-glass w-full rounded-xl sm:rounded-2xl px-3 py-1.5 sm:py-2 border border-game-accent/25 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm"
              style={{
                backgroundColor: `${pbTier.color}15`,
                borderColor: `${pbTier.color}40`,
                color: pbTier.color,
              }}
            >
              {pbTier.tier === 'legend' ? (
                <AppIcon icon={Crown} size={15} weight="fill" />
              ) : pbTier.tier === 'gold' ? (
                <AppIcon icon={Trophy} size={15} weight="fill" />
              ) : pbTier.tier === 'silver' ? (
                <AppIcon icon={Medal} size={15} weight="fill" />
              ) : (
                <AppIcon icon={Shield} size={15} weight="fill" />
              )}
            </span>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider font-stats shrink-0">
                {t('bank.hub.personalBest')}:
              </span>
              <span className="text-sm sm:text-base font-black font-stats text-white tabular-nums">
                {personalBest.personalBestScore}
              </span>
              <span className="text-[10px] font-bold font-stats text-game-accent">PTS</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span className="hidden sm:inline text-[10px] font-bold font-stats text-game-accent-light uppercase" style={{ color: pbTier.color }}>
                {pbTier.label[lang]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full border border-game-accent/30 bg-game-accent/10 px-2 py-0.5 text-micro font-bold text-game-accent font-stats tabular-nums">
              x{personalBest.highestStreak} {isArabic ? 'سلسلة' : 'STREAK'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-micro font-medium text-muted font-stats tabular-nums">
              {personalBest.totalSoloGames} {isArabic ? 'جولة' : 'RUNS'}
            </span>
          </div>
        </div>
      )}

      {/* ── 2. PRIMARY CONTROL CONSOLE (DEDICATED BANK IT ARENA) ─────── */}
      <div className="luxury-glass-elevated relative w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-game-accent/25 shadow-[0_20px_50px_var(--et-shade-70)] backdrop-blur-3xl space-y-3">
        {/* Row 1: Manager Identity + Mode Switch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
          {/* Manager Handle Bar */}
          <div className="relative flex items-center justify-between rounded-xl sm:rounded-2xl border border-white/8 bg-white/[0.03] p-1.5 sm:p-2 shadow-inner">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
              <div className="min-w-0">
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest block font-stats leading-none">
                  {t('joinRoom.managerHandle')}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate block mt-0.5">
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
              className="btn-haptic flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted hover:border-game-accent/50 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <AppIcon icon={Shuffle} size={14} weight="bold" className="text-game-accent" />
              <span>{isArabic ? 'تغيير' : 'Randomize'}</span>
            </button>
          </div>

          {/* Mode Tabs */}
          <SegmentedControl
            options={modeOptions}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
            activeVariant="gold"
          />
        </div>

        {/* ── THE SIGNATURE BANK IT DOUBLING LADDER (1 >> 2K & CORE RULES) ── */}
        <div className="rounded-2xl border border-game-accent/30 bg-gradient-to-b from-surface/90 via-well/95 to-canvas/95 p-3 sm:p-3.5 shadow-inner space-y-2.5 relative overflow-hidden">
          {/* Specular Top Shimmer */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-game-accent to-transparent opacity-80" />

          {/* Ladder Header: 1 >> 2K */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-game-accent/40 bg-game-accent/15 text-game-accent shadow-sm">
                <AppIcon icon={Lightning} size={14} weight="fill" />
              </span>
              <span className="text-xs font-black uppercase text-game-accent-light tracking-wider font-stats">
                {isArabic ? 'سلم الجائزة الكبرى المضاعف (2x)' : 'THE 2X DOUBLING LADDER'}
              </span>
            </div>
            {/* 1 >> 2K Milestone */}
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-game-accent/40 bg-game-accent/15 shadow-sm">
              <span className="text-xs font-black text-white font-stats">1</span>
              <span className="text-[11px] font-bold text-game-accent font-stats">{isArabic ? '←' : '➔'}</span>
              <span className="text-xs font-black text-game-accent font-stats tracking-wider">2K</span>
            </div>
          </div>

          {/* Core Tension: Bank Safe vs Wipeout Risk - Clear & Prominent */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-game-accent/5 border border-game-accent/25 p-2 sm:p-2.5 transition-colors hover:border-game-accent/45">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-game-accent/20 text-game-accent border border-game-accent/40 shadow-sm">
                <AppIcon icon={Vault} size={17} weight="fill" />
              </span>
              <div className="min-w-0">
                <span className="font-black text-white text-xs sm:text-sm block leading-tight">
                  {isArabic ? 'تأمين البنك' : 'Bank Safe'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-game-accent-light/80 font-medium block leading-tight mt-0.5">
                  {isArabic ? 'احفظ نقاطك في أي وقت' : 'Lock points anytime'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-danger/5 border border-danger/25 p-2 sm:p-2.5 transition-colors hover:border-danger/45">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/20 text-danger border border-danger/40 shadow-sm">
                <AppIcon icon={Flame} size={17} weight="fill" />
              </span>
              <div className="min-w-0">
                <span className="font-black text-white text-xs sm:text-sm block leading-tight">
                  {isArabic ? 'خطر التصفير' : 'Wipeout Risk'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-danger/80 font-medium block leading-tight mt-0.5">
                  {isArabic ? 'الخطأ يُصفّر المعلق' : 'Miss wipes unbanked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB 1: SOLO PLAY ──────────────────────────────────────── */}
        {activeTab === 'solo' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-foreground font-medium text-[11px] sm:text-xs">
                {isArabic ? '12 سؤال متصاعد في 90 ثانية · اجمع أعلى رصيد' : '12 Doubling Questions · 90s Solo Sprint'}
              </span>
              <span className="font-stats font-bold text-game-accent text-[10px] sm:text-xs">
                {isArabic ? 'سباق فردي' : 'SOLO RUN'}
              </span>
            </div>

            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'solo' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Play} size={18} weight="fill" />}
              className="btn-accent-sheen rounded-2xl font-black h-11 sm:h-12 text-xs sm:text-sm text-game-on-accent shadow-lg shadow-game-accent/25"
            >
              <span>{t('bank.hub.startRunNow')}</span>
            </Button>
          </div>
        )}

        {/* ── TAB 2: QUICK MATCH ────────────────────────────────────── */}
        {activeTab === 'quick' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-game-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-game-accent" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {t('bank.hub.radarTitle')}
                  </span>
                  <span className="text-[9.5px] text-muted block truncate">
                    {t('bank.hub.quickDesc')}
                  </span>
                </div>
              </div>
              <StatPill
                variant="gold"
                size="sm"
                label={t('bank.hub.queueCount', {
                  count: queueStats?.waitingCount ?? 0,
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
              className="btn-accent-sheen rounded-2xl font-black h-11 sm:h-12 text-xs sm:text-sm text-game-on-accent shadow-lg shadow-game-accent/25"
            >
              <span>{t('bank.hub.findOpponent')}</span>
            </Button>
          </div>
        )}

        {/* ── TAB 3: PRIVATE DUEL ───────────────────────────────────── */}
        {activeTab === 'duel' && (
          <div className="space-y-1.5 sm:space-y-2 pt-0.5 animate-fade-in">
            <div className="flex items-center justify-between px-1 text-[10px] text-muted">
              <span>
                {isArabic
                  ? 'مبارزة حية 1 ضد 1 · نفس الأسئلة لكلا المدربين'
                  : 'Live 1v1 duel · Same 12 questions for both managers'}
              </span>
              <span className="font-stats font-bold text-game-accent text-micro">
                {isArabic ? 'وقت إضافي 15ث' : '15S TIEBREAKER'}
              </span>
            </div>

            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => triggerActionWithName({ type: 'duel_create' })}
              disabled={loading}
              loading={loading}
              leftIcon={<AppIcon icon={Users} size={18} weight="bold" />}
              className="btn-accent-sheen rounded-2xl font-black h-11 text-xs sm:text-sm text-game-on-accent shadow-lg shadow-game-accent/25"
            >
              <span>{t('bank.hub.createRoom')}</span>
            </Button>

            <div className="flex items-center gap-2 text-[9px] text-muted font-bold uppercase font-stats">
              <div className="h-px bg-white/8 flex-1" />
              <span>{t('bank.hub.orJoinWithCode')}</span>
              <div className="h-px bg-white/8 flex-1" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput
                  placeholder={t('bank.hub.codePlaceholder')}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  leftIcon={<AppIcon icon={Key} size={15} weight="bold" />}
                  aria-label={t('bank.hub.joinRoom')}
                  className="font-mono text-center tracking-widest uppercase font-bold text-xs sm:text-sm h-10 sm:h-11"
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  triggerActionWithName({ type: 'duel_join', code: joinCode.trim() })
                }
                disabled={loading || joinCode.trim().length < 6}
                className="rounded-xl font-bold px-3 sm:px-4 h-10 sm:h-11 text-xs shrink-0"
              >
                {t('bank.hub.joinRoomBtn')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. MANAGER NAME ENTRY MODAL ──────────────────────────────── */}
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
            <span className="text-muted font-stats text-xs">{nickname.length}/18</span>
          </div>

          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={handleModalSubmit}
            disabled={loading || !nickname.trim()}
            loading={loading}
            className="rounded-2xl text-game-on-accent font-bold"
          >
            <span>{loading ? t('home.nameModal.finding') : t('home.nameModal.submit')}</span>
          </Button>
        </div>
      </ModalShell>
    </PageShell>
  );
}
