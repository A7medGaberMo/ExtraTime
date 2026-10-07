'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { ArrowRight, ArrowLeft, CircleNotch } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';

export interface PrimaryActionButtonProps {
  id?: string;
  title: string;
  subtitle: string;
  loadingTitle?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PrimaryActionButton({
  id = 'hub-public-match-btn',
  title,
  subtitle,
  loadingTitle,
  onClick,
  loading = false,
  disabled = false,
  className,
}: PrimaryActionButtonProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';

  return (
    <div className="w-full">
      <button
        type="button"
        id={id}
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          'hub-cta-btn group relative flex h-14 w-full items-center justify-between overflow-hidden rounded-2xl border px-5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait sm:h-[58px] sm:px-6',
          className,
        )}
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent-light) 60%, transparent)',
          outlineColor: 'var(--hub-accent)',
        }}
      >
        {/* Shine Sweep Overlay */}
        <span
          className="hub-cta-shine pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-reduce:hidden"
          aria-hidden="true"
        />

        {/* Indeterminate progress bar while matchmaking */}
        {loading && <span className="hub-cta-progress" aria-hidden="true" />}

        <div className="relative z-10 flex w-full items-center justify-between text-[#07090F]">
          {loading ? (
            <div className="flex w-full items-center justify-center gap-2" role="status">
              <AppIcon
                icon={CircleNotch}
                size={20}
                weight="bold"
                className="animate-spin text-[#07090F]"
              />
              <span className="hub-cta-text text-[15px] leading-tight sm:text-base">
                {loadingTitle || title}
              </span>
            </div>
          ) : (
            <>
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="hub-cta-text text-[15px] leading-tight sm:text-base">
                  {title}
                </span>
                <span className="hub-cta-sub text-[11px] leading-tight font-semibold text-[#07090F]/65 sm:text-xs">
                  {subtitle}
                </span>
              </span>
              <span className="hub-cta-arrow flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#07090F]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <AppIcon
                  icon={isRtl ? ArrowLeft : ArrowRight}
                  size={18}
                  weight="bold"
                  style={{ color: 'var(--hub-accent-light)' }}
                />
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
