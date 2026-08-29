import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const gameResultsTable = defineTable({
  gameType: v.union(v.literal('snipe'), v.literal('rank')),
  context: v.union(v.literal('casual'), v.literal('league')),
  leagueId: v.optional(v.id('leagues')),
  player1UserId: v.optional(v.id('users')),    // Signed-in user 1
  player2UserId: v.optional(v.id('users')),    // Signed-in user 2
  player1GuestId: v.id('guestUsers'),          // Runtime guest ID 1
  player2GuestId: v.optional(v.id('guestUsers')),// Runtime guest ID 2
  player1Score: v.number(),
  player2Score: v.optional(v.number()),
  winnerUserId: v.optional(v.id('users')),     // Winner user ID if signed in
  isDraw: v.boolean(),
  summary: v.optional(v.string()),             // e.g. "3 - 1" or "84 pts"
  completedAt: v.number(),
})
  .index('by_player1_completed', ['player1UserId', 'completedAt'])
  .index('by_player2_completed', ['player2UserId', 'completedAt'])
  .index('by_league', ['leagueId'])
  .index('by_gameType', ['gameType', 'completedAt']);
