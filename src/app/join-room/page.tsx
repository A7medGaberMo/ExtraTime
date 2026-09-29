'use client';

import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  Key,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  CircleNotch,
  Crosshair,
  Ranking,
  Lightning,
  Shuffle,
  Vault,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { TextInput } from '@/components/ui/text-input';
import { UserIdentity } from '@/components/ui/user-identity';
import { StatPill } from '@/components/ui/stat-pill';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';

export default function JoinRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const joinSnipeRoom = useMutation(api.rooms.mutations.join);
  const joinRankDuel = useMutation(api.rank.mutations.joinDuelPrivateRoom);
  const joinDraftRoom = useMutation(api.draft.mutations.joinDraftByCode);
  const joinBankRoom = useMutation(api.bank.mutations.joinDuelPrivateRoom);

  const [nickname, setNickname] = useGuestNickname();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedCode = roomCode
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();

  const snipeRoom = useQuery(
    api.rooms.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const rankRoom = useQuery(
    api.rank.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const draftRoom = useQuery(
    api.draft.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const bankRoom = useQuery(
    api.bank.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );

  const isSnipe = Boolean(snipeRoom && snipeRoom.status === 'waiting' && !snipeRoom.guestId);
  const isRank = Boolean(rankRoom && rankRoom.status === 'waiting' && !rankRoom.isFull);
  const isDraft = Boolean(draftRoom && draftRoom.status === 'waiting' && !draftRoom.isFull);
  const isBank = Boolean(bankRoom && bankRoom.status === 'waiting' && !bankRoom.isFull);
  const canJoin = isSnipe || isRank || isDraft || isBank;

  const isChecking =
    normalizedCode.length === 6 &&
    snipeRoom === undefined &&
    rankRoom === undefined &&
    draftRoom === undefined &&
    bankRoom === undefined;

  const statusIcon =
    normalizedCode.length < 6 ? (
      <AppIcon icon={MagnifyingGlass} size={18} weight="bold" className="text-steel" />
    ) : isChecking ? (
      <AppIcon icon={CircleNotch} size={18} weight="bold" className="text-gold animate-spin" />
    ) : canJoin ? (
      <AppIcon icon={CheckCircle} size={18} weight="fill" className="text-emerald-400" />
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
            : isRank
              ? (lang === 'ar' ? 'تم العثور على تحدي رتّب 1v1!' : 'Rank 1v1 Duel Found!')
              : isDraft
                ? (lang === 'ar' ? 'تم العثور على درافت ديربي 1v1!' : 'Pro Draft 1v1 Duel Found!')
                : (lang === 'ar' ? 'تم العثور على مواجهة بَنِّك 1v1!' : 'Bank It 1v1 Duel Found!')
          : snipeRoom || rankRoom || draftRoom || bankRoom
            ? t('joinRoom.roomFull')
            : t('joinRoom.roomNotFound');

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!canJoin || loading || !nickname.trim()) return;
    setLoading(true);

    try {
      const name = nickname.trim();
      const existingId = localStorage.getItem('extratime_guestId') as Id<'guestUsers'> | null;
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;
      const res = await ensureGuest({
        existingId: existingId ?? undefined,
        sessionToken,
        nickname: name,
        avatarSeed: name,
      });
      localStorage.setItem('extratime_guestId', res.guestId);
      if (res.sessionToken) {
        localStorage.setItem('extratime_sessionToken', res.sessionToken);
      }
      localStorage.setItem('extratime_guestName', name);
      const validGuestId = res.guestId as Id<'guestUsers'>;
      const validSessionToken = res.sessionToken ?? sessionToken;

      if (isSnipe && snipeRoom) {
        const result = await joinSnipeRoom({
          roomId: snipeRoom._id,
          guestId: validGuestId,
          sessionToken: validSessionToken,
        });
        router.push(`/auction/${result.roomId}`);
      } else if (isRank && rankRoom) {
        const result = await joinRankDuel({
          guestId: validGuestId,
          sessionToken: validSessionToken,
          code: normalizedCode,
        });
        router.push(`/rank/${result.gameId}`);
      } else if (isDraft && draftRoom) {
        const result = await joinDraftRoom({
          guestId: validGuestId,
          sessionToken: validSessionToken,
          code: normalizedCode,
        });
        router.push(`/draft/${result.gameId}`);
      } else if (isBank && bankRoom) {
        const result = await joinBankRoom({
          guestId: validGuestId,
          sessionToken: validSessionToken,
          code: normalizedCode,
        });
        router.push(`/bank/${result.gameId}`);
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
      subtitle={
        lang === 'ar'
          ? 'ادخل كود الغرفة المكون من 6 رموز لأي لعبة (سنايب، رتّب، درافت، أو بَنِّك).'
          : 'Enter 6-character code for Snipe, Rank, Draft, or Bank It.'
      }
      badge={
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-light shadow-sm backdrop-blur-xl">
          <AppIcon icon={Key} size={13} weight="fill" className="text-gold" />
          <span className="font-stats tracking-wider uppercase text-[11px] font-bold">
            {lang === 'ar' ? 'دخول فوري' : 'Direct Room Access'}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="md"
    >
      <form onSubmit={handleJoin} className="relative">
        <div className="luxury-glass-elevated relative z-10 p-3 sm:p-4 space-y-2.5 sm:space-y-3 rounded-3xl border border-gold/15 shadow-xl">
          {/* Manager Handle Input */}
          <div className="luxury-glass rounded-2xl p-2 sm:p-2.5 border border-white/8 space-y-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-steel block px-1 font-stats">
              {lang === 'ar' ? 'هوية المدرب' : 'Manager Identity'}
            </span>
            <div className="flex items-center gap-3">
              <UserIdentity nickname={nickname} size="sm" showAvatarOnly />
              <div className="flex-1 min-w-0">
                <TextInput
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  placeholder="Manager name"
                  aria-label={t('joinRoom.managerHandle')}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setNickname(randomName())}
                      aria-label={t('home.nameModal.randomize')}
                      title={t('home.nameModal.randomize')}
                      className="btn-haptic flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-steel hover:text-white transition-all cursor-pointer"
                    >
                      <AppIcon icon={Shuffle} size={16} weight="bold" />
                    </button>
                  }
                />
              </div>
            </div>
          </div>

          {/* 6-Character Room Code Card */}
          <div className="luxury-glass rounded-2xl p-3 sm:p-3.5 border border-white/8 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-steel text-[10px] font-bold tracking-widest uppercase font-stats">
                {t('joinRoom.roomCode')}
              </label>
              <span className="text-[10px] font-mono text-steel font-bold">
                {normalizedCode.length}/6
              </span>
            </div>

            <div className="relative">
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
                className="font-stats text-gold placeholder:text-steel/20 focus:border-gold/70 focus:ring-gold/25 w-full rounded-2xl border border-white/12 bg-slate-950/80 py-3.5 px-4 text-center text-2xl sm:text-3xl tracking-[0.24em] font-bold uppercase transition-all outline-none focus:ring-2 shadow-inner"
                placeholder="X7K9M2"
                autoComplete="off"
                inputMode="text"
                autoFocus
              />
            </div>

            {/* Visual Slots */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5" dir="ltr">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const char = normalizedCode[index];
                return (
                  <div
                    key={index}
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border font-stats font-bold text-sm sm:text-base transition-all ${
                      char
                        ? 'border-gold/40 bg-gold/15 text-gold shadow-sm'
                        : 'border-white/8 bg-white/[0.02] text-steel/30'
                    }`}
                  >
                    {char || '·'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Verification Card */}
          <div
            className={`luxury-glass flex items-start justify-between rounded-2xl border p-3.5 transition-all ${
              canJoin
                ? 'border-gold/30 bg-gold/5'
                : 'border-white/8 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">{statusIcon}</div>
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-bold font-stats tracking-wide ${
                    canJoin ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {statusText}
                </p>
                <p className="text-steel mt-0.5 text-[11px] font-normal leading-relaxed">
                  {canJoin
                    ? isSnipe
                      ? lang === 'ar'
                        ? `ماتش سنايب (${snipeRoom?.settings.matchSize || 11} ضد ${snipeRoom?.settings.matchSize || 11}) • ميزانية $${snipeRoom?.settings.startingBudget || 100}M`
                        : `Snipe (${snipeRoom?.settings.matchSize || 11}v${snipeRoom?.settings.matchSize || 11}) • $${snipeRoom?.settings.startingBudget || 100}M`
                      : isRank
                        ? lang === 'ar'
                          ? `المضيف: ${rankRoom?.hostName || 'Manager'} • ${rankRoom?.roundCount} جولات`
                          : `Host: ${rankRoom?.hostName || 'Manager'} • ${rankRoom?.roundCount} Rounds`
                        : isDraft
                          ? lang === 'ar'
                            ? `المضيف: ${draftRoom?.hostName || 'Manager'} • درافت 14 اختيار`
                            : `Host: ${draftRoom?.hostName || 'Manager'} • 14 Picks Derby`
                          : lang === 'ar'
                            ? `المضيف: ${bankRoom?.hostName || 'Manager'} • 12 سؤالاً في صالة بَنِّك`
                            : `Host: ${bankRoom?.hostName || 'Manager'} • 12 Questions Duel`
                    : t('joinRoom.statusSubtext')}
                </p>
              </div>
            </div>

            {canJoin && (
              <StatPill
                variant="gold"
                size="sm"
                className="shrink-0"
              >
                <AppIcon
                  icon={isSnipe ? Crosshair : isRank ? Ranking : isDraft ? Lightning : Vault}
                  size={13}
                  weight="duotone"
                  className="me-1"
                />
                <span>
                  {lang === 'ar'
                    ? (isSnipe ? 'سنايب' : isRank ? 'رتّب' : isDraft ? 'درافت' : 'بَنِّك')
                    : (isSnipe ? 'Snipe' : isRank ? 'Rank' : isDraft ? 'Draft' : 'Bank')}
                </span>
              </StatPill>
            )}
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            fullWidth
            disabled={!canJoin || loading || !nickname.trim()}
            loading={loading}
            className="rounded-2xl font-bold h-12 text-sm"
          >
            {loading
              ? t('joinRoom.joining')
              : isRank
                ? (lang === 'ar' ? 'ادخل تحدي رتّب' : 'Enter Rank Duel')
                : isDraft
                  ? (lang === 'ar' ? 'ادخل ديربي الدرافت' : 'Enter Draft Duel')
                  : isBank
                    ? (lang === 'ar' ? 'ادخل مواجهة بَنِّك' : 'Enter Bank Duel')
                    : (lang === 'ar' ? 'ادخل ماتش سنايب' : 'Enter Snipe Match')}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
