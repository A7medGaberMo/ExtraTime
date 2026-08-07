import { mutation } from "../_generated/server";
import { v } from "convex/values";

const statItemArg = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  apiId: v.optional(v.string()),
  season: v.optional(v.string()),
  squad: v.string(),
  competition: v.string(),
  matchesPlayed: v.number(),
  starts: v.optional(v.number()),
  minutesPlayed: v.number(),
  goals: v.number(),
  assists: v.number(),
  yellowCards: v.optional(v.number()),
  redCards: v.optional(v.number()),
  goalsPer90: v.optional(v.number()),
  assistsPer90: v.optional(v.number()),
  gPlusAPer90: v.optional(v.number()),
  cleanSheets: v.optional(v.number()),
  goalsConceded: v.optional(v.number()),
  saves: v.optional(v.number()),
  recordType: v.union(
    v.literal("SEASONAL"),
    v.literal("PER_CLUB"),
    v.literal("PER_COMPETITION"),
    v.literal("CAREER_TOTAL")
  ),
});

const transferItemArg = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  apiId: v.optional(v.string()),
  season: v.optional(v.string()),
  transferDate: v.string(),
  ageAtTransfer: v.optional(v.number()),
  fromClub: v.string(),
  toClub: v.string(),
  fromLeague: v.optional(v.string()),
  toLeague: v.optional(v.string()),
  feeEuros: v.number(),
  feeFormatted: v.string(),
  marketValueEuros: v.optional(v.number()),
  feeType: v.union(
    v.literal("TRANSFER"),
    v.literal("FREE"),
    v.literal("LOAN"),
    v.literal("YOUTH_PROMOTION")
  ),
  notes: v.optional(v.string()),
});

export const seedStatsAndTransfersBatch = mutation({
  args: {
    stats: v.array(statItemArg),
    transfers: v.array(transferItemArg),
  },
  handler: async (ctx, args) => {
    let insertedStats = 0;
    for (const s of args.stats) {
      const minutes = s.minutesPlayed || (s.matchesPlayed * 90);
      const goalsPer90 = minutes > 0 ? Number(((s.goals / minutes) * 90).toFixed(2)) : 0;
      const assistsPer90 = minutes > 0 ? Number(((s.assists / minutes) * 90).toFixed(2)) : 0;
      const gPlusAPer90 = Number((goalsPer90 + assistsPer90).toFixed(2));

      await ctx.db.insert("careerStats", {
        playerId: s.playerId,
        playerName: s.playerName,
        apiId: s.apiId,
        season: s.season,
        squad: s.squad,
        competition: s.competition,
        matchesPlayed: s.matchesPlayed,
        starts: s.starts,
        minutesPlayed: minutes,
        goals: s.goals,
        assists: s.assists,
        yellowCards: s.yellowCards ?? 0,
        redCards: s.redCards ?? 0,
        goalsPer90: s.goalsPer90 ?? goalsPer90,
        assistsPer90: s.assistsPer90 ?? assistsPer90,
        gPlusAPer90: s.gPlusAPer90 ?? gPlusAPer90,
        cleanSheets: s.cleanSheets,
        goalsConceded: s.goalsConceded,
        saves: s.saves,
        recordType: s.recordType,
      });
      insertedStats++;
    }

    let insertedTransfers = 0;
    for (const t of args.transfers) {
      await ctx.db.insert("playerTransfers", {
        playerId: t.playerId,
        playerName: t.playerName,
        season: t.season,
        transferDate: t.transferDate,
        ageAtTransfer: t.ageAtTransfer,
        fromClub: t.fromClub,
        toClub: t.toClub,
        fromLeague: t.fromLeague,
        toLeague: t.toLeague,
        feeEuros: t.feeEuros,
        feeFormatted: t.feeFormatted,
        marketValueEuros: t.marketValueEuros,
        feeType: t.feeType,
        notes: t.notes,
      });
      insertedTransfers++;
    }

    return {
      success: true,
      statsInserted: insertedStats,
      transfersInserted: insertedTransfers,
    };
  },
});
