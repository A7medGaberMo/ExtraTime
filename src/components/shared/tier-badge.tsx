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
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-sm transition-all focus:outline-none',
        className,
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
