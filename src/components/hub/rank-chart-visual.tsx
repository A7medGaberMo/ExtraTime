'use client';

import React, { useEffect, useState } from 'react';

interface BarData {
  id: number;
  height: number;
}

const BARS: BarData[] = [
  { id: 1, height: 38 }, // Rank 1 (Tallest)
  { id: 2, height: 32 },
  { id: 3, height: 26 },
  { id: 4, height: 20 },
  { id: 5, height: 14 }, // Rank 5 (Shortest)
];

const SLOT_X = [-26, -13, 0, 13, 26]; // 5 symmetric horizontal slot offsets centered at 0px

export function RankChartVisual() {
  const [order, setOrder] = useState<number[]>([3, 1, 5, 2, 4]);
  const [pauseCount, setPauseCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOrder([1, 2, 3, 4, 5]);
      return;
    }

    const timer = setInterval(() => {
      setOrder((prev) => {
        const isSorted = prev.every((val, idx) => val === idx + 1);
        if (isSorted) {
          if (pauseCount < 2) {
            setPauseCount((c) => c + 1);
            return prev;
          }
          setPauseCount(0);
          return [4, 1, 5, 2, 3];
        }

        const next = [...prev];
        for (let i = 0; i < next.length - 1; i++) {
          if (next[i] > next[i + 1]) {
            const temp = next[i];
            next[i] = next[i + 1];
            next[i + 1] = temp;
            break;
          }
        }
        return next;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [pauseCount]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      aria-hidden="true"
    >
      {/* Bars Container: aligned to baseline */}
      <div className="relative flex h-[38px] w-[68px] items-end justify-center">
        {BARS.map((bar) => {
          const slotIndex = order.indexOf(bar.id);
          const xOffset = slotIndex !== -1 ? SLOT_X[slotIndex] : 0;
          const isTallest = bar.id === 1;

          return (
            <div
              key={bar.id}
              className="absolute bottom-0 w-2 rounded-t-[2px] transition-transform duration-700 ease-[cubic-bezier(0.34,1.25,0.64,1)] motion-reduce:transition-none"
              style={{
                height: `${bar.height}px`,
                left: '50%',
                transform: `translateX(calc(-50% + ${xOffset}px))`,
                backgroundColor: isTallest
                  ? 'var(--hub-accent)'
                  : 'color-mix(in srgb, var(--hub-accent) 26%, transparent)',
                boxShadow: isTallest
                  ? '0 0 10px color-mix(in srgb, var(--hub-accent) 75%, transparent)'
                  : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Rank Numbers (1 to 5) underneath the 5 slots */}
      <div className="relative mt-1.5 flex h-3 w-[68px] items-center justify-center">
        {SLOT_X.map((x, idx) => (
          <span
            key={idx}
            className="absolute text-[10px] font-bold tabular-nums leading-none"
            style={{
              left: '50%',
              transform: `translateX(calc(-50% + ${x}px))`,
              color: 'color-mix(in srgb, var(--hub-accent) 65%, transparent)',
              fontFamily: 'var(--font-ui), monospace',
            }}
          >
            {idx + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
