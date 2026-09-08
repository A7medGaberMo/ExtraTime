import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const draftStarterSlotValidator = v.object({
  slotIndex: v.number(), // 0 to 10
  position: v.string(), // e.g. "GK", "CB", "ST", "LW"
  playerId: v.optional(v.id('players')),
  isCaptain: v.optional(v.boolean()),
  chemistry: v.optional(v.number()), // 0 to 3 pips
});

export const draftBenchSlotValidator = v.object({
  benchIndex: v.number(), // 0 to 2
  playerId: v.optional(v.id('players')),
});

export const draftCandidateCardValidator = v.object({
  playerId: v.id('players'),
  name: v.string(),
  position: v.string(),
  tier: v.string(),
  clubId: v.id('clubs'),
  nationId: v.id('nations'),
  clubName: v.string(),
  league: v.string(),
  nationName: v.string(),
  rating: v.number(),
  imageUrl: v.optional(v.string()),
  isLegend: v.boolean(),
  chemGain: v.optional(v.number()), // Preview chemistry gain if chosen
});

export const draftParticipantValidator = v.object({
  guestId: v.id('guestUsers'),
  name: v.string(),
  avatarSeed: v.string(),
  formation: v.optional(v.string()),
  formationOptions: v.optional(v.array(v.string())), // 5 tactical choices
  currentSlotIndex: v.number(), // 0: Captain, 1..10: Starters, 11..13: Bench, 14: Swapping
  currentCandidateIds: v.array(v.id('players')), // 5 card candidates
  targetSlotIndex: v.optional(v.number()), // Chosen starter slot for free position selection
  turnExpiresAt: v.optional(v.number()), // 15-sec shot clock
  startingXI: v.array(draftStarterSlotValidator), // 11 slots
  bench: v.array(draftBenchSlotValidator), // 3 super-subs
  squadRating: v.number(), // 0 to 99
  chemistryScore: v.number(), // 0 to 33
  totalDraftScore: v.number(), // squadRating + chemistryScore
  isReady: v.boolean(),
  isDisconnected: v.optional(v.boolean()),
});

export const draftTimelineEventValidator = v.object({
  id: v.string(),
  minute: v.number(),
  type: v.string(),
  team: v.union(v.literal('host'), v.literal('guest')),
  playerName: v.optional(v.string()),
  playerTier: v.optional(v.string()),
  assistName: v.optional(v.string()),
  description: v.string(),
  scoreSnapshot: v.object({ host: v.number(), guest: v.number() }),
});

export const draftShowdownResultValidator = v.object({
  score: v.object({ host: v.number(), guest: v.number() }),
  winnerId: v.optional(v.id('guestUsers')),
  isShootout: v.boolean(),
  shootoutScore: v.optional(v.object({ host: v.number(), guest: v.number() })),
  sectors: v.object({
    host: v.object({ attack: v.number(), midfield: v.number(), defense: v.number(), totalRating: v.number() }),
    guest: v.object({ attack: v.number(), midfield: v.number(), defense: v.number(), totalRating: v.number() }),
  }),
  timeline: v.array(draftTimelineEventValidator),
  simulatedAt: v.number(),
});

export const draftChallengeRequirementValidator = v.object({
  id: v.string(),
  label: v.string(),
  target: v.string(),
  actual: v.string(),
  met: v.boolean(),
});

export const draftChallengeEvaluationValidator = v.object({
  passed: v.boolean(),
  challengeId: v.string(),
  title: v.string(),
  requirements: v.array(draftChallengeRequirementValidator),
  rewardXp: v.number(),
  completedAt: v.number(),
});

export const draftGamesTable = defineTable({
  code: v.string(), // 6-character room code, e.g. "DF7K9A"
  mode: v.union(
    v.literal('solo'),
    v.literal('duel_private'),
    v.literal('duel_public'),
  ),
  challengeType: v.optional(v.string()),
  challengeEvaluation: v.optional(draftChallengeEvaluationValidator),
  isPublic: v.optional(v.boolean()),
  status: v.union(
    v.literal('waiting'),
    v.literal('formation'),
    v.literal('drafting'),
    v.literal('swapping'),
    v.literal('showdown'),
    v.literal('completed'),
    v.literal('abandoned'),
  ),
  participants: v.array(draftParticipantValidator),
  showdownResult: v.optional(draftShowdownResultValidator),
  winnerId: v.optional(v.id('guestUsers')),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index('by_code', ['code'])
  .index('by_status', ['status'])
  .index('by_public_status', ['isPublic', 'status', 'mode']);
