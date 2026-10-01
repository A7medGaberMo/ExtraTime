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
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
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
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <article
      className={cn(
        'animate-fade-in relative mx-auto flex w-full flex-col gap-2 sm:gap-3.5 px-1 sm:px-0 overflow-x-clip items-center',
        maxWidthClass,
        className,
      )}
    >
      {hasAmbientLight && (
        <div className="pointer-events-none absolute -top-14 left-1/2 h-[160px] sm:h-[220px] w-[280px] sm:w-[460px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,var(--game-glow)_0%,transparent_75%)] blur-[70px]" />
      )}

      {(title || backUrl || badge) && (
        <header className="relative z-10 flex w-full flex-col items-center text-center gap-1 sm:gap-1.5 pt-0">
          {backUrl && (
            <div className="w-full flex justify-start">
              <Link
                href={backUrl}
                className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface/80 px-2.5 py-0.5 text-xs font-medium text-muted shadow-[0_4px_12px_var(--et-shade-40),inset_0_1px_0_0_var(--et-hi-06)] backdrop-blur-xl hover:border-game-accent/40 hover:text-foreground transition-all cursor-pointer"
              >
                <AppIcon icon={ArrowLeft} size={13} weight="bold" className="rtl:rotate-180" />
                <span>{t('common.back')}</span>
              </Link>
            </div>
          )}

          {badge && <div className="flex justify-center">{badge}</div>}

          {title && (
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground uppercase font-display leading-tight text-center">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="text-muted text-[11px] sm:text-xs font-normal leading-relaxed max-w-md lg:max-w-lg text-center mx-auto">
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div className="relative z-10 w-full space-y-2.5 sm:space-y-3.5">{children}</div>
    </article>
  );
}
