'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import type { PlayerCardData, Tier } from '@/types/player';
import { Sparkles, Trophy, Zap, RefreshCw, Layers, Clock, Crown, Shield, Star, Package, Flame } from 'lucide-react';

// Fallback pool of players if DB is loading
const FALLBACK_POOL: PlayerCardData[] = [
  { id: 'p1', name: 'Zinédine Zidane', tier: 'ICON', position: 'CAM', club: 'Real Madrid', nation: 'France', kitNumber: 10, isLegend: true },
  { id: 'p2', name: 'Ronaldo Nazário', tier: 'ICON', position: 'ST', club: 'Real Madrid', nation: 'Brazil', kitNumber: 9, isLegend: true },
  { id: 'p3', name: 'Paolo Maldini', tier: 'ICON', position: 'CB', club: 'AC Milan', nation: 'Italy', kitNumber: 3, isLegend: true },
  { id: 'p4', name: 'Lev Yashin', tier: 'ICON', position: 'GK', club: 'Dynamo Moscow', nation: 'Russia', kitNumber: 1, isLegend: true },
  { id: 'p5', name: 'Ronaldinho', tier: 'ICON', position: 'LW', club: 'Barcelona', nation: 'Brazil', kitNumber: 10, isLegend: true },
  { id: 'p6', name: 'Kevin De Bruyne', tier: 'MASTER', position: 'CM', club: 'Man City', nation: 'Belgium', kitNumber: 17 },
  { id: 'p7', name: 'Erling Haaland', tier: 'MASTER', position: 'ST', club: 'Man City', nation: 'Norway', kitNumber: 9 },
  { id: 'p8', name: 'Kylian Mbappé', tier: 'MASTER', position: 'ST', club: 'Real Madrid', nation: 'France', kitNumber: 9 },
  { id: 'p9', name: 'Virgil van Dijk', tier: 'MASTER', position: 'CB', club: 'Liverpool', nation: 'Netherlands', kitNumber: 4 },
  { id: 'p10', name: 'Jude Bellingham', tier: 'ELITE_PLUS', position: 'CAM', club: 'Real Madrid', nation: 'England', kitNumber: 5 },
  { id: 'p11', name: 'Bukayo Saka', tier: 'ELITE_PLUS', position: 'RW', club: 'Arsenal', nation: 'England', kitNumber: 7 },
  { id: 'p12', name: 'Rodri', tier: 'MASTER', position: 'CDM', club: 'Man City', nation: 'Spain', kitNumber: 16 },
  { id: 'p13', name: 'Mohamed Salah', tier: 'ELITE_PLUS', position: 'RW', club: 'Liverpool', nation: 'Egypt', kitNumber: 11 },
];

export interface TierPackConfig {
  id: string;
  tier: Tier | 'ALL';
  name: string;
  badgeLabel: string;
  description: string;
  cost: number;
  icon: any;
  accentColor: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
}

const ALL_PACKS_CONFIG: TierPackConfig[] = [
  {
    id: 'pack_icon',
    tier: 'ICON',
    name: 'ICON Legends Pack',
    badgeLabel: '👑 LEGENDARY ICON',
    description: 'Guaranteed legendary ICON cards with peak stats and aura.',
    cost: 50,
    icon: Crown,
    accentColor: '#95E810',
    gradient: 'from-lime/30 via-deep-olive/40 to-card',
    borderColor: 'border-lime/60 hover:border-lime shadow-[0_0_20px_rgba(149,232,16,0.2)]',
    glowColor: 'shadow-lime/30',
  },
  {
    id: 'pack_master',
    tier: 'MASTER',
    name: 'Master Class Pack',
    badgeLabel: '🔮 MASTER CLASS',
    description: 'Elite World-Class superstars with peak performance stats.',
    cost: 40,
    icon: Star,
    accentColor: '#A855F7',
    gradient: 'from-purple-600/30 via-purple-950/40 to-card',
    borderColor: 'border-purple-500/60 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    glowColor: 'shadow-purple-500/30',
  },
  {
    id: 'pack_elite_plus',
    tier: 'ELITE_PLUS',
    name: 'Elite Plus Pack',
    badgeLabel: '⚡ ELITE+ STAR',
    description: 'High-octane international stars & key team playmakers.',
    cost: 30,
    icon: Zap,
    accentColor: '#3B82F6',
    gradient: 'from-blue-600/30 via-blue-950/40 to-card',
    borderColor: 'border-blue-500/60 hover:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    glowColor: 'shadow-blue-500/30',
  },
  {
    id: 'pack_elite',
    tier: 'ELITE',
    name: 'Elite Squad Pack',
    badgeLabel: '💎 ELITE SQUAD',
    description: 'Solid top-tier league starters and tactical anchors.',
    cost: 25,
    icon: Sparkles,
    accentColor: '#10B981',
    gradient: 'from-emerald-600/30 via-emerald-950/40 to-card',
    borderColor: 'border-emerald-500/60 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    glowColor: 'shadow-emerald-500/30',
  },
  {
    id: 'pack_gold',
    tier: 'GOLD',
    name: 'Gold Choice Pack',
    badgeLabel: '🌟 GOLD CHOICE',
    description: 'Versatile gold tier squad players with great overall value.',
    cost: 20,
    icon: Flame,
    accentColor: '#F59E0B',
    gradient: 'from-amber-500/30 via-amber-950/40 to-card',
    borderColor: 'border-amber-500/60 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    glowColor: 'shadow-amber-500/30',
  },
  {
    id: 'pack_silver',
    tier: 'SILVER',
    name: 'Silver Pro Pack',
    badgeLabel: '🛡️ SILVER PRO',
    description: 'Emerging pros and reliable defensive backups.',
    cost: 15,
    icon: Shield,
    accentColor: '#94A3B8',
    gradient: 'from-slate-400/30 via-slate-900 to-card',
    borderColor: 'border-slate-400/60 hover:border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    glowColor: 'shadow-slate-400/30',
  },
  {
    id: 'pack_bronze',
    tier: 'BRONZE',
    name: 'Bronze Talent Pack',
    badgeLabel: '🥉 BRONZE TALENT',
    description: 'Budget talent and squad depth for starter managers.',
    cost: 10,
    icon: Package,
    accentColor: '#D97706',
    gradient: 'from-amber-700/30 via-amber-950/40 to-card',
    borderColor: 'border-amber-700/60 hover:border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.15)]',
    glowColor: 'shadow-amber-700/30',
  },
  {
    id: 'pack_jumbo',
    tier: 'ALL',
    name: 'All-Star Jumbo Pack',
    badgeLabel: '📦 ALL-STAR JUMBO',
    description: 'Bulk card pool containing mixed tiers from Bronze up to ICON.',
    cost: 35,
    icon: Trophy,
    accentColor: '#EC4899',
    gradient: 'from-pink-600/30 via-purple-950/40 to-card',
    borderColor: 'border-pink-500/60 hover:border-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.25)]',
    glowColor: 'shadow-pink-500/30',
  },
];

// Seeded pseudo-random generator
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
  const [filterTier, setFilterTier] = useState<string>('ALL');

  // Load players from database, resolving clubId and nationId into readable names
  const activePool = useMemo<PlayerCardData[]>(() => {
    if (!dbPlayers || dbPlayers.length === 0) return FALLBACK_POOL;

    const clubMap = new Map((dbClubs || []).map((c) => [c._id, c.name]));
    const nationMap = new Map((dbNations || []).map((n) => [n._id, n.name]));

    return dbPlayers.map((p: any) => ({
      id: p._id,
      name: p.name,
      tier: p.tier as Tier,
      position: p.position,
      club: clubMap.get(p.clubId) || 'Club',
      nation: nationMap.get(p.nationId) || 'Nation',
      imageUrl: p.imageUrl,
      isLegend: p.isLegend,
      kitNumber: p.kitNumber,
    }));
  }, [dbPlayers, dbClubs, dbNations]);

  // Real-time player counts per tier directly from Database!
  const dbTierCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ICON: 0, MASTER: 0, ELITE_PLUS: 0, ELITE: 0, GOLD: 0, SILVER: 0, BRONZE: 0, ALL: activePool.length
    };
    for (const player of activePool) {
      if (counts[player.tier] !== undefined) counts[player.tier]++;
    }
    return counts;
  }, [activePool]);

  // 15-minute rotation seed
  const [timeBlock, setTimeBlock] = useState<number>(() => Math.floor(Date.now() / (15 * 60 * 1000)));
  const nextRotationTime = (timeBlock + 1) * 15 * 60 * 1000;
  const [secondsLeft, setSecondsLeft] = useState<number>(() => Math.max(0, Math.ceil((nextRotationTime - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextRotationTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [nextRotationTime]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  // Rotated catalog pool (10 players per rotation block)
  const rotatedCatalogPlayers = useMemo(() => {
    const shuffled = shuffleWithSeed(activePool, timeBlock);
    return shuffled.slice(0, 12);
  }, [activePool, timeBlock]);

  /* Pack Opening Handler */
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
        // Fallback supplement if DB has fewer than 3 players in this exact tier
        if (filteredPool.length < 3) {
          filteredPool = [...filteredPool, ...activePool.filter((p) => p.tier !== pack.tier)];
        }
      }

      // Draw 3 cards dynamically from DB pool
      const drawn = [...filteredPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((p, idx) => ({ ...p, id: `drawn-${Date.now()}-${idx}` }));

      setOpenedCards(drawn);
      setIsOpening(false);
    }, 1200);
  };

  const resetOpened = () => {
    setOpenedCards([]);
    setOpeningPack(null);
  };

  const filteredViewPlayers = filterTier === 'ALL'
    ? rotatedCatalogPlayers
    : rotatedCatalogPlayers.filter((player: PlayerCardData) => player.tier === filterTier);

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      {/* Top Header & Tokens Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader
          title="Authentic Tier Packs"
          subtitle="Dynamic card packs built directly from database tiers with unique signature colors & authentic designs."
        />

        {/* Club Tokens Balance */}
        <div className="flex items-center gap-3 bg-card border border-lime/30 px-5 py-3 rounded-2xl self-start md:self-auto shadow-xl shadow-lime/5">
          <Layers className="h-5 w-5 text-lime animate-pulse" />
          <div>
            <p className="text-[10px] text-steel font-black uppercase tracking-wider">Manager Tokens</p>
            <p className="text-xl font-stats text-lime">{coins} Tokens</p>
          </div>
          <button
            onClick={() => setCoins(300)}
            title="Refill Tokens"
            className="ml-3 p-2 rounded-xl bg-slate-900 hover:bg-lime/10 text-steel hover:text-lime transition-all border border-border"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div className="relative w-full rounded-3xl border border-border bg-card p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lime/5 blur-[140px] rounded-full pointer-events-none" />

        {openedCards.length === 0 ? (
          <div className="relative z-10 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime/10 text-lime text-xs font-black rounded-full uppercase border border-lime/30">
                <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
                Dynamic Database Packs
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Select An Authentic Pack</h2>
              <p className="text-xs text-steel">Every pack dynamically draws live players from the database pool matching its tier.</p>
            </div>

            {/* Grid of Authentic Tier Packs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              {ALL_PACKS_CONFIG.map((pack) => {
                const IconComp = pack.icon;
                const countInDb = dbTierCounts[pack.tier] ?? 0;

                return (
                  <div
                    key={pack.id}
                    className={`group relative rounded-3xl border bg-gradient-to-b ${pack.gradient} ${pack.borderColor} p-6 flex flex-col items-center justify-between text-center gap-6 shadow-xl transition-all duration-300 hover:-translate-y-2`}
                  >
                    {/* Badge top */}
                    <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm"
                        style={{
                          color: pack.accentColor,
                          backgroundColor: `${pack.accentColor}15`,
                          borderColor: `${pack.accentColor}40`,
                        }}
                      >
                        {pack.badgeLabel}
                      </span>
                      <span className="text-[10px] font-stats text-slate-300">
                        {countInDb} in DB
                      </span>
                    </div>

                    {/* Pack Box Graphics Icon */}
                    <div className="space-y-3 flex flex-col items-center">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2"
                        style={{
                          backgroundColor: `${pack.accentColor}10`,
                          borderColor: pack.accentColor,
                          boxShadow: `0 0 25px ${pack.accentColor}30`,
                        }}
                      >
                        <IconComp className="w-10 h-10" style={{ color: pack.accentColor }} />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-black text-white">{pack.name}</h3>
                        <p className="text-[11px] text-steel leading-relaxed">{pack.description}</p>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      onClick={() => handleOpenPack(pack)}
                      disabled={coins < pack.cost || isOpening}
                      className="w-full py-3 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: pack.accentColor,
                        color: pack.tier === 'ICON' ? '#02050A' : '#FFFFFF',
                      }}
                    >
                      <span>Open Pack</span>
                      <span className="opacity-50">•</span>
                      <span className="font-stats text-[11px]">{pack.cost} TKN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Cards Reveal Animation Arena */
          <div className="relative z-10 flex flex-col items-center gap-8 py-6 animate-scale-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-lime flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-lime animate-spin" /> Pack Opening Complete
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
                {openingPack?.name || 'Pack Reveal'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 py-4">
              {openedCards.map((player, idx) => (
                <div
                  key={player.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <PlayerCard player={player} size="md" />
                </div>
              ))}
            </div>

            <button
              onClick={resetOpened}
              className="px-8 py-3.5 bg-lime hover:bg-vivid text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-lime/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Open Another Pack
            </button>
          </div>
        )}

        {/* Loading Pack Reveal Animation Modal */}
        {isOpening && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center gap-5 animate-fade-in">
            <div className="relative animate-pack-open">
              <div
                className="w-24 h-24 rounded-3xl border-4 flex items-center justify-center shadow-2xl"
                style={{
                  borderColor: openingPack?.accentColor || '#95E810',
                  boxShadow: `0 0 50px ${openingPack?.accentColor || '#95E810'}`,
                }}
              >
                <Sparkles className="w-12 h-12 animate-spin text-white" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Opening {openingPack?.name}...</h3>
              <p className="text-xs text-lime font-black tracking-widest animate-pulse">PULLING PLAYERS FROM DATABASE...</p>
            </div>
          </div>
        )}
      </div>

      {/* Database Catalog Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-lime" />
              <h3 className="text-lg font-black text-white">Live Database Catalog</h3>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-lime/30 text-lime text-[11px] font-stats">
              <Clock className="h-3.5 w-3.5" />
              <span>ROUNDS ROTATE IN {formattedCountdown}</span>
            </div>
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'ICON', 'MASTER', 'ELITE_PLUS', 'ELITE', 'GOLD', 'SILVER', 'BRONZE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                  filterTier === t
                    ? 'bg-lime text-slate-950 border-lime shadow-md'
                    : 'bg-card border-border text-steel hover:text-white'
                }`}
              >
                {t.replace('_', '+')}
              </button>
            ))}
          </div>
        </div>

        {/* View Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredViewPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
