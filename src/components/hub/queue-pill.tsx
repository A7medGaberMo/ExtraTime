'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { CircleNotch } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';

export interface QueuePillProps {
  loading?: boolean;
  waitingCount: number;
  loadingText: string;
  emptyText: string;
  liveLabel?: string;
  liveSuffix?: string;
  className?: string;
}

export function QueuePill({
  loading = false,
  waitingCount,
  loadingText,
  emptyText,
  liveLabel = 'Live',
  liveSuffix = 'in queue',
  className,
}: QueuePillProps) {
  const { lang } = useI18n();

  const formattedCount = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(
    waitingCount,
  );

  return (
    <div
      data-hub-queue-pill
      className={cn(
        'hub-live-pill inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3.5 text-center font-medium text-[#D7DAE1] shadow-sm',
        className,
      )}
      style={{
        height: 'var(--hub-pill-height)',
        width: 'var(--hub-pill-width)',
        marginBottom: 'var(--hub-gap-pill-row1)',
        borderColor: 'color-mix(in srgb, var(--hub-accent) 22%, rgba(255, 255, 255, 0.08))',
        boxShadow: '0 0 20px color-mix(in srgb, var(--hub-accent) 8%, transparent)',
      }}
      aria-live="polite"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {loading ? (
        <>
          <AppIcon
            icon={CircleNotch}
            size={13}
            weight="bold"
            className="shrink-0 animate-spin"
            style={{ color: 'var(--hub-accent)' }}
          />
          <span className="text-[#9AA0AE] truncate">{loadingText}</span>
        </>
      ) : waitingCount === 0 ? (
        <>
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: 'var(--hub-accent)',
              boxShadow: '0 0 6px var(--hub-accent)',
            }}
            aria-hidden="true"
          />
          <span className="font-semibold text-[#F5F5F7] truncate">{emptyText}</span>
        </>
      ) : (
        <>
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            <span
              className="hub-live-ping absolute inset-0 rounded-full"
              style={{ backgroundColor: 'var(--hub-accent)' }}
            />
            <span
              className="relative size-2 rounded-full"
              style={{
                backgroundColor: 'var(--hub-accent)',
                boxShadow: '0 0 8px var(--hub-accent)',
              }}
            />
          </span>
          <span className="font-semibold text-[#F5F5F7] shrink-0">{liveLabel}</span>
          <span className="text-white/25 shrink-0" aria-hidden="true">
            ·
          </span>
          <bdi
            className="font-semibold tabular-nums shrink-0"
            style={{ color: 'var(--hub-accent-light)' }}
            dir="ltr"
          >
            {formattedCount}
          </bdi>
          <span className="truncate">{liveSuffix}</span>
        </>
      )}
    </div>
  );
}
