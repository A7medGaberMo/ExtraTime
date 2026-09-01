'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Sword, CheckCircle } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';

interface ParticipantInfo {
  guestId: string;
  name: string;
  avatarSeed: string;
  totalScore: number;
  hasSubmittedCurrentRound?: boolean;
}

interface RankHeaderProps {
  currentRound: number;
  totalRounds: number;
  deadline?: number;
  onTimeExpired?: () => void;
  scopeType?: string;
  isDuel?: boolean;
  participants?: ParticipantInfo[];
  currentGuestId?: string;
  locale?: 'en' | 'ar';
}

export function RankHeader({
  currentRound,
  totalRounds,
  deadline,
  onTimeExpired,
  scopeType,
  isDuel,
  participants,
  currentGuestId,
}: RankHeaderProps) {
  const { t } = useI18n();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeExpired?.();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [deadline, onTimeExpired]);

  const opponent = participants?.find((p) => p.guestId !== currentGuestId);
  const user = participants?.find((p) => p.guestId === currentGuestId);

  const progressPercentage = (currentRound / totalRounds) * 100;

  const timerColor =
    secondsRemaining <= 10
      ? 'text-rose-400 border-rose-500/40 bg-rose-950/30'
      : secondsRemaining <= 20
        ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
        : 'text-lime border-white/10 bg-slate-900/90';

  return (
    <header className="w-full shrink-0 select-none space-y-2 pt-1.5 sm:pt-2">
      {/* 3 Top Status Pills */}
      <div className="flex items-center justify-between gap-2">
        {/* Round Pill */}
        <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-slate-300 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <AppIcon
            icon={isDuel ? Sword : Trophy}
            size={14}
            weight="bold"
            className="text-lime"
          />
          <span className="font-stats font-bold uppercase tracking-wide text-white">
            {t('common.round')} {currentRound}/{totalRounds}
          </span>
        </div>

        {/* Score Pill */}
        <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-slate-300 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          {isDuel && opponent ? (
            <div className="flex items-center gap-1.5 font-stats text-xs">
              <span className="font-bold text-lime">
                {user?.totalScore !== undefined && user.totalScore > 0 ? `+${user.totalScore}` : user?.totalScore ?? 0}
              </span>
              <span className="text-steel font-medium">vs</span>
              <span className="font-bold text-rose-400">
                {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
              </span>
              {opponent.hasSubmittedCurrentRound && (
                <AppIcon icon={CheckCircle} size={13} weight="fill" className="text-lime inline-block" />
              )}
            </div>
          ) : (
            <span className="font-stats font-bold text-white">
              {user?.totalScore !== undefined && user.totalScore > 0 ? `+${user.totalScore}` : user?.totalScore ?? 0} pts
            </span>
          )}
        </div>

        {/* Timer Pill */}
        {deadline ? (
          <div
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-all duration-300 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-xl ${timerColor}`}
          >
            <AppIcon
              icon={Clock}
              size={14}
              weight="bold"
              className={secondsRemaining <= 10 ? 'text-rose-400' : 'text-lime'}
            />
            <span className="font-stats font-bold">{secondsRemaining}s</span>
          </div>
        ) : (
          <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-slate-900/85 text-xs font-semibold text-steel whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <span className="text-[11px] font-bold text-steel uppercase">{scopeType?.replace('_', ' ') || 'RANK'}</span>
          </div>
        )}
      </div>

      {/* Progress Track (Apple Sunken Track) */}
      <div className="h-1.5 w-full rounded-full bg-slate-950/80 border border-white/5 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-lime transition-all duration-500 shadow-[0_0_10px_rgba(142,224,0,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </header>
  );
}

