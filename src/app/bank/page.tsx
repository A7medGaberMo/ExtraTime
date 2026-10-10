'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import { Users, Key, TrendUp, Vault, Timer } from '@phosphor-icons/react';
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

  const { ensureGuestId } = useGuestSession();
  const [nickname] = useGuestNickname();

  const createSolo = useMutation(api.bank.mutations.createSoloGame);
  const createDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);
  const findPublicMatch = useMutation(api.bank.mutations.findOrCreatePublicMatch);

  const queueStats = useQuery(api.bank.queries.getPublicQueueSummary);

  const [loadingAction, setLoadingAction] = useState<'public' | 'solo' | 'duel' | null>(null);

  const waitingCount = queueStats?.waitingCount ?? 0;
  const queueReady = queueStats !== undefined;

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
      <HubEyebrow text={t('bankHub.badge')} />
      <HubTitle
        title={t('bankHub.title')}
        subtitle={t('bankHub.description')}
      />

      {/* ── Centerpiece: Living Bank Vault Scope Centerpiece ── */}
      <HubVisual>
        <BankVaultVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Exactly 8px gap below visual frame ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('bankHub.liveLoading')}
        emptyText={t('bankHub.liveEmpty')}
        liveLabel={t('bankHub.liveLabel')}
        liveSuffix={t('bankHub.liveSuffix')}
      />

      {/* ── Row 1: Public Match (flex-1) + Solo Tile (fixed 76px) (Fixed 68px) ── */}
      <div
        data-hub-row-1
        className="flex w-full shrink-0 items-center gap-2.5 sm:gap-3"
        style={{
          height: 'var(--hub-row1-height)',
          marginBottom: 'var(--hub-gap-row1-row2)',
        }}
      >
        <PrimaryActionButton
          id="bank-public-match-btn"
          title={t('bankHub.publicMatch')}
          subtitle={t('bankHub.publicMatchSub')}
          loadingTitle={t('bankHub.findingMatch')}
          onClick={handleStartPublicMatch}
          loading={loadingAction === 'public'}
          disabled={loadingAction !== null}
          containerClassName="flex-1 min-w-0 h-full"
        />

        <HubSoloButton
          id="bank-solo-btn"
          title={t('bankHub.solo')}
          onClick={handleStartSolo}
          loading={loadingAction === 'solo'}
          disabled={loadingAction !== null}
        />
      </div>

      {/* ── Row 2: Secondary Cards (Fixed 72px) ── */}
      <div
        data-hub-row-2
        className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:gap-3"
        style={{
          height: 'var(--hub-row2-height)',
          marginBottom: 'var(--hub-gap-row2-rules)',
        }}
      >
        <SecondaryActionButton
          id="bank-private-room-btn"
          label={t('bankHub.privateRoom')}
          icon={Users}
          onClick={handleCreatePrivate}
          disabled={loadingAction !== null}
        />

        <SecondaryActionButton
          id="bank-join-code-link"
          label={t('bankHub.joinWithCode')}
          icon={Key}
          href="/join-room"
          disabled={loadingAction !== null}
        />
      </div>

      {/* ── Rules Strip: Pinned to bottom with safe-area padding ── */}
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
    </GameHubShell>
  );
}
