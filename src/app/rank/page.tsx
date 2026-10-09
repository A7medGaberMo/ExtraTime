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
  RankSoloButton,
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
      <div className="flex w-full shrink-0 flex-col items-center pt-0.5 text-center">
        <HubEyebrow text={t('rankHub.badge')} />
        <HubTitle
          title={t('rankHub.title')}
          subtitle={t('rankHub.description')}
        />
      </div>

      {/* ── Centerpiece: Living Ranking Scope Centerpiece (Same 240x240 frame as Snipe & Draft) ── */}
      <HubVisual>
        <RankChartVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Aligned after visual in both LTR & RTL ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('rankHub.liveLoading')}
        emptyText={t('rankHub.liveEmpty')}
        liveLabel={t('rankHub.liveLabel')}
        liveSuffix={t('rankHub.liveSuffix')}
      />

      {/* ── Bottom Section: 4 Action Buttons (2 & 2) + Feature Strip ── */}
      <div className="hub-zone-actions mt-3 sm:mt-5 flex w-full shrink-0 flex-col gap-2 sm:gap-2.5">
        {/* Row 1 ("Play Now"): 60% Public Match + 40% Solo */}
        <div className="hub-actions-row-1 flex w-full items-stretch gap-2.5 sm:gap-3 h-[60px] sm:h-[68px]">
          <PrimaryActionButton
            id="rank-public-match-btn"
            title={t('rankHub.publicMatch')}
            subtitle={t('rankHub.publicMatchSub')}
            onClick={() => handleOpenSheet('quick')}
            disabled={loading}
            containerClassName="basis-[60%] flex-[3_3_0%] min-w-0 h-full"
            className="h-full sm:h-full rounded-[22px] sm:rounded-[24px] px-3 sm:px-4"
          />

          <RankSoloButton
            id="rank-solo-btn"
            title={t('rankHub.playSolo')}
            subtitle={t('rankHub.playSoloSub')}
            onClick={() => handleOpenSheet('solo')}
            disabled={loading}
            className="basis-[40%] flex-[2_2_0%] min-w-0 h-full rounded-[22px] sm:rounded-[24px]"
          />
        </div>

        {/* Row 2 ("With Friends"): Private Room + Join with Code (2 equal columns) */}
        <div className="hub-actions-row-2 grid w-full grid-cols-2 gap-2.5 sm:gap-3">
          {/* Card 1: Private Room / غرفة خاصة */}
          <SecondaryActionButton
            id="rank-private-room-btn"
            label={t('rankHub.privateRoom')}
            icon={Users}
            onClick={() => handleOpenSheet('duel_create')}
            disabled={loading}
          />

          {/* Card 2: Join with Code / انضم بكود */}
          <SecondaryActionButton
            id="rank-join-code-btn"
            label={t('rankHub.joinWithCode')}
            icon={Vault}
            onClick={() => handleOpenSheet('join')}
            disabled={loading}
          />
        </div>

        {/* Rules Strip (3 Columns): Sort cards, Beat the clock, Distance scoring */}
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
      </div>

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
