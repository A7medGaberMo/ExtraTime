'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'accent' | 'gold' | 'lime' | 'amber' | 'sky' | 'cyan' | 'emerald' | 'rose' | 'muted';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  label?: string;
  value?: string | number | React.ReactNode;
}

/**
 * Stat pill. Every colored variant resolves to the current game accent
 * (nearest [data-game] scope); 'muted' is the neutral Layer 1 style.
 */
export function StatPill({
  className,
  variant = 'gold',
  size = 'md',
  icon,
  label,
  value,
  children,
  ...props
}: StatPillProps) {
  const accent = variant !== 'muted';
  const variantStyles = accent
    ? 'border-game-accent/30 bg-game-accent/10 text-game-accent-light shadow-[inset_0_1px_0_0_var(--game-glow)]'
    : 'border-white/10 bg-white/[0.04] text-muted shadow-[inset_0_1px_0_0_var(--et-hi-06)]';

  const sizeStyles = {
    sm: 'gap-1 rounded-lg px-2 py-0.5 text-[11px]',
    md: 'gap-1.5 rounded-full px-3 py-1 text-xs',
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center border font-medium select-none tracking-tight',
        variantStyles,
        sizeStyles,
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label && <span className="opacity-90">{label}</span>}
      {value !== undefined && <span className="font-stats font-bold">{value}</span>}
      {children}
    </div>
  );
}
