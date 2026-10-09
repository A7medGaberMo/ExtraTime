'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { Users, Vault, LockKey, Target, UsersFour } from '@phosphor-icons/react';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  QueuePill,
  PrimaryActionButton,
  SecondaryActionButton,
  RulesStrip,
  SnipeRadarVisual,
} from '@/components/hub';

export default function SnipeHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const [nickname] = useGuestNickname();

  const [loading, setLoading] = useState(false);

  // Convex query: Live matchmaking queue counts
  const snipeQueueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  // Convex mutation: Find or create public 1v1 Snipe match
  const findSnipeMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);

  const waitingCount = snipeQueueSummary
    ? (snipeQueueSummary.queues?.['ACTIVE']?.[11] ?? snipeQueueSummary.totalWaiting ?? 0)
    : 0;
  const queueReady = snipeQueueSummary !== undefined;

  const handleStartPublicMatch = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const activeName = (nickname || '').trim() || randomName();
      const guestId = await ensureGuestId(activeName);
      const actionSessionToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      const result = await findSnipeMatch({
        userId: guestId,
        sessionToken: actionSessionToken,
        matchSize: 11,
        poolMode: 'ACTIVE',
      });

      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Matchmaking failed. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <GameHubShell
      gameId="snipe"
      ariaTitle={`ExtraTime Snipe - ${t('snipeHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
      <HubEyebrow text={t('snipeHub.badge')} />
      <HubTitle
        title={t('snipeHub.title')}
        subtitle={t('snipeHub.description')}
      />

      {/* ── Centerpiece: Living Radar / Scope Centerpiece ── */}
      <HubVisual>
        <SnipeRadarVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Exactly 8px gap below visual frame ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('snipeHub.liveLoading')}
        emptyText={t('snipeHub.liveEmpty')}
        liveLabel={t('snipeHub.liveLabel')}
        liveSuffix={t('snipeHub.liveSuffix')}
      />

      {/* ── Row 1: Full-Width Primary Action (Fixed 68px) ── */}
      <div
        data-hub-row-1
        className="flex w-full shrink-0 items-center"
        style={{
          height: 'var(--hub-row1-height)',
          marginBottom: 'var(--hub-gap-row1-row2)',
        }}
      >
        <PrimaryActionButton
          id="snipe-public-match-btn"
          title={t('snipeHub.publicMatch')}
          subtitle={t('snipeHub.publicMatchSub')}
          loadingTitle={t('snipeHub.findingMatch')}
          onClick={handleStartPublicMatch}
          loading={loading}
          disabled={loading}
        />
      </div>

      {/* ── Row 2: Secondary Cards (Fixed 72px) ── */}
      <div
        data-hub-row-2
        className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:gap-3"
        style={{
          height: 'var(--hub-row2-height)',
        }}
      >
        <SecondaryActionButton
          id="snipe-private-room-link"
          label={t('snipeHub.privateRoom')}
          icon={Users}
          href="/create-room?mode=snipe"
          disabled={loading}
        />

        <SecondaryActionButton
          id="snipe-join-room-link"
          label={t('snipeHub.joinWithCode')}
          icon={Vault}
          href="/join-room"
          disabled={loading}
        />
      </div>

      {/* ── Flexible Space: The ONLY flexible gap on the page ── */}
      <div className="flex-1 min-h-[8px] w-full" aria-hidden="true" />

      {/* ── Rules Strip: Pinned to bottom with safe-area padding ── */}
      <RulesStrip
        items={[
          {
            icon: LockKey,
            title: t('snipeHub.features.secretBids'),
            subtitle: t('snipeHub.features.secretBidsSub'),
          },
          {
            icon: Target,
            title: t('snipeHub.features.readRoom'),
            subtitle: t('snipeHub.features.readRoomSub'),
          },
          {
            icon: UsersFour,
            title: t('snipeHub.features.buildSquad'),
            subtitle: t('snipeHub.features.buildSquadSub'),
          },
        ]}
      />
    </GameHubShell>
  );
}
