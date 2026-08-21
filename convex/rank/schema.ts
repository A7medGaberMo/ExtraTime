import { defineTable } from "convex/server";
import { v } from "convex/values";

// Polymorphic Answer Media (Unified with Convex Players / Clubs / Nations)
export const rankAnswerMediaValidator = v.object({
  type: v.union(
    v.literal("player"),
    v.literal("club"),
    v.literal("nation"),
    v.literal("tournament"),
    v.literal("custom"),
    v.literal("stint")
  ),
  primaryUrl: v.optional(v.string()), // Player headshot / Club crest / Flag
  secondaryBadgeUrl: v.optional(v.string()), // Corner crest for player stints
  fallbackText: v.optional(v.string()), // 2-letter fallback (e.g. "MU", "CR7")
  entityId: v.optional(v.string()), // ID in players/clubs/nations table
  stintBadge: v.optional(
    v.object({
      clubName: v.string(),
      season: v.optional(v.string()),
    })
  ),
});

// Single Answer Item
export const rankAnswerItemValidator = v.object({
  answerKey: v.string(), // e.g. "ans_manu", "ans_cr7_real"
  name: v.object({ en: v.string(), ar: v.string() }),
  subText: v.optional(v.object({ en: v.string(), ar: v.string() })), // e.g. "Real Madrid (2009–18)"
  media: rankAnswerMediaValidator,
  value: v.number(), // Sortable numeric value
  valueLabel: v.object({ en: v.string(), ar: v.string() }), // e.g. "13 Titles" / "13 لقب"
  correctRank: v.number(), // 1 to 5
});

// Question Table
export const rankQuestionsTable = defineTable({
  slug: v.string(),
  scopeType: v.union(
    v.literal("ALL_TIME"),
    v.literal("PER_SEASON"),
    v.literal("PER_CLUB"),
    v.literal("PER_COMPETITION"),
    v.literal("PLAYER_STINTS"),
    v.literal("TRANSFERS_MARKET")
  ),
  title: v.object({ en: v.string(), ar: v.string() }),
  subtitle: v.optional(v.object({ en: v.string(), ar: v.string() })),
  metricLabel: v.object({ en: v.string(), ar: v.string() }),
  direction: v.union(v.literal("desc"), v.literal("asc")),
  difficulty: v.union(
    v.literal("EASY"),
    v.literal("MEDIUM"),
    v.literal("HARD"),
    v.literal("VERY_HARD")
  ),
  answers: v.array(rankAnswerItemValidator), // Exactly 5 distinct items
  asOfDate: v.string(), // e.g. "2026-08"
  isActive: v.boolean(),
  tags: v.array(v.string()),
  createdAt: v.number(),
})
  .index("by_active", ["isActive"])
  .index("by_scope", ["isActive", "scopeType"])
  .index("by_difficulty", ["isActive", "difficulty"]);

// Participant State within an Active Game
export const rankParticipantValidator = v.object({
  guestId: v.id("guestUsers"),
  name: v.string(),
  avatarSeed: v.string(),
  totalScore: v.number(),
  roundScores: v.array(v.number()), // e.g. [6, -2, 8]
  hasSubmittedCurrentRound: v.boolean(),
  submittedOrder: v.optional(v.array(v.string())), // Answer keys in submitted order
  submittedAt: v.optional(v.number()),
  secondsRemainingOnSubmit: v.optional(v.number()),
  isDisconnected: v.optional(v.boolean()),
});

// Game Session Table
export const rankGamesTable = defineTable({
  code: v.string(), // "RNK-8921"
  mode: v.union(
    v.literal("solo"),
    v.literal("duel_private"),
    v.literal("duel_public")
  ),
  isPublic: v.optional(v.boolean()),
  status: v.union(
    v.literal("waiting"),
    v.literal("round_active"),
    v.literal("round_reveal"),
    v.literal("completed"),
    v.literal("abandoned")
  ),
  roundCount: v.union(v.literal(3), v.literal(5)),
  currentRoundIndex: v.number(), // 0 to 4
  questionIds: v.array(v.id("rankQuestions")),

  // Authoritative Round Timer
  roundStartedAt: v.optional(v.number()),
  roundDeadline: v.optional(v.number()), // roundStartedAt + 45000ms

  participants: v.array(rankParticipantValidator),

  // Round History Ledger for Instant Reveal & Post-Game Analysis
  roundHistory: v.array(
    v.object({
      roundIndex: v.number(),
      questionId: v.id("rankQuestions"),
      resolvedOrder: v.array(v.string()), // Correct answer keys [1..5]
      results: v.array(
        v.object({
          guestId: v.id("guestUsers"),
          submittedOrder: v.array(v.string()),
          roundScore: v.number(),
          secondsRemaining: v.number(),
          cardDeltas: v.array(
            v.object({
              answerKey: v.string(),
              submittedRank: v.number(),
              actualRank: v.number(),
              delta: v.number(),
              points: v.number(),
            })
          ),
        })
      ),
    })
  ),

  winnerId: v.optional(v.id("guestUsers")),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_code", ["code"])
  .index("by_status", ["status"])
  .index("by_public_status", ["isPublic", "status", "mode"]);
