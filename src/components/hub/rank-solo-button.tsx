'use client';

import React from 'react';
import { Play, CircleNotch } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface HubSoloButtonProps {
  id?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function HubSoloButton({
  id = 'hub-solo-btn',
  onClick,
  disabled = false,
  loading = false,
  className,
  title,
  subtitle,
}: HubSoloButtonProps) {
  const { t } = useI18n();
  const label = title || t('rankHub.playSolo');
  const sub = subtitle || t('rankHub.playSoloSub');
  const isDisabled = disabled || loading;

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`${label} - ${sub}`}
      className={cn(
        'hub-solo-tile btn-haptic group relative flex h-full items-center justify-between overflow-hidden rounded-[22px] sm:rounded-[24px] border px-2.5 sm:px-4 text-start transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2',
        isDisabled && 'pointer-events-none opacity-60',
        className,
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--hub-accent) 45%, transparent)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 10px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(14px) saturate(130%)',
        WebkitBackdropFilter: 'blur(14px) saturate(130%)',
      }}
    >
      {/* Title & Subtitle Cluster */}
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-0.5 pe-1">
        <span className="hub-solo-title truncate text-[13px] sm:text-[14.5px] font-bold text-white leading-tight tracking-tight">
          {label}
        </span>
        <span className="hub-solo-sub truncate text-[10px] sm:text-[11px] font-medium text-[#C5CAD6]/75 leading-tight">
          {sub}
        </span>
      </div>

      {/* Action Play Circle */}
      <span
        className="hub-solo-icon relative z-10 flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
        style={{
          border: '1px solid color-mix(in srgb, var(--hub-accent) 40%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--hub-accent) 14%, transparent)',
          color: 'var(--hub-accent)',
        }}
      >
        {loading ? (
          <AppIcon
            icon={CircleNotch}
            size={13}
            className="animate-spin"
            style={{ color: 'var(--hub-accent)' }}
          />
        ) : (
          <AppIcon icon={Play} size={13} weight="fill" className="ms-0.5" />
        )}
      </span>
    </button>
  );
}

// Backwards compatibility aliases
export const RankSoloTile = HubSoloButton;
export const RankSoloButton = HubSoloButton;
export type RankSoloTileProps = HubSoloButtonProps;
export type RankSoloButtonProps = HubSoloButtonProps;
