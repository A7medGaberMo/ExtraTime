import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const leaguesTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  kind: v.union(v.literal('public'), v.literal('private')),
  gameScope: v.union(v.literal('both'), v.literal('snipe'), v.literal('rank')),
  inviteCode: v.optional(v.string()),          // 8-char Crockford base32 code for private
  ownerId: v.id('users'),
  maxMembers: v.number(),                      // 50 for public, up to 50 for private
  createdAt: v.number(),
})
  .index('by_kind_scope', ['kind', 'gameScope'])
  .index('by_inviteCode', ['inviteCode'])
  .index('by_owner', ['ownerId']);

export const leagueMembersTable = defineTable({
  leagueId: v.id('leagues'),
  userId: v.id('users'),
  role: v.union(v.literal('owner'), v.literal('member')),
  snipeStats: v.object({
    played: v.number(),
    won: v.number(),
    drawn: v.number(),
    lost: v.number(),
    goalsFor: v.number(),
    goalsAgainst: v.number(),
    goalDiff: v.number(),
    points: v.number(),                        // 3-1-0 points
  }),
  rankStats: v.object({
    played: v.number(),
    won: v.number(),
    drawn: v.number(),
    lost: v.number(),
    scoreFor: v.number(),
    scoreAgainst: v.number(),
    scoreDiff: v.number(),
    totalScore: v.number(),
    points: v.number(),                        // 3-1-0 points
  }),
  combinedPoints: v.number(),                  // snipeStats.points + rankStats.points
  joinedAt: v.number(),
})
  .index('by_league_user', ['leagueId', 'userId'])
  .index('by_league_combined_points', ['leagueId', 'combinedPoints'])
  .index('by_user', ['userId']);

export const leagueMatchesTable = defineTable({
  leagueId: v.id('leagues'),
  gameType: v.union(v.literal('snipe'), v.literal('rank')),
  roomId: v.optional(v.id('rooms')),
  rankGameId: v.optional(v.id('rankGames')),
  hostUserId: v.id('users'),
  guestUserId: v.optional(v.id('users')),      // Optional when created pending
  hostScore: v.optional(v.number()),           // Optional until match completion
  guestScore: v.optional(v.number()),          // Optional until match completion
  winnerUserId: v.optional(v.id('users')),     // Optional until match completion
  isDraw: v.optional(v.boolean()),             // Optional until match completion
  status: v.union(v.literal('pending'), v.literal('completed'), v.literal('abandoned')),
  scoredAt: v.optional(v.number()),            // Idempotency lock
  createdAt: v.number(),
})
  .index('by_league', ['leagueId'])
  .index('by_room', ['roomId'])
  .index('by_rankGame', ['rankGameId']);
