import type { IGameEngineStrategy, PlayerBid, RoundResult, GameState } from '@/core/engine/game-engine.interface';
import { GAME_REGISTRY, type GameType } from '@/types/game';

export class HiddenBidEngine implements IGameEngineStrategy {
  readonly type: GameType = 'hidden_bid';
  readonly metadata = GAME_REGISTRY.hidden_bid;

  calculateRoundWinner(bids: PlayerBid[]): RoundResult {
    if (bids.length === 0) {
      return { winnerId: null, isTie: false, winningBid: 0 };
    }

    if (bids.length === 1) {
      return {
        winnerId: bids[0].guestId,
        isTie: false,
        winningBid: bids[0].amount,
      };
    }

    const sorted = [...bids].sort((a, b) => b.amount - a.amount);
    const topBid = sorted[0];
    const runnerUp = sorted[1];

    if (topBid.amount === runnerUp.amount) {
      // Tie breaker based on earlier timestamp
      const tieWinner = topBid.timestamp <= runnerUp.timestamp ? topBid : runnerUp;
      return {
        winnerId: tieWinner.guestId,
        isTie: true,
        winningBid: tieWinner.amount,
        losingBid: runnerUp.amount,
      };
    }

    return {
      winnerId: topBid.guestId,
      isTie: false,
      winningBid: topBid.amount,
      losingBid: runnerUp.amount,
    };
  }

  isGameComplete(state: GameState): boolean {
    return state.currentRound > state.totalRounds || state.status === 'COMPLETED';
  }
}
