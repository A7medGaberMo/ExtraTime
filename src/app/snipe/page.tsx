'use client';

import React, { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { AppIcon } from '@/components/ui/app-icon';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Vault,
  LockKey,
  Target,
  UsersFour,
  CircleNotch,
  Shuffle,
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
  SnipeRadarVisual,
} from '@/components/hub';

export default function SnipeHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const [nickname, setNickname] = useGuestNickname();

  const nameInputId = useId();
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  // Convex query: Live matchmaking queue counts
  const snipeQueueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  // Convex mutation: Find or create public 1v1 Snipe match
  const findSnipeMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);

  // Extract waiting count from active queue or total fresh rooms
  const waitingCount = snipeQueueSummary
    ? (snipeQueueSummary.queues?.['ACTIVE']?.[11] ?? snipeQueueSummary.totalWaiting ?? 0)
    : 0;
  const queueReady = snipeQueueSummary !== undefined;

  const handleStartPublicMatch = () => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('extratime_guestName') : null;
    if (saved) {
      void executePublicMatch(saved);
    } else {
      setNickname(randomName());
      setShowNameModal(true);
    }
  };

  const executePublicMatch = async (managerName?: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const activeName = (managerName || nickname).trim() || randomName();
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

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setShowNameModal(false);
    await executePublicMatch(nickname.trim());
  };

  return (
    <GameHubShell
      gameId="snipe"
      ariaTitle={`ExtraTime Snipe - ${t('snipeHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
      <div className="flex w-full shrink-0 flex-col items-center pt-0.5 text-center">
        <HubEyebrow text={t('snipeHub.badge')} />
        <HubTitle
          title={t('snipeHub.title')}
          subtitle={t('snipeHub.description')}
        />
      </div>

      {/* ── Centerpiece: Living Radar / Scope Centerpiece ── */}
      <HubVisual>
        <SnipeRadarVisual />
      </HubVisual>

      {/* ── Live queue pill, aligned after the radar in both writing directions. ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('snipeHub.liveLoading')}
        emptyText={t('snipeHub.liveEmpty')}
        liveLabel={t('snipeHub.liveLabel')}
        liveSuffix={t('snipeHub.liveSuffix')}
      />

      {/* ── Bottom Section: Primary CTA + Secondary Cards + Feature Strip ── */}
      <div className="hub-zone-actions mt-3 sm:mt-5 flex w-full shrink-0 flex-col gap-2 sm:gap-2.5">
        {/* Primary Full-Width CTA: "مباراة عامة" */}
        <PrimaryActionButton
          id="snipe-public-match-btn"
          title={t('snipeHub.publicMatch')}
          subtitle={t('snipeHub.publicMatchSub')}
          loadingTitle={t('snipeHub.findingMatch')}
          onClick={handleStartPublicMatch}
          loading={loading}
          disabled={loading}
        />

        {/* Secondary Action Cards: "غرفة خاصة" & "ادخل بالكود" */}
        <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
          {/* Card 1: Private Room / غرفة خاصة */}
          <SecondaryActionButton
            id="snipe-private-room-link"
            label={t('snipeHub.privateRoom')}
            icon={Users}
            href="/create-room?mode=snipe"
            disabled={loading}
          />

          {/* Card 2: Join with Code / ادخل بالكود */}
          <SecondaryActionButton
            id="snipe-join-room-link"
            label={t('snipeHub.joinWithCode')}
            icon={Vault}
            href="/join-room"
            disabled={loading}
          />
        </div>

        {/* Feature Strip matching reference design: Hairline top border, 3 columns */}
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
      </div>

      {/* ── First-Time Manager Handle Modal Shell ── */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title={t('snipeHub.nameModal.title')}
        subtitle={t('snipeHub.nameModal.subtitle')}
        maxWidth="sm"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TextInput
                id={nameInputId}
                label={t('snipeHub.nameModal.label')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('snipeHub.nameModal.placeholder')}
                maxLength={24}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setNickname(randomName())}
              className="btn-haptic group text-muted mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-[var(--hub-accent)] hover:bg-[color-mix(in_srgb,var(--hub-accent)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2"
              title={t('snipeHub.nameModal.randomize')}
              aria-label={t('snipeHub.nameModal.randomize')}
            >
              <AppIcon
                icon={Shuffle}
                size={18}
                className="transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none"
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNameModal(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!nickname.trim() || loading}
              className="font-bold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-105"
              style={{
                background:
                  'linear-gradient(to right, var(--hub-accent-light), var(--hub-accent) 50%, var(--hub-accent-deep))',
                boxShadow:
                  '0 0 20px color-mix(in srgb, var(--hub-accent) 35%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
              }}
            >
              {loading ? (
                <AppIcon icon={CircleNotch} size={16} className="animate-spin" />
              ) : (
                t('snipeHub.nameModal.submit')
              )}
            </Button>
          </div>
        </form>
      </ModalShell>
    </GameHubShell>
  );
}
