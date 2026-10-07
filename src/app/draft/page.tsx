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
import { sfx } from '@/lib/sfx';
import { AppIcon } from '@/components/ui/app-icon';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Key,
  Timer,
  Lightning,
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
  DraftBoardVisual,
} from '@/components/hub';

type DraftPendingAction =
  | { type: 'public_match' }
  | { type: 'create_private' };

export default function DraftHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const [nickname, setNickname] = useGuestNickname();

  const nameInputId = useId();
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<DraftPendingAction | null>(null);

  // Convex query: Live matchmaking queue counts for Draft
  const draftQueueSummary = useQuery(api.draft.queries.getPublicQueueSummary);
  // Convex mutations: Find or create public match, and create private duel
  const findPublicMatch = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createPrivateRoom = useMutation(api.draft.mutations.createDuelPrivateRoom);

  const waitingCount = draftQueueSummary?.waitingCount ?? 0;
  const queueReady = draftQueueSummary !== undefined;

  const handleStartPublicMatch = () => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('extratime_guestName') : null;
    if (saved) {
      void executePublicMatch(saved);
    } else {
      setPendingAction({ type: 'public_match' });
      setNickname(randomName());
      setShowNameModal(true);
    }
  };

  const handleCreatePrivate = () => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('extratime_guestName') : null;
    if (saved) {
      void executeCreatePrivate(saved);
    } else {
      setPendingAction({ type: 'create_private' });
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

  const executeCreatePrivate = async (managerName?: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const activeName = (managerName || nickname).trim() || randomName();
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

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    const action = pendingAction;
    setShowNameModal(false);

    if (action?.type === 'create_private') {
      await executeCreatePrivate(nickname.trim());
    } else {
      await executePublicMatch(nickname.trim());
    }
  };

  return (
    <GameHubShell
      gameId="draft"
      ariaTitle={`ExtraTime Draft - ${t('draftHub.badge')}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Title + Subtitle ── */}
      <div className="flex w-full shrink-0 flex-col items-center pt-0.5 text-center">
        <HubEyebrow text={t('draftHub.badge')} />
        <HubTitle
          title={t('draftHub.title')}
          subtitle={t('draftHub.description')}
        />
      </div>

      {/* ── Centerpiece: Tactical Draft Board (Same 240x240 frame as Snipe) ── */}
      <HubVisual>
        <DraftBoardVisual />
      </HubVisual>

      {/* ── Live Queue Pill: Aligned after visual in both LTR & RTL ── */}
      <QueuePill
        loading={!queueReady}
        waitingCount={waitingCount}
        loadingText={t('draftHub.liveLoading')}
        emptyText={t('draftHub.liveEmpty')}
        liveLabel={t('draftHub.liveLabel')}
        liveSuffix={t('draftHub.liveSuffix')}
      />

      {/* ── Bottom Section: Primary CTA + Secondary Cards + Rules Strip ── */}
      <div className="hub-zone-actions mt-3 sm:mt-5 flex w-full shrink-0 flex-col gap-2 sm:gap-2.5">
        {/* Primary Full-Width CTA: "PUBLIC MATCH" */}
        <PrimaryActionButton
          id="draft-public-match-btn"
          title={t('draftHub.publicMatch')}
          subtitle={t('draftHub.publicMatchSub')}
          loadingTitle={t('draftHub.findingMatch')}
          onClick={handleStartPublicMatch}
          loading={loading && pendingAction?.type !== 'create_private'}
          disabled={loading}
        />

        {/* Secondary Action Cards: "Private Room" & "Join with Code" */}
        <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
          {/* Card 1: Private Room / غرفة خاصة */}
          <SecondaryActionButton
            id="draft-private-room-btn"
            label={t('draftHub.privateRoom')}
            icon={Users}
            onClick={handleCreatePrivate}
            disabled={loading}
          />

          {/* Card 2: Join with Code / انضم بكود */}
          <SecondaryActionButton
            id="draft-join-room-link"
            label={t('draftHub.joinWithCode')}
            icon={Key}
            href="/join-room"
            disabled={loading}
          />
        </div>

        {/* Feature Rules Strip matching reference design: Hairline divider, 3 columns */}
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
      </div>

      {/* ── First-Time Manager Handle Modal Shell ── */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title={t('draftHub.nameModal.title')}
        subtitle={t('draftHub.nameModal.subtitle')}
        maxWidth="sm"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TextInput
                id={nameInputId}
                label={t('draftHub.nameModal.label')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('draftHub.nameModal.placeholder')}
                maxLength={24}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setNickname(randomName())}
              className="btn-haptic group text-muted mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-[var(--hub-accent)] hover:bg-[color-mix(in_srgb,var(--hub-accent)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2"
              title={t('draftHub.nameModal.randomize')}
              aria-label={t('draftHub.nameModal.randomize')}
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
                t('draftHub.nameModal.submit')
              )}
            </Button>
          </div>
        </form>
      </ModalShell>
    </GameHubShell>
  );
}
