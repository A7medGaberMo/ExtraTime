'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crosshair,
  Ranking,
  Lightning,
  Vault,
  Play,
  Compass,
  PlusCircle,
  SignIn,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export type GameModeId = 'snipe' | 'rank' | 'draft' | 'bank';

interface GameModeCardProps {
  id: GameModeId;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  specLabel: string;
  queueCount?: number;
  loading?: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  createHref: string;
  joinHref?: string;
  className?: string;
}

export function GameModeCard({
  id,
  title,
  subtitle,
  description,
  badge,
  specLabel,
  queueCount = 0,
  loading = false,
  onPrimaryAction,
  onSecondaryAction,
  createHref,
  joinHref = '/join-room',
  className,
}: GameModeCardProps) {
  const { lang, t } = useI18n();

  const config = {
    snipe: {
      icon: Crosshair,
      accentBorder: 'border-gold/30 hover:border-gold/60',
      iconBox: 'border-gold/40 bg-gold/10 text-gold shadow-[0_0_16px_rgba(229,184,66,0.18)]',
      badgeClass: 'border-gold/30 bg-gold/10 text-gold',
      buttonVariant: 'primary' as const,
      glowColor: 'bg-gold/10',
      primaryLabel: lang === 'ar' ? 'العب ماتش عام' : 'Enter Public Arena',
    },
    rank: {
      icon: Ranking,
      accentBorder: 'border-amber-400/25 hover:border-amber-400/50',
      iconBox: 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.18)]',
      badgeClass: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      buttonVariant: 'gold' as const,
      glowColor: 'bg-amber-400/10',
      primaryLabel: lang === 'ar' ? 'تحدي فردي' : 'Play Solo Sprint',
      secondaryLabel: lang === 'ar' ? 'مواجهة 1v1' : '1v1 Duel',
    },
    draft: {
      icon: Lightning,
      accentBorder: 'border-cyan-400/25 hover:border-cyan-400/50',
      iconBox: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.18)]',
      badgeClass: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
      buttonVariant: 'cyan' as const,
      glowColor: 'bg-cyan-400/10',
      primaryLabel: lang === 'ar' ? 'تحدي فردي' : 'Solo Challenge',
      secondaryLabel: lang === 'ar' ? 'ديربي 1v1' : '1v1 Duel',
    },
    bank: {
      icon: Vault,
      accentBorder: 'border-emerald-500/25 hover:border-emerald-500/50',
      iconBox: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.18)]',
      badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      buttonVariant: 'emerald' as const,
      glowColor: 'bg-emerald-500/10',
      primaryLabel: lang === 'ar' ? 'ابدأ التحدي' : 'Play Solo Sprint',
      secondaryLabel: lang === 'ar' ? 'مواجهة 1v1' : '1v1 Duel',
    },
  }[id];

  const IconComp = config.icon;

  return (
    <div
      className={cn(
        'luxury-glass group relative flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-6 lg:p-7 rounded-3xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden',
        config.accentBorder,
        className,
      )}
    >
      {/* Ambient Corner Atmosphere */}
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-30 transition-transform duration-500 group-hover:scale-125',
          config.glowColor,
        )}
      />

      {/* Top End Spec Tag */}
      <div className="absolute top-4 end-4 sm:top-5 sm:end-6 z-10 pointer-events-none">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold font-stats backdrop-blur-md',
            config.badgeClass,
          )}
        >
          {badge}
        </span>
      </div>

      {/* Left Column: Icon & Identity */}
      <div className="relative flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center gap-3.5 pe-16 sm:pe-0">
          <div
            className={cn(
              'flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105',
              config.iconBox,
            )}
          >
            <AppIcon icon={IconComp} size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white truncate">
              {title}
            </h2>
            <span className="text-xs font-medium text-steel block truncate">
              {subtitle}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-[13px] font-normal leading-relaxed text-slate-300 max-w-xl">
          {description}
        </p>

        {/* Technical Specification Bar */}
        <div className="flex items-center gap-2 pt-0.5 text-[11px] text-steel font-stats">
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span className="truncate">{specLabel}</span>
          {queueCount > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="font-medium text-white">
                {queueCount} {lang === 'ar' ? 'في الطابور' : 'in queue'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Single Primary CTA & Secondary Action Links */}
      <div className="relative w-full md:w-64 lg:w-72 shrink-0 space-y-2.5 pt-3 md:pt-0 border-t md:border-t-0 md:border-s border-white/8 md:ps-6 flex flex-col justify-center">
        {onSecondaryAction && config.secondaryLabel ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={config.buttonVariant}
              size="md"
              fullWidth
              onClick={onPrimaryAction}
              disabled={loading}
              leftIcon={<AppIcon icon={Play} size={15} weight="fill" />}
              className="text-xs font-bold rounded-xl h-11 !px-2.5"
            >
              {config.primaryLabel}
            </Button>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={onSecondaryAction}
              disabled={loading}
              leftIcon={<AppIcon icon={Compass} size={15} weight="bold" />}
              className="text-xs font-bold rounded-xl h-11 !px-2.5"
            >
              {config.secondaryLabel}
            </Button>
          </div>
        ) : (
          <Button
            variant={config.buttonVariant}
            size="md"
            fullWidth
            onClick={onPrimaryAction}
            disabled={loading}
            leftIcon={<AppIcon icon={Play} size={16} weight="fill" />}
            className="text-xs sm:text-sm font-bold rounded-xl h-11"
            rightIcon={
              queueCount > 0 ? (
                <span className="rounded-full bg-slate-950/30 px-2 py-0.5 font-stats text-[10px] text-slate-950 font-bold">
                  {queueCount}
                </span>
              ) : undefined
            }
          >
            {config.primaryLabel}
          </Button>
        )}

        {/* Quiet Sub-Actions */}
        <div className="flex items-center justify-between px-1 text-[11px] font-medium text-steel">
          <Link
            href={createHref}
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <AppIcon icon={PlusCircle} size={13} weight="bold" />
            <span>{t('home.snipeCard.createCustom')}</span>
          </Link>
          <Link
            href={joinHref}
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <AppIcon icon={SignIn} size={13} weight="bold" />
            <span>{t('home.snipeCard.joinWithCode')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
