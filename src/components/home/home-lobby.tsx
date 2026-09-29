'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { Crosshair, Ranking, Lightning, Vault, Plus, SignIn, Cards, ArrowRight, Database } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { ActiveMatchBanner } from '@/components/shared/active-match-banner';
import { cn } from '@/lib/utils';

export type GameModeId = 'snipe' | 'rank' | 'draft' | 'bank';

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

const MODES = [
  { id: 'snipe' as const, icon: Crosshair, title: 'Snipe', titleAr: 'سنايب', desc: 'Outbid opponents in secret auctions to draft football legends.', descAr: 'زايد بسريّة في المزادات وتعاقد مع أساطير كرة القدم في فريقك.', color: 'from-amber-600 to-amber-900', border: 'border-amber-400/50', accent: 'text-amber-400' },
  { id: 'rank' as const, icon: Ranking, title: 'Rank', titleAr: 'رنك', desc: 'Challenge your football knowledge and order players by official stats.', descAr: 'تحدى معرفتك الكروية ورتب اللاعبين حسب الإحصائيات الرسمية.', color: 'from-cyan-600 to-cyan-900', border: 'border-cyan-400/50', accent: 'text-cyan-400' },
  { id: 'draft' as const, icon: Lightning, title: 'Draft', titleAr: 'درافت', desc: 'Build your tactical squad in a live draft competition.', descAr: 'قم ببناء تشكيلتك التكتيكية في منافسة درافت حية.', color: 'from-emerald-600 to-emerald-900', border: 'border-emerald-400/50', accent: 'text-emerald-400' },
  { id: 'bank' as const, icon: Vault, title: 'Bank', titleAr: 'بنك', desc: 'A trivia streak to risk it all or bank your points.', descAr: 'سلسلة أسئلة وأجوبة للمخاطرة أو تأمين نقاطك في البنك.', color: 'from-rose-600 to-rose-900', border: 'border-rose-400/50', accent: 'text-rose-400' },
];

const STATS_SLIDES = [
  { id: 'players', stat: '+5000', titleAr: 'لاعب رسمي', titleEn: 'Official Players', icon: Database, color: 'text-cyan-400' },
  { id: 'bank', stat: '+900', titleAr: 'سؤال بنكي', titleEn: 'Bank Questions', icon: Vault, color: 'text-amber-400' },
  { id: 'rank', stat: '+250', titleAr: 'تحدي ترتيب', titleEn: 'Rank Challenges', icon: Ranking, color: 'text-purple-400' },
];

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

  const mode = MODES.find(m => m.id === activeMode)!;

  return (
    <div className="relative flex flex-col h-full w-full bg-[#05070B] overflow-hidden selection:bg-gold/20 selection:text-white">
      
      {/* 1. Stadium Lights FX (Top corners glow) */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2" />
      
      {/* 2. Abstract Pitch Lines Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '120px 120px', transform: 'perspective(1000px) rotateX(70deg) scale(2)', transformOrigin: 'top center' }} />

      {/* 3. Ambient Mode Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
         <div key={activeMode} className={cn("w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] rounded-full blur-[140px] opacity-40 bg-gradient-to-tr transition-all duration-1000", mode.color)} />
      </div>

      {/* Top Header */}
      <header className="flex-none pt-[3.5rem] sm:pt-20 px-4 sm:px-8 pb-3 sm:pb-4 flex items-center justify-center z-10 w-full max-w-7xl mx-auto">
         <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
           Extra<span className="text-gold">Time</span>
           <span className="text-white/20 font-light hidden sm:inline">/</span> 
           <span className="text-white/60 tracking-widest text-xs uppercase hidden sm:inline">{t('home.heroBadge')}</span>
         </h1>
      </header>

      {/* Main Accordion Container (The Cards) */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-3 sm:pb-6 flex flex-col lg:flex-row gap-2.5 sm:gap-4 relative z-10">
        
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const qc = queueCounts[mode.id] || 0;

          return (
            <div
              key={mode.id}
              onClick={() => !isActive && setActiveMode(mode.id)}
              className={cn(
                "group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] cursor-pointer flex flex-col lg:flex-row",
                isActive 
                  ? cn("flex-1 lg:flex-[5] bg-[#0A0D14] shadow-2xl", mode.border) 
                  : "flex-none h-14 lg:h-auto lg:flex-1 bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
              )}
            >
              {/* Background Glow */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-700",
                isActive ? "opacity-20" : "group-hover:opacity-10",
                mode.color
              )} />

              {/* Inactive State Content (Vertical on desktop, horizontal on mobile) */}
              <div className={cn(
                "absolute inset-0 flex flex-row lg:flex-col items-center justify-center gap-3 p-4 transition-all duration-500",
                isActive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100 delay-100"
              )}>
                 <AppIcon icon={mode.icon} size={24} className={cn("transition-colors lg:w-8 lg:h-8", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                 <span className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-slate-500 group-hover:text-white lg:-rotate-90 whitespace-nowrap transition-colors">
                   {isRTL ? mode.titleAr : mode.title}
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
                        <div className={cn("flex items-center justify-center w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg", mode.accent)}>
                          <AppIcon icon={mode.icon} size={20} weight="duotone" className="sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 sm:px-4 sm:py-2">
                           <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                           <span className="text-[10px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase text-white font-stats">
                             {qc} {isRTL ? 'في الانتظار' : 'Waiting'}
                           </span>
                        </div>
                     </div>
                     <h2 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-display font-black text-white tracking-tighter leading-none mb-1 sm:mb-4 drop-shadow-md">
                       {isRTL ? mode.titleAr : mode.title}
                     </h2>
                     <p className="max-w-[280px] sm:max-w-sm lg:max-w-md text-xs sm:text-base font-medium text-slate-300 leading-snug sm:leading-relaxed drop-shadow-sm line-clamp-2 sm:line-clamp-none mb-2 sm:mb-0">
                       {isRTL ? mode.descAr : mode.desc}
                     </p>
                   </div>
                   
                   {/* Giant faded watermark icon */}
                   <div className={cn("hidden lg:block absolute -right-4 -top-8 opacity-10 pointer-events-none transform -rotate-12 transition-transform duration-[2s]", isActive ? "scale-100" : "scale-50", mode.accent)}>
                     <AppIcon icon={mode.icon} size={380} weight="fill" />
                   </div>
                </div>

                {/* Bottom Section: Actions (1v1 Duel & Solo Mode) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-auto z-10 w-full sm:w-auto self-start">
                   {mode.id === 'snipe' ? (
                     <button
                       onClick={() => onPlayMode(mode.id, 'public')}
                       disabled={loading}
                       className="group flex items-center justify-center gap-2 sm:gap-3 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl border disabled:opacity-50 w-full sm:w-auto bg-gradient-to-b from-[#F5D77F] to-[#C99824] text-slate-950 border-gold/50 hover:brightness-110"
                     >
                       <span className="text-xs sm:text-base uppercase tracking-wider">{isRTL ? 'مباراة عامة' : 'Public Match'}</span>
                       <AppIcon icon={ArrowRight} size={16} weight="bold" className="transition-transform group-hover:translate-x-1 sm:w-[18px]" />
                     </button>
                   ) : (
                     <>
                       <button
                         onClick={() => onPlayMode(mode.id, 'public')}
                         disabled={loading}
                         className="group flex items-center justify-center gap-2 sm:gap-3 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl border disabled:opacity-50 w-full sm:w-auto bg-white text-slate-950 border-white hover:bg-slate-200"
                       >
                         <span className="text-xs sm:text-base uppercase tracking-wider">{isRTL ? 'مباراة عامة 1ضد1' : '1v1 Public'}</span>
                         <AppIcon icon={ArrowRight} size={16} weight="bold" className="transition-transform group-hover:translate-x-1 sm:w-[18px]" />
                       </button>
                       <button
                         onClick={() => onPlayMode(mode.id, 'solo')}
                         disabled={loading}
                         className="flex items-center justify-center gap-2 rounded-[1rem] sm:rounded-2xl px-4 py-3 sm:px-10 sm:py-5 text-white font-bold tracking-wide transition-all bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/40 shadow-lg w-full sm:w-auto uppercase text-xs sm:text-base"
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
         
         {/* Bottom Action Grid: Create, Join, Packs, and Live Stats */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
            
            {/* Create Room */}
            <Link href="/create-room" className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all group backdrop-blur-md shadow-lg">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
                <AppIcon icon={Plus} size={16} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-sm font-bold text-white tracking-wide leading-tight">{isRTL ? 'غرفة خاصة' : 'Create Private'}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isRTL ? 'العب مع أصدقائك' : 'Play with friends'}</span>
              </div>
            </Link>

            {/* Join Room */}
            <Link href="/join-room" className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all group backdrop-blur-md shadow-lg">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
                <AppIcon icon={SignIn} size={16} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-sm font-bold text-white tracking-wide leading-tight">{isRTL ? 'انضمام' : 'Join Room'}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isRTL ? 'أدخل كود الغرفة' : 'Enter PIN code'}</span>
              </div>
            </Link>

            {/* Packs / Vault */}
            <Link href="/packs" className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-gradient-to-r from-gold/10 to-amber-500/5 border border-gold/30 hover:border-gold/50 transition-all group backdrop-blur-md shadow-[0_0_15px_rgba(229,184,66,0.1)]">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-gold/20 transition-all">
                <AppIcon icon={Cards} size={16} className="text-gold sm:w-5 sm:h-5" weight="fill" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-sm font-bold text-gold tracking-wide leading-tight">{isRTL ? 'الباكات' : 'Packs Vault'}</span>
                <span className="text-[10px] text-gold/60 uppercase tracking-widest mt-0.5">{isRTL ? 'مجموعة بطاقاتك' : 'Your collection'}</span>
              </div>
            </Link>

            {/* Live Stats Ticker (0 Convex DB Read) */}
            <div className="flex items-center justify-center sm:justify-start gap-3 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-2xl bg-[#0A0D14] border border-white/10 relative overflow-hidden group shadow-inner">
               {STATS_SLIDES.map((stat, idx) => (
                  <div key={stat.id} className={cn("absolute inset-0 p-3 sm:p-5 flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)]", statIndex === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                     <div className={cn("w-8 h-8 sm:w-12 sm:h-12 rounded-[0.6rem] sm:rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5", stat.color)}>
                        <AppIcon icon={stat.icon} size={16} weight="duotone" className="sm:w-5 sm:h-5" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-black text-white leading-tight">{stat.stat}</span>
                        <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-widest", stat.color)}>{isRTL ? stat.titleAr : stat.titleEn}</span>
                     </div>
                  </div>
               ))}
               <div className="absolute top-2 right-2 flex gap-1">
                 <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
