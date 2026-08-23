'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'lime' | 'amber' | 'sky' | 'rose' | 'muted';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  label?: string;
  value?: string | number | React.ReactNode;
}

export function StatPill({
  className,
  variant = 'lime',
  size = 'md',
  icon,
  label,
  value,
  children,
  ...props
}: StatPillProps) {
  const variantStyles = {
    lime: 'border-lime/30 bg-lime/10 text-lime',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    sky: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    muted: 'border-white/10 bg-slate-900/80 text-steel',
  }[variant];

  const sizeStyles = {
    sm: 'gap-1 rounded-lg px-2 py-0.5 text-xs',
    md: 'gap-1.5 rounded-full px-3 py-1 text-xs',
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center border font-semibold',
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

