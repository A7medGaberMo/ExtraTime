'use client';

import React, { Suspense, useState, useEffect, useCallback, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  ArrowLeft,
  Crosshair,
  Lightning,
  Ranking,
  Vault,
  LockKey,
  Globe,
  Users,
  UsersFour,
  UserCheck,
  Flame,
  Star,
  Crown,
  TShirt,
  Trophy,
  ShieldCheck,
  CircleNotch,
  type Icon,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PrimaryActionButton } from '@/components/hub/primary-action-button';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { cn } from '@/lib/utils';
import { type GameId } from '@/config/games';

type WhoCanJoin = 'private' | 'public';
type MatchSize = 11 | 5;
type PoolMode = 'ACTIVE' | 'GLOBAL' | 'EPL' | 'EGYPT' | 'ICONS';
type RankRounds = 3 | 5;
type RankTimer = 45 | 30 | 60;
type DraftChemistry = 'full' | 'relaxed';
type BankFormat = 'duel' | 'sprint';
type BankLadder = '2k' | '5k' | '10k';

interface GameTileDef {
  id: GameId;
  nameEn: string;
  nameAr: string;
  icon: Icon;
}

const GAMES: GameTileDef[] = [
  { id: 'snipe', nameEn: 'Snipe', nameAr: 'سنايب', icon: Crosshair },
  { id: 'draft', nameEn: 'Draft', nameAr: 'درافت', icon: TShirt },
  { id: 'rank', nameEn: 'Rank', nameAr: 'ترتيب', icon: Ranking },
  { id: 'bank', nameEn: 'Bank', nameAr: 'بَنِّك', icon: Vault },
];

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { lang, t } = useI18n();
  const isRtl = lang === 'ar';
  const gameSelectorId = useId();

  // ── 1. Game Selection & Persistence ──────────────────────────────
  const modeParam = (searchParams.get('mode') || searchParams.get('game') || '').toLowerCase();
  const initialGame: GameId =
    modeParam === 'rank'
      ? 'rank'
      : modeParam === 'draft'
        ? 'draft'
        : modeParam === 'bank'
          ? 'bank'
          : modeParam === 'snipe'
            ? 'snipe'
            : (() => {
              if (typeof window !== 'undefined') {
                try {
                  const last = localStorage.getItem('extratime_last_game');
                  if (last === 'rank' || last === 'draft' || last === 'bank') return last;
                } catch {
                  /* ignore */
                }
              }
              return 'snipe';
            })();

  const [selectedGame, setSelectedGame] = useState<GameId>(initialGame);

  useEffect(() => {
    if (modeParam === 'rank' || modeParam === 'draft' || modeParam === 'bank' || modeParam === 'snipe') {
      setSelectedGame(modeParam);
    }
  }, [modeParam]);

  const handleSelectGame = useCallback((game: GameId) => {
    setSelectedGame(game);
    try {
      localStorage.setItem('extratime_last_game', game);
    } catch {
      /* ignore */
    }
  }, []);

  // Keyboard navigation for Game Selector Radio Group
  const handleGameKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = isRtl ? (index - 1 + GAMES.length) % GAMES.length : (index + 1) % GAMES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = isRtl ? (index + 1) % GAMES.length : (index - 1 + GAMES.length) % GAMES.length;
    }
    if (nextIndex !== index) {
      handleSelectGame(GAMES[nextIndex].id);
      const el = document.getElementById(`game-tile-${GAMES[nextIndex].id}`);
      el?.focus();
    }
  };

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${selectedGame}`);
    }
  }, [router, selectedGame]);

  // Close / Back on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  // ── 2. Settings States & LocalStorage Persistence ────────────────
  // Snipe options
  const [matchSize, setMatchSize] = useState<MatchSize>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_snipe_size');
        if (val === '5') return 5;
      } catch { /* ignore */ }
    }
    return 11;
  });

  const [startingBudget, setStartingBudget] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = Number(localStorage.getItem('extratime_set_snipe_budget'));
        if (val === 150 || val === 200) return val;
      } catch { /* ignore */ }
    }
    return 100;
  });

  const [poolMode, setPoolMode] = useState<PoolMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_snipe_pool') as PoolMode | null;
        if (val && ['ACTIVE', 'GLOBAL', 'EPL', 'EGYPT', 'ICONS'].includes(val)) return val;
      } catch { /* ignore */ }
    }
    return 'ACTIVE';
  });

  // Rank options
  const [rankRounds, setRankRounds] = useState<RankRounds>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_rank_rounds');
        if (val === '5') return 5;
      } catch { /* ignore */ }
    }
    return 3;
  });

  const [rankTimer, setRankTimer] = useState<RankTimer>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = Number(localStorage.getItem('extratime_set_rank_timer'));
        if (val === 30 || val === 60) return val as RankTimer;
      } catch { /* ignore */ }
    }
    return 45;
  });

  // Draft options
  const [draftChemistry, setDraftChemistry] = useState<DraftChemistry>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_draft_chem') as DraftChemistry | null;
        if (val === 'relaxed') return 'relaxed';
      } catch { /* ignore */ }
    }
    return 'full';
  });

  const [draftPool, setDraftPool] = useState<PoolMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_draft_pool') as PoolMode | null;
        if (val && ['ACTIVE', 'GLOBAL', 'EPL', 'EGYPT', 'ICONS'].includes(val)) return val;
      } catch { /* ignore */ }
    }
    return 'ACTIVE';
  });

  // Bank options
  const [bankFormat, setBankFormat] = useState<BankFormat>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_bank_fmt') as BankFormat | null;
        if (val === 'sprint') return 'sprint';
      } catch { /* ignore */ }
    }
    return 'duel';
  });

  const [bankLadder, setBankLadder] = useState<BankLadder>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_bank_ladder') as BankLadder | null;
        if (val === '5k' || val === '10k') return val;
      } catch { /* ignore */ }
    }
    return '2k';
  });

  // Who Can Join
  const [whoCanJoin, setWhoCanJoin] = useState<WhoCanJoin>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('extratime_set_who_can_join') as WhoCanJoin | null;
        if (val === 'public') return 'public';
      } catch { /* ignore */ }
    }
    return 'private';
  });

  const handleSetWhoCanJoin = (val: WhoCanJoin) => {
    setWhoCanJoin(val);
    try {
      localStorage.setItem('extratime_set_who_can_join', val);
    } catch { /* ignore */ }
  };

  // Sync settings helper
  const updateSetting = <T,>(key: string, value: T, setter: (v: T) => void) => {
    setter(value);
    try {
      localStorage.setItem(`extratime_set_${key}`, String(value));
    } catch { /* ignore */ }
  };

  // ── 3. Convex Mutations & Action Logic ────────────────────────────
  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const findRankPublic = useMutation(api.rank.mutations.findOrCreatePublicMatch);
  const createDraftDuel = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const findDraftPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createBankDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);
  const findBankPublic = useMutation(api.bank.mutations.findOrCreatePublicMatch);
  const createBankSolo = useMutation(api.bank.mutations.createSoloGame);

  const [loading, setLoading] = useState(false);

  // Silent guest assurance without name card
  async function ensureGuestId(): Promise<Id<'guestUsers'>> {
    let name = '';
    let existingId: Id<'guestUsers'> | undefined = undefined;
    let sessionToken: string | undefined = undefined;

    try {
      name = localStorage.getItem('extratime_guestName') || '';
      const rawId = localStorage.getItem('extratime_guestId');
      if (rawId) existingId = rawId as Id<'guestUsers'>;
      sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;
    } catch {
      /* ignore */
    }

    if (!name.trim()) {
      name = randomName();
    }

    const res = await ensureGuest({
      existingId,
      sessionToken,
      nickname: name,
      avatarSeed: name,
    });

    try {
      localStorage.setItem('extratime_guestId', res.guestId);
      if (res.sessionToken) localStorage.setItem('extratime_sessionToken', res.sessionToken);
      localStorage.setItem('extratime_guestName', name);
    } catch {
      /* ignore */
    }

    return res.guestId as Id<'guestUsers'>;
  }

  async function handleCreateMatch() {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId();
      let sessionToken: string | undefined = undefined;
      try {
        sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;
      } catch {
        /* ignore */
      }

      if (selectedGame === 'snipe') {
        const room = await createSnipeRoom({
          hostId: guestId,
          sessionToken,
          matchSize,
          startingBudget,
          isPublic: whoCanJoin === 'public',
          poolMode,
        });
        router.push(`/auction/${room.roomId}`);
      } else if (selectedGame === 'rank') {
        if (whoCanJoin === 'private') {
          const result = await createRankDuel({ hostId: guestId, sessionToken, roundCount: rankRounds });
          router.push(`/rank/${result.gameId}`);
        } else {
          const result = await findRankPublic({ guestId, sessionToken, roundCount: rankRounds });
          router.push(`/rank/${result.gameId}`);
        }
      } else if (selectedGame === 'draft') {
        if (whoCanJoin === 'private') {
          const result = await createDraftDuel({ hostId: guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        } else {
          const result = await findDraftPublic({ guestId, sessionToken });
          router.push(`/draft/${result.gameId}`);
        }
      } else {
        // Bank
        if (bankFormat === 'sprint') {
          const result = await createBankSolo({ guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
        } else if (whoCanJoin === 'private') {
          const result = await createBankDuel({ hostId: guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
        } else {
          const result = await findBankPublic({ guestId, sessionToken });
          router.push(`/bank/${result.gameId}`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not create room', 'error');
      setLoading(false);
    }
  }

  // ── 4. Live Summary String ────────────────────────────────────────
  const getPoolLabel = (p: PoolMode) => {
    switch (p) {
      case 'ACTIVE': return isRtl ? 'نجوم حاليين' : 'Current stars';
      case 'GLOBAL': return isRtl ? 'شامل' : 'All players';
      case 'EPL': return isRtl ? 'البريميرليج' : 'Premier League';
      case 'EGYPT': return isRtl ? 'الدوري المصري' : 'Egyptian League';
      case 'ICONS': return isRtl ? 'الأساطير' : 'Legends';
    }
  };

  const getSummaryLine = (): string => {
    if (selectedGame === 'snipe') {
      const sizeStr = matchSize === 11 ? (isRtl ? '11 ضد 11' : '11 vs 11') : (isRtl ? '5 ضد 5' : '5 vs 5');
      const budgetStr = `$${startingBudget}M`;
      const poolStr = getPoolLabel(poolMode);
      return `${sizeStr} · ${budgetStr} · ${poolStr}`;
    }
    if (selectedGame === 'draft') {
      const sizeStr = isRtl ? '11 ضد 11' : '11 vs 11';
      const chemStr = draftChemistry === 'full' ? (isRtl ? 'كيمياء كاملة' : 'Full chemistry') : (isRtl ? 'ربط حر' : 'Free link');
      const poolStr = getPoolLabel(draftPool);
      return `${sizeStr} · ${chemStr} · ${poolStr}`;
    }
    if (selectedGame === 'rank') {
      const roundsStr = isRtl ? `${rankRounds} جولات` : `${rankRounds} Rounds`;
      const timeStr = `${rankTimer}s`;
      const joinStr = whoCanJoin === 'private' ? (isRtl ? 'كود لأصحابك' : 'Friends with code') : (isRtl ? 'مفتوحة للجميع' : 'Open to anyone');
      return `${roundsStr} · ${timeStr} · ${joinStr}`;
    }
    // Bank
    const fmtStr = bankFormat === 'duel' ? (isRtl ? 'مبارزة 1 ضد 1' : '1v1 Duel') : (isRtl ? 'سباق فردي' : 'Solo Sprint');
    const ladderStr = `${bankLadder.toUpperCase()} Pts`;
    const joinStr = whoCanJoin === 'private' ? (isRtl ? 'كود لأصحابك' : 'Friends with code') : (isRtl ? 'مفتوحة للجميع' : 'Open to anyone');
    return `${fmtStr} · ${ladderStr} · ${joinStr}`;
  };

  return (
    <div
      data-game={selectedGame}
      className="hub-page relative flex h-[100dvh] max-h-[100dvh] w-full flex-col justify-between items-center overflow-hidden bg-[#07090F] select-none transition-colors duration-300"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 8px) + 52px + 10px)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 8px)',
      }}
    >
      {/* ── Background: Subtle Tactical Pitch Grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      {/* ── Atmospheric Vignette ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,9,15,0.75)_100%)]"
        aria-hidden="true"
      />

      {/* ── Atmospheric Core Glow (Token Driven & Animated Breathing) ── */}
      <div
        className="hub-core-glow pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-[52%] rounded-full blur-3xl sm:h-[460px] sm:w-[460px] transition-all duration-500"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--hub-accent) 24%, transparent) 0%, color-mix(in srgb, var(--hub-accent) 6%, transparent) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Center Content Column (Max 500px) ── */}
      <div className="relative z-10 mx-auto flex h-full max-h-full w-full max-w-[500px] flex-1 min-h-0 flex-col justify-between px-3.5 sm:px-4">
        {/* ── 1. TITLE BLOCK (Compact & Refined) ── */}
        <div className="relative w-full flex flex-col items-center text-center shrink-0">
          {/* Small 36px Circular Glass Back Button */}
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            title={t('common.back')}
            className="btn-haptic absolute start-0 top-1/2 -translate-y-1/2 size-9 rounded-full border border-white/10 bg-white/[0.04] text-[#C5CAD6] hover:text-white hover:border-[var(--hub-accent)] hover:shadow-[0_0_12px_var(--hub-accent-glow)] flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xs z-20"
          >
            <AppIcon icon={ArrowLeft} size={15} weight="bold" className="rtl:rotate-180" />
          </button>

          {/* Eyebrow with Side Lines */}
          <div
            data-hub-eyebrow
            className="hub-eyebrow-container flex w-full shrink-0 items-center justify-center gap-2.5 sm:gap-3"
            style={{ height: '20px', marginBottom: '3px' }}
          >
            <span className="hub-eyebrow-line shrink-0" aria-hidden="true" />
            <span className="hub-eyebrow shrink-0">
              {isRtl ? 'إعداد الغرفة' : 'ROOM SETUP'}
            </span>
            <span className="hub-eyebrow-line hub-eyebrow-line-end shrink-0" aria-hidden="true" />
          </div>

          {/* Title with Metallic Sheen */}
          <div
            data-hub-title
            className="flex w-full shrink-0 items-center justify-center text-center"
            style={{ height: '36px', marginBottom: '2px' }}
          >
            <h1 className="hub-title hub-title-sheen leading-none drop-shadow-lg text-[27px] sm:text-[32px]">
              {isRtl ? 'إنشاء غرفة' : 'Create Room'}
            </h1>
          </div>

          {/* Subtitle (Hidden on short screens <= 660px as per shrink order 1) */}
          <div
            data-hub-subtitle
            className="hidden [@media(min-height:660px)]:flex w-full shrink-0 items-center justify-center text-center"
            style={{ height: '20px' }}
          >
            <p
              className="hub-body leading-[1.4] text-center text-[#C5CAD6] truncate max-w-full"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {isRtl ? 'اختر اللعبة وحدد القواعد وادعُ منافسًا.' : 'Pick the game, set the rules, invite a rival.'}
            </p>
          </div>
        </div>

        {/* ── 2. GAME SELECTOR (Radio Group, 4 equal tiles) ── */}
        <div
          id={gameSelectorId}
          role="radiogroup"
          aria-label={isRtl ? 'اللعبة' : 'Game'}
          className="w-full grid grid-cols-4 gap-2 shrink-0 my-1 sm:my-1.5"
        >
          {GAMES.map((game, idx) => {
            const isSelected = selectedGame === game.id;
            const IconComp = game.icon;

            return (
              <button
                key={game.id}
                id={`game-tile-${game.id}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleSelectGame(game.id)}
                onKeyDown={(e) => handleGameKeyDown(e, idx)}
                className={cn(
                  'btn-haptic relative group flex h-[50px] sm:h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2',
                  isSelected
                    ? 'border-transparent text-[#05070B] font-bold shadow-lg'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#C5CAD6] hover:border-white/20 hover:text-white hover:bg-white/[0.06]',
                )}
                style={
                  isSelected
                    ? {
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      boxShadow: '0 0 20px var(--hub-accent-glow), 0 2px 8px rgba(0, 0, 0, 0.3)',
                      color: 'var(--game-on-accent, #05070b)',
                      outlineColor: 'var(--hub-accent)',
                    }
                    : undefined
                }
              >
                <AppIcon
                  icon={IconComp}
                  size={20}
                  weight={isSelected ? 'fill' : 'duotone'}
                  className={isSelected ? 'text-[#05070B]' : 'text-[#C5CAD6] transition-colors group-hover:text-white'}
                />
                <span className={cn(
                  'text-[12px] sm:text-[13px] font-bold leading-none tracking-tight',
                  isRtl && 'font-cairo text-[13px] sm:text-[14px]',
                )}>
                  {isRtl ? game.nameAr : game.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3. CONTROL DECK (Single Glass Card with 1px dividers) ── */}
        <div className="w-full flex-1 min-h-0 flex flex-col justify-center my-1 sm:my-1.5">
          <div
            className="w-full rounded-2xl sm:rounded-3xl border bg-white/[0.03] p-3 sm:p-3.5 backdrop-blur-xl shadow-2xl flex flex-col justify-around gap-1 divide-y divide-white/[0.06] transition-all duration-300"
            style={{
              borderColor: 'color-mix(in srgb, var(--hub-accent) 20%, rgba(255, 255, 255, 0.08))',
              boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* ═══ SNIPE SETTINGS ═══ */}
            {selectedGame === 'snipe' && (
              <>
                {/* Row 1: Match Format (Type B) */}
                <div className="flex min-h-[48px] sm:min-h-[52px] items-center justify-between gap-2 pt-1 first:pt-0">
                  <span className={cn(
                    "w-[82px] sm:w-[96px] shrink-0 text-[12px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'نظام الماتش' : 'Match format'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => updateSetting('snipe_size', 11, setMatchSize)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-1.5 rounded-xl border px-1.5 transition-all cursor-pointer text-start backdrop-blur-md',
                        matchSize === 11
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        matchSize === 11
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon
                        icon={UsersFour}
                        size={17}
                        weight={matchSize === 11 ? 'fill' : 'duotone'}
                        className={matchSize === 11 ? 'text-[#05070B]' : 'text-white/60'}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[11.5px] sm:text-[12.5px] font-bold leading-tight whitespace-nowrap",
                          isRtl && "font-cairo text-[12.5px] sm:text-[13.5px]"
                        )}>
                          {isRtl ? 'ماتش كامل' : 'Full match'}
                        </span>
                        <span
                          dir="ltr"
                          className={cn(
                            'text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block',
                            matchSize === 11 ? 'text-[#05070B]/85 font-bold' : 'text-white/45',
                          )}
                        >
                          11 vs 11
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('snipe_size', 5, setMatchSize)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-1.5 rounded-xl border px-1.5 transition-all cursor-pointer text-start backdrop-blur-md',
                        matchSize === 5
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        matchSize === 5
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon
                        icon={Users}
                        size={17}
                        weight={matchSize === 5 ? 'fill' : 'duotone'}
                        className={matchSize === 5 ? 'text-[#05070B]' : 'text-white/60'}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[11.5px] sm:text-[12.5px] font-bold leading-tight whitespace-nowrap",
                          isRtl && "font-cairo text-[12.5px] sm:text-[13.5px]"
                        )}>
                          {isRtl ? 'خماسي' : '5-a-side'}
                        </span>
                        <span
                          dir="ltr"
                          className={cn(
                            'text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block',
                            matchSize === 5 ? 'text-[#05070B]/85 font-bold' : 'text-white/45',
                          )}
                        >
                          5 vs 5
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Row 2: Starting Budget (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2 pt-1.5">
                  <span className={cn(
                    "w-[82px] sm:w-[96px] shrink-0 text-[12px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'الميزانية المبدئية' : 'Starting budget'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    {[100, 150, 200].map((b) => {
                      const isSel = startingBudget === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateSetting('snipe_budget', b, setStartingBudget)}
                          className={cn(
                            'btn-haptic flex-1 h-7.5 sm:h-8 rounded-lg text-[11.5px] sm:text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center',
                            isSel
                              ? 'text-[#05070B] font-extrabold shadow-sm'
                              : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 12px var(--hub-accent-glow)',
                                }
                              : undefined
                          }
                        >
                          <bdi dir="ltr">${b}M</bdi>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: Player Pool (Type C) */}
                <div className="flex flex-col gap-1 pt-1.5">
                  <div className={cn(
                    "text-[12px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'مجموعة اللاعبين' : 'Player pool'}
                  </div>
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {[
                      { id: 'ACTIVE', labelEn: 'Current stars', labelAr: 'نجوم حاليين', icon: UserCheck },
                      { id: 'GLOBAL', labelEn: 'All players', labelAr: 'شامل', icon: Globe },
                      { id: 'EPL', labelEn: 'Premier League', labelAr: 'البريميرليج', icon: Flame },
                      { id: 'EGYPT', labelEn: 'Egyptian League', labelAr: 'الدوري المصري', icon: Star },
                      { id: 'ICONS', labelEn: 'Legends', labelAr: 'الأساطير', icon: Crown },
                    ].map((pool) => {
                      const isSel = poolMode === pool.id;
                      const IconC = pool.icon;
                      return (
                        <button
                          key={pool.id}
                          type="button"
                          onClick={() => updateSetting('snipe_pool', pool.id as PoolMode, setPoolMode)}
                          className={cn(
                            'btn-haptic flex h-[48px] sm:h-[54px] flex-col items-center justify-center rounded-xl border p-0.5 text-center transition-all cursor-pointer backdrop-blur-md',
                            isSel
                              ? 'border-transparent text-[#05070B] font-bold shadow-md'
                              : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:text-white hover:bg-white/[0.04]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 14px var(--hub-accent-glow)',
                                  color: 'var(--game-on-accent, #05070b)',
                                }
                              : undefined
                          }
                        >
                          <AppIcon
                            icon={IconC}
                            size={16}
                            weight={isSel ? 'fill' : 'duotone'}
                            className={isSel ? 'text-[#05070B]' : 'text-white/60'}
                          />
                          <span className={cn(
                            "text-[9.5px] sm:text-[10px] font-bold leading-tight line-clamp-2 mt-0.5",
                            isRtl && "font-cairo text-[10.5px] sm:text-[11px]"
                          )}>
                            {isRtl ? pool.labelAr : pool.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ═══ DRAFT SETTINGS ═══ */}
            {selectedGame === 'draft' && (
              <>
                {/* Row 1: Match Format (Type B) */}
                <div className="flex min-h-[48px] sm:min-h-[52px] items-center justify-between gap-2.5 pt-1 first:pt-0">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'نظام الماتش' : 'Match format'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
                    <div
                      className="flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border border-transparent font-bold text-[#05070B] shadow-md px-2 text-start"
                      style={{
                        background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                        color: 'var(--game-on-accent, #05070b)',
                        boxShadow: '0 0 14px var(--hub-accent-glow)',
                      }}
                    >
                      <AppIcon icon={TShirt} size={18} weight="fill" className="text-[#05070B]" />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? 'ماتش كامل' : '11 vs 11'}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] text-[#05070B]/85 font-bold hidden [@media(min-height:660px)]:block">
                          {isRtl ? 'تشكيلة 11 لاعب' : 'Full lineup'}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] px-2 text-start">
                      <AppIcon icon={Lightning} size={18} weight="duotone" className="text-white/60" />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate text-white/90", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? 'اختيار بالدور' : 'Turn-based'}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] text-white/45 hidden [@media(min-height:660px)]:block">
                          {isRtl ? 'لاعب في كل دور' : '1 pick per turn'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Chemistry (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2.5 pt-1.5">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'نظام الكيمياء' : 'Chemistry'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    {[
                      { id: 'full', labelEn: 'Full Synergy', labelAr: 'نادي · دوري · جنسية' },
                      { id: 'relaxed', labelEn: 'Free Link', labelAr: 'ربط حر' },
                    ].map((opt) => {
                      const isSel = draftChemistry === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSetting('draft_chem', opt.id as DraftChemistry, setDraftChemistry)}
                          className={cn(
                            'btn-haptic flex-1 h-7.5 sm:h-8 rounded-lg text-[11.5px] sm:text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center',
                            isSel
                              ? 'text-[#05070B] font-extrabold shadow-sm'
                              : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                            isRtl && 'font-cairo text-[12px] sm:text-[13px]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 12px var(--hub-accent-glow)',
                                  color: 'var(--game-on-accent, #05070b)',
                                }
                              : undefined
                          }
                        >
                          {isRtl ? opt.labelAr : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: Player Pool (Type C) */}
                <div className="flex flex-col gap-1 pt-1.5">
                  <div className={cn(
                    "text-[12px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'مجموعة اللاعبين' : 'Player pool'}
                  </div>
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {[
                      { id: 'ACTIVE', labelEn: 'Current stars', labelAr: 'نجوم حاليين', icon: UserCheck },
                      { id: 'GLOBAL', labelEn: 'All players', labelAr: 'شامل', icon: Globe },
                      { id: 'EPL', labelEn: 'Premier League', labelAr: 'البريميرليج', icon: Flame },
                      { id: 'EGYPT', labelEn: 'Egyptian League', labelAr: 'الدوري المصري', icon: Star },
                      { id: 'ICONS', labelEn: 'Legends', labelAr: 'الأساطير', icon: Crown },
                    ].map((pool) => {
                      const isSel = draftPool === pool.id;
                      const IconC = pool.icon;
                      return (
                        <button
                          key={pool.id}
                          type="button"
                          onClick={() => updateSetting('draft_pool', pool.id as PoolMode, setDraftPool)}
                          className={cn(
                            'btn-haptic flex h-[48px] sm:h-[54px] flex-col items-center justify-center rounded-xl border p-0.5 text-center transition-all cursor-pointer backdrop-blur-md',
                            isSel
                              ? 'border-transparent text-[#05070B] font-bold shadow-md'
                              : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:text-white hover:bg-white/[0.04]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 14px var(--hub-accent-glow)',
                                  color: 'var(--game-on-accent, #05070b)',
                                }
                              : undefined
                          }
                        >
                          <AppIcon
                            icon={IconC}
                            size={16}
                            weight={isSel ? 'fill' : 'duotone'}
                            className={isSel ? 'text-[#05070B]' : 'text-white/60'}
                          />
                          <span className={cn(
                            "text-[9.5px] sm:text-[10px] font-bold leading-tight line-clamp-2 mt-0.5",
                            isRtl && "font-cairo text-[10.5px] sm:text-[11px]"
                          )}>
                            {isRtl ? pool.labelAr : pool.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ═══ RANK SETTINGS ═══ */}
            {selectedGame === 'rank' && (
              <>
                {/* Row 1: Match Rounds (Type B) */}
                <div className="flex min-h-[48px] sm:min-h-[52px] items-center justify-between gap-2.5 pt-1 first:pt-0">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'نظام الماتش' : 'Match format'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => updateSetting('rank_rounds', 3, setRankRounds)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border px-2 transition-all cursor-pointer text-start backdrop-blur-md',
                        rankRounds === 3
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        rankRounds === 3
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon icon={Ranking} size={18} weight={rankRounds === 3 ? 'fill' : 'duotone'} className={rankRounds === 3 ? 'text-[#05070B]' : 'text-white/60'} />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? '3 جولات' : '3 Rounds'}
                        </span>
                        <span className={cn('text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block', rankRounds === 3 ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'سريع · ~2 دقيقة' : 'Fast sprint · ~2m'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('rank_rounds', 5, setRankRounds)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border px-2 transition-all cursor-pointer text-start backdrop-blur-md',
                        rankRounds === 5
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        rankRounds === 5
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon icon={Trophy} size={18} weight={rankRounds === 5 ? 'fill' : 'duotone'} className={rankRounds === 5 ? 'text-[#05070B]' : 'text-white/60'} />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? '5 جولات' : '5 Rounds'}
                        </span>
                        <span className={cn('text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block', rankRounds === 5 ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'ماتش كامل · ~4 دقائق' : 'Full duel · ~4m'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Row 2: Round Timer (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2.5 pt-1.5">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'وقت الجولة' : 'Round timer'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    {[30, 45, 60].map((sec) => {
                      const isSel = rankTimer === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => updateSetting('rank_timer', sec as RankTimer, setRankTimer)}
                          className={cn(
                            'btn-haptic flex-1 h-7.5 sm:h-8 rounded-lg text-[11.5px] sm:text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center',
                            isSel
                              ? 'text-[#05070B] font-extrabold shadow-sm'
                              : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 12px var(--hub-accent-glow)',
                                }
                              : undefined
                          }
                        >
                          <bdi dir="ltr">{sec}s</bdi>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: Scoring System (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2.5 pt-1.5">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'احتساب النقاط' : 'Scoring'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    <div
                      className="flex-1 h-7.5 sm:h-8 rounded-lg text-[11px] sm:text-[12px] font-bold text-[#05070B] shadow-sm flex items-center justify-center gap-1.5 px-2"
                      style={{
                        background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                        boxShadow: '0 0 12px var(--hub-accent-glow)',
                      }}
                    >
                      <AppIcon icon={ShieldCheck} size={15} weight="fill" className="text-[#05070B]" />
                      <span>{isRtl ? '+2 دقة الترتيب' : '+2 Distance Scoring'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══ BANK SETTINGS ═══ */}
            {selectedGame === 'bank' && (
              <>
                {/* Row 1: Challenge Format (Type B) */}
                <div className="flex min-h-[48px] sm:min-h-[52px] items-center justify-between gap-2.5 pt-1 first:pt-0">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'نظام التحدي' : 'Challenge mode'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => updateSetting('bank_fmt', 'duel', setBankFormat)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border px-2 transition-all cursor-pointer text-start backdrop-blur-md',
                        bankFormat === 'duel'
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        bankFormat === 'duel'
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon icon={Users} size={18} weight={bankFormat === 'duel' ? 'fill' : 'duotone'} className={bankFormat === 'duel' ? 'text-[#05070B]' : 'text-white/60'} />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? 'مبارزة 1 ضد 1' : '1v1 Duel'}
                        </span>
                        <span className={cn('text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block', bankFormat === 'duel' ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'جولتان · وقت حاسم' : '2 rounds · Sudden death'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('bank_fmt', 'sprint', setBankFormat)}
                      className={cn(
                        'btn-haptic flex h-[44px] sm:h-[48px] items-center justify-center gap-2 rounded-xl border px-2 transition-all cursor-pointer text-start backdrop-blur-md',
                        bankFormat === 'sprint'
                          ? 'border-transparent font-bold shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#C5CAD6] hover:border-white/15 hover:bg-white/[0.04]',
                      )}
                      style={
                        bankFormat === 'sprint'
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 14px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <AppIcon icon={Lightning} size={18} weight={bankFormat === 'sprint' ? 'fill' : 'duotone'} className={bankFormat === 'sprint' ? 'text-[#05070B]' : 'text-white/60'} />
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12px] sm:text-[12.5px] font-bold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[13.5px]")}>
                          {isRtl ? 'سباق فردي' : 'Solo Sprint'}
                        </span>
                        <span className={cn('text-[9.5px] sm:text-[10px] leading-tight font-medium hidden [@media(min-height:660px)]:block', bankFormat === 'sprint' ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? '90 ثانية · كسر الأرقام' : '90s high-score run'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Row 2: Target Ladder (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2.5 pt-1.5">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'سلّم النقاط' : 'Target ladder'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    {(['2k', '5k', '10k'] as BankLadder[]).map((lad) => {
                      const isSel = bankLadder === lad;
                      return (
                        <button
                          key={lad}
                          type="button"
                          onClick={() => updateSetting('bank_ladder', lad, setBankLadder)}
                          className={cn(
                            'btn-haptic flex-1 h-7.5 sm:h-8 rounded-lg text-[11.5px] sm:text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center',
                            isSel
                              ? 'text-[#05070B] font-extrabold shadow-sm'
                              : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                          )}
                          style={
                            isSel
                              ? {
                                  background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                                  boxShadow: '0 0 12px var(--hub-accent-glow)',
                                }
                              : undefined
                          }
                        >
                          <bdi dir="ltr">{lad.toUpperCase()} Pts</bdi>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: Push-Your-Luck Rules (Type A) */}
                <div className="flex min-h-[42px] sm:min-h-[46px] items-center justify-between gap-2.5 pt-1.5">
                  <span className={cn(
                    "w-[88px] sm:w-[98px] shrink-0 text-[12.5px] sm:text-[13px] font-semibold text-white/70 text-start",
                    isRtl && "font-cairo text-[13.5px] sm:text-[14px] font-bold text-white/80"
                  )}>
                    {isRtl ? 'المخاطرة' : 'Risk rules'}
                  </span>
                  <div className="flex-1 flex items-center p-1 rounded-xl border border-white/[0.06] bg-black/40 gap-1 backdrop-blur-md">
                    <div
                      className="flex-1 h-7.5 sm:h-8 rounded-lg text-[11px] sm:text-[12px] font-bold text-[#05070B] shadow-sm flex items-center justify-center gap-1.5 px-2"
                      style={{
                        background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                        boxShadow: '0 0 12px var(--hub-accent-glow)',
                      }}
                    >
                      <AppIcon icon={Vault} size={15} weight="fill" className="text-[#05070B]" />
                      <span>{isRtl ? 'مضاعفة 2X أو تصفير' : '2X Doubling · Wipeout Risk'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 4. WHO CAN JOIN (Segmented Control directly above Main Button) ── */}
        <div className="w-full shrink-0 my-1 sm:my-1.5">
          <div className="grid grid-cols-2 h-11 sm:h-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1 gap-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleSetWhoCanJoin('private')}
              className={cn(
                'btn-haptic flex items-center justify-center gap-2 rounded-xl text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer',
                whoCanJoin === 'private'
                  ? 'border-transparent text-[#05070B] shadow-md'
                  : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                isRtl && 'font-cairo text-[13.5px] sm:text-[14px]',
              )}
              style={
                whoCanJoin === 'private'
                  ? {
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      color: 'var(--game-on-accent, #05070b)',
                      boxShadow: '0 0 14px var(--hub-accent-glow)',
                    }
                  : undefined
              }
            >
              <AppIcon
                icon={LockKey}
                size={16}
                weight={whoCanJoin === 'private' ? 'fill' : 'duotone'}
                className={whoCanJoin === 'private' ? 'text-[#05070B]' : 'text-white/60'}
              />
              <span>{isRtl ? 'كود لأصحابك' : 'Friends with code'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetWhoCanJoin('public')}
              className={cn(
                'btn-haptic flex items-center justify-center gap-2 rounded-xl text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer',
                whoCanJoin === 'public'
                  ? 'border-transparent text-[#05070B] shadow-md'
                  : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                isRtl && 'font-cairo text-[13.5px] sm:text-[14px]',
              )}
              style={
                whoCanJoin === 'public'
                  ? {
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      color: 'var(--game-on-accent, #05070b)',
                      boxShadow: '0 0 14px var(--hub-accent-glow)',
                    }
                  : undefined
              }
            >
              <AppIcon
                icon={Globe}
                size={16}
                weight={whoCanJoin === 'public' ? 'fill' : 'duotone'}
                className={whoCanJoin === 'public' ? 'text-[#05070B]' : 'text-white/60'}
              />
              <span>{isRtl ? 'مفتوحة للجميع' : 'Open to anyone'}</span>
            </button>
          </div>
        </div>

        {/* ── 5. MAIN ACTION BUTTON (Pinned to Bottom) ── */}
        <div className="w-full shrink-0">
          <PrimaryActionButton
            id="create-room-submit-btn"
            title={isRtl ? 'إنشاء الغرفة' : 'CREATE ROOM'}
            subtitle={getSummaryLine()}
            loadingTitle={isRtl ? 'جاري تجهيز الغرفة…' : 'Setting up room…'}
            onClick={handleCreateMatch}
            loading={loading}
            disabled={loading}
            className="h-14 sm:h-[62px]"
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-[#07090F]">
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-amber-400 animate-spin" />
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
