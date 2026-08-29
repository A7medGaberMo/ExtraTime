'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';
import { Trophy, Check, X, Crosshair } from '@phosphor-icons/react';
import { UserIdentity } from '@/components/ui/user-identity';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { sfx } from '@/lib/sfx';

export function IncomingInviteListener() {
  const router = useRouter();
  const { lang } = useI18n();
  const { ensureGuestId, sessionToken } = useGuestSession();
  const isGameplay = useIsGameplay();
  const viewer = useQuery(api.users.queries.viewer);

  const pendingInvite = useQuery(api.invites.queries.getMyPendingInvite);
  const acceptInviteMutation = useMutation(api.invites.mutations.acceptMatchInvite);
  const declineInviteMutation = useMutation(api.invites.mutations.declineMatchInvite);
  const joinSnipeRoom = useMutation(api.rooms.mutations.join);
  const joinRankDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);

  const [isAccepting, setIsAccepting] = useState(false);
  const lastSoundInviteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingInvite && !isGameplay && pendingInvite.inviteId !== lastSoundInviteIdRef.current) {
      lastSoundInviteIdRef.current = pendingInvite.inviteId;
      sfx.cardFlip();
    }
  }, [pendingInvite, isGameplay]);

  if (!pendingInvite || isGameplay) return null;

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      sfx.kickoff();
      const activeName = viewer?.displayName || viewer?.username || 'Player';
      const guestId = await ensureGuestId(activeName);

      await acceptInviteMutation({ inviteId: pendingInvite.inviteId });

      if (pendingInvite.matchType === 'snipe') {
        await joinSnipeRoom({
          roomId: pendingInvite.targetId as Id<'rooms'>,
          guestId,
          sessionToken: sessionToken || undefined,
        });
        router.push(`/auction/${pendingInvite.targetId}`);
      } else {
        await joinRankDuel({
          code: pendingInvite.roomCode,
          guestId,
          sessionToken: sessionToken || undefined,
        });
        router.push(`/rank/${pendingInvite.targetId}`);
      }
    } catch {
      // Fallback navigation in case of rejoin / already active
      if (pendingInvite.matchType === 'snipe') {
        router.push(`/auction/${pendingInvite.targetId}`);
      } else {
        router.push(`/rank/${pendingInvite.targetId}`);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await declineInviteMutation({ inviteId: pendingInvite.inviteId });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none animate-slide-up">
      <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 rounded-3xl border border-lime/40 bg-slate-950/98 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl max-w-lg w-full ring-2 ring-lime/20">
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          <div className="relative">
            <UserIdentity
              nickname={pendingInvite.senderDisplayName}
              avatarSeed={pendingInvite.senderAvatarSeed}
              showAvatarOnly
              size="md"
            />
            <div className="absolute -top-1 -start-1 flex h-5 w-5 items-center justify-center rounded-full bg-lime text-slate-950 shadow-md">
              <AppIcon
                icon={pendingInvite.matchType === 'snipe' ? Crosshair : Trophy}
                size={12}
                weight="bold"
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold text-white font-stats">
                {pendingInvite.senderDisplayName}
              </span>
              <span className="rounded-full bg-lime/15 border border-lime/30 px-2 py-0.2 text-[10px] font-bold text-lime font-stats uppercase">
                {pendingInvite.matchType === 'snipe' ? 'Snipe Match' : 'Rank Duel'}
              </span>
            </div>
            <p className="text-xs text-steel mt-0.5">
              {lang === 'ar'
                ? `أرسل لك دعوة تحدي مباشر (${pendingInvite.roomCode})`
                : `Challenged you to a live match (${pendingInvite.roomCode})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="btn-haptic flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-steel hover:text-rose-400 hover:border-rose-500/30 transition-all font-stats cursor-pointer"
          >
            <AppIcon icon={X} size={15} weight="bold" />
            <span>{lang === 'ar' ? 'رفض' : 'Decline'}</span>
          </button>

          <button
            type="button"
            disabled={isAccepting}
            onClick={handleAccept}
            className="btn-haptic flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 transition-all font-stats shadow-glow-lime disabled:opacity-50 cursor-pointer"
          >
            <AppIcon icon={Check} size={15} weight="bold" />
            <span>{isAccepting ? 'Starting...' : (lang === 'ar' ? 'قبول وبدء الماتش' : 'Accept & Start')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
