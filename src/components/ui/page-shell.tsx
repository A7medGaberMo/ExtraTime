'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { AppIcon } from './app-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  backUrl?: string;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
  className?: string;
  hasAmbientLight?: boolean;
}

export function PageShell({
  children,
  title,
  subtitle,
  badge,
  backUrl,
  maxWidth = '2xl',
  className,
  hasAmbientLight = true,
}: PageShellProps) {
  const { t } = useI18n();

  const maxWidthClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  }[maxWidth];

  return (
    <article
      className={cn(
        'animate-fade-in relative mx-auto flex w-full flex-col gap-4 sm:gap-6 px-1 sm:px-0 overflow-x-clip items-center',
        maxWidthClass,
        className,
      )}
    >
      {hasAmbientLight && (
        <div className="from-lime/10 pointer-events-none absolute -top-12 left-1/2 h-[200px] sm:h-[260px] w-[320px] sm:w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-r via-sky-500/10 to-amber-500/10 blur-[90px] sm:blur-[130px]" />
      )}

      {(title || backUrl || badge) && (
        <header className="relative z-10 flex w-full flex-col items-center text-center gap-2 pt-1">
          {backUrl && (
            <div className="w-full flex justify-start">
              <Link
                href={backUrl}
                className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-slate-900/85 px-3.5 py-1 text-xs font-semibold text-steel shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:border-lime/40 hover:text-white transition-all mb-1 cursor-pointer"
              >
                <AppIcon icon={ArrowLeft} size={14} weight="bold" />
                <span>{t('common.back')}</span>
              </Link>
            </div>
          )}

          {badge && <div className="flex justify-center">{badge}</div>}

          {title && (
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white uppercase font-display leading-tight text-center">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="text-steel text-xs sm:text-sm font-medium leading-relaxed max-w-xl text-center mx-auto">
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div className="relative z-10 w-full space-y-4">{children}</div>
    </article>
  );
}
