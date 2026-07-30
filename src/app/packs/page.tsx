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
  Sparkles,
  Coins,
  ShieldCheck,
  Target,
  Gem,
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
  secondaryColor: string;
  gradient: string;
  borderColor: string;
}

const ALL_PACKS_CONFIG: TierPackConfig[] = [
  {
    id: 'pack_icon',
    tier: 'ICON',
    name: 'ICON',
    badgeLabel: 'ICON',
    cost: 50,
    icon: Crown,
    accentColor: '#D4AF37',
    secondaryColor: '#FFF3C4',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#1A1405]',
    borderColor: 'border-[#D4AF37]/70 hover:border-[#FFF3C4] shadow-[0_0_15px_rgba(212,175,55,0.2)]',
  },
  {
    id: 'pack_master',
    tier: 'MASTER',
    name: 'Master',
    badgeLabel: 'MASTER',
    cost: 40,
    icon: Gem,
    accentColor: '#A855F7',
    secondaryColor: '#F3E8FF',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#1F0B2E]',
    borderColor: 'border-[#A855F7]/70 hover:border-[#F3E8FF] shadow-[0_0_15px_rgba(168,85,247,0.2)]',
  },
  {
    id: 'pack_elite_plus',
    tier: 'ELITE_PLUS',
    name: 'Elite+',
    badgeLabel: 'ELITE+',
    cost: 30,
    icon: Zap,
    accentColor: '#0EA5E9',
    secondaryColor: '#E0F2FE',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#02202E]',
    borderColor: 'border-[#0EA5E9]/70 hover:border-[#E0F2FE] shadow-[0_0_15px_rgba(14,165,233,0.2)]',
  },
  {
    id: 'pack_elite',
    tier: 'ELITE',
    name: 'Elite',
    badgeLabel: 'ELITE',
    cost: 25,
    icon: ShieldCheck,
    accentColor: '#E11D48',
    secondaryColor: '#FFE4E6',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#2B0610]',
    borderColor: 'border-[#E11D48]/70 hover:border-[#FFE4E6] shadow-[0_0_15px_rgba(225,29,72,0.2)]',
  },
  {
    id: 'pack_gold',
    tier: 'GOLD',
    name: 'Gold',
    badgeLabel: 'GOLD',
    cost: 20,
    icon: Trophy,
    accentColor: '#EAB308',
    secondaryColor: '#FEF3C7',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#1F190B]',
    borderColor: 'border-[#EAB308]/70 hover:border-[#FEF3C7] shadow-[0_0_12px_rgba(234,179,8,0.15)]',
  },
  {
    id: 'pack_jumbo',
    tier: 'ALL',
    name: 'Jumbo',
    badgeLabel: 'JUMBO',
    cost: 35,
    icon: Package,
    accentColor: '#95E810',
    secondaryColor: '#00CFFF',
    gradient: 'from-[#06080C] via-[#102404] to-[#03222B]',
    borderColor: 'border-lime/70 hover:border-[#00CFFF] shadow-[0_0_20px_rgba(149,232,16,0.25)]',
  },
  {
    id: 'pack_silver',
    tier: 'SILVER',
    name: 'Silver',
    badgeLabel: 'SILVER',
    cost: 15,
    icon: Star,
    accentColor: '#CBD5E1',
    secondaryColor: '#F8FAFC',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#1C2026]',
    borderColor: 'border-[#CBD5E1]/60 hover:border-[#F8FAFC] shadow-[0_0_12px_rgba(203,213,225,0.12)]',
  },
  {
    id: 'pack_bronze',
    tier: 'BRONZE',
    name: 'Bronze',
    badgeLabel: 'BRONZE',
    cost: 10,
    icon: Target,
    accentColor: '#C97A3A',
    secondaryColor: '#F0C8A0',
    gradient: 'from-[#06080C] via-[#0D1017] to-[#241308]',
    borderColor: 'border-[#C97A3A]/60 hover:border-[#F0C8A0] shadow-[0_0_12px_rgba(201,122,58,0.12)]',
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

  // EA FC / FIFA Style Typewriter Pack Reveal Animation State
  const [openingStage, setOpeningStage] = useState<'idle' | 'charging' | 'scanning' | 'complete'>('idle');
  const [typewriterText, setTypewriterText] = useState<string>('');

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

  /* Minimal Pack Opening Handler */
  const handleOpenPack = (pack: TierPackConfig) => {
    if (coins < pack.cost || isOpening) return;

    setIsOpening(true);
    setOpeningPack(pack);
    setCoins((prev) => prev - pack.cost);
    setOpeningStage('charging');
    setTypewriterText('OPENING PACK...');

    setTimeout(() => {
      setOpeningStage('scanning');
      setTypewriterText('SCANNING CARDS...');
    }, 400);

    setTimeout(() => {
      setTypewriterText('DRAWING PLAYERS...');
    }, 1000);

    setTimeout(() => {
      setTypewriterText('READY!');
    }, 1600);

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
      setOpeningStage('idle');
    }, 2400);
  };

  const resetOpened = () => {
    setOpenedCards([]);
    setOpeningPack(null);
  };

  return (
    <article className="space-y-6 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* Top Header & Tokens Balance */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <PageHeader
          title="Packs"
          subtitle="Open player packs to draw collectible cards."
        />

        {/* Tokens Balance Pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-lime/30 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-md backdrop-blur-md">
          <Coins className="h-4 w-4 text-lime shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-steel font-bold uppercase tracking-wider whitespace-nowrap">Tokens:</span>
            <span className="text-xs sm:text-sm font-bold text-lime font-mono whitespace-nowrap">
              {coins} TKN
            </span>
          </div>
          <button
            onClick={() => setCoins(300)}
            title="Refill Tokens"
            className="ml-1 p-1 rounded-lg bg-slate-950 hover:bg-lime/20 text-steel hover:text-lime transition-all border border-border shrink-0"
            id="btn-refill-tokens"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: PACK DECK SPREAD (MINIMAL & COMPACT ON MOBILE) */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-5 shadow-xl backdrop-blur-xl overflow-hidden" aria-labelledby="section-pack-decks">
        {openedCards.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime" />
                </div>
                <div className="min-w-0">
                  <h2 id="section-pack-decks" className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
                    Packs
                  </h2>
                  <p className="text-[10px] sm:text-xs text-steel font-medium truncate">
                    Draw 3 cards per pack
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 uppercase tracking-wider whitespace-nowrap">
                3 Cards
              </span>
            </div>

            {/* Compact High-End Pack Deck Spread (4 cols on mobile = 2 small rows for all 8 cards) */}
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2">
              {ALL_PACKS_CONFIG.map((pack) => {
                const IconComp = pack.icon;

                return (
                  <div
                    key={pack.id}
                    id={`pack-card-${pack.id}`}
                    onClick={() => handleOpenPack(pack)}
                    className="group relative rounded-lg sm:rounded-xl border border-white/10 hover:border-lime/50 bg-slate-900/60 hover:bg-slate-900/90 p-1.5 sm:p-2.5 flex flex-col justify-between items-center text-center gap-1 sm:gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden shadow-sm backdrop-blur-md"
                  >
                    {/* Minimal Tier Badge Header */}
                    <div className="w-full flex items-center justify-center border-b border-white/5 pb-0.5">
                      <span
                        className="text-[7.5px] sm:text-[9px] font-bold uppercase tracking-wider truncate max-w-full leading-none whitespace-nowrap"
                        style={{ color: pack.accentColor }}
                      >
                        {pack.badgeLabel}
                      </span>
                    </div>

                    {/* Central Icon & Name */}
                    <div className="my-0.5 flex flex-col items-center gap-0.5 sm:gap-1">
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center border border-white/10 bg-white/5 transition-transform duration-200 group-hover:scale-105 shrink-0"
                      >
                        <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: pack.accentColor }} />
                      </div>

                      <h3 className="text-[10px] sm:text-xs font-semibold text-slate-200 tracking-tight leading-none truncate max-w-full">
                        {pack.name}
                      </h3>
                    </div>

                    {/* Minimal High-End Price Button */}
                    <button
                      disabled={coins < pack.cost || isOpening}
                      className="w-full py-0.5 sm:py-1 rounded bg-white/10 hover:bg-lime hover:text-slate-950 text-white font-mono text-[8.5px] sm:text-[10px] font-bold tracking-tight transition-all border border-white/10 disabled:opacity-30 flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
                    >
                      <span>{pack.cost} TKN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Cards Reveal Arena */
          <div className="flex flex-col items-center gap-5 py-4 animate-scale-in relative z-10">
            <div className="text-center space-y-1 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-lime bg-lime/10 px-3 py-0.5 rounded-full border border-lime/30 whitespace-nowrap">
                <ETLogo variant="icon-only" size={14} />
                <span>Draw Complete</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-0.5 uppercase">
                {openingPack?.name || 'Pack Reveal'}
              </h2>
            </div>

            {/* 3-Card Display Layout: wraps to 2 lines on narrow screens to prevent overflow */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 py-2 w-full max-w-4xl mx-auto px-1">
              {openedCards.map((player, idx) => {
                const isCenter = idx === 1;

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedModalCard(player)}
                    className={`transform transition-all duration-300 cursor-pointer animate-slide-up scale-[0.78] sm:scale-[0.85] lg:scale-100 shrink-0 ${isCenter ? 'z-20 sm:-translate-y-1.5' : 'z-10'
                      }`}
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="relative group p-0">
                      <PlayerCard player={player} size="md" showTierLabelBelow />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetOpened}
              className="px-6 py-2.5 bg-lime hover:bg-vivid text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              id="btn-open-another"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span>Open Pack</span>
            </button>
          </div>
        )}

        {/* PACK OPENING TRANSITION WITH TYPEWRITER SCANNER */}
        {isOpening && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-fade-in overflow-hidden">
            {/* Background Spinning Conic Radial Beam */}
            <div
              className="absolute w-[500px] h-[500px] rounded-full opacity-20 animate-spin pointer-events-none"
              style={{
                animationDuration: '10s',
                background: `conic-gradient(from 0deg, ${openingPack?.accentColor || '#95E810'} 0deg, transparent 60deg, ${openingPack?.accentColor || '#95E810'} 120deg, transparent 180deg, ${openingPack?.accentColor || '#95E810'} 240deg, transparent 300deg)`,
              }}
            />

            {/* Pack Shell Container */}
            <div className="relative flex flex-col items-center gap-4 z-10 animate-scale-in">
              <div
                className="relative w-36 h-52 sm:w-44 sm:h-64 rounded-xl border-2 flex flex-col items-center justify-between p-3 shadow-xl transition-transform duration-300 overflow-hidden bg-slate-900/90"
                style={{
                  borderColor: openingPack?.accentColor || '#95E810',
                  boxShadow: `0 0 40px ${openingPack?.accentColor || '#95E810'}40`,
                }}
              >
                {/* Top Header */}
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-lime font-mono">
                    {openingPack?.badgeLabel || 'PACK'}
                  </span>
                  <ETLogo variant="icon-only" size={16} />
                </div>

                {/* Central Emblem */}
                <div className="flex flex-col items-center gap-2 my-auto text-center">
                  {openingPack && (
                    <div
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border shadow-lg animate-pulse"
                      style={{
                        backgroundColor: `${openingPack.accentColor}20`,
                        borderColor: openingPack.accentColor,
                        boxShadow: `0 0 20px ${openingPack.accentColor}40`,
                      }}
                    >
                      <openingPack.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: openingPack.accentColor }} />
                    </div>
                  )}
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    {openingPack?.name}
                  </h4>
                </div>

                {/* Bottom Footer */}
                <div className="w-full border-t border-white/10 pt-1.5 text-center">
                  <span className="text-[9px] font-mono text-steel font-bold tracking-wider">
                    3 CARDS
                  </span>
                </div>

                {/* Laser Scanner Line */}
                {openingStage === 'scanning' && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime to-transparent shadow-[0_0_15px_#95E810] animate-scanner-line" />
                )}
              </div>

              {/* Typewriter Console */}
              <div className="w-64 sm:w-80 bg-slate-900/90 border border-lime/30 rounded-lg p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-lime animate-ping shrink-0" />
                <p className="text-[11px] font-mono font-bold text-lime tracking-wide uppercase truncate">
                  {typewriterText}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: PLAYER SEARCH & SHOWCASE */}
      {/* ========================================================================= */}
      <section className="space-y-4" aria-labelledby="section-search-rotation">
        {/* SEARCH BAR */}
        <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-lime" />
            <h3 id="section-search-rotation" className="text-sm sm:text-base font-bold text-white tracking-tight">
              Search Players
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel" />
            <input
              type="text"
              id="input-search-players"
              placeholder="Search player, club, legend..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-medium text-white placeholder-steel focus:outline-none focus:border-lime/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel hover:text-white"
                id="btn-clear-search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS OR ROTATION SHOWCASE */}
        {searchQuery.trim() !== '' ? (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-steel">
              Found <span className="text-lime">{searchResults.length}</span> matching players:
            </p>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
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
              <div className="bg-slate-950/60 border border-white/10 rounded-xl p-6 text-center text-steel text-xs font-medium">
                No players found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        ) : (
          /* SHOWCASE */
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 sm:p-4 shadow-lg backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-lime" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Player Showcase
                </h3>
              </div>
            </div>

            {random8FeaturedCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-2.5">
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
              <p className="text-xs text-steel text-center py-3 font-medium">Loading showcase...</p>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* CARD DETAIL POPUP MODAL */}
      {/* ========================================================================= */}
      {selectedModalCard && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedModalCard(null)}
          id="modal-card-inspection"
        >
          <div
            className="relative bg-slate-900 border border-white/20 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedModalCard(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-slate-950 text-steel hover:text-white border border-white/10 hover:border-lime/40 transition-all"
              id="btn-close-modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Title */}
            <div className="text-center space-y-0.5 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lime px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/30">
                <ETLogo variant="icon-only" size={12} />
                <span>Card Details</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight pt-1">
                {selectedModalCard.name}
              </h3>
            </div>

            {/* Player Card */}
            <div className="scale-100 transition-transform my-1">
              <PlayerCard player={selectedModalCard} size="lg" showTierLabelBelow />
            </div>

            {/* Detailed Attributes Grid */}
            <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-white/10">
              <div className="space-y-0.5">
                <span className="text-[10px] text-steel font-bold uppercase">Club</span>
                <p className="text-white font-bold truncate">{selectedModalCard.club}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-steel font-bold uppercase">Nation</span>
                <p className="text-white font-bold truncate">{selectedModalCard.nation}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-steel font-bold uppercase">Position</span>
                <p className="text-lime font-bold">{selectedModalCard.position}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-steel font-bold uppercase">Tier</span>
                <p className="text-amber-400 font-bold">{selectedModalCard.tier}</p>
              </div>
            </div>

            {/* Done Action Button */}
            <button
              onClick={() => setSelectedModalCard(null)}
              className="w-full py-2.5 bg-lime hover:bg-vivid text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              id="btn-done-modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
