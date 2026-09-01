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
  Trophy,
  Flame,
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
import { TIER_ORDER } from '@/lib/tier-styles';
import { sfx } from '@/lib/sfx';
import { useI18n } from '@/lib/i18n';
import type { PlayerCardData, Tier } from '@/types/player';

// ── 1. PACK DEFINITIONS (3 HIGH-END FEATURED CASES) ──────────

const PACK_CASES: PackDefinition[] = [
  {
    id: 'pantheon-pack',
    name: 'Pantheon Royalty',
    subtitle: 'Icon, Hero, Ultimate & Master Titans',
    featuredTier: 'ICON',
    guaranteed: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
    eligibleTiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'], // Strictly no Elite
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
    eligibleTiers: ['ULTIMATE', 'MASTER'], // Strictly Ultimate and Master only
  },
];

const SPOTLIGHT_MAX_COUNT = 5; // 5 on desktop, 3 on mobile
const AUTO_ROTATE_INTERVAL_SECONDS = 300; // 5 minutes (300 seconds)

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

  // 2. Remaining picks strictly from eligible pool
  const eligiblePool = seededShuffle(
    allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier) && !used.has(p.id)),
    seed + 137,
  );

  for (const player of eligiblePool) {
    if (selected.length >= 5) break;
    selected.push(player);
    used.add(player.id);
  }

  // 3. Fallback strictly within eligible pool if available
  if (selected.length < 5) {
    const eligibleFallback = seededShuffle(
      allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier)),
      seed + 251,
    );
    for (const player of eligibleFallback) {
      if (selected.length >= 5) break;
      if (!selected.some((s) => s.id === player.id)) {
        selected.push(player);
      }
    }
  }

  // 4. Ultimate safety fallback (only if pool has fewer than 5 unique players)
  if (selected.length < 5) {
    const ultimateFallback = seededShuffle(allPlayers, seed + 331);
    for (const player of ultimateFallback) {
      if (selected.length >= 5) break;
      if (!selected.some((s) => s.id === player.id)) {
        selected.push(player);
      }
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

  // Vault Spotlight Search & Rotation State
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filtered Candidate Pool (Fast in-memory search)
  const filteredPlayers = useMemo(() => {
    if (players.length === 0) return [];
    if (!searchQuery.trim()) return players;

    const q = searchQuery.toLowerCase().trim();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.nation.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q),
    );
  }, [players, searchQuery]);

  // Active Spotlight Pool (5 players on desktop, 3 players on mobile)
  const spotlightCards = useMemo(() => {
    if (filteredPlayers.length === 0) return [];
    if (filteredPlayers.length <= SPOTLIGHT_MAX_COUNT) return filteredPlayers;

    // Seeded random 5 players from matching candidate pool
    return seededShuffle(filteredPlayers, rotationSeed).slice(0, SPOTLIGHT_MAX_COUNT);
  }, [filteredPlayers, rotationSeed]);

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
          label={lang === 'ar' ? 'حزم وبطاقات اللاعبين' : 'Card Vault & Packs'}
        />
      }
      backUrl="/"
      maxWidth="5xl"
    >
      {/* ── 1. PACK CASES: SLEEK SHOWCASE ───────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AppIcon icon={Lightning} size={16} weight="fill" className="text-lime" />
            <h2 className="font-display text-sm font-black tracking-wider text-white uppercase sm:text-base">
              {t('packs.availablePacks')}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-steel font-stats">
            {PACK_CASES.length} {t('packs.packCount', { count: PACK_CASES.length })}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {PACK_CASES.map((pack, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            const displayName =
              lang === 'ar'
                ? pack.id === 'pantheon-pack'
                  ? 'بانثيون النخبة الكبرى'
                  : pack.id === 'icon-pack'
                    ? 'ملوك الأيقونات'
                    : 'أبطال النخبة'
                : pack.name;

            const displaySubtitle =
              lang === 'ar'
                ? pack.id === 'pantheon-pack'
                  ? 'أيقونات، أبطال، ألتميت وماستر (بدون إيليت)'
                  : pack.id === 'icon-pack'
                    ? 'أساطير وأبطال كرة القدم التاريخيون'
                    : 'حصرياً: نجوم ألتميت وماستر فقط'
                : pack.subtitle;

            return (
              <div
                key={pack.id}
                className={`relative flex flex-col justify-between gap-3.5 rounded-3xl border p-4.5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isFirst
                    ? 'border-amber-400/30 bg-gradient-to-b from-amber-500/10 via-slate-950/90 to-slate-950/95 shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:border-amber-400/50'
                    : isSecond
                      ? 'border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 via-slate-950/90 to-slate-950/95 shadow-[0_14px_32px_rgba(0,0,0,0.6)] hover:border-cyan-400/40'
                      : 'border-purple-400/25 bg-gradient-to-b from-purple-500/10 via-slate-950/90 to-slate-950/95 hover:border-purple-400/40 shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-black tracking-tight text-white uppercase">
                      {displayName}
                    </h3>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <AppIcon
                        icon={isFirst ? Crown : isSecond ? Trophy : Flame}
                        size={12}
                        weight="fill"
                        className={isFirst ? 'text-amber-400' : isSecond ? 'text-cyan-300' : 'text-purple-400'}
                      />
                    </div>
                  </div>

                  <p className="text-steel text-xs font-medium leading-snug">
                    {displaySubtitle}
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

      {/* ── 2. CARD VAULT SPOTLIGHT (3 ON MOBILE, 5 ON DESKTOP & INSTANT SEARCH) ── */}
      <section className="space-y-4 pt-4">
        {/* Dynamic Status & Search Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <AppIcon icon={Trophy} size={18} weight="duotone" className="text-lime" />
            <div>
              <h3 className="font-display text-sm font-black tracking-tight text-white uppercase sm:text-base">
                {t('packs.vaultSpotlight')}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-steel font-stats">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
                </span>
                <span>
                  {lang === 'ar'
                    ? `تحديث تلقائي كل 5 دقائق • متبقي ${formattedCountdown}`
                    : `Auto-cycles every 5 mins • Refresh in ${formattedCountdown}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
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
              {t('packs.rollRandom')}
            </Button>
          </div>
        </header>

        {/* ── Auto-Rotation Progress Bar ── */}
        <div className="relative w-full h-1.5 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-lime/80 via-lime to-emerald-400 transition-all duration-1000 ease-linear rounded-full shadow-[0_0_8px_rgba(149,232,16,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── RESPONSIVE SPOTLIGHT SHOWCASE (3 ON MOBILE, 5 ON DESKTOP) ── */}
        {spotlightCards.length > 0 ? (
          <div>
            {/* MOBILE LAYOUT: Exactly 3 cards side-by-side, scaled to fit perfectly */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto py-2 items-center justify-items-center sm:hidden">
              {spotlightCards.slice(0, 3).map((player, index) => (
                <div
                  key={`spotlight-mobile-${player.id}-${index}-${rotationSeed}`}
                  onClick={() => {
                    sfx.cardDeal();
                    setInspectedCard(player);
                  }}
                  className="w-full flex justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 animate-scale-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="w-full max-w-[108px]">
                    <PlayerCard player={player} size="xs" />
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP LAYOUT: All 5 cards centered in a row */}
            <div className="hidden sm:grid sm:grid-cols-5 gap-3 md:gap-4 w-full max-w-4xl mx-auto py-2 items-center justify-items-center">
              {spotlightCards.slice(0, 5).map((player, index) => (
                <div
                  key={`spotlight-desktop-${player.id}-${index}-${rotationSeed}`}
                  onClick={() => {
                    sfx.cardDeal();
                    setInspectedCard(player);
                  }}
                  className="w-full flex justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PlayerCard player={player} size="sm" />
                </div>
              ))}
            </div>
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
            {t('packs.autoCycleNotice')}
          </span>
        </div>
      </section>

      {/* ── 3. CINEMATIC WALKOUT PACK OPENING OVERLAY ─────────────────── */}
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

      {/* ── 4. CARD DETAIL INSPECTION MODAL ────────────────────────────── */}
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
