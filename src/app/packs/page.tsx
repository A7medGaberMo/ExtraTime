'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Lightning,
  MagnifyingGlass,
  Shuffle,
  X,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { TextInput } from '@/components/ui/text-input';
import { CardDetailModal } from '@/components/packs/card-detail-modal';
import { PlayerCard } from '@/components/shared/player-card';
import { TierBadge } from '@/components/shared/tier-badge';
import { sfx } from '@/lib/sfx';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import { useI18n } from '@/lib/i18n';
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

  for (const gTier of pack.guaranteed) {
    const tierPool = seededShuffle(
      allPlayers.filter((p) => p.tier === gTier && !used.has(p.id)),
      seed + selected.length * 19,
    );
    if (tierPool.length > 0) {
      selected.push(tierPool[0]);
      used.add(tierPool[0].id);
    }
  }

  const eligiblePool = seededShuffle(
    allPlayers.filter((p) => pack.eligibleTiers.includes(p.tier) && !used.has(p.id)),
    seed + 43,
  );

  for (const player of eligiblePool) {
    if (selected.length >= pack.cardCount) break;
    selected.push(player);
    used.add(player.id);
  }

  if (selected.length < pack.cardCount) {
    const fallbackPool = seededShuffle(
      allPlayers.filter((p) => !used.has(p.id)),
      seed + 97,
    );
    for (const player of fallbackPool) {
      if (selected.length >= pack.cardCount) break;
      selected.push(player);
      used.add(player.id);
    }
  }

  return seededShuffle(selected, seed + 101).slice(0, pack.cardCount);
}

export default function PacksPage() {
  const { t } = useI18n();
  const rawData = useQuery(api.packs.queries.getPackPools, { samplePerTier: 40 });
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const [activePack, setActivePack] = useState<PackDef | null>(null);
  const [openedCards, setOpenedCards] = useState<PlayerCardData[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<PlayerCardData | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const players = useMemo(() => {
    const loaded = rawData?.allLoaded ?? [];
    if (loaded.length > 0) return loaded.map(toPlayerCardData);

    const tierLoaded = TIER_ORDER.flatMap((tier) => rawData?.[tier] ?? []);
    return tierLoaded.map(toPlayerCardData);
  }, [rawData]);

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
            p.position.toLowerCase().includes(q),
        )
        .slice(0, 8);
    }

    const highTierPool = players.filter((p) =>
      ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE'].includes(p.tier),
    );
    const goldPool = players.filter((p) => p.tier === 'GOLD');

    const seed = 42 + shuffleSeed * 911;
    const shuffledHigh = seededShuffle(highTierPool, seed);
    const shuffledGold = seededShuffle(goldPool, seed + 17);

    const result: PlayerCardData[] = [];

    if (shuffledGold.length > 0) {
      result.push(shuffledGold[0]);
    }

    for (const player of shuffledHigh) {
      if (result.length >= 8) break;
      if (!result.some((p) => p.id === player.id)) {
        result.push(player);
      }
    }

    if (result.length < 8) {
      for (const p of shuffledHigh) {
        if (result.length >= 8) break;
        result.push(p);
      }
    }

    return seededShuffle(result, seed + 99);
  }, [players, searchQuery, shuffleSeed]);

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
    <PageShell
      title={t('packs.title')}
      subtitle={t('packs.subtitle')}
      backUrl="/"
      maxWidth="5xl"
    >
      {/* ── 1. PACK CASES GRID ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {PACKS.map((pack) => {
            const style = getTierStyle(pack.featuredTier);
            const isSelected = activePack?.id === pack.id && openedCards.length > 0;

            return (
              <Panel
                key={pack.id}
                variant={isSelected ? 'highlight' : 'default'}
                className={`p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-1 ${
                  isSelected ? 'border-lime ring-2 ring-lime/50' : ''
                }`}
                style={{
                  borderColor: `${style.accent}50`,
                  boxShadow: `0 14px 28px rgba(0,0,0,0.4), 0 0 16px ${style.glow}`,
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-steel text-[10px] font-black tracking-wider uppercase font-stats">
                      {t('packs.cardsCount', { count: pack.cardCount })}
                    </span>
                    <div className="flex gap-1">
                      {pack.guaranteed.map((tier) => (
                        <TierBadge key={tier} tier={tier} className="px-1.5 py-0.5 text-[8px]" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase font-display">
                      {pack.name}
                    </h3>
                    <p className="text-steel text-xs font-medium leading-relaxed mt-0.5">
                      {pack.note}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => handleOpenPack(pack)}
                  disabled={players.length === 0 || isOpening}
                  leftIcon={<AppIcon icon={Lightning} size={16} weight="fill" />}
                >
                  {t('packs.openCase')}
                </Button>
              </Panel>
            );
          })}
        </div>

        {/* ── OPENED PACK RESULTS ─────────────────────────────────────── */}
        {openedCards.length > 0 && activePack && (
          <Panel variant="highlight" className="p-4 sm:p-6 space-y-4 animate-scale-in">
            <header className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-lime block text-[9px] font-black tracking-widest uppercase">
                  {t('packs.openedCase')}
                </span>
                <h4 className="text-lg font-black tracking-tight text-white uppercase font-display">
                  {activePack.name} ({openedCards.length} {t('common.rounds')})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenPack(activePack)}
                  leftIcon={<AppIcon icon={ArrowCounterClockwise} size={14} weight="bold" className="text-lime" />}
                >
                  {t('packs.again')}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenedCards([]);
                    setActivePack(null);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear"
                >
                  <AppIcon icon={X} size={16} weight="bold" />
                </button>
              </div>
            </header>

            {/* 5-Card Grid on Desktop */}
            <div className="grid grid-cols-2 justify-items-center gap-3 pt-1 sm:grid-cols-5">
              {openedCards.map((player, index) => (
                <button
                  key={`opened-${player.id}-${index}`}
                  type="button"
                  onClick={() => {
                    sfx.cardDeal();
                    setInspectedCard(player);
                  }}
                  className="animate-scale-in cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <PlayerCard player={player} size="sm" showTierLabelBelow />
                </button>
              ))}
            </div>
          </Panel>
        )}
      </section>

      {/* ── 2. FEATURED 8-CARD SHOWCASE ──────────────────────────────── */}
      <section className="space-y-4 pt-2">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-display">
              {t('packs.featuredCards')}
            </h3>
            <span className="text-steel font-mono text-[10px] uppercase">
              {t('packs.goldPlusCurated')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-44 sm:w-60">
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('packs.searchPlaceholder')}
                leftIcon={<AppIcon icon={MagnifyingGlass} size={16} weight="bold" />}
                rightAction={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-steel hover:text-white p-1"
                    >
                      <AppIcon icon={X} size={14} weight="bold" />
                    </button>
                  ) : undefined
                }
              />
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleShuffle}
              leftIcon={<AppIcon icon={Shuffle} size={16} weight="bold" className="text-lime" />}
            >
              {t('packs.shuffle')}
            </Button>
          </div>
        </header>

        {showcaseCards.length > 0 ? (
          <div className="grid grid-cols-2 justify-items-center gap-3 pt-1 sm:grid-cols-4 xl:grid-cols-8">
            {showcaseCards.map((player, index) => (
              <button
                key={`showcase-${player.id}-${index}`}
                type="button"
                onClick={() => {
                  sfx.cardDeal();
                  setInspectedCard(player);
                }}
                className="animate-scale-in cursor-pointer transition-transform hover:scale-105 active:scale-95"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <PlayerCard player={player} size="sm" showTierLabelBelow />
              </button>
            ))}
          </div>
        ) : (
          <Panel variant="subtle" className="p-8 text-center">
            <p className="text-steel text-xs font-black tracking-widest uppercase">
              {rawData === undefined ? t('packs.loadingCards') : t('packs.noCards')}
            </p>
          </Panel>
        )}
      </section>

      {/* ── 3. CARD DETAIL INSPECTION MODAL ──────────────────────────── */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          cardsList={openedCards.length > 0 ? openedCards : showcaseCards}
          onSelectCard={(c) => setInspectedCard(c)}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </PageShell>
  );
}
