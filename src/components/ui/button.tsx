'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-wider transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer min-h-[44px]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-lime via-vivid to-lime text-slate-950 shadow-lg shadow-lime/20 hover:brightness-105 active:scale-[0.98]',
        secondary:
          'bg-slate-900 border border-white/10 text-white shadow-md hover:bg-slate-800 hover:border-white/20 active:scale-[0.98]',
        outline:
          'border border-white/15 bg-transparent text-slate-200 hover:border-lime/50 hover:bg-white/5 active:scale-[0.98]',
        ghost:
          'bg-transparent text-steel hover:text-white hover:bg-white/5 active:scale-[0.98]',
        danger:
          'bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25 active:scale-[0.98]',
        gold:
          'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20 hover:brightness-105 active:scale-[0.98]',
      },
      size: {
        sm: 'h-10 px-3.5 text-xs rounded-xl min-h-[40px]',
        md: 'h-12 px-5 text-xs sm:text-sm rounded-2xl min-h-[48px]',
        lg: 'h-14 px-7 text-sm sm:text-base rounded-2xl min-h-[56px]',
        icon: 'h-11 w-11 p-0 rounded-xl shrink-0 min-h-[44px] min-w-[44px]',
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
        className={cn(buttonVariants({ variant, size, fullWidth, className }), 'btn-haptic')}
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
