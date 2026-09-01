'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Lightning,
  MagnifyingGlass,
  Shuffle,
  X,
  Cards,
  Crown,
  Sparkle,
  SlidersHorizontal,
  Trophy,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { TextInput } from '@/components/ui/text-input';
import { StatPill } from '@/components/ui/stat-pill';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import { FifaPackOpening, type PackDefinition } from '@/components/packs/fifa-pack-opening';
import { PlayerCard } from '@/components/shared/player-card';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import { getEffectiveRating } from '@/lib/rating-utils';
import { sfx } from '@/lib/sfx';
import { useI18n } from '@/lib/i18n';
import type { PlayerCardData, Tier } from '@/types/player';

// ── 1. PACK DEFINITIONS (3 HIGH-END FEATURED CASES) ──────────

const PACK_CASES: PackDefinition[] = [
  {
    id: 'pantheon-pack',
    name: 'Pantheon 5-Star',
    subtitle: 'Icon, Hero, Ultimate, Master & Elite',
    featuredTier: 'ICON',
    guaranteed: ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE'],
    eligibleTiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE'],
  },
  {
    id: 'icon-pack',
    name: 'Icon Royalty',
    subtitle: 'Legends & Historic Heroes',
    featuredTier: 'ICON',
    guaranteed: ['ICON', 'HERO'],
    eligibleTiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
  },
  {
    id: 'champions-pack',
    name: 'Champions Elite',
    subtitle: 'Ultimate & Master Active Titans',
    featuredTier: 'ULTIMATE',
    guaranteed: ['ULTIMATE', 'MASTER'],
    eligibleTiers: ['ULTIMATE', 'MASTER', 'ELITE', 'GOLD'],
  },
];

const SPOTLIGHT_COUNT = 5; // Exactly 5 cards per showcase
const AUTO_ROTATE_INTERVAL_SECONDS = 300; // 5 minutes (300 seconds)

type PositionGroup = 'ALL' | 'FWD' | 'MID' | 'DEF' | 'GK';
type SortOption = 'RANDOM' | 'RATING_DESC' | 'RATING_ASC' | 'NAME_ASC';

const POSITION_MAP: Record<PositionGroup, string[]> = {
  ALL: [],
  FWD: ['ST', 'CF', 'LW', 'RW'],
  MID: ['CAM', 'CM', 'CDM', 'LM', 'RM'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  GK: ['GK'],
};

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = Math.max(1, Math.abs(seed));

  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function toPlayerCardData(player: {
  _id: string;
  name: string;
  position: string;
  tier: string;
  club: string;
  nation: string;
  imageUrl?: string;
  isLegend?: boolean;
  kitNumber?: number;
  rating?: number;
}): PlayerCardData {
  return {
    id: String(player._id),
    name: player.name,
    position: player.position,
    tier: player.tier as Tier,
    club: player.club,
    nation: player.nation,
    imageUrl: player.imageUrl,
    isLegend: player.isLegend ?? false,
    kitNumber: player.kitNumber,
    rating: player.rating,
  };
}

function pickCardsForPack(pack: PackDefinition, allPlayers: PlayerCardData[]): PlayerCardData[] {
  const seed = Date.now() + pack.id.length * 1009;
  const selected: PlayerCardData[] = [];
  const used = new Set<string>();

  // 1. Guaranteed tiers
  for (const gTier of pack.guaranteed) {
    const tierPool = seededShuffle(
      allPlayers.filter((p) => p.tier === gTier && !used.has(p.id)),
      seed + selected.length * 73,
    );
    if (tierPool.length > 0) {
      selected.push(tierPool[0]);
      used.add(tierPool[0].id);
    }
  }

  // 2. Remaining picks from eligible pool
  const eligiblePool = seededShuffle(
    allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier) && !used.has(p.id)),
    seed + 137,
  );

  for (const player of eligiblePool) {
    if (selected.length >= 5) break;
    selected.push(player);
    used.add(player.id);
  }

  // 3. Fallback if pool is exhausted
  if (selected.length < 5) {
    const fallbackPool = seededShuffle(
      allPlayers.filter((p) => !used.has(p.id)),
      seed + 251,
    );
    for (const player of fallbackPool) {
      if (selected.length >= 5) break;
      selected.push(player);
      used.add(player.id);
    }
  }

  return seededShuffle(selected, seed + 101).slice(0, 5);
}

export default function PacksPage() {
  const { t, lang } = useI18n();
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 50 });

  // Pack Opening State
  const [openingPack, setOpeningPack] = useState<PackDefinition | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);

  // Vault Filtering & Spotlight State
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedPositionGroup, setSelectedPositionGroup] = useState<PositionGroup>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('RANDOM');
  const [rotationSeed, setRotationSeed] = useState(() => Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_ROTATE_INTERVAL_SECONDS);

  // Deduplicated in-memory players collection (cached client-side)
  const players = useMemo(() => {
    const loaded = rawData?.allLoaded ?? [];
    const source = loaded.length > 0 ? loaded : TIER_ORDER.flatMap((tier) => rawData?.[tier] ?? []);
    const map = new Map<string, PlayerCardData>();
    for (const raw of source) {
      if (raw && raw._id) {
        const card = toPlayerCardData(raw);
        map.set(card.id, card);
      }
    }
    return Array.from(map.values());
  }, [rawData]);

  // Client-Side 5-Minute Auto-Rotation Timer (Zero backend overhead)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger next random rotation
          setRotationSeed(Date.now());
          return AUTO_ROTATE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtered Candidate Pool
  const filteredPlayers = useMemo(() => {
    if (players.length === 0) return [];

    let pool = [...players];

    // 1. Tier Filter
    if (selectedTier !== 'ALL') {
      pool = pool.filter((p) => p.tier === selectedTier);
    }

    // 2. Position Group Filter
    if (selectedPositionGroup !== 'ALL') {
      const allowed = POSITION_MAP[selectedPositionGroup];
      pool = pool.filter((p) => {
        const pPos = p.position.toUpperCase();
        return allowed.some((target) => pPos.includes(target));
      });
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.nation.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q),
      );
    }

    return pool;
  }, [players, selectedTier, selectedPositionGroup, searchQuery]);

  // Active 5-Card Random Spotlight (Auto refreshed every 5 minutes or on manual roll)
  const spotlightCards = useMemo(() => {
    if (filteredPlayers.length === 0) return [];
    if (filteredPlayers.length <= SPOTLIGHT_COUNT) return filteredPlayers;

    if (sortOption === 'RATING_DESC') {
      return [...filteredPlayers]
        .sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a))
        .slice(0, SPOTLIGHT_COUNT);
    }
    if (sortOption === 'RATING_ASC') {
      return [...filteredPlayers]
        .sort((a, b) => getEffectiveRating(a) - getEffectiveRating(b))
        .slice(0, SPOTLIGHT_COUNT);
    }
    if (sortOption === 'NAME_ASC') {
      return [...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name)).slice(0, SPOTLIGHT_COUNT);
    }

    // Default: completely random 5 players using rotation seed
    return seededShuffle(filteredPlayers, rotationSeed).slice(0, SPOTLIGHT_COUNT);
  }, [filteredPlayers, rotationSeed, sortOption]);

  // Manual Instant Shuffle
  const handleManualShuffle = useCallback(() => {
    sfx.unlock();
    sfx.cardDeal();
    setRotationSeed(Date.now());
    setSecondsRemaining(AUTO_ROTATE_INTERVAL_SECONDS);
  }, []);

  // Handlers
  function handleOpenPack(pack: PackDefinition) {
    sfx.unlock();
    const picked = pickCardsForPack(pack, players);
    setOpenedCards(picked);
    setOpeningPack(pack);
  }

  // Format countdown mm:ss
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = ((AUTO_ROTATE_INTERVAL_SECONDS - secondsRemaining) / AUTO_ROTATE_INTERVAL_SECONDS) * 100;

  return (
    <PageShell
      title={t('packs.title')}
      subtitle={t('packs.subtitle')}
      badge={
        <StatPill
          variant="lime"
          size="sm"
          icon={<AppIcon icon={Cards} size={14} weight="duotone" />}
          label={lang === 'ar' ? 'سوق الباقات وخزينة الكروت' : 'Card Vault & Packs'}
        />
      }
      backUrl="/"
      maxWidth="5xl"
    >
      {/* ── 1. PACK CASES: SLEEK APPLE-GRADE SHOWCASE ───────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AppIcon icon={Lightning} size={16} weight="fill" className="text-lime" />
            <h2 className="font-display text-sm font-black tracking-wider text-white uppercase sm:text-base">
              {lang === 'ar' ? 'الباقات المتوفرة' : 'Available Packs'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-steel font-stats">
            {PACK_CASES.length} {lang === 'ar' ? 'باقات' : 'Packs'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {PACK_CASES.map((pack, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            return (
              <div
                key={pack.id}
                className={`relative flex flex-col justify-between gap-3.5 rounded-3xl border p-4.5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isFirst
                    ? 'border-amber-400/30 bg-gradient-to-b from-amber-500/10 via-slate-950/90 to-slate-950/95 shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:border-amber-400/50'
                    : isSecond
                      ? 'border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 via-slate-950/90 to-slate-950/95 shadow-[0_14px_32px_rgba(0,0,0,0.6)] hover:border-cyan-400/40'
                      : 'border-white/10 bg-slate-900/60 hover:border-white/25 shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-black tracking-tight text-white uppercase">
                      {pack.name}
                    </h3>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <AppIcon
                        icon={isFirst ? Crown : isSecond ? Trophy : Sparkle}
                        size={12}
                        weight="fill"
                        className={isFirst ? 'text-amber-400' : isSecond ? 'text-cyan-300' : 'text-lime'}
                      />
                    </div>
                  </div>

                  <p className="text-steel text-xs font-medium leading-snug">
                    {pack.subtitle}
                  </p>
                </div>

                <Button
                  variant={isFirst ? 'primary' : 'secondary'}
                  size="sm"
                  fullWidth
                  onClick={() => handleOpenPack(pack)}
                  disabled={players.length === 0}
                  leftIcon={<AppIcon icon={Lightning} size={14} weight="fill" />}
                >
                  {t('packs.openCase')}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. CARD VAULT SPOTLIGHT (AUTO 5-BY-5 EVERY 5 MINS & RANDOM) ──── */}
      <section className="space-y-4 pt-4">
        {/* Dynamic Island Status & Search Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <AppIcon icon={Trophy} size={18} weight="duotone" className="text-lime" />
            <div>
              <h3 className="font-display text-sm font-black tracking-tight text-white uppercase sm:text-base">
                {lang === 'ar' ? 'خزينة البطاقات — عرض الـ 5 كروت' : 'Card Vault Spotlight'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-steel font-stats">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
                </span>
                <span>
                  {lang === 'ar'
                    ? `تحديث تلقائي كل 5 دقائق • متبقي ${formattedCountdown}`
                    : `Auto-cycles 5 cards every 5 mins • Refresh in ${formattedCountdown}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44 sm:w-56">
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('packs.searchPlaceholder')}
                leftIcon={<AppIcon icon={MagnifyingGlass} size={14} weight="bold" />}
                rightAction={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-steel hover:text-white p-1 cursor-pointer"
                    >
                      <AppIcon icon={X} size={13} weight="bold" />
                    </button>
                  ) : undefined
                }
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualShuffle}
              leftIcon={<AppIcon icon={Shuffle} size={14} weight="bold" className="text-lime" />}
            >
              {lang === 'ar' ? 'سحب عشوائي' : 'Roll 5'}
            </Button>
          </div>
        </header>

        {/* ── Apple-Grade Auto-Rotation Progress Bar ── */}
        <div className="relative w-full h-1.5 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-lime/80 via-lime to-emerald-400 transition-all duration-1000 ease-linear rounded-full shadow-[0_0_8px_rgba(149,232,16,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── Classifications Bar: Position Groups & Sorting ── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-slate-900/40 p-2.5 backdrop-blur-xl">
          {/* Position Group Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {(['ALL', 'FWD', 'MID', 'DEF', 'GK'] as PositionGroup[]).map((group) => {
              const isActive = selectedPositionGroup === group;
              const labels: Record<PositionGroup, string> = {
                ALL: t('packs.allPositions'),
                FWD: t('packs.attackers'),
                MID: t('packs.midfielders'),
                DEF: t('packs.defenders'),
                GK: t('packs.goalkeepers'),
              };

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    sfx.unlock();
                    sfx.cardDeal();
                    setSelectedPositionGroup(group);
                  }}
                  className={`cursor-pointer rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-lime text-slate-950 shadow-md font-black'
                      : 'text-steel hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {labels[group]}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-steel">
            <AppIcon icon={SlidersHorizontal} size={13} weight="bold" className="text-lime" />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as SortOption);
              }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-white outline-none hover:border-white/25 cursor-pointer"
            >
              <option value="RANDOM">🎲 Random 5 Spotlight</option>
              <option value="RATING_DESC">{t('packs.sortRatingHigh')}</option>
              <option value="RATING_ASC">{t('packs.sortRatingLow')}</option>
              <option value="NAME_ASC">{t('packs.sortName')}</option>
            </select>
          </div>
        </div>

        {/* ── Tier Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTier('ALL')}
            className={`cursor-pointer rounded-full border px-3 py-1 font-card text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
              selectedTier === 'ALL'
                ? 'border-lime bg-lime/15 text-lime shadow-[0_0_12px_rgba(149,232,16,0.25)]'
                : 'border-white/10 bg-slate-950/70 text-steel hover:border-white/20 hover:text-white'
            }`}
          >
            {t('packs.allTiers')}
          </button>
          {TIER_ORDER.map((tier) => {
            const style = getTierStyle(tier);
            const isSelected = selectedTier === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`cursor-pointer rounded-full border px-2.5 py-1 font-card text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                  isSelected
                    ? 'shadow-md ring-1'
                    : 'border-white/10 bg-slate-950/70 text-steel hover:border-white/20 hover:text-white'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: style.accent,
                        color: style.highlight,
                        backgroundColor: `${style.shadow}90`,
                        boxShadow: `0 0 10px ${style.glow}`,
                      }
                    : undefined
                }
              >
                {tier}
              </button>
            );
          })}
        </div>

        {/* ── 5-PLAYER SINGLE SPOTLIGHT LINE DISPLAY ── */}
        {spotlightCards.length > 0 ? (
          <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-2.5 sm:gap-4 w-full max-w-full overflow-x-auto py-3 px-1 scrollbar-none snap-x snap-mandatory">
            {spotlightCards.map((player, index) => (
              <div
                key={`spotlight-card-${player.id}-${index}-${rotationSeed}`}
                onClick={() => {
                  sfx.cardDeal();
                  setInspectedCard(player);
                }}
                className="shrink-0 snap-center animate-scale-in cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="block sm:hidden">
                  <PlayerCard player={player} size="xs" />
                </div>
                <div className="hidden sm:block">
                  <PlayerCard player={player} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Panel variant="subtle" className="p-8 text-center">
            <p className="text-steel text-xs font-black tracking-widest uppercase">
              {rawData === undefined ? t('packs.loadingCards') : t('packs.noCards')}
            </p>
          </Panel>
        )}

        {/* ── Subtitle helper tag ── */}
        <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-steel/80">
          <AppIcon icon={ArrowsClockwise} size={13} weight="bold" className="text-lime" />
          <span>
            {lang === 'ar'
              ? 'يتم تدوير 5 بطاقات عشوائية تلقائياً كل 5 دقائق بدون استهلاك لباقات الإنترنت أو ضغط على الخادم.'
              : 'Spotlight rotates 5 random players every 5 minutes seamlessly with zero server bandwidth load.'}
          </span>
        </div>
      </section>

      {/* ── 3. CINEMATIC FIFA-STYLE WALKOUT PACK OPENING OVERLAY ───────── */}
      {openingPack && openedCards.length > 0 && (
        <FifaPackOpening
          pack={openingPack}
          cards={openedCards}
          onClose={() => {
            setOpeningPack(null);
            setOpenedCards([]);
          }}
          onOpenAgain={() => {
            const nextCards = pickCardsForPack(openingPack, players);
            setOpenedCards(nextCards);
          }}
          onInspectCard={(card) => setInspectedCard(card)}
        />
      )}

      {/* ── 4. APPLE-GRADE CARD DETAIL INSPECTION MODAL ────────────────── */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          cardsList={filteredPlayers.length > 0 ? filteredPlayers : players}
          onSelectCard={(c) => setInspectedCard(c)}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </PageShell>
  );
}
