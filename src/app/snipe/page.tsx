'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  Users,
  Vault,
  LockKey,
  Target,
  UsersFour,
  CircleNotch,
  Shuffle,
} from '@phosphor-icons/react';

export default function SnipeHubPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
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

  // Format localized numerals
  const formattedCount = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(
    waitingCount,
  );

  // Pointer-tracked spotlight for the secondary action cards
  const handleSpotlight = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

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
    <div
      data-game="snipe"
      className="snipe-hub-page relative flex h-full min-h-0 w-full flex-col items-center justify-between overflow-hidden bg-[#07090F] select-none"
    >
      {/* ── Background: Subtle Tactical Grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,9,15,0.75)_100%)]"
        aria-hidden="true"
      />

      {/* Golden Radial Core Glow */}
      <div
        className="snipe-core-glow bg-gradient-radial pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-[52%] rounded-full from-amber-500/18 via-amber-600/5 to-transparent blur-3xl sm:h-[440px] sm:w-[440px]"
        aria-hidden="true"
      />

      <h1 className="sr-only">ExtraTime Snipe - {t('snipeHub.badge')}</h1>

      {/* ── Main Layout: Perfectly Balanced Zero-Scroll Container ── */}
      <div
        className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[460px] flex-1 flex-col px-4 sm:px-6"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 0.5rem) + 3.25rem + 24px)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col justify-between">
          {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
          <div className="snipe-zone-hero flex w-full shrink-0 flex-col items-center pt-0.5 text-center">
            {/* Eyebrow */}
            <div className="snipe-stagger-1 mb-1 flex items-center justify-center gap-2.5">
              <span className="snipe-eyebrow-line" aria-hidden="true" />
              <span className="snipe-eyebrow text-[11px] font-semibold tracking-[0.22em] text-amber-400 drop-shadow-sm sm:text-xs">
                {t('snipeHub.badge')}
              </span>
              <span className="snipe-eyebrow-line snipe-eyebrow-line-end" aria-hidden="true" />
            </div>

            {/* Main Title */}
            <div className="snipe-stagger-2 flex items-center justify-center">
              <h2 className="snipe-title snipe-title-sheen mt-1.5 leading-none drop-shadow-lg">
                {t('snipeHub.title')}
              </h2>
            </div>

            {/* Subtitle */}
            <div className="snipe-stagger-3 mt-3 w-full max-w-[300px]">
              <p className="snipe-body snipe-description w-full text-[13px] leading-snug font-normal text-balance text-[#C5CAD6] sm:text-[14.5px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {t('snipeHub.description')}
              </p>
            </div>
          </div>

          {/* ── Centerpiece: Living Radar / Scope Centerpiece ── */}
          <div className="snipe-radar-stage snipe-stagger-3 mt-5 flex min-h-0 w-full flex-1 items-center justify-center">
            <div className="snipe-radar-display relative flex items-center justify-center">
              {/* Scope Corner Brackets */}
              <span className="snipe-scope-bracket snipe-scope-bracket-tl" aria-hidden="true" />
              <span className="snipe-scope-bracket snipe-scope-bracket-tr" aria-hidden="true" />
              <span className="snipe-scope-bracket snipe-scope-bracket-bl" aria-hidden="true" />
              <span className="snipe-scope-bracket snipe-scope-bracket-br" aria-hidden="true" />

              {/* Outer Degree Tick Bezel */}
              <div
                className="snipe-radar-ticks pointer-events-none absolute inset-0 rounded-full"
                aria-hidden="true"
              />

              {/* Slow Counter-Rotating Dashed Bezel */}
              <div
                className="snipe-radar-bezel pointer-events-none absolute inset-[7%] rounded-full"
                aria-hidden="true"
              />

              {/* Concentric Thin Gold Rings */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full border border-amber-400/[0.14] shadow-[0_0_24px_rgba(251,191,36,0.06)]"
                aria-hidden="true"
              />
              <div
                className="snipe-ring-breathe pointer-events-none absolute inset-[18%] rounded-full border border-amber-400/[0.2]"
                aria-hidden="true"
              />
              <div
                className="snipe-ring-breathe snipe-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full border border-amber-400/[0.28]"
                aria-hidden="true"
              />

              {/* Sonar Pings Radiating From Core */}
              <span className="snipe-sonar-ping" aria-hidden="true" />
              <span className="snipe-sonar-ping snipe-sonar-ping-delay" aria-hidden="true" />

              {/* Precision Crosshair Axis Lines */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <div className="h-full w-px bg-gradient-to-b from-amber-400/25 via-transparent to-amber-400/25" />
                <div className="absolute h-px w-full bg-gradient-to-r from-amber-400/25 via-transparent to-amber-400/25" />
              </div>

              {/* Rotating Conic Sweep Line */}
              <div
                className="snipe-radar-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-full motion-reduce:hidden"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(251, 191, 36, 0.03) 310deg, rgba(251, 191, 36, 0.24) 360deg)',
                }}
                aria-hidden="true"
              >
                <div className="absolute top-0 left-1/2 h-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-t from-transparent via-amber-400/60 to-amber-400" />
              </div>

              {/* Pulsing Tactical Blip Dots */}
              <div
                className="snipe-blip-1 pointer-events-none absolute top-[24%] right-[22%] flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="absolute size-3 rounded-full bg-amber-400/40 blur-[2px]" />
                <span className="relative size-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
              </div>
              <div
                className="snipe-blip-2 pointer-events-none absolute bottom-[26%] left-[24%] flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="absolute size-2.5 rounded-full bg-amber-400/35 blur-[2px]" />
                <span className="relative size-1 rounded-full bg-amber-300 shadow-[0_0_5px_#fbbf24]" />
              </div>
              <div
                className="snipe-blip-3 pointer-events-none absolute top-[68%] right-[28%] flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="absolute size-2 rounded-full bg-amber-400/30 blur-[2px]" />
                <span className="relative size-1 rounded-full bg-amber-300 shadow-[0_0_4px_#fbbf24]" />
              </div>

              {/* Center Core App Mark */}
              <div className="relative z-10 flex size-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#221c12] via-[#14121a] to-[#09090f] shadow-[0_0_24px_rgba(251,191,36,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95 sm:size-14">
                <svg
                  className="size-6 drop-shadow-[0_1px_8px_rgba(251,191,36,0.65)] sm:size-7"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="goldScopeGrad"
                      x1="4"
                      y1="4"
                      x2="28"
                      y2="28"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#FFF0B3" />
                      <stop offset="40%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="16"
                    cy="16"
                    r="11"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.75"
                    opacity="0.85"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="5.5"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.25"
                    opacity="0.9"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6.5"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <line
                    x1="16"
                    y1="25.5"
                    x2="16"
                    y2="30"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <line
                    x1="2"
                    y1="16"
                    x2="6.5"
                    y2="16"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <line
                    x1="25.5"
                    y1="16"
                    x2="30"
                    y2="16"
                    stroke="url(#goldScopeGrad)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <circle cx="16" cy="16" r="2.2" fill="url(#goldScopeGrad)" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Live queue pill, aligned after the radar in both writing directions. ── */}
          <div
            className="snipe-live-pill mt-4 inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 self-center rounded-full border border-amber-400/20 bg-white/[0.035] px-3.5 py-1 text-center text-xs font-medium text-[#D7DAE1] shadow-[0_0_20px_rgba(251,191,36,0.06)] sm:text-[13px]"
            aria-live="polite"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {!queueReady ? (
              <>
                <AppIcon
                  icon={CircleNotch}
                  size={13}
                  weight="bold"
                  className="shrink-0 animate-spin text-amber-400/80"
                />
                <span className="text-[#9AA0AE]">{t('snipeHub.liveLoading')}</span>
              </>
            ) : waitingCount === 0 ? (
              <>
                <span
                  className="size-1.5 shrink-0 rounded-full bg-amber-400/70 shadow-[0_0_6px_#fbbf24]"
                  aria-hidden="true"
                />
                <span className="font-semibold text-[#F5F5F7]">{t('snipeHub.liveEmpty')}</span>
              </>
            ) : (
              <>
                <span className="relative flex size-2 shrink-0" aria-hidden="true">
                  <span className="snipe-live-ping absolute inset-0 rounded-full bg-amber-400" />
                  <span className="relative size-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                </span>
                <span className="font-semibold text-[#F5F5F7]">{t('snipeHub.liveLabel')}</span>
                <span className="text-white/25" aria-hidden="true">
                  ·
                </span>
                <bdi className="font-semibold text-amber-300 tabular-nums" dir="ltr">
                  {formattedCount}
                </bdi>
                <span>{t('snipeHub.liveSuffix')}</span>
              </>
            )}
          </div>

          {/* ── Bottom Section: Primary CTA + Secondary Cards + Feature Strip ── */}
          <div className="snipe-zone-actions mt-7 flex w-full shrink-0 flex-col gap-3">
            {/* Primary Full-Width CTA: "مباراة عامة" */}
            <div className="w-full">
              <button
                type="button"
                id="snipe-public-match-btn"
                onClick={handleStartPublicMatch}
                disabled={loading}
                aria-busy={loading}
                className="snipe-cta-btn group relative flex h-14 w-full items-center justify-between overflow-hidden rounded-2xl border border-amber-300/50 px-5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-wait sm:h-[58px] sm:px-6"
              >
                {/* Shine Sweep Overlay */}
                <span
                  className="snipe-cta-shine pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-reduce:hidden"
                  aria-hidden="true"
                />

                {/* Indeterminate progress bar while matchmaking */}
                {loading && <span className="snipe-cta-progress" aria-hidden="true" />}

                <div className="relative z-10 flex w-full items-center justify-between text-[#07090F]">
                  {loading ? (
                    <div className="flex w-full items-center justify-center gap-2" role="status">
                      <AppIcon
                        icon={CircleNotch}
                        size={20}
                        weight="bold"
                        className="animate-spin text-[#07090F]"
                      />
                      <span className="snipe-cta-text text-[15px] leading-tight sm:text-base">
                        {t('snipeHub.findingMatch')}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className="snipe-cta-text text-[15px] leading-tight sm:text-base">
                          {t('snipeHub.publicMatch')}
                        </span>
                        <span className="snipe-cta-sub text-[11px] leading-tight font-semibold text-[#07090F]/60">
                          {t('snipeHub.publicMatchSub')}
                        </span>
                      </span>
                      <span className="snipe-cta-arrow flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#07090F]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                        <AppIcon icon={ArrowRight} size={18} weight="bold" className="text-amber-300" />
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Secondary Action Cards: "غرفة خاصة" & "ادخل بالكود" (icon chip + label, pointer spotlight) */}
            <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
              {/* Card 1: Private Room / غرفة خاصة */}
              <Link
                href="/create-room?mode=snipe"
                id="snipe-private-room-link"
                onPointerMove={handleSpotlight}
                className="snipe-action-card btn-haptic group relative flex h-16 items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-center hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:h-[68px]"
              >
                <span className="snipe-card-icon relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-amber-400/35 group-hover:bg-amber-400/10" style={{ transition: 'border-color 0.25s, background-color 0.25s' }}>
                  <AppIcon
                    icon={Users}
                    size={19}
                    weight="regular"
                    className="text-[#C8CBD2] transition-colors duration-200 group-hover:text-amber-300"
                  />
                </span>
                <span className="snipe-card-title relative z-10 truncate text-[#F5F5F7]">
                  {t('snipeHub.privateRoom')}
                </span>
              </Link>

              {/* Card 2: Join with Code / ادخل بالكود */}
              <Link
                href="/join-room"
                id="snipe-join-room-link"
                onPointerMove={handleSpotlight}
                className="snipe-action-card btn-haptic group relative flex h-16 items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-center hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:h-[68px]"
              >
                <span className="snipe-card-icon relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-amber-400/35 group-hover:bg-amber-400/10" style={{ transition: 'border-color 0.25s, background-color 0.25s' }}>
                  <AppIcon
                    icon={Vault}
                    size={19}
                    weight="regular"
                    className="text-[#C8CBD2] transition-colors duration-200 group-hover:text-amber-300"
                  />
                </span>
                <span className="snipe-card-title relative z-10 truncate text-[#F5F5F7]">
                  {t('snipeHub.joinWithCode')}
                </span>
              </Link>
            </div>

            {/* Feature Strip matching reference design: Hairline top border, 3 columns, NO subtexts */}
            {/* Logical border-s keeps dividers between columns in both LTR and RTL. */}
            <div className="snipe-feature-strip grid w-full grid-cols-3 border-t border-white/[0.08] pt-3 pb-0.5">
              {/* Feature 1: Bid in secret / زايد في سرية */}
              <div className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 text-center">
                <span className="snipe-feature-icon">
                  <AppIcon
                    icon={LockKey}
                    size={14}
                    weight="regular"
                    className="shrink-0 text-amber-400"
                  />
                </span>
                <span className="snipe-feature-copy flex min-w-0 flex-col items-center gap-0.5">
                  <span className="snipe-feature-title text-[12px] leading-tight font-semibold text-[#F5F5F7]">
                    {t('snipeHub.features.secretBids')}
                  </span>
                  <span className="snipe-feature-subline text-[11px] leading-tight text-[#9AA0AE]">
                    {t('snipeHub.features.secretBidsSub')}
                  </span>
                </span>
              </div>

              {/* Feature 2: Read the room / اقرأ الجولة */}
              <div className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 text-center">
                <span className="snipe-feature-icon">
                  <AppIcon
                    icon={Target}
                    size={14}
                    weight="regular"
                    className="shrink-0 text-amber-400"
                  />
                </span>
                <span className="snipe-feature-copy flex min-w-0 flex-col items-center gap-0.5">
                  <span className="snipe-feature-title text-[12px] leading-tight font-semibold text-[#F5F5F7]">
                    {t('snipeHub.features.readRoom')}
                  </span>
                  <span className="snipe-feature-subline text-[11px] leading-tight text-[#9AA0AE]">
                    {t('snipeHub.features.readRoomSub')}
                  </span>
                </span>
              </div>

              {/* Feature 3: Build stronger XI / كوّن التشكيلة الأقوى */}
              <div className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 text-center">
                <span className="snipe-feature-icon">
                  <AppIcon
                    icon={UsersFour}
                    size={14}
                    weight="regular"
                    className="shrink-0 text-amber-400"
                  />
                </span>
                <span className="snipe-feature-copy flex min-w-0 flex-col items-center gap-0.5">
                  <span className="snipe-feature-title text-[12px] leading-tight font-semibold text-[#F5F5F7]">
                    {t('snipeHub.features.buildSquad')}
                  </span>
                  <span className="snipe-feature-subline text-[11px] leading-tight text-[#9AA0AE]">
                    {t('snipeHub.features.buildSquadSub')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
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
              className="btn-haptic group text-muted mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
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
              className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_20px_rgba(251,191,36,0.3)] hover:brightness-105 focus-visible:outline-amber-400 rtl:bg-gradient-to-l"
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
    </div>
  );
}
