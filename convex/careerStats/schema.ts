import { defineTable } from "convex/server";
import { v } from "convex/values";

export const careerStatsTable = defineTable({
  playerId: v.id("players"),
  playerName: v.string(),
  apiId: v.optional(v.string()),

  // Season & Meta
  season: v.string(), // e.g. "1998-1999" or "CAREER_SUMMARY"
  age: v.optional(v.number()), // e.g. 22
  squad: v.string(), // e.g. "Barcelona", "Bayern Munich"
  country: v.optional(v.string()), // e.g. "es ESP", "de GER"
  competition: v.string(), // e.g. "1. La Liga", "1. Bundesliga"
  lgRank: v.optional(v.string()), // e.g. "1st", "2nd"

  // Playing Time
  matchesPlayed: v.number(), // MP
  starts: v.number(), // Starts
  minutesPlayed: v.number(), // Min
  ninetys: v.optional(v.number()), // 90s played (e.g. 32.1)

  // Outfield Performance
  goals: v.number(), // Gls
  assists: v.number(), // Ast
  goalsAndAssists: v.optional(v.number()), // G+A
  nonPenaltyGoals: v.optional(v.number()), // G-PK
  penaltiesScored: v.optional(v.number()), // PK
  penaltiesAttempted: v.optional(v.number()), // PKatt
  yellowCards: v.optional(v.number()), // CrdY
  redCards: v.optional(v.number()), // CrdR

  // Outfield Per-90 Metrics
  goalsPer90: v.optional(v.number()),
  assistsPer90: v.optional(v.number()),
  gPlusAPer90: v.optional(v.number()),
  nonPenaltyGlsPer90: v.optional(v.number()),

  // Goalkeeper Specific Stats
  goalsAgainst: v.optional(v.number()), // GA
  gaPer90: v.optional(v.number()), // GA90
  shotsOnTargetAgainst: v.optional(v.number()), // SoTA
  saves: v.optional(v.number()),
  savePercentage: v.optional(v.number()), // Save%
  wins: v.optional(v.number()), // W
  draws: v.optional(v.number()), // D
  losses: v.optional(v.number()), // L
  cleanSheets: v.optional(v.number()), // CS
  csPercentage: v.optional(v.number()), // CS%

  // Record Type
  recordType: v.union(
    v.literal("SEASONAL"),
    v.literal("SQUAD_SUMMARY"),
    v.literal("LEAGUE_SUMMARY"),
    v.literal("CAREER_TOTAL")
  ),
})
  .index("by_player", ["playerId"])
  .index("by_player_season", ["playerId", "season"])
  .index("by_season", ["season"])
  .index("by_competition", ["competition"])
  .index("by_squad", ["squad"]);
