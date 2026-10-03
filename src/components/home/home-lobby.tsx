'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { Plus, SignIn, ArrowRight, Database, Ranking, Vault } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { ActiveMatchBanner } from '@/components/shared/active-match-banner';
import { GAMES, HOME_GAMES, type GameId } from '@/config/games';
import { cn } from '@/lib/utils';

export type GameModeId = GameId;

interface HomeLobbyProps {
  queueCounts: {
    snipe: number;
    rank: number;
    draft: number;
    bank: number;
  };
  onPlayMode: (mode: GameModeId, variant?: 'solo' | 'public') => void;
  loading?: boolean;
}

const STATS_SLIDES = [
  { id: 'players', stat: '+5000', titleAr: 'لاعب رسمي', titleEn: 'Official Players', icon: Database, color: 'text-avatar-2-light' },
  { id: 'bank', stat: '+900', titleAr: 'سؤال بنكي', titleEn: 'Bank Questions', icon: Vault, color: 'text-avatar-3-light' },
  { id: 'rank', stat: '+250', titleAr: 'تحدي ترتيب', titleEn: 'Rank Challenges', icon: Ranking, color: 'text-avatar-4-light' },
];

/** Pulsing emerald live-status dot, anchored to the vertical middle of the right edge. */
function LivePulseDot() {
  return (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
      <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--et-success-glow)]" />
    </span>
  );
}

export function HomeLobby({ queueCounts, onPlayMode, loading }: HomeLobbyProps) {
  const { lang, t } = useI18n();
  const isRTL = lang === 'ar';
  const [activeMode, setActiveMode] = useState<GameModeId>('snipe');
  const [statIndex, setStatIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatIndex((prev) => (prev + 1) % STATS_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      data-game={activeMode}
      className="relative flex flex-col h-full w-full bg-canvas overflow-hidden selection:bg-brand/20 selection:text-foreground"
    >
      {/* 1. Stadium Lights FX (Top corners glow) */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2" />

      {/* 2. Abstract Pitch Lines Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--et-white) 1px, transparent 1px), linear-gradient(90deg, var(--et-white) 1px, transparent 1px)', backgroundSize: '120px 120px', transform: 'perspective(1000px) rotateX(70deg) scale(2)', transformOrigin: 'top center' }} />

      {/* 3. Ambient Mode Glow — follows the selected game via the data-game scope */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div key={activeMode} className="w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] rounded-full blur-[140px] opacity-40 bg-gradient-to-tr from-game-grad-from to-game-grad-to transition-all duration-1000" />
      </div>

      {/* Screen-reader accessible heading */}
      <h1 className="sr-only">ExtraTime - {t('home.heroBadge')}</h1>

      {/* Main Accordion Container (The Cards) */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-16 sm:pt-20 pb-3 sm:pb-6 flex flex-col lg:flex-row gap-2.5 sm:gap-4 relative z-10">
        {HOME_GAMES.map((modeDef) => {
          const isActive = activeMode === modeDef.id;
          const qc = queueCounts[modeDef.id] || 0;
          const ModeIcon = modeDef.icon;

          return (
            <div
              key={modeDef.id}
              onClick={() => !isActive && setActiveMode(modeDef.id)}
              className={cn(
                "group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] cursor-pointer flex flex-col lg:flex-row",
                isActive
                  ? cn("flex-1 lg:flex-[5] bg-surface shadow-2xl", "border-game-accent/50")
                  : "flex-none h-14 lg:h-auto lg:flex-1 bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
              )}
            >
              {/* Background Glow — game gradient from the data-game scope */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br from-game-grad-from to-game-grad-to opacity-0 transition-opacity duration-700",
                isActive ? "opacity-20" : "group-hover:opacity-10"
              )} />

              {/* Inactive State Content (Vertical on desktop, horizontal on mobile) */}
              <div className={cn(
                "absolute inset-0 flex flex-row lg:flex-col items-center justify-center gap-3 p-4 transition-all duration-500",
                isActive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100 delay-100"
              )}>
                <AppIcon icon={ModeIcon} size={24} className={cn("transition-colors lg:w-8 lg:h-8", isActive ? "text-foreground" : "text-muted group-hover:text-foreground")} />
                <span className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-muted group-hover:text-foreground lg:-rotate-90 whitespace-nowrap transition-colors">
                  {t(modeDef.titleKey)}
                </span>
              </div>

              {/* Active State Content */}
              <div className={cn(
                "relative flex flex-col justify-between h-full w-full p-4 sm:p-8 lg:p-12 transition-all duration-700",
                isActive ? "opacity-100 translate-y-0 lg:translate-x-0 delay-150" : "opacity-0 translate-y-8 lg:translate-y-0 lg:translate-x-8 pointer-events-none absolute"
              )}>
                {/* Top Section */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-6">
                      <div className="flex items-center justify-center w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-game-accent">
                        <AppIcon icon={ModeIcon} size={20} weight="duotone" className="sm:w-8 sm:h-8" />
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 sm:px-4 sm:py-2">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase text-foreground font-stats">
                          {qc} {isRTL ? 'في الانتظار' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-display font-black text-foreground tracking-tighter leading-none mb-1 sm:mb-4 drop-shadow-md">
                      {t(modeDef.titleKey)}
                    </h2>
                    <p className="max-w-[280px] sm:max-w-sm lg:max-w-md text-xs sm:text-base font-medium text-white/70 leading-snug sm:leading-relaxed drop-shadow-sm line-clamp-2 sm:line-clamp-none mb-2 sm:mb-0">
                      {t(modeDef.taglineKey)}
                    </p>
                  </div>

                  {/* Hub Link Arrow Button */}
                  <div className="flex items-center gap-2 z-20">
                    <Link
                      href={modeDef.href}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={isRTL ? `الانتقال إلى صالة ${t(modeDef.titleKey)}` : `Go to ${t(modeDef.titleKey)} Hub`}
                      className="btn-haptic flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 hover:border-game-accent/60 text-white/80 hover:text-foreground transition-all backdrop-blur-md group/hub text-[11px] sm:text-xs font-semibold shadow-sm"
                    >
                      <span className="hidden sm:inline font-stats uppercase tracking-wider text-[11px]">
                        {isRTL ? 'صالة اللعبة' : 'Hub'}
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 group-hover/hub:bg-game-accent group-hover/hub:text-canvas transition-colors">
                        <AppIcon icon={ArrowRight} size={13} weight="bold" className="transition-transform group-hover/hub:translate-x-0.5" />
                      </div>
                    </Link>
                  </div>

                  {/* Giant faded watermark icon */}
                  <div className={cn("hidden lg:block absolute -right-4 -top-8 opacity-10 pointer-events-none transform -rotate-12 transition-transform duration-[2s] text-game-accent", isActive ? "scale-100" : "scale-50")}>
                    <AppIcon icon={ModeIcon} size={380} weight="fill" />
                  </div>
                </div>

                {/* Bottom Section: Actions (1v1 Duel & Solo Mode) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-auto z-10 w-full sm:w-auto self-start">
                  {modeDef.id === 'snipe' || modeDef.id === 'draft' ? (
                    <button
                      onClick={() => onPlayMode(modeDef.id, 'public')}
                      disabled={loading}
                      className="group flex items-center justify-center gap-2 sm:gap-3 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl border disabled:opacity-50 w-full sm:w-auto bg-gradient-to-b from-game-accent-light to-game-accent-deep text-game-on-accent border-game-accent/50 hover:brightness-110"
                    >
                      <span className="text-xs sm:text-base uppercase tracking-wider">{isRTL ? 'مباراة عامة' : 'Public Match'}</span>
                      <AppIcon icon={ArrowRight} size={16} weight="bold" className="transition-transform group-hover:translate-x-1 sm:w-[18px]" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onPlayMode(modeDef.id, 'public')}
                        disabled={loading}
                        className="group flex items-center justify-center gap-2 sm:gap-3 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl border disabled:opacity-50 w-full sm:w-auto bg-foreground text-canvas border-foreground hover:bg-white/80"
                      >
                        <span className="text-xs sm:text-base uppercase tracking-wider">{isRTL ? 'مباراة عامة 1ضد1' : '1v1 Public'}</span>
                        <AppIcon icon={ArrowRight} size={16} weight="bold" className="transition-transform group-hover:translate-x-1 sm:w-[18px]" />
                      </button>
                      <button
                        onClick={() => onPlayMode(modeDef.id, 'solo')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 text-foreground font-bold tracking-wide transition-all bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/40 shadow-lg w-full sm:w-auto uppercase text-xs sm:text-base"
                      >
                        {isRTL ? 'لعب فردي' : 'Solo Mode'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-none px-4 sm:px-8 pb-4 sm:pb-6 z-10 max-w-7xl mx-auto w-full flex flex-col gap-2.5 sm:gap-3">
        <ActiveMatchBanner />

        {/* Bottom Action Grid: Create, Join, and Live Stats */}
        <div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3 w-full">
          {/* Create Room */}
          <Link href={GAMES.snipe.createHref} className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all group backdrop-blur-md shadow-lg">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
              <AppIcon icon={Plus} size={16} className="text-foreground sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-sm font-bold text-foreground tracking-wide leading-tight">{isRTL ? 'غرفة خاصة' : 'Create Private'}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isRTL ? 'العب مع أصدقائك' : 'Play with friends'}</span>
            </div>
          </Link>

          {/* Join Room */}
          <Link href="/join-room" className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all group backdrop-blur-md shadow-lg">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
              <AppIcon icon={SignIn} size={16} className="text-foreground sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-sm font-bold text-foreground tracking-wide leading-tight">{isRTL ? 'انضمام' : 'Join Room'}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isRTL ? 'أدخل كود الغرفة' : 'Enter PIN code'}</span>
            </div>
          </Link>

          {/* Live Stats Ticker (0 Convex DB Read) */}
          <div className="col-span-2 flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-surface border border-white/10 relative overflow-hidden group shadow-inner">
            {STATS_SLIDES.map((stat, idx) => (
              <div key={stat.id} className={cn("absolute inset-0 p-3 sm:p-5 flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)]", statIndex === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                <div className={cn("w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5", stat.color)}>
                  <AppIcon icon={stat.icon} size={16} weight="duotone" className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-black text-foreground leading-tight">{stat.stat}</span>
                  <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-widest", stat.color)}>{isRTL ? stat.titleAr : stat.titleEn}</span>
                </div>
              </div>
            ))}
            <LivePulseDot />
          </div>
        </div>
      </div>
    </div>
  );
}
