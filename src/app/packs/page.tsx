'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import { PageHeader } from '@/components/shared/page-header';
import { PlayerCard } from '@/components/shared/player-card';
import { TierBadge } from '@/components/shared/tier-badge';
import { sfx } from '@/lib/sfx';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import type { PlayerCardData, Tier } from '@/types/player';

type PackDef = {
  id: string;
  name: string;
  note: string;
  cardCount: number;
  tiers: Tier[];
  guaranteed: Tier[];
};

const PACKS: PackDef[] = [
  {
    id: 'heritage',
    name: 'Heritage Case',
    note: 'Icon and Hero-led premium pulls.',
    cardCount: 4,
    tiers: ['ICON', 'HERO', 'ULTIMATE', 'MASTER'],
    guaranteed: ['ICON', 'HERO'],
  },
  {
    id: 'signature',
    name: 'Signature Case',
    note: 'Top active and legacy materials.',
    cardCount: 4,
    tiers: ['ULTIMATE', 'MASTER', 'ELITE', 'GOLD'],
    guaranteed: ['ULTIMATE', 'MASTER'],
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse Case',
    note: 'Balanced squad depth across tiers.',
    cardCount: 5,
    tiers: TIER_ORDER,
    guaranteed: ['ELITE', 'GOLD'],
  },
];

const ROTATION_MS = 10 * 60 * 1000;

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

function pickCards(pack: PackDef, players: PlayerCardData[]): PlayerCardData[] {
  const seed = Date.now() + pack.id.length * 1009;
  const guaranteed = seededShuffle(players.filter((player) => pack.guaranteed.includes(player.tier)), seed);
  const eligible = seededShuffle(players.filter((player) => pack.tiers.includes(player.tier)), seed + 17);
  const fallback = seededShuffle(players, seed + 31);
  const selected: PlayerCardData[] = [];
  const used = new Set<string>();

  for (const player of guaranteed) {
    if (selected.length >= Math.min(2, pack.cardCount)) break;
    selected.push(player);
    used.add(player.id);
  }

  for (const pool of [eligible, fallback]) {
    for (const player of pool) {
      if (selected.length >= pack.cardCount) return selected;
      if (used.has(player.id)) continue;
      selected.push(player);
      used.add(player.id);
    }
  }

  return selected;
}

function formatRemaining(ms: number): string {
  return `${Math.max(1, Math.ceil(ms / 60000))}m`;
}

export default function PacksPage() {
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 500 });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [activePack, setActivePack] = useState<PackDef | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const players = useMemo(() => {
    const loaded = rawData?.allLoaded ?? [];
    if (loaded.length > 0) return loaded.map(toPlayerCardData);

    const tierLoaded = TIER_ORDER.flatMap((tier) => rawData?.[tier] ?? []);
    return tierLoaded.map(toPlayerCardData);
  }, [rawData]);
  const rotationSlot = Math.floor(nowMs / ROTATION_MS);
  const remainingMs = ROTATION_MS - (nowMs % ROTATION_MS);

  const showcase = useMemo(() => {
    return seededShuffle(players, rotationSlot * 8191 + shuffleSeed * 4099).slice(0, 8);
  }, [players, rotationSlot, shuffleSeed]);

  function openPack(pack: PackDef) {
    sfx.unlock();
    sfx.save();
    setActivePack(pack);
    setOpenedCards(pickCards(pack, players));
  }

  function shuffleShowcase() {
    sfx.unlock();
    setShuffleSeed((value) => value + 1);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Packs" subtitle="Premium tier cards, quiet rotation, and all loaded players." backUrl="/" />

      <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-md sm:p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-steel">Cases</span>
            <span className="block text-xl font-black uppercase tracking-normal text-white">Pack Display</span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-steel">
            {players.length || rawData?.totalLoaded || 0} loaded players
          </span>
        </header>

        <article className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PACKS.map((pack) => {
            const style = getTierStyle(pack.guaranteed[0]);
            return (
              <button
                key={pack.id}
                onClick={() => openPack(pack)}
                disabled={players.length === 0}
                className="group min-h-40 rounded-xl border bg-slate-900/70 p-4 text-left shadow-xl transition duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: `${style.accent}45`, boxShadow: `0 16px 36px rgba(0,0,0,0.26), 0 0 16px ${style.glow}` }}
              >
                <span className="flex h-full flex-col justify-between gap-5">
                  <span className="space-y-3">
                    <span className="flex flex-wrap gap-1.5">
                      {pack.tiers.slice(0, 4).map((tier) => (
                        <TierBadge key={tier} tier={tier} className="px-2 py-0.5 text-[9px]" />
                      ))}
                    </span>
                    <span className="block">
                      <span className="block text-lg font-black uppercase tracking-normal text-white">{pack.name}</span>
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-steel">{pack.note}</span>
                    </span>
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-steel">{pack.cardCount} cards</span>
                    <span className="rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: style.highlight, borderColor: `${style.highlight}55` }}>
                      Open
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </article>

        {openedCards.length > 0 && activePack && (
          <article className="border-t border-white/10 pt-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-steel">Opened</span>
                <span className="block text-xl font-black uppercase tracking-normal text-white">{activePack.name}</span>
              </span>
              <span className="flex gap-2">
                <button onClick={() => openPack(activePack)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:border-white/30">
                  Again
                </button>
                <button onClick={() => setOpenedCards([])} className="rounded-lg border border-white/10 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-200">
                  Clear
                </button>
              </span>
            </header>
            <span className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-4 lg:grid-cols-5">
              {openedCards.map((player, index) => (
                <button key={`${player.id}-${index}`} onClick={() => setInspectedCard(player)} className="animate-scale-in transition active:scale-95" style={{ animationDelay: `${index * 45}ms` }}>
                  <PlayerCard player={player} size="sm" showTierLabelBelow />
                </button>
              ))}
            </span>
          </article>
        )}
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-steel">Showcase</span>
            <span className="block text-xl font-black uppercase tracking-normal text-white">Featured Rotation</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-steel">
              Changes in <span className="text-white" suppressHydrationWarning>{formatRemaining(remainingMs)}</span>
            </span>
            <button onClick={shuffleShowcase} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:border-white/30">
              Shuffle
            </button>
          </span>
        </header>

        {showcase.length > 0 ? (
          <article className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {showcase.map((player, index) => (
              <button key={player.id} onClick={() => setInspectedCard(player)} className="animate-scale-in transition active:scale-95" style={{ animationDelay: `${index * 35}ms` }}>
                <PlayerCard player={player} size="sm" showTierLabelBelow />
              </button>
            ))}
          </article>
        ) : (
          <article className="rounded-xl border border-white/10 bg-slate-950/75 p-10 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-steel">
              {rawData === undefined ? 'Loading players' : 'No players available'}
            </p>
          </article>
        )}
      </section>

      {inspectedCard && <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />}
    </main>
  );
}
