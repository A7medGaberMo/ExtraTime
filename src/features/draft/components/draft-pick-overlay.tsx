'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerCard } from '@/components/shared/player-card';
import { AppIcon } from '@/components/ui/app-icon';
import { Crown, Lightning, ArrowsDownUp } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import type { EnrichedPlayerCard, EnrichedStarterSlot } from '../types/draft';
import type { PlayerCardData, Tier } from '@/types/player';
import type { DraftChallenge } from '../lib/challenges';
import { cardMatchesChallenge } from './draft-challenge-hud';

interface DraftPickOverlayProps {
  candidates: EnrichedPlayerCard[];
  slotIndex: number;
  targetPosition: string;
  isCaptainRound: boolean;
  onPick: (playerId: string) => void;
  disabled?: boolean;
  activeChallenge?: DraftChallenge | null;
  starters?: EnrichedStarterSlot[];
}

function getCardSynergy(card: EnrichedPlayerCard, starters: EnrichedStarterSlot[] = []) {
  const draftedStarters = starters.filter((s) => !!s.player && s.player.name);
  if (draftedStarters.length === 0) return { totalPoints: 0, badgeLabel: null };

  let clubMatches = 0;
  let nationMatches = 0;
  let leagueMatches = 0;
  let matchedClub = '';
  let matchedNation = '';

  for (const s of draftedStarters) {
    const p = s.player!;
    if (p.clubName && card.clubName && p.clubName.toLowerCase() === card.clubName.toLowerCase()) {
      clubMatches++;
      matchedClub = p.clubName;
    }
    if (p.nationName && card.nationName && p.nationName.toLowerCase() === card.nationName.toLowerCase()) {
      nationMatches++;
      matchedNation = p.nationName;
    }
    if (p.league && card.league && p.league.toLowerCase() === card.league.toLowerCase()) {
      leagueMatches++;
    }
  }

  const totalPoints = clubMatches * 3 + nationMatches * 2 + leagueMatches;
  let badgeLabel: string | null = null;
  if (clubMatches > 0 && nationMatches > 0) {
    badgeLabel = `${matchedClub} · ${matchedNation}`;
  } else if (clubMatches > 0) {
    badgeLabel = matchedClub;
  } else if (nationMatches > 0) {
    badgeLabel = matchedNation;
  } else if (leagueMatches > 0 && card.league) {
    badgeLabel = card.league;
  }

  return { totalPoints, badgeLabel };
}

export function DraftPickOverlay({
  candidates,
  slotIndex,
  targetPosition,
  isCaptainRound,
  onPick,
  disabled = false,
  activeChallenge,
  starters = [],
}: DraftPickOverlayProps) {
  const { t, isRTL } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!candidates || candidates.length === 0) return null;

  const handleSelect = (playerId: string) => {
    if (disabled) return;
    setSelectedId(playerId);
    sfx.cardDeal();
    sfx.tierReveal();
    onPick(playerId);
  };

  const isSuperSub = slotIndex >= 11;

  return (
    <section
      aria-label="Draft Pick Selection"
      className="apple-glass-elevated relative w-full rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_24px_60px_rgba(0,0,0,0.8)] shrink-0 border border-white/20 backdrop-blur-3xl overflow-hidden"
    >
      {/* Ambient Keynote Specular Mesh Glow for Captain Round */}
      {isCaptainRound && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.22),transparent_70%)]"
        />
      )}

      {/* Apple Dynamic Island Header Banner - Clean, Minimal & Tag-Free */}
      <div className="flex items-center justify-between gap-2 px-1 mb-1.5 sm:mb-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span
            className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-xl border shrink-0 transition-transform shadow-md ${
              isCaptainRound
                ? 'border-amber-400/70 bg-gradient-to-br from-amber-400/35 via-yellow-400/25 to-amber-600/35 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                : isSuperSub
                  ? 'border-purple-400/60 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.4)]'
                  : 'border-cyan-400/60 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 text-cyan-300 shadow-[0_0_16px_rgba(0,240,255,0.4)]'
            }`}
          >
            <AppIcon
              icon={isCaptainRound ? Crown : isSuperSub ? ArrowsDownUp : Lightning}
              size={16}
              weight={isSuperSub ? 'bold' : 'fill'}
            />
          </span>

          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-display text-xs sm:text-sm md:text-base font-black text-white tracking-wide truncate">
              {isCaptainRound
                ? t('draft.captainRound')
                : isSuperSub
                  ? t('draft.superSub', { num: (slotIndex - 10).toString() })
                  : t('draft.pickSlot', { current: (slotIndex + 1).toString(), pos: targetPosition })}
            </span>

            <span className="text-[9px] sm:text-[10.5px] text-slate-400 font-medium truncate">
              {isCaptainRound
                ? (isRTL ? 'اختر قائد الفريق لتحديد كيمياء التشكيلة' : 'Select talisman to lead squad & build chemistry')
                : isSuperSub
                  ? (isRTL ? 'اختر بديلاً ذهبياً لدكة البدلاء' : 'Select depth option for your tactical bench')
                  : (isRTL ? `اختر اللاعب المناسب لمركز ${targetPosition}` : `Select starter for ${targetPosition} slot`)}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Cards in ONE Harmonious Centered Row with Optical Uniform Spacing & Zero Noise Above */}
      <div className="flex flex-row items-center justify-center gap-1 min-[360px]:gap-1.5 sm:gap-3.5 md:gap-4 lg:gap-5 w-full max-w-5xl mx-auto overflow-x-auto scrollbar-none py-1.5 sm:py-2 px-0.5 sm:px-1">
        {candidates.map((card, idx) => {
          const isSelected = selectedId === card.id;

          const cardPositions = (card.position || '').split('/').map((p) => p.trim().toUpperCase());
          const matchingPosition =
            targetPosition && cardPositions.includes(targetPosition.trim().toUpperCase())
              ? targetPosition.trim().toUpperCase()
              : card.position;

          const cardData: PlayerCardData = {
            id: card.id,
            name: card.name,
            tier: card.tier as Tier,
            position: matchingPosition,
            club: card.clubName,
            nation: card.nationName,
            rating: card.rating,
            imageUrl: card.imageUrl,
            isLegend: card.isLegend,
          };

          const challengeMatch = cardMatchesChallenge(
            { clubName: card.clubName, nationName: card.nationName, league: card.league },
            activeChallenge,
          );

          const synergy = getCardSynergy(card, starters);
          const hasSynergy = synergy.totalPoints > 0;

          return (
            <motion.div
              key={card.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Draft candidate ${card.name}, ${card.position}, rating ${card.rating}`}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSelect(card.id);
                }
              }}
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.03, type: 'spring', stiffness: 440, damping: 28 }}
              whileHover={disabled ? undefined : { scale: 1.05, y: -4 }}
              whileTap={disabled ? undefined : { scale: 0.95 }}
              onClick={() => handleSelect(card.id)}
              className={`group btn-haptic relative cursor-pointer transition-all flex flex-col items-center select-none outline-none shrink-0 ${
                isCaptainRound ? 'focus-visible:ring-amber-400' : 'focus-visible:ring-cyan-400'
              }`}
            >
              {/* Player Card (Clean & uncluttered with NO floating tags above) */}
              <div
                className={`relative rounded-xl transition-all duration-200 ${
                  isSelected
                    ? isCaptainRound
                      ? 'ring-2 ring-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.95)] scale-105 z-20'
                      : 'ring-2 ring-cyan-400 shadow-[0_0_28px_rgba(0,240,255,0.95)] scale-105 z-20'
                    : isCaptainRound
                      ? 'ring-1.5 ring-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.4)] group-hover:ring-2 group-hover:ring-amber-300 group-hover:shadow-[0_0_26px_rgba(245,158,11,0.7)]'
                      : challengeMatch
                        ? 'ring-1.5 ring-emerald-400/90 shadow-[0_0_18px_rgba(52,211,153,0.55)] group-hover:ring-2 group-hover:ring-emerald-300 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.75)]'
                        : hasSynergy
                          ? 'ring-1.5 ring-cyan-400/70 shadow-[0_0_14px_rgba(0,240,255,0.4)] group-hover:ring-2 group-hover:ring-cyan-300 group-hover:shadow-[0_0_22px_rgba(0,240,255,0.65)]'
                          : 'group-hover:ring-1.5 group-hover:ring-white/50 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                }`}
              >
                <PlayerCard player={cardData} size="draft" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

