import { mutation } from "../_generated/server";
import { v } from "convex/values";



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
    transfers: v.array(transferItemArg),
  },
  handler: async (ctx, args) => {

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
      transfersInserted: insertedTransfers,
    };
  },
});
