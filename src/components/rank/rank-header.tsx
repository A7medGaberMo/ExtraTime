'use client';

import React, { useEffect, useState } from 'react';
import { Ranking, Clock, Sword, CheckCircle } from '@phosphor-icons/react';
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

  const timerColor =
    secondsRemaining <= 10
      ? 'text-rose-400 border-rose-500/50 bg-rose-950/40 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]'
      : secondsRemaining <= 20
        ? 'text-amber-400 border-amber-500/50 bg-amber-950/30'
        : 'text-lime border-lime/40 bg-lime/10 shadow-[0_0_10px_rgba(149,232,16,0.15)]';

  const progressPercentage = (currentRound / totalRounds) * 100;

  return (
    <header className="w-full space-y-1.5 shrink-0 select-none">
      {/* Top HUD: Mode/Round + Score + Timer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-lime/30 text-lime text-[11px] font-black tracking-tight uppercase shadow-sm font-stats">
            <AppIcon icon={isDuel ? Sword : Ranking} size={13} weight="duotone" className="text-lime" />
            <span>
              {t('common.round')} {currentRound}/{totalRounds}
            </span>
          </span>

          {scopeType && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-steel text-[10px] font-bold">
              {scopeType.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Duel Live Score in Header */}
        {isDuel && opponent && (
          <div className="flex items-center gap-2 text-[11px] font-stats">
            <span className="text-lime font-black">
              {user?.totalScore !== undefined && user.totalScore > 0 ? `+${user.totalScore}` : user?.totalScore ?? 0}
            </span>
            <span className="text-steel">:</span>
            <span className="text-rose-400 font-black">
              {opponent.totalScore > 0 ? `+${opponent.totalScore}` : opponent.totalScore}
            </span>
            {opponent.hasSubmittedCurrentRound && (
              <span className="flex items-center text-lime text-[10px]">
                <AppIcon icon={CheckCircle} size={12} weight="fill" />
              </span>
            )}
          </div>
        )}

        {/* Timer */}
        {deadline && (
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-stats font-black transition-all duration-300 ${timerColor}`}
          >
            <AppIcon icon={Clock} size={13} weight="duotone" />
            <span>{secondsRemaining}s</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-lime via-vivid to-lime transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(149,232,16,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </header>
  );
}
