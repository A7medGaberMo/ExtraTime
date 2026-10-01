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
              <label className="text-muted text-xs font-semibold tracking-wide">
                {label}
              </label>
            )}
            {badgeText && (
              <span className="text-game-accent text-xs font-semibold tracking-wide">
                {badgeText}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="text-muted pointer-events-none absolute start-3.5 flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            className={cn(
              'h-11 sm:h-12 w-full rounded-2xl border border-white/10 bg-canvas/80 px-4 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted/50 transition-all duration-150 focus:border-game-accent/50 focus:bg-surface/90 focus:outline-none backdrop-blur-md',
              leftIcon && 'ps-10',
              actionElement && 'pe-10',
              error && 'border-danger/50 focus:border-danger',
              className,
            )}
            {...props}
          />

          {actionElement && (
            <span className="text-muted absolute end-2 flex items-center">
              {actionElement}
            </span>
          )}
        </div>

        {error && (
          <p className="text-danger text-xs font-medium ps-1">{error}</p>
        )}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';
