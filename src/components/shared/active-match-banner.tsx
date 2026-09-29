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
import {
  Crosshair,
  Ranking,
  Lightning,
  Play,
  Trash,
  Clock,
  CircleNotch,
  Vault,
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
  const isDraft = activeMatch.type === 'draft';
  const isBank = activeMatch.type === 'bank';
  const isWaiting = activeMatch.status === 'waiting';

  const title = isSnipe
    ? t('home.activeMatch.snipeTitle')
    : isRank
      ? t('home.activeMatch.rankTitle')
      : isDraft
        ? 'Extra Draft'
        : t('bank.title');

  let subtitle = '';
  if (isWaiting) {
    subtitle = t('home.activeMatch.waitingRival');
  } else if (isDraft) {
    const matchObj = activeMatch as Record<string, unknown>;
    const slotIdx = typeof matchObj.currentSlotIndex === 'number' ? matchObj.currentSlotIndex : 0;
    subtitle = `Pick ${Math.min(14, slotIdx + 1)}/14 · Draft Arena`;
  } else if (isBank && (activeMatch as Record<string, unknown>).currentRound) {
    const round = (activeMatch as Record<string, unknown>).currentRound;
    subtitle = `Round ${String(round)}/2 · Bank Arena`;
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
    } else if (isDraft) {
      router.push(`/draft/${activeMatch.id}`);
    } else if (isBank) {
      router.push(`/bank/${activeMatch.id}`);
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
      className="animate-fade-in w-full rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-slate-900/90 to-slate-950/90 p-3.5 sm:p-4 shadow-lg shadow-gold/5 backdrop-blur-md transition-all select-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left side: Icon & Game Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/20 text-gold shadow-md shadow-gold/20">
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold" />
            </span>
            <AppIcon icon={isSnipe ? Crosshair : isRank ? Ranking : isDraft ? Lightning : Vault} size={22} weight="duotone" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black uppercase text-gold tracking-wider">
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

        {/* Right side: Action Buttons (Luxury Edition) */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleAbandon}
            disabled={isLeaving}
            className="btn-haptic flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isLeaving ? (
              <CircleNotch className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AppIcon icon={Trash} size={14} weight="bold" />
            )}
            <span>{t('home.activeMatch.leave')}</span>
          </button>

          <button
            type="button"
            onClick={handleResume}
            disabled={isLeaving}
            className="btn-haptic group relative flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] px-4 py-1.5 text-xs font-black text-slate-950 shadow-[0_4px_16px_rgba(229,184,66,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer overflow-hidden border border-gold/60"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out" />
            <AppIcon icon={Play} size={13} weight="fill" className="text-slate-950 transition-transform group-hover:scale-110" />
            <span className="tracking-tight">{t('home.activeMatch.resume')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
