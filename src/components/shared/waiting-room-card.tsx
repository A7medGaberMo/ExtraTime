'use client';

import React, { useState } from 'react';
import { Copy, Check, CircleNotch, ArrowLeft } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { cn } from '@/lib/utils';

export interface WaitingRoomCardProps {
  code: string;
  title?: string;
  subtitle?: string;
  themeColor?: 'lime' | 'amber' | 'cyan';
  icon?: React.ReactNode;
  onCancel?: () => void;
  cancelLabel?: string;
  subNotice?: string;
  className?: string;
}

export function WaitingRoomCard({
  code,
  title,
  subtitle,
  themeColor = 'lime',
  icon,
  onCancel,
  cancelLabel,
  subNotice,
  className,
}: WaitingRoomCardProps) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    sfx.tap();
    setTimeout(() => setCopied(false), 2000);
  };

  const themeStyles = {
    lime: {
      border: 'border-lime/30',
      bg: 'bg-lime/10',
      text: 'text-lime',
      glow: 'shadow-[0_0_16px_rgba(149,232,16,0.2)]',
    },
    amber: {
      border: 'border-amber-400/30',
      bg: 'bg-amber-400/10',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_16px_rgba(251,191,36,0.2)]',
    },
    cyan: {
      border: 'border-cyan-400/30',
      bg: 'bg-cyan-400/10',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_16px_rgba(0,240,255,0.2)]',
    },
  }[themeColor];

  return (
    <Panel
      variant="highlight"
      className={cn(
        'p-5 sm:p-6 text-center space-y-4 max-w-sm sm:max-w-md w-full mx-auto animate-scale-in',
        themeStyles.glow,
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'flex h-12 w-12 mx-auto items-center justify-center rounded-2xl border',
            themeStyles.border,
            themeStyles.bg,
            themeStyles.text,
          )}
        >
          {icon}
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display">
          {title || t('lobby.waitingOpponent')}
        </h2>
        <p className="text-steel text-xs font-medium max-w-sm mx-auto leading-relaxed">
          {subtitle ||
            (lang === 'ar'
              ? 'شارك هذا الكود مع منافسك لبدء المواجهة:'
              : 'Share this code with your rival to connect:')}
        </p>
      </div>

      {/* Code Card with Copy Action */}
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/90 p-3 sm:p-4">
        <span className="text-steel text-[9px] font-black tracking-widest uppercase font-stats">
          {t('joinRoom.roomCode')}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'font-stats text-2xl sm:text-3xl font-black tracking-[0.24em] pl-1',
              themeStyles.text,
            )}
          >
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy Room Code"
            title="Copy Room Code"
            className={cn(
              'btn-haptic flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-steel hover:text-white transition-colors cursor-pointer',
              copied ? themeStyles.border : '',
            )}
          >
            <AppIcon
              icon={copied ? Check : Copy}
              size={18}
              weight="bold"
              className={copied ? themeStyles.text : ''}
            />
          </button>
        </div>
      </div>

      {/* Waiting Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-steel">
        <AppIcon icon={CircleNotch} size={16} weight="bold" className={cn('animate-spin', themeStyles.text)} />
        <span>{subNotice || t('lobby.waitingOpponent')}</span>
      </div>

      {/* Cancel Match Action */}
      {onCancel && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-steel hover:text-white"
            leftIcon={<AppIcon icon={ArrowLeft} size={14} weight="bold" />}
          >
            {cancelLabel || t('auction.waitingOverlay.cancelMatch')}
          </Button>
        </div>
      )}
    </Panel>
  );
}
