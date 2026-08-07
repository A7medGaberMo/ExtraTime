import { defineTable } from "convex/server";
import { v } from "convex/values";

export const careerStatsTable = defineTable({
  playerId: v.id("players"),
  playerName: v.string(),
  apiId: v.optional(v.string()),

  // Classification
  season: v.optional(v.string()),
  squad: v.string(),
  competition: v.string(),

  // Standard Performance Stats
  matchesPlayed: v.number(),
  starts: v.optional(v.number()),
  minutesPlayed: v.number(),
  goals: v.number(),
  assists: v.number(),
  yellowCards: v.optional(v.number()),
  redCards: v.optional(v.number()),

  // Per 90 Metrics
  goalsPer90: v.optional(v.number()),
  assistsPer90: v.optional(v.number()),
  gPlusAPer90: v.optional(v.number()),

  // Goalkeeper Specific Stats
  cleanSheets: v.optional(v.number()),
  goalsConceded: v.optional(v.number()),
  saves: v.optional(v.number()),

  // Entry Category
  recordType: v.union(
    v.literal("SEASONAL"),
    v.literal("PER_CLUB"),
    v.literal("PER_COMPETITION"),
    v.literal("CAREER_TOTAL")
  ),
})
  .index("by_player", ["playerId"])
  .index("by_player_type", ["playerId", "recordType"])
  .index("by_record_type", ["recordType"])
  .index("by_season", ["season"])
  .index("by_competition", ["competition"])
  .index("by_squad", ["squad"]);
