import { v } from 'convex/values';

// ── Tier System ────────────────────────────────────────────
export const TIERS = [
  'ICON',
  'HERO',
  'ULTIMATE',
  'MASTER',
  'ELITE',
  'GOLD',
  'SILVER',
  'BRONZE',
] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_RANK: Record<Tier, number> = {
  ICON: 0,
  HERO: 1,
  ULTIMATE: 2,
  MASTER: 3,
  ELITE: 4,
  GOLD: 5,
  SILVER: 6,
  BRONZE: 7,
};

export function tierRank(tier?: string): number {
  return TIER_RANK[tier as Tier] ?? 8;
}

export const tierValidator = v.union(
  v.literal('ICON'),
  v.literal('HERO'),
  v.literal('ULTIMATE'),
  v.literal('MASTER'),
  v.literal('ELITE'),
  v.literal('GOLD'),
  v.literal('SILVER'),
  v.literal('BRONZE'),
);

// ── Position System ────────────────────────────────────────
export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'ST'
  | 'CF';

export function normalizePosition(position: string): string {
  return position.trim().toUpperCase();
}

export function playerPositions(position: string): string[] {
  return position.split('/').map(normalizePosition).filter(Boolean);
}

export function lineFor(position: string): 'GK' | 'DEF' | 'MID' | 'ATT' {
  const norm = normalizePosition(position);
  if (norm === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(norm)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(norm)) return 'MID';
  return 'ATT';
}

// ── Pool Mode ──────────────────────────────────────────────
export const POOL_MODES = ['GLOBAL', 'ACTIVE', 'EPL', 'TOP_TEAMS', 'ICONS'] as const;
export type PoolMode = (typeof POOL_MODES)[number];

export const poolModeValidator = v.union(
  v.literal('GLOBAL'),
  v.literal('ACTIVE'),
  v.literal('EPL'),
  v.literal('TOP_TEAMS'),
  v.literal('ICONS'),
);

// ── Settings Validator (shared between schema + mutations) ─
export const roomSettingsValidator = v.object({
  formation: v.string(),
  matchSize: v.union(v.literal(5), v.literal(11)),
  startingBudget: v.number(),
  poolMode: poolModeValidator,
});

// ── League → Country mapping ───────────────────────────────
export const LEAGUE_COUNTRY: Record<string, string> = {
  'Premier League': 'England',
  'La Liga': 'Spain',
  'Serie A': 'Italy',
  Bundesliga: 'Germany',
  'Ligue 1': 'France',
  Eredivisie: 'Netherlands',
  'Primeira Liga': 'Portugal',
  'Super Lig': 'Turkey',
  'Süper Lig': 'Turkey',
  'Scottish Premiership': 'Scotland',
  Brasileirão: 'Brazil',
  MLS: 'USA',
  'Saudi Pro League': 'Saudi Arabia',
  'Belgian Pro League': 'Belgium',
  'Global Legends': 'International',
};
