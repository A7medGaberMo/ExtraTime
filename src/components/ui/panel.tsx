'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'highlight' | 'subtle';
  hasAmbientLight?: boolean;
}

export function Panel({
  className,
  variant = 'default',
  hasAmbientLight = false,
  children,
  style,
  ...props
}: PanelProps) {
  const variantStyles = {
    default:
      'border-white/[0.12] bg-surface/85 shadow-[0_16px_36px_var(--et-shade-65),inset_0_1px_0_0_var(--et-hi-12)] backdrop-blur-2xl',
    elevated:
      'border-white/[0.16] bg-surface/92 shadow-[0_24px_56px_var(--et-shade-75),inset_0_1px_0_0_var(--et-hi-15)] backdrop-blur-3xl',
    highlight:
      'border-white/[0.14] bg-surface/90 shadow-[0_20px_48px_var(--et-shade-70),inset_0_1px_0_0_var(--et-hi-14)] backdrop-blur-2xl',
    subtle:
      'border-white/[0.08] bg-canvas/70 shadow-[0_8px_20px_var(--et-shade-45),inset_0_1px_0_0_var(--et-hi-06)] backdrop-blur-xl',
  }[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border transition-all duration-200',
        variantStyles,
        className,
      )}
      style={style}
      {...props}
    >
      {hasAmbientLight && (
        <div className="bg-game-accent/5 pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
      )}
      {children}
    </div>
  );
}
