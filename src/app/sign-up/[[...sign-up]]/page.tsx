'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignUp } from '@clerk/nextjs';
import { AppIcon } from '@/components/ui/app-icon';
import { ArrowLeft, ShieldCheck, Trophy, Sparkle } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';

export default function SignUpPage() {
  const { lang, isRTL } = useI18n();

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 py-8 select-none">
      {/* Dynamic Stadium Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] sm:h-[450px] w-[350px] sm:w-[550px] rounded-full bg-gradient-to-r from-lime/15 via-emerald-500/10 to-amber-500/10 blur-[100px] sm:blur-[140px]" />

      {/* Back to Arena Button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="btn-haptic inline-flex items-center gap-2 text-xs font-bold text-steel hover:text-white transition-colors font-stats"
        >
          <AppIcon icon={ArrowLeft} size={15} weight="bold" className={isRTL ? 'rotate-180' : ''} />
          <span>{lang === 'ar' ? 'العودة للرئيسية' : 'Back to Arena'}</span>
        </Link>

        <div className="flex items-center gap-1.5 rounded-full bg-lime/10 border border-lime/30 px-2.5 py-0.5 text-lime text-[11px] font-bold font-stats">
          <AppIcon icon={ShieldCheck} size={13} weight="bold" />
          <span>ExtraTime Auth</span>
        </div>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6 z-10 space-y-1.5">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-lime/50 shadow-glow-lime">
            <Image
              src="/ETIcon.png"
              alt="ExtraTime"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Extra<span className="text-lime">Time</span>
          </span>
        </div>
        <p className="text-xs text-steel max-w-xs mx-auto">
          {lang === 'ar'
            ? 'أنشئ حسابك الجديد وانضم إلى عالم التحديات الكروية التكتيكية.'
            : 'Create your manager account to duel rivals and build your football legacy.'}
        </p>
      </div>

      {/* Clerk SignUp Component Container */}
      <div className="relative z-10 w-full max-w-md flex justify-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>

      {/* Feature Highlights Footer */}
      <div className="mt-8 grid grid-cols-2 gap-3 max-w-md w-full z-10">
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/60 p-2.5 backdrop-blur-md">
          <AppIcon icon={Trophy} size={18} weight="duotone" className="text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white font-stats">Career Stats</div>
            <div className="text-[10px] text-steel truncate">Track rank & win rate</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/60 p-2.5 backdrop-blur-md">
          <AppIcon icon={Sparkle} size={18} weight="duotone" className="text-lime shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white font-stats">Custom Badges</div>
            <div className="text-[10px] text-steel truncate">Club crests & avatars</div>
          </div>
        </div>
      </div>
    </div>
  );
}
