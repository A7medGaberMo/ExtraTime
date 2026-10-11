'use client';

import React, { useEffect, useState, useRef } from 'react';
import { sfx } from '@/lib/sfx';

interface CircularTimerProps {
  deadline: number; // authoritative server timestamp (ms)
  totalDurationMs?: number; // default 90_000ms
  size?: number;
  strokeWidth?: number;
  onExpire?: () => void;
  isPaused?: boolean;
  className?: string;
}

export function CircularTimer({
  deadline,
  totalDurationMs = 90_000,
  size = 52,
  strokeWidth = 4,
  onExpire,
  isPaused = false,
  className = '',
}: CircularTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    Math.max(0, Math.ceil(totalDurationMs / 1000))
  );

  const lastTickSecond = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;
  }, [deadline]);

  useEffect(() => {
    if (isPaused) return;

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = deadline - now;
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(secs);

      // Play tick sound on critical final seconds (10s down to 1s)
      if (secs <= 10 && secs > 0 && lastTickSecond.current !== secs) {
        lastTickSecond.current = secs;
        sfx.tick(secs <= 5);
        sfx.haptic(secs <= 3 ? 'medium' : 'light');
      }

      if (diffMs <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        sfx.haptic('error');
        onExpire?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [deadline, isPaused, onExpire]);

  const totalSecs = Math.max(1, Math.round(totalDurationMs / 1000));
  const progressRatio = Math.min(1, Math.max(0, remainingSeconds / totalSecs));

  // Dynamic urgency color calculation matching Hub Theme: Game Accent -> Warning Amber -> Urgent Crimson
  const isUrgent = remainingSeconds <= 10;
  const isWarning = remainingSeconds <= 25 && !isUrgent;

  const strokeColor = isUrgent
    ? 'var(--et-danger, #ef4444)'
    : isWarning
      ? 'var(--et-warning, #f59e0b)'
      : 'var(--game-accent, #fb7185)';

  const glowColor = isUrgent
    ? 'var(--et-danger-glow, rgba(239, 68, 68, 0.4))'
    : isWarning
      ? 'rgba(245, 158, 11, 0.35)'
      : 'var(--game-glow, rgba(251, 113, 133, 0.35))';

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        {/* Background Subtle Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-150"
        />
      </svg>

      {/* Center Digital Display */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-200 ${
          isUrgent
            ? 'animate-pulse scale-105 text-danger'
            : isWarning
              ? 'text-warning'
              : 'text-game-accent'
        }`}
      >
        <span
          className={`font-stats font-black tracking-tight leading-none tabular-nums ${
            size <= 38
              ? 'text-[11px]'
              : size <= 44
                ? 'text-xs'
                : size <= 52
                  ? 'text-sm'
                  : 'text-xl'
          }`}
        >
          {remainingSeconds}
        </span>
        {size > 52 && (
          <span className="text-[8.5px] font-bold text-muted uppercase leading-none mt-0.5 font-stats">
            SEC
          </span>
        )}
      </div>
    </div>
  );
}
