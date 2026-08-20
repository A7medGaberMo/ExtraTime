import type {
  IMatchSimulatorStrategy,
  MatchSimulationResult,
  GameType,
} from '@/core/simulation/simulation.interface';
import type { PlayerCardData } from '@/types/player';
import {
  simulateTacticalMatch,
  type SimMatchResult,
  type SimPlayer,
} from '@/core/simulation/match-simulator';

function toSimPlayer(card: PlayerCardData): SimPlayer {
  return {
    id: card.id,
    name: card.name,
    tier: card.tier,
    position: card.position,
    club: card.club,
    nation: card.nation,
  };
}

/** Adapter: pure engine result → Universal Score Hub contract (no unsafe casts). */
function toMatchSimulationResult(result: SimMatchResult): MatchSimulationResult {
  return {
    matchId: result.matchId,
    roomId: result.roomId,
    gameType: result.gameType,
    seed: result.seed,
    score: result.score,
    winnerId: result.winnerId,
    isShootout: result.isShootout,
    shootoutScore: result.shootoutScore,
    sectors: result.sectors,
    synergy: result.synergy,
    timeline: result.timeline,
    playerRatings: result.playerRatings,
    generatedAt: result.generatedAt,
  };
}

/**
 * Deterministic Tactical Match Simulator strategy (`hidden_bid`).
 *
 * Runs the shared pure engine (identical code the Convex backend executes).
 * Outcome rolls are seeded from the room seed — the server-persisted result
 * is authoritative; this strategy is for typed client composition only.
 */
export class TacticalMatchSimulatorStrategy implements IMatchSimulatorStrategy {
  readonly gameType: GameType = 'hidden_bid';

  simulateMatch(
    roomId: string,
    hostSquad: PlayerCardData[],
    guestSquad: PlayerCardData[],
    hostBudget: number,
    guestBudget: number,
    seed: string,
  ): MatchSimulationResult {
    const result = simulateTacticalMatch(
      roomId,
      hostSquad.map(toSimPlayer),
      guestSquad.map(toSimPlayer),
      hostBudget,
      guestBudget,
      seed,
      { gameType: 'hidden_bid' },
    );
    return toMatchSimulationResult(result);
  }
}
