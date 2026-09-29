'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  gridCols?: number;
  size?: 'sm' | 'md' | 'lg';
  activeVariant?: 'gold' | 'white' | 'lime';
}

const GRID_COLS_MAP: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  gridCols,
  size = 'md',
  activeVariant = 'white',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colCount = gridCols ?? options.length;
  const colsClass = GRID_COLS_MAP[colCount] ?? 'grid-cols-4';

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const isRtl = document.documentElement.dir === 'rtl';
      const forward = isRtl ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
      const nextIndex = forward
        ? (index + 1) % options.length
        : (index - 1 + options.length) % options.length;
      onChange(options[nextIndex].value);
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={cn(
        'grid gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1 backdrop-blur-2xl shadow-inner',
        colsClass,
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'btn-haptic flex flex-col items-center justify-center rounded-xl text-center transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-gold/60',
              size === 'sm' && 'min-h-[28px] sm:min-h-[32px] p-1 sm:p-1.5 text-[10.5px] sm:text-xs',
              size === 'md' && 'min-h-[36px] sm:min-h-[40px] p-1.5 sm:p-2 text-xs sm:text-sm',
              size === 'lg' && 'min-h-[44px] sm:min-h-[48px] p-2 sm:p-2.5 text-sm sm:text-base font-bold',
              selected
                ? activeVariant === 'gold'
                  ? 'border border-gold/40 bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] text-slate-950 font-bold shadow-[0_4px_14px_rgba(229,184,66,0.3),inset_0_1px_0_0_rgba(255,255,255,0.6)]'
                  : activeVariant === 'lime'
                    ? 'border border-gold/40 bg-gradient-to-b from-[#F5D77F] via-[#E5B842] to-[#C99824] text-slate-950 font-bold shadow-[0_4px_14px_rgba(229,184,66,0.3),inset_0_1px_0_0_rgba(255,255,255,0.6)]'
                    : 'border border-white/16 bg-white/[0.14] text-white font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.22)]'
                : 'border border-transparent text-steel hover:bg-white/[0.04] hover:text-white',
            )}
          >
            {option.icon && (
              <span
                className={cn(
                  'shrink-0',
                  size === 'sm' ? 'mb-0 sm:mb-0.5' : 'mb-0.5',
                  selected && (activeVariant === 'gold' || activeVariant === 'lime')
                    ? 'text-slate-950'
                    : selected
                      ? 'text-white'
                      : 'text-steel',
                )}
              >
                {option.icon}
              </span>
            )}
            <span className="w-full truncate font-medium tracking-tight text-[11px] sm:text-xs">
              {option.label}
            </span>
            {option.sublabel && (
              <span
                className={cn(
                  'w-full truncate text-[9px] sm:text-[10px] font-normal tracking-normal mt-0.5',
                  selected && (activeVariant === 'gold' || activeVariant === 'lime')
                    ? 'text-slate-900 font-semibold'
                    : selected
                      ? 'text-slate-300'
                      : 'text-muted',
                )}
              >
                {option.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
