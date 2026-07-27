"use client";

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Tier } from '@/types/player';

const tierBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      tier: {
        ICON: "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]",
        MASTER: "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]",
        ELITE_PLUS: "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]",
        ELITE: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
        GOLD: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        SILVER: "bg-slate-400/10 text-slate-300 border border-slate-400/20",
        BRONZE: "bg-orange-700/10 text-orange-600 border border-orange-700/20",
      },
    },
    defaultVariants: {
      tier: "SILVER",
    },
  }
);

interface TierBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tierBadgeVariants> {
  tier: Tier;
}

export function TierBadge({ className, tier, ...props }: TierBadgeProps) {
  return (
    <div className={cn(tierBadgeVariants({ tier }), className)} {...props}>
      {tier.replace('_', '+')}
    </div>
  );
}
