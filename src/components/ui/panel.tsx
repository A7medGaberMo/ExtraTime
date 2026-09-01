'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'highlight' | 'subtle';
  glowColor?: string;
  hasAmbientLight?: boolean;
}

export function Panel({
  className,
  variant = 'default',
  glowColor,
  hasAmbientLight = false,
  children,
  style,
  ...props
}: PanelProps) {
  const variantStyles = {
    default:
      'border-white/[0.12] bg-slate-900/85 shadow-[0_16px_36px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-2xl',
    elevated:
      'border-white/[0.16] bg-slate-900/92 shadow-[0_24px_56px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-3xl',
    highlight:
      'border-white/[0.14] bg-slate-900/90 shadow-[0_20px_48px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.14)] backdrop-blur-2xl',
    subtle:
      'border-white/[0.08] bg-slate-950/70 shadow-[0_8px_20px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl',
  }[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border transition-all duration-200',
        variantStyles,
        className,
      )}
      style={{
        ...style,
        ...(glowColor ? { boxShadow: `0 0 32px ${glowColor}` } : {}),
      }}
      {...props}
    >
      {hasAmbientLight && (
        <div className="bg-lime/5 pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
      )}
      {children}
    </div>
  );
}

