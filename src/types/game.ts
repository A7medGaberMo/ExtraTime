/**
 * Game type identifiers for parallel game modes.
 */
export type GameType =
  | 'hidden_bid'
  | 'penalty_shootout'
  | 'classic_draft'
  | 'bank_it';

/** Base configuration for any game mode */
export interface GameConfig {
  type: GameType;
  label: string;
  badgeLabel: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  /** Whether the game is currently available to play */
  isAvailable: boolean;
  /** Path for creating or joining this game type */
  routePrefix: string;
}

/** Registry of all parallel game configurations */
export const GAME_REGISTRY: Record<GameType, GameConfig> = {
  hidden_bid: {
    type: 'hidden_bid',
    label: 'Snipe Auction',
    badgeLabel: '🎯 SNIPE',
    description:
      'Outbid your opponent in secret bid auctions to draft real player cards into your formation.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: 'Crosshair',
    isAvailable: true,
    routePrefix: '/auction',
  },
  penalty_shootout: {
    type: 'penalty_shootout',
    label: 'Penalty Shootout Duel',
    badgeLabel: '🎯 SHOOTOUT',
    description: 'High-stakes 5-round tactical penalty shootout with real legendary goalkeepers.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: 'Target',
    isAvailable: false,
    routePrefix: '/shootout',
  },
  classic_draft: {
    type: 'classic_draft',
    label: 'Extra Draft',
    badgeLabel: '⚡ EXTRA DRAFT',
    description:
      'Pick formations, captain superstars, draft your Starting XI slot-by-slot, and duel squads.',
    minPlayers: 1,
    maxPlayers: 2,
    icon: 'Lightning',
    isAvailable: true,
    routePrefix: '/draft',
  },
  bank_it: {
    type: 'bank_it',
    label: 'Bank It',
    badgeLabel: '🏦 BANK IT',
    description:
      'Double your points streak or bank it before one wrong answer wipes it out. High-stakes football trivia ladder.',
    minPlayers: 1,
    maxPlayers: 2,
    icon: 'Coins',
    isAvailable: true,
    routePrefix: '/bank',
  },
};

/** Get all available active game modes */
export function getAvailableGames(): GameConfig[] {
  return Object.values(GAME_REGISTRY).filter((g) => g.isAvailable);
}
