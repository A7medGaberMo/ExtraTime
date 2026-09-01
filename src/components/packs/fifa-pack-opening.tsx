'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretRight,
  ArrowCounterClockwise,
  X,
  CornersOut,
  CornersIn,
  Crown,
  Cards,
  Flame,
  SquaresFour,
  Sparkle,
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

type RevealSubStage = 'NATION' | 'POSITION' | 'CLUB' | 'WALKOUT';
type MainStage = 'UNBOXING' | 'CARD_REVEAL' | 'OVERVIEW';

export function FifaPackOpening({
  pack,
  cards,
  onClose,
  onOpenAgain,
  onInspectCard,
}: FifaPackOpeningProps) {
  const { lang, t } = useI18n();

  // Order cards so the top walkout player is saved for the grand 5th finale!
  const orderedCards = React.useMemo(() => {
    if (!cards || cards.length === 0) return [];
    // Sort ascending by tier/rating so the best card is index 4 (last walkout)
    return [...cards].sort((a, b) => {
      const tierRankA = TIER_ORDER.indexOf(a.tier);
      const tierRankB = TIER_ORDER.indexOf(b.tier);
      if (tierRankA !== tierRankB) return tierRankB - tierRankA; // Lower tier first, highest tier last
      return getEffectiveRating(a) - getEffectiveRating(b);
    });
  }, [cards]);

  const [mainStage, setMainStage] = useState<MainStage>('UNBOXING');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [subStage, setSubStage] = useState<RevealSubStage>('NATION');
  const [isCleanRecordMode, setIsCleanRecordMode] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCard = orderedCards[currentCardIndex] || orderedCards[0];
  const isTopWalkout = currentCardIndex === orderedCards.length - 1;
  const currentTierStyle = getTierStyle(currentCard?.tier || pack.featuredTier);

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

  // Sequence controller for each card's clues (Nation -> Position -> Club -> Walkout)
  const startCardRevealSequence = useCallback((cardIdx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentCardIndex(cardIdx);
    setSubStage('NATION');
    sfx.walkoutTease(1);

    // 1. Nation (1.1s) -> Position
    timerRef.current = setTimeout(() => {
      setSubStage('POSITION');
      sfx.walkoutTease(2);

      // 2. Position (1.1s) -> Club
      timerRef.current = setTimeout(() => {
        setSubStage('CLUB');
        sfx.walkoutTease(3);

        // 3. Club (1.2s) -> Card Slam
        timerRef.current = setTimeout(() => {
          setSubStage('WALKOUT');
          const targetCard = orderedCards[cardIdx];
          const isSpecial =
            targetCard &&
            (targetCard.tier === 'ICON' ||
              targetCard.tier === 'HERO' ||
              targetCard.tier === 'ULTIMATE' ||
              targetCard.tier === 'MASTER' ||
              (targetCard.rating ?? 0) >= 86);

          if (isSpecial) {
            sfx.walkout();
          } else {
            sfx.tierReveal();
          }
        }, 1200);
      }, 1100);
    }, 1100);
  }, [orderedCards]);

  // Pack Unboxing Initializer
  useEffect(() => {
    sfx.packShake();

    timerRef.current = setTimeout(() => {
      sfx.packRip();
      setMainStage('CARD_REVEAL');
      startCardRevealSequence(0);
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startCardRevealSequence]);

  // Advance to Next Card Reveal or Final Overview
  const handleProceedNext = () => {
    if (currentCardIndex < orderedCards.length - 1) {
      sfx.cardDeal();
      startCardRevealSequence(currentCardIndex + 1);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      sfx.cardDeal();
      setMainStage('OVERVIEW');
    }
  };

  // Skip Directly to Overview (Reveal All 5)
  const handleRevealAllOverview = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sfx.cardDeal();
    setMainStage('OVERVIEW');
  };

  // Skip current card's teaser straight to walkout
  const handleInstantWalkout = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSubStage('WALKOUT');
    sfx.tierReveal();
  };

  const packDisplayName =
    lang === 'ar'
      ? pack.id === 'pantheon-pack'
        ? 'بانثيون النخبة الكبرى'
        : pack.id === 'icon-pack'
          ? 'ملوك الأيقونات'
          : 'أبطال النخبة'
      : pack.name;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/98 select-none overflow-hidden backdrop-blur-3xl"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${currentTierStyle.shadow}90 0%, #030712 70%, #010409 100%)`,
      }}
      dir="ltr"
    >
      {/* ── TOP ACTION BAR WITH PROMINENT INSTANT CLOSE (X) ── */}
      <AnimatePresence>
        {!isCleanRecordMode && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-30 flex w-full max-w-5xl items-center justify-between p-2.5 sm:p-4 shrink-0"
          >
            {/* Left: Instant X Close Button & Pack Badge */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSafeClose}
                className="group flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xl hover:border-lime/50 hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 ring-1 ring-white/10"
                title={t('packs.closeAndBack')}
              >
                <AppIcon
                  icon={X}
                  size={15}
                  weight="bold"
                  className="text-steel group-hover:text-lime transition-colors"
                />
                <span className="text-xs font-black tracking-tight">{t('packs.closeAndBack')}</span>
              </button>

              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 backdrop-blur-xl shadow-lg">
                <ETLogo variant="card-badge" size={15} />
                <span className="font-stats text-xs font-bold tracking-wider text-white uppercase truncate max-w-[140px]">
                  {packDisplayName}
                </span>
              </div>
            </div>

            {/* Center: 5-Card Progression Pip Indicator */}
            {mainStage === 'CARD_REVEAL' && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/80 px-3 py-1 backdrop-blur-xl shadow-md">
                <span className="text-[10px] font-black text-steel uppercase pr-1 font-stats">
                  {lang === 'ar' ? `بطاقة ${currentCardIndex + 1} من 5` : `Card ${currentCardIndex + 1} of 5`}
                </span>
                <div className="flex items-center gap-1">
                  {orderedCards.map((_, idx) => (
                    <div
                      key={`pip-${idx}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentCardIndex
                          ? 'w-4 bg-lime shadow-[0_0_8px_rgba(149,232,16,0.8)]'
                          : idx < currentCardIndex
                            ? 'w-1.5 bg-lime/40'
                            : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {mainStage === 'CARD_REVEAL' && subStage !== 'WALKOUT' && (
                <button
                  type="button"
                  onClick={handleInstantWalkout}
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-steel hover:text-white hover:border-lime/40 transition-all cursor-pointer"
                >
                  <span className="text-[11px] sm:text-xs">{t('packs.skip')}</span>
                  <AppIcon icon={CaretRight} size={13} weight="bold" />
                </button>
              )}

              {mainStage !== 'OVERVIEW' && (
                <button
                  type="button"
                  onClick={handleRevealAllOverview}
                  className="flex items-center gap-1 rounded-full border border-lime/40 bg-lime/15 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-lime shadow-[0_0_12px_rgba(149,232,16,0.3)] hover:bg-lime/25 transition-all cursor-pointer"
                  title="Reveal All 5 Cards"
                >
                  <AppIcon icon={SquaresFour} size={14} weight="bold" />
                  <span className="text-[11px] sm:text-xs">{t('packs.revealAll')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCleanRecordMode(true)}
                className="hidden xs:flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-steel hover:text-white hover:border-lime/40 transition-all cursor-pointer shrink-0"
                title={lang === 'ar' ? 'وضع تسجيل الشاشة النظيف' : 'Record Mode (Clean Framing)'}
              >
                <AppIcon icon={CornersOut} size={14} weight="bold" />
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
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-900 cursor-pointer"
        >
          <AppIcon icon={CornersIn} size={14} weight="bold" />
          <span>Exit Record Mode</span>
        </button>
      )}

      {/* ── AMBIENT STADIUM SPOTLIGHT ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] sm:h-[650px] sm:w-[650px] rounded-full blur-[130px] opacity-25"
        style={{ backgroundColor: currentTierStyle.primary }}
      />

      {/* ── CENTER STAGE CONTAINER (FC STYLE IMMERSIVE FLOW) ── */}
      <main className="relative z-20 my-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center p-2 sm:p-4 text-center overflow-y-auto scrollbar-none max-h-[calc(100dvh-4.5rem)]">
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* 1. STAGE: PACK UNBOXING & TEAR */}
          {/* ─────────────────────────────────────────────────────────── */}
          {mainStage === 'UNBOXING' && (
            <motion.div
              key="stage-unboxing"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex flex-col items-center gap-4 py-2"
            >
              <div
                className="relative h-56 w-38 sm:h-72 sm:w-48 rounded-3xl border border-white/20 p-3.5 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col justify-between items-center overflow-hidden animate-pulse"
                style={{
                  background: `linear-gradient(160deg, ${currentTierStyle.surface} 0%, #080D1A 60%, #03060C 100%)`,
                  borderColor: `${currentTierStyle.accent}60`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${currentTierStyle.glow}`,
                }}
              >
                <div className="absolute top-0 inset-x-0 h-6 sm:h-7 border-b border-white/15 bg-white/5 flex items-center justify-between px-3">
                  <ETLogo variant="card-badge" size={12} />
                  <span className="text-[8px] sm:text-[8.5px] font-black tracking-widest text-steel uppercase">
                    EXTRA TIME
                  </span>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 shadow-inner">
                    <AppIcon icon={Cards} size={24} weight="duotone" className="text-white" />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-black tracking-wider text-white uppercase">
                    {packDisplayName}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[8px] sm:text-[8.5px] font-black tracking-widest uppercase border"
                    style={{
                      borderColor: currentTierStyle.accent,
                      color: currentTierStyle.highlight,
                      backgroundColor: `${currentTierStyle.shadow}80`,
                    }}
                  >
                    5 {lang === 'ar' ? 'بطاقات' : 'PLAYERS'}
                  </span>
                </div>

                <div className="w-full border-t border-dashed border-white/30 pt-1.5 sm:pt-2 text-center">
                  <span className="font-stats text-[9px] sm:text-[9.5px] font-black tracking-widest text-lime uppercase animate-bounce inline-block">
                    {t('packs.openingPack')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 2. STAGE: FULL FC CARD-BY-CARD CINEMATIC REVEAL FLOW */}
          {/* ─────────────────────────────────────────────────────────── */}
          {mainStage === 'CARD_REVEAL' && currentCard && (
            <div className="w-full flex flex-col items-center justify-center">
              {/* ── 2A. CLUE: NATION REVEAL ── */}
              {subStage === 'NATION' && (
                <motion.div
                  key={`nation-${currentCardIndex}`}
                  initial={{ scale: 0.5, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="flex flex-col items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-1.5 text-[10.5px] font-black tracking-[0.25em] text-steel uppercase">
                    <AppIcon icon={Sparkle} size={12} weight="fill" className="text-lime" />
                    <span>{t('packs.nation')}</span>
                  </div>

                  <div
                    className="relative flex h-24 w-36 sm:h-32 sm:w-52 items-center justify-center overflow-hidden rounded-2xl border-2 p-1.5 shadow-2xl backdrop-blur-2xl"
                    style={{
                      borderColor: currentTierStyle.accent,
                      boxShadow: `0 0 50px ${currentTierStyle.glow}, inset 0 0 15px rgba(255,255,255,0.08)`,
                      backgroundColor: 'rgba(8, 12, 22, 0.95)',
                    }}
                  >
                    <CountryFlagBadge
                      nationName={currentCard.nation}
                      className="h-full w-full rounded-xl border-0 shadow-none bg-transparent"
                      imgClassName="h-full w-full object-cover rounded-lg drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    />
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-white uppercase drop-shadow-md">
                    {currentCard.nation}
                  </h2>
                </motion.div>
              )}

              {/* ── 2B. CLUE: POSITION REVEAL ── */}
              {subStage === 'POSITION' && (
                <motion.div
                  key={`position-${currentCardIndex}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  className="flex flex-col items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <CountryFlagBadge nationName={currentCard.nation} className="h-4 w-6 rounded-xs" />
                    <span className="text-[10.5px] font-black tracking-[0.25em] text-steel uppercase">
                      {currentCard.nation} · {t('packs.position')}
                    </span>
                  </div>

                  <div
                    className="flex h-22 w-32 sm:h-28 sm:w-40 items-center justify-center rounded-3xl border-2 shadow-2xl backdrop-blur-2xl"
                    style={{
                      borderColor: currentTierStyle.accent,
                      backgroundColor: 'rgba(10, 16, 30, 0.92)',
                      boxShadow: `0 0 50px ${currentTierStyle.glow}`,
                    }}
                  >
                    <span
                      className="font-card-num text-4xl sm:text-5xl font-black uppercase"
                      style={{
                        color: currentTierStyle.highlight,
                        textShadow: `0 0 25px ${currentTierStyle.glow}`,
                      }}
                    >
                      {currentCard.position.split('/')[0]}
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white uppercase">
                    {currentCard.position}
                  </h2>
                </motion.div>
              )}

              {/* ── 2C. CLUE: CLUB CREST REVEAL ── */}
              {subStage === 'CLUB' && (
                <motion.div
                  key={`club-${currentCardIndex}`}
                  initial={{ scale: 0.6, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="flex flex-col items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <CountryFlagBadge nationName={currentCard.nation} className="h-4 w-6 rounded-xs" />
                    <span className="text-[10.5px] font-black tracking-widest text-lime uppercase">
                      {currentCard.position.split('/')[0]} · {t('packs.club')}
                    </span>
                  </div>

                  <div
                    className="relative flex h-26 w-26 sm:h-38 sm:w-38 items-center justify-center rounded-full border-2 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl"
                    style={{
                      borderColor: currentTierStyle.accent,
                      backgroundColor: 'rgba(10, 16, 30, 0.95)',
                      boxShadow: `0 0 55px ${currentTierStyle.glow}, inset 0 0 20px rgba(255,255,255,0.08)`,
                    }}
                  >
                    <ClubCrestBadge
                      clubName={currentCard.club}
                      className="h-full w-full rounded-full border-0 shadow-none bg-transparent"
                      imgClassName="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                    />
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white uppercase drop-shadow-md">
                    {currentCard.club}
                  </h2>
                </motion.div>
              )}

              {/* ── 2D. FULL CARD WALKOUT SLAM ── */}
              {subStage === 'WALKOUT' && (
                <motion.div
                  key={`walkout-${currentCardIndex}`}
                  initial={{ scale: 0.7, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-2.5 py-1"
                >
                  {/* Walkout Tier / Super-Star Ribbon */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-black tracking-widest uppercase shadow-xl backdrop-blur-md"
                    style={{
                      borderColor: currentTierStyle.accent,
                      backgroundColor: `${currentTierStyle.shadow}90`,
                      color: currentTierStyle.highlight,
                      boxShadow: `0 0 20px ${currentTierStyle.glow}`,
                    }}
                  >
                    {currentCard.tier === 'ICON' ? (
                      <AppIcon icon={Crown} size={14} weight="fill" />
                    ) : (
                      <AppIcon icon={Flame} size={14} weight="fill" />
                    )}
                    <span>
                      {isTopWalkout ? `${currentCard.tier} ${t('packs.walkout')}` : currentCard.tier}
                    </span>
                  </motion.div>

                  {/* High-Impact Player Card */}
                  <div
                    onClick={() => onInspectCard(currentCard)}
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95 my-1"
                  >
                    {/* Mobile: md size fits viewport without overlap */}
                    <div className="block sm:hidden">
                      <PlayerCard player={currentCard} size="md" />
                    </div>
                    {/* Desktop: lg size */}
                    <div className="hidden sm:block">
                      <PlayerCard player={currentCard} size="lg" />
                    </div>
                  </div>

                  {/* Reveal Next Card Action Button */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <motion.button
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      type="button"
                      onClick={handleProceedNext}
                      className="flex items-center gap-2 rounded-2xl bg-lime px-6 py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-[0_10px_25px_rgba(149,232,16,0.35)] hover:bg-lime/90 transition-all cursor-pointer active:scale-95"
                    >
                      <span>
                        {currentCardIndex < orderedCards.length - 1
                          ? lang === 'ar'
                            ? `كشف البطاقة التالية (${currentCardIndex + 2} من 5)`
                            : `Reveal Next Card (${currentCardIndex + 2} of 5)`
                          : lang === 'ar'
                            ? 'عرض كل الحزمة'
                            : 'View Full Deck'}
                      </span>
                      <AppIcon icon={CaretRight} size={14} weight="bold" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. STAGE: FINAL 5-CARD STADIUM OVERVIEW */}
          {/* ─────────────────────────────────────────────────────────── */}
          {mainStage === 'OVERVIEW' && (
            <motion.div
              key="stage-overview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-4xl flex-col items-center gap-3 sm:gap-4 py-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-lime text-[11px] font-black tracking-widest uppercase font-stats">
                  {packDisplayName} · 5 {lang === 'ar' ? 'بطاقات' : 'CARDS'}
                </span>
              </div>

              {/* Clean 5-Card Stadium Display */}
              <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 w-full max-w-full overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory">
                {orderedCards.map((player, idx) => (
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
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sfx.cardDeal();
                    onOpenAgain();
                    setCurrentCardIndex(0);
                    setMainStage('UNBOXING');
                  }}
                  className="flex items-center gap-1.5 rounded-2xl bg-lime px-5 py-2.5 text-xs font-black tracking-widest text-slate-950 uppercase shadow-lg hover:bg-lime/90 transition-all cursor-pointer active:scale-95"
                >
                  <AppIcon icon={ArrowCounterClockwise} size={14} weight="bold" />
                  <span>{t('packs.again')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:border-white/30 transition-all cursor-pointer active:scale-95"
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
        <footer className="relative z-20 pb-2 sm:pb-3 text-center shrink-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-steel/70 tracking-widest uppercase font-stats">
            ExtraTime Card Experience · Authentic FC Pack Opening
          </p>
        </footer>
      )}
    </div>
  );
}
