'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface AuctionTimerProps {
  timeLeft: number;
  maxTime?: number;
  isActive: boolean;
  size?: number;
  showBoost?: boolean;
}

export function AuctionTimer({ timeLeft, maxTime = 30, isActive, size = 64, showBoost = false }: AuctionTimerProps) {
  const [prevTime, setPrevTime] = useState(timeLeft);
  const [boostActive, setBoostActive] = useState(false);

  useEffect(() => {
    if (timeLeft > prevTime + 2 && prevTime > 0) {
      setBoostActive(true);
      const timer = setTimeout(() => setBoostActive(false), 2200);
      return () => clearTimeout(timer);
    }
    setPrevTime(timeLeft);
  }, [timeLeft, prevTime]);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const effectiveMax = Math.max(maxTime, timeLeft);
  const progress = isActive ? Math.min(1, Math.max(0, timeLeft / effectiveMax)) : 1;
  const offset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 8 && isActive;
  const isCritical = timeLeft <= 4 && isActive;

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Outer ambient glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-md transition-opacity duration-300 pointer-events-none opacity-20',
          isCritical ? 'bg-rose-500 opacity-60' : isUrgent ? 'bg-amber-500' : boostActive ? 'bg-amber-400 opacity-80' : 'bg-lime'
        )}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          className="stroke-slate-900 fill-card"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out fill-transparent"
          stroke={
            isCritical
              ? '#F43F5E'
              : isUrgent
              ? '#F59E0B'
              : boostActive
              ? '#FBBF24'
              : '#95E810'
          }
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-stats font-bold text-lg leading-none transition-all duration-300',
            isCritical && 'text-rose-400 animate-pulse scale-110',
            isUrgent && !isCritical && 'text-amber-400',
            boostActive && 'text-amber-300 scale-110',
            !isUrgent && !boostActive && 'text-lime',
            !isActive && 'text-steel'
          )}
        >
          {timeLeft}
        </span>
        <span className="text-[7px] font-black uppercase text-steel tracking-widest mt-0.5">sec</span>
      </div>

      {/* Perk +10s boost floating banner */}
      {(boostActive || showBoost) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg border border-amber-300 animate-bounce whitespace-nowrap z-20">
          <Zap className="w-2.5 h-2.5 fill-slate-950" /> +10s BOOST
        </div>
      )}

      {isUrgent && (
        <div className="absolute inset-0 rounded-full border border-rose-500/40 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
