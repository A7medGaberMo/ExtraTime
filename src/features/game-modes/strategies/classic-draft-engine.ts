import type {
  IGameEngineStrategy,
  PlayerBid,
  RoundResult,
  GameState,
} from '@/core/engine/game-engine.interface';
import { GAME_REGISTRY, type GameType } from '@/types/game';

export type DraftPickPhase =
  | 'formation'
  | 'captain'
  | 'starting_xi'
  | 'super_subs'
  | 'swapping'
  | 'showdown'
  | 'completed';

export class ClassicDraftEngine implements IGameEngineStrategy {
  readonly type: GameType = 'classic_draft';
  readonly metadata = GAME_REGISTRY.classic_draft;

  public static readonly TOTAL_PLAYER_PICKS = 14; // 1 Captain + 10 Starters + 3 Super-Subs
  public static readonly PICK_TIMEOUT_SECONDS = 15;

  calculateRoundWinner(bids: PlayerBid[]): RoundResult {
    if (bids.length === 0) {
      return { winnerId: null, isTie: false, winningBid: 0 };
    }
    const sorted = [...bids].sort((a, b) => b.amount - a.amount);
    return {
      winnerId: sorted[0].guestId,
      isTie: sorted.length > 1 && sorted[0].amount === sorted[1].amount,
      winningBid: sorted[0].amount,
      losingBid: sorted[1]?.amount,
    };
  }

  isGameComplete(state: GameState): boolean {
    return state.currentRound > state.totalRounds || state.status === 'COMPLETED' || state.isFinished;
  }

  /**
   * Determine the active draft phase for a given pick index (0 to 14)
   * Pick 0: Captain (Star 1)
   * Pick 1..10: Starting XI (Stars 2..11)
   * Pick 11..13: Super-Sub Bench (Stars 12..14)
   * Pick 14: Swapping & Ready
   */
  getPickPhase(currentSlotIndex: number, formationChosen: boolean): DraftPickPhase {
    if (!formationChosen) return 'formation';
    if (currentSlotIndex === 0) return 'captain';
    if (currentSlotIndex >= 1 && currentSlotIndex <= 10) return 'starting_xi';
    if (currentSlotIndex >= 11 && currentSlotIndex <= 13) return 'super_subs';
    return 'swapping';
  }

  isDraftingFinished(currentSlotIndex: number): boolean {
    return currentSlotIndex >= ClassicDraftEngine.TOTAL_PLAYER_PICKS;
  }
}
