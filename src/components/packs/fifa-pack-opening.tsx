'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
  SpeakerHigh,
  SpeakerSimpleSlash,
  Translate,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { PlayerCard } from '@/components/shared/player-card';
import { CountryFlagBadge, ClubCrestBadge } from '@/components/shared/card-badges';
import { ETLogo } from '@/components/shared/et-logo';
import { getTierStyle, TIER_ORDER } from '@/lib/tier-styles';
import { getEffectiveRating } from '@/lib/rating-utils';
import { sfx } from '@/lib/sfx';
import { useI18n } from '@/lib/i18n';
import { setOverlayActive } from '@/lib/overlay-state';
import type { PlayerCardData, Tier } from '@/types/player';

function subscribeSound(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  window.addEventListener('extratime_sfx_change', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('extratime_sfx_change', cb);
  };
}

function getSoundMutedSnapshot() {
  return sfx.isMuted();
}

function getServerSoundMutedSnapshot() {
  return false;
}

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

const emptySubscribe = () => () => {};

export function FifaPackOpening({
  pack,
  cards,
  onClose,
  onOpenAgain,
  onInspectCard,
}: FifaPackOpeningProps) {
  const { lang, toggleLang, t } = useI18n();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Mute state subscription
  const muted = useSyncExternalStore(
    subscribeSound,
    getSoundMutedSnapshot,
    getServerSoundMutedSnapshot,
  );

  const handleToggleSound = useCallback(() => {
    sfx.toggleMute();
    window.dispatchEvent(new Event('extratime_sfx_change'));
  }, []);

  // Order cards so the top walkout player is saved for the grand 5th finale!
  const orderedCards = React.useMemo(() => {
    if (!cards || cards.length === 0) return [];
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
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const startCardRevealSequenceRef = useRef<(cardIdx: number) => void>(() => {});

  const currentCard = orderedCards[currentCardIndex] || orderedCards[0];
  const isTopWalkout = currentCardIndex === orderedCards.length - 1;
  const currentTierStyle = getTierStyle(currentCard?.tier || pack.featuredTier);

  // Notify global overlay state and lock body scroll
  useEffect(() => {
    setOverlayActive(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      setOverlayActive(false);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Clear all pending timeouts safely
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  }, []);

  // Safely cleanup timers on unmount or close
  const handleSafeClose = useCallback(() => {
    clearAllTimers();
    onClose();
  }, [clearAllTimers, onClose]);

  // Sequence controller for each card's clues (Nation -> Position -> Club -> Walkout -> Auto Advance)
  const startCardRevealSequence = useCallback((cardIdx: number) => {
    clearAllTimers();
    setCurrentCardIndex(cardIdx);
    setSubStage('NATION');
    sfx.walkoutTease(1);

    // 1. Nation Clue (0.55s) -> Position
    timerRef.current = setTimeout(() => {
      setSubStage('POSITION');
      sfx.walkoutTease(2);

      // 2. Position Clue (0.55s) -> Club
      timerRef.current = setTimeout(() => {
        setSubStage('CLUB');
        sfx.walkoutTease(3);

        // 3. Club Clue (0.6s) -> Card Walkout Slam
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

          // 4. Hands-free Auto-Advance to next card after ~1.4s
          autoAdvanceRef.current = setTimeout(() => {
            if (cardIdx < orderedCards.length - 1) {
              sfx.cardDeal();
              startCardRevealSequenceRef.current(cardIdx + 1);
            } else {
              sfx.cardDeal();
              setMainStage('OVERVIEW');
            }
          }, cardIdx === orderedCards.length - 1 ? 1600 : 1300);

        }, 600);
      }, 550);
    }, 550);
  }, [orderedCards, clearAllTimers]);

  useEffect(() => {
    startCardRevealSequenceRef.current = startCardRevealSequence;
  }, [startCardRevealSequence]);

  // Pack Unboxing Initializer
  useEffect(() => {
    sfx.packShake();

    timerRef.current = setTimeout(() => {
      sfx.packRip();
      setMainStage('CARD_REVEAL');
      startCardRevealSequence(0);
    }, 450);

    return () => {
      clearAllTimers();
    };
  }, [startCardRevealSequence, clearAllTimers]);

  // Manual Advance to Next Card Reveal or Final Overview
  const handleProceedNext = useCallback(() => {
    clearAllTimers();
    if (currentCardIndex < orderedCards.length - 1) {
      sfx.cardDeal();
      startCardRevealSequence(currentCardIndex + 1);
    } else {
      sfx.cardDeal();
      setMainStage('OVERVIEW');
    }
  }, [clearAllTimers, currentCardIndex, orderedCards.length, startCardRevealSequence]);

  // Skip Directly to Overview (Reveal All 5 Dominoes)
  const handleRevealAllOverview = useCallback(() => {
    clearAllTimers();
    sfx.cardDeal();
    setMainStage('OVERVIEW');
  }, [clearAllTimers]);

  // Skip current card's teaser straight to walkout
  const handleInstantWalkout = useCallback(() => {
    clearAllTimers();
    setSubStage('WALKOUT');
    sfx.tierReveal();

    autoAdvanceRef.current = setTimeout(() => {
      if (currentCardIndex < orderedCards.length - 1) {
        sfx.cardDeal();
        startCardRevealSequence(currentCardIndex + 1);
      } else {
        sfx.cardDeal();
        setMainStage('OVERVIEW');
      }
    }, currentCardIndex === orderedCards.length - 1 ? 1600 : 1300);
  }, [clearAllTimers, currentCardIndex, orderedCards.length, startCardRevealSequence]);

  // Global Key listeners for instant close, skip, or advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (mainStage === 'UNBOXING') {
          clearAllTimers();
          sfx.packRip();
          setMainStage('CARD_REVEAL');
          startCardRevealSequence(0);
        } else if (mainStage === 'CARD_REVEAL') {
          if (subStage !== 'WALKOUT') {
            handleInstantWalkout();
          } else {
            handleProceedNext();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSafeClose, handleInstantWalkout, handleProceedNext, mainStage, subStage, clearAllTimers, startCardRevealSequence]);

  const packDisplayName =
    lang === 'ar'
      ? pack.id === 'pantheon-pack'
        ? 'حزمة بانثيون الأساطير'
        : pack.id === 'icon-pack'
          ? 'حزمة ملوك الأيقونات'
          : 'حزمة أبطال النخبة'
      : pack.name;

  if (!mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#02050e] select-none overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 20%, ${currentTierStyle.shadow}70 0%, #030713 60%, #010307 100%)`,
      }}
      dir="ltr"
    >
      {/* ── TOP AUTHENTIC EA FC ACTION BAR (RESPONSIVE ON ALL MOBILE SIZES) ── */}
      <AnimatePresence>
        {!isCleanRecordMode && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-40 flex w-full max-w-6xl items-center justify-between px-2 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-2 shrink-0 gap-1.5 sm:gap-2 border-b border-white/[0.06] bg-slate-950/75 backdrop-blur-2xl"
          >
            {/* Left: Close & Back + Pack Identifier */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSafeClose}
                className="btn-haptic group flex items-center gap-1 sm:gap-2 rounded-full border border-white/15 bg-slate-900/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-2xl hover:border-lime/50 hover:bg-slate-800 transition-all cursor-pointer"
                title={`${t('packs.closeAndBack')} (ESC)`}
              >
                <AppIcon
                  icon={X}
                  size={13}
                  weight="bold"
                  className="text-steel group-hover:text-lime transition-colors"
                />
                <span className="font-stats font-bold text-[11px] sm:text-xs tracking-tight">
                  <span className="inline sm:hidden">{lang === 'ar' ? 'إغلاق' : 'Back'}</span>
                  <span className="hidden sm:inline">{t('packs.closeAndBack')}</span>
                </span>
                <span className="hidden md:inline-block rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-steel">
                  ESC
                </span>
              </button>

              <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 backdrop-blur-xl shadow-md">
                <ETLogo variant="card-badge" size={15} />
                <span className="font-stats text-xs font-bold tracking-wider text-white uppercase truncate max-w-[150px]">
                  {packDisplayName}
                </span>
              </div>
            </div>

            {/* Center: Dynamic EA FC Card Progress Capsule */}
            {mainStage === 'CARD_REVEAL' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-white/15 bg-slate-900/90 px-2.5 sm:px-4 py-1 sm:py-1.5 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
              >
                <span className="text-[10px] sm:text-xs font-bold text-steel uppercase font-stats tracking-wider">
                  <span className="inline sm:hidden">{currentCardIndex + 1}/5</span>
                  <span className="hidden sm:inline">
                    {lang === 'ar' ? `بطاقة ${currentCardIndex + 1} من 5` : `Card ${currentCardIndex + 1} of 5`}
                  </span>
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {orderedCards.map((_, idx) => (
                    <div
                      key={`pip-${idx}`}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        idx === currentCardIndex
                          ? 'w-3.5 sm:w-5 bg-lime shadow-[0_0_12px_rgba(142,224,0,0.9)]'
                          : idx < currentCardIndex
                            ? 'w-1.5 sm:w-2 bg-lime/60'
                            : 'w-1.5 sm:w-2 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-slate-900/80 px-2.5 sm:px-3.5 py-1 sm:py-1.5 backdrop-blur-xl shadow-sm">
                <ETLogo variant="card-badge" size={13} />
                <span className="font-stats text-[10.5px] sm:text-xs font-bold tracking-wider text-lime uppercase">
                  {mainStage === 'UNBOXING' ? t('packs.openingPack') : '5/5 SQUAD'}
                </span>
              </div>
            )}

            {/* Right: Unified Action Capsule */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className="btn-haptic flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/12 bg-slate-900/90 text-steel hover:border-lime/40 hover:text-white transition-all cursor-pointer shadow-sm"
                title={muted ? t('common.soundMuted') : t('common.soundOn')}
              >
                <AppIcon
                  icon={muted ? SpeakerSimpleSlash : SpeakerHigh}
                  size={13}
                  weight="bold"
                  className={muted ? 'text-rose-400' : 'text-lime'}
                />
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLang}
                className="btn-haptic flex h-7.5 sm:h-8 items-center gap-1 rounded-full px-2 sm:px-2.5 border border-white/12 bg-slate-900/90 text-[10px] sm:text-[11px] font-bold text-steel hover:border-lime/40 hover:text-white transition-all cursor-pointer font-stats shadow-sm"
                title={t('common.language')}
              >
                <AppIcon icon={Translate} size={12} weight="bold" />
                <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {/* Skip Clue Button */}
              {mainStage === 'CARD_REVEAL' && subStage !== 'WALKOUT' && (
                <button
                  type="button"
                  onClick={handleInstantWalkout}
                  className="btn-haptic flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] px-2 sm:px-3 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold text-steel hover:text-white hover:border-lime/40 hover:bg-white/[0.12] transition-all cursor-pointer"
                >
                  <span>{t('packs.skip')}</span>
                  <AppIcon icon={CaretRight} size={11} weight="bold" />
                </button>
              )}

              {/* Reveal All 5 Cards Button */}
              {mainStage !== 'OVERVIEW' && (
                <button
                  type="button"
                  onClick={handleRevealAllOverview}
                  className="btn-haptic flex items-center gap-1 sm:gap-1.5 rounded-full border border-lime/40 bg-lime/15 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-bold text-lime shadow-[0_0_16px_rgba(142,224,0,0.25)] hover:bg-lime/25 transition-all cursor-pointer"
                  title="Reveal All 5 Cards"
                >
                  <AppIcon icon={SquaresFour} size={13} weight="bold" />
                  <span className="inline sm:hidden">{lang === 'ar' ? 'الكل 5' : 'Reveal'}</span>
                  <span className="hidden sm:inline">{t('packs.revealAll')}</span>
                </button>
              )}

              {/* Record Mode / Clean Stage */}
              <button
                type="button"
                onClick={() => setIsCleanRecordMode(true)}
                className="btn-haptic hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-slate-900/90 text-steel hover:text-white hover:border-white/30 transition-all cursor-pointer shrink-0 shadow-sm"
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
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={() => setIsCleanRecordMode(false)}
          className="btn-haptic fixed top-4 right-4 z-[99999] flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/85 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-2xl transition-all hover:bg-slate-900 cursor-pointer"
        >
          <AppIcon icon={CornersIn} size={14} weight="bold" />
          <span>Exit Clean Mode</span>
        </motion.button>
      )}

      {/* ── AMBIENT STADIUM LIGHTING SPOTLIGHT ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] sm:h-[650px] sm:w-[650px] rounded-full blur-[120px] sm:blur-[140px] opacity-30 transition-all duration-700"
        style={{ backgroundColor: currentTierStyle.primary }}
      />

      {/* ── CENTER STAGE CONTAINER (OPTIMIZED FOR MOBILE VIEWPORTS) ── */}
      <main className="relative z-20 my-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-2 sm:px-6 py-1 sm:py-2 text-center overflow-y-auto scrollbar-hidden max-h-[calc(100dvh-4.2rem)]">
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* 1. STAGE: PACK UNBOXING & FOIL TEAR */}
          {/* ─────────────────────────────────────────────────────────── */}
          {mainStage === 'UNBOXING' && (
            <motion.div
              key="stage-unboxing"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="flex flex-col items-center gap-3 sm:gap-4 py-2 cursor-pointer"
              onClick={() => {
                clearAllTimers();
                sfx.packRip();
                setMainStage('CARD_REVEAL');
                startCardRevealSequence(0);
              }}
            >
              <div
                className="relative h-56 w-38 sm:h-76 sm:w-52 rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col justify-between items-center overflow-hidden animate-pulse"
                style={{
                  background: `linear-gradient(160deg, ${currentTierStyle.surface} 0%, #080D1A 60%, #03060C 100%)`,
                  borderColor: `${currentTierStyle.accent}60`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 40px ${currentTierStyle.glow}, inset 0 1px 0 0 rgba(255,255,255,0.15)`,
                }}
              >
                <div className="absolute top-0 inset-x-0 h-6 sm:h-7 border-b border-white/15 bg-white/5 flex items-center justify-between px-3">
                  <ETLogo variant="card-badge" size={12} />
                  <span className="text-[8px] sm:text-[8.5px] font-bold tracking-widest text-steel uppercase font-stats">
                    EXTRA TIME
                  </span>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 shadow-inner">
                    <AppIcon icon={Cards} size={22} weight="duotone" className="text-white" />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-bold tracking-wider text-white uppercase text-center px-1">
                    {packDisplayName}
                  </h3>
                  <span
                    className="rounded-full px-2.5 sm:px-3 py-0.5 text-[8.5px] sm:text-[9px] font-bold tracking-widest uppercase border font-stats"
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
                  <span className="font-stats text-[9px] sm:text-[9.5px] font-bold tracking-widest text-lime uppercase animate-bounce inline-block">
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
            <div className="w-full max-w-xl flex flex-col items-center justify-center">
              {/* ── 2A. CLUE: NATION REVEAL ── */}
              {subStage === 'NATION' && (
                <motion.div
                  key={`nation-${currentCardIndex}`}
                  initial={{ scale: 0.6, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="flex flex-col items-center gap-2.5 sm:gap-3.5 py-2 cursor-pointer"
                  onClick={handleInstantWalkout}
                >
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-steel uppercase font-stats">
                    <AppIcon icon={Globe} size={13} weight="bold" className="text-lime" />
                    <span>{t('packs.nation')}</span>
                  </div>

                  <div
                    className="relative flex h-20 w-32 sm:h-32 sm:w-52 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border-2 p-1 sm:p-1.5 shadow-2xl backdrop-blur-2xl"
                    style={{
                      borderColor: currentTierStyle.accent,
                      boxShadow: `0 0 50px ${currentTierStyle.glow}, inset 0 0 15px rgba(255,255,255,0.08)`,
                      backgroundColor: 'rgba(8, 12, 22, 0.95)',
                    }}
                  >
                    <CountryFlagBadge
                      nationName={currentCard.nation}
                      className="h-full w-full rounded-lg sm:rounded-xl border-0 shadow-none bg-transparent"
                      imgClassName="h-full w-full object-cover rounded-md sm:rounded-lg drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    />
                  </div>

                  <h2 className="font-display text-xl sm:text-3xl font-bold tracking-wide text-white uppercase drop-shadow-md">
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
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  className="flex flex-col items-center gap-2.5 sm:gap-3.5 py-2 cursor-pointer"
                  onClick={handleInstantWalkout}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CountryFlagBadge nationName={currentCard.nation} className="h-3.5 w-5 sm:h-4 sm:w-6 rounded-xs" />
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-steel uppercase font-stats">
                      {currentCard.nation} · {t('packs.position')}
                    </span>
                  </div>

                  <div
                    className="flex h-20 w-28 sm:h-28 sm:w-40 items-center justify-center rounded-2xl sm:rounded-3xl border-2 shadow-2xl backdrop-blur-2xl"
                    style={{
                      borderColor: currentTierStyle.accent,
                      backgroundColor: 'rgba(10, 16, 30, 0.92)',
                      boxShadow: `0 0 50px ${currentTierStyle.glow}`,
                    }}
                  >
                    <span
                      className="font-card-num text-3xl sm:text-5xl font-black uppercase"
                      style={{
                        color: currentTierStyle.highlight,
                        textShadow: `0 0 25px ${currentTierStyle.glow}`,
                      }}
                    >
                      {currentCard.position.split('/')[0]}
                    </span>
                  </div>

                  <h2 className="font-display text-lg sm:text-2xl font-bold tracking-wide text-white uppercase">
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
                  className="flex flex-col items-center gap-2.5 sm:gap-3.5 py-2 cursor-pointer"
                  onClick={handleInstantWalkout}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CountryFlagBadge nationName={currentCard.nation} className="h-3.5 w-5 sm:h-4 sm:w-6 rounded-xs" />
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-lime uppercase font-stats">
                      {currentCard.position.split('/')[0]} · {t('packs.club')}
                    </span>
                  </div>

                  <div
                    className="relative flex h-22 w-22 sm:h-38 sm:w-38 items-center justify-center rounded-full border-2 p-2.5 sm:p-4 shadow-2xl backdrop-blur-2xl"
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

                  <h2 className="font-display text-lg sm:text-2xl font-bold tracking-wide text-white uppercase drop-shadow-md">
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
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-1.5 sm:gap-2.5 py-1"
                >
                  {/* Walkout Tier Ribbon */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-0.5 sm:py-1 text-[10.5px] sm:text-xs font-bold tracking-widest uppercase shadow-xl backdrop-blur-md font-stats"
                    style={{
                      borderColor: currentTierStyle.accent,
                      backgroundColor: `${currentTierStyle.shadow}90`,
                      color: currentTierStyle.highlight,
                      boxShadow: `0 0 20px ${currentTierStyle.glow}`,
                    }}
                  >
                    {currentCard.tier === 'ICON' ? (
                      <AppIcon icon={Crown} size={13} weight="fill" />
                    ) : (
                      <AppIcon icon={Flame} size={13} weight="fill" />
                    )}
                    <span>
                      {isTopWalkout ? `${currentCard.tier} ${t('packs.walkout')}` : currentCard.tier}
                    </span>
                  </motion.div>

                  {/* High-Impact Player Card (Scales for smaller mobile screens) */}
                  <div
                    onClick={() => onInspectCard(currentCard)}
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95 my-0.5 sm:my-1"
                  >
                    {/* Mobile: scale to fit perfectly in viewport */}
                    <div className="block sm:hidden scale-90 xs:scale-100 origin-center">
                      <PlayerCard player={currentCard} size="md" />
                    </div>
                    {/* Desktop: lg size */}
                    <div className="hidden sm:block">
                      <PlayerCard player={currentCard} size="lg" />
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 sm:pt-1">
                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      type="button"
                      onClick={handleProceedNext}
                      className="btn-haptic flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-lime px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold tracking-widest text-slate-950 uppercase shadow-[0_10px_25px_rgba(142,224,0,0.35)] hover:bg-vivid transition-all cursor-pointer"
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
                      <AppIcon icon={CaretRight} size={13} weight="bold" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. STAGE: FINAL 5-CARD DOMINO OVERVIEW */}
          {/* ─────────────────────────────────────────────────────────── */}
          {mainStage === 'OVERVIEW' && (
            <motion.div
              key="stage-overview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-4xl flex-col items-center gap-2.5 sm:gap-5 py-1"
            >
              {/* Header Title */}
              <div className="flex items-center gap-2">
                <span className="text-lime text-xs sm:text-sm font-bold tracking-widest uppercase font-stats">
                  {packDisplayName} · 5 {lang === 'ar' ? 'بطاقات' : 'CARDS'}
                </span>
              </div>

              {/* 5-Card Domino Cascading Grid (Responsive 5-cols on all mobile screens) */}
              <div className="grid grid-cols-5 gap-1 sm:gap-3.5 w-full max-w-[360px] sm:max-w-3xl mx-auto py-1 sm:py-2 items-center justify-items-center">
                {orderedCards.map((player, idx) => (
                  <motion.div
                    key={`pack-domino-${player.id}-${idx}`}
                    initial={{ opacity: 0, y: 30, rotateZ: (idx - 2) * 2, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 340,
                      damping: 24,
                      delay: idx * 0.05,
                    }}
                    onClick={() => {
                      sfx.cardFlip();
                      onInspectCard(player);
                    }}
                    className="w-full flex justify-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:-translate-y-1.5 active:scale-95"
                  >
                    {/* Mobile: xs card scaled to container */}
                    <div className="block sm:hidden w-full max-w-[58px] xs:max-w-[66px]">
                      <PlayerCard player={player} size="xs" />
                    </div>
                    {/* Desktop: sm card */}
                    <div className="hidden sm:block">
                      <PlayerCard player={player} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sfx.cardDeal();
                    onOpenAgain();
                    setCurrentCardIndex(0);
                    setMainStage('UNBOXING');
                  }}
                  className="btn-haptic flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-lime px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold tracking-widest text-slate-950 uppercase shadow-lg hover:bg-vivid transition-all cursor-pointer"
                >
                  <AppIcon icon={ArrowCounterClockwise} size={14} weight="bold" />
                  <span>{t('packs.again')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="btn-haptic flex items-center gap-1.5 rounded-2xl border border-white/20 bg-slate-900/90 px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-semibold text-white hover:border-white/40 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
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
        <footer className="relative z-20 pb-2 sm:pb-3 pt-1 text-center shrink-0">
          <p className="text-[9px] sm:text-[10px] font-semibold text-steel/70 tracking-widest uppercase font-stats">
            ExtraTime Card Experience · Authentic FC Pack Opening
          </p>
        </footer>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
