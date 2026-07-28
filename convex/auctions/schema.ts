import { defineTable } from "convex/server";
import { v } from "convex/values";

export const auctionsTable = defineTable({
  roomId: v.id("rooms"),
  formation: v.string(),
  matchSize: v.union(v.literal(5), v.literal(11)),
  startingBudget: v.number(),
  poolMode: v.union(v.literal("GLOBAL"), v.literal("EPL"), v.literal("ICONS")),
  rounds: v.array(
    v.object({
      roundNumber: v.number(),
      position: v.string(),
      mainPlayerId: v.id("players"),
      subPlayerId: v.id("players"),
      isMysteryRound: v.optional(v.boolean()),
    })
  ),
  currentRound: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed")
  ),
  currentBidding: v.object({
    highestBid: v.number(),
    highestBidderId: v.optional(v.id("guestUsers")),
    activeTurnUserId: v.union(v.id("guestUsers"), v.string()),
    turnExpiresAt: v.number(),
  }),
  host: v.object({
    userId: v.id("guestUsers"),
    budget: v.number(),
    perk: v.union(v.literal("SCOUT"), v.literal("SPY")),
    perkUsed: v.boolean(),
    squad: v.array(
      v.object({
        position: v.string(),
        playerId: v.id("players"),
        isSub: v.boolean(),
        cost: v.number(),
      })
    ),
  }),
  guest: v.optional(
    v.object({
      userId: v.id("guestUsers"),
      budget: v.number(),
      perk: v.union(v.literal("SCOUT"), v.literal("SPY")),
      perkUsed: v.boolean(),
      squad: v.array(
        v.object({
          position: v.string(),
          playerId: v.id("players"),
          isSub: v.boolean(),
          cost: v.number(),
        })
      ),
    })
  ),
  createdAt: v.number(),
}).index("by_room", ["roomId"]);
