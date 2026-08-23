'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badge?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, badge, hint, error, leftIcon, rightIcon, rightAction, ...props }, ref) => {
    const badgeText = badge || hint;
    const actionElement = rightAction || rightIcon;

    return (
      <div className="w-full space-y-1.5 text-start">
        {(label || badgeText) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-steel text-xs font-semibold tracking-wide">
                {label}
              </label>
            )}
            {badgeText && (
              <span className="text-lime text-xs font-semibold tracking-wide">
                {badgeText}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="text-steel pointer-events-none absolute left-3.5 flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            className={cn(
              'h-11 sm:h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-xs sm:text-sm font-semibold text-white placeholder:text-steel/50 transition-all duration-150 focus:border-lime/50 focus:bg-slate-900/90 focus:outline-none backdrop-blur-md',
              leftIcon && 'pl-10',
              actionElement && 'pr-10',
              error && 'border-rose-500/50 focus:border-rose-500',
              className,
            )}
            {...props}
          />

          {actionElement && (
            <span className="text-steel absolute right-2 flex items-center">
              {actionElement}
            </span>
          )}
        </div>

        {error && (
          <p className="text-rose-400 text-xs font-medium pl-1">{error}</p>
        )}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';
