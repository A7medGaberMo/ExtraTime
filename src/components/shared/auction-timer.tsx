'use client';

import { cn } from '@/lib/utils';

interface AuctionTimerProps {
  timeLeft: number;
  maxTime?: number;
  isActive: boolean;
  size?: number;
}

export function AuctionTimer({ timeLeft, maxTime = 30, isActive, size = 72 }: AuctionTimerProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isActive ? (timeLeft / maxTime) : 1;
  const offset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 5 && isActive;
  const isCritical = timeLeft <= 3 && isActive;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="timer-ring">
        <circle className="timer-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth="4" />
        <circle
          className="timer-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={isCritical ? '#ef4444' : isUrgent ? '#f59e0b' : '#95E810'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-stats text-xl leading-none transition-all duration-300',
            isCritical && 'animate-countdown-flash',
            isUrgent && !isCritical && 'text-amber-400',
            !isUrgent && 'text-lime',
            !isActive && 'text-steel'
          )}
        >
          {timeLeft}
        </span>
        <span className="text-[8px] font-black uppercase text-steel tracking-widest">sec</span>
      </div>
      {isUrgent && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
