'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import type { PlayerCardData, Tier } from '@/types/player';
import {
  Package,
  Crown,
  Gem,
  Search,
  X,
  ArrowRight,
  RotateCcw,
  Loader2,
  RefreshCw,
  Clock,
  ChevronDown,
} from 'lucide-react';

/* ── Pack Definitions ─────────────────────────────────────────── */

interface PackDef {
  id: string;
  name: string;
  badge: string;
  desc: string;
  cardCount: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tiers: Tier[];
  guaranteed: Tier[];
}

const PACKS: PackDef[] = [
  {
    id: 'legends',
    name: 'Legends Prime',
    badge: '4 CARDS · 2+ ICONS/HEROES',
    desc: 'Guaranteed 2 legendary Icon or Hero cards plus 2 world-class players.',
    cardCount: 4,
    icon: Crown,
    accent: '#D4AF37',
    tiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
    guaranteed: ['ICON', 'HERO'],
  },
  {
    id: 'superstars',
    name: 'Superstars Elite',
    badge: '4 CARDS · 2+ ULTIMATE/MASTER',
    desc: '2+ guaranteed Ultimate or Master cards plus top active talents.',
    cardCount: 4,
    icon: Gem,
    accent: '#A855F7',
    tiers: ['ULTIMATE', 'MASTER', 'ELITE', 'GOLD'],
    guaranteed: ['ULTIMATE', 'MASTER'],
  },
  {
    id: 'global',
    name: 'Global All-Stars',
    badge: '5 CARDS · ALL TIERS',
    desc: '5 cards drawn across all tiers for full squad variety.',
    cardCount: 5,
    icon: Package,
    accent: '#95E810',
    tiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE', 'GOLD'],
    guaranteed: ['ULTIMATE', 'ELITE'],
  },
];

/* ── Tier Filter Config ───────────────────────────────────────── */

const TIER_FILTERS: (Tier | 'ALL')[] = [
  'ALL',
  'ICON',
  'HERO',
  'ULTIMATE',
  'MASTER',
  'ELITE',
  'GOLD',
  'SILVER',
  'BRONZE',
];

const TIER_COLORS: Record<string, string> = {
  ICON: '#D4AF37',
  HERO: '#10B981',
  ULTIMATE: '#0EA5E9',
  MASTER: '#A855F7',
  ELITE: '#E11D48',
  GOLD: '#EAB308',
  SILVER: '#94A3B8',
  BRONZE: '#CD7F32',
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

/* ── High Performance Seeded PRNG Shuffle ──────────────────────── */

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = Math.abs(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ── Component ────────────────────────────────────────────────── */

export default function PacksPage() {
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 60 });
  const isLoadingPlayers = rawData === undefined;

  // Pack opening state
  const [activePack, setActivePack] = useState<PackDef | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [isOpening, setIsOpening] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<Tier | 'ALL'>('ALL');
  const [displayCount, setDisplayCount] = useState(18);

  // Modal inspection
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);

  // 10-Minute Auto-Rotation Time Tracker
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(0);
  const [manualShuffleOffset, setManualShuffleOffset] = useState(0);

  // Periodic heartbeat: updates time every 1s for the 10-minute rotation slot
  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute remaining time in the current 10-minute window
  const remainingInSlotMs = useMemo(() => {
    if (!nowMs) return TEN_MINUTES_MS;
    const elapsed = nowMs % TEN_MINUTES_MS;
    return TEN_MINUTES_MS - elapsed;
  }, [nowMs]);

  const remainingMinutes = Math.floor(remainingInSlotMs / 60000);
  const remainingSeconds = Math.floor((remainingInSlotMs % 60000) / 1000);

  // ── Unified Player Pool ────────────────────────────────────────
  const allPlayers: PlayerCardData[] = useMemo(() => {
    return (rawData?.allLoaded ?? []).map((p) => ({
        id: String(p._id),
        name: p.name,
        position: p.position,
        tier: p.tier as Tier,
        club: p.club,
        nation: p.nation,
        isLegend: p.isLegend ?? false,
        imageUrl: p.imageUrl,
        kitNumber: p.kitNumber,
    }));
  }, [rawData]);

  // ── 8 Featured Showcase Players (Auto-Shuffles every 10m) ──────
  const showcasePlayers = useMemo(() => {
    if (allPlayers.length === 0) return [];

    const slot = Math.floor(nowMs / TEN_MINUTES_MS);
    const combinedSeed = slot * 7919 + manualShuffleOffset * 3571;

    // Filter top tiers for the showcase (Icon, Hero, Ultimate, Master)
    const topTiers = allPlayers.filter((p) =>
      ['ICON', 'HERO', 'ULTIMATE', 'MASTER'].includes(p.tier)
    );
    const pool = topTiers.length >= 8 ? topTiers : allPlayers;

    return seededShuffle(pool, combinedSeed).slice(0, 8);
  }, [allPlayers, nowMs, manualShuffleOffset]);

  // ── Search & Tier Filtered Results ─────────────────────────────
  const isFiltering = searchQuery.trim().length > 0 || selectedTier !== 'ALL';

  const filteredResults = useMemo(() => {
    if (!isFiltering) return [];

    const q = searchQuery.trim().toLowerCase();
    return allPlayers.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.nation.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q);

      const matchTier = selectedTier === 'ALL' || p.tier === selectedTier;

      return matchSearch && matchTier;
    });
  }, [allPlayers, searchQuery, selectedTier, isFiltering]);

  // ── Open Pack Handler ──────────────────────────────────────────
  function handleOpenPack(pack: PackDef) {
    setIsOpening(true);
    setActivePack(pack);

    const gPool = allPlayers.filter((p) => pack.guaranteed.includes(p.tier));
    const rPool = allPlayers.filter((p) => pack.tiers.includes(p.tier));
    const selected: PlayerCardData[] = [];
    const usedIds = new Set<string>();

    // 1. Guaranteed picks
    const shuffledG = [...gPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, shuffledG.length); i++) {
      selected.push(shuffledG[i]);
      usedIds.add(shuffledG[i].id);
    }

    // 2. Fill remaining cards
    const remaining = [...rPool]
      .filter((p) => !usedIds.has(p.id))
      .sort(() => Math.random() - 0.5);
    for (let i = 0; selected.length < pack.cardCount && i < remaining.length; i++) {
      selected.push(remaining[i]);
      usedIds.add(remaining[i].id);
    }

    // Fallback if needed
    while (selected.length < pack.cardCount && allPlayers.length > 0) {
      const r = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      if (!usedIds.has(r.id)) {
        selected.push(r);
        usedIds.add(r.id);
      } else break;
    }

    setTimeout(() => {
      setOpenedCards(selected);
      setIsOpening(false);
    }, 320);
  }

  function handleResetPack() {
    setOpenedCards([]);
    setActivePack(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Card Packs & Collection"
        subtitle="Open tier packs and explore authentic players across all leagues."
        backUrl="/"
      />

      {/* ── SEARCH & TIER FILTER CONTROLS ───────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-xl backdrop-blur-md">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(18);
            }}
            placeholder="Search player name, club, nation, or position..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-steel outline-none focus:border-lime/70 focus:ring-1 focus:ring-lime/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-steel hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tier Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {TIER_FILTERS.map((tier) => {
            const isSelected = selectedTier === tier;
            const color = tier === 'ALL' ? '#95E810' : TIER_COLORS[tier] || '#FFFFFF';
            return (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  setDisplayCount(18);
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-950/60 text-steel border-white/5 hover:border-white/20 hover:text-white'
                }`}
                style={isSelected ? { borderColor: color, color } : undefined}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VIEW 1: FILTER / SEARCH RESULTS (WHEN ACTIVE) ───────────── */}
      {isFiltering ? (
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-steel font-mono px-1">
            <span>
              Showing <strong className="text-white">{Math.min(filteredResults.length, displayCount)}</strong> of{' '}
              <strong className="text-white">{filteredResults.length}</strong> matching cards
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTier('ALL');
              }}
              className="text-[11px] text-lime hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          </div>

          {filteredResults.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-12 text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase">No players found</p>
              <p className="text-xs text-steel">Try adjusting your search query or tier filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
              {filteredResults.slice(0, displayCount).map((player) => (
                <div
                  key={player.id}
                  onClick={() => setInspectedCard(player)}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <PlayerCard player={player} size="sm" showTierLabelBelow />
                </div>
              ))}
            </div>
          )}

          {displayCount < filteredResults.length && (
            <div className="flex justify-center pt-3">
              <button
                onClick={() => setDisplayCount((prev) => prev + 18)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Load More ({filteredResults.length - displayCount} remaining)</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      ) : (
        /* ── VIEW 2: PACK OPENERS & FEATURED SHOWCASE ──────────────── */
        <>
          {openedCards.length === 0 ? (
            <section className="space-y-8">
              {/* 3 Curated Packs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKS.map((pack) => {
                  const Icon = pack.icon;
                  return (
                    <div
                      key={pack.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex flex-col justify-between gap-5 hover:border-white/20 transition-all shadow-xl group backdrop-blur-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-slate-900/90"
                            style={{ color: pack.accent, borderColor: `${pack.accent}40` }}
                          >
                            {pack.badge}
                          </span>
                          <div
                            className="p-2 rounded-xl border bg-slate-900/80"
                            style={{ borderColor: `${pack.accent}30`, color: pack.accent }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>

                        <h3 className="text-lg font-black uppercase tracking-tight text-white">
                          {pack.name}
                        </h3>
                        <p className="text-xs text-steel font-medium leading-relaxed">
                          {pack.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenPack(pack)}
                        disabled={isOpening || allPlayers.length === 0}
                        className="w-full py-3 bg-slate-900 hover:bg-lime text-white hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-lime transition-all flex items-center justify-center gap-2 group-hover:bg-lime group-hover:text-slate-950 cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {isOpening && activePack?.id === pack.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <>
                            <span>{allPlayers.length === 0 ? 'No Players' : 'Open Pack'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── 8 Featured Players Showcase (Auto-Rotates every 10m) ── */}
              {showcasePlayers.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">
                        Featured Rotation
                      </h3>
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] text-steel font-mono">
                        <Clock className="w-3 h-3 text-lime" />
                        <span suppressHydrationWarning>
                          {mounted ? `Auto-shuffles in ${remainingMinutes}m ${remainingSeconds}s` : 'Auto-shuffles every 10m'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setManualShuffleOffset((prev) => prev + 1)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-steel hover:text-white bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Shuffle Now</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 justify-items-center">
                    {showcasePlayers.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => setInspectedCard(player)}
                        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      >
                        <PlayerCard player={player} size="sm" showTierLabelBelow />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showcasePlayers.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-12 text-center space-y-2">
                  <p className="text-sm font-bold text-white uppercase">
                    {isLoadingPlayers ? 'Loading players' : 'No players in database'}
                  </p>
                  <p className="text-xs text-steel">
                    {isLoadingPlayers ? 'Reading Convex pack pools...' : 'Import players into Convex to open packs and view the showcase.'}
                  </p>
                </div>
              )}
            </section>
          ) : (
            /* ── PACK REVEAL VIEW ────────────────────────────────────── */
            <section className="space-y-6 rounded-3xl border border-lime/30 bg-slate-950/90 p-6 sm:p-8 shadow-2xl animate-fade-in backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-lime">
                    Pack Opened Successfully
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                    {activePack?.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activePack && handleOpenPack(activePack)}
                    disabled={isOpening}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Open Again</span>
                  </button>

                  <button
                    onClick={handleResetPack}
                    className="px-4 py-2 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center py-4">
                {openedCards.map((player, idx) => (
                  <div
                    key={`${player.id}-${idx}`}
                    onClick={() => setInspectedCard(player)}
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95 animate-scale-in"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <PlayerCard player={player} size="sm" showTierLabelBelow />
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-steel font-medium">
                Click any card to inspect full telemetry.
              </p>
            </section>
          )}
        </>
      )}

      {/* ── CARD DETAIL MODAL ────────────────────────────────────────── */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </div>
  );
}
