'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import { Users, Key, Trophy, Flame, TrendUp, Vault, Timer } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  QueuePill,
  PrimaryActionButton,
  SecondaryActionButton,
  RulesStrip,
  BankVaultVisual,
  HubSoloButton,
} from '@/components/hub';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';

export default function BankHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const { guestId, ensureGuestId } = useGuestSession();
  const [nickname] = useGuestNickname();

  const createSolo = useMutation(api.bank.mutations.createSoloGame);
  const createDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);
  const findPublicMatch = useMutation(api.bank.mutations.findOrCreatePublicMatch);

  const queueStats = useQuery(api.bank.queries.getPublicQueueSummary);
  const personalBest = useQuery(
    api.bank.queries.getPersonalBest,
    guestId ? { guestId } : 'skip',
  );

  const [loadingAction, setLoadingAction] = useState<'public' | 'solo' | 'duel' | null>(null);

  const waitingCount = queueStats?.waitingCount ?? 0;
  const queueReady = queueStats !== undefined;

  const hasStats =
    personalBest && (personalBest.personalBestScore > 0 || personalBest.highestStreak > 0);

  // Helper to ensure guest id silently without modal/name UI
  const getEnsuredIdentity = async () => {
    const activeName = (nickname || '').trim() || randomName();
    const ensuredId = await ensureGuestId(activeName);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('extratime_sessionToken') || undefined
        : undefined;
    return { guestId: ensuredId, token };
  };

  // Row 1 Action 1: Public Match
  const handleStartPublicMatch = async () => {
    if (loadingAction) return;
    setLoadingAction('public');
    try {
      const { guestId: ensuredId, token } = await getEnsuredIdentity();
      const res = await findPublicMatch({ guestId: ensuredId, sessionToken: token });
      router.push(`/bank/${res.gameId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Matchmaking failed';
      toast({ title: 'Error', message: msg, type: 'error' });
      setLoadingAction(null);
    }
  };

  // Row 1 Action 2: Solo Challenge
  const handleStartSolo = async () => {
    if (loadingAction) return;
    setLoadingAction('solo');
    try {
      const { guestId: ensuredId, token } = await getEnsuredIdentity();
      const res = await createSolo({ guestId: ensuredId, sessionToken: token });
      router.push(`/bank/${res.gameId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start solo game';
      toast({ title: 'Error', message: msg, type: 'error' });
      setLoadingAction(null);
    }
  };

  // Row 2 Action 1: Private Room
  const handleCreatePrivate = async () => {
    if (loadingAction) return;
    setLoadingAction('duel');
    try {
      const { guestId: ensuredId, token } = await getEnsuredIdentity();
      const res = await createDuel({ hostId: ensuredId, sessionToken: token });
      router.push(`/bank/${res.gameId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      toast({ title: 'Error', message: msg, type: 'error' });
      setLoadingAction(null);
    }
  };

  return (
    <GameHubShell
      gameId="bank"
      ariaTitle={`ExtraTime Bank - ${t('bankHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
      <div className="flex w-full shrink-0 flex-col items-center pt-0.5 text-center">
        <HubEyebrow text={t('bankHub.badge')} />
        <HubTitle
          title={t('bankHub.title')}
          subtitle={t('bankHub.description')}
        />
      </div>

      {/* ── Centerpiece: Living Bank Vault Scope Centerpiece (240x240 frame) ── */}
      <HubVisual>
        <BankVaultVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Aligned after visual in both LTR & RTL ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('bankHub.liveLoading')}
        emptyText={t('bankHub.liveEmpty')}
        liveLabel={t('bankHub.liveLabel')}
        liveSuffix={t('bankHub.liveSuffix')}
      />

      {/* ── Bottom Section: 4 Action Buttons (2 & 2) + Optional Stats + Rules Strip ── */}
      <div className="hub-zone-actions mt-3 sm:mt-5 flex w-full shrink-0 flex-col gap-2 sm:gap-2.5">
        {/* Row 1 ("Play Now"): 60% Public Match + 40% Solo (Like Rank) */}
        <div className="hub-actions-row-1 flex w-full items-stretch gap-2.5 sm:gap-3 h-[60px] sm:h-[68px]">
          <PrimaryActionButton
            id="bank-public-match-btn"
            title={t('bankHub.publicMatch')}
            subtitle={t('bankHub.publicMatchSub')}
            loadingTitle={t('bankHub.findingMatch')}
            onClick={handleStartPublicMatch}
            loading={loadingAction === 'public'}
            disabled={loadingAction !== null}
            containerClassName="basis-[60%] flex-[3_3_0%] min-w-0 h-full"
            className="h-full sm:h-full rounded-[22px] sm:rounded-[24px] px-3 sm:px-4"
          />

          <HubSoloButton
            id="bank-solo-btn"
            title={t('bankHub.playSolo')}
            subtitle={t('bankHub.playSoloSub')}
            onClick={handleStartSolo}
            loading={loadingAction === 'solo'}
            disabled={loadingAction !== null}
            className="basis-[40%] flex-[2_2_0%] min-w-0 h-full rounded-[22px] sm:rounded-[24px]"
          />
        </div>

        {/* Row 2 ("With Friends"): Private Room + Join with Code (2 equal columns) */}
        <div className="hub-actions-row-2 grid w-full grid-cols-2 gap-2.5 sm:gap-3">
          {/* Card 1: Private Room / غرفة خاصة */}
          <SecondaryActionButton
            id="bank-private-room-btn"
            label={t('bankHub.privateRoom')}
            icon={Users}
            onClick={handleCreatePrivate}
            disabled={loadingAction !== null}
          />

          {/* Card 2: Join with Code / ادخل بالكود */}
          <SecondaryActionButton
            id="bank-join-code-link"
            label={t('bankHub.joinWithCode')}
            icon={Key}
            href="/join-room"
            disabled={loadingAction !== null}
          />
        </div>

        {/* Optional Stats Line between Row 2 and RulesStrip (only viewport height >= 760px and score > 0) */}
        {hasStats && (
          <div className="hidden [@media(min-height:760px)]:flex items-center justify-center gap-3 py-0.5 text-[11px] sm:text-xs font-medium text-white/60">
            {personalBest.personalBestScore > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400/90">
                <AppIcon icon={Trophy} size={13} weight="fill" />
                {t('bankHub.stats.bestScore', {
                  score: personalBest.personalBestScore.toLocaleString(),
                })}
              </span>
            )}
            {personalBest.personalBestScore > 0 && personalBest.highestStreak > 0 && (
              <span className="size-1 rounded-full bg-white/20" />
            )}
            {personalBest.highestStreak > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--hub-accent)]">
                <AppIcon icon={Flame} size={13} weight="fill" />
                {t('bankHub.stats.highestStreak', {
                  streak: personalBest.highestStreak,
                })}
              </span>
            )}
          </div>
        )}

        {/* Rules Strip (3 Columns): Clean without sheet chip */}
        <RulesStrip
          items={[
            {
              icon: TrendUp,
              title: t('bankHub.features.doubleOrNothing'),
              subtitle: t('bankHub.features.doubleOrNothingSub'),
            },
            {
              icon: Vault,
              title: t('bankHub.features.bankIt'),
              subtitle: t('bankHub.features.bankItSub'),
            },
            {
              icon: Timer,
              title: t('bankHub.features.risingPressure'),
              subtitle: t('bankHub.features.risingPressureSub'),
            },
          ]}
        />
      </div>
    </GameHubShell>
  );
}
