'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-40 btn-haptic',
  {
    variants: {
      variant: {
        primary:
          'bg-lime text-slate-950 shadow-sm hover:brightness-105 active:scale-[0.98]',
        secondary:
          'border border-white/10 bg-slate-900/90 text-white shadow-sm hover:border-white/20 hover:bg-slate-850 active:scale-[0.98]',
        outline:
          'border border-white/15 bg-transparent text-slate-200 hover:border-lime/50 hover:bg-white/5 active:scale-[0.98]',
        ghost:
          'bg-transparent text-steel hover:bg-white/5 hover:text-white active:scale-[0.98]',
        danger:
          'border border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 active:scale-[0.98]',
        gold:
          'bg-amber-400 text-slate-950 shadow-sm hover:brightness-105 active:scale-[0.98]',
      },
      size: {
        sm: 'h-10 px-3.5 text-xs min-h-[40px]',
        md: 'h-11 sm:h-12 px-4 sm:px-5 text-xs sm:text-sm min-h-[44px]',
        lg: 'h-13 px-6 text-sm sm:text-base min-h-[52px]',
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

