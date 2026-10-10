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
  Coins,
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
  subtitleEn: string;
  subtitleAr: string;
  icon: Icon;
}

const GAMES: GameTileDef[] = [
  { id: 'snipe', nameEn: 'Snipe', nameAr: 'سنايب', subtitleEn: 'Auction', subtitleAr: 'المزاد', icon: Crosshair },
  { id: 'draft', nameEn: 'Draft', nameAr: 'درافت', subtitleEn: 'Squad', subtitleAr: 'التشكيلة', icon: TShirt },
  { id: 'rank', nameEn: 'Rank', nameAr: 'ترتيب', subtitleEn: 'Tiers', subtitleAr: 'القوائم', icon: Ranking },
  { id: 'bank', nameEn: 'Bank', nameAr: 'بَنِّك', subtitleEn: 'Vault', subtitleAr: 'الخزنة', icon: Vault },
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

  // Keyboard navigation for Game Selector
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
      className="hub-page relative flex h-[100dvh] max-h-[100dvh] w-full flex-col justify-between items-center overflow-hidden bg-[#07090F] select-none transition-colors duration-700"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 8px) + 56px + 10px)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 8px)',
      }}
    >
      {/* ── 1. Stadium Corner Lights FX (Home Vibe) ── */}
      <div className="absolute top-0 left-0 w-[55vw] h-[55vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-[55vw] h-[55vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2" />

      {/* ── 2. 3D Perspective Pitch Lines Overlay (Home Vibe) ── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          transform: 'perspective(1000px) rotateX(68deg) scale(2)',
          transformOrigin: 'top center',
        }}
      />

      {/* ── 3. Atmospheric Core Glow (Hub Vibe — follows game accent) ── */}
      <div
        className="hub-core-glow pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[380px] w-[380px] -translate-x-1/2 -translate-y-[52%] rounded-full blur-3xl sm:h-[500px] sm:w-[500px] transition-all duration-700"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--hub-accent) 28%, transparent) 0%, color-mix(in srgb, var(--hub-accent) 8%, transparent) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Main Vertical Arena Stack (Max 500px) ── */}
      <div className="relative z-10 mx-auto flex h-full max-h-full w-full max-w-[500px] flex-1 min-h-0 flex-col justify-between px-3.5 sm:px-4">
        
        {/* ── TOP HERO: Hub Eyebrow + Metallic Sheen Title ── */}
        <div className="relative w-full flex flex-col items-center shrink-0">
          {/* Glass Circular Back Button */}
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            title={t('common.back')}
            className="btn-haptic absolute start-0 top-1/2 -translate-y-1/2 size-9 rounded-full border border-white/10 bg-white/[0.04] text-[#C5CAD6] hover:text-white hover:border-[var(--hub-accent)] hover:shadow-[0_0_14px_var(--hub-accent-glow)] flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xs z-20"
          >
            <AppIcon icon={ArrowLeft} size={15} weight="bold" className="rtl:rotate-180" />
          </button>

          {/* Hub Eyebrow with side lines */}
          <div
            data-hub-eyebrow
            className="hub-eyebrow-container flex w-full shrink-0 items-center justify-center gap-2 sm:gap-2.5"
            style={{ height: '16px', marginBottom: '2px' }}
          >
            <span className="hub-eyebrow-line shrink-0" aria-hidden="true" />
            <span className="hub-eyebrow shrink-0 text-[11px] sm:text-[11.5px]">
              {isRtl ? 'إعداد الغرفة' : 'ROOM SETUP'}
            </span>
            <span className="hub-eyebrow-line hub-eyebrow-line-end shrink-0" aria-hidden="true" />
          </div>

          {/* Shimmering Display Title */}
          <div
            data-hub-title
            className="flex w-full shrink-0 items-center justify-center text-center"
            style={{ height: '32px' }}
          >
            <h1
              className="hub-title-sheen font-display font-extrabold leading-none drop-shadow-lg text-center"
              style={{
                fontSize: isRtl ? '26px' : '24px',
                fontFamily: isRtl ? 'var(--font-cairo), sans-serif' : 'var(--font-display)',
                background: 'linear-gradient(180deg, #ffffff 15%, #e9e9ef 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isRtl ? 'إنشاء غرفة' : 'Create Room'}
            </h1>
          </div>
        </div>

        {/* ── GAME SELECTION DECK: 4 Stadium Cards (Home Lobby Vibe) ── */}
        <div
          id={gameSelectorId}
          role="radiogroup"
          aria-label={isRtl ? 'اللعبة' : 'Game'}
          className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 shrink-0 my-1"
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
                  'btn-haptic relative group flex h-[52px] sm:h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md',
                  isSelected
                    ? 'border-transparent font-bold shadow-lg'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#C5CAD6] hover:border-white/20 hover:text-white hover:bg-white/[0.05]',
                )}
                style={
                  isSelected
                    ? {
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      boxShadow: '0 0 20px var(--hub-accent-glow), 0 2px 8px rgba(0, 0, 0, 0.35)',
                      color: 'var(--game-on-accent, #05070b)',
                    }
                    : undefined
                }
              >
                <AppIcon
                  icon={IconComp}
                  size={20}
                  weight={isSelected ? 'fill' : 'duotone'}
                  className={isSelected ? 'text-[#05070B]' : 'text-[#C5CAD6] group-hover:text-white'}
                />
                <span className={cn(
                  'text-[12px] sm:text-[13px] font-extrabold leading-tight tracking-tight',
                  isRtl && 'font-cairo text-[12.5px] sm:text-[13.5px]',
                )}>
                  {isRtl ? game.nameAr : game.nameEn}
                </span>
                <span
                  className={cn(
                    'text-[9px] leading-none hidden [@media(min-height:660px)]:block opacity-75 font-semibold',
                    isSelected ? 'text-[#05070B]' : 'text-white/40',
                  )}
                >
                  {isRtl ? game.subtitleAr : game.subtitleEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── THE MATCH ARENA CONSOLE (Hub Visual & Control Centerpiece) ── */}
        <div className="w-full flex-1 min-h-0 flex flex-col justify-center my-1 sm:my-1.5">
          <div
            className="w-full rounded-2xl sm:rounded-3xl border bg-white/[0.03] p-3 sm:p-4 backdrop-blur-xl shadow-2xl flex flex-col justify-between gap-2.5 transition-all duration-500 relative overflow-hidden"
            style={{
              borderColor: 'color-mix(in srgb, var(--hub-accent) 26%, rgba(255, 255, 255, 0.08))',
              boxShadow: '0 20px 44px -10px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Top Tactical Status Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'var(--hub-accent)',
                    boxShadow: '0 0 10px var(--hub-accent-glow)',
                  }}
                />
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/90",
                  isRtl && "font-cairo text-[11px] sm:text-[12px]"
                )}>
                  {isRtl
                    ? `قواعد ماتش ${GAMES.find((g) => g.id === selectedGame)?.nameAr}`
                    : `${GAMES.find((g) => g.id === selectedGame)?.nameEn.toUpperCase()} MATCH ARENA`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/40 tracking-wider">
                CUSTOM ROOM
              </span>
            </div>

            {/* ═══ SNIPE SETTINGS ═══ */}
            {selectedGame === 'snipe' && (
              <>
                {/* 1. Match Size Pitch Cards */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'نظام وتشكيل الماتش' : 'Match Format'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {matchSize === 11 ? '11 PLAYERS' : '5 PLAYERS'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('snipe_size', 11, setMatchSize)}
                      className={cn(
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md overflow-hidden',
                        matchSize === 11
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        matchSize === 11
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        matchSize === 11 ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={UsersFour} size={20} weight={matchSize === 11 ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate",
                          isRtl && "font-cairo text-[13px] sm:text-[14px]"
                        )}>
                          {isRtl ? 'ماتش كامل' : 'Full Pitch'}
                        </span>
                        <span
                          dir="ltr"
                          className={cn(
                            'text-[10px] font-mono leading-tight font-medium',
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
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md overflow-hidden',
                        matchSize === 5
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        matchSize === 5
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        matchSize === 5 ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={Users} size={20} weight={matchSize === 5 ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate",
                          isRtl && "font-cairo text-[13px] sm:text-[14px]"
                        )}>
                          {isRtl ? 'ملعب خماسي' : 'Futsal Cage'}
                        </span>
                        <span
                          dir="ltr"
                          className={cn(
                            'text-[10px] font-mono leading-tight font-medium',
                            matchSize === 5 ? 'text-[#05070B]/85 font-bold' : 'text-white/45',
                          )}
                        >
                          5 vs 5
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Transfer War Chest Budget */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'ميزانية المزاد المبدئية' : 'Transfer War Chest'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold" style={{ color: 'var(--hub-accent)' }}>
                      <AppIcon icon={Coins} size={13} weight="fill" />
                      <bdi dir="ltr">${startingBudget}M</bdi>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md">
                    {[100, 150, 200].map((b) => {
                      const isSel = startingBudget === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateSetting('snipe_budget', b, setStartingBudget)}
                          className={cn(
                            'btn-haptic flex h-9 sm:h-9.5 items-center justify-center rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                            isSel
                              ? 'text-[#05070B] shadow-md'
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

                {/* 3. Player Pool Crests */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="text-[11.5px] sm:text-[12px] font-semibold text-white/60 text-start">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'مجموعة اللاعبين' : 'Player Talent Pool'}
                    </span>
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
                            'btn-haptic flex h-[50px] sm:h-[54px] flex-col items-center justify-center rounded-xl border p-1 text-center transition-all cursor-pointer backdrop-blur-md',
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
                            size={17}
                            weight={isSel ? 'fill' : 'duotone'}
                            className={isSel ? 'text-[#05070B]' : 'text-white/60'}
                          />
                          <span className={cn(
                            "text-[9.5px] sm:text-[10px] font-bold leading-tight line-clamp-2 mt-0.5",
                            isRtl && "font-cairo text-[10px] sm:text-[11px]"
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
                {/* 1. Pick Format */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'نظام وتشكيل الدرافت' : 'Draft Pick Strategy'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      11 PICKS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border border-transparent p-2 text-start font-bold shadow-lg"
                      style={{
                        background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                        color: 'var(--game-on-accent, #05070b)',
                        boxShadow: '0 0 16px var(--hub-accent-glow)',
                      }}
                    >
                      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-black/15 border border-black/10">
                        <AppIcon icon={TShirt} size={20} weight="fill" className="text-[#05070B]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? 'تشكيلة كاملة' : '11 vs 11 Duel'}
                        </span>
                        <span className="text-[10px] font-mono leading-tight text-[#05070B]/85 font-bold">
                          {isRtl ? '11 مركز رئيسي' : 'Full Lineup'}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 text-start text-[#C5CAD6]">
                      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/10">
                        <AppIcon icon={Lightning} size={20} weight="duotone" className="text-white/60" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate text-white/90", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? 'اختيار بالدور' : 'Turn-Based'}
                        </span>
                        <span className="text-[10px] font-mono leading-tight text-white/45">
                          {isRtl ? 'لاعب لكل دور' : '1 pick per turn'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Chemistry Engine */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'قواعد ربط الكيمياء' : 'Chemistry Engine'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {draftChemistry === 'full' ? 'NATION · CLUB · LEAGUE' : 'OPEN LINK'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md">
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
                            'btn-haptic flex h-9 sm:h-9.5 items-center justify-center rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                            isSel
                              ? 'text-[#05070B] shadow-md'
                              : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                            isRtl && 'font-cairo text-[12.5px] sm:text-[13.5px]',
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

                {/* 3. Player Pool */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="text-[11.5px] sm:text-[12px] font-semibold text-white/60 text-start">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'مجموعة اللاعبين' : 'Player Talent Pool'}
                    </span>
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
                            'btn-haptic flex h-[50px] sm:h-[54px] flex-col items-center justify-center rounded-xl border p-1 text-center transition-all cursor-pointer backdrop-blur-md',
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
                            size={17}
                            weight={isSel ? 'fill' : 'duotone'}
                            className={isSel ? 'text-[#05070B]' : 'text-white/60'}
                          />
                          <span className={cn(
                            "text-[9.5px] sm:text-[10px] font-bold leading-tight line-clamp-2 mt-0.5",
                            isRtl && "font-cairo text-[10px] sm:text-[11px]"
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
                {/* 1. Round Count */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'طول الماتش والجولات' : 'Match Duel Length'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {rankRounds} ROUNDS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('rank_rounds', 3, setRankRounds)}
                      className={cn(
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md',
                        rankRounds === 3
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        rankRounds === 3
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        rankRounds === 3 ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={Ranking} size={20} weight={rankRounds === 3 ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? '3 جولات' : '3 Rounds'}
                        </span>
                        <span className={cn('text-[10px] font-mono leading-tight font-medium', rankRounds === 3 ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'سريع · ~2 دقيقة' : 'Fast sprint · ~2m'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('rank_rounds', 5, setRankRounds)}
                      className={cn(
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md',
                        rankRounds === 5
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        rankRounds === 5
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        rankRounds === 5 ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={Trophy} size={20} weight={rankRounds === 5 ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? '5 جولات' : '5 Rounds'}
                        </span>
                        <span className={cn('text-[10px] font-mono leading-tight font-medium', rankRounds === 5 ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'ماتش كامل · ~4 دقائق' : 'Full duel · ~4m'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Round Timer */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'وقت التفكير بالجولة' : 'Round Countdown Timer'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {rankTimer} SECONDS
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md">
                    {[30, 45, 60].map((sec) => {
                      const isSel = rankTimer === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => updateSetting('rank_timer', sec as RankTimer, setRankTimer)}
                          className={cn(
                            'btn-haptic flex h-9 sm:h-9.5 items-center justify-center rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                            isSel
                              ? 'text-[#05070B] shadow-md'
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

                {/* 3. Scoring Engine */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="text-[11.5px] sm:text-[12px] font-semibold text-white/60 text-start">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'طريقة احتساب النقاط' : 'Scoring System'}
                    </span>
                  </div>
                  <div
                    className="flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-transparent font-bold shadow-md px-3"
                    style={{
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      color: 'var(--game-on-accent, #05070b)',
                      boxShadow: '0 0 14px var(--hub-accent-glow)',
                    }}
                  >
                    <AppIcon icon={ShieldCheck} size={18} weight="fill" className="text-[#05070B]" />
                    <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold", isRtl && "font-cairo")}>
                      {isRtl ? '+2 دقة الترتيب (Distance Scoring)' : '+2 Distance Scoring Engine'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ═══ BANK SETTINGS ═══ */}
            {selectedGame === 'bank' && (
              <>
                {/* 1. Challenge Format */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'نوع التحدي' : 'Bank Challenge Mode'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {bankFormat === 'duel' ? 'H2H DUEL' : 'SOLO RUN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('bank_fmt', 'duel', setBankFormat)}
                      className={cn(
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md',
                        bankFormat === 'duel'
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        bankFormat === 'duel'
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        bankFormat === 'duel' ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={Users} size={20} weight={bankFormat === 'duel' ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? 'مبارزة 1 ضد 1' : '1v1 Head-to-Head'}
                        </span>
                        <span className={cn('text-[10px] font-mono leading-tight font-medium', bankFormat === 'duel' ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? 'جولتان · وقت حاسم' : '2 rounds · Sudden death'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('bank_fmt', 'sprint', setBankFormat)}
                      className={cn(
                        'btn-haptic relative flex h-[50px] sm:h-[54px] items-center gap-2.5 rounded-2xl border p-2 text-start transition-all cursor-pointer backdrop-blur-md',
                        bankFormat === 'sprint'
                          ? 'border-transparent font-bold shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] text-[#C5CAD6] hover:border-white/20 hover:bg-white/[0.04]',
                      )}
                      style={
                        bankFormat === 'sprint'
                          ? {
                              background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                              color: 'var(--game-on-accent, #05070b)',
                              boxShadow: '0 0 16px var(--hub-accent-glow)',
                            }
                          : undefined
                      }
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        bankFormat === 'sprint' ? "bg-black/15 border-black/10" : "bg-white/[0.04] border-white/10"
                      )}>
                        <AppIcon icon={Lightning} size={20} weight={bankFormat === 'sprint' ? 'fill' : 'duotone'} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate", isRtl && "font-cairo text-[13px] sm:text-[14px]")}>
                          {isRtl ? 'سباق فردي' : 'Solo Sprint'}
                        </span>
                        <span className={cn('text-[10px] font-mono leading-tight font-medium', bankFormat === 'sprint' ? 'text-[#05070B]/85 font-bold' : 'text-white/45')}>
                          {isRtl ? '90 ثانية · كسر الأرقام' : '90s high-score run'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Target Ladder */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] font-semibold text-white/60">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'سلّم الجائزة الكبرى' : 'Target Points Ladder'}
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {bankLadder.toUpperCase()} PTS
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md">
                    {(['2k', '5k', '10k'] as BankLadder[]).map((lad) => {
                      const isSel = bankLadder === lad;
                      return (
                        <button
                          key={lad}
                          type="button"
                          onClick={() => updateSetting('bank_ladder', lad, setBankLadder)}
                          className={cn(
                            'btn-haptic flex h-9 sm:h-9.5 items-center justify-center rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                            isSel
                              ? 'text-[#05070B] shadow-md'
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

                {/* 3. Push Your Luck Doubling */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="text-[11.5px] sm:text-[12px] font-semibold text-white/60 text-start">
                    <span className={isRtl ? 'font-cairo font-bold text-white/80' : ''}>
                      {isRtl ? 'قواعد المخاطرة والتصفير' : 'Push-Your-Luck Mechanics'}
                    </span>
                  </div>
                  <div
                    className="flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-transparent font-bold shadow-md px-3"
                    style={{
                      background: 'linear-gradient(180deg, var(--hub-accent-light) 0%, var(--hub-accent) 100%)',
                      color: 'var(--game-on-accent, #05070b)',
                      boxShadow: '0 0 14px var(--hub-accent-glow)',
                    }}
                  >
                    <AppIcon icon={Vault} size={18} weight="fill" className="text-[#05070B]" />
                    <span className={cn("text-[12.5px] sm:text-[13px] font-extrabold", isRtl && "font-cairo")}>
                      {isRtl ? 'مضاعفة 2X أو تصفير الرصيد' : '2X Doubling Streak · Wipeout Risk'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── WHO CAN JOIN: Hub Queue Pill Style ── */}
        <div className="w-full shrink-0 my-1 sm:my-1.5">
          <div className="grid grid-cols-2 h-11 sm:h-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1 gap-1 backdrop-blur-md shadow-md">
            <button
              type="button"
              onClick={() => handleSetWhoCanJoin('private')}
              className={cn(
                'btn-haptic flex items-center justify-center gap-2 rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                whoCanJoin === 'private'
                  ? 'border-transparent text-[#05070B] shadow-md'
                  : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                isRtl && 'font-cairo text-[13px] sm:text-[14px]',
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
                'btn-haptic flex items-center justify-center gap-2 rounded-xl text-[12px] sm:text-[13px] font-extrabold transition-all cursor-pointer',
                whoCanJoin === 'public'
                  ? 'border-transparent text-[#05070B] shadow-md'
                  : 'text-[#C5CAD6] hover:text-white hover:bg-white/[0.04]',
                isRtl && 'font-cairo text-[13px] sm:text-[14px]',
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

        {/* ── LAUNCH ARENA CTA BUTTON ── */}
        <div className="w-full shrink-0">
          <PrimaryActionButton
            id="create-room-submit-btn"
            title={isRtl ? 'إنشاء الغرفة' : 'CREATE ROOM'}
            subtitle={getSummaryLine()}
            loadingTitle={isRtl ? 'جاري تجهيز الغرفة…' : 'Setting up room…'}
            onClick={handleCreateMatch}
            loading={loading}
            disabled={loading}
            className="h-14 sm:h-[60px]"
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
