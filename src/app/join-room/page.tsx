'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  Shuffle,
  Lightning,
  Users,
  ShieldCheck,
  Crosshair,
  Ranking,
  Vault,
  Key,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  JoinCipherVisual,
  PrimaryActionButton,
  RulesStrip,
} from '@/components/hub';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { sfx } from '@/lib/sfx';
import { type GameId } from '@/config/games';

export default function JoinRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const inputRef = useRef<HTMLInputElement>(null);

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

  const isCodeComplete = normalizedCode.length === 6;

  const snipeRoom = useQuery(
    api.rooms.queries.getByCode,
    isCodeComplete ? { code: normalizedCode } : 'skip',
  );

  const rankRoom = useQuery(
    api.rank.queries.getByCode,
    isCodeComplete ? { code: normalizedCode } : 'skip',
  );

  const draftRoom = useQuery(
    api.draft.queries.getByCode,
    isCodeComplete ? { code: normalizedCode } : 'skip',
  );

  const bankRoom = useQuery(
    api.bank.queries.getByCode,
    isCodeComplete ? { code: normalizedCode } : 'skip',
  );

  const isSnipe = Boolean(snipeRoom && snipeRoom.status === 'waiting' && !snipeRoom.guestId);
  const isRank = Boolean(rankRoom && rankRoom.status === 'waiting' && !rankRoom.isFull);
  const isDraft = Boolean(draftRoom && draftRoom.status === 'waiting' && !draftRoom.isFull);
  const isBank = Boolean(bankRoom && bankRoom.status === 'waiting' && !bankRoom.isFull);
  const canJoin = isSnipe || isRank || isDraft || isBank;

  const detectedGame: GameId | null = isSnipe
    ? 'snipe'
    : isRank
      ? 'rank'
      : isDraft
        ? 'draft'
        : isBank
          ? 'bank'
          : null;

  const isChecking =
    isCodeComplete &&
    snipeRoom === undefined &&
    rankRoom === undefined &&
    draftRoom === undefined &&
    bankRoom === undefined;

  const isInvalid = isCodeComplete && !isChecking && !canJoin;

  const handleSlotClick = () => {
    sfx.tap();
    inputRef.current?.focus();
  };

  const handleRandomizeName = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.tap();
    const newName = randomName();
    setNickname(newName);
  };

  async function handleJoinSubmit() {
    if (!canJoin || loading) return;
    const activeName = (nickname || '').trim() || randomName();
    setLoading(true);
    sfx.kickoff();

    try {
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
        nickname: activeName,
        avatarSeed: activeName,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('extratime_guestId', res.guestId);
        if (res.sessionToken) {
          localStorage.setItem('extratime_sessionToken', res.sessionToken);
        }
        localStorage.setItem('extratime_guestName', activeName);
      }

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
      sfx.wipeout();
      toast(err.message || 'Could not join room', 'error');
      setLoading(false);
    }
  }

  // Tactical status text
  const statusHeadline = !isCodeComplete
    ? isRtl
      ? 'أدخل رمز الغرفة المكون من 6 خانات'
      : 'Enter 6-Character Room PIN'
    : isChecking
      ? isRtl
        ? 'جاري فحص التردد والكود…'
        : 'Scanning Room Network…'
      : canJoin
        ? isSnipe
          ? isRtl
            ? 'تم العثور على مزاد سنايب'
            : 'Snipe Auction Duel Found'
          : isRank
            ? isRtl
              ? 'تم العثور على تحدي رتّب 1 ضد 1'
              : 'Rank Stat Duel Found'
            : isDraft
              ? isRtl
                ? 'تم العثور على ديربي درافت'
                : 'Pro Draft Arena Found'
              : isRtl
                ? 'تم العثور على خزينة بَنِّك'
                : 'Bank Vault Duel Found'
        : snipeRoom || rankRoom || draftRoom || bankRoom
          ? t('joinRoom.roomFull')
          : t('joinRoom.roomNotFound');

  const statusSubline = canJoin
    ? isSnipe
      ? isRtl
        ? `ماتش سنايب (${snipeRoom?.settings.matchSize || 11} ضد ${snipeRoom?.settings.matchSize || 11}) • ميزانية $${snipeRoom?.settings.startingBudget || 100}M`
        : `Snipe (${snipeRoom?.settings.matchSize || 11}v${snipeRoom?.settings.matchSize || 11}) • $${snipeRoom?.settings.startingBudget || 100}M`
      : isRank
        ? isRtl
          ? `المضيف: ${rankRoom?.hostName || 'المدرب'} • ${rankRoom?.roundCount || 3} جولات ترتيب`
          : `Host: ${rankRoom?.hostName || 'Manager'} • ${rankRoom?.roundCount || 3} Stat Rounds`
        : isDraft
          ? isRtl
            ? `المضيف: ${draftRoom?.hostName || 'المدرب'} • درافت 14 اختيار مع كيمياء`
            : `Host: ${draftRoom?.hostName || 'Manager'} • 14 Picks Synergy Derby`
          : isRtl
            ? `المضيف: ${bankRoom?.hostName || 'المدرب'} • 12 سؤالاً في صالة بَنِّك`
            : `Host: ${bankRoom?.hostName || 'Manager'} • 12 Questions Vault Duel`
    : !isCodeComplete
      ? isRtl
        ? 'يدعم غرف سنايب، درافت، رتّب، وبَنِّك'
        : 'Supports Snipe, Draft, Rank, and Bank It'
      : isChecking
        ? isRtl
          ? 'يتم التحقق من الخوادم لايف'
          : 'Connecting to live matchmaking'
        : isRtl
          ? 'تأكد من صحة الرمز أو اطلب كوداً جديداً'
          : 'Check PIN with your friend or request new code';

  return (
    <GameHubShell
      gameId={detectedGame || 'snipe'}
      ariaTitle={`ExtraTime - ${isRtl ? 'انضم للمباراة' : 'Join Match'}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
      <HubEyebrow text={isRtl ? 'دخول مباشر بكود' : 'DIRECT ACCESS'} />
      <HubTitle
        title={isRtl ? 'انضم للمباراة' : 'Join Match'}
        subtitle={
          isRtl
            ? 'أدخل كود الروم المكون من 6 رموز للدخول الفوري لأي مباراة خاصة.'
            : 'Enter any 6-character room PIN to connect directly to your rival.'
        }
      />

      {/* ── Center Stage: Tactical Frequency Cipher Visual ── */}
      <HubVisual showTimerArc={Boolean(canJoin)}>
        <JoinCipherVisual
          code={normalizedCode}
          isChecking={isChecking}
          matchedGame={detectedGame}
          isInvalid={isInvalid}
        />
      </HubVisual>

      {/* ── Tactical 6-Slot PIN Input Deck ── */}
      <div
        className="relative flex w-full shrink-0 flex-col items-center justify-center cursor-pointer select-none"
        onClick={handleSlotClick}
        style={{
          marginBottom: 'var(--hub-gap-pill-row1)',
        }}
      >
        {/* Hidden Accessible Input for Native Keyboard & Paste */}
        <input
          ref={inputRef}
          type="text"
          value={roomCode}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
            setRoomCode(val);
            if (val.length > roomCode.length) sfx.tap();
          }}
          maxLength={6}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          aria-label={t('joinRoom.roomCode')}
          className="absolute inset-0 size-full opacity-0 cursor-pointer text-transparent"
        />

        {/* 6 Visual Tactical Cells */}
        <div className="flex w-full max-w-[288px] items-center justify-between gap-1.5 sm:gap-2 px-1" dir="ltr">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const char = normalizedCode[idx];
            const isCurrent = normalizedCode.length === idx;
            const isFilled = Boolean(char);

            return (
              <div
                key={idx}
                className={`hub-code-slot ${
                  isFilled
                    ? 'hub-code-slot-filled'
                    : isCurrent
                      ? 'hub-code-slot-active'
                      : ''
                }`}
              >
                {char || (isCurrent ? <span className="animate-pulse text-[var(--hub-accent)]">_</span> : '·')}
              </div>
            );
          })}
        </div>

        {/* Inline Manager Identity Chip */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#9AA0AE]">
          <span>{isRtl ? 'المدرب:' : 'Manager:'}</span>
          <span className="font-bold text-white font-mono">
            {nickname || 'Manager'}
          </span>
          <button
            type="button"
            onClick={handleRandomizeName}
            title={isRtl ? 'تغيير الاسم' : 'Randomize name'}
            aria-label={isRtl ? 'تغيير الاسم' : 'Randomize name'}
            className="btn-haptic p-1 text-[#9AA0AE] hover:text-white transition-colors cursor-pointer"
          >
            <AppIcon icon={Shuffle} size={13} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── Row 1: Target Match Intel Card (Fixed 68px) ── */}
      <div
        data-hub-row-1
        className="flex w-full shrink-0 items-center justify-between rounded-2xl border px-3.5 sm:px-4 transition-all duration-300"
        style={{
          height: 'var(--hub-row1-height)',
          marginBottom: 'var(--hub-gap-row1-row2)',
          borderColor: canJoin
            ? 'color-mix(in srgb, var(--hub-accent) 45%, transparent)'
            : isInvalid
              ? 'rgba(244, 63, 94, 0.35)'
              : 'rgba(255, 255, 255, 0.08)',
          backgroundColor: canJoin
            ? 'color-mix(in srgb, var(--hub-accent) 10%, rgba(11, 15, 23, 0.75))'
            : isInvalid
              ? 'rgba(244, 63, 94, 0.06)'
              : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: canJoin
                ? 'color-mix(in srgb, var(--hub-accent) 50%, transparent)'
                : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: canJoin
                ? 'color-mix(in srgb, var(--hub-accent) 18%, transparent)'
                : 'rgba(255, 255, 255, 0.04)',
              color: canJoin ? 'var(--hub-accent)' : '#9AA0AE',
            }}
          >
            <AppIcon
              icon={
                detectedGame === 'snipe'
                  ? Crosshair
                  : detectedGame === 'draft'
                    ? Lightning
                    : detectedGame === 'rank'
                      ? Ranking
                      : detectedGame === 'bank'
                        ? Vault
                        : Key
              }
              size={18}
              weight={canJoin ? 'fill' : 'bold'}
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-[13px] font-bold text-white truncate leading-tight">
              {statusHeadline}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9AA0AE] truncate font-light mt-0.5">
              {statusSubline}
            </p>
          </div>
        </div>

        {canJoin && (
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--hub-accent) 22%, transparent)',
              color: 'var(--hub-accent-light, #fff)',
              border: '1px solid color-mix(in srgb, var(--hub-accent) 45%, transparent)',
            }}
          >
            READY
          </span>
        )}
      </div>

      {/* ── Row 2: Enter Duel Primary CTA (Fixed 72px) ── */}
      <div
        data-hub-row-2
        className="w-full shrink-0"
        style={{
          height: 'var(--hub-row2-height)',
          marginBottom: 'var(--hub-gap-row2-rules)',
        }}
      >
        <PrimaryActionButton
          id="join-room-submit-btn"
          title={
            canJoin
              ? detectedGame === 'snipe'
                ? isRtl
                  ? 'ادخل مزاد سنايب'
                  : 'ENTER SNIPE MATCH'
                : detectedGame === 'draft'
                  ? isRtl
                    ? 'ادخل ديربي درافت'
                    : 'ENTER DRAFT DUEL'
                  : detectedGame === 'rank'
                    ? isRtl
                      ? 'ادخل تحدي رتّب'
                      : 'ENTER RANK DUEL'
                    : isRtl
                      ? 'ادخل مواجهة بَنِّك'
                      : 'ENTER BANK DUEL'
              : isRtl
                ? 'أدخل كود الغرفة'
                : 'ENTER ROOM CODE'
          }
          subtitle={
            canJoin
              ? isRtl
                ? 'مواجهة فورية 1 ضد 1 جاهزة'
                : 'Direct 1v1 Private Duel'
              : isRtl
                ? 'مطلوب كود سري من 6 رموز'
                : '6-Digit Secret PIN Required'
          }
          loadingTitle={t('joinRoom.joining')}
          onClick={handleJoinSubmit}
          disabled={!canJoin || loading}
          loading={loading}
          containerClassName="h-full w-full"
        />
      </div>

      {/* ── Rules Strip: Pinned to bottom with safe-area padding ── */}
      <RulesStrip
        items={[
          {
            icon: Lightning,
            title: isRtl ? 'دخول مباشر' : 'Direct Connect',
            subtitle: isRtl ? 'بدون انتظار' : 'Instant 1v1 Sync',
          },
          {
            icon: ShieldCheck,
            title: isRtl ? 'كود موحد' : 'Universal PIN',
            subtitle: isRtl ? 'سنايب · درافت · رتّب · بَنِّك' : 'All 4 Games Supported',
          },
          {
            icon: Users,
            title: isRtl ? 'مبارزة خاصة' : 'Private Duel',
            subtitle: isRtl ? 'تحدَّ أصحابك' : 'Friends & Rivals',
          },
        ]}
      />
    </GameHubShell>
  );
}
