'use client';

import { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface BidSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  className?: string;
}

/**
 * Touch-friendly horizontal slider for bid amounts.
 * Swipe/drag right to increase, left to decrease.
 * Displays current value with a glowing thumb.
 */
export function BidSlider({ value, min, max, onChange, className }: BidSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const range = max - min;
  const pct = range > 0 ? ((value - min) / range) * 100 : 0;

  const resolveValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || range <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + Math.round(ratio * range);
      onChange(Math.max(min, Math.min(max, raw)));
    },
    [min, max, range, onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resolveValue(e.clientX);
    },
    [resolveValue],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      resolveValue(e.clientX);
    },
    [isDragging, resolveValue],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className={cn('relative touch-none pt-8 pb-5 select-none', className)}>
      {/* Value label above thumb */}
      <div
        className="pointer-events-none absolute top-1 transition-all duration-100"
        style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
      >
        <span
          className={cn(
            'font-stats inline-block rounded-md px-2 py-0.5 text-xs transition-all',
            isDragging
              ? 'bg-lime text-background shadow-lime/30 scale-110 shadow-lg'
              : 'bg-card border-border text-lime border',
          )}
        >
          ${value}M
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="Bid Amount Slider"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + 1));
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - 1));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="focus:ring-lime relative flex h-10 cursor-grab items-center rounded-lg focus:ring-1 focus:outline-none active:cursor-grabbing"
      >
        {/* Rail bg */}
        <div className="bg-border/60 absolute inset-x-0 h-2 rounded-full" />
        {/* Filled rail */}
        <div
          className="from-lime/70 to-lime absolute left-0 h-2 rounded-full bg-gradient-to-r transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className={cn(
            'border-lime bg-card absolute -ml-3.5 h-7 w-7 rounded-full border-2 transition-shadow duration-200',
            isDragging
              ? 'scale-110 shadow-[0_0_20px_rgba(149,232,16,0.5)]'
              : 'shadow-[0_0_10px_rgba(149,232,16,0.2)]',
          )}
          style={{ left: `${pct}%` }}
        >
          <div className="bg-lime absolute inset-1.5 rounded-full" />
        </div>
        {/* Min/Max labels */}
        <div className="text-steel font-stats absolute -bottom-5 left-0 text-[10px]">${min}M</div>
        <div className="text-steel font-stats absolute right-0 -bottom-5 text-[10px]">${max}M</div>
      </div>
    </div>
  );
}
