'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretRight,
  CaretLeft,
  ArrowCounterClockwise,
  X,
  CornersOut,
  CornersIn,
  Crown,
  Cards,
  Flame,
  Play,
  Pause,
  SquaresFour,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerCard } from '@/components/shared/player-card';
import { CountryFlagBadge, ClubCrestBadge } from '@/components/shared/card-badges';
import { ETLogo } from '@/components/shared/et-logo';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import { getEffectiveRating } from '@/lib/rating-utils';
import { sfx } from '@/lib/sfx';
import { useI18n } from '@/lib/i18n';
import type { PlayerCardData, Tier } from '@/types/player';

export interface PackDefinition {
  id: string;
  name: string;
  subtitle: string;
  featuredTier: Tier;
  guaranteed: Tier[];
  eligibleTiers: Tier[];
  isPrestige?: boolean;
}

interface FifaPackOpeningProps {
  pack: PackDefinition;
  cards: PlayerCardData[];
  onClose: () => void;
  onOpenAgain: () => void;
  onInspectCard: (card: PlayerCardData) => void;
}

type Stage =
  | 'UNBOXING'
  | 'TEASE_NATION'
  | 'TEASE_POSITION'
  | 'TEASE_CLUB'
  | 'WALKOUT'
  | 'SLIDER'
  | 'OVERVIEW';

export function FifaPackOpening({
  pack,
  cards,
  onClose,
  onOpenAgain,
  onInspectCard,
}: FifaPackOpeningProps) {
  const { lang, t } = useI18n();
  const [stage, setStage] = useState<Stage>('UNBOXING');
  const [isCleanRecordMode, setIsCleanRecordMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Safely cleanup timers on unmount or close
  const handleSafeClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onClose();
  }, [onClose]);

  // Global ESC key listener for instant close/back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSafeClose]);

  // Find the highest rated / top tier walkout card
  const topCard = React.useMemo(() => {
    if (!cards || cards.length === 0) return null;
    const sorted = [...cards].sort((a, b) => {
      const tierRankA = TIER_ORDER.indexOf(a.tier);
      const tierRankB = TIER_ORDER.indexOf(b.tier);
      if (tierRankA !== tierRankB) return tierRankA - tierRankB;
      return getEffectiveRating(b) - getEffectiveRating(a);
    });
    return sorted[0];
  }, [cards]);

  const currentSliderCard = cards[activeCardIndex] || topCard || cards[0];
  const tierStyle = getTierStyle(
    stage === 'SLIDER' ? currentSliderCard?.tier : topCard?.tier || pack.featuredTier,
  );
  const topRating = topCard ? getEffectiveRating(topCard) : 80;
  const isWalkoutTier =
    topCard &&
    (topCard.tier === 'ICON' ||
      topCard.tier === 'HERO' ||
      topCard.tier === 'ULTIMATE' ||
      topCard.tier === 'MASTER' ||
      topCard.tier === 'ELITE' ||
      topRating >= 86);

  // Progressive Tease Sequence Controller
  useEffect(() => {
    sfx.packShake();

    timerRef.current = setTimeout(() => {
      sfx.packRip();
      if (isWalkoutTier) {
        setStage('TEASE_NATION');
        sfx.walkoutTease(1);
      } else {
        setStage('WALKOUT');
        sfx.tierReveal();
      }
    }, 850);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isWalkoutTier]);

  // Handle stage advances in Walkout Sequence
  useEffect(() => {
    if (stage === 'TEASE_NATION') {
      timerRef.current = setTimeout(() => {
        setStage('TEASE_POSITION');
        sfx.walkoutTease(2);
      }, 1400);
    } else if (stage === 'TEASE_POSITION') {
      timerRef.current = setTimeout(() => {
        setStage('TEASE_CLUB');
        sfx.walkoutTease(3);
      }, 1400);
    } else if (stage === 'TEASE_CLUB') {
      timerRef.current = setTimeout(() => {
        setStage('WALKOUT');
        if (isWalkoutTier) {
          sfx.walkout();
        } else {
          sfx.tierReveal();
        }
      }, 1600);
    }
  }, [stage, isWalkoutTier]);

  // Card-by-Card Auto-Slider Timer
  useEffect(() => {
    if (stage !== 'SLIDER' || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveCardIndex((prev) => {
        if (prev < cards.length - 1) {
          sfx.cardDeal();
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [stage, isAutoPlaying, cards.length]);

  const handleSkipToSlider = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sfx.cardDeal();
    setActiveCardIndex(0);
    setStage('SLIDER');
  };

  const handleWalkoutProceed = () => {
    sfx.cardDeal();
    setActiveCardIndex(0);
    setStage('SLIDER');
  };

  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      sfx.cardFlip();
      setActiveCardIndex((prev) => prev - 1);
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex < cards.length - 1) {
      sfx.cardFlip();
      setActiveCardIndex((prev) => prev + 1);
    }
  };

  const packDisplayName =
    lang === 'ar'
      ? pack.id === 'pantheon-pack'
        ? 'بانثيون النجوم 5★'
        : pack.id === 'icon-pack'
          ? 'ملوك الأيقونات'
          : 'أبطال النخبة'
      : pack.name;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/98 select-none overflow-hidden backdrop-blur-3xl"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${tierStyle.shadow}90 0%, #030712 70%, #010409 100%)`,
      }}
      dir="ltr"
    >
      {/* ── TOP ACTION BAR (Hidden in Clean Record Mode) ── */}
      <AnimatePresence>
        {!isCleanRecordMode && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-30 flex w-full max-w-5xl items-center justify-between p-3 sm:p-5"
          >
            {/* Left: Pack Badge & Close / Back Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSafeClose}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl hover:border-lime/40 hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
                title={t('packs.closeAndBack')}
              >
                <AppIcon icon={X} size={14} weight="bold" />
                <span className="hidden xs:inline sm:inline">{t('packs.closeAndBack')}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 backdrop-blur-xl shadow-lg">
                <ETLogo variant="card-badge" size={16} />
                <span className="font-stats text-xs font-bold tracking-wider text-white uppercase">
                  {packDisplayName}
                </span>
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2">
              {stage !== 'SLIDER' && stage !== 'OVERVIEW' && (
                <button
                  type="button"
                  onClick={handleSkipToSlider}
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-steel hover:text-white hover:border-lime/40 transition-all cursor-pointer"
                >
                  <span>{t('packs.skip')}</span>
                  <AppIcon icon={CaretRight} size={13} weight="bold" />
                </button>
              )}

              {stage !== 'OVERVIEW' && (
                <button
                  type="button"
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    sfx.cardDeal();
                    setStage('OVERVIEW');
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/15 px-3 py-1.5 text-xs font-bold text-lime shadow-[0_0_12px_rgba(149,232,16,0.3)] hover:bg-lime/25 transition-all cursor-pointer"
                  title="Display All 5 Cards"
                >
                  <AppIcon icon={SquaresFour} size={14} weight="bold" />
                  <span>{t('packs.revealAll')}</span>
                </button>
              )}

              {stage === 'OVERVIEW' && (
                <button
                  type="button"
                  onClick={() => setStage('SLIDER')}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-steel hover:text-white hover:border-lime/40 transition-all cursor-pointer"
                  title="Slider View"
                >
                  <AppIcon icon={Cards} size={14} weight="bold" />
                  <span className="hidden sm:inline">{t('packs.stepByStep')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCleanRecordMode(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-steel hover:text-white hover:border-lime/40 transition-all cursor-pointer"
                title={lang === 'ar' ? 'وضع تسجيل الشاشة النظيف' : 'Record Mode (Clean Framing)'}
              >
                <AppIcon icon={CornersOut} size={15} weight="bold" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Floating Exit Clean Mode Pill */}
      {isCleanRecordMode && (
        <button
          type="button"
          onClick={() => setIsCleanRecordMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-900 cursor-pointer"
        >
          <AppIcon icon={CornersIn} size={14} weight="bold" />
          <span>Exit Record Mode</span>
        </button>
      )}

      {/* ── AMBIENT STADIUM LIGHTING SPOTLIGHT ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full blur-[130px] opacity-25"
        style={{ backgroundColor: tierStyle.primary }}
      />

      {/* ── CENTER STAGE CONTAINER ── */}
      <main className="relative z-20 my-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center p-3 sm:p-5 text-center">
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* 1. STAGE: PACK UNBOXING & TEAR */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'UNBOXING' && (
            <motion.div
              key="stage-unboxing"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex flex-col items-center gap-5"
            >
              <div
                className="relative h-60 w-42 sm:h-72 sm:w-48 rounded-3xl border border-white/20 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col justify-between items-center overflow-hidden animate-pulse"
                style={{
                  background: `linear-gradient(160deg, ${tierStyle.surface} 0%, #080D1A 60%, #03060C 100%)`,
                  borderColor: `${tierStyle.accent}60`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${tierStyle.glow}`,
                }}
              >
                <div className="absolute top-0 inset-x-0 h-7 border-b border-white/15 bg-white/5 flex items-center justify-between px-3">
                  <ETLogo variant="card-badge" size={13} />
                  <span className="text-[8.5px] font-black tracking-widest text-steel uppercase">
                    EXTRA TIME
                  </span>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 shadow-inner">
                    <AppIcon icon={Cards} size={28} weight="duotone" className="text-white" />
                  </div>
                  <h3 className="font-display text-base font-black tracking-wider text-white uppercase">
                    {packDisplayName}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[8.5px] font-black tracking-widest uppercase border"
                    style={{
                      borderColor: tierStyle.accent,
                      color: tierStyle.highlight,
                      backgroundColor: `${tierStyle.shadow}80`,
                    }}
                  >
                    5 {lang === 'ar' ? 'بطاقات' : 'PLAYERS'}
                  </span>
                </div>

                <div className="w-full border-t border-dashed border-white/30 pt-2 text-center">
                  <span className="font-stats text-[9.5px] font-black tracking-widest text-lime uppercase animate-bounce inline-block">
                    {t('packs.openingPack')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 2. STAGE: NATION TEASER */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'TEASE_NATION' && topCard && (
            <motion.div
              key="stage-nation"
              initial={{ scale: 0.5, y: -30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex flex-col items-center gap-3.5"
            >
              <div className="text-[10.5px] font-black tracking-[0.3em] text-steel uppercase">
                {t('packs.nation')}
              </div>

              <div
                className="relative flex h-24 w-38 sm:h-28 sm:w-46 items-center justify-center overflow-hidden rounded-2xl border-2 p-1.5 shadow-2xl backdrop-blur-2xl"
                style={{
                  borderColor: tierStyle.accent,
                  boxShadow: `0 0 45px ${tierStyle.glow}, inset 0 0 15px rgba(255,255,255,0.08)`,
                  backgroundColor: 'rgba(8, 12, 22, 0.95)',
                }}
              >
                <CountryFlagBadge
                  nationName={topCard.nation}
                  className="h-full w-full rounded-xl border-0 shadow-none bg-transparent"
                  imgClassName="h-full w-full object-cover rounded-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
                />
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-white uppercase drop-shadow-md">
                {topCard.nation}
              </h2>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. STAGE: POSITION TEASER */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'TEASE_POSITION' && topCard && (
            <motion.div
              key="stage-position"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="flex flex-col items-center gap-3.5"
            >
              <div className="flex items-center gap-2">
                <CountryFlagBadge nationName={topCard.nation} className="h-4 w-6 rounded-sm" />
                <span className="text-[10.5px] font-black tracking-[0.3em] text-steel uppercase">
                  {topCard.nation} · {t('packs.position')}
                </span>
              </div>

              <div
                className="flex h-22 w-30 sm:h-26 sm:w-34 items-center justify-center rounded-3xl border-2 shadow-2xl backdrop-blur-2xl"
                style={{
                  borderColor: tierStyle.accent,
                  backgroundColor: 'rgba(10, 16, 30, 0.92)',
                  boxShadow: `0 0 45px ${tierStyle.glow}`,
                }}
              >
                <span
                  className="font-card-num text-4xl sm:text-5xl font-black uppercase"
                  style={{
                    color: tierStyle.highlight,
                    textShadow: `0 0 20px ${tierStyle.glow}`,
                  }}
                >
                  {topCard.position.split('/')[0]}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white uppercase">
                {topCard.position}
              </h2>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 4. STAGE: CLUB CREST TEASER */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'TEASE_CLUB' && topCard && (
            <motion.div
              key="stage-club"
              initial={{ scale: 0.6, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className="flex flex-col items-center gap-3.5"
            >
              <div className="flex items-center gap-2">
                <CountryFlagBadge nationName={topCard.nation} className="h-4 w-6 rounded-sm" />
                <span className="text-[10.5px] font-black tracking-widest text-lime uppercase">
                  {topCard.position.split('/')[0]} · {t('packs.club')}
                </span>
              </div>

              <div
                className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border-2 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl"
                style={{
                  borderColor: tierStyle.accent,
                  backgroundColor: 'rgba(10, 16, 30, 0.95)',
                  boxShadow: `0 0 50px ${tierStyle.glow}, inset 0 0 20px rgba(255,255,255,0.08)`,
                }}
              >
                <ClubCrestBadge
                  clubName={topCard.club}
                  className="h-full w-full rounded-full border-0 shadow-none bg-transparent"
                  imgClassName="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                />
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white uppercase drop-shadow-md">
                {topCard.club}
              </h2>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 5. STAGE: WALKOUT CELEBRATION (TOP CARD FULL REVEAL) */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'WALKOUT' && topCard && (
            <motion.div
              key="stage-walkout"
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-black tracking-widest uppercase shadow-xl backdrop-blur-md"
                style={{
                  borderColor: tierStyle.accent,
                  backgroundColor: `${tierStyle.shadow}90`,
                  color: tierStyle.highlight,
                  boxShadow: `0 0 20px ${tierStyle.glow}`,
                }}
              >
                {topCard.tier === 'ICON' ? (
                  <AppIcon icon={Crown} size={15} weight="fill" />
                ) : (
                  <AppIcon icon={Flame} size={15} weight="fill" />
                )}
                <span>
                  {topCard.tier} {t('packs.walkout')}
                </span>
              </motion.div>

              <div
                onClick={() => onInspectCard(topCard)}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <PlayerCard player={topCard} size="lg" />
              </div>

              {/* Action Buttons: Instant Reveal All 5 + Step 1-by-1 */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  type="button"
                  onClick={() => {
                    sfx.cardDeal();
                    setStage('OVERVIEW');
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-lime px-6 py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-[0_10px_25px_rgba(149,232,16,0.35)] hover:bg-lime/90 transition-all cursor-pointer active:scale-95"
                >
                  <AppIcon icon={SquaresFour} size={15} weight="bold" />
                  <span>{t('packs.revealAll')}</span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  type="button"
                  onClick={handleWalkoutProceed}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-steel hover:text-white hover:border-white/30 transition-all cursor-pointer active:scale-95"
                >
                  <span>{t('packs.stepByStep')}</span>
                  <AppIcon icon={CaretRight} size={13} weight="bold" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 6. STAGE: CARD-BY-CARD STEPPER (REVEALS EACH CARD WITH CLUES) */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'SLIDER' && currentSliderCard && (
            <motion.div
              key={`slider-card-${activeCardIndex}`}
              initial={{ opacity: 0, scale: 0.85, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex w-full flex-col items-center gap-2.5"
            >
              {/* 5-Card Teaser Strip Bar (Interactive Clues Preview) */}
              <div className="flex items-center justify-center gap-1.5 pb-0.5">
                {cards.map((c, i) => {
                  const isCurrent = i === activeCardIndex;
                  const cStyle = getTierStyle(c.tier);

                  return (
                    <button
                      key={`strip-${c.id}-${i}`}
                      type="button"
                      onClick={() => {
                        sfx.cardFlip();
                        setActiveCardIndex(i);
                      }}
                      className={`flex items-center gap-1 rounded-xl px-2 py-1 border transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-lime bg-lime/15 shadow-md ring-1 ring-lime/40'
                          : 'border-white/10 bg-slate-900/60 opacity-60 hover:opacity-100 hover:border-white/20'
                      }`}
                      title={`${c.name} (${c.tier})`}
                    >
                      <CountryFlagBadge nationName={c.nation} className="h-3 w-4 rounded-xs border-0" />
                      <span
                        className="text-[9px] font-black font-card-num"
                        style={{ color: cStyle.highlight }}
                      >
                        {c.position.split('/')[0]}
                      </span>
                      <ClubCrestBadge clubName={c.club} className="h-3.5 w-3.5 rounded-full border-0 bg-transparent" />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic 3-Badge Clues Bar for the Current Card */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3.5 py-1 backdrop-blur-xl shadow-lg"
              >
                {/* 1. Nation */}
                <div className="flex items-center gap-1">
                  <CountryFlagBadge nationName={currentSliderCard.nation} className="h-3.5 w-5 rounded-xs" />
                  <span className="text-[10px] font-bold text-white max-w-[70px] truncate">
                    {currentSliderCard.nation}
                  </span>
                </div>

                <span className="text-white/20 text-xs">•</span>

                {/* 2. Position */}
                <div
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-black font-card-num border"
                  style={{
                    borderColor: tierStyle.accent,
                    backgroundColor: `${tierStyle.shadow}70`,
                    color: tierStyle.highlight,
                  }}
                >
                  {currentSliderCard.position}
                </div>

                <span className="text-white/20 text-xs">•</span>

                {/* 3. Club */}
                <div className="flex items-center gap-1">
                  <ClubCrestBadge clubName={currentSliderCard.club} className="h-4 w-4 rounded-full border-0 bg-transparent" />
                  <span className="text-[10px] font-bold text-white max-w-[80px] truncate">
                    {currentSliderCard.club}
                  </span>
                </div>
              </motion.div>

              {/* Full Size Center Stage Card */}
              <div
                onClick={() => onInspectCard(currentSliderCard)}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95 my-0.5"
              >
                <PlayerCard player={currentSliderCard} size="lg" />
              </div>

              {/* Slider Controls Bar */}
              <div className="flex items-center justify-center gap-2 pt-0.5">
                {/* Prev Button */}
                <button
                  type="button"
                  onClick={handlePrevCard}
                  disabled={activeCardIndex === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:text-white hover:border-lime/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Previous Card"
                >
                  <AppIcon icon={CaretLeft} size={16} weight="bold" />
                </button>

                {/* Auto Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer ${
                    isAutoPlaying
                      ? 'border-lime/40 bg-lime/15 text-lime'
                      : 'border-white/10 bg-slate-900 text-steel hover:text-white'
                  }`}
                  title="Auto Advance Cards"
                >
                  <AppIcon
                    icon={isAutoPlaying ? Pause : Play}
                    size={14}
                    weight="fill"
                  />
                  <span>{isAutoPlaying ? 'Auto' : 'Manual'}</span>
                </button>

                {/* Next Button / Done */}
                {activeCardIndex < cards.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextCard}
                    className="flex h-9 items-center gap-1 rounded-xl bg-lime px-4 text-xs font-black tracking-wider text-slate-950 uppercase shadow-md hover:bg-lime/90 transition-all cursor-pointer"
                  >
                    <span>{t('packs.next')}</span>
                    <AppIcon icon={CaretRight} size={14} weight="bold" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStage('OVERVIEW')}
                    className="flex h-9 items-center gap-1 rounded-xl bg-lime px-4 text-xs font-black tracking-wider text-slate-950 uppercase shadow-md hover:bg-lime/90 transition-all cursor-pointer"
                  >
                    <span>{t('packs.revealAll')}</span>
                    <AppIcon icon={SquaresFour} size={14} weight="bold" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 7. STAGE: FULL DECK OVERVIEW */}
          {/* ─────────────────────────────────────────────────────────── */}
          {stage === 'OVERVIEW' && (
            <motion.div
              key="stage-overview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-4xl flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-lime text-[11px] font-black tracking-widest uppercase">
                  {packDisplayName} · {t('packs.cardsCount', { count: 5 })}
                </span>
              </div>

              {/* Single Horizontal Line Deck */}
              <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-2 sm:gap-3.5 w-full max-w-full overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory">
                {cards.map((player, idx) => (
                  <motion.div
                    key={`pack-overview-${player.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => {
                      sfx.cardFlip();
                      onInspectCard(player);
                    }}
                    className="shrink-0 snap-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="block sm:hidden">
                      <PlayerCard player={player} size="xs" />
                    </div>
                    <div className="hidden sm:block">
                      <PlayerCard player={player} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sfx.cardDeal();
                    onOpenAgain();
                    setActiveCardIndex(0);
                    setStage('UNBOXING');
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-lime px-5 py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-lg hover:bg-lime/90 transition-all cursor-pointer active:scale-95"
                >
                  <AppIcon icon={ArrowCounterClockwise} size={14} weight="bold" />
                  <span>{t('packs.again')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:border-white/30 transition-all cursor-pointer active:scale-95"
                >
                  <span>{t('packs.backToVault')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Subtext */}
      {!isCleanRecordMode && (
        <footer className="relative z-20 pb-4 text-center">
          <p className="text-[10px] font-bold text-steel/70 tracking-widest uppercase">
            ExtraTime Card Experience · Authentic FUT Design
          </p>
        </footer>
      )}
    </div>
  );
}
