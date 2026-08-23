'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/shared/toast';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import {
  Crosshair,
  Ranking,
  Play,
  Trash,
  Clock,
  CircleNotch,
} from '@phosphor-icons/react';

export function ActiveMatchBanner() {
  const router = useRouter();
  const { guestId, sessionToken } = useGuestSession(false);
  const { t } = useI18n();
  const { toast } = useToast();

  const [isLeaving, setIsLeaving] = useState(false);

  const activeMatch = useQuery(
    api.rooms.queries.getUserActiveMatch,
    guestId ? { guestId: guestId as Id<'guestUsers'> } : 'skip',
  );

  const abandonActiveMatch = useMutation(api.rooms.mutations.abandonUserActiveMatch);

  if (!guestId || !activeMatch) {
    return null;
  }

  const isSnipe = activeMatch.type === 'snipe';
  const isRank = activeMatch.type === 'rank';
  const isWaiting = activeMatch.status === 'waiting';

  const title = isSnipe ? t('home.activeMatch.snipeTitle') : t('home.activeMatch.rankTitle');

  let subtitle = '';
  if (isWaiting) {
    subtitle = t('home.activeMatch.waitingRival');
  } else if (isRank && activeMatch.currentRound && activeMatch.roundCount) {
    subtitle = t('home.activeMatch.roundProgress')
      .replace('{current}', String(activeMatch.currentRound))
      .replace('{total}', String(activeMatch.roundCount));
  } else if (isSnipe && activeMatch.currentRound && activeMatch.totalRounds) {
    subtitle = t('home.activeMatch.roundProgress')
      .replace('{current}', String(activeMatch.currentRound))
      .replace('{total}', String(activeMatch.totalRounds));
  } else {
    subtitle = t('home.activeMatch.inProgress');
  }

  function handleResume() {
    if (!activeMatch) return;
    if (isSnipe) {
      router.push(`/auction/${activeMatch.id}`);
    } else if (isRank) {
      router.push(`/rank/${activeMatch.id}`);
    }
  }

  async function handleAbandon() {
    if (!activeMatch || isLeaving) return;
    const confirmed = window.confirm(t('home.activeMatch.abandonConfirm'));
    if (!confirmed) return;

    setIsLeaving(true);
    try {
      await abandonActiveMatch({
        guestId: guestId as Id<'guestUsers'>,
        sessionToken: sessionToken ?? undefined,
        matchType: activeMatch.type,
        matchId: activeMatch.id,
      });

      toast(t('home.activeMatch.abandonSuccess'), 'success');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Could not leave match', 'error');
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <aside
      aria-label={t('home.activeMatch.badge')}
      className="animate-fade-in w-full rounded-2xl border border-lime/30 bg-gradient-to-r from-lime/10 via-slate-900/90 to-slate-950/90 p-3.5 sm:p-4 shadow-lg shadow-lime/5 backdrop-blur-md transition-all select-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left side: Icon & Game Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/40 bg-lime/20 text-lime shadow-md shadow-lime/20">
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime" />
            </span>
            <AppIcon icon={isSnipe ? Crosshair : Ranking} size={22} weight="duotone" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-black uppercase text-lime tracking-wider">
                {t('home.activeMatch.badge')}
              </span>
              <span className="flex items-center gap-1 font-stats text-[11px] font-bold text-steel">
                <AppIcon icon={Clock} size={12} weight="duotone" />
                {activeMatch.code}
              </span>
            </div>

            <h2 className="text-sm font-black text-white uppercase font-display truncate">
              {title}
            </h2>
            <p className="text-xs text-steel font-medium truncate">{subtitle}</p>
          </div>
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="danger"
            size="sm"
            onClick={handleAbandon}
            disabled={isLeaving}
            className="text-xs"
            leftIcon={
              isLeaving ? (
                <CircleNotch className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AppIcon icon={Trash} size={14} weight="duotone" />
              )
            }
          >
            {t('home.activeMatch.leave')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleResume}
            disabled={isLeaving}
            className="text-xs"
            leftIcon={<AppIcon icon={Play} size={14} weight="bold" />}
          >
            {t('home.activeMatch.resume')}
          </Button>
        </div>
      </div>
    </aside>
  );
}
