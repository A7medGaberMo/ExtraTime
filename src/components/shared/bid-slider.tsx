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
        className="pointer-events-none absolute top-0 transition-all duration-100"
        style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
      >
        <span
          className={cn(
            'font-stats inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold transition-all backdrop-blur-xl',
            isDragging
              ? 'bg-lime text-slate-950 shadow-[0_0_20px_rgba(142,224,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.35)] scale-110'
              : 'border border-white/15 bg-slate-900/95 text-lime shadow-[0_6px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
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
        className="focus:ring-lime relative flex h-10 cursor-grab items-center rounded-2xl focus:ring-1 focus:outline-none active:cursor-grabbing"
      >
        {/* Rail bg (Sunken Glass Track) */}
        <div className="absolute inset-x-0 h-2.5 rounded-full bg-slate-950/90 border border-white/10 shadow-inner" />
        {/* Filled rail */}
        <div
          className="absolute left-0 h-2.5 rounded-full bg-gradient-to-r from-lime/80 to-lime shadow-[0_0_12px_rgba(142,224,0,0.5)] transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb (Apple Specular Disc) */}
        <div
          className={cn(
            'absolute -ml-3.5 h-7 w-7 rounded-full border-2 border-lime bg-slate-900 transition-all duration-150 flex items-center justify-center',
            isDragging
              ? 'scale-115 shadow-[0_0_24px_rgba(142,224,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.4)]'
              : 'shadow-[0_4px_16px_rgba(0,0,0,0.7),0_0_12px_rgba(142,224,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.25)]',
          )}
          style={{ left: `${pct}%` }}
        >
          <div className="bg-lime h-2.5 w-2.5 rounded-full shadow-[0_0_6px_rgba(142,224,0,0.8)]" />
        </div>
        {/* Min/Max labels */}
        <div className="text-steel font-stats absolute -bottom-5 left-0 text-[10px] font-bold">${min}M</div>
        <div className="text-steel font-stats absolute right-0 -bottom-5 text-[10px] font-bold">${max}M</div>
      </div>
    </div>
  );
}
