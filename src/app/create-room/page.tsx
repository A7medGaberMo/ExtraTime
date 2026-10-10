'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useToast } from '@/components/shared/toast';
import {
  Crosshair,
  Lightning,
  Ranking,
  Vault,
  Shuffle,
  Key,
  ShieldCheck,
  Users,
  Trophy,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import {
  GameHubShell,
  HubEyebrow,
  HubTitle,
  HubVisual,
  SnipeRadarVisual,
  DraftBoardVisual,
  RankChartVisual,
  BankVaultVisual,
  PrimaryActionButton,
  SecondaryActionButton,
  RulesStrip,
} from '@/components/hub';
import { useI18n } from '@/lib/i18n';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { sfx } from '@/lib/sfx';
import { type GameId } from '@/config/games';

type MatchSize = 11 | 5;
type PoolMode = 'ACTIVE' | 'GLOBAL';

const TABS: Array<{
  id: GameId;
  nameEn: string;
  nameAr: string;
  icon: typeof Crosshair;
}> = [
  { id: 'snipe', nameEn: 'Snipe', nameAr: 'سنايب', icon: Crosshair },
  { id: 'draft', nameEn: 'Draft', nameAr: 'درافت', icon: Lightning },
  { id: 'rank', nameEn: 'Rank', nameAr: 'رتّب', icon: Ranking },
  { id: 'bank', nameEn: 'Bank', nameAr: 'بَنِّك', icon: Vault },
];

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { lang } = useI18n();
  const isRtl = lang === 'ar';

  const modeParam = searchParams.get('mode');
  const initialMode: GameId =
    modeParam === 'rank'
      ? 'rank'
      : modeParam === 'draft'
        ? 'draft'
        : modeParam === 'bank'
          ? 'bank'
          : 'snipe';

  const [selectedGame, setSelectedGame] = useState<GameId>(initialMode);
  const [prevModeParam, setPrevModeParam] = useState(modeParam);

  if (modeParam !== prevModeParam) {
    setPrevModeParam(modeParam);
    if (modeParam && ['snipe', 'draft', 'rank', 'bank'].includes(modeParam)) {
      setSelectedGame(modeParam as GameId);
    }
  }

  // Convex mutations
  const ensureGuest = useMutation(api.guests.mutations.ensure);
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createDraftDuel = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const createBankDuel = useMutation(api.bank.mutations.createDuelPrivateRoom);

  const [nickname, setNickname] = useGuestNickname();
  const [loading, setLoading] = useState(false);

  // ── Snipe Options ──
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState<number>(100);
  const [poolMode] = useState<PoolMode>('ACTIVE');
  const [isPublic] = useState<boolean>(false);

  // ── Rank Options ──
  const [roundCount, setRoundCount] = useState<3 | 5>(3);

  const handleSelectGame = (mode: GameId) => {
    sfx.tap();
    setSelectedGame(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', mode);
      window.history.replaceState(null, '', url.toString());
    }
  };

  async function ensureGuestId(): Promise<Id<'guestUsers'>> {
    const activeName = (nickname || '').trim() || randomName();
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

    return res.guestId as Id<'guestUsers'>;
  }

  async function handleLaunch() {
    if (loading) return;
    setLoading(true);
    sfx.kickoff();

    try {
      const guestId = await ensureGuestId();
      const sessionToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('extratime_sessionToken') || undefined
          : undefined;

      if (selectedGame === 'snipe') {
        const room = await createSnipeRoom({
          hostId: guestId,
          sessionToken,
          matchSize,
          startingBudget,
          isPublic,
          poolMode,
        });
        router.push(`/auction/${room.roomId}`);
      } else if (selectedGame === 'draft') {
        const result = await createDraftDuel({ hostId: guestId, sessionToken });
        router.push(`/draft/${result.gameId}`);
      } else if (selectedGame === 'rank') {
        const result = await createRankDuel({ hostId: guestId, sessionToken, roundCount });
        router.push(`/rank/${result.gameId}`);
      } else {
        const result = await createBankDuel({ hostId: guestId, sessionToken });
        router.push(`/bank/${result.gameId}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      sfx.wrong();
      toast(e.message || 'Could not launch match', 'error');
      setLoading(false);
    }
  }

  // Titles & Subtitles per game
  const titles = {
    snipe: isRtl ? 'مزاد سنايب' : 'Snipe Auction',
    draft: isRtl ? 'ديربي درافت' : 'Pro Draft',
    rank: isRtl ? 'تحدي رتّب' : 'Rank Duel',
    bank: isRtl ? 'خزينة بَنِّك' : 'Bank Vault',
  };

  const subtitles = {
    snipe: isRtl
      ? 'حدد الميزانية ونظام التشكيلة وتحدَّ صديقك بكود سري.'
      : 'Configure budget and squad format to challenge a rival.',
    draft: isRtl
      ? 'تنافس لايف 1 ضد 1 في اختيار تشكيلة بأعلى كيمياء وتناغم.'
      : 'Turn-by-turn squad drafting faceoff with tactical synergy.',
    rank: isRtl
      ? 'مبارزة 1 ضد 1 مباشرة بنفس جولات الترتيب الإحصائي.'
      : 'Head-to-head stat ordering duel with official records.',
    bank: isRtl
      ? 'مبارزة 1 ضد 1 مع سلّم المضاعفة 2X وتأمين النقاط.'
      : 'Push-your-luck sprint with 2X doubling ladder and banking.',
  };

  const rulesMap = {
    snipe: [
      {
        icon: Users,
        title: isRtl ? `${matchSize} ضد ${matchSize}` : `${matchSize} vs ${matchSize}`,
        subtitle: isRtl ? `ميزانية $${startingBudget}M` : `$${startingBudget}M Budget`,
      },
      {
        icon: ShieldCheck,
        title: isRtl ? 'مظاريف سرية' : 'Sealed Bids',
        subtitle: isRtl ? 'مزاد مغلق تكتيكي' : 'Tactical Blind Auction',
      },
      {
        icon: Trophy,
        title: isRtl ? 'كود خاص 6 رموز' : 'Private PIN',
        subtitle: isRtl ? 'مبارزة 1 ضد 1' : '1v1 Direct Duel',
      },
    ],
    draft: [
      {
        icon: Lightning,
        title: isRtl ? '14 اختيار' : '14 Turn Picks',
        subtitle: isRtl ? '11 أساسي + 3 بدلاء' : 'Starting XI + Bench',
      },
      {
        icon: ShieldCheck,
        title: isRtl ? 'كيمياء وتناغم' : 'Synergy Boosts',
        subtitle: isRtl ? 'الهدف كيمياء 33' : 'Target 33 Chemistry',
      },
      {
        icon: Trophy,
        title: isRtl ? 'كود خاص 6 رموز' : 'Private PIN',
        subtitle: isRtl ? 'مبارزة 1 ضد 1' : '1v1 Direct Duel',
      },
    ],
    rank: [
      {
        icon: Ranking,
        title: isRtl ? `${roundCount} جولات` : `${roundCount} Rounds`,
        subtitle: roundCount === 3 ? (isRtl ? 'سريع · ~2 دقيقة' : 'Rapid · ~2 min') : (isRtl ? 'كامل · ~4 دقائق' : 'Full · ~4 min'),
      },
      {
        icon: ShieldCheck,
        title: isRtl ? 'دقة الترتيب' : 'Distance Score',
        subtitle: isRtl ? '+2 للمطابق تماماً' : '+2 Exact Match',
      },
      {
        icon: Trophy,
        title: isRtl ? 'كود خاص 6 رموز' : 'Private PIN',
        subtitle: isRtl ? 'مبارزة 1 ضد 1' : '1v1 Direct Duel',
      },
    ],
    bank: [
      {
        icon: Vault,
        title: isRtl ? '12 سؤالاً' : '12 Questions',
        subtitle: isRtl ? 'جولتان من الأسئلة' : '2-Round Sprint',
      },
      {
        icon: ShieldCheck,
        title: isRtl ? 'سلّم المضاعفة' : '2X Doubling',
        subtitle: isRtl ? 'حتى 2,048 نقطة' : 'Up to 2,048 pts',
      },
      {
        icon: Trophy,
        title: isRtl ? 'كود خاص 6 رموز' : 'Private PIN',
        subtitle: isRtl ? 'حسم بالتعادل 15ث' : '15s Sudden Death',
      },
    ],
  };

  return (
    <GameHubShell
      gameId={selectedGame}
      ariaTitle={`ExtraTime - ${isRtl ? 'إنشاء غرفة خاصة' : 'Create Private Room'}`}
    >
      {/* ── Top Hero Cluster: Eyebrow + Confident Title + Subtitle ── */}
      <HubEyebrow text={isRtl ? 'غرفة خاصة 1 ضد 1' : 'PRIVATE 1v1 ARENA'} />
      <HubTitle
        title={titles[selectedGame]}
        subtitle={subtitles[selectedGame]}
      />

      {/* ── 4-Game Tactical Switcher Deck ── */}
      <div
        className="grid w-full shrink-0 grid-cols-4 gap-1.5 sm:gap-2 px-1"
        style={{
          marginBottom: 'var(--hub-gap-title-subtitle)',
        }}
      >
        {TABS.map((tab) => {
          const isSelected = selectedGame === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-${tab.id}`}
              onClick={() => handleSelectGame(tab.id)}
              className={`hub-game-tab btn-haptic ${isSelected ? 'hub-game-tab-active' : ''}`}
            >
              {isSelected && (
                <span
                  className="absolute -top-1 size-1 rounded-full"
                  style={{ backgroundColor: 'var(--hub-accent)' }}
                />
              )}
              <AppIcon
                icon={TabIcon}
                size={16}
                weight={isSelected ? 'fill' : 'bold'}
                style={{ color: isSelected ? 'var(--hub-accent)' : '#9AA0AE' }}
              />
              <span
                className={`text-[11px] font-bold mt-0.5 leading-tight ${
                  isSelected ? 'text-white' : 'text-[#9AA0AE]'
                }`}
              >
                {isRtl ? tab.nameAr : tab.nameEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Center Stage: Iconic Game Visual Frame ── */}
      <HubVisual showTimerArc={selectedGame === 'rank' || selectedGame === 'draft'}>
        {selectedGame === 'snipe' && <SnipeRadarVisual />}
        {selectedGame === 'draft' && <DraftBoardVisual />}
        {selectedGame === 'rank' && <RankChartVisual />}
        {selectedGame === 'bank' && <BankVaultVisual />}
      </HubVisual>

      {/* ── Tactical Configuration Pill (Absorbs Queue Pill Slot, Fixed 44px) ── */}
      <div
        data-hub-queue-pill
        className="flex w-full shrink-0 items-center justify-center gap-1.5 sm:gap-2"
        style={{
          height: 'var(--hub-pill-height)',
          marginBottom: 'var(--hub-gap-pill-row1)',
        }}
      >
        {selectedGame === 'snipe' ? (
          <div className="flex w-full items-center justify-center gap-2 max-w-[340px]">
            {/* 11v11 vs 5v5 */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setMatchSize(11);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  matchSize === 11
                    ? 'bg-[var(--hub-accent)] text-black shadow-sm font-black'
                    : 'text-[#9AA0AE] hover:text-white'
                }`}
              >
                11v11
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setMatchSize(5);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  matchSize === 5
                    ? 'bg-[var(--hub-accent)] text-black shadow-sm font-black'
                    : 'text-[#9AA0AE] hover:text-white'
                }`}
              >
                5v5
              </button>
            </div>

            {/* Budget Chips */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1 font-mono">
              {[100, 150].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    sfx.tap();
                    setStartingBudget(b);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    startingBudget === b
                      ? 'bg-[var(--hub-accent)] text-black shadow-sm font-black'
                      : 'text-[#9AA0AE] hover:text-white'
                  }`}
                >
                  ${b}M
                </button>
              ))}
            </div>
          </div>
        ) : selectedGame === 'rank' ? (
          <div className="flex w-full items-center justify-center gap-2 max-w-[320px]">
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setRoundCount(3);
                }}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  roundCount === 3
                    ? 'bg-[var(--hub-accent)] text-black shadow-sm font-black'
                    : 'text-[#9AA0AE] hover:text-white'
                }`}
              >
                {isRtl ? '3 جولات' : '3 Rounds'}
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setRoundCount(5);
                }}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  roundCount === 5
                    ? 'bg-[var(--hub-accent)] text-black shadow-sm font-black'
                    : 'text-[#9AA0AE] hover:text-white'
                }`}
              >
                {isRtl ? '5 جولات' : '5 Rounds'}
              </button>
            </div>
          </div>
        ) : selectedGame === 'draft' ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hub-accent)_25%,rgba(255,255,255,0.08))] bg-white/[0.03] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
            <AppIcon icon={Lightning} size={14} weight="fill" className="text-[var(--hub-accent)]" />
            <span>{isRtl ? 'درافت 14 لاعب · تنافس تكتيكي 1 ضد 1' : '14 Turn Picks · 1v1 Tactical Derby'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hub-accent)_25%,rgba(255,255,255,0.08))] bg-white/[0.03] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
            <AppIcon icon={Vault} size={14} weight="fill" className="text-[var(--hub-accent)]" />
            <span>{isRtl ? '12 سؤالاً · سلّم المضاعفة 2X' : '12 Trivia Questions · 2X Multiplier'}</span>
          </div>
        )}
      </div>

      {/* ── Row 1: Primary Action Launch Button (Fixed 68px) ── */}
      <div
        data-hub-row-1
        className="w-full shrink-0"
        style={{
          height: 'var(--hub-row1-height)',
          marginBottom: 'var(--hub-gap-row1-row2)',
        }}
      >
        <PrimaryActionButton
          id="create-room-submit-btn"
          title={
            selectedGame === 'snipe'
              ? isRtl
                ? 'أنشئ غرفة مزاد سنايب'
                : 'CREATE SNIPE ROOM'
              : selectedGame === 'draft'
                ? isRtl
                  ? 'أنشئ غرفة ديربي درافت'
                  : 'CREATE DRAFT ROOM'
                : selectedGame === 'rank'
                  ? isRtl
                    ? 'أنشئ مبارزة رتّب'
                    : 'CREATE RANK DUEL'
                  : isRtl
                    ? 'أنشئ غرفة خزينة بَنِّك'
                    : 'CREATE BANK ROOM'
          }
          subtitle={
            isRtl
              ? 'توليد كود سري للمنافس فوراً'
              : 'Generates instant 6-digit room PIN'
          }
          loadingTitle={isRtl ? 'جاري تجهيز الغرفة…' : 'LAUNCHING ARENA…'}
          onClick={handleLaunch}
          loading={loading}
          disabled={loading}
          containerClassName="h-full w-full"
        />
      </div>

      {/* ── Row 2: Secondary Cards (Manager Identity & Join with PIN) (Fixed 72px) ── */}
      <div
        data-hub-row-2
        className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:gap-3"
        style={{
          height: 'var(--hub-row2-height)',
          marginBottom: 'var(--hub-gap-row2-rules)',
        }}
      >
        {/* Manager Handle Card */}
        <div
          className="hub-action-card flex h-full w-full items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-start"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9AA0AE]">
              {isRtl ? 'المدرب' : 'MANAGER'}
            </span>
            <span className="block truncate text-xs font-bold text-white font-mono mt-0.5">
              {nickname || 'Manager'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setNickname(randomName());
            }}
            title={isRtl ? 'تغيير الاسم' : 'Randomize name'}
            aria-label={isRtl ? 'تغيير الاسم' : 'Randomize name'}
            className="btn-haptic flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#9AA0AE] hover:text-white transition-all cursor-pointer"
          >
            <AppIcon icon={Shuffle} size={14} weight="bold" />
          </button>
        </div>

        {/* Quick Join With PIN Link */}
        <SecondaryActionButton
          id="create-room-join-link"
          label={isRtl ? 'معاك كود؟ ادخل' : 'Have a Code? Join'}
          icon={Key}
          href="/join-room"
          disabled={loading}
        />
      </div>

      {/* ── Rules Strip: Pinned to bottom with safe-area padding ── */}
      <RulesStrip items={rulesMap[selectedGame]} />
    </GameHubShell>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#07090F]">
          <div className="size-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
