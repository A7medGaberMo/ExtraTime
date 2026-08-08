import type { PlayerCardData } from '@/types/player';

export type GameType =
  | 'hidden_bid'
  | 'squad_draft'
  | 'pack_opening_duel'
  | 'penalty_shootout';

export type TimelineEventType =
  | 'KICKOFF'
  | 'GOAL'
  | 'SAVE'
  | 'CROSSBAR'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'PENALTY_SHOOTOUT';

export interface MatchTimelineEvent {
  id: string;
  minute: number; // 0 to 90 (+ Extra Time / PKs)
  type: TimelineEventType;
  team: 'host' | 'guest';
  player?: {
    id: string;
    name: string;
    tier: string;
    position: string;
  };
  assistPlayer?: {
    id: string;
    name: string;
  };
  description: string;
  scoreSnapshot: { host: number; guest: number };
}

export interface PlayerPerformanceRating {
  playerId: string;
  name: string;
  position: string;
  tier: string;
  isSub: boolean;
  rating: number; // 6.0 - 10.0 scale
  goals: number;
  assists: number;
  saves?: number;
}

export interface SectorAnalysis {
  attack: number;
  midfield: number;
  defense: number;
  totalRating: number;
}

export interface SynergyBreakdown {
  clubChemLinks: number;
  clubChemPoints: number;
  nationChemLinks: number;
  nationChemPoints: number;
  budgetBonusPoints: number;
  totalSynergyPoints: number;
}

export interface MatchSimulationResult {
  matchId: string;
  roomId: string;
  gameType: GameType;
  seed: string;
  score: {
    host: number;
    guest: number;
  };
  winnerId: string | null; // null if draw
  isShootout: boolean;
  shootoutScore?: { host: number; guest: number };
  sectors: {
    host: SectorAnalysis;
    guest: SectorAnalysis;
  };
  synergy: {
    host: SynergyBreakdown;
    guest: SynergyBreakdown;
  };
  timeline: MatchTimelineEvent[];
  playerRatings: {
    host: PlayerPerformanceRating[];
    guest: PlayerPerformanceRating[];
  };
  generatedAt: number;
}

export interface IMatchSimulatorStrategy {
  readonly gameType: GameType;
  simulateMatch(
    roomId: string,
    hostSquad: PlayerCardData[],
    guestSquad: PlayerCardData[],
    hostBudget: number,
    guestBudget: number,
    seed: string
  ): MatchSimulationResult;
}