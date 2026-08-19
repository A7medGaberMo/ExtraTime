'use client';

import { cn } from '@/lib/utils';
import { Tier } from '@/types/player';
import { getTierStyle } from '@/lib/tier-styles';

interface TierBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tier: Tier;
}

export function TierBadge({ className, tier, ...props }: TierBadgeProps) {
  const style = getTierStyle(tier);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all focus:outline-none border shadow-sm',
        className
      )}
      style={{
        color: style.highlight,
        backgroundColor: `${style.shadow}CC`,
        borderColor: style.accent,
        boxShadow: `0 0 10px ${style.glow}`,
      }}
      {...props}
    >
      {tier}
    </div>
  );
}
