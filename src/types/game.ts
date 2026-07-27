/**
 * Game type identifiers.
 * Only 'hidden_bid' is implemented now.
 * Future games are added as new union members without modifying existing code.
 */
export type GameType = 'hidden_bid';

/** Base configuration for any game mode */
export interface GameConfig {
  type: GameType;
  label: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  /** Whether the game is currently available to play */
  isAvailable: boolean;
}

/** Registry of all game configurations */
export const GAME_REGISTRY: Record<GameType, GameConfig> = {
  hidden_bid: {
    type: 'hidden_bid',
    label: 'Hidden Bid',
    description: 'Outbid your opponent in a blind auction to build the best squad.',
    minPlayers: 2,
    maxPlayers: 2,
    isAvailable: true,
  },
  // TODO: Future games — add entries here without modifying existing code
  // guess_the_player: { ... },
  // formation_challenge: { ... },
};
