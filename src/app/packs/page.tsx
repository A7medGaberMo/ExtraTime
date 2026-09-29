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
import { TextInput } from '@/components/ui/text-input';
import { StatPill } from '@/components/ui/stat-pill';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import { FifaPackOpening, type PackDefinition } from '@/components/packs/fifa-pack-opening';
import { PlayerCard } from '@/components/shared/player-card';
import { TIER_ORDER } from '@/lib/tier-styles';
import { sfx } from '@/lib/sfx';
import { useI18n } from '@/lib/i18n';
import type { PlayerCardData, Tier } from '@/types/player';

const PACK_CASES: PackDefinition[] = [
  {
    id: 'pantheon-pack',
    name: 'Pantheon Royalty',
    subtitle: 'Icon, Hero, Ultimate & Master Titans',
    featuredTier: 'ICON',
    guaranteed: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
    eligibleTiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
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
    eligibleTiers: ['ULTIMATE', 'MASTER'],
  },
];

const SPOTLIGHT_MAX_COUNT = 5;
const AUTO_ROTATE_INTERVAL_SECONDS = 300;
const DAILY_PACK_TOKENS = 5;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getStoredDailyTokens(): number {
  if (typeof window === 'undefined') return DAILY_PACK_TOKENS;
  try {
    const storedDate = localStorage.getItem('extratime_packTokens_date');
    const today = getTodayKey();
    if (storedDate !== today) {
      localStorage.setItem('extratime_packTokens_date', today);
      localStorage.setItem('extratime_packTokens_count', String(DAILY_PACK_TOKENS));
      return DAILY_PACK_TOKENS;
    }
    const count = localStorage.getItem('extratime_packTokens_count');
    return count !== null ? Number(count) : DAILY_PACK_TOKENS;
  } catch {
    return DAILY_PACK_TOKENS;
  }
}

function setStoredDailyTokens(count: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('extratime_packTokens_date', getTodayKey());
    localStorage.setItem('extratime_packTokens_count', String(Math.max(0, count)));
  } catch {
    // ignore
  }
}

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

  const eligiblePool = seededShuffle(
    allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier) && !used.has(p.id)),
    seed + 137,
  );

  for (const player of eligiblePool) {
    if (selected.length >= 5) break;
    selected.push(player);
    used.add(player.id);
  }

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

  return seededShuffle(selected, seed + 101).slice(0, 5);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function PacksPage() {
  const { t, lang } = useI18n();
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 20 });


  const [openingPack, setOpeningPack] = useState<PackDefinition | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);
  const [dailyTokens, setDailyTokens] = useState(() => getStoredDailyTokens());

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [rotationSeed, setRotationSeed] = useState(() => Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_ROTATE_INTERVAL_SECONDS);

  const serverSearchResults = useQuery(
    api.players.queries.searchPlayers,
    debouncedSearchQuery.trim().length >= 2
      ? { query: debouncedSearchQuery.trim(), limit: 40 }
      : 'skip',
  );

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

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setRotationSeed(Date.now());
          return AUTO_ROTATE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const scoutedCards: PlayerCardData[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    if (serverSearchResults && serverSearchResults.length > 0) {
      const map = new Map<string, PlayerCardData>();
      for (const p of serverSearchResults) {
        map.set(String(p._id), {
          id: String(p._id),
          name: p.name,
          position: p.position,
          tier: p.tier as Tier,
          club: p.club,
          nation: p.nation,
          imageUrl: p.imageUrl,
          isLegend: p.isLegend ?? false,
          kitNumber: p.kitNumber,
          rating: p.rating,
        });
      }
      return Array.from(map.values());
    }
    return filteredPlayers;
  }, [searchQuery, serverSearchResults, filteredPlayers]);

  const spotlightCards = useMemo(() => {
    if (players.length === 0) return [];
    return seededShuffle(players, rotationSeed).slice(0, SPOTLIGHT_MAX_COUNT);
  }, [players, rotationSeed]);

  const handleManualShuffle = useCallback(() => {
    sfx.unlock();
    sfx.cardDeal();
    setRotationSeed(Date.now());
    setSecondsRemaining(AUTO_ROTATE_INTERVAL_SECONDS);
  }, []);

  function handleOpenPack(pack: PackDefinition) {
    sfx.unlock();
    const picked = pickCardsForPack(pack, players);
    setOpenedCards(picked);
    setOpeningPack(pack);
    if (dailyTokens > 0) {
      const next = dailyTokens - 1;
      setDailyTokens(next);
      setStoredDailyTokens(next);
    }
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = ((AUTO_ROTATE_INTERVAL_SECONDS - secondsRemaining) / AUTO_ROTATE_INTERVAL_SECONDS) * 100;

  return (
    <PageShell
      title={t('packs.title')}
      subtitle={t('packs.subtitle')}
      badge={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <StatPill
            variant="gold"
            size="sm"
            icon={<AppIcon icon={Cards} size={14} weight="duotone" />}
            label={lang === 'ar' ? 'صالة البطاقات الرسمية' : 'Official Card Vault'}
          />
          <StatPill
            variant="amber"
            size="sm"
            icon={<AppIcon icon={Lightning} size={13} weight="fill" />}
            label={
              lang === 'ar'
                ? `${dailyTokens} توكن فتح يومي`
                : `${dailyTokens} Daily Open Tokens`
            }
          />
        </div>
      }
      backUrl="/"
      maxWidth="5xl"
    >
      {/* ── 1. PACK CASES SHOWROOM ────────────────────────────────────── */}
      <section className="space-y-3.5 w-full">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold shadow-sm">
              <AppIcon icon={Lightning} size={15} weight="fill" />
            </span>
            <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-white uppercase">
              {t('packs.availablePacks')}
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-steel font-stats">
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
                  ? 'حزمة ملوك البانثيون'
                  : pack.id === 'icon-pack'
                    ? 'حزمة أساطير الأيقونات'
                    : 'حزمة أبطال النخبة'
                : pack.name;

            const displaySubtitle =
              lang === 'ar'
                ? pack.id === 'pantheon-pack'
                  ? 'تشمل حصرياً: أيقونة، بطل، ألتميت وماستر'
                  : pack.id === 'icon-pack'
                    ? 'أساطير كرة القدم التاريخية والأبطال'
                    : 'حصرياً: نجوم ألتميت وماستر فقط'
                : pack.subtitle;

            return (
              <div
                key={pack.id}
                className={`luxury-glass group relative flex flex-col justify-between gap-4 rounded-3xl border p-5 backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isFirst
                    ? 'border-gold/35 shadow-[0_16px_40px_rgba(229,184,66,0.12)]'
                    : isSecond
                      ? 'border-cyan-400/30 shadow-[0_16px_40px_rgba(56,189,248,0.12)]'
                      : 'border-purple-400/30 shadow-[0_16px_40px_rgba(191,90,242,0.12)]'
                }`}
              >
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold tracking-tight text-white uppercase">
                      {displayName}
                    </h3>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm ${
                        isFirst
                          ? 'border-gold/40 bg-gold/10 text-gold'
                          : isSecond
                            ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                            : 'border-purple-400/40 bg-purple-400/10 text-purple-300'
                      }`}
                    >
                      <AppIcon
                        icon={isFirst ? Crown : isSecond ? Trophy : Flame}
                        size={16}
                        weight="fill"
                      />
                    </div>
                  </div>

                  <p className="text-steel text-xs font-normal leading-relaxed">
                    {displaySubtitle}
                  </p>

                  <div className="pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      ★ {pack.guaranteed.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="relative pt-1">
                  <Button
                    variant={isFirst ? 'gold' : 'secondary'}
                    size="md"
                    fullWidth
                    onClick={() => handleOpenPack(pack)}
                    disabled={players.length === 0}
                    leftIcon={<AppIcon icon={Lightning} size={15} weight="fill" />}
                    className="rounded-2xl font-bold h-11 text-xs"
                  >
                    {t('packs.openCase')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. CARD VAULT SPOTLIGHT ──────────────────────────────────── */}
      <section className="luxury-glass relative space-y-4 rounded-3xl p-4 sm:p-6 border border-white/8 shadow-xl backdrop-blur-3xl w-full">
        {/* Dynamic Status & Search Header */}
        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold shadow-sm">
              <AppIcon icon={Trophy} size={17} weight="fill" />
            </span>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold tracking-tight text-white uppercase">
                {t('packs.vaultSpotlight')}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-steel font-stats">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
                <span>
                  {lang === 'ar'
                    ? `تحديث تلقائي كل 5 دقائق • متبقي ${formattedCountdown}`
                    : `Auto-refresh every 5 mins • ${formattedCountdown}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-72">
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
              leftIcon={<AppIcon icon={Shuffle} size={14} weight="bold" className="text-gold" />}
              className="rounded-xl border-white/12 font-bold h-10 px-3"
            >
              {t('packs.rollRandom')}
            </Button>
          </div>
        </header>

        {/* Auto-Rotation Progress Bar */}
        {!searchQuery.trim() && (
          <div className="relative w-full h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-gold/50 via-gold to-gold-light transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Cards Showcase */}
        {searchQuery.trim() ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white font-stats">
                  {lang === 'ar' ? 'نتائج الاستكشاف' : 'Scouted Players'}
                </span>
                <span className="rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold font-stats">
                  {scoutedCards.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-steel hover:text-white cursor-pointer font-medium underline underline-offset-4"
              >
                {lang === 'ar' ? 'إلغاء البحث' : 'Clear Search'}
              </button>
            </div>

            {scoutedCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[560px] overflow-y-auto p-1 scrollbar-hidden">
                {scoutedCards.map((player, index) => (
                  <div
                    key={`scout-${player.id}-${index}`}
                    onClick={() => {
                      sfx.cardDeal();
                      setInspectedCard(player);
                    }}
                    className="flex justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 animate-fade-in"
                  >
                    <PlayerCard player={player} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="luxury-glass rounded-2xl p-8 text-center border border-white/8 space-y-2">
                <p className="text-white text-sm font-semibold">
                  {lang === 'ar' ? `لم نجد لاعبين يطابقون "${searchQuery}"` : `No players found matching "${searchQuery}"`}
                </p>
                <p className="text-steel text-xs">
                  {lang === 'ar'
                    ? 'جرب البحث باسم اللاعب أو النادي أو الدولة'
                    : 'Try scouting by player name, club, or nation.'}
                </p>
              </div>
            )}
          </div>
        ) : spotlightCards.length > 0 ? (
          <div className="relative pt-1">
            {/* Mobile: 3 cards side-by-side */}
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
                  <div className="w-full max-w-[104px]">
                    <PlayerCard player={player} size="xs" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: 5 cards in a centered row */}
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
          <div className="luxury-glass rounded-2xl p-8 text-center border border-white/8">
            <p className="text-steel text-xs font-semibold tracking-widest uppercase font-stats">
              {rawData === undefined ? t('packs.loadingCards') : t('packs.noCards')}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-steel">
          <AppIcon icon={ArrowsClockwise} size={13} weight="bold" className="text-gold" />
          <span>{t('packs.autoCycleNotice')}</span>
        </div>
      </section>

      {/* ── 3. CINEMATIC PACK OPENING WALKOUT OVERLAY ─────────────────── */}
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
          cardsList={searchQuery.trim() ? scoutedCards : players}
          onSelectCard={(c) => setInspectedCard(c)}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </PageShell>
  );
}
