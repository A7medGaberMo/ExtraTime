'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gold' | 'lime' | 'amber' | 'sky' | 'cyan' | 'emerald' | 'rose' | 'muted';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  label?: string;
  value?: string | number | React.ReactNode;
}

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
  const variantStyles = {
    gold: 'border-gold/30 bg-gold/10 text-gold-light shadow-[inset_0_1px_0_0_rgba(245,215,127,0.2)]',
    lime: 'border-gold/30 bg-gold/10 text-gold-light shadow-[inset_0_1px_0_0_rgba(245,215,127,0.2)]',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.18)]',
    sky: 'border-sky-400/30 bg-sky-400/10 text-sky-300 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.18)]',
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[inset_0_1px_0_0_rgba(0,240,255,0.18)]',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.18)]',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.18)]',
    muted: 'border-white/10 bg-white/[0.04] text-steel shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
  }[variant];

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
