'use client';

import React, { useEffect, useState, useId } from 'react';
import {
  X,
  Shuffle,
  CaretDown,
  CircleNotch,
  ArrowRight,
  ShieldCheck,
  Key,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type RankSetupMode = 'solo' | 'quick' | 'duel_create' | 'join';

export interface RankSetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: RankSetupMode;
  onConfirm: (config: {
    nickname: string;
    roundCount: 3 | 5;
    joinCode?: string;
  }) => Promise<void>;
  loading: boolean;
}

export function RankSetupSheet({
  isOpen,
  onClose,
  mode,
  onConfirm,
  loading,
}: RankSetupSheetProps) {
  const { t } = useI18n();
  const nameInputId = useId();

  // Nickname state
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extratime_guestName') || randomName();
    }
    return randomName();
  });

  // Match length (3 or 5 rounds), persistent
  const [roundCount, setRoundCount] = useState<3 | 5>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extratime_rank_rounds');
      if (saved === '5') return 5;
    }
    return 3;
  });

  // Collapsible rules
  const [showRules, setShowRules] = useState(false);

  // Join PIN code (for join mode)
  const [joinCode, setJoinCode] = useState('');

  // Sync / save roundCount
  const handleSelectRounds = (rounds: 3 | 5) => {
    setRoundCount(rounds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('extratime_rank_rounds', String(rounds));
    }
  };

  // Randomize nickname
  const handleRandomize = () => {
    const next = randomName();
    setNickname(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('extratime_guestName', next);
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = nickname.trim() || randomName();
    setNickname(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('extratime_guestName', trimmed);
    }

    await onConfirm({
      nickname: trimmed,
      roundCount,
      joinCode: mode === 'join' ? joinCode.trim().toUpperCase() : undefined,
    });
  };

  // Dynamic button title
  let buttonTitle = '';
  if (loading) {
    if (mode === 'solo') buttonTitle = t('rankHub.sheet.starting');
    else if (mode === 'quick') buttonTitle = t('rankHub.sheet.finding');
    else if (mode === 'duel_create') buttonTitle = t('rankHub.sheet.creating');
    else buttonTitle = t('rankHub.sheet.joining');
  } else {
    if (mode === 'solo') buttonTitle = t('rankHub.sheet.startSolo', { rounds: roundCount });
    else if (mode === 'quick') buttonTitle = t('rankHub.sheet.findMatch', { rounds: roundCount });
    else if (mode === 'duel_create') buttonTitle = t('rankHub.sheet.createRoom', { rounds: roundCount });
    else buttonTitle = t('rankHub.sheet.joinDuel');
  }

  const initialLetter = nickname.trim().charAt(0).toUpperCase() || 'M';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-sheet-title"
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex w-full max-w-[480px] sm:max-w-[500px] flex-col overflow-hidden rounded-t-[28px] sm:rounded-t-[32px] border-t border-x border-white/12 bg-[#0c1017]/95 p-4 sm:p-5 shadow-[0_-16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Centered Drag Handle */}
        <div
          className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-white/25 cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <h2
            id="setup-sheet-title"
            className="text-lg font-bold tracking-tight text-white font-display"
          >
            {t('rankHub.sheet.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-haptic flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white transition-colors"
            aria-label="Close"
          >
            <AppIcon icon={X} size={15} weight="bold" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-3.5 overflow-y-auto max-h-[75vh]">
          {/* ── Mode 'join': PIN Code Entry ── */}
          {mode === 'join' && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5 shadow-inner">
              <label
                htmlFor="rank-join-pin"
                className="text-[10px] font-bold tracking-wider uppercase text-muted block"
              >
                {t('rankHub.sheet.codeLabel')}
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute start-3 text-muted">
                  <AppIcon icon={Key} size={16} weight="bold" />
                </span>
                <input
                  id="rank-join-pin"
                  type="text"
                  autoFocus
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder={t('rankHub.sheet.codePlaceholder')}
                  className="w-full h-11 rounded-xl border border-white/12 bg-white/5 ps-9 pe-3 text-center text-lg font-bold tracking-widest text-white uppercase placeholder:text-muted/50 focus:border-[var(--hub-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--hub-accent)] font-mono"
                />
              </div>
            </div>
          )}

          {/* ── Manager Name Row: Avatar + Name + Randomize Button ── */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full border text-base font-bold text-white shadow-sm"
                style={{
                  borderColor: 'color-mix(in srgb, var(--hub-accent) 40%, transparent)',
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--hub-accent) 25%, transparent), rgba(255,255,255,0.05))',
                }}
              >
                {initialLetter}
              </div>
              <div className="min-w-0">
                <label
                  htmlFor={nameInputId}
                  className="text-[9.5px] font-bold tracking-widest uppercase text-muted block"
                >
                  {t('rankHub.sheet.managerLabel')}
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                  className="w-full bg-transparent p-0 text-sm font-bold text-white truncate focus:outline-none border-b border-transparent focus:border-[var(--hub-accent)]"
                  placeholder="Manager Name"
                  maxLength={24}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRandomize}
              className="btn-haptic flex shrink-0 items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-[var(--hub-accent)] hover:text-white transition-all cursor-pointer shadow-sm"
              title={t('rankHub.sheet.randomize')}
            >
              <AppIcon
                icon={Shuffle}
                size={14}
                weight="bold"
                className="text-[var(--hub-accent)]"
              />
              <span className="text-[11.5px]">{t('rankHub.sheet.randomize')}</span>
            </button>
          </div>

          {/* ── Mode !== 'join': Match Length Switch (3 or 5 Rounds) ── */}
          {mode !== 'join' && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted block px-1">
                {t('rankHub.sheet.matchLength')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* 3 Rounds */}
                <button
                  type="button"
                  onClick={() => handleSelectRounds(3)}
                  className={cn(
                    'btn-haptic flex flex-col items-center justify-center gap-0.5 rounded-2xl border p-2.5 transition-all cursor-pointer text-center',
                    roundCount === 3
                      ? 'border-[var(--hub-accent)] bg-[color-mix(in_srgb,var(--hub-accent)_12%,transparent)] shadow-[0_0_12px_var(--hub-accent-glow)]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs sm:text-[13px] font-bold',
                      roundCount === 3 ? 'text-white' : 'text-muted',
                    )}
                  >
                    {t('rankHub.sheet.rounds3').split('·')[0]}
                  </span>
                  <span className="text-[10.5px] opacity-75">
                    {t('rankHub.sheet.rounds3').split('·')[1] || '~2 min'}
                  </span>
                </button>

                {/* 5 Rounds */}
                <button
                  type="button"
                  onClick={() => handleSelectRounds(5)}
                  className={cn(
                    'btn-haptic flex flex-col items-center justify-center gap-0.5 rounded-2xl border p-2.5 transition-all cursor-pointer text-center',
                    roundCount === 5
                      ? 'border-[var(--hub-accent)] bg-[color-mix(in_srgb,var(--hub-accent)_12%,transparent)] shadow-[0_0_12px_var(--hub-accent-glow)]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs sm:text-[13px] font-bold',
                      roundCount === 5 ? 'text-white' : 'text-muted',
                    )}
                  >
                    {t('rankHub.sheet.rounds5').split('·')[0]}
                  </span>
                  <span className="text-[10.5px] opacity-75">
                    {t('rankHub.sheet.rounds5').split('·')[1] || '~4 min'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── Mode !== 'join': Collapsible "How scoring works" ── */}
          {mode !== 'join' && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowRules((prev) => !prev)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-start cursor-pointer hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                  <AppIcon
                    icon={ShieldCheck}
                    size={15}
                    weight="bold"
                    className="text-[var(--hub-accent)]"
                  />
                  <span>{t('rankHub.sheet.howScoringWorks')}</span>
                </div>
                <AppIcon
                  icon={CaretDown}
                  size={14}
                  weight="bold"
                  className={cn(
                    'text-muted transition-transform duration-200',
                    showRules && 'rotate-180',
                  )}
                />
              </button>

              {showRules && (
                <div className="px-3.5 pb-3 pt-0 border-t border-white/5 animate-fade-in">
                  <p className="text-[11.5px] leading-relaxed text-muted pt-2">
                    {t('rankHub.sheet.scoringRules')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Confirm Action Button (Hub CTA Style) ── */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (mode === 'join' && joinCode.trim().length !== 6)}
              className={cn(
                'hub-cta-btn btn-haptic relative flex h-14 w-full items-center justify-between overflow-hidden rounded-2xl px-5 text-start font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2',
                loading && 'pointer-events-none opacity-85',
                mode === 'join' && joinCode.trim().length !== 6 && 'opacity-60 cursor-not-allowed',
              )}
            >
              {/* Traveling Glint Sheen */}
              <span className="hub-cta-shine pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />

              <span className="relative z-10 text-[15px] sm:text-base font-extrabold uppercase tracking-wide text-[#07090F]">
                {buttonTitle}
              </span>

              <span className="hub-cta-arrow relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#07090F]/90 text-white shadow-inner">
                {loading ? (
                  <AppIcon icon={CircleNotch} size={16} className="animate-spin text-white" />
                ) : (
                  <AppIcon icon={ArrowRight} size={16} weight="bold" className="rtl:rotate-180" />
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
