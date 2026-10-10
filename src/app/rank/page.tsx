'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { Users, Vault, ArrowsDownUp, Timer, Target } from '@phosphor-icons/react';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  QueuePill,
  PrimaryActionButton,
  SecondaryActionButton,
  RulesStrip,
  RankChartVisual,
  HubSoloButton,
  RankSetupSheet,
  type RankSetupMode,
} from '@/components/hub';

export default function RankHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  // Convex mutations
  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSolo = useMutation(api.rank.mutations.createSoloGame);
  const createDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const joinDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);
  const findPublicMatch = useMutation(api.rank.mutations.findOrCreatePublicMatch);

  // Convex live queue summary query
  const queueStats = useQuery(api.rank.queries.getPublicQueueSummary);
  const queueReady = queueStats !== undefined;
  const waitingCount = (queueStats?.waiting3 ?? 0) + (queueStats?.waiting5 ?? 0);

  // Sheet interaction state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<RankSetupMode>('quick');
  const [loading, setLoading] = useState(false);

  // Helper to ensure guest user identity and tokens
  async function ensureGuestUser(managerName: string): Promise<Id<'guestUsers'>> {
    const name = managerName.trim() || randomName();
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

  // Open the bottom setup sheet in the selected mode
  const handleOpenSheet = (mode: RankSetupMode) => {
    setSheetMode(mode);
    setSheetOpen(true);
  };

  // Execute the game start mutation with the configured parameters
  const handleExecuteAction = async ({
    nickname,
    roundCount,
    joinCode,
  }: {
    nickname: string;
    roundCount: 3 | 5;
    joinCode?: string;
  }) => {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestUser(nickname);
      const sessionToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      if (sheetMode === 'solo') {
        const result = await createSolo({ guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (sheetMode === 'quick') {
        const result = await findPublicMatch({ guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (sheetMode === 'duel_create') {
        const result = await createDuel({ hostId: guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else if (sheetMode === 'join') {
        if (!joinCode || joinCode.length !== 6) {
          throw new Error(t('rankHub.sheet.invalidCode'));
        }
        const result = await joinDuel({ guestId, sessionToken, code: joinCode });
        router.push(`/rank/${result.gameId}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast(e.message || 'Action failed', 'error');
      setLoading(false);
    }
  };

  return (
    <GameHubShell
      gameId="rank"
      ariaTitle={`ExtraTime Rank - ${t('rankHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Title + Subtitle ── */}
      <HubEyebrow text={t('rankHub.badge')} />
      <HubTitle
        title={t('rankHub.title')}
        subtitle={t('rankHub.description')}
      />

      {/* ── Centerpiece: Living Ranking Scope with 2px outer timer arc ── */}
      <HubVisual showTimerArc>
        <RankChartVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Exactly 8px gap below visual frame ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('rankHub.liveLoading')}
        emptyText={t('rankHub.liveEmpty')}
        liveLabel={t('rankHub.liveLabel')}
        liveSuffix={t('rankHub.liveSuffix')}
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
          id="rank-public-match-btn"
          title={t('rankHub.publicMatch')}
          subtitle={t('rankHub.publicMatchSub')}
          onClick={() => handleOpenSheet('quick')}
          disabled={loading}
          containerClassName="flex-1 min-w-0 h-full"
        />

        <HubSoloButton
          id="rank-solo-btn"
          title={t('rankHub.playSolo')}
          onClick={() => handleOpenSheet('solo')}
          disabled={loading}
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
          id="rank-private-room-btn"
          label={t('rankHub.privateRoom')}
          icon={Users}
          onClick={() => handleOpenSheet('duel_create')}
          disabled={loading}
        />

        <SecondaryActionButton
          id="rank-join-code-btn"
          label={t('rankHub.joinWithCode')}
          icon={Vault}
          onClick={() => handleOpenSheet('join')}
          disabled={loading}
        />
      </div>

      {/* ── Rules Strip: Pinned to bottom with safe-area padding ── */}
      <RulesStrip
        items={[
          {
            icon: ArrowsDownUp,
            title: t('rankHub.features.rankCards'),
            subtitle: t('rankHub.features.rankCardsSub'),
          },
          {
            icon: Timer,
            title: t('rankHub.features.beatClock'),
            subtitle: t('rankHub.features.beatClockSub'),
          },
          {
            icon: Target,
            title: t('rankHub.features.distanceScore'),
            subtitle: t('rankHub.features.distanceScoreSub'),
          },
        ]}
      />

      {/* ── Setup Bottom Sheet (Holds mode config, rounds, rules, and PIN) ── */}
      <RankSetupSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        mode={sheetMode}
        onConfirm={handleExecuteAction}
        loading={loading}
      />
    </GameHubShell>
  );
}
