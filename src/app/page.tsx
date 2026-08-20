'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Trophy,
  Users,
  PlusCircle,
  Swords,
  Globe,
  Loader2,
  Flame,
  Star,
  Crown,
  UserCheck,
  X,
  RefreshCw,
  ArrowRight,
  Clock,
  Coins,
  Binoculars,
} from 'lucide-react';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';

const poolOptions = [
  { id: 'ACTIVE' as PoolMode, label: 'Active', icon: UserCheck, sub: 'Current stars' },
  { id: 'GLOBAL' as PoolMode, label: 'Global', icon: Globe, sub: 'All + Icons' },
  { id: 'EPL' as PoolMode, label: 'EPL', icon: Flame, sub: 'Prem only' },
  { id: 'TOP_TEAMS' as PoolMode, label: 'Top Clubs', icon: Star, sub: 'Big teams' },
  { id: 'ICONS' as PoolMode, label: 'Icons', icon: Crown, sub: 'Legends' },
];

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createGuest = useMutation(api.guests.mutations.create);
  const findMatch = useMutation(api.rooms.mutations.findOrCreatePublicMatch);
  const queueSummary = useQuery(api.rooms.queries.getPublicQueueSummary);
  const dbStats = useQuery(api.players.queries.getStats);

  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingMatchSize, setPendingMatchSize] = useState<5 | 11 | null>(null);
  const [nickname, setNickname] = useState(() => randomName());

  const waiting11 = queueSummary?.queues[poolMode]?.[11] ?? 0;
  const waiting5 = queueSummary?.queues[poolMode]?.[5] ?? 0;
  const playerCount = dbStats === undefined ? '...' : dbStats.totalPlayers.toLocaleString();

  function openNameModal(matchSize: 5 | 11) {
    const saved = localStorage.getItem('extratime_guestName');
    setNickname(saved || randomName());
    setPendingMatchSize(matchSize);
    setShowNameModal(true);
  }

  async function quickMatch() {
    if (loading || !pendingMatchSize || !nickname.trim()) return;
    setLoading(true);
    setShowNameModal(false);
    try {
      const userId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem('extratime_guestId', userId);
      localStorage.setItem('extratime_guestName', nickname.trim());
      const result = await findMatch({ userId, matchSize: pendingMatchSize, poolMode });
      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not start matchmaking', 'error');
      setLoading(false);
    }
  }

  return (
    <article className="animate-fade-in mx-auto flex max-w-5xl flex-col items-center gap-8 px-3 py-6 sm:px-6 md:py-10">
      {/* ── HERO HEADER ────────────────────────────────────────────────── */}
      <header className="relative w-full space-y-3.5 pt-2 text-center">
        {/* Ambient backdrop glow */}
        <div className="from-lime/15 pointer-events-none absolute top-1/2 left-1/2 h-[250px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-sky-500/15 to-amber-500/15 blur-[140px]" />

        <div className="animate-slide-up relative space-y-3">
          <div className="border-lime/40 text-lime inline-flex items-center gap-2 rounded-full border bg-slate-900/90 px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-xl backdrop-blur-md">
            <Trophy className="text-lime h-4 w-4 shrink-0" />
            <span>The Premier Football Strategy Arena</span>
          </div>

          <h1 className="text-5xl leading-none font-black tracking-tight text-white uppercase sm:text-7xl md:text-8xl">
            Extra<span className="gradient-text-lime">Time</span>
          </h1>

          <p className="text-steel mx-auto max-w-xl text-xs leading-relaxed font-medium sm:text-base">
            Outsmart rivals in <strong className="text-lime">Hidden Bid Auctions</strong>. Manage
            budget, unleash tactical Scout & Spy perks, and build your championship squad.
          </p>
        </div>
      </header>

      {/* ── FLAGSHIP HIDDEN BID AUCTION ARENA CARD ────────────────────────────── */}
      <section
        aria-label="Hidden Bid Arena"
        className="animate-slide-up w-full max-w-3xl delay-100"
        style={{ animationFillMode: 'both' }}
      >
        <div className="border-lime/50 group hover:border-lime relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 sm:p-8">
          <div className="bg-lime/20 group-hover:bg-lime/30 pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl transition-all" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-lime/15 text-lime border-lime/40 shadow-lime/10 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xl">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-lime text-[10px] font-black tracking-widest uppercase">
                    Multiplayer Strategy Arena
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
                    Hidden Bid Auction
                  </h2>
                </div>
              </div>
              <span className="bg-lime/20 border-lime/40 text-lime rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                Live Duel
              </span>
            </div>

            <p className="text-steel text-xs leading-relaxed font-medium sm:text-sm">
              Place secret bids against your rival in 30-second escalating auction rounds. The
              winning bid takes the star; the losing bid claims the hidden backup card!
            </p>

            {/* Core Tactical Rules Highlights */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-center sm:text-left">
                <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
                  <Clock className="text-lime h-3.5 w-3.5" />
                  <span className="text-lime text-[10px] font-black uppercase">30s Turns</span>
                </div>
                <p className="text-steel text-[10px] font-medium">Fast-paced live auctions</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-center sm:text-left">
                <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
                  <Binoculars className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-[10px] font-black text-sky-400 uppercase">Scout & Spy</span>
                </div>
                <p className="text-steel text-[10px] font-medium">Tactical intelligence perks</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-center sm:text-left">
                <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
                  <Coins className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-[10px] font-black text-amber-300 uppercase">
                    Budget Cap
                  </span>
                </div>
                <p className="text-steel text-[10px] font-medium">Strategic resource bidding</p>
              </div>
            </div>

            {/* Player Pool Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-steel text-[10px] font-black tracking-wider uppercase">
                  Select Player Pool
                </span>
                <span className="text-lime text-[10px] font-black uppercase">{poolMode}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {poolOptions.map((option) => {
                  const IconComp = option.icon;
                  const selected = poolMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPoolMode(option.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border px-1.5 py-2.5 text-center transition-all active:scale-95 ${
                        selected
                          ? 'border-lime bg-lime/20 shadow-lime/10 text-white shadow-lg'
                          : 'text-steel border-white/10 bg-slate-900/90 hover:text-white'
                      }`}
                    >
                      <IconComp
                        className={`mb-1 h-4 w-4 ${selected ? 'text-lime' : 'text-steel'}`}
                      />
                      <span className="w-full truncate text-[9px] font-black tracking-wider uppercase">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-6 sm:pt-8">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openNameModal(11)}
                disabled={loading}
                className="from-lime to-vivid hover:from-vivid hover:to-lime btn-haptic shadow-lime/25 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-4 text-xs font-black tracking-wider text-slate-950 uppercase shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <>
                    <span>11 vs 11 Arena</span>
                    {waiting11 > 0 && (
                      <span className="font-stats rounded-full bg-slate-950/30 px-1.5 py-0.5 text-[9px] text-slate-950">
                        {waiting11}
                      </span>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={() => openNameModal(5)}
                disabled={loading}
                className="border-lime/40 btn-haptic flex items-center justify-center gap-2 rounded-2xl border bg-slate-900 py-4 text-xs font-black tracking-wider text-white uppercase shadow-md transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <>
                    <span>5 vs 5 Quick Match</span>
                    {waiting5 > 0 && (
                      <span className="font-stats text-lime text-[9px]">{waiting5}</span>
                    )}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <Link
                href="/create-room"
                className="text-steel flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-colors hover:text-white"
              >
                <PlusCircle className="text-lime h-3.5 w-3.5" />
                <span>Create Custom Room</span>
              </Link>
              <Link
                href="/join-room"
                className="text-steel flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-colors hover:text-white"
              >
                <Users className="text-steel h-3.5 w-3.5" />
                <span>Join with Code</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC DATABASE STATS & PACKS SECTION ────────────────────────────────── */}
      <section
        aria-label="Stats and Tier Packs"
        className="animate-slide-up grid w-full max-w-3xl grid-cols-1 gap-4 delay-200 sm:grid-cols-2"
        style={{ animationFillMode: 'both' }}
      >
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-xl backdrop-blur-md">
          <div className="bg-lime/10 text-lime border-lime/30 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-steel text-[10px] font-black tracking-wider uppercase">
              Live Player Database
            </span>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-black text-white">
              <span className="text-lime font-stats text-lg">{playerCount}</span>
              <span className="text-steel text-xs font-normal">Active Stars & Icons</span>
            </p>
          </div>
        </div>

        <Link
          href="/packs"
          className="group flex items-center justify-between rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-xl backdrop-blur-md transition-all hover:border-amber-400"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 font-black text-slate-950 shadow-md shadow-amber-400/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-black tracking-wider text-amber-300 uppercase">
                Card Collection
              </span>
              <p className="mt-0.5 truncate text-sm font-black text-white transition-colors group-hover:text-amber-300">
                Explore Packs & Tier Stars
              </p>
            </div>
          </div>
          <ArrowRight className="ml-2 h-5 w-5 shrink-0 text-amber-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* ── NAME POPUP MODAL FOR AUCTION MATCHMAKING ───────────────────── */}
      {showNameModal && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          onClick={() => {
            if (!loading) setShowNameModal(false);
          }}
        >
          <div
            className="animate-scale-in relative w-full max-w-sm rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNameModal(false)}
              disabled={loading}
              className="text-steel hover:border-lime/40 absolute top-4 right-4 rounded-xl border border-white/10 bg-slate-950 p-1.5 transition-all hover:text-white disabled:opacity-30"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 space-y-1.5 text-center">
              <div className="text-lime bg-lime/10 border-lime/30 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                <Swords className="h-3 w-3" />
                <span>
                  {pendingMatchSize} vs {pendingMatchSize} Hidden Bid Arena
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">Enter the Arena</h3>
              <p className="text-steel text-xs font-medium">Choose your manager handle</p>
            </div>

            <div className="space-y-2">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase">
                Manager Name
              </label>
              <div className="flex gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={24}
                  disabled={loading}
                  className="placeholder:text-steel focus:border-lime/70 focus:ring-lime/20 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-base font-black text-white transition-all outline-none focus:ring-2 disabled:opacity-30"
                  placeholder="Your name"
                  autoFocus
                />
                <button
                  onClick={() => setNickname(randomName())}
                  disabled={loading}
                  className="text-steel hover:border-lime/50 hover:text-lime flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950 transition-all active:scale-95 disabled:opacity-30"
                  title="Randomize"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              onClick={quickMatch}
              disabled={loading || !nickname.trim()}
              className="from-lime to-vivid shadow-lime/20 hover:from-vivid hover:to-lime mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-4 text-xs font-black tracking-widest text-slate-950 uppercase shadow-xl transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> Finding Match...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4 shrink-0" /> Start Hidden Bid Auction
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
