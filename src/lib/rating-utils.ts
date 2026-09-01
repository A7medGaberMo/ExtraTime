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
      color: '#FFE066',
      glow: 'rgba(255, 215, 0, 0.65)',
      badgeBg: 'rgba(255, 215, 0, 0.15)',
    };
  }
  if (rating >= 90) {
    return {
      color: '#38BDF8',
      glow: 'rgba(56, 189, 248, 0.55)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
    };
  }
  if (rating >= 86) {
    return {
      color: '#A78BFA',
      glow: 'rgba(167, 139, 250, 0.5)',
      badgeBg: 'rgba(167, 139, 250, 0.12)',
    };
  }
  if (rating >= 81) {
    return {
      color: '#34D399',
      glow: 'rgba(52, 211, 153, 0.45)',
      badgeBg: 'rgba(52, 211, 153, 0.12)',
    };
  }
  if (rating >= 74) {
    return {
      color: '#FBBF24',
      glow: 'rgba(251, 191, 36, 0.35)',
      badgeBg: 'rgba(251, 191, 36, 0.1)',
    };
  }
  if (rating >= 64) {
    return {
      color: '#CBD5E1',
      glow: 'rgba(203, 213, 225, 0.25)',
      badgeBg: 'rgba(203, 213, 225, 0.08)',
    };
  }
  return {
    color: '#D97706',
    glow: 'rgba(217, 119, 6, 0.25)',
    badgeBg: 'rgba(217, 119, 6, 0.08)',
  };
}
