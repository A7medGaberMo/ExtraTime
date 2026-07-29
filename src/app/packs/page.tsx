'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import { ETLogo } from '@/components/shared/et-logo';
import type { PlayerCardData, Tier } from '@/types/player';
import {
  Zap,
  RefreshCw,
  Layers,
  Crown,
  Shield,
  Star,
  Package,
  Flame,
  Search,
  X,
  Trophy,
  Dices,
} from 'lucide-react';

import type { LucideIcon } from "lucide-react";

export interface TierPackConfig {
  id: string;
  tier: Tier | 'ALL';
  name: string;
  badgeLabel: string;
  cost: number;
  icon: LucideIcon;
  accentColor: string;
  gradient: string;
  borderColor: string;
}

const ALL_PACKS_CONFIG: TierPackConfig[] = [
  {
    id: 'pack_icon',
    tier: 'ICON',
    name: 'ICON Pack',
    badgeLabel: 'LEGENDARY ICON',
    cost: 50,
    icon: Crown,
    accentColor: '#D4AF37',
    gradient: 'from-[#FFF8E7]/25 via-[#D4AF37]/35 to-[#1C160B]',
    borderColor: 'border-[#D4AF37] hover:border-[#FFF8E7] shadow-[0_0_25px_rgba(212,175,55,0.35)]',
  },
  {
    id: 'pack_master',
    tier: 'MASTER',
    name: 'Master Pack',
    badgeLabel: 'MASTER CLASS',
    cost: 40,
    icon: Star,
    accentColor: '#A855F7',
    gradient: 'from-[#F3E8FF]/25 via-[#7C3AED]/35 to-[#1A0733]',
    borderColor: 'border-[#A855F7] hover:border-[#F3E8FF] shadow-[0_0_25px_rgba(168,85,247,0.35)]',
  },
  {
    id: 'pack_elite_plus',
    tier: 'ELITE_PLUS',
    name: 'Elite+ Pack',
    badgeLabel: 'ELITE+ STAR',
    cost: 30,
    icon: Zap,
    accentColor: '#0EA5E9',
    gradient: 'from-[#E0F2FE]/25 via-[#0EA5E9]/35 to-[#092B42]',
    borderColor: 'border-[#0EA5E9] hover:border-[#E0F2FE] shadow-[0_0_25px_rgba(14,165,233,0.35)]',
  },
  {
    id: 'pack_elite',
    tier: 'ELITE',
    name: 'Elite Pack',
    badgeLabel: 'ELITE SQUAD',
    cost: 25,
    icon: Zap,
    accentColor: '#E11D48',
    gradient: 'from-[#FFE4E6]/25 via-[#E11D48]/35 to-[#330412]',
    borderColor: 'border-[#E11D48] hover:border-[#FFE4E6] shadow-[0_0_25px_rgba(225,29,72,0.35)]',
  },
  {
    id: 'pack_gold',
    tier: 'GOLD',
    name: 'Gold Pack',
    badgeLabel: 'GOLD CHOICE',
    cost: 20,
    icon: Flame,
    accentColor: '#EAB308',
    gradient: 'from-[#FEF3C7]/25 via-[#EAB308]/35 to-[#241A01]',
    borderColor: 'border-[#EAB308] hover:border-[#FEF3C7] shadow-[0_0_20px_rgba(234,179,8,0.25)]',
  },
  {
    id: 'pack_jumbo',
    tier: 'ALL',
    name: 'Jumbo Pack',
    badgeLabel: 'ALL-STAR JUMBO',
    cost: 35,
    icon: Trophy,
    accentColor: '#EC4899',
    gradient: 'from-pink-500/25 via-purple-700/35 to-slate-950',
    borderColor: 'border-pink-500 hover:border-pink-300 shadow-[0_0_25px_rgba(236,72,153,0.35)]',
  },
  {
    id: 'pack_silver',
    tier: 'SILVER',
    name: 'Silver Pack',
    badgeLabel: 'SILVER PRO',
    cost: 15,
    icon: Shield,
    accentColor: '#CBD5E1',
    gradient: 'from-[#F8FAFC]/25 via-[#CBD5E1]/35 to-[#162032]',
    borderColor: 'border-[#CBD5E1] hover:border-[#F8FAFC] shadow-[0_0_20px_rgba(203,213,225,0.2)]',
  },
  {
    id: 'pack_bronze',
    tier: 'BRONZE',
    name: 'Bronze Pack',
    badgeLabel: 'BRONZE TALENT',
    cost: 10,
    icon: Package,
    accentColor: '#C97A3A',
    gradient: 'from-[#F0C8A0]/25 via-[#C97A3A]/35 to-[#211107]',
    borderColor: 'border-[#C97A3A] hover:border-[#F0C8A0] shadow-[0_0_20px_rgba(201,122,58,0.2)]',
  },
];

// Deterministic seed shuffler for 10-minute rotation
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length;
  let t;
  let i;
  let currentSeed = seed;
  while (m) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    i = Math.floor((currentSeed / 233280) * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export default function PacksPage() {
  const dbPlayers = useQuery(api.players.queries.getAll);
  const dbClubs = useQuery(api.clubs.queries.getAll);
  const dbNations = useQuery(api.nations.queries.getAll);

  const [coins, setCoins] = useState<number>(300);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [openingPack, setOpeningPack] = useState<TierPackConfig | null>(null);

  // Selected Card Inspection Popup Modal State
  const [selectedModalCard, setSelectedModalCard] = useState<PlayerCardData | null>(null);

  // Simple Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 100% Dynamic Convex Database mapping across all leagues & legends
  const activePool = useMemo<(PlayerCardData & { league: string })[]>(() => {
    if (!dbPlayers || dbPlayers.length === 0) return [];

    const clubMap = new Map((dbClubs || []).map((c) => [c._id, c]));
    const nationMap = new Map((dbNations || []).map((n) => [n._id, n.name]));

    return (dbPlayers as unknown as Array<{
      _id: string;
      name: string;
      tier: Tier;
      position: string;
      clubId: Id<"clubs">;
      nationId: Id<"nations">;
      imageUrl?: string;
      isLegend?: boolean;
      kitNumber?: number;
    }>).map((p) => {
      const clubObj = clubMap.get(p.clubId);
      return {
        id: p._id,
        name: p.name,
        tier: p.tier,
        position: p.position,
        club: clubObj?.name || 'Club',
        league: clubObj?.league || 'Global Legends',
        nation: nationMap.get(p.nationId) || 'Nation',
        imageUrl: p.imageUrl,
        isLegend: p.isLegend,
        kitNumber: p.kitNumber,
      };
    });
  }, [dbPlayers, dbClubs, dbNations]);

  // 10-minute rotation timer background state (Functions preserved)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const TEN_MIN_MS = 10 * 60 * 1000;
  const current10MinSeed = Math.floor(nowMs / TEN_MIN_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 10-Minute Random 8 Players Showcase (ICON, MASTER, ELITE+, ELITE with optional rare GOLD)
  const random8FeaturedCards = useMemo(() => {
    if (activePool.length === 0) return [];

    const topTiers = activePool.filter((p) =>
      ['ICON', 'MASTER', 'ELITE_PLUS', 'ELITE'].includes(p.tier)
    );
    const goldTier = activePool.filter((p) => p.tier === 'GOLD');

    const shuffledTop = shuffleWithSeed(topTiers.length > 0 ? topTiers : activePool, current10MinSeed);
    const shuffledGold = shuffleWithSeed(goldTier, current10MinSeed);

    // Default: 8 top tier cards (ICON, MASTER, ELITE+, ELITE)
    const selection = shuffledTop.slice(0, 8);

    // Optional rare Gold card (max 1, appears only in ~25% of rotation seeds)
    const hasRareGold = current10MinSeed % 4 === 0 && shuffledGold.length > 0;
    if (hasRareGold && selection.length === 8) {
      selection[7] = shuffledGold[0];
    }

    return shuffleWithSeed(selection, current10MinSeed);
  }, [activePool, current10MinSeed]);

  // Filtered Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return activePool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.nation.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q)
    );
  }, [activePool, searchQuery]);

  /* Pack Opening Handler with Authentic ET Motion */
  const handleOpenPack = (pack: TierPackConfig) => {
    if (coins < pack.cost || isOpening) return;

    setIsOpening(true);
    setOpeningPack(pack);
    setCoins((prev) => prev - pack.cost);

    setTimeout(() => {
      let filteredPool: PlayerCardData[] = [];

      if (pack.tier === 'ALL') {
        filteredPool = activePool;
      } else {
        filteredPool = activePool.filter((p) => p.tier === pack.tier);
        if (filteredPool.length < 3) {
          filteredPool = [...filteredPool, ...activePool.filter((p) => p.tier !== pack.tier)];
        }
      }

      if (filteredPool.length === 0) {
        filteredPool = activePool;
      }

      const drawn = [...filteredPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((p, idx) => ({ ...p, id: `drawn-${Date.now()}-${idx}` }));

      setOpenedCards(drawn);
      setIsOpening(false);
    }, 1800);
  };

  const resetOpened = () => {
    setOpenedCards([]);
    setOpeningPack(null);
  };

  return (
    <article className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* Top Header & Tokens Balance */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <PageHeader
          title="ExtraTime Pack Arena"
          subtitle="Open authentic ExtraTime tier packs or inspect live random card showcases across all leagues and legends."
        />

        {/* Manager Tokens Balance Pill */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-lime/30 px-4 py-2.5 rounded-2xl self-start sm:self-auto shadow-md backdrop-blur-md">
          <Layers className="h-4 w-4 text-lime" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-steel font-bold uppercase tracking-wider">Tokens:</span>
            <span className="text-base font-bold text-lime font-mono">
              {coins} TKN
            </span>
          </div>
          <button
            onClick={() => setCoins(300)}
            title="Refill Manager Tokens"
            className="ml-2 p-1.5 rounded-xl bg-slate-950 hover:bg-lime/20 text-steel hover:text-lime transition-all border border-border"
            id="btn-refill-tokens"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: EXTRATIME PHYSICAL CARD GAME DECK PACK SPREAD */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden" aria-labelledby="section-pack-decks">
        {openedCards.length === 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <h2 id="section-pack-decks" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    ExtraTime Pack Decks & Premium Tiers
                  </h2>
                  <p className="text-xs text-steel font-medium">Authentic ExtraTime card game pack spread: ICON, Master, Elite+, Elite</p>
                </div>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-lime/10 text-lime border border-lime/30 uppercase tracking-wider">
                1-Click Instant Draw
              </span>
            </div>

            {/* ExtraTime Card Game Deck Spread (Horizontal Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {ALL_PACKS_CONFIG.map((pack) => {
                const IconComp = pack.icon;
                const isPremium = ['ICON', 'MASTER', 'ELITE_PLUS', 'ELITE'].includes(pack.tier);

                return (
                  <div
                    key={pack.id}
                    id={`pack-card-${pack.id}`}
                    onClick={() => handleOpenPack(pack)}
                    className={`group relative rounded-2xl border bg-gradient-to-b ${pack.gradient} ${pack.borderColor} p-3 flex flex-col justify-between items-center text-center gap-2.5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] cursor-pointer overflow-hidden shadow-xl ${
                      isPremium ? 'ring-1 ring-white/20' : ''
                    }`}
                  >
                    {/* Top Tier Badge Header */}
                    <div className="w-full flex items-center justify-center border-b border-white/15 pb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border truncate max-w-full"
                        style={{
                          color: pack.accentColor,
                          backgroundColor: `${pack.accentColor}20`,
                          borderColor: `${pack.accentColor}50`,
                        }}
                      >
                        {pack.badgeLabel}
                      </span>
                    </div>

                    {/* Central 3D Emblem Graphic */}
                    <div className="my-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${pack.accentColor}18`,
                          borderColor: pack.accentColor,
                          boxShadow: `0 0 18px ${pack.accentColor}35`,
                        }}
                      >
                        <IconComp className="w-6 h-6" style={{ color: pack.accentColor }} />
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide leading-tight drop-shadow-sm">
                        {pack.name}
                      </h3>
                    </div>

                    {/* Quick Price Action Button */}
                    <button
                      disabled={coins < pack.cost || isOpening}
                      className="w-full py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-30 flex items-center justify-center gap-1 shadow-md active:scale-95"
                      style={{
                        backgroundColor: pack.accentColor,
                        color: pack.tier === 'ICON' ? '#000000' : '#FFFFFF',
                      }}
                    >
                      <span>Open</span>
                      <span className="opacity-40">•</span>
                      <span className="font-bold text-xs font-mono">
                        {pack.cost} TKN
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Cards Reveal Arena with Enhanced 3D Motion for 3 Players */
          <div className="flex flex-col items-center gap-6 py-6 animate-scale-in relative z-10">
            <div className="text-center space-y-1 flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime bg-lime/10 px-3 py-1 rounded-full border border-lime/30">
                <ETLogo variant="icon-only" size={16} />
                <span>ExtraTime Pack Opening Complete</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">
                {openingPack?.name || 'Pack Reveal'}
              </h2>
            </div>

            {/* 3D Motion Layout for 3 Drawn Players */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-6 perspective-[1000px] w-full max-w-3xl">
              {openedCards.map((player, idx) => {
                const isCenter = idx === 1;
                const tiltStyle =
                  idx === 0
                    ? 'sm:-rotate-6 sm:-translate-y-2 hover:rotate-0 hover:scale-105'
                    : isCenter
                    ? 'sm:scale-110 sm:-translate-y-6 sm:z-20 hover:scale-115'
                    : 'sm:rotate-6 sm:-translate-y-2 hover:rotate-0 hover:scale-105';

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedModalCard(player)}
                    className={`transform transition-all duration-500 cursor-pointer animate-slide-up ${tiltStyle}`}
                    style={{ animationDelay: `${idx * 180}ms` }}
                  >
                    <div
                      className={`rounded-3xl p-1 transition-shadow duration-300 ${
                        isCenter ? 'shadow-[0_0_40px_rgba(212,175,55,0.4)]' : ''
                      }`}
                    >
                      <PlayerCard player={player} size="md" showTierLabelBelow />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetOpened}
              className="px-7 py-3 bg-lime hover:bg-vivid text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-lime/20 transition-all active:scale-95 flex items-center gap-2"
              id="btn-open-another"
            >
              <RefreshCw className="h-4 w-4" />
              Open Another Pack
            </button>
          </div>
        )}

        {/* EXTRATIME BRANDED PACK OPENING TRANSITION */}
        {isOpening && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 animate-fade-in overflow-hidden">
            {/* Background Rotating Light Rays */}
            <div
              className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-light-rays pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, ${openingPack?.accentColor || '#95E810'} 0deg, transparent 60deg, ${openingPack?.accentColor || '#95E810'} 120deg, transparent 180deg, ${openingPack?.accentColor || '#95E810'} 240deg, transparent 300deg)`,
              }}
            />

            {/* Authentic ExtraTime Logo Crest Charging Ring */}
            <div
              className="w-36 h-36 rounded-3xl border-4 flex items-center justify-center shadow-2xl relative animate-pack-open"
              style={{
                borderColor: openingPack?.accentColor || '#95E810',
                boxShadow: `0 0 90px ${openingPack?.accentColor || '#95E810'}`,
                backgroundColor: `${openingPack?.accentColor || '#95E810'}25`,
              }}
            >
              <ETLogo variant="metallic-gold" size={68} />
              <div
                className="absolute inset-0 rounded-3xl animate-ping opacity-30"
                style={{ backgroundColor: openingPack?.accentColor || '#95E810' }}
              />
            </div>

            <div className="text-center space-y-1.5 relative z-10">
              <h3 className="text-xl font-bold text-white tracking-wide">
                Opening {openingPack?.name}...
              </h3>
              <p className="text-xs text-lime font-bold tracking-widest uppercase animate-pulse">
                Drawing Player Cards from Convex DB...
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: CLEAN EXTRATIME SEARCH & 10-MIN RANDOM SHOWCASE */}
      {/* ========================================================================= */}
      <section className="space-y-6" aria-labelledby="section-search-rotation">
        {/* EXTRATIME SEARCH BAR */}
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-lime" />
            <h3 id="section-search-rotation" className="text-base sm:text-lg font-bold text-white tracking-tight">
              Search ExtraTime Players
            </h3>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-steel" />
            <input
              type="text"
              id="input-search-players"
              placeholder="Search player, club, legend..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-steel focus:outline-none focus:border-lime/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-white"
                id="btn-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS OR 10-MINUTE RANDOM SHOWCASE */}
        {searchQuery.trim() !== '' ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-steel">
              Found <span className="text-lime">{searchResults.length}</span> matching players:
            </p>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedModalCard(player)}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  >
                    <PlayerCard player={player} size="sm" showTierLabelBelow />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-8 text-center text-steel text-sm font-medium">
                No players found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        ) : (
          /* 10-MINUTE RANDOM 8 PLAYERS SHOWCASE */
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-lime animate-bounce" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  ExtraTime Live Rotation (Leagues & Legends)
                </h3>
              </div>
            </div>

            {random8FeaturedCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
                {random8FeaturedCards.map((player) => (
                  <div
                    key={`rot8-${player.id}`}
                    onClick={() => setSelectedModalCard(player)}
                    className="scale-95 hover:scale-105 transition-transform cursor-pointer relative group"
                  >
                    <PlayerCard player={player} size="sm" showTierLabelBelow />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-steel text-center py-4 font-medium">Loading random showcase...</p>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* HIGH-RES EXTRATIME CARD DETAIL POPUP MODAL */}
      {/* ========================================================================= */}
      {selectedModalCard && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedModalCard(null)}
          id="modal-card-inspection"
        >
          <div
            className="relative bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedModalCard(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-all"
              id="btn-close-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Title */}
            <div className="text-center space-y-1 flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime px-3 py-1 rounded-full bg-lime/10 border border-lime/30">
                <ETLogo variant="icon-only" size={14} />
                <span>ExtraTime Card Inspection</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
                {selectedModalCard.name}
              </h3>
            </div>

            {/* Large Player Card */}
            <div className="scale-105 transition-transform my-2">
              <PlayerCard player={selectedModalCard} size="lg" showTierLabelBelow />
            </div>

            {/* Detailed Attributes Grid */}
            <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950 p-4 rounded-2xl border border-white/10">
              <div className="space-y-0.5">
                <span className="text-xs text-steel font-bold uppercase">Club</span>
                <p className="text-white font-bold truncate">{selectedModalCard.club}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-steel font-bold uppercase">Nation</span>
                <p className="text-white font-bold truncate">{selectedModalCard.nation}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-steel font-bold uppercase">Position</span>
                <p className="text-lime font-bold">{selectedModalCard.position}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-steel font-bold uppercase">Tier</span>
                <p className="text-amber-400 font-bold">{selectedModalCard.tier}</p>
              </div>
            </div>

            {/* Done Action Button */}
            <button
              onClick={() => setSelectedModalCard(null)}
              className="w-full py-3 bg-lime hover:bg-vivid text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
              id="btn-done-modal"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
