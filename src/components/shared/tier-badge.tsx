'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Tier } from '@/types/player';

const tierBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all focus:outline-none border shadow-sm',
  {
    variants: {
      tier: {
        ICON: 'bg-[#2C2518] text-[#F7F5EF] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)]',
        HERO: 'bg-[#064E3B] text-[#A7F3D0] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        MASTER: 'bg-[#240A47] text-[#E9D5FF] border-[#7C3AED] shadow-[0_0_10px_rgba(124,58,237,0.3)]',
        ELITE_PLUS: 'bg-[#3B080E] text-[#FFD6DC] border-[#D72638] shadow-[0_0_10px_rgba(215,38,56,0.3)]',
        ELITE: 'bg-[#0A1A42] text-[#DBEAFE] border-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.3)]',
        GOLD: 'bg-[#332402] text-[#FFF7CC] border-[#EAB308] shadow-[0_0_10px_rgba(234,179,8,0.3)]',
        SILVER: 'bg-[#1E293B] text-[#EEF2F7] border-[#CBD5E1] shadow-[0_0_10px_rgba(203,213,225,0.2)]',
        BRONZE: 'bg-[#2A160A] text-[#F8E4D0] border-[#B96A35] shadow-[0_0_10px_rgba(185,106,53,0.2)]',
      },
    },
    defaultVariants: {
      tier: 'SILVER',
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
