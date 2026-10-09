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
import { sfx } from '@/lib/sfx';
import {
  Users,
  Key,
  Timer,
  Lightning,
  UsersFour,
} from '@phosphor-icons/react';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  QueuePill,
  PrimaryActionButton,
  SecondaryActionButton,
  RulesStrip,
  DraftBoardVisual,
} from '@/components/hub';

export default function DraftHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const [nickname] = useGuestNickname();

  const [loading, setLoading] = useState(false);

  // Convex query: Live matchmaking queue counts for Draft
  const draftQueueSummary = useQuery(api.draft.queries.getPublicQueueSummary);
  // Convex mutations: Find or create public match, and create private duel
  const findPublicMatch = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createPrivateRoom = useMutation(api.draft.mutations.createDuelPrivateRoom);

  const waitingCount = draftQueueSummary?.waitingCount ?? 0;
  const queueReady = draftQueueSummary !== undefined;

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

      const result = await findPublicMatch({
        guestId,
        sessionToken: actionSessionToken,
      });

      sfx.kickoff();
      router.push(`/draft/${result.gameId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Matchmaking failed. Please try again.', 'error');
      setLoading(false);
    }
  };

  const handleCreatePrivate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const activeName = (nickname || '').trim() || randomName();
      const guestId = await ensureGuestId(activeName);
      const actionSessionToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      const result = await createPrivateRoom({
        hostId: guestId,
        sessionToken: actionSessionToken,
      });

      sfx.kickoff();
      router.push(`/draft/${result.gameId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not create private room. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <GameHubShell
      gameId="draft"
      ariaTitle={`ExtraTime Draft - ${t('draftHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Title + Subtitle ── */}
      <HubEyebrow text={t('draftHub.badge')} />
      <HubTitle
        title={t('draftHub.title')}
        subtitle={t('draftHub.description')}
      />

      {/* ── Centerpiece: Tactical Draft Board with 2px outer timer arc ── */}
      <HubVisual showTimerArc>
        <DraftBoardVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Exactly 8px gap below visual frame ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('draftHub.liveLoading')}
        emptyText={t('draftHub.liveEmpty')}
        liveLabel={t('draftHub.liveLabel')}
        liveSuffix={t('draftHub.liveSuffix')}
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
          id="draft-public-match-btn"
          title={t('draftHub.publicMatch')}
          subtitle={t('draftHub.publicMatchSub')}
          loadingTitle={t('draftHub.findingMatch')}
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
          id="draft-private-room-btn"
          label={t('draftHub.privateRoom')}
          icon={Users}
          onClick={handleCreatePrivate}
          disabled={loading}
        />

        <SecondaryActionButton
          id="draft-join-room-link"
          label={t('draftHub.joinWithCode')}
          icon={Key}
          href="/join-room"
          disabled={loading}
        />
      </div>

      {/* ── Flexible Space: The ONLY flexible gap on the page ── */}
      <div className="flex-1 min-h-[8px] w-full" aria-hidden="true" />

      {/* ── Feature Rules Strip: Pinned to bottom with safe-area padding ── */}
      <RulesStrip
        items={[
          {
            icon: Timer,
            title: t('draftHub.features.turnPick'),
            subtitle: t('draftHub.features.turnPickSub'),
          },
          {
            icon: Lightning,
            title: t('draftHub.features.boostChemistry'),
            subtitle: t('draftHub.features.boostChemistrySub'),
          },
          {
            icon: UsersFour,
            title: t('draftHub.features.buildSquad'),
            subtitle: t('draftHub.features.buildSquadSub'),
          },
        ]}
      />
    </GameHubShell>
  );
}
