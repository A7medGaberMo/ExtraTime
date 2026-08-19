/**
 * Game type identifiers for parallel game modes.
 */
export type GameType = 'hidden_bid' | 'pack_opening_duel' | 'penalty_shootout';

/** Base configuration for any game mode */
export interface GameConfig {
  type: GameType;
  label: string;
  badgeLabel: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  accentColor: string;
  /** Whether the game is currently available to play */
  isAvailable: boolean;
  /** Path for creating or joining this game type */
  routePrefix: string;
}

/** Registry of all parallel game configurations */
export const GAME_REGISTRY: Record<GameType, GameConfig> = {
  hidden_bid: {
    type: 'hidden_bid',
    label: 'Hidden Bid Auction',
    badgeLabel: '🏆 HIDDEN BID',
    description: 'Outbid your opponent in blind auctions to draft real player cards into your formation.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: 'Swords',
    accentColor: '#95E810',
    isAvailable: true,
    routePrefix: '/auction',
  },
  pack_opening_duel: {
    type: 'pack_opening_duel',
    label: 'Pack Opening Duel',
    badgeLabel: '📦 PACK DUEL',
    description: 'Open real-time database tier packs simultaneously and compare overall squad power.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: 'Package',
    accentColor: '#A855F7',
    isAvailable: true,
    routePrefix: '/packs',
  },
  penalty_shootout: {
    type: 'penalty_shootout',
    label: 'Penalty Shootout Duel',
    badgeLabel: '🎯 SHOOTOUT',
    description: 'High-stakes 5-round tactical penalty shootout with real legendary goalkeepers.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: 'Target',
    accentColor: '#F59E0B',
    isAvailable: false,
    routePrefix: '/shootout',
  },
};

/** Get all available active game modes */
export function getAvailableGames(): GameConfig[] {
  return Object.values(GAME_REGISTRY).filter((g) => g.isAvailable);
}
