import type { GameType, GameConfig } from '@/types/game';

export interface RoomCreationOptions {
  roomName?: string;
  gameType: GameType;
  primaryPerk?: string;
  hostNickname: string;
  hostAvatarSeed: string;
}

export interface PlayerBid {
  guestId: string;
  amount: number;
  perkUsed?: string;
  timestamp: number;
}

export interface RoundResult {
  winnerId: string | null;
  isTie: boolean;
  winningBid: number;
  losingBid?: number;
  playerAwardedId?: string;
}

export interface GameState {
  roomId: string;
  status: 'LOBBY' | 'IN_AUCTION' | 'COMPLETED';
  currentRound: number;
  totalRounds: number;
  isFinished: boolean;
}

export interface IGameEngineStrategy {
  readonly type: GameType;
  readonly metadata: GameConfig;
  calculateRoundWinner(bids: PlayerBid[]): RoundResult;
  isGameComplete(state: GameState): boolean;
}
