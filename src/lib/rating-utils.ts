import type { Tier } from '@/types/player';

export const TIER_RATING_RANGES: Record<Tier, [number, number]> = {
  ICON: [96, 99],
  ULTIMATE: [91, 95],
  HERO: [88, 93],
  MASTER: [86, 90],
  ELITE: [81, 85],
  GOLD: [74, 80],
  SILVER: [64, 73],
  BRONZE: [50, 63],
};

/**
 * Computes a deterministic default rating for a tier if none is explicitly seeded.
 */
export function getDefaultRatingForTier(tier: Tier, seedStr: string = ''): number {
  const [min, max] = TIER_RATING_RANGES[tier] ?? [70, 75];
  if (min === max) return min;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % (max - min + 1);
  return min + offset;
}

/**
 * Returns the effective rating of a player, falling back to deterministic tier rating.
 */
export function getEffectiveRating(player?: {
  rating?: number;
  tier?: string;
  name?: string;
}): number {
  if (!player) return 75;
  if (typeof player.rating === 'number' && player.rating > 0) {
    return Math.round(player.rating);
  }
  return getDefaultRatingForTier((player.tier as Tier) || 'GOLD', player.name || '');
}

/**
 * Returns color / gradient accents for rating display
 */
export function getRatingBadgeStyle(rating: number): {
  color: string;
  glow: string;
  badgeBg: string;
} {
  if (rating >= 94) {
    return {
      color: 'var(--et-tier-icon)',
      glow: 'color-mix(in srgb, var(--et-tier-icon) 65%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-tier-icon) 15%, transparent)',
    };
  }
  if (rating >= 90) {
    return {
      color: 'var(--et-tier-ultimate)',
      glow: 'color-mix(in srgb, var(--et-tier-ultimate) 55%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-tier-ultimate) 15%, transparent)',
    };
  }
  if (rating >= 86) {
    return {
      color: 'var(--et-tier-master)',
      glow: 'color-mix(in srgb, var(--et-tier-master) 50%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-tier-master) 12%, transparent)',
    };
  }
  if (rating >= 81) {
    return {
      color: 'var(--et-success)',
      glow: 'color-mix(in srgb, var(--et-success) 45%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-success) 12%, transparent)',
    };
  }
  if (rating >= 74) {
    return {
      color: 'var(--et-tier-gold)',
      glow: 'color-mix(in srgb, var(--et-tier-gold) 35%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-tier-gold) 10%, transparent)',
    };
  }
  if (rating >= 64) {
    return {
      color: 'var(--et-tier-silver)',
      glow: 'color-mix(in srgb, var(--et-tier-silver) 25%, transparent)',
      badgeBg: 'color-mix(in srgb, var(--et-tier-silver) 8%, transparent)',
    };
  }
  return {
    color: 'var(--et-tier-bronze)',
    glow: 'color-mix(in srgb, var(--et-tier-bronze) 25%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--et-tier-bronze) 8%, transparent)',
  };
}
