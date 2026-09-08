import type { SimTier } from '@/core/simulation/match-simulator';

export type DraftGameMode = 'solo' | 'duel_private' | 'duel_public';

export type DraftSoloChallengeType = string;

export type DraftStatus =
  | 'waiting'
  | 'formation'
  | 'drafting'
  | 'swapping'
  | 'showdown'
  | 'completed'
  | 'abandoned';

export interface EnrichedPlayerCard {
  id: string;
  name: string;
  position: string;
  tier: SimTier | string;
  rating?: number;
  imageUrl?: string;
  isLegend?: boolean;
  clubName: string;
  clubLogo: string;
  league: string;
  nationName: string;
  nationFlag: string;
}

export interface EnrichedStarterSlot {
  slotIndex: number;
  position: string;
  isCaptain?: boolean;
  chemistry?: number;
  playerId?: string;
  player: EnrichedPlayerCard | null;
}

export interface EnrichedBenchSlot {
  benchIndex: number;
  playerId?: string;
  player: EnrichedPlayerCard | null;
}

export interface EnrichedDraftParticipant {
  guestId: string;
  name: string;
  avatarSeed: string;
  formation?: string;
  formationOptions?: string[];
  currentSlotIndex: number;
  targetSlotIndex?: number;
  turnExpiresAt?: number;
  startingXI: EnrichedStarterSlot[];
  bench: EnrichedBenchSlot[];
  currentCandidates: EnrichedPlayerCard[];
  squadRating: number;
  chemistryScore: number;
  totalDraftScore: number;
  isReady: boolean;
  isDisconnected?: boolean;
}

export interface DraftTimelineEvent {
  id: string;
  minute: number;
  type: string;
  team: 'host' | 'guest';
  playerName?: string;
  playerTier?: string;
  assistName?: string;
  description: string;
  scoreSnapshot: { host: number; guest: number };
}

export interface DraftShowdownResult {
  score: { host: number; guest: number };
  winnerId?: string;
  isShootout: boolean;
  shootoutScore?: { host: number; guest: number };
  sectors: {
    host: { attack: number; midfield: number; defense: number; totalRating: number };
    guest: { attack: number; midfield: number; defense: number; totalRating: number };
  };
  timeline: DraftTimelineEvent[];
  simulatedAt: number;
}

export interface DraftGameDocument {
  _id: string;
  code: string;
  mode: DraftGameMode;
  challengeType?: DraftSoloChallengeType;
  isPublic?: boolean;
  status: DraftStatus;
  participants: EnrichedDraftParticipant[];
  showdownResult?: DraftShowdownResult;
  winnerId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface DraftFormationInfo {
  label: string;
  positions: string[];
  description: string;
}

export const DRAFT_FORMATIONS: Record<string, DraftFormationInfo> = {
  '4-3-3': {
    label: '4-3-3 Attack',
    positions: ['ST', 'LW', 'RW', 'CAM', 'CM', 'CM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'High-octane wing play with dangerous dynamic cutbacks and midfield triangle.',
  },
  '4-2-3-1': {
    label: '4-2-3-1 Balanced',
    positions: ['ST', 'CAM', 'LM', 'RM', 'CDM', 'CDM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Rock-solid double pivot tactical control with creative playmaker freedom.',
  },
  '4-4-2': {
    label: '4-4-2 Flat',
    positions: ['ST', 'CF', 'LM', 'RM', 'CM', 'CM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Timeless twin-striker balance with disciplined flanks and box-to-box dominance.',
  },
  '3-5-2': {
    label: '3-5-2 Wingback',
    positions: ['ST', 'ST', 'CAM', 'LM', 'RM', 'CDM', 'CM', 'CB', 'CB', 'CB', 'GK'],
    description: 'Overload the midfield with aggressive wide transitions and triple central defense.',
  },
  '4-1-2-1-2': {
    label: '4-1-2-1-2 Diamond',
    positions: ['ST', 'CF', 'CAM', 'CM', 'CM', 'CDM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Narrow diamond dominance through central tiki-taka and dynamic fullbacks.',
  },
};

export const FORMATION_KEYS = Object.keys(DRAFT_FORMATIONS);

export function getFormationSlots(formationKey: string): string[] {
  return DRAFT_FORMATIONS[formationKey]?.positions ?? DRAFT_FORMATIONS['4-3-3'].positions;
}
