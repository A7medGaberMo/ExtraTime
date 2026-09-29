'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import { HomeLobby } from '@/components/home/home-lobby';
import type { GameModeId } from '@/components/home/home-lobby';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { Shuffle } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'EGYPT' | 'ICONS';

type HomeAction = {
  mode: GameModeId;
  variant: 'solo' | 'public';
};

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const { ensureGuestId } = useGuestSession();

  // Convex Mutations
  const findSnipeMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const createSoloRank = useMutation(api.rank.mutations.createSoloGame);
  const findRankMatch = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const findDraftMatch = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createSoloBank = useMutation(api.bank.mutations.createSoloGame);
  const findBankMatch = useMutation(api.bank.mutations.findOrCreatePublicMatch);

  // Convex Queries (Lightweight queue summaries only)
  const snipeQueueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const rankQueueSummary = useQuery(api.rank.queries.getPublicQueueSummary);
  const draftQueueSummary = useQuery(api.draft.queries.getPublicQueueSummary);
  const bankQueueSummary = useQuery(api.bank.queries.getPublicQueueSummary);

  const poolMode: PoolMode = 'ACTIVE';
  const matchSize = 11;
  const rankRounds = 3;

  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<HomeAction | null>(null);
  const [nickname, setNickname] = useGuestNickname();

  const waitingSnipe = snipeQueueSummary?.queues[poolMode]?.[11] ?? 0;
  const waitingRank = rankQueueSummary?.waiting3 ?? 0;
  const waitingDraft = draftQueueSummary?.waitingCount ?? 0;
  const waitingBank = bankQueueSummary?.waitingCount ?? 0;

  function triggerActionWithName(mode: GameModeId, variant: 'solo' | 'public' = 'public') {
    const saved = localStorage.getItem('extratime_guestName');
    const action: HomeAction = { mode, variant };
    if (saved) {
      void executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(action: HomeAction) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId(nickname.trim() || randomName());
      const actionSessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      if (action.mode === 'snipe') {
        const result = await findSnipeMatch({
          userId: guestId,
          sessionToken: actionSessionToken,
          matchSize,
          poolMode,
        });
        router.push(`/auction/${result.roomId}`);
      } else if (action.mode === 'rank') {
        if (action.variant === 'solo') {
          const result = await createSoloRank({ guestId, sessionToken: actionSessionToken, roundCount: rankRounds });
          router.push(`/rank/${result.gameId}`);
        } else {
          const result = await findRankMatch({ guestId, sessionToken: actionSessionToken, roundCount: rankRounds });
          router.push(`/rank/${result.gameId}`);
        }
      } else if (action.mode === 'draft') {
        const result = await findDraftMatch({ guestId, sessionToken: actionSessionToken });
        router.push(`/draft/${result.gameId}`);
      } else if (action.mode === 'bank') {
        if (action.variant === 'solo') {
          const result = await createSoloBank({ guestId, sessionToken: actionSessionToken });
          router.push(`/bank/${result.gameId}`);
        } else {
          const result = await findBankMatch({ guestId, sessionToken: actionSessionToken });
          router.push(`/bank/${result.gameId}`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Action failed. Please try again.', 'error');
      setLoading(false);
    }
  }

  async function handleModalSubmit() {
    if (!pendingAction || !nickname.trim()) return;
    setShowNameModal(false);
    await executeAction(pendingAction);
  }

  return (
    <>
      <HomeLobby
        queueCounts={{
          snipe: waitingSnipe,
          rank: waitingRank,
          draft: waitingDraft,
          bank: waitingBank,
        }}
        onPlayMode={triggerActionWithName}
        loading={loading}
      />

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
                className="btn-haptic flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-colors hover:border-gold/50 hover:text-gold"
              >
                <AppIcon icon={Shuffle} size={18} weight="bold" />
              </button>
            }
          />

          <div className="flex items-center justify-end px-1">
            <span className="font-stats text-xs text-steel">{nickname.length}/18</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleModalSubmit}
            disabled={loading || !nickname.trim()}
            loading={loading}
            className="rounded-2xl"
          >
            {loading ? t('home.nameModal.finding') : t('common.confirm')}
          </Button>
        </div>
      </ModalShell>
    </>
  );
}
