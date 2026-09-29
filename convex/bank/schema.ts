import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const bankQuestionsTable = defineTable({
  question: v.object({
    en: v.string(),
    ar: v.string(),
  }),
  options: v.array(
    v.object({
      id: v.string(), // "a", "b", "c", "d" or "true", "false"
      text: v.object({
        en: v.string(),
        ar: v.string(),
      }),
    })
  ),
  correctId: v.string(), // matches option id
  type: v.union(v.literal('mcq'), v.literal('tf')),
  category: v.optional(v.string()),
  difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
  isActive: v.boolean(),
  randomKey: v.optional(v.number()),
})
  .index('by_active', ['isActive'])
  .index('by_active_random', ['isActive', 'randomKey'])
  .index('by_difficulty_type', ['isActive', 'difficulty', 'type'])
  .index('by_difficulty_type_random', ['isActive', 'difficulty', 'type', 'randomKey']);

export const guestQuestionHistoryTable = defineTable({
  guestId: v.id('guestUsers'),
  bankSeenIds: v.array(v.id('bankQuestions')),
  rankSeenIds: v.array(v.id('rankQuestions')),
})
  .index('by_guest', ['guestId']);

export const bankParticipantValidator = v.object({
  guestId: v.id('guestUsers'),
  name: v.string(),
  avatarSeed: v.string(),
  totalBankedScore: v.number(),
  roundScores: v.array(v.number()),
  totalCorrectAnswers: v.number(),
  totalQuestionsAnswered: v.number(),
  totalTimeUsedMs: v.number(),
  highestStreak: v.number(),
  lastPingAt: v.number(),
});

export const bankActionValidator = v.object({
  type: v.union(v.literal('correct'), v.literal('wrong'), v.literal('bank'), v.literal('pass')),
  questionId: v.id('bankQuestions'),
  selectedOptionId: v.optional(v.string()),
  correctOptionId: v.string(),
  pointsEarned: v.number(),
  newStreak: v.number(),
  newBankedTotal: v.number(),
  timestamp: v.number(),
});

export const suddenDeathValidator = v.object({
  pairIndex: v.number(), // 1, 2, 3
  questionIds: v.array(v.id('bankQuestions')),
  player1Correct: v.optional(v.boolean()),
  player2Correct: v.optional(v.boolean()),
});

export const bankGamesTable = defineTable({
  code: v.string(), // 6-char room code
  mode: v.union(v.literal('solo'), v.literal('duel_private'), v.literal('duel_public')),
  player1Id: v.id('guestUsers'),
  player2Id: v.optional(v.id('guestUsers')),
  status: v.union(
    v.literal('waiting'),
    v.literal('in_progress'),
    v.literal('round_break'),
    v.literal('sudden_death'),
    v.literal('completed'),
    v.literal('abandoned')
  ),
  roundCount: v.number(), // 2 rounds
  currentRound: v.number(), // 1 or 2
  activeTurnPlayerIndex: v.number(), // 0 or 1
  runStartedAt: v.optional(v.number()),
  runDeadline: v.optional(v.number()), // 90s authoritative server timestamp
  suddenDeathDeadline: v.optional(v.number()), // 15s authoritative server timestamp
  turnQuestionIds: v.array(v.id('bankQuestions')), // 12 questions allocated for active turn
  duelQuestionRuns: v.optional(v.array(v.array(v.id('bankQuestions')))), // 4 pre-allocated runs for 1v1
  currentQuestionIndex: v.number(), // 0 to 11
  currentStreak: v.number(), // 0, 1, 2...
  unbankedPoints: v.number(), // 0, 1, 2, 4, 8, 16...
  lastAction: v.optional(bankActionValidator),
  participants: v.array(bankParticipantValidator),
  suddenDeathState: v.optional(suddenDeathValidator),
  winnerId: v.optional(v.id('guestUsers')),
  isDraw: v.optional(v.boolean()),
  abandonedBy: v.optional(v.id('guestUsers')),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  rematchGameId: v.optional(v.id('bankGames')),
})
  .index('by_code', ['code'])
  .index('by_status', ['status'])
  .index('by_player1', ['player1Id'])
  .index('by_player2', ['player2Id'])
  .index('by_public_waiting', ['mode', 'status']);
