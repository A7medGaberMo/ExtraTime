'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowLeft,
  SpeakerHigh,
  SpeakerSlash,
  Translate,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import type { EnrichedDraftParticipant } from '../types/draft';

interface DraftHeaderProps {
  participant: EnrichedDraftParticipant;
  opponent?: EnrichedDraftParticipant;
  is1v1: boolean;
  code: string;
  onTimeExpired?: () => void;
  onLeave?: () => void;
}

export function DraftHeader({
  participant,
  opponent,
  is1v1,
  code,
  onTimeExpired,
  onLeave,
}: DraftHeaderProps) {
  const { t, lang, toggleLang } = useI18n();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(sfx.isMuted());

  const isTurnActive = Boolean(participant.turnExpiresAt && participant.currentSlotIndex < 14);

  useEffect(() => {
    if (!isTurnActive) {
      return;
    }

    let hasExpired = false;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((participant.turnExpiresAt! - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff === 3 || diff === 2 || diff === 1) {
        sfx.tick();
      }

      if (diff <= 0 && !hasExpired) {
        hasExpired = true;
        clearInterval(interval);
        onTimeExpired?.();
      }
    }, 500);

    return () => {
      clearInterval(interval);
      setSecondsRemaining(null);
    };
  }, [isTurnActive, participant.turnExpiresAt, onTimeExpired]);

  const isUrgent = secondsRemaining !== null && secondsRemaining <= 5;

  return (
    <header className="apple-glass-card relative w-full rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_12px_32px_var(--et-shade-60)] shrink-0 border border-white/15">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Left: Back & Room Code */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onLeave ? (
            <button
              type="button"
              onClick={onLeave}
              className="btn-haptic flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-foreground hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all shadow-sm cursor-pointer"
              title={t('draft.leaveDraft')}
              aria-label={t('draft.leaveDraft')}
            >
              <AppIcon icon={ArrowLeft} size={15} weight="bold" />
            </button>
          ) : (
            <Link
              href="/draft"
              className="btn-haptic flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-foreground hover:text-white hover:bg-white/[0.12] transition-all shadow-sm"
              title={t('draft.leaveDraft')}
              aria-label={t('draft.leaveDraft')}
            >
              <AppIcon icon={ArrowLeft} size={15} weight="bold" />
            </Link>
          )}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white tracking-wide">
            <span className="hidden sm:inline text-muted font-medium">{t('draft.draftHub')}</span>
            <span className="rounded-full border border-game-accent/30 bg-game-accent/10 px-2.5 py-0.5 font-stats text-game-accent font-bold text-xs tabular-nums">
              {code}
            </span>
          </div>
        </div>

        {/* Center: Apple Dynamic Island Rating & Chemistry Island */}
        <div className="apple-segmented-bar flex items-center gap-2 sm:gap-3 px-3 py-1 rounded-full shadow-inner shrink-0">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <AppIcon icon={Star} size={13} weight="fill" className="text-game-accent" />
            <span className="text-[9px] uppercase font-bold tracking-wider text-muted">{t('draft.ovrLabel')}</span>
            <span className="font-stats text-xs sm:text-sm font-black text-white tabular-nums" dir="ltr">
              {participant.squadRating || '--'}
            </span>
          </div>

          <span className="text-white/15 text-xs">|</span>

          {/* Chemistry */}
          <div className="flex items-center gap-1.5">
            <AppIcon icon={ShieldCheck} size={13} weight="fill" className="text-success" />
            <span className="text-[9px] uppercase font-bold tracking-wider text-muted">{t('draft.chemLabel')}</span>
            <span className="font-stats text-xs sm:text-sm font-black text-success tabular-nums" dir="ltr">
              {participant.chemistryScore}
              <span className="text-[10px] text-muted font-normal">/33</span>
            </span>
          </div>

          {/* Opponent in 1v1 (Surprise Factor: show only draft pace, chemistry/cards hidden until showdown) */}
          {is1v1 && opponent && (
            <>
              <span className="text-white/15 text-xs">|</span>
              <span className="font-stats text-micro text-muted truncate max-w-[110px]" title={opponent.name}>
                {opponent.name}:{' '}
                <strong className="text-game-accent tabular-nums">
                  {opponent.isReady ? 'Locked' : `${Math.min(11, opponent.currentSlotIndex)}/11`}
                </strong>
              </span>
            </>
          )}
        </div>

        {/* Right: Timer & Sound & Language */}
        <div className="flex items-center gap-1.5 shrink-0">
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-0.5 transition-all shadow-sm ${
                isUrgent
                  ? 'border-danger/60 bg-danger/20 text-danger shadow-[0_0_14px_color-mix(in_srgb,var(--et-danger)_60%,transparent)] animate-pulse'
                  : 'border-game-accent/40 bg-game-accent/10 text-game-accent-light'
              }`}
            >
              <AppIcon icon={Clock} size={13} weight="bold" />
              <span className="font-stats text-xs font-black tabular-nums">{secondsRemaining}s</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMuted(sfx.toggleMute())}
            className="btn-haptic flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-foreground hover:text-white hover:bg-white/[0.12] transition-all shadow-sm cursor-pointer"
            title={isMuted ? t('draft.unmute') : t('draft.mute')}
            aria-label={isMuted ? t('draft.unmute') : t('draft.mute')}
          >
            <AppIcon icon={isMuted ? SpeakerSlash : SpeakerHigh} size={14} weight="bold" />
          </button>

          <button
            type="button"
            onClick={toggleLang}
            className="btn-haptic flex h-8 items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2.5 text-[11px] font-bold text-foreground hover:text-white hover:bg-white/[0.12] transition-all cursor-pointer font-stats shadow-sm"
            title={lang === 'en' ? 'تغيير للعربية' : 'Switch to English'}
          >
            <AppIcon icon={Translate} size={13} weight="bold" />
            <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
