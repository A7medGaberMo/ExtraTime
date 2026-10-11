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
  Vault,
  TrendUp,
  Timer,
  WarningCircle,
  Crown,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useI18n } from '@/lib/i18n';
import { calculateLadderPoints } from '@/types/bank';

export type BankSetupMode = 'solo' | 'quick' | 'join' | 'rules';

export interface BankSetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: BankSetupMode;
  onConfirm: (config: {
    nickname: string;
    joinCode?: string;
  }) => Promise<void>;
  loading: boolean;
}

const LADDER_PREVIEW_STEPS = [1, 2, 4, 8, 12];

export function BankSetupSheet({
  isOpen,
  onClose,
  mode,
  onConfirm,
  loading,
}: BankSetupSheetProps) {
  const { t, lang } = useI18n();
  const isArabic = lang === 'ar';
  const nameInputId = useId();

  // Nickname state
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extratime_guestName') || randomName();
    }
    return randomName();
  });

  // Join PIN code (for join mode)
  const [joinCode, setJoinCode] = useState('');

  // Collapsible rules
  const [showRules, setShowRules] = useState(mode === 'rules');
  const [prevMode, setPrevMode] = useState(mode);

  if (mode !== prevMode) {
    setPrevMode(mode);
    if (mode === 'rules') {
      setShowRules(true);
    }
  }

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

    if (mode === 'rules') {
      onClose();
      return;
    }

    const trimmed = nickname.trim() || randomName();
    setNickname(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('extratime_guestName', trimmed);
    }

    await onConfirm({
      nickname: trimmed,
      joinCode: mode === 'join' ? joinCode.trim().toUpperCase() : undefined,
    });
  };

  // Dynamic button title
  let buttonTitle = '';
  if (loading) {
    if (mode === 'solo') buttonTitle = t('bankHub.startingSolo');
    else if (mode === 'quick') buttonTitle = t('bankHub.findingMatch');
    else buttonTitle = isArabic ? 'جاري الانضمام...' : 'Joining Room...';
  } else {
    if (mode === 'solo') buttonTitle = isArabic ? 'بدء تحدي بنك الفردي' : 'START SOLO SPRINT';
    else if (mode === 'quick') buttonTitle = isArabic ? 'البحث عن منافس' : 'FIND PUBLIC DUEL';
    else if (mode === 'rules') buttonTitle = t('bankHub.sheet.gotIt');
    else buttonTitle = isArabic ? 'دخول الغرفة' : 'ENTER BANK ROOM';
  }

  const initialLetter = nickname.trim().charAt(0).toUpperCase() || 'M';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-setup-sheet-title"
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
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--hub-accent)]/15 border border-[var(--hub-accent)]/30 text-[var(--hub-accent)]">
              <AppIcon icon={Vault} size={16} weight="duotone" />
            </div>
            <h2
              id="bank-setup-sheet-title"
              className={`text-lg font-bold tracking-tight text-white ${isArabic ? 'font-cairo' : 'font-display'}`}
            >
              {t('bankHub.sheet.title')}
            </h2>
          </div>
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
                htmlFor="bank-join-pin"
                className="text-[10px] font-bold tracking-wider uppercase text-muted block"
              >
                {t('bankHub.joinWithCodeSub')}
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute start-3 text-muted">
                  <AppIcon icon={Key} size={16} weight="bold" />
                </span>
                <input
                  id="bank-join-pin"
                  type="text"
                  autoFocus
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="EX: ABC123"
                  className="w-full h-11 rounded-xl border border-white/12 bg-white/5 ps-9 pe-3 text-center text-lg font-bold tracking-widest text-white uppercase placeholder:text-muted/50 focus:border-[var(--hub-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--hub-accent)] font-mono"
                />
              </div>
            </div>
          )}

          {/* ── Manager Name Row: Avatar + Name + Randomize Button (except pure rules view) ── */}
          {mode !== 'rules' && (
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
                    {isArabic ? 'اسم المدير' : 'MANAGER NAME'}
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
                title={isArabic ? 'اسم عشوائي' : 'Randomize name'}
              >
                <AppIcon
                  icon={Shuffle}
                  size={14}
                  weight="bold"
                  className="text-[var(--hub-accent)]"
                />
                <span className="text-[11.5px]">{isArabic ? 'عشوائي' : 'Random'}</span>
              </button>
            </div>
          )}

          {/* ── Interactive Rules Drawer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowRules((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 text-start hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[var(--hub-accent)]/15 border border-[var(--hub-accent)]/30 text-[var(--hub-accent)]">
                  <AppIcon icon={ShieldCheck} size={14} weight="bold" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold text-white ${isArabic ? 'font-cairo' : 'font-display'}`}>
                    {t('bankHub.sheet.title')}
                  </span>
                  <span className="text-[10px] text-muted">
                    {t('bankHub.sheet.subtitle')}
                  </span>
                </div>
              </div>
              <AppIcon
                icon={CaretDown}
                size={14}
                weight="bold"
                className={`text-muted transition-transform duration-200 ${
                  showRules ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {showRules && (
              <div className="border-t border-white/8 p-3 pt-2.5 space-y-2.5 text-xs text-foreground animate-fade-in">
                {/* Doubling Ladder Pill Preview */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <AppIcon icon={TrendUp} size={13} weight="bold" className="text-[var(--hub-accent)]" />
                      <span>{t('bankHub.sheet.ladderTitle')}</span>
                    </span>
                    <span className="text-[10px] font-stats text-[var(--hub-accent)] font-bold">
                      x1 → x12
                    </span>
                  </div>
                  <p className="text-[10.5px] text-muted leading-relaxed">
                    {t('bankHub.sheet.ladderDesc')}
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    {LADDER_PREVIEW_STEPS.map((s) => (
                      <div
                        key={s}
                        className="flex-1 py-1 rounded-lg border border-white/8 bg-white/[0.03] text-center"
                      >
                        <span className="block text-[9px] text-muted font-stats">#{s}</span>
                        <span className="block text-[10px] font-stats font-bold text-[var(--hub-accent)]">
                          {calculateLadderPoints(s)}
                        </span>
                      </div>
                    ))}
                    <div className="flex-1 py-1 rounded-lg border border-[var(--hub-accent)]/40 bg-[var(--hub-accent)]/15 text-center shadow-[0_0_10px_var(--game-glow)]">
                      <span className="block text-[9px] text-[var(--hub-accent)] font-stats flex items-center justify-center gap-0.5">
                        <AppIcon icon={Crown} size={9} weight="fill" />
                        <span>#12</span>
                      </span>
                      <span className="block text-[10px] font-stats font-black text-white">
                        2048
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2 Stacking Rule Tiles: Bank It & Wipeout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-xl border border-success/30 bg-success/[0.06] p-2.5 space-y-1">
                    <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
                      <AppIcon icon={Vault} size={13} weight="duotone" />
                      <span>{t('bankHub.sheet.bankCardTitle')}</span>
                    </span>
                    <p className="text-[10px] text-muted leading-snug">
                      {t('bankHub.sheet.bankCardDesc')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-danger/30 bg-danger/[0.06] p-2.5 space-y-1">
                    <span className="text-[11px] font-bold text-danger flex items-center gap-1.5">
                      <AppIcon icon={WarningCircle} size={13} weight="bold" />
                      <span>{t('bankHub.sheet.wipeCardTitle')}</span>
                    </span>
                    <p className="text-[10px] text-muted leading-snug">
                      {t('bankHub.sheet.wipeCardDesc')}
                    </p>
                  </div>
                </div>

                {/* Timer Footnote */}
                <div className="flex items-center gap-1.5 text-[10.5px] text-muted pt-0.5">
                  <AppIcon icon={Timer} size={13} weight="bold" className="text-[var(--hub-accent)] shrink-0" />
                  <span>{t('bankHub.sheet.timerInfo')}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Confirm CTA Button ── */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || (mode === 'join' && joinCode.trim().length !== 6)}
              className="btn-haptic group relative flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-black uppercase tracking-wider text-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_var(--game-glow)]"
              style={{
                background:
                  'linear-gradient(135deg, var(--hub-accent-light, #fecdd3), var(--hub-accent, #fb7185) 50%, var(--hub-accent-deep, #be123c))',
                color: 'var(--game-on-accent, #4c0519)',
              }}
            >
              {loading ? (
                <>
                  <AppIcon icon={CircleNotch} size={18} weight="bold" className="animate-spin" />
                  <span>{buttonTitle}</span>
                </>
              ) : (
                <>
                  <span className={isArabic ? 'font-cairo font-black text-sm' : 'font-display font-black tracking-wide'}>
                    {buttonTitle}
                  </span>
                  <AppIcon
                    icon={ArrowRight}
                    size={16}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
