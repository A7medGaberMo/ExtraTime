'use client';

import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Users,
  PlusCircle,
  SignIn,
  CircleNotch,
  Shuffle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';

type ActionPayload =
  | { type: 'public_match' }
  | { type: 'create_private' }
  | { type: 'join_code'; code: string };

function DraftHubContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const { t, lang } = useI18n();

  // Convex Mutations
  const findPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createPrivate = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const joinByCode = useMutation(api.draft.mutations.joinDraftByCode);

  // Convex Queries
  const queueSummary = useQuery(api.draft.queries.getPublicQueueSummary);

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);

  const [nickname, setNickname] = useGuestNickname();
  const waitingCount = queueSummary?.waitingCount ?? 0;

  function triggerAction(action: ActionPayload) {
    const saved = localStorage.getItem('extratime_guestName');
    if (saved) {
      void executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(action: ActionPayload) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId(nickname.trim() || randomName());
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      switch (action.type) {
        case 'public_match': {
          const res = await findPublic({ guestId, sessionToken });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
        case 'create_private': {
          const res = await createPrivate({ hostId: guestId, sessionToken });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
        case 'join_code': {
          const res = await joinByCode({
            guestId,
            sessionToken,
            code: action.code,
          });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
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
    <article className="animate-fade-in mx-auto flex w-full max-w-4xl select-none flex-col items-center gap-2 sm:gap-2.5 py-0.5 sm:py-1 px-1.5 sm:px-3">
      {/* ── 1. CLEAN APPLE HEADER ────────────────────────────────────── */}
      <header className="relative w-full space-y-0.5 text-center overflow-hidden mb-4">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[120px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-game-accent/10 blur-[70px]" />

        <div className="relative space-y-0.5">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight mt-6">
            {lang === 'ar' ? (
              <>استوديو <span className="text-game-accent">اكسترا درافت</span></>
            ) : (
              <>Pro Draft <span className="text-game-accent">Studio</span></>
            )}
          </h1>
          <p className="mx-auto max-w-md text-[10.5px] sm:text-xs font-normal leading-relaxed text-muted">
            {lang === 'ar'
              ? 'تحدى منافسيك في ديربي درافت ملحمي.'
              : 'Challenge your rivals in an epic 1v1 draft showdown.'}
          </p>
        </div>
      </header>

      {/* 1v1 PVP DUELS (ZERO-SCROLL COMPACT) */}
      <section className="w-full max-w-2xl space-y-2 pt-0.5">
        {/* Public Matchmaking Banner */}
        <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 border border-game-accent/20 mt-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-game-accent/40 bg-game-accent/15 text-game-accent p-2">
              <AppIcon icon={Users} size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xs sm:text-[13px] font-bold text-white truncate">
                {lang === 'ar' ? 'البحث عن منافس أونلاين' : 'Public Matchmaking'}
              </h3>
              <p className="text-[10px] text-muted truncate">
                {lang === 'ar' ? 'ديربي مباشر مع لاعب عشوائي' : 'Duel a random online rival in real time'}
              </p>
            </div>
          </div>

          <Button
            variant="gold"
            size="sm"
            disabled={loading}
            onClick={() => triggerAction({ type: 'public_match' })}
            className="shrink-0 rounded-xl h-8 px-3 text-xs font-bold text-game-on-accent shadow-sm"
          >
            {waitingCount > 0
              ? `${waitingCount} waiting`
              : lang === 'ar' ? 'دخول البحث' : 'Enter Match'}
          </Button>
        </div>

        {/* Row 2: Private Room + Join by Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl space-y-2 border border-game-accent/15">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-foreground">
                <AppIcon icon={PlusCircle} size={15} weight="bold" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xs font-bold text-white truncate">
                  {lang === 'ar' ? 'غرفة خاصة' : 'Private Room'}
                </h3>
                <p className="text-[9.5px] text-muted truncate">
                  {lang === 'ar' ? 'شارك الكود مع صديق' : 'Create room code'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              disabled={loading}
              onClick={() => triggerAction({ type: 'create_private' })}
              className="rounded-xl h-8 text-[11px] font-bold hover:border-game-accent/40 mt-3"
            >
              {lang === 'ar' ? 'إنشاء غرفة خاصة' : 'Create Room'}
            </Button>
          </div>

          <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl space-y-2 border border-game-accent/15">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-foreground">
                <AppIcon icon={SignIn} size={15} weight="bold" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xs font-bold text-white truncate">
                  {lang === 'ar' ? 'انضمام بكود' : 'Join by Code'}
                </h3>
                <p className="text-[9.5px] text-muted truncate">
                  {lang === 'ar' ? 'أدخل كود صديقك' : 'Enter 6-char PIN'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              <TextInput
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="CODE"
                className="font-stats tracking-widest text-center uppercase font-bold !py-1 text-xs"
              />
              <Button
                variant="gold"
                size="sm"
                disabled={loading || roomCodeInput.trim().length !== 6}
                onClick={() => triggerAction({ type: 'join_code', code: roomCodeInput.trim() })}
                className="shrink-0 rounded-xl px-3 h-8 font-bold text-game-on-accent text-xs"
              >
                {lang === 'ar' ? 'انضم' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── GUEST NICKNAME MODAL ────────────────────────────────────── */}
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
            <span className="font-stats text-xs text-muted">{nickname.length}/18</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNameModal(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button
              variant="gold"
              onClick={handleModalSubmit}
              disabled={loading || !nickname.trim()}
              loading={loading}
              className="rounded-xl font-bold"
            >
              {loading ? t('home.nameModal.finding') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </ModalShell>
    </article>
  );
}

export default function DraftHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-game-accent animate-spin" />
          <span className="font-stats text-xs font-bold uppercase tracking-widest text-muted">
            Loading Pro Draft...
          </span>
        </div>
      }
    >
      <DraftHubContent />
    </Suspense>
  );
}
