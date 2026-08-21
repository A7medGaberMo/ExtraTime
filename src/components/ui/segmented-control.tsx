'use client';

import React from 'react';
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
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  gridCols,
  size = 'md',
}: SegmentedControlProps<T>) {
  const colsClass = gridCols
    ? `grid-cols-${gridCols}`
    : options.length <= 3
      ? `grid-cols-${options.length}`
      : options.length === 5
        ? 'grid-cols-5'
        : 'grid-cols-4';

  return (
    <div
      className={cn(
        'grid gap-1.5 rounded-2xl border border-white/10 bg-slate-950/80 p-1.5 backdrop-blur-md',
        colsClass,
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border text-center transition-all duration-150 active:scale-95 cursor-pointer min-h-[44px]',
              size === 'sm' && 'p-2 text-xs',
              size === 'md' && 'p-2.5 sm:p-3 text-xs sm:text-sm',
              size === 'lg' && 'p-3.5 text-sm sm:text-base font-black',
              selected
                ? 'border-lime/60 bg-lime text-slate-950 font-black shadow-lg shadow-lime/20'
                : 'border-transparent text-steel hover:bg-white/5 hover:text-white',
            )}
          >
            {option.icon && (
              <span className={cn('mb-1', selected ? 'text-slate-950' : 'text-steel')}>
                {option.icon}
              </span>
            )}
            <span className="w-full truncate font-black tracking-wider uppercase">
              {option.label}
            </span>
            {option.sublabel && (
              <span
                className={cn(
                  'w-full truncate text-[10px] font-medium tracking-normal mt-0.5',
                  selected ? 'text-slate-900 font-bold' : 'text-muted',
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
