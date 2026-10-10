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
    <>
      {/* ── Main Game Title (Fixed Height, One Line) ── */}
      <div
        data-hub-title
        className={cn('flex w-full shrink-0 items-center justify-center text-center', className)}
        style={{
          height: 'var(--hub-title-height)',
          marginBottom: 'var(--hub-gap-title-subtitle)',
        }}
      >
        <h2 className="hub-title hub-title-sheen leading-none drop-shadow-lg">
          {title}
        </h2>
      </div>

      {/* ── Subtitle (Fixed Height, Exactly 2 Lines Reserved) ── */}
      <div
        data-hub-subtitle
        className="hub-subtitle-slot flex w-full max-w-[360px] sm:max-w-[420px] shrink-0 items-center justify-center text-center mx-auto"
        style={{
          height: 'var(--hub-subtitle-height)',
          marginBottom: 'var(--hub-gap-subtitle-visual)',
        }}
      >
        <p
          className="hub-body leading-[1.4] font-normal text-balance whitespace-pre-line text-[#C5CAD6] line-clamp-2"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {subtitle}
        </p>
      </div>
    </>
  );
}
