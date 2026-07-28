'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import type { PlayerCardData, Tier } from '@/types/player';
import { Sparkles, Trophy, Zap, RefreshCw, Layers, Clock } from 'lucide-react';

// Fallback pool of players in case database is empty or loading
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

const PACKS_CONFIG = [
  {
    id: 'pack_icons',
    name: 'ICON Legends Pack',
    description: 'Guarantees at least 1 legendary ICON with elite-level support.',
    cost: 50,
    emoji: '👑',
    gradient: 'from-lime/30 via-deep-olive/40 to-background',
    border: 'border-lime/40 hover:border-lime',
    glow: 'shadow-lime/10 hover:shadow-lime/20',
  },
  {
    id: 'pack_attackers',
    name: 'Versatile Attackers Pack',
    description: 'Packed with high-octane Wingers, Strikers, and attacking Midfielders.',
    cost: 30,
    emoji: '⚡',
    gradient: 'from-purple-500/20 via-purple-950/20 to-background',
    border: 'border-purple-500/30 hover:border-purple-400',
    glow: 'shadow-purple-500/5 hover:shadow-purple-500/10',
  },
  {
    id: 'pack_jumbo',
    name: 'All-Star Jumbo Pack',
    description: 'Bulk card pool containing mixed tiers from Bronze up to Master.',
    cost: 20,
    emoji: '📦',
    gradient: 'from-blue-500/20 via-blue-950/20 to-background',
    border: 'border-blue-500/30 hover:border-blue-400',
    glow: 'shadow-blue-500/5 hover:shadow-blue-500/10',
  },
];

// Seeded pseudo-random number generator
function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Deterministic shuffle using a numeric seed
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
  const [coins, setCoins] = useState<number>(200);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('ALL');

  // Load players from database, resolving clubId and nationId into readable names
  const activePool = useMemo<PlayerCardData[]>(() => {
    if (!dbPlayers || dbPlayers.length === 0) return FALLBACK_POOL;

    const clubMap = new Map((dbClubs || []).map((c) => [c._id, c.name]));
    const nationMap = new Map((dbNations || []).map((n) => [n._id, n.name]));

    return dbPlayers.map((p) => ({
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

  // Determine current 15-minute block index (determines the pool rotation seed)
  const [timeBlock, setTimeBlock] = useState<number>(() => Math.floor(Date.now() / (15 * 60 * 1000)));

  // Countdown timer in seconds to next 15-minute block
  const nextRotationTime = (timeBlock + 1) * 15 * 60 * 1000;
  const [secondsLeft, setSecondsLeft] = useState<number>(() => Math.max(0, Math.ceil((nextRotationTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const currentBlock = Math.floor(Date.now() / (15 * 60 * 1000));
      if (currentBlock !== timeBlock) {
        setTimeBlock(currentBlock);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [timeBlock]);

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

  // Rotate available player catalog pool based on the 15-min seed!
  const rotatedCatalogPlayers = useMemo(() => {
    const shuffled = shuffleWithSeed(activePool, timeBlock);
    return shuffled.slice(0, 10); // Display 10 random players in this 15-minute block
  }, [activePool, timeBlock]);

  const handleOpenPack = (packId: string, cost: number) => {
    if (coins < cost || isOpening) return;

    setIsOpening(true);
    setActivePackId(packId);
    setCoins((prev) => prev - cost);

    // Simulate pack opening animation delay
    setTimeout(() => {
      let filteredPool = activePool;

      if (packId === 'pack_icons') {
        const icons = activePool.filter((p) => p.tier === 'ICON');
        const rest = activePool.filter((p) => p.tier !== 'ICON');
        const pickedIcons = [...icons].sort(() => 0.5 - Math.random()).slice(0, 2);
        const pickedRest = [...rest].sort(() => 0.5 - Math.random()).slice(0, 1);
        filteredPool = [...pickedIcons, ...pickedRest];
      } else if (packId === 'pack_attackers') {
        filteredPool = activePool.filter(
          (p) => p.position === 'ST' || p.position === 'LW' || p.position === 'RW' || p.position === 'CAM'
        );
      } else {
        filteredPool = activePool.filter((p) => p.tier !== 'ICON');
      }

      // Draw 3 random cards from the filtered pool
      const draw = [...filteredPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((p, idx) => ({ ...p, id: `drawn-${Date.now()}-${idx}` }));

      setOpenedCards(draw);
      setIsOpening(false);
    }, 1200);
  };

  const resetOpened = () => {
    setOpenedCards([]);
    setActivePackId(null);
  };

  const filteredViewPlayers = filterTier === 'ALL'
    ? rotatedCatalogPlayers
    : rotatedCatalogPlayers.filter((player: PlayerCardData) => player.tier === filterTier);

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader
          title="Player Packs"
          subtitle="Acquire legendary and star footballers to reinforce your squad."
        />

        {/* Token Balance Card */}
        <div className="flex items-center gap-3 bg-card border border-border px-5 py-3 rounded-2xl self-start md:self-auto shadow-lg">
          <Layers className="h-5 w-5 text-lime animate-pulse" />
          <div>
            <p className="text-[10px] text-steel font-black uppercase tracking-wider">Club Tokens</p>
            <p className="text-xl font-stats text-lime">{coins} Tokens</p>
          </div>
          <button
            onClick={() => setCoins(200)}
            title="Refill Tokens"
            className="ml-3 p-1.5 rounded-lg bg-white/5 hover:bg-lime/10 text-steel hover:text-lime transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Pack Opening Arena */}
      <div className="relative w-full rounded-3xl border border-border bg-card p-6 md:p-8 overflow-hidden">
        {/* Abstract background graphics matching stadium vibes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-lime/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-deep-olive/10 blur-[80px] rounded-full pointer-events-none" />

        {openedCards.length === 0 ? (
          <div className="relative z-10 space-y-8">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime/10 text-lime text-xs font-black rounded-full uppercase border border-lime/20">
                <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
                Live Pack Simulator
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">Select a pack to open</h2>
              <p className="text-sm text-steel">Test your luck to pull top-rated ICONs and Master league players.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {PACKS_CONFIG.map((pack) => (
                <div
                  key={pack.id}
                  className={`group relative rounded-3xl border bg-gradient-to-b ${pack.gradient} ${pack.border} p-6 flex flex-col items-center justify-between text-center gap-6 shadow-xl ${pack.glow} transition-all duration-300 hover:-translate-y-1.5`}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110">
                      {pack.emoji}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-black text-white">{pack.name}</h3>
                      <p className="text-xs text-steel leading-relaxed">{pack.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenPack(pack.id, pack.cost)}
                    disabled={coins < pack.cost || isOpening}
                    className="w-full py-3 bg-lime hover:bg-vivid text-background font-black text-xs rounded-xl shadow-lg shadow-lime/10 hover:shadow-lime/20 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-lime flex items-center justify-center gap-1"
                  >
                    <span>Open Pack</span>
                    <span className="opacity-50">•</span>
                    <span className="font-stats text-[11px]">{pack.cost} TKN</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Cards Reveal screen */
          <div className="relative z-10 flex flex-col items-center gap-8 py-8 animate-scale-in">
            <div className="text-center space-y-1">
              <span className="text-xs text-lime font-black uppercase tracking-widest">Congratulations</span>
              <h2 className="text-2xl font-black text-white">Pack Opened Successfully</h2>
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
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Open Another Pack
            </button>
          </div>
        )}

        {/* Loading Spinner overlay for opening animation */}
        {isOpening && (
          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-lime/20 border-t-lime animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-lime text-xs font-stats">
                TKN
              </div>
            </div>
            <p className="text-xs text-lime font-black tracking-widest animate-pulse">TEARING PACK OPEN...</p>
          </div>
        )}
      </div>

      {/* Database catalog section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-lime" />
              <h3 className="text-lg font-black text-white">Current Player Pool</h3>
            </div>

            {/* Live dynamic rotation badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime text-[11px] font-stats">
              <Clock className="h-3.5 w-3.5" />
              <span>ROUNDS ROTATE IN {formattedCountdown}</span>
            </div>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ICON', 'MASTER', 'ELITE_PLUS', 'ELITE'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                  filterTier === tier
                    ? 'bg-lime text-background border-lime shadow-md shadow-lime/10'
                    : 'bg-card border-border text-steel hover:text-white hover:border-steel/30'
                }`}
              >
                {tier.replace('_', '+')}
              </button>
            ))}
          </div>
        </div>

        {/* View Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredViewPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
