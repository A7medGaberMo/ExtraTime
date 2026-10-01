'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Lightning } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

interface AuctionTimerProps {
  timeLeft: number;
  maxTime?: number;
  isActive: boolean;
  size?: number;
  showBoost?: boolean;
}

export function AuctionTimer({
  timeLeft,
  maxTime = 30,
  isActive,
  size = 64,
  showBoost = false,
}: AuctionTimerProps) {
  const prevTimeRef = useRef(timeLeft);
  const [boostActive, setBoostActive] = useState(false);

  useEffect(() => {
    if (timeLeft > prevTimeRef.current + 2 && prevTimeRef.current > 0) {
      setBoostActive(true);
      const timer = setTimeout(() => setBoostActive(false), 2200);
      return () => clearTimeout(timer);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const effectiveMax = Math.max(maxTime, timeLeft);
  const progress = isActive ? Math.min(1, Math.max(0, timeLeft / effectiveMax)) : 1;
  const offset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 8 && isActive;
  const isCritical = timeLeft <= 4 && isActive;

  return (
    <div
      className="group relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full opacity-20 blur-md transition-opacity duration-300',
          isCritical
            ? 'bg-danger opacity-60'
            : isUrgent
              ? 'bg-warning'
              : boostActive
                ? 'bg-game-accent-light opacity-80'
                : 'bg-game-accent',
        )}
      />

      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          className="fill-canvas stroke-surface"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-transparent transition-all duration-500 ease-out"
          stroke={
            isCritical ? 'var(--et-danger)' : isUrgent ? 'var(--et-warning)' : boostActive ? 'var(--accent-light)' : 'var(--accent)'
          }
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-stats text-lg leading-none font-black transition-all duration-300',
            isCritical && 'scale-110 animate-pulse text-danger',
            isUrgent && !isCritical && 'text-warning',
            boostActive && 'scale-110 text-game-accent-light',
            !isUrgent && !boostActive && 'text-game-accent',
            !isActive && 'text-muted',
          )}
        >
          {timeLeft}
        </span>
        <span className="text-muted mt-0.5 text-[7px] font-black tracking-widest uppercase">
          sec
        </span>
      </div>

      {/* Perk +10s boost floating banner */}
      {(boostActive || showBoost) && (
        <div className="absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 animate-bounce items-center gap-1 rounded-full border border-game-accent-light bg-game-accent px-2 py-0.5 text-[9px] font-black tracking-wider whitespace-nowrap text-game-on-accent uppercase shadow-lg">
          <AppIcon icon={Lightning} size={10} weight="fill" className="text-game-on-accent" /> +10s BOOST
        </div>
      )}

      {isUrgent && (
        <div className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-danger/40" />
      )}
    </div>
  );
}
