'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Zap,
  Search,
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import { TierBadge } from '@/components/shared/tier-badge';
import { ETLogo } from '@/components/shared/et-logo';
import { sfx } from '@/lib/sfx';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import type { PlayerCardData, Tier } from '@/types/player';

export interface PackDef {
  id: string;
  name: string;
  note: string;
  cardCount: number;
  featuredTier: Tier;
  guaranteed: Tier[];
  eligibleTiers: Tier[];
}

const PACKS: PackDef[] = [
  {
    id: 'heritage',
    name: 'Heritage',
    note: 'Icon & Hero legend case',
    cardCount: 5,
    featuredTier: 'ICON',
    guaranteed: ['ICON', 'HERO'],
    eligibleTiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
  },
  {
    id: 'signature',
    name: 'Signature',
    note: 'World best & active masters',
    cardCount: 5,
    featuredTier: 'ULTIMATE',
    guaranteed: ['ULTIMATE', 'MASTER'],
    eligibleTiers: ['ULTIMATE', 'MASTER', 'ELITE', 'GOLD'],
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    note: 'Balanced squad dynamic pulls',
    cardCount: 5,
    featuredTier: 'ELITE',
    guaranteed: ['ELITE', 'GOLD'],
    eligibleTiers: ['MASTER', 'ELITE', 'GOLD'],
  },
];

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
  };
}

function pickCardsForPack(pack: PackDef, allPlayers: PlayerCardData[]): PlayerCardData[] {
  const seed = Date.now() + pack.id.length * 1009;
  const selected: PlayerCardData[] = [];
  const used = new Set<string>();

  // 1. Guarantee at least 1 card from EACH tier in pack.guaranteed
  for (const gTier of pack.guaranteed) {
    const tierPool = seededShuffle(allPlayers.filter((p) => p.tier === gTier && !used.has(p.id)), seed + selected.length * 19);
    if (tierPool.length > 0) {
      selected.push(tierPool[0]);
      used.add(tierPool[0].id);
    }
  }

  // 2. Eligible pool for the remaining slots (strictly from pack.eligibleTiers)
  const eligiblePool = seededShuffle(
    allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier) && !used.has(p.id)),
    seed + 43
  );

  for (const player of eligiblePool) {
    if (selected.length >= pack.cardCount) break;
    selected.push(player);
    used.add(player.id);
  }

  // 3. Fallback only if database has insufficient eligible players
  if (selected.length < pack.cardCount) {
    const fallbackPool = seededShuffle(
      allPlayers.filter((p) => !used.has(p.id)),
      seed + 97
    );
    for (const player of fallbackPool) {
      if (selected.length >= pack.cardCount) break;
      selected.push(player);
      used.add(player.id);
    }
  }

  // Shuffle final 5 cards so guaranteed cards aren't always in index 0 & 1
  return seededShuffle(selected, seed + 101).slice(0, pack.cardCount);
}

export default function PacksPage() {
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 40 });
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Active opened pack state
  const [activePack, setActivePack] = useState<PackDef | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);

  // Search in showcase
  const [searchQuery, setSearchQuery] = useState('');

  const players = useMemo(() => {
    const loaded = rawData?.allLoaded ?? [];
    if (loaded.length > 0) return loaded.map(toPlayerCardData);

    const tierLoaded = TIER_ORDER.flatMap((tier) => rawData?.[tier] ?? []);
    return tierLoaded.map(toPlayerCardData);
  }, [rawData]);

  // Generate 8 Showcase Cards: Minimum GOLD tier, at most 1 GOLD card!
  const showcaseCards = useMemo(() => {
    if (players.length === 0) return [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return players
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.club.toLowerCase().includes(q) ||
            p.nation.toLowerCase().includes(q) ||
            p.position.toLowerCase().includes(q)
        )
        .slice(0, 8);
    }

    const highTierPool = players.filter((p) =>
      ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE'].includes(p.tier)
    );
    const goldPool = players.filter((p) => p.tier === 'GOLD');

    const seed = 42 + shuffleSeed * 911;
    const shuffledHigh = seededShuffle(highTierPool, seed);
    const shuffledGold = seededShuffle(goldPool, seed + 17);

    const result: PlayerCardData[] = [];

    // Max 1 gold card in the 8 cards
    if (shuffledGold.length > 0) {
      result.push(shuffledGold[0]);
    }

    // Fill remaining 7 slots from high tiers (Elite, Master, Ultimate, Hero, Icon)
    for (const player of shuffledHigh) {
      if (result.length >= 8) break;
      if (!result.some((p) => p.id === player.id)) {
        result.push(player);
      }
    }

    // If still less than 8, fill from available
    if (result.length < 8) {
      for (const p of shuffledHigh) {
        if (result.length >= 8) break;
        result.push(p);
      }
    }

    // Shuffle final 8 so the gold card isn't always in position 0
    return seededShuffle(result, seed + 99);
  }, [players, searchQuery, shuffleSeed]);

  // Open Pack handler: instant, responsive, clean
  function handleOpenPack(pack: PackDef) {
    sfx.unlock();
    sfx.packRip();
    setIsOpening(true);
    setActivePack(pack);

    const picked = pickCardsForPack(pack, players);
    setOpenedCards(picked);

    setTimeout(() => {
      sfx.cardDeal();
      setIsOpening(false);
    }, 300);
  }

  function handleShuffle() {
    sfx.unlock();
    sfx.cardDeal();
    setShuffleSeed((prev) => prev + 1);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-16 px-3 sm:px-4 animate-fade-in">
      <PageHeader
        title="Packs"
        subtitle="Open premium cases and discover elite football cards."
        backUrl="/"
      />

      {/* ========================================================================= */}
      {/* 1. CENTRALIZED MINIMAL PACK CASES GRID                                    */}
      {/* ========================================================================= */}
      <section className="space-y-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {PACKS.map((pack) => {
            const style = getTierStyle(pack.featuredTier);
            const isSelected = activePack?.id === pack.id && openedCards.length > 0;

            return (
              <div
                key={pack.id}
                className={`group relative rounded-2xl border bg-slate-900/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden ${
                  isSelected ? 'ring-2 ring-lime/70' : ''
                }`}
                style={{
                  borderColor: `${style.accent}45`,
                  boxShadow: `0 14px 28px rgba(0,0,0,0.4), 0 0 16px ${style.glow}`,
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-steel">
                      {pack.cardCount} Cards
                    </span>
                    <div className="flex gap-1">
                      {pack.guaranteed.map((tier) => (
                        <TierBadge key={tier} tier={tier} className="px-1.5 py-0.5 text-[8px]" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">
                      {pack.name}
                    </h3>
                    <p className="text-xs text-steel font-medium leading-relaxed mt-0.5">{pack.note}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPack(pack)}
                  disabled={players.length === 0 || isOpening}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest bg-lime hover:bg-vivid text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Open Case</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* OPENED PACK RESULTS                                                       */}
        {/* ========================================================================= */}
        {openedCards.length > 0 && activePack && (
          <article className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 animate-scale-in">
            <header className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-lime block">
                  Opened Case
                </span>
                <h4 className="text-lg font-black uppercase text-white tracking-tight">
                  {activePack.name} ({openedCards.length} Cards)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPack(activePack)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 bg-slate-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider hover:border-lime/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-lime" />
                  <span>Again</span>
                </button>
                <button
                  onClick={() => {
                    setOpenedCards([]);
                    setActivePack(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 text-steel hover:text-white border border-white/10 transition-colors cursor-pointer"
                  aria-label="Clear Results"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>

            {/* Opened Cards Grid (5 Columns on Desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 justify-items-center pt-1">
              {openedCards.map((player, index) => (
                <button
                  key={`opened-${player.id}-${index}`}
                  onClick={() => {
                    sfx.cardDeal();
                    setInspectedCard(player);
                  }}
                  className="animate-scale-in transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <PlayerCard player={player} size="sm" showTierLabelBelow />
                </button>
              ))}
            </div>
          </article>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. BEAUTIFUL 8-PLAYER SINGLE LINE SHOWCASE                                */}
      {/* ========================================================================= */}
      <section className="space-y-4 max-w-6xl mx-auto pt-2">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
              Featured Cards
            </h3>
            <span className="text-[10px] font-mono text-steel uppercase">
              Gold+ Tier Curated (8 Players)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimal Search Bar */}
            <div className="relative w-44 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-slate-900 text-white text-xs placeholder:text-steel focus:outline-none focus:border-lime/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel hover:text-white text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Shuffle Button */}
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:border-lime/40 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3 h-3 text-lime" />
              <span>Shuffle</span>
            </button>
          </div>
        </header>

        {/* 8-Card Showcase Grid (No Horizontal Scroll - 2 cols on mobile, 4 cols on tablet, 8 cols on desktop) */}
        {showcaseCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 justify-items-center pt-1">
            {showcaseCards.map((player, index) => (
              <button
                key={`showcase-${player.id}-${index}`}
                onClick={() => {
                  sfx.cardDeal();
                  setInspectedCard(player);
                }}
                className="animate-scale-in transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <PlayerCard player={player} size="sm" showTierLabelBelow />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-steel">
              {rawData === undefined ? 'Loading Cards...' : 'No cards found.'}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. CARD DETAIL INSPECTION MODAL                                           */}
      {/* ========================================================================= */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          cardsList={openedCards.length > 0 ? openedCards : showcaseCards}
          onSelectCard={(c) => setInspectedCard(c)}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </main>
  );
}
