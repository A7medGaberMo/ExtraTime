'use client';

import React, { useEffect, useState } from 'react';

interface BarData {
  id: number;
  height: number;
}

const BARS: BarData[] = [
  { id: 1, height: 38 }, // Tallest (Rank 1)
  { id: 2, height: 32 },
  { id: 3, height: 26 },
  { id: 4, height: 20 },
  { id: 5, height: 14 }, // Shortest (Rank 5)
];

const SLOT_X = [-28, -14, 0, 14, 28]; // 5 symmetric horizontal slot offsets centered at 0px

export function RankChartVisual() {
  const [order, setOrder] = useState<number[]>([3, 1, 5, 2, 4]);
  const [pauseCount, setPauseCount] = useState(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOrder([1, 2, 3, 4, 5]);
      return;
    }

    const timer = setInterval(() => {
      setOrder((prev) => {
        const isSorted = prev.every((val, idx) => val === idx + 1);
        if (isSorted) {
          // Pause briefly on sorted perfection, then shuffle
          if (pauseCount < 2) {
            setPauseCount((c) => c + 1);
            return prev;
          }
          setPauseCount(0);
          return [4, 1, 5, 2, 3];
        }

        // Perform one step of swap towards sorted order [1, 2, 3, 4, 5]
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
    <>
      {/* Outer Degree Tick Bezel — Fine tick marks matching Snipe */}
      <div className="hub-radar-ticks pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      {/* Slow Counter-Rotating Dashed Bezel (matching Snipe's 13% opacity) */}
      <div
        className="pointer-events-none absolute inset-[7%] rounded-full border border-dashed motion-reduce:animation-none"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 13%, transparent)',
          animation: 'draftBoardTickSweep 60s linear infinite reverse',
        }}
        aria-hidden="true"
      />

      {/* Outer Ring — 1px stroke at low opacity, no outer glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 14%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Inner Rings — Thin 1px strokes and low opacity matching Snipe */}
      <div
        className="draft-ring-breathe pointer-events-none absolute inset-[18%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 18%, transparent)',
        }}
        aria-hidden="true"
      />
      <div
        className="draft-ring-breathe draft-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 24%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Precision Crosshair Axis Lines — Thin 1px strokes at low opacity */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="h-full w-px"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
          }}
        />
        <div
          className="absolute h-px w-full"
          style={{
            background:
              'linear-gradient(to right, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
          }}
        />
      </div>

      {/* Pick Timer Arc — 2px accent arc on outer ring */}
      <svg
        viewBox="0 0 240 240"
        className="pointer-events-none absolute inset-0 size-full -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <circle
          cx="120"
          cy="120"
          r="119"
          fill="none"
          stroke="var(--hub-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          className="draft-board-arc"
          style={{
            filter: 'drop-shadow(0 0 2.5px color-mix(in srgb, var(--hub-accent) 65%, transparent))',
          }}
        />
      </svg>

      {/* ── Inside the Inner Ring: 5 Symmetrically Centered Ranking Chart Bars with Rank Numbers ── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        {/* Bars Container: aligned to baseline */}
        <div className="relative flex h-[38px] w-[72px] items-end justify-center">
          {BARS.map((bar) => {
            const slotIndex = order.indexOf(bar.id);
            const xOffset = slotIndex !== -1 ? SLOT_X[slotIndex] : 0;
            const isTallest = bar.id === 1;

            return (
              <div
                key={bar.id}
                className="absolute bottom-0 w-2 rounded-t-[2.5px] transition-transform duration-700 ease-[cubic-bezier(0.34,1.25,0.64,1)] motion-reduce:transition-none"
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
        <div className="relative mt-1.5 flex h-3 w-[72px] items-center justify-center">
          {SLOT_X.map((x, idx) => (
            <span
              key={idx}
              className="absolute text-[9.5px] font-bold tabular-nums leading-none"
              style={{
                left: '50%',
                transform: `translateX(calc(-50% + ${x}px))`,
                color: 'color-mix(in srgb, var(--hub-accent) 60%, transparent)',
                fontFamily: 'var(--font-ui), monospace',
              }}
            >
              {idx + 1}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
