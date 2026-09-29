import { Id } from '../../convex/_generated/dataModel';

export type BankQuestionType = 'mcq' | 'tf';
export type BankQuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface BankQuestionOption {
  id: string; // "a" | "b" | "c" | "d" or "true" | "false"
  text: {
    en: string;
    ar: string;
  };
}

export interface BankQuestion {
  _id: Id<'bankQuestions'>;
  question: {
    en: string;
    ar: string;
  };
  options: BankQuestionOption[];
  correctId?: string; // stripped when sent to client
  type: BankQuestionType;
  category?: string;
  difficulty: BankQuestionDifficulty;
  isActive?: boolean;
}

export interface BankAction {
  type: 'correct' | 'wrong' | 'bank' | 'pass';
  questionId: Id<'bankQuestions'>;
  selectedOptionId?: string;
  correctOptionId: string;
  pointsEarned: number;
  newStreak: number;
  newBankedTotal: number;
  timestamp: number;
}

export interface BankParticipant {
  guestId: Id<'guestUsers'>;
  name: string;
  avatarSeed: string;
  totalBankedScore: number;
  roundScores: number[];
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  totalTimeUsedMs: number;
  highestStreak: number;
  lastPingAt: number;
}

export interface SuddenDeathState {
  pairIndex: number; // 1, 2, 3
  questionIds: Id<'bankQuestions'>[];
  player1Correct?: boolean;
  player2Correct?: boolean;
}

export type BankGameMode = 'solo' | 'duel_private' | 'duel_public';
export type BankGameStatus =
  | 'waiting'
  | 'in_progress'
  | 'round_break'
  | 'sudden_death'
  | 'completed'
  | 'abandoned';

export interface BankGameSession {
  _id: Id<'bankGames'>;
  code: string;
  mode: BankGameMode;
  player1Id: Id<'guestUsers'>;
  player2Id?: Id<'guestUsers'>;
  status: BankGameStatus;
  roundCount: number; // 2
  currentRound: number; // 1 or 2
  activeTurnPlayerIndex: number; // 0 or 1
  runStartedAt?: number;
  runDeadline?: number; // 90s authoritative server timestamp
  suddenDeathDeadline?: number; // 15s authoritative server timestamp
  turnQuestionIds: Id<'bankQuestions'>[];
  currentQuestionIndex: number; // 0 to 11
  currentStreak: number; // 0, 1, 2...
  unbankedPoints: number; // 0, 1, 2, 4, 8, 16...
  lastAction?: BankAction;
  participants: BankParticipant[];
  suddenDeathState?: SuddenDeathState;
  winnerId?: Id<'guestUsers'>;
  isDraw?: boolean;
  abandonedBy?: Id<'guestUsers'>;
  createdAt: number;
  completedAt?: number;
  rematchGameId?: Id<'bankGames'>;
}

/**
 * Exponential Uncapped Ladder Calculation
 * Streak 1: 1
 * Streak 2: 2
 * Streak 3: 4
 * Streak 4: 8
 * Streak 5: 16
 * Streak 6: 32
 * ... 2^(streak - 1)
 */
export function calculateLadderPoints(streak: number): number {
  if (streak <= 0) return 0;
  return Math.pow(2, streak - 1);
}

export type BankScoreTier = 'bronze' | 'silver' | 'gold' | 'legend';

export interface BankTierInfo {
  tier: BankScoreTier;
  label: { en: string; ar: string };
  minScore: number;
  color: string;
  icon: string;
}

export const BANK_TIERS: BankTierInfo[] = [
  {
    tier: 'legend',
    label: { en: 'Legendary', ar: 'الأسطوري' },
    minScore: 256,
    color: '#F5D77F', // Championship Gold Sheen
    icon: 'Crown',
  },
  {
    tier: 'gold',
    label: { en: 'Gold', ar: 'الذهبي' },
    minScore: 64,
    color: '#E5B842', // Signature Gold
    icon: 'Trophy',
  },
  {
    tier: 'silver',
    label: { en: 'Silver', ar: 'الفضي' },
    minScore: 16,
    color: '#E2E8F0', // Polished Silver
    icon: 'Medal',
  },
  {
    tier: 'bronze',
    label: { en: 'Bronze', ar: 'البرونزي' },
    minScore: 0,
    color: '#9da4b4', // Brushed Steel
    icon: 'Shield',
  },
];

export function getScoreTier(score: number): BankTierInfo {
  return BANK_TIERS.find((t) => score >= t.minScore) ?? BANK_TIERS[BANK_TIERS.length - 1];
}
