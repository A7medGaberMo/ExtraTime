'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-40 btn-haptic outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] text-slate-950 font-bold shadow-[0_8px_24px_rgba(229,184,66,0.28),inset_0_1px_0_0_rgba(255,255,255,0.6)] hover:brightness-105 active:scale-[0.98]',
        secondary:
          'border border-white/12 bg-slate-900/85 text-white shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:border-white/20 hover:bg-slate-850 active:scale-[0.98]',
        outline:
          'border border-white/15 bg-transparent text-slate-200 hover:border-gold/50 hover:bg-white/5 active:scale-[0.98]',
        ghost:
          'bg-transparent text-steel hover:bg-white/5 hover:text-white active:scale-[0.98]',
        danger:
          'border border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 active:scale-[0.98]',
        gold:
          'bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] text-slate-950 font-bold shadow-[0_8px_24px_rgba(229,184,66,0.28),inset_0_1px_0_0_rgba(255,255,255,0.6)] hover:brightness-105 active:scale-[0.98]',
        lime:
          'bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] text-slate-950 font-bold shadow-[0_8px_24px_rgba(229,184,66,0.28),inset_0_1px_0_0_rgba(255,255,255,0.6)] hover:brightness-105 active:scale-[0.98]',
        emerald:
          'bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 font-bold shadow-[0_8px_20px_rgba(16,185,129,0.25),inset_0_1px_0_0_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-[0.98]',
        cyan:
          'bg-gradient-to-b from-cyan-300 to-sky-500 text-slate-950 font-bold shadow-[0_8px_20px_rgba(56,189,248,0.25),inset_0_1px_0_0_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-[0.98]',
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
