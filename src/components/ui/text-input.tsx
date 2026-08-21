'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badge?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      label,
      badge,
      leftIcon,
      rightAction,
      error,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn('space-y-1.5 w-full', containerClassName)}>
        {(label || badge) && (
          <div className="flex items-center justify-between gap-2 px-1">
            {label && (
              <label className="text-steel text-[10px] font-black tracking-widest uppercase">
                {label}
              </label>
            )}
            {badge && (
              <span className="text-lime text-[10px] font-black tracking-widest uppercase">
                {badge}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center gap-2">
          {leftIcon && (
            <div className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-steel">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm sm:text-base font-bold text-white placeholder:text-steel/60 transition-all outline-none focus:border-lime/70 focus:ring-2 focus:ring-lime/20 disabled:opacity-40 min-h-[48px]',
              leftIcon && 'ps-11',
              rightAction && 'pe-14',
              error && 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20',
              className,
            )}
            {...props}
          />

          {rightAction && (
            <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightAction}
            </div>
          )}
        </div>

        {error && (
          <p className="text-rose-400 text-xs font-semibold px-1 animate-slide-down">
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';
