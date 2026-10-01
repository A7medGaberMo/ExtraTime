'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

/**
 * Semantic button. Colors come exclusively from the theme system:
 * primary follows the nearest [data-game] scope, secondary/danger use
 * Layer 1 tokens. No hard-coded palette classes.
 */
const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-40 btn-haptic outline-none focus-visible:ring-2 focus-visible:ring-game-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-game-accent-light via-game-accent to-game-accent-deep text-game-on-accent font-bold shadow-[0_8px_24px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-60)] hover:brightness-105 active:scale-[0.98]',
        secondary:
          'border border-white/12 bg-surface text-foreground shadow-[0_8px_20px_var(--et-shade-50),inset_0_1px_0_0_var(--et-hi-10)] hover:border-white/20 hover:bg-surface-2 active:scale-[0.98]',
        outline:
          'border border-white/15 bg-transparent text-foreground hover:border-game-accent/50 hover:bg-white/5 active:scale-[0.98]',
        ghost:
          'bg-transparent text-muted hover:bg-white/5 hover:text-foreground active:scale-[0.98]',
        danger:
          'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25 active:scale-[0.98]',
        gold:
          'bg-gradient-to-b from-game-accent-light via-game-accent to-game-accent-deep text-game-on-accent font-bold shadow-[0_8px_24px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-60)] hover:brightness-105 active:scale-[0.98]',
        lime:
          'bg-gradient-to-b from-game-accent-light via-game-accent to-game-accent-deep text-game-on-accent font-bold shadow-[0_8px_24px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-60)] hover:brightness-105 active:scale-[0.98]',
      },
      size: {
        xs: 'h-8 px-2.5 text-[11px] font-bold rounded-xl min-h-[32px] gap-1.5',
        sm: 'h-9 px-3.5 text-xs font-bold rounded-xl min-h-[36px] gap-2',
        md: 'h-11 sm:h-12 px-4 sm:px-5 text-xs sm:text-sm font-bold min-h-[44px]',
        lg: 'h-12 sm:h-13 px-6 text-sm sm:text-base font-bold min-h-[48px] sm:min-h-[52px]',
        icon: 'h-10 w-10 shrink-0 p-0 min-h-[40px] min-w-[40px]',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {loading ? (
          <CircleNotch className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
