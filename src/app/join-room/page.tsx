'use client';

import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Key,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  CircleNotch,
  Crosshair,
  Ranking,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';

export default function JoinRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const { ensureGuestId, sessionToken } = useGuestSession();

  const joinSnipeRoom = useMutation(api.rooms.mutations.join);
  const joinRankDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);

  const [nickname] = useGuestNickname();
  const [roomCode, setRoomCode] = useState('');

  const [loading, setLoading] = useState(false);

  const normalizedCode = roomCode
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();

  // Query both Snipe and Rank rooms by code
  const snipeRoom = useQuery(
    api.rooms.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const rankRoom = useQuery(
    api.rank.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const isSnipe = Boolean(snipeRoom && snipeRoom.status === 'waiting' && !snipeRoom.guestId);
  const isRank = Boolean(rankRoom && rankRoom.status === 'waiting' && !rankRoom.isFull);
  const canJoin = isSnipe || isRank;

  const isChecking = normalizedCode.length === 6 && (snipeRoom === undefined && rankRoom === undefined);

  const statusIcon =
    normalizedCode.length < 6 ? (
      <AppIcon icon={MagnifyingGlass} size={18} weight="bold" className="text-steel" />
    ) : isChecking ? (
      <AppIcon icon={CircleNotch} size={18} weight="bold" className="text-lime animate-spin" />
    ) : canJoin ? (
      <AppIcon icon={CheckCircle} size={18} weight="fill" className="text-lime" />
    ) : (
      <AppIcon icon={XCircle} size={18} weight="fill" className="text-rose-400" />
    );

  const statusText =
    normalizedCode.length < 6
      ? t('joinRoom.enterCodeHint')
      : isChecking
        ? t('joinRoom.checkingCode')
        : canJoin
          ? isSnipe
            ? (lang === 'ar' ? 'تم العثور على ماتش سنايب!' : 'Snipe Match Found!')
            : (lang === 'ar' ? 'تم العثور على تحدي رتّب 1v1!' : 'Rank 1v1 Duel Found!')
          : (snipeRoom || rankRoom)
            ? t('joinRoom.roomFull')
            : t('joinRoom.roomNotFound');

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!canJoin || loading || !nickname.trim()) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId(nickname.trim());
      const currentSessionToken = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('extratime_sessionToken') || undefined : undefined);

      if (isSnipe && snipeRoom) {
        const result = await joinSnipeRoom({
          roomId: snipeRoom._id,
          guestId,
          sessionToken: currentSessionToken,
        });
        router.push(`/auction/${result.roomId}`);
      } else if (isRank && rankRoom) {
        const result = await joinRankDuel({
          guestId,
          sessionToken: currentSessionToken,
          code: normalizedCode,
        });
        router.push(`/rank/${result.gameId}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not join room', 'error');
      setLoading(false);
    }
  }

  return (
    <PageShell
      title={lang === 'ar' ? 'ادخل ماتش بالكود' : 'Join Match'}
      subtitle={lang === 'ar' ? 'ادخل كود الغرفة المكون من 6 رموز لأي لعبة (سنايب أو رتّب).' : 'Enter 6-character code for Snipe or Rank duel.'}
      badge={
        <StatPill
          variant="lime"
          size="sm"
          icon={<AppIcon icon={Key} size={14} weight="duotone" />}
          label={lang === 'ar' ? 'دخول سريع' : 'Direct Join'}
        />
      }
      backUrl="/"
      maxWidth="xl"
    >
      <form onSubmit={handleJoin}>
        <Panel variant="highlight" className="p-4 sm:p-6 space-y-5">
          {/* Big Room Code Input */}
          <div className="space-y-1.5">
            <label className="text-steel text-[10px] font-black tracking-widest uppercase block px-1">
              {t('joinRoom.roomCode')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-lime">
                <AppIcon icon={Key} size={24} weight="duotone" />
              </div>
              <input
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(
                    e.target.value
                      .replace(/[^a-zA-Z0-9]/g, '')
                      .slice(0, 6)
                      .toUpperCase(),
                  )
                }
                maxLength={6}
                className="font-stats text-lime placeholder:text-steel/30 focus:border-lime/70 focus:ring-lime/20 w-full rounded-2xl border border-white/10 bg-slate-950 py-3.5 px-12 text-center text-3xl sm:text-4xl tracking-[0.24em] uppercase transition-all outline-none focus:ring-2 min-h-[56px]"
                placeholder="X7K9M2"
                autoComplete="off"
                inputMode="text"
                autoFocus
              />
            </div>
          </div>

          {/* Status Verification Card with Mode Recognition */}
          <div
            className={`flex items-start justify-between rounded-2xl border p-3.5 sm:p-4 transition-all ${
              canJoin ? 'border-lime/40 bg-lime/10' : 'border-white/10 bg-slate-950/80'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">{statusIcon}</div>
              <div className="min-w-0">
                <p className={`text-sm font-black ${canJoin ? 'text-lime' : 'text-white'}`}>
                  {statusText}
                </p>
                <p className="text-steel mt-0.5 text-xs font-medium leading-relaxed">
                  {canJoin
                    ? isSnipe
                      ? (lang === 'ar'
                          ? `ماتش سنايب (${snipeRoom?.settings.matchSize || 11} ضد ${snipeRoom?.settings.matchSize || 11}) • $${snipeRoom?.settings.startingBudget || 100}M`
                          : `Snipe Match (${snipeRoom?.settings.matchSize || 11}v${snipeRoom?.settings.matchSize || 11}) • $${snipeRoom?.settings.startingBudget || 100}M Budget`)
                      : (lang === 'ar'
                          ? `المضيف: ${rankRoom?.hostName || 'Manager'} • ${rankRoom?.roundCount} جولات`
                          : `Host: ${rankRoom?.hostName || 'Manager'} • ${rankRoom?.roundCount} Rounds`)
                    : t('joinRoom.statusSubtext')}
                </p>
              </div>
            </div>

            {canJoin && (
              <StatPill variant={isSnipe ? 'lime' : 'amber'} size="sm" className="shrink-0">
                <AppIcon icon={isSnipe ? Crosshair : Ranking} size={14} weight="duotone" className="me-1" />
                <span>{isSnipe ? 'Snipe' : 'Rank 1v1'}</span>
              </StatPill>
            )}
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canJoin || loading || !nickname.trim()}
            loading={loading}
            leftIcon={<AppIcon icon={isRank ? Ranking : Crosshair} size={20} weight="bold" />}
          >
            {loading
              ? t('joinRoom.joining')
              : isRank
                ? (lang === 'ar' ? 'ادخل تحدي رتّب' : 'Enter Rank Duel')
                : (lang === 'ar' ? 'ادخل ماتش سنايب' : 'Enter Snipe Match')}
          </Button>
        </Panel>
      </form>
    </PageShell>
  );
}
