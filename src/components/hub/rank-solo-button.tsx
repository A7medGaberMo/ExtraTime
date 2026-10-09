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
  subtitle?: string; // Kept for interface compatibility but not rendered
}

export function HubSoloButton({
  id = 'hub-solo-btn',
  onClick,
  disabled = false,
  loading = false,
  className,
  title,
}: HubSoloButtonProps) {
  const { t } = useI18n();
  const label = title || t('rankHub.playSolo');
  const isDisabled = disabled || loading;

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        'hub-solo-tile btn-haptic group relative flex h-full w-[76px] shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2',
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
      {/* Action Play Circle: 30px circle */}
      <span
        className="hub-solo-icon-circle relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
        style={{
          border: '1px solid color-mix(in srgb, var(--hub-accent) 40%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--hub-accent) 14%, transparent)',
          color: 'var(--hub-accent)',
        }}
      >
        {loading ? (
          <AppIcon
            icon={CircleNotch}
            size={14}
            className="animate-spin"
            style={{ color: 'var(--hub-accent)' }}
          />
        ) : (
          <AppIcon icon={Play} size={14} weight="fill" className="ms-0.5" />
        )}
      </span>

      {/* Label: 14px bold (no subtitle) */}
      <span className="hub-solo-label relative z-10 text-[14px] font-bold text-white leading-tight">
        {label}
      </span>
    </button>
  );
}

// Backwards compatibility aliases
export const RankSoloTile = HubSoloButton;
export const RankSoloButton = HubSoloButton;
export type RankSoloTileProps = HubSoloButtonProps;
export type RankSoloButtonProps = HubSoloButtonProps;
