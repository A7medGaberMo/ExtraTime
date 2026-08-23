'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Sword, CheckCircle2 } from 'lucide-react';
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
      ? 'text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse'
      : secondsRemaining <= 20
        ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
        : 'text-lime border-white/[0.06] bg-[#141416]';

  return (
    <header className="w-full shrink-0 select-none space-y-2 pt-8 sm:pt-9">
      {/* 3 Top Status Pills */}
      <div className="flex items-center justify-between gap-2">
        {/* Round Pill */}
        <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-[#141416] text-[12.5px] font-semibold text-[#98989D] whitespace-nowrap shadow-sm">
          {isDuel ? (
            <Sword size={14} className="text-lime" strokeWidth={2.25} />
          ) : (
            <Trophy size={14} className="text-lime" strokeWidth={2.25} />
          )}
          <span className="font-stats font-bold uppercase tracking-wide text-white">
            {t('common.round')} {currentRound}/{totalRounds}
          </span>
        </div>

        {/* Score Pill */}
        <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-[#141416] text-[12.5px] font-semibold text-[#98989D] whitespace-nowrap shadow-sm">
          {isDuel && opponent ? (
            <div className="flex items-center gap-1 font-stats text-[12px]">
              <span className="font-bold text-lime">
                {user?.totalScore !== undefined && user.totalScore > 0 ? `+${user.totalScore}` : user?.totalScore ?? 0}
              </span>
              <span className="text-steel font-bold">vs</span>
              <span className="font-bold text-rose-400">
                {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
              </span>
              {opponent.hasSubmittedCurrentRound && (
                <CheckCircle2 size={12} className="text-lime inline-block" strokeWidth={2.5} />
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
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-[12.5px] font-semibold transition-all duration-300 whitespace-nowrap shadow-sm ${timerColor}`}
          >
            <Clock size={14} className={secondsRemaining <= 10 ? 'text-rose-400' : 'text-lime'} strokeWidth={2.25} />
            <span className="font-stats font-bold">{secondsRemaining}s</span>
          </div>
        ) : (
          <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-[#141416] text-[12.5px] font-semibold text-[#98989D] whitespace-nowrap">
            <span className="text-[11px] font-bold text-steel uppercase">{scopeType?.replace('_', ' ') || 'RANK'}</span>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full bg-lime transition-all duration-500 shadow-[0_0_8px_rgba(149,232,16,0.4)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </header>
  );
}
