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
    <div className={cn('relative select-none touch-none', className)}>
      {/* Value label above thumb */}
      <div
        className="absolute -top-7 transition-all duration-100 pointer-events-none"
        style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
      >
        <span
          className={cn(
            'inline-block px-2 py-0.5 rounded-md text-xs font-stats transition-all',
            isDragging
              ? 'bg-lime text-background scale-110 shadow-lg shadow-lime/30'
              : 'bg-card border border-border text-lime',
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
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(min, value - 1));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-10 flex items-center cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-lime rounded-lg"
      >
        {/* Rail bg */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-border/60" />
        {/* Filled rail */}
        <div
          className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-lime/70 to-lime transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className={cn(
            'absolute w-7 h-7 -ml-3.5 rounded-full border-2 border-lime bg-card transition-shadow duration-200',
            isDragging
              ? 'shadow-[0_0_20px_rgba(149,232,16,0.5)] scale-110'
              : 'shadow-[0_0_10px_rgba(149,232,16,0.2)]',
          )}
          style={{ left: `${pct}%` }}
        >
          <div className="absolute inset-1.5 rounded-full bg-lime" />
        </div>
        {/* Min/Max labels */}
        <div className="absolute -bottom-5 left-0 text-[10px] text-steel font-stats">${min}M</div>
        <div className="absolute -bottom-5 right-0 text-[10px] text-steel font-stats">${max}M</div>
      </div>
    </div>
  );
}
