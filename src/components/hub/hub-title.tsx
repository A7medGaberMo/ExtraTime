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
      <div className="hub-stagger-3 mt-3 w-full max-w-[280px] sm:max-w-[310px]">
        <p
          className="hub-body text-[13px] leading-snug font-normal text-balance text-[#C5CAD6] sm:text-[14.5px]"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
