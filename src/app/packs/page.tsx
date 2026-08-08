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
  RefreshCw,
  Crown,
  Package,
  Search,
  X,
  Trophy,
  Dices,
  Sparkles,
  Coins,
  Gem,
} from 'lucide-react';

import type { LucideIcon } from "lucide-react";

export interface TierPackConfig {
  id: string;
  name: string;
  badgeLabel: string;
  description: string;
  cost: number;
  cardCount: number;
  allowedTiers: (Tier | 'ALL')[];
  icon: LucideIcon;
  accentColor: string;
  secondaryColor: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
}

const FOUR_ENTERTAINMENT_PACKS: TierPackConfig[] = [
  {
    id: 'pack_all_tiers_showcase',
    name: 'All-Tiers Showcase',
    badgeLabel: '5 CARDS (1 EACH TIER)',
    description: '1 ICON, HERO, MASTER, ELITE+ & ELITE card.',
    cost: 100,
    cardCount: 5,
    allowedTiers: ['ALL'],
    icon: Package,
    accentColor: '#95E810',
    secondaryColor: '#00CFFF',
    gradient: 'from-[#0A1A05] via-[#122A08] to-[#030F02]',
    borderColor: 'border-lime/80 hover:border-[#00CFFF]',
    glowColor: 'rgba(149,232,16,0.4)',
  },
  {
    id: 'pack_top_retired',
    name: 'Top Retired Legends',
    badgeLabel: '5 RETIRED LEGENDS',
    description: '5 top all-time retired legends.',
    cost: 60,
    cardCount: 5,
    allowedTiers: ['ICON', 'HERO'],
    icon: Crown,
    accentColor: '#D4AF37',
    secondaryColor: '#FFF3C4',
    gradient: 'from-[#1A1405] via-[#2A2008] to-[#0A0803]',
    borderColor: 'border-[#D4AF37]/80 hover:border-[#FFF3C4]',
    glowColor: 'rgba(212,175,55,0.4)',
  },
  {
    id: 'pack_top_active',
    name: 'Top Active Stars',
    badgeLabel: '3 ACTIVE SUPERSTARS',
    description: '3 top active superstars.',
    cost: 40,
    cardCount: 3,
    allowedTiers: ['MASTER', 'ELITE_PLUS', 'ELITE'],
    icon: Gem,
    accentColor: '#A855F7',
    secondaryColor: '#F3E8FF',
    gradient: 'from-[#1F0B2E] via-[#2E1045] to-[#0D0414]',
    borderColor: 'border-[#A855F7]/80 hover:border-[#F3E8FF]',
    glowColor: 'rgba(168,85,247,0.4)',
  },
  {
    id: 'pack_standard_active',
    name: 'Standard Active',
    badgeLabel: '3 ACTIVE CARDS',
    description: '3 active players from Gold, Silver & Bronze.',
    cost: 20,
    cardCount: 3,
    allowedTiers: ['GOLD', 'SILVER', 'BRONZE'],
    icon: Trophy,
    accentColor: '#EAB308',
    secondaryColor: '#FEF3C7',
    gradient: 'from-[#1F190B] via-[#2E240D] to-[#0A0803]',
    borderColor: 'border-[#EAB308]/80 hover:border-[#FEF3C7]',
    glowColor: 'rgba(234,179,8,0.35)',
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

  // EA FC / FIFA Style Typewriter & Particle Stage State
  const [openingStage, setOpeningStage] = useState<'idle' | 'charging' | 'scanning' | 'burst' | 'complete'>('idle');
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

  // 10-minute rotation timer background state
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const TEN_MIN_MS = 10 * 60 * 1000;
  const current10MinSeed = Math.floor(nowMs / TEN_MIN_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 10-Minute Random 8 Players Showcase
  const random8FeaturedCards = useMemo(() => {
    if (activePool.length === 0) return [];

    const topTiers = activePool.filter((p) =>
      ['ICON', 'HERO', 'MASTER', 'ELITE_PLUS', 'ELITE'].includes(p.tier)
    );
    const goldTier = activePool.filter((p) => p.tier === 'GOLD');

    const shuffledTop = shuffleWithSeed(topTiers.length > 0 ? topTiers : activePool, current10MinSeed);
    const shuffledGold = shuffleWithSeed(goldTier, current10MinSeed);

    const selection = shuffledTop.slice(0, 8);
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

  /* Pack Opening Handler with Custom Tier Breakdown */
  const handleOpenPack = (pack: TierPackConfig) => {
    if (coins < pack.cost || isOpening) return;

    setIsOpening(true);
    setOpeningPack(pack);
    setCoins((prev) => prev - pack.cost);
    setOpeningStage('charging');
    setTypewriterText('CHARGING ENERGY CHAMBER...');

    setTimeout(() => {
      setOpeningStage('scanning');
      setTypewriterText(`SCANNING ${pack.badgeLabel}...`);
    }, 500);

    setTimeout(() => {
      setOpeningStage('burst');
      setTypewriterText('EXPLOSIVE PACK BURST!');
    }, 1300);

    setTimeout(() => {
      setTypewriterText('REVEALING PLAYERS...');
    }, 1900);

    setTimeout(() => {
      let drawn: PlayerCardData[] = [];

      if (pack.id === 'pack_all_tiers_showcase') {
        // 1. All-Tiers Showcase (100 TKN): 1 ICON, 1 HERO, 1 MASTER, 1 ELITE_PLUS, 1 ELITE
        const iconPool = activePool.filter((p) => p.tier === 'ICON');
        const heroPool = activePool.filter((p) => p.tier === 'HERO');
        const masterPool = activePool.filter((p) => p.tier === 'MASTER');
        const elitePlusPool = activePool.filter((p) => p.tier === 'ELITE_PLUS');
        const elitePool = activePool.filter((p) => p.tier === 'ELITE');

        const getRandom = (pool: PlayerCardData[]) => {
          if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
          return activePool[Math.floor(Math.random() * activePool.length)];
        };

        drawn = [
          getRandom(iconPool),
          getRandom(heroPool),
          getRandom(masterPool),
          getRandom(elitePlusPool),
          getRandom(elitePool),
        ].map((p, idx) => ({
          ...p,
          id: `showcase-${Date.now()}-${idx}`,
        }));
      } else if (pack.id === 'pack_top_retired') {
        // 2. Top Retired Legends (60 TKN): 5 Top Retired Legends (ICON & HERO)
        const retiredPool = activePool.filter((p) => p.isLegend || p.tier === 'ICON' || p.tier === 'HERO');
        drawn = [...retiredPool]
          .sort(() => 0.5 - Math.random())
          .slice(0, 5)
          .map((p, idx) => ({ ...p, id: `retired-${Date.now()}-${idx}` }));
      } else if (pack.id === 'pack_top_active') {
        // 3. Top Active Stars (40 TKN): 3 Top Active Stars (MASTER, ELITE_PLUS, ELITE)
        const topActivePool = activePool.filter(
          (p) => !p.isLegend && ['MASTER', 'ELITE_PLUS', 'ELITE'].includes(p.tier)
        );
        drawn = [...(topActivePool.length >= 3 ? topActivePool : activePool)]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((p, idx) => ({ ...p, id: `active-top-${Date.now()}-${idx}` }));
      } else if (pack.id === 'pack_standard_active') {
        // 4. Standard Active (20 TKN): 3 Active Players (GOLD, SILVER, BRONZE)
        const standardActivePool = activePool.filter(
          (p) => !p.isLegend && ['GOLD', 'SILVER', 'BRONZE'].includes(p.tier)
        );
        drawn = [...(standardActivePool.length >= 3 ? standardActivePool : activePool)]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((p, idx) => ({ ...p, id: `active-std-${Date.now()}-${idx}` }));
      }

      setOpenedCards(drawn);
      setIsOpening(false);
      setOpeningStage('idle');
    }, 2650);
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
        <div className="flex items-center gap-2 bg-slate-900/90 border border-lime/30 px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-md backdrop-blur-md">
          <Coins className="h-4 w-4 text-lime shrink-0 animate-pulse" />
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
      {/* SECTION 1: 4 CURATED ENTERTAINMENT PACKS (PERFECT FOR MOBILE & DESKTOP) */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-6 shadow-xl backdrop-blur-xl overflow-hidden" aria-labelledby="section-pack-decks">
        {openedCards.length === 0 ? (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(149,232,16,0.2)]">
                  <Package className="w-4 h-4 text-lime" />
                </div>
                <div>
                  <h2 id="section-pack-decks" className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                    Curated Packs
                  </h2>
                  <p className="text-[11px] sm:text-xs text-steel font-medium">
                    Select a pack to open cards (3 to 5 players per draw)
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-lime/10 text-lime border border-lime/30 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>4 Distinct Decks</span>
              </span>
            </div>

            {/* 4 Distinct Packs Grid (2 cols on mobile, 4 cols on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {FOUR_ENTERTAINMENT_PACKS.map((pack) => {
                const IconComp = pack.icon;

                return (
                  <div
                    key={pack.id}
                    id={`pack-card-${pack.id}`}
                    onClick={() => handleOpenPack(pack)}
                    className={`group relative rounded-2xl border ${pack.borderColor} bg-gradient-to-b ${pack.gradient} p-3 sm:p-5 flex flex-col justify-between items-center text-center gap-2 sm:gap-3 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 cursor-pointer overflow-hidden shadow-xl backdrop-blur-md`}
                    style={{
                      boxShadow: `0 8px 25px ${pack.glowColor}`,
                    }}
                  >
                    {/* Top Shimmer Banner & Badge */}
                    <div className="w-full flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span
                        className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 truncate max-w-[82%]"
                        style={{ color: pack.accentColor }}
                      >
                        {pack.badgeLabel}
                      </span>
                      <ETLogo variant="icon-only" size={14} />
                    </div>

                    {/* Central 3D Icon & Title */}
                    <div className="my-1 sm:my-2 flex flex-col items-center gap-1 sm:gap-2">
                      <div
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0"
                        style={{
                          backgroundColor: `${pack.accentColor}18`,
                          borderColor: pack.accentColor,
                          boxShadow: `0 0 20px ${pack.glowColor}`,
                        }}
                      >
                        <IconComp className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: pack.accentColor }} />
                      </div>

                      <div className="space-y-0.5 sm:space-y-1">
                        <h3 className="text-xs sm:text-lg font-bold text-white tracking-tight uppercase leading-snug">
                          {pack.name}
                        </h3>
                        <p className="text-[9.5px] sm:text-[11px] text-steel font-medium leading-tight line-clamp-2 max-w-[180px] mx-auto">
                          {pack.description}
                        </p>
                      </div>
                    </div>

                    {/* High-End Price Action Button */}
                    <button
                      disabled={coins < pack.cost || isOpening}
                      className="w-full py-1.5 sm:py-2 rounded-xl bg-slate-950/90 hover:bg-lime hover:text-slate-950 text-white font-mono text-[10px] sm:text-sm font-bold tracking-tight transition-all border border-white/20 hover:border-lime disabled:opacity-30 flex items-center justify-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
                    >
                      <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-lime group-hover:text-slate-950" />
                      <span>{pack.cost} TKN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Cards Reveal Arena (Responsive Grid & Scaled for Mobile Screens) */
          <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-6 animate-scale-in relative z-10">
            <div className="text-center space-y-1 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-lime bg-lime/10 px-3.5 py-1 rounded-full border border-lime/30 whitespace-nowrap shadow-[0_0_15px_rgba(149,232,16,0.2)]">
                <ETLogo variant="icon-only" size={14} />
                <span>Draw Complete ({openedCards.length} Players)</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight pt-0.5 sm:pt-1 uppercase">
                {openingPack?.name || 'Pack Reveal'}
              </h2>
            </div>

            {/* Dynamic Drawn Cards Grid Layout (Mobile-friendly scaling & wrapping) */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-4 py-2 w-full max-w-5xl mx-auto px-1">
              {openedCards.map((player, idx) => {
                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedModalCard(player)}
                    className="transform transition-all duration-300 cursor-pointer animate-slide-up hover:scale-105 hover:-translate-y-2 scale-[0.68] xs:scale-[0.78] sm:scale-90 lg:scale-100 shrink-0 -mx-3 sm:mx-0"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="relative group p-0">
                      <PlayerCard player={player} size={openedCards.length > 3 ? 'sm' : 'md'} showTierLabelBelow />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetOpened}
              className="px-6 py-2.5 sm:px-7 sm:py-3 bg-lime hover:bg-vivid text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              id="btn-open-another"
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span>Open Another Pack</span>
            </button>
          </div>
        )}

        {/* ENTERTAINING CINEMATIC PACK OPENING STAGE */}
        {isOpening && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-fade-in overflow-hidden">
            {/* Background Spinning Radial Conic Beams */}
            <div
              className="absolute w-[650px] h-[650px] rounded-full opacity-30 animate-spin pointer-events-none"
              style={{
                animationDuration: '6s',
                background: `conic-gradient(from 0deg, ${openingPack?.accentColor || '#95E810'} 0deg, transparent 45deg, ${openingPack?.accentColor || '#95E810'} 90deg, transparent 135deg, ${openingPack?.accentColor || '#95E810'} 180deg, transparent 225deg, ${openingPack?.accentColor || '#95E810'} 270deg, transparent 315deg)`,
              }}
            />

            {/* Sparkle Particles Burst Layer */}
            {openingStage === 'burst' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className="w-96 h-96 rounded-full animate-ping opacity-75"
                  style={{
                    backgroundColor: openingPack?.accentColor || '#95E810',
                    filter: 'blur(40px)',
                  }}
                />
              </div>
            )}

            {/* Central Pack Container Shell */}
            <div className="relative flex flex-col items-center gap-4 sm:gap-5 z-10 animate-scale-in">
              <div
                className={`relative w-36 h-52 sm:w-48 sm:h-68 rounded-2xl border-2 flex flex-col items-center justify-between p-3.5 sm:p-4 shadow-2xl transition-transform duration-300 overflow-hidden bg-slate-900/90 ${
                  openingStage === 'burst' ? 'scale-110 rotate-2 brightness-150' : 'animate-pack-float'
                }`}
                style={{
                  borderColor: openingPack?.accentColor || '#95E810',
                  boxShadow: `0 0 60px ${openingPack?.glowColor || 'rgba(149,232,16,0.4)'}`,
                }}
              >
                {/* Top Header */}
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-lime font-mono">
                    {openingPack?.badgeLabel || 'PACK'}
                  </span>
                  <ETLogo variant="icon-only" size={16} />
                </div>

                {/* Central Emblem */}
                <div className="flex flex-col items-center gap-2 my-auto text-center">
                  {openingPack && (
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-xl animate-pulse"
                      style={{
                        backgroundColor: `${openingPack.accentColor}20`,
                        borderColor: openingPack.accentColor,
                        boxShadow: `0 0 30px ${openingPack.glowColor}`,
                      }}
                    >
                      <openingPack.icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: openingPack.accentColor }} />
                    </div>
                  )}
                  <h4 className="text-xs sm:text-base font-extrabold text-white uppercase tracking-wider">
                    {openingPack?.name}
                  </h4>
                </div>

                {/* Bottom Footer */}
                <div className="w-full border-t border-white/10 pt-2 text-center">
                  <span className="text-[10px] font-mono text-steel font-bold tracking-wider">
                    {openingPack?.cardCount || 3} PLAYERS
                  </span>
                </div>

                {/* Laser Scanner Line */}
                {openingStage === 'scanning' && (
                  <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-lime to-transparent shadow-[0_0_20px_#95E810] animate-scanner-line" />
                )}
              </div>

              {/* Typewriter & Visual Equalizer Console */}
              <div className="w-68 sm:w-84 bg-slate-900/90 border border-lime/30 rounded-xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-1 h-3 bg-lime animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-4 bg-lime animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-2 bg-lime animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-[11px] sm:text-xs font-mono font-bold text-lime tracking-wide uppercase truncate">
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
        <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
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
            className="relative bg-slate-900 border border-white/20 rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 animate-scale-in max-h-[90vh] overflow-y-auto"
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
