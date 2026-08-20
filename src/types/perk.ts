import type { GameType } from './game';

export type PerkId = 'SCOUT' | 'SPY' | 'FREEZE' | 'SHIELD';

export interface PerkDefinition {
  id: PerkId;
  name: string;
  badgeLabel: string;
  description: string;
  icon: string;
  accentColor: string;
  applicableGameTypes: (GameType | 'ALL')[];
}

export const PERK_REGISTRY: Record<PerkId, PerkDefinition> = {
  SCOUT: {
    id: 'SCOUT',
    name: 'Scout Intelligence',
    badgeLabel: '🔭 SCOUT',
    description: 'Scouts ahead — reveals the main player target for the next round.',
    icon: 'Binoculars',
    accentColor: '#3B82F6',
    applicableGameTypes: ['hidden_bid', 'ALL'],
  },
  SPY: {
    id: 'SPY',
    name: 'Rival Spy',
    badgeLabel: '🕵️ SPY',
    description: 'Spies on hidden info — reveals the secret backup sub-player card for this round.',
    icon: 'Eye',
    accentColor: '#F59E0B',
    applicableGameTypes: ['hidden_bid', 'ALL'],
  },
  FREEZE: {
    id: 'FREEZE',
    name: 'Clock Freeze (Coming Soon)',
    badgeLabel: '❄️ FREEZE',
    description: 'Freezes the bidding timer giving you extra decision time in critical rounds.',
    icon: 'Snowflake',
    accentColor: '#06B6D4',
    applicableGameTypes: ['hidden_bid'],
  },
  SHIELD: {
    id: 'SHIELD',
    name: 'Budget Shield (Coming Soon)',
    badgeLabel: '🛡️ SHIELD',
    description: 'Protects 20% of your remaining budget if outbid on an ICON player.',
    icon: 'Shield',
    accentColor: '#10B981',
    applicableGameTypes: ['hidden_bid'],
  },
};

/**
 * Filter perks that are compatible with a specific game type.
 */
export function getPerksForGame(gameType: GameType): PerkDefinition[] {
  return Object.values(PERK_REGISTRY).filter(
    (perk) =>
      perk.applicableGameTypes.includes('ALL') || perk.applicableGameTypes.includes(gameType),
  );
}

/**
 * Returns a complementary pair of perks for a match.
 */
export function getComplementaryPerks(primaryPerk: PerkId): { host: PerkId; guest: PerkId } {
  const host = primaryPerk;
  const guest: PerkId =
    primaryPerk === 'SCOUT'
      ? 'SPY'
      : primaryPerk === 'SPY'
        ? 'SCOUT'
        : primaryPerk === 'FREEZE'
          ? 'SHIELD'
          : 'SCOUT';
  return { host, guest };
}
