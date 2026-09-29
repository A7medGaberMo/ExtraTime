'use client';

import Link from 'next/link';
import { WarningCircle, House } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';

export default function NotFound() {
  const { lang, isRTL } = useI18n();

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="animate-fade-in flex h-[100dvh] max-h-[100dvh] w-full items-center justify-center bg-slate-950 p-4 select-none overflow-hidden"
    >
      <div className="flex w-full max-w-sm flex-col items-center space-y-5 rounded-3xl border border-gold/25 bg-slate-900/80 p-6 sm:p-8 text-center backdrop-blur-xl shadow-2xl shadow-black/80">
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-gold shadow-lg shadow-gold/10">
          <AppIcon icon={WarningCircle} size={42} weight="duotone" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-display">
            {lang === 'ar' ? 'تسلل واضح!' : 'Offside!'}
          </h1>
          <p className="text-xs sm:text-sm text-steel font-medium leading-relaxed">
            {lang === 'ar'
              ? 'يبدو أنك تجاوزت خط المدافع الأخير. هذه الصفحة غير موجودة.'
              : "Looks like you've strayed past the last defender. This page doesn't exist."}
          </p>
        </div>

        <div className="w-full pt-2">
          <Link
            href="/"
            className="btn-haptic flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3 text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider shadow-[0_0_20px_rgba(229,184,66,0.3)] transition-all duration-200 hover:brightness-110 active:scale-95"
          >
            <AppIcon icon={House} size={18} weight="bold" />
            <span>{lang === 'ar' ? 'العودة للساحة الرئيسية' : 'Return to Arena'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
