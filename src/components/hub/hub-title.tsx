'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export interface HubTitleProps {
  title: string;
  subtitle: string;
  className?: string;
}

export function HubTitle({ title, subtitle, className }: HubTitleProps) {
  const { lang } = useI18n();

  return (
    <div className={cn('hub-zone-hero flex w-full shrink-0 flex-col items-center pt-0.5 text-center', className)}>
      {/* Main Game Title */}
      <div className="hub-stagger-2 flex items-center justify-center">
        <h2 className="hub-title hub-title-sheen mt-1.5 leading-none drop-shadow-lg">
          {title}
        </h2>
      </div>

      {/* Subtitle */}
      <div className="hub-stagger-3 mt-2 sm:mt-2.5 w-full max-w-[360px] sm:max-w-[420px] h-[38px] sm:h-[42px] flex items-center justify-center">
        <p
          className="hub-body text-[13px] sm:text-[14px] leading-[1.38] font-normal text-balance whitespace-pre-line text-[#C5CAD6]"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
