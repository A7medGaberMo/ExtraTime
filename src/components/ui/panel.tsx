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
    default: 'border-white/10 bg-slate-900/90 shadow-xl backdrop-blur-xl',
    elevated: 'border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl',
    highlight: 'border-white/12 bg-slate-900/95 shadow-xl backdrop-blur-2xl',
    subtle: 'border-white/6 bg-slate-950/70 shadow-md backdrop-blur-md',
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

